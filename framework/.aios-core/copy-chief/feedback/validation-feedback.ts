#!/usr/bin/env bun
/**
 * validation-feedback.ts — Validation Feedback Loop Module
 * copy-chief/feedback/validation-feedback.ts
 *
 * Extracted from ~/.claude/hooks/post-validation-feedback.ts (451L)
 * Handles: score extraction, feedback entry management, stats tracking,
 * constraint suggestions, and feedback file persistence.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ─── Constants ──────────────────────────────────────────────────────────────

const HOME = homedir();
export const KNOWLEDGE_DIR = join(HOME, '.claude/knowledge');
export const FEEDBACK_FILE = join(KNOWLEDGE_DIR, 'feedback-loops.yaml');
const SESSION_FILE = join(HOME, '.claude/session-state/current-session.json');

export const VALIDATION_TOOLS: Record<string, { threshold: number; type: 'score' | 'gate' }> = {
  'validate_gate':          { threshold: 0, type: 'gate' },
  'blind_critic':           { threshold: 8, type: 'score' },
  'emotional_stress_test':  { threshold: 8, type: 'score' },
  'black_validation':       { threshold: 8, type: 'score' },
  'layered_review':         { threshold: 8, type: 'score' },
};

export const TOOL_NAME_MAP: Record<string, string> = {
  'mcp__copywriting__validate_gate': 'validate_gate',
  'mcp__copywriting__blind_critic': 'blind_critic',
  'mcp__copywriting__emotional_stress_test': 'emotional_stress_test',
  'mcp__copywriting__black_validation': 'black_validation',
  'mcp__copywriting__layered_review': 'layered_review',
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string | Record<string, unknown>;
  is_error?: boolean;
}

export interface SessionState {
  activeOffer: string | null;
  currentPhase: string;
  [key: string]: unknown;
}

export interface FeedbackEntry {
  timestamp: string;
  tool: string;
  offer: string;
  niche: string;
  phase: string;
  score: number | null;
  threshold: number;
  passed: boolean;
  details: string;
  constraints_added: string[];
}

export interface FeedbackResult {
  processed: boolean;
  tool: string;
  offer: string;
  passed: boolean;
  score: number | null;
  constraints: string[];
  message: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function normalizeToolName(toolName: string): string | null {
  if (TOOL_NAME_MAP[toolName]) return TOOL_NAME_MAP[toolName];
  for (const canonical of Object.keys(VALIDATION_TOOLS)) {
    if (toolName.includes(canonical)) return canonical;
  }
  return null;
}

export function extractScore(output: any): { score: number | null; details: string } {
  if (!output) return { score: null, details: 'No output' };

  const str = typeof output === 'string' ? output : JSON.stringify(output);

  try {
    const parsed = typeof output === 'string' ? JSON.parse(output) : output;

    if (typeof parsed.score === 'number') return { score: parsed.score, details: `Score: ${parsed.score}` };
    if (typeof parsed.total_score === 'number') return { score: parsed.total_score, details: `Total Score: ${parsed.total_score}` };
    if (typeof parsed.weighted_score === 'number') return { score: parsed.weighted_score, details: `Weighted Score: ${parsed.weighted_score}` };
    if (typeof parsed.overall_score === 'number') return { score: parsed.overall_score, details: `Overall Score: ${parsed.overall_score}` };
    if (typeof parsed.media === 'number') return { score: parsed.media, details: `Media: ${parsed.media}` };
    if (typeof parsed.average === 'number') return { score: parsed.average, details: `Average: ${parsed.average}` };

    if (parsed.result && typeof parsed.result.score === 'number') {
      return { score: parsed.result.score, details: `Result Score: ${parsed.result.score}` };
    }
  } catch {
    // Not JSON, fall through to regex
  }

  const patterns = [
    /(?:score|nota|media|average|overall|total)[:\s]*(\d+\.?\d*)(?:\s*\/\s*10)?/i,
    /(\d+\.?\d*)\s*\/\s*10/,
    /(?:genericidade|specificidade|especificidade)[:\s]*(\d+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 0 && score <= 10) {
        return { score, details: `Extracted: ${match[0]}` };
      }
    }
  }

  return { score: null, details: `Could not extract score from output (${str.slice(0, 100)})` };
}

export function extractGateResult(output: any): { passed: boolean; details: string } {
  if (!output) return { passed: false, details: 'No output' };

  const str = typeof output === 'string' ? output : JSON.stringify(output);

  try {
    const parsed = typeof output === 'string' ? JSON.parse(output) : output;
    if (parsed.result === 'PASSED') return { passed: true, details: 'Gate PASSED' };
    if (parsed.result === 'BLOCKED') {
      const reasons = parsed.reasons?.join(', ') || 'no reasons provided';
      return { passed: false, details: `Gate BLOCKED: ${reasons}` };
    }
  } catch {}

  if (/PASSED/i.test(str)) return { passed: true, details: 'Gate PASSED (text)' };
  if (/BLOCKED/i.test(str)) return { passed: false, details: 'Gate BLOCKED (text)' };

  return { passed: false, details: `Unknown gate result: ${str.slice(0, 100)}` };
}

export function getSessionState(): SessionState {
  try {
    if (existsSync(SESSION_FILE)) {
      return JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch {}
  return { activeOffer: null, currentPhase: 'unknown' };
}

export function extractNiche(offer: string): string {
  const parts = offer.split('/');
  return parts.length >= 2 ? parts[0] : 'unknown';
}

function escapeYaml(s: string): string {
  return s.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ─── Feedback File Management ───────────────────────────────────────────────

export function ensureFeedbackFile(): void {
  if (!existsSync(KNOWLEDGE_DIR)) {
    mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }

  if (!existsSync(FEEDBACK_FILE)) {
    const initial = [
      '# Validation Feedback Loops',
      '# Records scores from validation MCPs for pattern analysis',
      `# Created: ${new Date().toISOString()}`,
      'version: "1.0.0"',
      '',
      'loops: []',
      '',
      'stats:',
      '  total_validations: 0',
      '  total_passed: 0',
      '  total_failed: 0',
      '  avg_score: 0',
      '  by_tool:',
      '    blind_critic: { count: 0, avg: 0, pass_rate: 0 }',
      '    emotional_stress_test: { count: 0, avg: 0, pass_rate: 0 }',
      '    black_validation: { count: 0, avg: 0, pass_rate: 0 }',
      '    layered_review: { count: 0, avg: 0, pass_rate: 0 }',
      '    validate_gate: { count: 0, passes: 0, blocks: 0 }',
      '',
    ].join('\n');
    writeFileSync(FEEDBACK_FILE, initial);
  }
}

export function appendFeedbackEntry(entry: FeedbackEntry): void {
  ensureFeedbackFile();

  const content = readFileSync(FEEDBACK_FILE, 'utf-8');

  const yamlEntry = [
    `  - timestamp: "${entry.timestamp}"`,
    `    tool: "${entry.tool}"`,
    `    offer: "${escapeYaml(entry.offer)}"`,
    `    niche: "${escapeYaml(entry.niche)}"`,
    `    phase: "${escapeYaml(entry.phase)}"`,
    `    score: ${entry.score !== null ? entry.score : 'null'}`,
    `    threshold: ${entry.threshold}`,
    `    passed: ${entry.passed}`,
    `    details: "${escapeYaml(entry.details)}"`,
    `    constraints_added: [${entry.constraints_added.map(c => `"${escapeYaml(c)}"`).join(', ')}]`,
  ].join('\n');

  let updated: string;
  if (content.includes('loops: []')) {
    updated = content.replace('loops: []', `loops:\n${yamlEntry}`);
  } else if (content.includes('loops:')) {
    const metaPatternsRegex = /\n(?:\s*\n)*(?:#[^\n]*\n)*meta_patterns:/;
    const statsBlockRegex = /\n(?:\s*\n)*(?:#[^\n]*\n)*stats:/;
    const metaMatch = content.match(metaPatternsRegex);
    const statsMatch = content.match(statsBlockRegex);

    let insertAt: number;
    if (metaMatch && metaMatch.index !== undefined) {
      insertAt = metaMatch.index;
    } else if (statsMatch && statsMatch.index !== undefined) {
      insertAt = statsMatch.index;
    } else {
      updated = content.trimEnd() + '\n' + yamlEntry + '\n';
      updated = updateStats(updated, entry);
      writeFileSync(FEEDBACK_FILE, updated);
      return;
    }

    const before = content.slice(0, insertAt);
    const after = content.slice(insertAt);
    updated = before + '\n' + yamlEntry + after;
  } else {
    updated = content.trimEnd() + '\nloops:\n' + yamlEntry + '\n';
  }

  updated = updateStats(updated, entry);
  writeFileSync(FEEDBACK_FILE, updated);
}

export function updateStats(content: string, entry: FeedbackEntry): string {
  let updated = content;

  updated = updated.replace(
    /(total_validations(?:_historical)?):\s*(\d+)/,
    (match, key, n) => `${key}: ${parseInt(n) + 1}`
  );

  if (entry.passed) {
    updated = updated.replace(
      /(total_passed(?:_historical)?):\s*(\d+)/,
      (match, key, n) => `${key}: ${parseInt(n) + 1}`
    );
  } else {
    updated = updated.replace(
      /(total_failed(?:_historical)?):\s*(\d+)/,
      (match, key, n) => `${key}: ${parseInt(n) + 1}`
    );
  }

  const toolKey = entry.tool;
  if (toolKey === 'validate_gate') {
    const gateStatRegex = new RegExp(`(validate_gate:\\s*\\{[^}]*?)passes:\\s*(\\d+)`, 's');
    const gateBlockRegex = new RegExp(`(validate_gate:\\s*\\{[^}]*?)blocks:\\s*(\\d+)`, 's');
    const gateCountRegex = new RegExp(`(validate_gate:\\s*\\{[^}]*?)count:\\s*(\\d+)`, 's');

    updated = updated.replace(gateCountRegex, (_, prefix, n) => `${prefix}count: ${parseInt(n) + 1}`);
    if (entry.passed) {
      updated = updated.replace(gateStatRegex, (_, prefix, n) => `${prefix}passes: ${parseInt(n) + 1}`);
    } else {
      updated = updated.replace(gateBlockRegex, (_, prefix, n) => `${prefix}blocks: ${parseInt(n) + 1}`);
    }
  } else {
    const toolCountRegex = new RegExp(`(${toolKey}:\\s*\\{[^}]*?)count:\\s*(\\d+)`, 's');
    updated = updated.replace(toolCountRegex, (_, prefix, n) => `${prefix}count: ${parseInt(n) + 1}`);
  }

  return updated;
}

// ─── Constraint Suggestions ─────────────────────────────────────────────────

export function suggestConstraints(entry: FeedbackEntry): string[] {
  const constraints: string[] = [];

  if (entry.tool === 'blind_critic' && entry.score !== null && entry.score < 8) {
    constraints.push(`${entry.niche}: blind_critic scored ${entry.score}/10 — increase specificity, add VOC quotes, use non-round numbers`);
  }

  if (entry.tool === 'emotional_stress_test' && entry.score !== null && entry.score < 8) {
    constraints.push(`${entry.niche}: emotional_stress_test scored ${entry.score}/10 — increase emotional escalation to level 4-5, add sensory details`);
  }

  if (entry.tool === 'black_validation' && entry.score !== null && entry.score < 8) {
    constraints.push(`${entry.niche}: black_validation scored ${entry.score}/10 — review anti-homogenization rules, check Logo Test, verify mecanismo unico`);
  }

  if (entry.tool === 'layered_review' && entry.score !== null && entry.score < 8) {
    constraints.push(`${entry.niche}: layered_review scored ${entry.score}/10 — run 3-layer review: structure, emotion, specificity`);
  }

  if (entry.tool === 'validate_gate' && !entry.passed) {
    constraints.push(`${entry.niche}: validate_gate BLOCKED — check required tools for ${entry.phase} phase`);
  }

  return constraints;
}

// ─── Main Hook Entry Point ───────────────────────────────────────────────────

/**
 * Process a PostToolUse event for validation feedback tracking.
 * Returns structured result for hook output.
 */
