/**
 * gate-auto-advance.ts — Copy Chief OS Layer
 * copy-chief/workflow/gate-auto-advance.ts
 *
 * Business logic for auto-advancing HELIX phase after a gate tool passes.
 * Handles gate result extraction, offer path finding, phase advancement
 * (YAML mutation), and mecanismo state checking.
 *
 * Used by hook: ~/.claude/hooks/post-gate-auto-advance.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
}

export interface GateResult {
  passed: boolean;
  score: number;
  gate: string;
}

export interface AdvanceResult {
  advanced: boolean;
  offerPath: string | null;
  fromPhase: string;
  toPhase: string | null;
  blocked?: string;
  error?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const HOME = homedir();
export const ECOSYSTEM_DIR = join(HOME, 'copywriting-ecosystem');

export const PHASE_ORDER = ['idle', 'research', 'briefing', 'production', 'delivered'];

export const GATE_TOOLS = [
  'mcp__copywriting__validate_gate',
  'mcp__copywriting__black_validation',
  'validate_gate',
  'black_validation',
];

// ─── Gate detection ───────────────────────────────────────────────────────────

export function isGateTool(toolName: string): boolean {
  if (!toolName) return false;
  return GATE_TOOLS.some((g) =>
    toolName.includes(g.replace('mcp__copywriting__', '')),
  );
}

/**
 * Extract gate result (passed, score, gate name) from tool output.
 * Returns null if the output cannot be interpreted.
 */
export function extractGateResult(output: unknown): GateResult | null {
  if (!output) return null;

  const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

  const passedMatch = outputStr.match(
    /(?:passed|aprovado|PASSED)[:\s]*(?:true|sim|yes)/i,
  );
  const scoreMatch = outputStr.match(
    /(?:score|nota|confidence)[:\s]*(\d+\.?\d*)/i,
  );
  const gateMatch = outputStr.match(/(?:gate|fase)[:\s]*["']?(\w+)/i);

  if (!passedMatch && !scoreMatch) return null;

  return {
    passed: !!passedMatch,
    score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
    gate: gateMatch ? gateMatch[1].toLowerCase() : 'unknown',
  };
}

// ─── Offer path resolution ────────────────────────────────────────────────────

/**
 * Attempt to resolve offer path from tool input.
 * Checks path patterns in serialised input, then falls back to router log.
 */
export function findOfferPath(toolInput: Record<string, unknown>): string | null {
  const inputStr = JSON.stringify(toolInput);

  const pathMatch = inputStr.match(/(\w[\w-]*\/[\w-]+)/);
  if (pathMatch) {
    const candidate = pathMatch[1];
    if (existsSync(join(ECOSYSTEM_DIR, candidate, 'helix-state.yaml'))) {
      return candidate;
    }
  }

  const gateInput = (toolInput.gate_name || toolInput.gate || '') as string;
  if (gateInput) {
    const logPath = join(HOME, '.claude/router-log.jsonl');
    if (existsSync(logPath)) {
      try {
        const lines = readFileSync(logPath, 'utf-8').trim().split('\n').reverse();
        for (const line of lines.slice(0, 10)) {
          const entry = JSON.parse(line);
          if (entry.offer) return entry.offer;
        }
      } catch {
        /* ignore */
      }
    }
  }

  return null;
}

// ─── Phase advancement ────────────────────────────────────────────────────────

/**
 * Mutate helix-state.yaml to advance current_phase to the next phase
 * and mark the gate as passed.
 */
export function advancePhase(offerPath: string, fromPhase: string): boolean {
  const helixPath = join(ECOSYSTEM_DIR, offerPath, 'helix-state.yaml');
  if (!existsSync(helixPath)) return false;

  const currentIdx = PHASE_ORDER.indexOf(fromPhase);
  if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) return false;

  const nextPhase = PHASE_ORDER[currentIdx + 1];

  try {
    let content = readFileSync(helixPath, 'utf-8');

    content = content.replace(
      /current_phase:\s*["']?\w+["']?/i,
      `current_phase: "${nextPhase}"`,
    );

    const gateKey = fromPhase;
    if (!content.includes(`${gateKey}:`)) {
      const gatesMatch = content.match(/gates:/);
      if (gatesMatch) {
        content = content.replace(
          /gates:/,
          `gates:\n  ${gateKey}:\n    passed: true\n    passed_at: "${new Date().toISOString()}"`,
        );
      }
    } else {
      const gateRegex = new RegExp(`(${gateKey}:[\\s\\S]*?)passed:\\s*\\w+`, 'i');
      content = content.replace(gateRegex, `$1passed: true`);
    }

    writeFileSync(helixPath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// ─── Mecanismo guard ──────────────────────────────────────────────────────────

/**
 * Check if mecanismo state allows advancing to production.
 * Returns null if OK, or a string describing why it is blocked.
 */
export function checkMecanismoGuard(offerPath: string): string | null {
  const helixPath = join(ECOSYSTEM_DIR, offerPath, 'helix-state.yaml');
  if (!existsSync(helixPath)) return null; // no file → can't check, allow

  const content = readFileSync(helixPath, 'utf-8');
  const mecMatch = content.match(/mecanismo_state:\s*["']?(\w+)/i);
  const mecState = mecMatch ? mecMatch[1] : 'UNDEFINED';

  if (!['VALIDATED', 'APPROVED'].includes(mecState)) {
    return `mecanismo state is "${mecState}" (needs VALIDATED/APPROVED)`;
  }
  return null;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Process a PostToolUse event from a gate tool.
 * Returns a structured result describing what happened.
 */
export function handleGateAutoAdvance(input: PostToolUseInput): AdvanceResult {
  if (!isGateTool(input.tool_name)) {
    return { advanced: false, offerPath: null, fromPhase: '', toPhase: null };
  }

  const gateResult = extractGateResult(input.tool_output);
  if (!gateResult) {
    return { advanced: false, offerPath: null, fromPhase: '', toPhase: null };
  }

  if (!gateResult.passed) {
    return {
      advanced: false,
      offerPath: null,
      fromPhase: gateResult.gate,
      toPhase: null,
    };
  }

  const offerPath = findOfferPath(input.tool_input);
  if (!offerPath) {
    return {
      advanced: false,
      offerPath: null,
      fromPhase: gateResult.gate,
      toPhase: null,
      error: "Gate passed but couldn't determine offer path",
    };
  }

  const currentPhase = gateResult.gate;
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  if (currentIdx <= 0 || currentIdx >= PHASE_ORDER.length - 1) {
    return {
      advanced: false,
      offerPath,
      fromPhase: currentPhase,
      toPhase: null,
      error: `Gate "${currentPhase}" not in phase order`,
    };
  }

  const nextPhase = PHASE_ORDER[currentIdx + 1];

  // Block on mecanismo guard when advancing to production
  if (nextPhase === 'production') {
    const blocked = checkMecanismoGuard(offerPath);
    if (blocked) {
      return {
        advanced: false,
        offerPath,
        fromPhase: currentPhase,
        toPhase: nextPhase,
        blocked,
      };
    }
  }

  const advanced = advancePhase(offerPath, currentPhase);

  return {
    advanced,
    offerPath,
    fromPhase: currentPhase,
    toPhase: nextPhase,
    error: advanced ? undefined : `Failed to write helix-state.yaml for ${offerPath}`,
  };
}
