/**
 * Quality Gate Manager — 3-Layer Gate Pipeline
 *
 * Port of: aios-core/.aios-core/core/quality-gates/quality-gate-manager.js
 * Adapted for Copy Chief BLACK (copywriting quality gates, not code checks)
 *
 * Layers:
 *   Layer 1: Tool Enforcement — required MCP tools used per phase
 *   Layer 2: Quality Scores — blind_critic >= 8, EST >= 8, black_validation >= 8
 *   Layer 3: Human Review — mecanismo approval, story sign-off
 *
 * Behavior:
 *   - Fail-fast: stops at first failing layer
 *   - Status persistence: ~/.claude/qa-status.json
 *   - Config-driven: reads thresholds from config-resolver
 *
 * Used by:
 *   - validate-gate-prereq.ts (Layer 1)
 *   - phase-advance-gate.ts (Layer 1 + 2)
 *   - tool-enforcement-gate.ts (Layer 2)
 *   - story-complete.ts (Layer 3)
 *
 * @module lib/quality-gate-manager
 * @version 1.0.0
 * @forked aios-core v4.4.6
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { resolveConfig, getRequiredTools, getThreshold } from '../config/config-resolver';
import { evaluateBriefingGate } from './weighted-gates';

const HOME = process.env.HOME || '/tmp';
const STATUS_PATH = join(HOME, '.claude', 'qa-status.json');

// ─── Types ───────────────────────────────────────────────────────────────────

export type GatePhase = 'research' | 'briefing' | 'production' | 'delivery';

export interface LayerResult {
  layer: string;
  pass: boolean;
  status: 'passed' | 'failed' | 'skipped';
  results: CheckResult[];
  duration: number;
}

export interface CheckResult {
  check: string;
  pass: boolean;
  message: string;
  score?: number;
  threshold?: number;
  skipped?: boolean;
  details?: Record<string, unknown>;
}

export interface GateResult {
  pass: boolean;
  status: 'passed' | 'failed' | 'blocked' | 'pending_human_review';
  stoppedAt?: string;
  reason?: string;
  duration: number;
  layers: LayerResult[];
  exitCode: number;
  message: string;
}

export interface QAStatus {
  lastRun: string;
  phase: GatePhase;
  offerPath?: string;
  layer1: LayerResult | null;
  layer2: LayerResult | null;
  layer3: LayerResult | null;
  overall: string;
}

// ─── Tool Name Mapping ───────────────────────────────────────────────────────

const TOOL_MAPPINGS: Record<string, string> = {
  voc_search: 'mcp__copywriting__voc_search',
  firecrawl_agent: 'mcp__firecrawl__firecrawl_agent',
  firecrawl_scrape: 'mcp__firecrawl__firecrawl_scrape',
  firecrawl_search: 'mcp__firecrawl__firecrawl_search',
  browser_navigate: 'mcp__playwright__browser_navigate',
  get_phase_context: 'mcp__copywriting__get_phase_context',
  blind_critic: 'mcp__copywriting__blind_critic',
  emotional_stress_test: 'mcp__copywriting__emotional_stress_test',
  get_meta_ads: 'mcp__fb_ad_library__get_meta_ads',
  get_meta_platform_id: 'mcp__fb_ad_library__get_meta_platform_id',
  analyze_ad_video: 'mcp__fb_ad_library__analyze_ad_video',
  consensus: 'mcp__zen__consensus',
  thinkdeep: 'mcp__zen__thinkdeep',
  layered_review: 'mcp__copywriting__layered_review',
  write_chapter: 'mcp__copywriting__write_chapter',
  black_validation: 'mcp__copywriting__black_validation',
  validate_gate: 'mcp__copywriting__validate_gate',
};

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  mcp__copywriting__voc_search: 'VOC Search',
  mcp__firecrawl__firecrawl_agent: 'Firecrawl Agent',
  mcp__copywriting__get_phase_context: 'Get Phase Context',
  mcp__copywriting__blind_critic: 'Blind Critic',
  mcp__copywriting__emotional_stress_test: 'Emotional Stress Test',
  mcp__copywriting__black_validation: 'BLACK Validation',
  mcp__fb_ad_library__get_meta_ads: 'Meta Ads Library',
  mcp__fb_ad_library__analyze_ad_video: 'Analyze Ad Video',
  mcp__zen__consensus: 'Consensus (Zen)',
};

/**
 * Normalize tool name to full MCP format.
 */
export function normalizeToolName(name: string): string {
  if (name.startsWith('mcp__')) return name;
  return TOOL_MAPPINGS[name] || name;
}

/**
 * Get display name for a tool.
 */
export function getToolDisplayName(name: string): string {
  const normalized = normalizeToolName(name);
  return TOOL_DISPLAY_NAMES[normalized] || name;
}

