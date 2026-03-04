/**
 * journey-tracker.ts — Journey Log with Failure Attribution Module
 * Part of AIOS Copy Chief OS Layer
 *
 * Records each production iteration with scores and failure reasons.
 * Feeds the self-learning loop and workflow intelligence engine.
 *
 * Usage:
 *   import { processJourneyIteration } from './journey-tracker'
 *
 * Dependencies (kept per original):
 *   - copy-chief/learning/self-learning (recordValidation)
 *   - copy-chief/workflow/workflow-intelligence (recordToolUsage, getScoredSuggestions, getWaveSummary)
 *
 * Extracted from: ~/.claude/hooks/journey-log.ts
 * Created: 2026-02-23 | Refactored: 2026-03-02
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { recordValidation } from './self-learning';
import { recordToolUsage, getScoredSuggestions, getWaveSummary } from '../workflow/workflow-intelligence';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME = process.env.HOME || '';
export const LOGS_DIR = join(HOME, '.claude/production-logs');
export const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');

export const VALIDATION_TOOLS = [
  'mcp__copywriting__blind_critic',
  'mcp__copywriting__emotional_stress_test',
  'mcp__copywriting__black_validation',
  'mcp__copywriting__layered_review',
];

export const PRODUCTION_TOOLS = [
  'mcp__copywriting__write_chapter',
  'Write',
  'Edit',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
}

export interface JourneyIteration {
  iteration: number;
  tool: string;
  score: number | null;
  failure_reasons: string[];
  timestamp: string;
  status: 'FAILED' | 'PASSED' | 'UNKNOWN';
}

export interface JourneyLog {
  offer: string;
  deliverable: string;
  started_at: string;
  updated_at: string;
  iterations: JourneyIteration[];
  final_status: 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  patterns_learned: string[];
}

// ─── Offer & Deliverable Detection ───────────────────────────────────────────

export function detectOffer(): string {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : 'unknown';
}

export function detectDeliverable(toolInput: Record<string, unknown>): string {
  const copyType = (toolInput.copy_type as string) || 'unknown';
  const context = (toolInput.context as string) || '';

  if (context.includes('bloco') || context.includes('block')) {
    const blockMatch = context.match(/bloco?\s*(\d+)/i);
    if (blockMatch) return `landing-page/bloco-${blockMatch[1].padStart(2, '0')}`;
  }
  if (context.includes('vsl') || context.includes('capitulo')) {
    return `vsl/${copyType}`;
  }
  if (context.includes('criativo') || context.includes('creative')) {
    return `creatives/${copyType}`;
  }
  return copyType || 'unknown';
}

// ─── Score & Failure Parsing ──────────────────────────────────────────────────

export function parseScore(output: string): number | null {
  const patterns = [
    /score[:\s]+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/i,
    /média[:\s]+(\d+(?:\.\d+)?)/i,
    /rating[:\s]+(\d+(?:\.\d+)?)/i,
    /genericidade[:\s]+(\d+(?:\.\d+)?)/i,
  ];
  for (const p of patterns) {
    const m = output.match(p);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

export function extractFailureReasons(output: string): string[] {
  const reasons: string[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    if (/melhora|weak|fraco|genéric|falta|missing|precisa|needs/i.test(line) && line.trim().length > 10) {
      const cleaned = line.replace(/^[\s\-\*•]+/, '').trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        reasons.push(cleaned);
      }
    }
  }

  return reasons.slice(0, 5);
}

// ─── Log I/O ──────────────────────────────────────────────────────────────────

export function getLogPath(offer: string): string {
  const safeName = offer.replace(/\//g, '_');
  return join(LOGS_DIR, `${safeName}-journey.yaml`);
}

export function loadLog(offer: string): JourneyLog[] {
  const logPath = getLogPath(offer);
  if (!existsSync(logPath)) return [];
  try {
    return (parseYaml(readFileSync(logPath, 'utf-8')) as JourneyLog[]) || [];
  } catch {
    return [];
  }
}

export function saveLog(offer: string, logs: JourneyLog[]): void {
  if (!existsSync(LOGS_DIR)) mkdirSync(LOGS_DIR, { recursive: true });
  writeFileSync(getLogPath(offer), stringifyYaml(logs));
}

// ─── Pattern Learning Algorithm ───────────────────────────────────────────────

/**
 * Analyze recent iterations to detect recurring failure patterns and score regressions.
 * Mutates journey.patterns_learned in place.
 */
