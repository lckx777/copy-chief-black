#!/usr/bin/env bun
/**
 * post-validation-feedback.ts — Thin Hook Wrapper
 * PostToolUse hook for validation feedback recording.
 *
 * Business logic lives in:
 *   ~/.claude/.aios-core/copy-chief/feedback/validation-feedback.ts
 *
 * Triggers after: validate_gate, blind_critic, emotional_stress_test,
 *                 black_validation, layered_review
 */

import { readFileSync } from 'fs';
import { processHookEvent, PostToolUseInput } from '../.aios-core/copy-chief/feedback/validation-feedback';

async function main(): Promise<void> {
  try {
    const stdin = readFileSync(0, 'utf8').trim();
    let hookData: PostToolUseInput;
    try {
      hookData = JSON.parse(stdin);
    } catch {
      process.exit(0);
      return;
    }

    const result = await processHookEvent(hookData);

    if (result.processed) {
      process.stderr.write(result.message + '\n');
      for (const constraint of result.constraints) {
        process.stderr.write(`[FEEDBACK-LOOP]   Constraint: ${constraint}\n`);
      }
    }
  } catch (error) {
    // PostToolUse hooks must never block — fail silently
    process.stderr.write(`[FEEDBACK-LOOP] Error: ${error}\n`);
  }
  process.exit(0);
}

main();
