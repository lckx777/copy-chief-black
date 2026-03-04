#!/usr/bin/env bun
// ~/.claude/hooks/error-handler.ts
// PostToolUse hook for error recovery via 5-strategy escalation
// Wires recovery-handler.ts into the hook system
// Created: 2026-02-26

import { readFileSync } from 'fs';
import { executeRecovery, isAutoRecoverable, classifyError, type RecoveryContext } from '../.aios-core/copy-chief/recovery/recovery-handler';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
}

function detectOffer(): string {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^\/]+\/[^\/]+)/);
  return match ? match[1] : 'unknown';
}

function detectPhase(): string {
  // Simple phase detection from tool name
  const tool = process.env._LAST_TOOL || '';
  if (/firecrawl|playwright|voc_search/.test(tool)) return 'RESEARCH';
  if (/get_phase_context|consensus/.test(tool)) return 'BRIEFING';
  if (/write_chapter|blind_critic|emotional_stress_test/.test(tool)) return 'PRODUCTION';
  if (/black_validation/.test(tool)) return 'REVIEW';
  return 'UNKNOWN';
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);

    // Only process errors
    if (!input.is_error) {
      process.exit(0);
    }

    const errorMsg = input.tool_output || 'Unknown error';

    // Quick check: is this auto-recoverable?
    if (!isAutoRecoverable(errorMsg)) {
      const errorClass = classifyError(errorMsg);
      console.error(`[RECOVERY] PERMANENT error in ${input.tool_name}: ${errorMsg.slice(0, 100)}`);
      console.error(`[RECOVERY] Classification: ${errorClass}. Manual intervention may be needed.`);
      process.exit(0);
    }

    // Attempt recovery
    const ctx: RecoveryContext = {
      error: errorMsg,
      tool: input.tool_name,
      offer_path: detectOffer(),
      phase: detectPhase(),
      attempt_history: [],
    };

    const result = executeRecovery(ctx);

    if (result.resolved) {
      console.error(`[RECOVERY] Resolved via ${result.strategy_used} (${result.attempts} attempts): ${result.action_taken}`);
    } else {
      console.error(`[RECOVERY] Unresolved via ${result.strategy_used}: ${result.action_taken}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`[ERROR-HANDLER] Error: ${error}`);
    process.exit(0);
  }
}

main();
