#!/usr/bin/env bun
/**
 * mecanismo-validation.ts — PreToolUse Hook (thin wrapper)
 * Enforces Mecanismo Unico validation before production writes.
 *
 * Exit conventions:
 *   Allow → exit 0
 *   Block → print message to stdout, process.exit(2)
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/gates/mecanismo-gate.ts
 * Refactored: 2026-03-02
 */

import { readFileSync } from 'fs';
import { preToolUse, HookInput } from '../.aios-core/copy-chief/gates/mecanismo-gate';

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);
    const result = preToolUse(input);

    if (result.decision === 'block') {
      console.log(result.message || 'Blocked by mecanismo-validation');
      process.exit(2);
    }

    process.exit(0);
  } catch {
    // Parse errors or unexpected issues — allow to avoid blocking
    process.exit(0);
  }
}

main();