// ─── Quality Gate Manager ────────────────────────────────────────────────────

export class QualityGateManager {
  private phase: GatePhase;
  private offerPath?: string;
  private results: LayerResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(phase: GatePhase, offerPath?: string) {
    this.phase = phase;
    this.offerPath = offerPath;
  }

  // ─── Layer 1: Tool Enforcement ─────────────────────────────────────────────

  /**
   * Check if required MCP tools have been used for the current phase.
   *
   * @param toolsUsed — Array of tool names that have been used in session
   */
  runLayer1(toolsUsed: string[]): LayerResult {
    const startTime = Date.now();
    const requiredTools = getRequiredTools(this.phase, this.offerPath);
    const results: CheckResult[] = [];

    const normalizedUsed = new Set(toolsUsed.map(normalizeToolName));

    for (const tool of requiredTools) {
      const normalized = normalizeToolName(tool);
      const used = normalizedUsed.has(normalized);

      results.push({
        check: `tool:${tool}`,
        pass: used,
        message: used
          ? `${getToolDisplayName(tool)} — used`
          : `${getToolDisplayName(tool)} — NOT USED (required for ${this.phase})`,
        details: { tool, normalized, phase: this.phase },
      });
    }

    const allPassed = results.every(r => r.pass);
    const duration = Date.now() - startTime;

    const layer: LayerResult = {
      layer: 'Layer 1: Tool Enforcement',
      pass: allPassed,
      status: allPassed ? 'passed' : 'failed',
      results,
      duration,
    };

    this.results.push(layer);
    return layer;
  }

  // ─── Layer 2: Quality Scores ───────────────────────────────────────────────

  /**
   * Check if quality scores meet thresholds.
   *
   * @param scores — Map of tool name to score (e.g. { blind_critic: 8.5, est: 7.1 })
   */
  runLayer2(scores: Record<string, number>): LayerResult {
    const startTime = Date.now();
    const results: CheckResult[] = [];

    // Define checks per phase
    const checksPerPhase: Record<GatePhase, Array<{ tool: string; configKey: string }>> = {
      research: [], // No score checks for research
      briefing: [], // No score checks for briefing
      production: [
        { tool: 'blind_critic', configKey: 'blind_critic' },
        { tool: 'emotional_stress_test', configKey: 'emotional_stress_test' },
      ],
      delivery: [
        { tool: 'black_validation', configKey: 'black_validation' },
      ],
    };

    const checks = checksPerPhase[this.phase] || [];

    for (const check of checks) {
      const threshold = getThreshold(check.configKey, this.offerPath);
      const score = scores[check.tool];
      const hasScore = score !== undefined && score !== null;
      const pass = hasScore && score >= threshold;

      results.push({
        check: `score:${check.tool}`,
        pass,
        score: score || 0,
        threshold,
        message: hasScore
          ? `${check.tool}: ${score}/${threshold} — ${pass ? 'PASS' : 'FAIL'}`
          : `${check.tool}: NO SCORE (threshold: ${threshold})`,
      });
    }

    // If no checks for this phase, auto-pass
    if (checks.length === 0) {
      results.push({
        check: 'phase_scores',
        pass: true,
        message: `No score checks required for ${this.phase} phase`,
        skipped: true,
      });
    }

    const allPassed = results.every(r => r.pass || r.skipped);
    const duration = Date.now() - startTime;

    const layer: LayerResult = {
      layer: 'Layer 2: Quality Scores',
      pass: allPassed,
      status: allPassed ? 'passed' : 'failed',
      results,
      duration,
    };

    this.results.push(layer);
    return layer;
  }

  // ─── Layer 3: Human Review ─────────────────────────────────────────────────

  /**
   * Check if human review requirements are met.
   *
   * @param context — Human review state
   */
  runLayer3(context: {
    mecanismoState?: string;
    storyComplete?: boolean;
    humanApproved?: boolean;
  }): LayerResult {
    const startTime = Date.now();
    const results: CheckResult[] = [];

    // Mecanismo approval (required for production + delivery)
    if (this.phase === 'production' || this.phase === 'delivery') {
      const mecanismoOk = context.mecanismoState === 'VALIDATED' || context.mecanismoState === 'APPROVED';
      results.push({
        check: 'human:mecanismo',
        pass: mecanismoOk,
        message: mecanismoOk
          ? `Mecanismo: ${context.mecanismoState}`
          : `Mecanismo: ${context.mecanismoState || 'UNDEFINED'} (need VALIDATED or APPROVED)`,
      });
    }

    // Human approval for delivery
    if (this.phase === 'delivery') {
      results.push({
        check: 'human:approval',
        pass: !!context.humanApproved,
        message: context.humanApproved
          ? 'Human approval: APPROVED'
          : 'Human approval: PENDING',
      });
    }

    // Story completion check
    if (context.storyComplete !== undefined) {
      results.push({
        check: 'human:story',
        pass: context.storyComplete,
        message: context.storyComplete
          ? 'Story: all acceptance criteria met'
          : 'Story: acceptance criteria pending',
      });
    }

    // If no checks for this phase, auto-pass
    if (results.length === 0) {
      results.push({
        check: 'human:none',
        pass: true,
        message: `No human review required for ${this.phase} phase`,
        skipped: true,
      });
    }

    const allPassed = results.every(r => r.pass || r.skipped);
    const duration = Date.now() - startTime;

    const layer: LayerResult = {
      layer: 'Layer 3: Human Review',
      pass: allPassed,
      status: allPassed ? 'passed' : 'failed',
      results,
      duration,
    };

    this.results.push(layer);
    return layer;
  }

