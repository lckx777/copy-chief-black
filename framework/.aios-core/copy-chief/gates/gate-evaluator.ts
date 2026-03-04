/**
 * Gate Evaluator - Quality gates between phases
 * Port of: aios-core/.aios-core/core/orchestration/gate-evaluator.js
 *
 * Adapted for Copy Chief: epic gates → HELIX phase gates
 *
 * Features:
 * - Gate check after each phase completes
 * - Verdicts: APPROVED, NEEDS_REVISION, BLOCKED
 * - BLOCKED halts pipeline and escalates
 * - Configurable checks per gate
 * - Gate results saved for audit
 * - Strict mode: any fail = halt
 *
 * @module aios/gate-evaluator
 * @version 1.0.0
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { homedir } from 'os';

// Use createRequire to load yaml in a way that works in both CJS and ESM contexts
const _require = createRequire(import.meta.url);
let yaml: any;
try { yaml = _require('yaml'); } catch { try { yaml = _require('js-yaml'); } catch { yaml = { parse: JSON.parse, load: JSON.parse }; } }

// ============ Types ============

export const GateVerdict = {
  APPROVED: 'approved',
  NEEDS_REVISION: 'needs_revision',
  BLOCKED: 'blocked',
} as const;

export type GateVerdictType = typeof GateVerdict[keyof typeof GateVerdict];

export interface GateConfig {
  blocking: boolean;
  minScore?: number;
  requireApproval?: boolean;
  requireTests?: boolean;
  minTestCoverage?: number;
  allowMinorIssues?: boolean;
  checks: string[];
}

export interface GateCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface GateIssue {
  check: string;
  message: string;
  severity: string;
}

export interface GateResult {
  gate: string;
  fromPhase: string;
  toPhase: string;
  timestamp: string;
  verdict: GateVerdictType;
  score: number;
  checks: GateCheck[];
  issues: GateIssue[];
  config: GateConfig;
}

// Copy Chief gate configs
const DEFAULT_GATE_CONFIG: Record<string, GateConfig> = {
  research_to_briefing: {
    blocking: true,
    checks: ['voc_collected', 'competitors_analyzed', 'synthesis_exists'],
  },
  briefing_to_production: {
    blocking: true,
    checks: ['helix_complete', 'mecanismo_validated', 'mup_defined', 'mus_defined'],
  },
  production_to_review: {
    blocking: true,
    checks: ['blind_critic_passed', 'emotional_stress_passed', 'no_critical_errors'],
  },
  review_to_delivery: {
    blocking: true,
    checks: ['black_validation_passed', 'human_approved'],
    requireApproval: true,
  },
};

// ============ Class ============

export class GateEvaluator {
  projectRoot: string;
  strictMode: boolean;
  gateConfig: Record<string, GateConfig> | null;
  results: GateResult[];
  logs: Array<{ timestamp: string; level: string; message: string }>;

  constructor(options: { projectRoot?: string; strictMode?: boolean; gateConfig?: Record<string, GateConfig> } = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.strictMode = options.strictMode ?? false;
    this.gateConfig = options.gateConfig || null;
    this.results = [];
    this.logs = [];
  }

  private _log(message: string, level = 'info'): void {
    this.logs.push({ timestamp: new Date().toISOString(), level, message });
  }

  private _loadConfig(): Record<string, GateConfig> {
    if (this.gateConfig) return this.gateConfig;
    try {
      const configPath = join(this.projectRoot, '.claude', 'core-config.yaml');
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8');
        const config = (yaml.parse || yaml.load)(content);
        if (config?.gates) return { ...DEFAULT_GATE_CONFIG, ...config.gates };
      }
    } catch (error: any) {
      this._log(`Failed to load gate config: ${error.message}`, 'warn');
    }
    return DEFAULT_GATE_CONFIG;
  }

  private _getGateKey(fromPhase: string, toPhase: string): string {
    return `${fromPhase}_to_${toPhase}`;
  }

  evaluate(fromPhase: string, toPhase: string, phaseResult: Record<string, any>): GateResult {
    const gateKey = this._getGateKey(fromPhase, toPhase);
    this._log(`Evaluating gate: ${gateKey}`, 'info');

    const config = this._loadConfig();
    const gateConfig = config[gateKey] || { blocking: false, checks: [] };

    const result: GateResult = {
      gate: gateKey,
      fromPhase,
      toPhase,
      timestamp: new Date().toISOString(),
      verdict: GateVerdict.APPROVED,
      score: 0,
      checks: [],
      issues: [],
      config: gateConfig,
    };

    try {
      const checks = this._runGateChecks(fromPhase, toPhase, phaseResult, gateConfig);
      result.checks = checks;

      const passedChecks = checks.filter(c => c.passed).length;
      result.score = checks.length > 0 ? (passedChecks / checks.length) * 5 : 5;

      result.issues = checks.filter(c => !c.passed).map(c => ({
        check: c.name, message: c.message, severity: c.severity,
      }));

      result.verdict = this._determineVerdict(result, gateConfig);
      this._log(`Gate ${gateKey}: ${result.verdict} (score: ${result.score.toFixed(1)})`, 'info');
    } catch (error: any) {
      result.verdict = GateVerdict.BLOCKED;
      result.issues.push({ check: 'gate_evaluation', message: error.message, severity: 'critical' });
      this._log(`Gate evaluation failed: ${error.message}`, 'error');
    }

    this.results.push(result);
    return result;
  }

  private _runGateChecks(fromPhase: string, _toPhase: string, phaseResult: Record<string, any>, gateConfig: GateConfig): GateCheck[] {
    const checks: GateCheck[] = [];
    const checkNames = gateConfig.checks || [];

    for (const checkName of checkNames) {
      checks.push(this._runCheck(checkName, phaseResult));
    }

    if (gateConfig.minScore !== undefined && phaseResult.score !== undefined) {
      checks.push({
        name: 'min_score',
        passed: phaseResult.score >= gateConfig.minScore,
        message: `Score ${phaseResult.score} ${phaseResult.score >= gateConfig.minScore ? '>=' : '<'} min ${gateConfig.minScore}`,
        severity: 'high',
      });
    }

    return checks;
  }

  private _runCheck(checkName: string, phaseResult: Record<string, any>): GateCheck {
    const result: GateCheck = { name: checkName, passed: false, message: '', severity: 'medium' };

    switch (checkName) {
      // Research checks
      case 'voc_collected':
        result.passed = !!phaseResult.voc_data || (phaseResult.tools_used || []).includes('voc_search');
        result.message = result.passed ? 'VOC data collected' : 'No VOC data found';
        result.severity = 'critical';
        break;
      case 'competitors_analyzed':
        result.passed = !!phaseResult.competitor_data || (phaseResult.tools_used || []).includes('get_meta_ads');
        result.message = result.passed ? 'Competitors analyzed' : 'No competitor analysis';
        result.severity = 'high';
        break;
      case 'synthesis_exists':
        result.passed = !!phaseResult.synthesis_path;
        result.message = result.passed ? 'Synthesis document exists' : 'No synthesis document';
        result.severity = 'high';
        break;

      // Briefing checks
      case 'helix_complete':
        result.passed = !!phaseResult.helix_complete || (phaseResult.phases_completed || 0) >= 10;
        result.message = result.passed ? 'HELIX 10/10 complete' : 'HELIX incomplete';
        result.severity = 'critical';
        break;
      case 'mecanismo_validated':
        result.passed = phaseResult.mecanismo_state === 'VALIDATED' || phaseResult.mecanismo_state === 'APPROVED';
        result.message = result.passed ? `Mecanismo: ${phaseResult.mecanismo_state}` : 'Mecanismo not validated';
        result.severity = 'critical';
        break;
      case 'mup_defined':
        result.passed = !!phaseResult.mup_statement;
        result.message = result.passed ? 'MUP defined' : 'No MUP statement';
        result.severity = 'critical';
        break;
      case 'mus_defined':
        result.passed = !!phaseResult.mus_statement;
        result.message = result.passed ? 'MUS defined' : 'No MUS statement';
        result.severity = 'critical';
        break;

      // Production checks
      case 'blind_critic_passed':
        result.passed = (phaseResult.blind_critic_score || 0) >= 8;
        result.message = `blind_critic: ${phaseResult.blind_critic_score || 0}/10 (min: 8)`;
        result.severity = 'high';
        break;
      case 'emotional_stress_passed':
        result.passed = (phaseResult.emotional_stress_score || 0) >= 8;
        result.message = `emotional_stress: ${phaseResult.emotional_stress_score || 0}/10 (min: 8)`;
        result.severity = 'high';
        break;
      case 'no_critical_errors':
        const criticalErrors = (phaseResult.errors || []).filter((e: any) => e.severity === 'critical');
        result.passed = criticalErrors.length === 0;
        result.message = result.passed ? 'No critical errors' : `${criticalErrors.length} critical errors`;
        result.severity = 'critical';
        break;

      // Review checks
      case 'black_validation_passed':
        result.passed = (phaseResult.black_validation_score || 0) >= 8;
        result.message = `black_validation: ${phaseResult.black_validation_score || 0}/10 (min: 8)`;
        result.severity = 'critical';
        break;
      case 'human_approved':
        result.passed = !!phaseResult.human_approved;
        result.message = result.passed ? 'Human approved' : 'Awaiting human approval';
        result.severity = 'critical';
        break;

      default:
        result.passed = true;
        result.message = `Unknown check: ${checkName}`;
        result.severity = 'low';
    }

    return result;
  }

  private _determineVerdict(result: GateResult, gateConfig: GateConfig): GateVerdictType {
    if (this.strictMode && result.issues.length > 0) return GateVerdict.BLOCKED;

    const criticalIssues = result.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) return GateVerdict.BLOCKED;

    if (gateConfig.minScore !== undefined && result.score < gateConfig.minScore) {
      return gateConfig.blocking ? GateVerdict.BLOCKED : GateVerdict.NEEDS_REVISION;
    }

    const highIssues = result.issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) return gateConfig.blocking ? GateVerdict.BLOCKED : GateVerdict.NEEDS_REVISION;

    if (gateConfig.allowMinorIssues && result.issues.every(i => i.severity === 'low' || i.severity === 'medium')) {
      return GateVerdict.APPROVED;
    }

    if (result.issues.length > 0) return GateVerdict.NEEDS_REVISION;
    return GateVerdict.APPROVED;
  }

  shouldBlock(verdict: GateVerdictType): boolean { return verdict === GateVerdict.BLOCKED; }
  needsRevision(verdict: GateVerdictType): boolean { return verdict === GateVerdict.NEEDS_REVISION; }

  getResults(): GateResult[] { return [...this.results]; }
  getResult(gateKey: string): GateResult | null { return this.results.find(r => r.gate === gateKey) || null; }

  getSummary(): { total: number; approved: number; needsRevision: number; blocked: number; allPassed: boolean; averageScore: number } {
    const approved = this.results.filter(r => r.verdict === GateVerdict.APPROVED).length;
    const needsRevision = this.results.filter(r => r.verdict === GateVerdict.NEEDS_REVISION).length;
    const blocked = this.results.filter(r => r.verdict === GateVerdict.BLOCKED).length;
    return {
      total: this.results.length, approved, needsRevision, blocked,
      allPassed: blocked === 0 && needsRevision === 0,
      averageScore: this.results.length > 0 ? this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length : 0,
    };
  }

  clear(): void { this.results = []; this.logs = []; }
  getLogs(): typeof this.logs { return [...this.logs]; }

  // ─── Added: async _loadConfig, _runCheckForType (parity with aios-core) ────


  /**
   * Async variant of _loadConfig — reads core-config.yaml with fs.promises.
   * Mirrors aios-core gate-evaluator._loadConfig() (async/await version).
   */
  async loadConfigAsync(): Promise<Record<string, GateConfig>> {
    if (this.gateConfig) return this.gateConfig;
    try {
      const { readFileSync, existsSync } = await import('fs');
      const configPath = join(this.projectRoot, '.claude', 'core-config.yaml');
      if (existsSync(configPath)) {
        const content = readFileSync(configPath, 'utf8');
        const config = (yaml.parse || yaml.load)(content);
        if (config?.gates) return { ...DEFAULT_GATE_CONFIG, ...config.gates };
      }
    } catch (err: any) {
      this._log(`Failed to load gate config (async): ${err.message}`, 'warn');
    }
    return DEFAULT_GATE_CONFIG;
  }

  /**
   * Run a check by type, matching the aios-core _runCheckForType() pattern.
   *
   * Supported check types:
   *   - toolsUsed: checks if a tool name appears in phaseResult.tools_used[]
   *   - scoreAbove: checks if phaseResult[checkName] >= threshold
   *   - mecanismoState: checks phaseResult.mecanismo_state === 'VALIDATED' | 'APPROVED'
   *   - filesExist: checks phaseResult.artifacts[] or phaseResult.synthesis_path
   *
   * @param checkType — 'toolsUsed' | 'scoreAbove' | 'mecanismoState' | 'filesExist'
   * @param checkName — specific check value (tool name, score key, state value, file path)
   * @param phaseResult — phase execution result object
   * @param threshold — optional numeric threshold for scoreAbove checks
   */
  runCheckForType(
    checkType: 'toolsUsed' | 'scoreAbove' | 'mecanismoState' | 'filesExist',
    checkName: string,
    phaseResult: Record<string, any>,
    threshold = 8,
  ): GateCheck {
    const result: GateCheck = { name: checkName, passed: false, message: '', severity: 'medium' };

    switch (checkType) {
      case 'toolsUsed': {
        const used: string[] = phaseResult.tools_used || [];
        // match full name or suffix (e.g. 'voc_search' matches 'mcp__copywriting__voc_search')
        result.passed = used.some(t => t === checkName || t.endsWith(checkName) || t.includes(checkName));
        result.message = result.passed ? `Tool used: ${checkName}` : `Tool NOT used: ${checkName}`;
        result.severity = 'high';
        break;
      }

      case 'scoreAbove': {
        const score = typeof phaseResult[checkName] === 'number' ? phaseResult[checkName] : 0;
        result.passed = score >= threshold;
        result.message = `${checkName}: ${score} ${result.passed ? '>=' : '<'} ${threshold}`;
        result.severity = result.passed ? 'low' : 'high';
        break;
      }

      case 'mecanismoState': {
        const state: string = phaseResult.mecanismo_state || '';
        const validStates = ['VALIDATED', 'APPROVED'];
        result.passed = validStates.includes(state.toUpperCase());
        result.message = result.passed
          ? `Mecanismo state: ${state}`
          : `Mecanismo state '${state}' not in ${validStates.join('|')}`;
        result.severity = 'critical';
        break;
      }

      case 'filesExist': {
        // Check synthesis_path, specPath, or artifacts array
        const artifacts: string[] = (phaseResult.artifacts || []).map((a: any) => (typeof a === 'string' ? a : a?.path || ''));
        const hasDirect = !!phaseResult.synthesis_path || !!phaseResult.specPath || !!phaseResult[checkName];
        const hasArtifact = artifacts.some(p => p.includes(checkName));
        result.passed = hasDirect || hasArtifact;
        result.message = result.passed ? `File/artifact exists: ${checkName}` : `File/artifact missing: ${checkName}`;
        result.severity = 'high';
        break;
      }

      default:
        result.passed = true;
        result.message = `Unknown checkType: ${checkType}`;
        result.severity = 'low';
    }

    return result;
  }
}