export function learnPatterns(journey: JourneyLog): void {
  const recent = journey.iterations.slice(-5);
  const failedIterations = recent.filter(i => i.status === 'FAILED');

  // Pattern: same failure reason appears 2+ times
  const reasonCounts: Record<string, number> = {};
  for (const iter of failedIterations) {
    for (const reason of iter.failure_reasons) {
      const key = reason.slice(0, 60);
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }

  for (const [reason, count] of Object.entries(reasonCounts)) {
    if (count >= 2) {
      const pattern = `Recurring: "${reason}" (${count}x in last 5)`;
      if (!journey.patterns_learned.includes(pattern)) {
        journey.patterns_learned.push(pattern);
      }
    }
  }

  // Pattern: score regression
  const scores = recent.filter(i => i.score !== null).map(i => i.score as number);
  if (scores.length >= 2) {
    const lastTwo = scores.slice(-2);
    if (lastTwo[1] < lastTwo[0] - 1) {
      const pattern = `Regression: score dropped from ${lastTwo[0]} to ${lastTwo[1]}`;
      if (!journey.patterns_learned.some(p => p.startsWith('Regression:'))) {
        journey.patterns_learned.push(pattern);
      }
    }
  }
}

// ─── WIE Integration ──────────────────────────────────────────────────────────

/**
 * Query Workflow Intelligence Engine for tool suggestions and append to patterns.
 * Non-blocking — errors are swallowed.
 */
export function applyWIESuggestions(journey: JourneyLog, toolShort: string): void {
  try {
    const recentTools = journey.iterations.slice(-5).map(i => i.tool);
    const suggestions = getScoredSuggestions(toolShort, recentTools);
    if (suggestions.length > 0) {
      const top = suggestions[0];
      if (top.confidence > 0.5) {
        journey.patterns_learned.push(
          `WIE ${(top.confidence * 100).toFixed(0)}%: ${top.pattern.title} — ${top.pattern.benefit}`
        );
      }
    }
  } catch { /* WIE is non-blocking */ }
}

// ─── Self-Learning Feed ───────────────────────────────────────────────────────

/**
 * Feed the self-learning loop with a completed validation result.
 * Non-blocking — errors are swallowed.
 */
export function feedSelfLearning(
  offer: string,
  deliverable: string,
  toolShort: string,
  score: number,
  failureReasons: string[],
  iterationCount: number,
  status: 'PASSED' | 'FAILED' | 'UNKNOWN'
): void {
  try {
    let phase = 'PRODUCTION';
    const helixPath = join(ECOSYSTEM_ROOT, offer, 'helix-state.yaml');
    if (existsSync(helixPath)) {
      try {
        const hs = parseYaml(readFileSync(helixPath, 'utf-8')) as any;
        if (hs?.current_phase) phase = hs.current_phase.toUpperCase();
      } catch { /* default */ }
    }

    recordValidation({
      timestamp: new Date().toISOString(),
      offer_path: offer,
      deliverable_type: deliverable.split('/')[0] || deliverable,
      phase,
      tool: toolShort,
      score,
      iteration: iterationCount,
      criteria_failed: failureReasons.map(r => r.slice(0, 80)),
      passed: status === 'PASSED',
    });
  } catch { /* self-learning is non-blocking */ }
}

// ─── Main Orchestration ───────────────────────────────────────────────────────

/**
 * Main entry point — process a single hook input event.
 *
 * Handles both validation tools (blind_critic, etc.) and production writes.
 * Returns the updated journey log entry and stderr messages for the caller to emit.
 *
 * @returns { handled: boolean } — false if the tool is not relevant (caller should exit 0)
 */
export function processJourneyIteration(input: HookInput): { handled: boolean } {
  const isValidation = VALIDATION_TOOLS.includes(input.tool_name);
  const isProduction = PRODUCTION_TOOLS.includes(input.tool_name);

  // Only track production writes to production/ directories
  if (isProduction && !isValidation) {
    const filePath = (input.tool_input.file_path as string) || '';
    if (!filePath.includes('/production/') && input.tool_name !== 'mcp__copywriting__write_chapter') {
      return { handled: false };
    }
  }

  if (!isValidation && !isProduction) return { handled: false };
  if (input.is_error) return { handled: false };

  const offer = detectOffer();
  const deliverable = detectDeliverable(input.tool_input);
  const toolShort = input.tool_name.replace(/^mcp__[^_]+__/, '');

  let score: number | null = null;
  let failureReasons: string[] = [];
  let status: 'FAILED' | 'PASSED' | 'UNKNOWN' = 'UNKNOWN';

  if (isValidation && input.tool_output) {
    score = parseScore(input.tool_output);
    failureReasons = score !== null && score < 8 ? extractFailureReasons(input.tool_output) : [];
    status = score === null ? 'UNKNOWN' : score >= 8 ? 'PASSED' : 'FAILED';
  }

  const logs = loadLog(offer);

  let journey = logs.find(l => l.deliverable === deliverable && l.final_status === 'IN_PROGRESS');

  if (!journey) {
    journey = {
      offer,
      deliverable,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      iterations: [],
      final_status: 'IN_PROGRESS',
      patterns_learned: [],
    };
    logs.push(journey);
  }

  journey.iterations.push({
    iteration: journey.iterations.length + 1,
    tool: toolShort,
    score,
    failure_reasons: failureReasons,
    timestamp: new Date().toISOString(),
    status,
  });

  journey.updated_at = new Date().toISOString();

  // Track tool usage in WIE
  try { recordToolUsage(input.tool_name); } catch { /* non-blocking */ }

  // Close journey when black_validation passes
  if (toolShort === 'black_validation' && status === 'PASSED') {
    journey.final_status = 'PASSED';
  }

  // Self-learning pattern detection (requires >= 3 iterations)
  if (isValidation && journey.iterations.length >= 3) {
    learnPatterns(journey);
  }

  // WIE suggestions (requires >= 2 iterations)
  if (isValidation && journey.iterations.length >= 2) {
    applyWIESuggestions(journey, toolShort);
  }

  saveLog(offer, logs);

  // Feed self-learning loop
  if (isValidation && score !== null) {
    feedSelfLearning(offer, deliverable, toolShort, score, failureReasons, journey.iterations.length, status);
  }

  // Emit health indicator to stderr
  if (isValidation) {
    const indicator = score !== null
      ? score >= 8 ? '\uD83D\uDFE2' : score >= 6 ? '\uD83D\uDFE1' : '\uD83D\uDD34'
      : '\u26AA';

    const patternsMsg = journey.patterns_learned.length > 0
      ? ` | Patterns: ${journey.patterns_learned.length}`
      : '';

    console.error(
      `[JOURNEY] ${indicator} ${deliverable}: ${toolShort} ${score !== null ? `${score}/10` : 'N/A'} (iter #${journey.iterations.length})${patternsMsg}`
    );

    if (status === 'FAILED' && failureReasons.length > 0) {
      console.error(`  Issues: ${failureReasons.slice(0, 2).join('; ')}`);
    }

    // WIE wave analysis
    try {
      const waveSummary = getWaveSummary();
      if (waveSummary) {
        console.error(`[JOURNEY:WIE] ${waveSummary}`);
      }
    } catch { /* non-blocking */ }
  }

  return { handled: true };
}