  // ─── Orchestration ─────────────────────────────────────────────────────────

  /**
   * Run the full 3-layer pipeline with fail-fast behavior.
   * For the briefing phase, delegates weighted scoring to evaluateBriefingGate()
   * from weighted-gates instead of calculating inline.
   */
  orchestrate(context: {
    toolsUsed: string[];
    scores: Record<string, number>;
    mecanismoState?: string;
    storyComplete?: boolean;
    humanApproved?: boolean;
    briefingWeightedScore?: number;  // Pre-computed if caller already ran evaluateBriefingGate
  }): GateResult {
    this.startTime = Date.now();
    this.results = [];

    // Layer 1: Tool Enforcement
    const l1 = this.runLayer1(context.toolsUsed);
    if (!l1.pass) {
      this.endTime = Date.now();
      return this.failFast('layer1', l1);
    }

    // Layer 2: Quality Scores
    // For briefing phase: inject weighted score from evaluateBriefingGate if provided,
    // otherwise pass through normally (briefing has no inline score checks by default)
    let scoresForLayer2 = context.scores;
    if (this.phase === 'briefing' && this.offerPath) {
      // Use pre-computed score if available, otherwise mark as delegated
      const briefingScore = context.briefingWeightedScore !== undefined
        ? context.briefingWeightedScore
        : null;

      // Surface briefing gate result in Layer 2 results via synthetic score
      const startL2 = Date.now();
      const l2Results: CheckResult[] = [];

      if (briefingScore !== null) {
        const minScore = 75; // PASSED threshold from evaluateBriefingGate
        const pass = briefingScore >= minScore;
        l2Results.push({
          check: 'score:briefing_weighted',
          pass,
          score: briefingScore,
          threshold: minScore,
          message: `Briefing weighted score: ${briefingScore}/${minScore} — ${pass ? 'PASS' : 'FAIL'} (via evaluateBriefingGate)`,
          details: { source: 'evaluateBriefingGate', offerPath: this.offerPath },
        });
      } else {
        // No pre-computed score — run standard layer2 (empty for briefing = auto-pass)
        const l2 = this.runLayer2(scoresForLayer2);
        if (!l2.pass) {
          this.endTime = Date.now();
          return this.failFast('layer2', l2);
        }
        // Jump to Layer 3
        const l3 = this.runLayer3(context);
        this.endTime = Date.now();
        if (!l3.pass) {
          return {
            pass: false,
            status: 'pending_human_review',
            duration: this.getDuration(),
            layers: this.results,
            exitCode: 0,
            message: 'Layers 1+2 passed. Awaiting human review.',
          };
        }
        return {
          pass: true,
          status: 'passed',
          duration: this.getDuration(),
          layers: this.results,
          exitCode: 0,
          message: 'All quality gates passed.',
        };
      }

      const allL2Passed = l2Results.every(r => r.pass || r.skipped);
      const l2Layer: LayerResult = {
        layer: 'Layer 2: Quality Scores',
        pass: allL2Passed,
        status: allL2Passed ? 'passed' : 'failed',
        results: l2Results,
        duration: Date.now() - startL2,
      };
      this.results.push(l2Layer);

      if (!l2Layer.pass) {
        this.endTime = Date.now();
        return this.failFast('layer2', l2Layer);
      }
    } else {
      // Non-briefing phase: standard Layer 2
      const l2 = this.runLayer2(scoresForLayer2);
      if (!l2.pass) {
        this.endTime = Date.now();
        return this.failFast('layer2', l2);
      }
    }

    // Layer 3: Human Review
    const l3 = this.runLayer3(context);
    this.endTime = Date.now();

    if (!l3.pass) {
      return {
        pass: false,
        status: 'pending_human_review',
        duration: this.getDuration(),
        layers: this.results,
        exitCode: 0, // Not a hard failure — pending review
        message: 'Layers 1+2 passed. Awaiting human review.',
      };
    }

    return {
      pass: true,
      status: 'passed',
      duration: this.getDuration(),
      layers: this.results,
      exitCode: 0,
      message: 'All quality gates passed.',
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private failFast(stoppedAt: string, failedLayer: LayerResult): GateResult {
    const failedChecks = failedLayer.results.filter(r => !r.pass && !r.skipped);

    return {
      pass: false,
      status: 'failed',
      stoppedAt,
      reason: 'fail-fast',
      duration: this.getDuration(),
      layers: this.results,
      exitCode: 1,
      message: `${failedLayer.layer} failed: ${failedChecks.map(c => c.message).join('; ')}`,
    };
  }

  private getDuration(): number {
    if (!this.startTime) return 0;
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  // ─── Status Persistence ────────────────────────────────────────────────────

  /**
   * Save gate results to status file.
   */
  saveStatus(): void {
    const status: QAStatus = {
      lastRun: new Date().toISOString(),
      phase: this.phase,
      offerPath: this.offerPath,
      layer1: this.results[0] || null,
      layer2: this.results[1] || null,
      layer3: this.results[2] || null,
      overall: this.results.every(l => l.pass) ? 'passed' : 'failed',
    };

    try {
      const dir = dirname(STATUS_PATH);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(STATUS_PATH, JSON.stringify(status, null, 2));
    } catch (error) {
      console.error(`[QGM] Failed to save status: ${error}`);
    }
  }

  /**
   * Load last gate status from file.
   */
  static loadStatus(): QAStatus | null {
    try {
      if (!existsSync(STATUS_PATH)) return null;
      const content = readFileSync(STATUS_PATH, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // ─── Status Query ──────────────────────────────────────────────────────────

  /**
   * Get current gate status (last run or null).
   * Mirrors aios-core quality-gate-manager getStatus().
   */
  getStatus(): QAStatus | null {
    if (this.results.length === 0) {
      return QualityGateManager.loadStatus();
    }
    return {
      lastRun: new Date().toISOString(),
      phase: this.phase,
      offerPath: this.offerPath,
      layer1: this.results[0] || null,
      layer2: this.results[1] || null,
      layer3: this.results[2] || null,
      overall: this.results.every(l => l.pass) ? 'passed' : 'failed',
    };
  }

  /**
   * Generate a Markdown report and save it to ~/.claude/qa-reports/{offerId}.md.
   * Mirrors aios-core quality-gate-manager saveReport().
   */
  saveReport(offerId: string): void {
    const status = this.getStatus();
    const lines: string[] = [
      `# Quality Gate Report — ${offerId}`,
      '',
      `**Phase:** ${this.phase}`,
      `**Date:** ${new Date().toISOString()}`,
      `**Overall:** ${status?.overall?.toUpperCase() ?? 'UNKNOWN'}`,
      '',
      '## Layer Results',
      '',
    ];

    for (const layer of this.results) {
      const icon = layer.pass ? 'PASS' : 'FAIL';
      lines.push(`### [${icon}] ${layer.layer}`);
      lines.push('');
      for (const r of layer.results) {
        const checkIcon = r.pass ? '- [x]' : r.skipped ? '- [-]' : '- [ ]';
        lines.push(`${checkIcon} ${r.message}`);
      }
      lines.push('');
    }

    lines.push(`---`);
    lines.push(`*Generated by QualityGateManager v1.0.0*`);

    try {
      const reportsDir = join(HOME, '.claude', 'qa-reports');
      if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });
      const reportPath = join(reportsDir, `${offerId.replace(/\//g, '-')}.md`);
      writeFileSync(reportPath, lines.join('\n'));
    } catch (error) {
      console.error(`[QGM] Failed to save report: ${error}`);
    }
  }

  /**
   * Get all checks from the last run that require human review (pending).
   * Mirrors aios-core quality-gate-manager getPendingReviews().
   */
  getPendingReviews(): CheckResult[] {
    const layer3 = this.results.find(l => l.layer.includes('Layer 3') || l.layer.includes('Human'));
    if (!layer3) return [];
    return layer3.results.filter(r => !r.pass && !r.skipped);
  }

  // ─── Formatting ────────────────────────────────────────────────────────────

  /**
   * Format results for display (system-reminder output).
   */
  formatResults(): string {
    const lines: string[] = [];
    lines.push('Quality Gate Pipeline Results');
    lines.push('━'.repeat(50));

    for (const layer of this.results) {
      const icon = layer.pass ? '✅' : '❌';
      lines.push(`${icon} ${layer.layer} — ${layer.status.toUpperCase()}`);

      for (const result of layer.results) {
        const checkIcon = result.pass ? '✓' : '✗';
        const skipped = result.skipped ? ' (skipped)' : '';
        lines.push(`   ${checkIcon} ${result.message}${skipped}`);
      }
    }

    lines.push('━'.repeat(50));
    lines.push(`Duration: ${this.getDuration()}ms`);

    return lines.join('\n');
  }
}