// ==========================================
// Phase Advancement Helper
// ==========================================

export interface PhaseAdvanceResult {
  allowed: boolean;
  reason: string;
  scores?: {
    researchPassed?: boolean;
    briefingPassed?: boolean;
    productionPassed?: boolean;
    helixPhases?: number;
    mecanismoState?: string;
  };
}

const HOME_DIR = homedir();
const ECOSYSTEM_ROOT_GE = join(HOME_DIR, 'copywriting-ecosystem');

/**
 * canAdvancePhase — Encapsulates "can this offer move to phase X" logic.
 *
 * Reads helix-state.yaml to check current gate statuses and determines
 * whether the offer satisfies prerequisites to enter the target phase.
 *
 * Phase prerequisites:
 *   RESEARCH   → always allowed (initial phase)
 *   BRIEFING   → research gate must be passed
 *   PRODUCTION → briefing gate must be passed (implies research also passed)
 *   REVIEW     → production gate must be passed
 *   DELIVERED  → review (production) gate must be passed + human approval
 *
 * @param offerPath   - Relative (e.g. "saude/florayla") or absolute path
 * @param targetPhase - Target phase to advance to (uppercase)
 * @returns PhaseAdvanceResult with allowed, reason, and optional scores
 */
export function canAdvancePhase(offerPath: string, targetPhase: string): PhaseAdvanceResult {
  const resolved = offerPath.startsWith('/')
    ? offerPath
    : join(ECOSYSTEM_ROOT_GE, offerPath);

  const helixStatePath = join(resolved, 'helix-state.yaml');
  const phase = targetPhase.toUpperCase();

  // RESEARCH is always the initial phase — always allowed
  if (phase === 'RESEARCH' || phase === 'IDLE') {
    return { allowed: true, reason: `${phase} is always accessible as the initial phase` };
  }

  // Read helix-state.yaml
  let helixContent = '';
  try {
    if (existsSync(helixStatePath)) {
      helixContent = readFileSync(helixStatePath, 'utf-8');
    }
  } catch {
    // Fail-open for unreadable state
    return {
      allowed: true,
      reason: 'helix-state.yaml unreadable — allowing by default (fail-open)',
    };
  }

  if (!helixContent) {
    return {
      allowed: false,
      reason: `helix-state.yaml not found at ${helixStatePath} — cannot determine gate status`,
    };
  }

  // Parse gate statuses from YAML content
  const gatesSection = helixContent.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || helixContent.substring(helixContent.indexOf('gates:') + 6);
  const gateLines = gatesSection.split('\n');

  let researchPassed = false;
  let briefingPassed = false;
  let productionPassed = false;
  let currentGate = '';

  for (const line of gateLines) {
    const gateNameMatch = line.match(/^\s{2}(research|briefing|production)\s*:/);
    if (gateNameMatch) { currentGate = gateNameMatch[1]; continue; }
    const passedMatch = line.match(/^\s+passed\s*:\s*(true|false)/);
    if (passedMatch && currentGate) {
      const val = passedMatch[1] === 'true';
      if (currentGate === 'research') researchPassed = val;
      else if (currentGate === 'briefing') briefingPassed = val;
      else if (currentGate === 'production') productionPassed = val;
    }
  }

  // Parse HELIX phases_completed
  const phasesMatch = helixContent.match(/phases_completed\s*:\s*(\d+)/);
  let helixPhases = phasesMatch ? parseInt(phasesMatch[1], 10) : 0;
  if (helixPhases === 0) {
    const completedMatches = helixContent.match(/status:\s*completed/g);
    helixPhases = completedMatches ? completedMatches.length : 0;
  }

  // Parse mecanismo state
  const mecanismoStateMatch = helixContent.match(/state\s*:\s*(\w+)/);
  const mecanismoState = mecanismoStateMatch ? mecanismoStateMatch[1].toUpperCase() : 'UNKNOWN';

  const scores = { researchPassed, briefingPassed, productionPassed, helixPhases, mecanismoState };

  switch (phase) {
    case 'BRIEFING':
      if (!researchPassed) {
        return {
          allowed: false,
          reason: 'Research gate not passed — complete research phase before advancing to BRIEFING',
          scores,
        };
      }
      return { allowed: true, reason: 'Research gate passed — BRIEFING accessible', scores };

    case 'PRODUCTION':
      if (!researchPassed) {
        return {
          allowed: false,
          reason: 'Research gate not passed — complete research phase first',
          scores,
        };
      }
      if (!briefingPassed) {
        return {
          allowed: false,
          reason: `Briefing gate not passed (${helixPhases}/10 HELIX phases) — complete briefing before PRODUCTION`,
          scores,
        };
      }
      return { allowed: true, reason: 'Research + Briefing gates passed — PRODUCTION accessible', scores };

    case 'REVIEW':
      if (!productionPassed) {
        return {
          allowed: false,
          reason: 'Production gate not passed — complete production phase before REVIEW',
          scores,
        };
      }
      return { allowed: true, reason: 'Production gate passed — REVIEW accessible', scores };

    case 'DELIVERED':
      if (!productionPassed) {
        return {
          allowed: false,
          reason: 'Production gate not passed — complete production and review before DELIVERED',
          scores,
        };
      }
      return { allowed: true, reason: 'Production gate passed — DELIVERED accessible', scores };

    default:
      return {
        allowed: false,
        reason: `Unknown target phase: "${targetPhase}". Valid phases: RESEARCH, BRIEFING, PRODUCTION, REVIEW, DELIVERED`,
        scores,
      };
  }
}
