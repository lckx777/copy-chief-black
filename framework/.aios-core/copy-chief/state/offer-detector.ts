// ~/.claude/.aios-core/copy-chief/state/offer-detector.ts
// Offer detection and phase resolution for PostToolUse hooks
// Extracted from record-tool-in-offer.ts — v1.0 (2026-03-02)
//
// Priority order for offer detection:
//   1. tool_input.offer_path  (explicit param on MCP tools)
//   2. filesRead              (files read in session before the call)
//   3. activeOffer            (session-state fallback)

import {
  detectOfferFromPath,
  getOfferState,
} from './offer-state';
import { getSessionState } from './session-state';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** MCP tools whose usage is tracked against the active offer + HELIX phase */
export const TRACKABLE_TOOLS = [
  'mcp__copywriting__get_phase_context',
  'mcp__copywriting__voc_search',
  'mcp__copywriting__validate_gate',
  'mcp__copywriting__blind_critic',
  'mcp__copywriting__emotional_stress_test',
  'mcp__copywriting__layered_review',
  'mcp__copywriting__black_validation',
  'mcp__copywriting__write_chapter',
  'mcp__zen__consensus',
  'mcp__zen__thinkdeep',
  'mcp__zen__challenge',
  'mcp__sequential-thinking__sequentialthinking',
] as const;

export type TrackableTool = typeof TRACKABLE_TOOLS[number];

// Priority patterns for filesRead detection — more specific files first
const PRIORITY_FILE_PATTERNS = [
  /briefings\/phases\//i,
  /research\//i,
  /mecanismo-unico\.yaml$/i,
  /helix-state\.yaml$/i,
] as const;

// ---------------------------------------------------------------------------
// Phase detection from tool input
// ---------------------------------------------------------------------------

/**
 * Extracts the HELIX phase number directly from a tool's input params.
 * Currently only `get_phase_context` exposes a `phase` parameter.
 *
 * Returns null when the tool input provides no phase information.
 */
export function detectPhaseFromToolInput(
  toolName: string,
  input: Record<string, unknown>,
): number | null {
  if (toolName === 'mcp__copywriting__get_phase_context') {
    const phase = input.phase as number | undefined;
    if (phase && phase >= 1 && phase <= 10) {
      return phase;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Offer detection (3-priority)
// ---------------------------------------------------------------------------

/**
 * Resolves the active offer path using three priority levels:
 *
 *   1. `toolInput.offer_path`  — explicit param present on some MCP tools
 *   2. `sessionState.filesRead` — files already read in this session
 *   3. `sessionState.activeOffer` — last known active offer (session fallback)
 *
 * Returns null when no offer can be determined.
 */
export function detectOfferForTool(
  toolInput: Record<string, unknown>,
): string | null {
  const sessionState = getSessionState();

  // PRIORITY 1: Explicit offer_path in tool input
  if (toolInput.offer_path) {
    const path = toolInput.offer_path as string;
    console.error(`[OFFER-DETECTOR] P1 tool_input.offer_path: ${path}`);
    return path;
  }

  // PRIORITY 2: Infer from files already read in this session
  const filesRead = sessionState.filesRead ?? [];
  if (filesRead.length > 0) {
    // Check priority patterns first (briefings, research, mecanismo, helix-state)
    for (const pattern of PRIORITY_FILE_PATTERNS) {
      for (const file of filesRead) {
        if (pattern.test(file)) {
          const detected = detectOfferFromPath(file);
          if (detected) {
            console.error(`[OFFER-DETECTOR] P2a filesRead (priority pattern): ${detected}`);
            return detected;
          }
        }
      }
    }

    // Fall back to any offer-matching file
    for (const file of filesRead) {
      const detected = detectOfferFromPath(file);
      if (detected) {
        console.error(`[OFFER-DETECTOR] P2b filesRead (any): ${detected}`);
        return detected;
      }
    }
  }

  // PRIORITY 3: Session activeOffer fallback
  if (sessionState.activeOffer) {
    console.error(`[OFFER-DETECTOR] P3 activeOffer: ${sessionState.activeOffer}`);
    return sessionState.activeOffer;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Phase resolution from offer state
// ---------------------------------------------------------------------------

/**
 * Resolves which HELIX phase (1-10) to attribute a tool use to when the tool
 * input does not carry an explicit phase.
 *
 * Strategy:
 *   1. Return the first `in_progress` phase
 *   2. Return the first `not_started` phase (i.e., next to work on)
 *   3. Return null if all phases are completed or the state is unavailable
 */
export function resolvePhaseForOffer(offerPath: string): number | null {
  try {
    const state = getOfferState(offerPath);

    // Prefer a phase already in progress
    for (let i = 1; i <= 10; i++) {
      const phaseState = state.helix_phases[`phase_${i}`];
      if (phaseState?.status === 'in_progress') {
        return i;
      }
    }

    // Next not-started phase
    for (let i = 1; i <= 10; i++) {
      const phaseState = state.helix_phases[`phase_${i}`];
      if (phaseState?.status === 'not_started') {
        return i;
      }
    }
  } catch (e) {
    console.error(`[OFFER-DETECTOR] resolvePhaseForOffer error: ${e}`);
  }

  return null;
}