export async function processHookEvent(hookData: PostToolUseInput): Promise<FeedbackResult> {
  const toolName = hookData.tool_name || '';
  const canonical = normalizeToolName(toolName);

  if (!canonical) {
    return { processed: false, tool: toolName, offer: '', passed: false, score: null, constraints: [], message: 'Not a validation tool' };
  }

  const toolConfig = VALIDATION_TOOLS[canonical];
  if (!toolConfig) {
    return { processed: false, tool: canonical, offer: '', passed: false, score: null, constraints: [], message: 'Unknown tool config' };
  }

  if (hookData.is_error) {
    return { processed: false, tool: canonical, offer: '', passed: false, score: null, constraints: [], message: 'Tool errored, skipping' };
  }

  const session = getSessionState();
  const offer = session.activeOffer || 'unknown/unknown';
  const niche = extractNiche(offer);
  const phase = session.currentPhase || 'unknown';

  let score: number | null = null;
  let passed = false;
  let details = '';

  if (toolConfig.type === 'gate') {
    const gateResult = extractGateResult(hookData.tool_output);
    passed = gateResult.passed;
    details = gateResult.details;
    score = passed ? 1 : 0;
  } else {
    const scoreResult = extractScore(hookData.tool_output);
    score = scoreResult.score;
    details = scoreResult.details;
    passed = score !== null && score >= toolConfig.threshold;
  }

  const entry: FeedbackEntry = {
    timestamp: new Date().toISOString(),
    tool: canonical,
    offer,
    niche,
    phase,
    score: toolConfig.type === 'gate' ? null : score,
    threshold: toolConfig.threshold,
    passed,
    details,
    constraints_added: [],
  };

  if (!passed) {
    entry.constraints_added = suggestConstraints(entry);
  }

  appendFeedbackEntry(entry);

  const scoreDisplay = score !== null && toolConfig.type !== 'gate' ? ` (${score}/10)` : '';
  const status = passed ? `PASSED${scoreDisplay}` : `FAILED ${score}/${toolConfig.threshold}`;
  const message = `[FEEDBACK-LOOP] ${canonical} → ${status} for ${offer}`;

  return {
    processed: true,
    tool: canonical,
    offer,
    passed,
    score: toolConfig.type === 'gate' ? null : score,
    constraints: entry.constraints_added,
    message,
  };
}
