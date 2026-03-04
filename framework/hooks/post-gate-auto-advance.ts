#!/usr/bin/env bun
/**
 * post-gate-auto-advance.ts — PostToolUse Hook (thin wrapper)
 *
 * Fires after validate_gate or black_validation completes.
 * If the gate PASSED and conditions are met, advances the offer phase.
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/workflow/gate-auto-advance.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  type PostToolUseInput,
  isGateTool,
  handleGateAutoAdvance,
} from '../.aios-core/copy-chief/workflow/gate-auto-advance.ts';

const HOME = require('os').homedir();

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);

    if (!isGateTool(input.tool_name)) { process.exit(0); return; }

    const r = handleGateAutoAdvance(input);

    if (r.blocked)        console.error(`[AUTO-ADVANCE] Blocked → production: ${r.blocked}`);
    else if (r.error)     console.error(`[AUTO-ADVANCE] ${r.error}`);
    else if (r.advanced)  {
      console.error(`[AUTO-ADVANCE] ${r.offerPath}: ${r.fromPhase} → ${r.toPhase}`);
      const q = join(HOME, '.claude/kernel/queue.json');
      if (existsSync(q))  console.error(`[AUTO-ADVANCE] Kernel: bun run ~/.claude/kernel/main.ts --offer ${r.offerPath} --phase ${r.toPhase}`);
    }
  } catch (error) {
    console.error(`[AUTO-ADVANCE] Error: ${error}`);
  }
  process.exit(0);
}

main();
