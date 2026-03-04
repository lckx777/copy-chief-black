#!/usr/bin/env bun
// ~/.claude/hooks/record-tool-in-offer.ts
// PostToolUse hook — records HELIX-relevant MCP tools against the active offer.
// Business logic lives in copy-chief/state/offer-detector.ts
// v8.0 (thin wrapper) — 2026-03-02

import { readFileSync } from 'fs';
import {
  recordToolUseInPhase,
  normalizeToolName,
} from '../.aios-core/copy-chief/state/offer-state';
import { loadMachine, recordTool } from '../.aios-core/copy-chief/state/state-machine';
import {
  TRACKABLE_TOOLS,
  detectPhaseFromToolInput,
  detectOfferForTool,
  resolvePhaseForOffer,
} from '../.aios-core/copy-chief/state/offer-detector';

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_result?: unknown;
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);
    const { tool_name: toolName, tool_input: toolInput } = input;

    // Skip non-tracked tools immediately
    if (!(TRACKABLE_TOOLS as readonly string[]).includes(toolName)) {
      console.log(JSON.stringify({}));
      process.exit(0);
    }

    // Resolve offer (3-priority detection)
    const offerPath = detectOfferForTool(toolInput);
    if (!offerPath) {
      console.error(`[RECORD-TOOL] No offer detected for: ${toolName}`);
      console.error(`[RECORD-TOOL] Debug: offer_path=${toolInput?.offer_path}, filesRead and activeOffer checked`);
      console.log(JSON.stringify({}));
      process.exit(0);
    }

    // Resolve phase: explicit from tool input, then infer from offer state
    const phase =
      detectPhaseFromToolInput(toolName, toolInput) ??
      resolvePhaseForOffer(offerPath);

    if (!phase) {
      console.error(`[RECORD-TOOL] Cannot determine phase for: ${toolName} / ${offerPath}`);
      console.log(JSON.stringify({}));
      process.exit(0);
    }

    // Record in offer state (legacy helix-state.yaml)
    const normalizedTool = normalizeToolName(toolName);
    recordToolUseInPhase(offerPath, phase, normalizedTool);

    // Record in state machine (v8.0+)
    try {
      const machine = loadMachine(offerPath);
      recordTool(machine, toolName);
    } catch (e) {
      console.error(`[RECORD-TOOL] State machine record failed: ${e}`);
    }

    console.error(`[RECORD-TOOL] Recorded: ${normalizedTool} @ phase ${phase} for ${offerPath}`);
    console.log(JSON.stringify({}));
    process.exit(0);

  } catch (error) {
    console.error(`[RECORD-TOOL] Error: ${error}`);
    console.log(JSON.stringify({}));
    process.exit(0);
  }
}

main();
