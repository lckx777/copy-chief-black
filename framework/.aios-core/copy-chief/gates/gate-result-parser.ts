// ~/.claude/.aios-core/copy-chief/gates/gate-result-parser.ts
// Business logic extracted from gate-tracker.ts hook
// v7.0 - Gate output parsing (JSON + text fallback)
// Extracted: 2026-03-02

import { GateType } from '../state/session-state';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GateOutcome = 'PASSED' | 'BLOCKED' | 'UNKNOWN';

export interface ValidateGateParseResult {
  outcome: GateOutcome;
  reasons?: string;
}

export interface BlackValidationParseResult {
  score: number | null;
  passed: boolean;
}

// ─── Score extraction regex patterns ─────────────────────────────────────────

/** Matches "score: 8", "score 8.5", etc. (case-insensitive) */
export const SCORE_REGEX = /score[:\s]+(\d+(?:\.\d+)?)/i;

// ─── validate_gate output parser ─────────────────────────────────────────────

/**
 * Parses the tool_output of validate_gate.
 * Strategy: JSON parse → field check → text pattern fallback.
 */
export function parseValidateGateOutput(output: unknown): ValidateGateParseResult {
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

  // Attempt 1: JSON parse
  try {
    const result = typeof output === 'string' ? JSON.parse(output) : output;

    if (result && typeof result === 'object') {
      if ((result as Record<string, unknown>).result === 'PASSED') {
        return { outcome: 'PASSED' };
      }
      if ((result as Record<string, unknown>).result === 'BLOCKED') {
        const reasons = ((result as Record<string, unknown>).reasons as string[] | undefined)?.join(', ') || 'sem razões';
        return { outcome: 'BLOCKED', reasons };
      }
    }
  } catch {
    // Fall through to text detection
  }

  // Attempt 2: Text pattern detection
  if (/PASSED/i.test(outputStr)) {
    return { outcome: 'PASSED' };
  }
  if (/BLOCKED/i.test(outputStr)) {
    return { outcome: 'BLOCKED' };
  }

  return { outcome: 'UNKNOWN' };
}

// ─── black_validation output parser ──────────────────────────────────────────

/**
 * Parses the tool_output of black_validation.
 * Strategy: JSON parse → field check → regex fallback on raw string.
 * Returns null score if nothing can be extracted.
 */
export function parseBlackValidationOutput(output: unknown): BlackValidationParseResult {
  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

  // Attempt 1: JSON parse with known score fields
  try {
    const result = typeof output === 'string' ? JSON.parse(output) : output;

    if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      let score: number | null = null;

      if (typeof r.score === 'number') {
        score = r.score;
      } else if (typeof r.total_score === 'number') {
        score = r.total_score;
      } else if (typeof r.weighted_score === 'number') {
        score = r.weighted_score;
      }

      if (score !== null) {
        return { score, passed: score >= 8 };
      }
    }
  } catch {
    // Fall through to regex extraction
  }

  // Attempt 2: Regex on raw output string
  const scoreMatch = outputStr.match(SCORE_REGEX);
  if (scoreMatch) {
    const score = parseFloat(scoreMatch[1]);
    return { score, passed: score >= 8 };
  }

  return { score: null, passed: false };
}
