#!/usr/bin/env bun
// ~/.claude/hooks/session-handoff.ts — Thin Hook Wrapper
// Stop hook — generates structured handoff files at session end.
//
// Business logic lives in:
//   ~/.claude/.aios-core/copy-chief/lifecycle/session-handoff.ts

import { readFileSync, mkdirSync, appendFileSync } from 'fs';
import { processHookEvent, StopInput, SESSION_STATE_DIR } from '../.aios-core/copy-chief/lifecycle/session-handoff';

const HOME = process.env.HOME || '/tmp';

async function main(): Promise<void> {
  try {
    let input: StopInput = {};
    try {
      const stdin = readFileSync(0, 'utf8');
      input = JSON.parse(stdin || '{}');
    } catch {
      // stdin not available or not JSON — proceed with defaults
    }

    // Prevent infinite loop guard
    if ((input as any).stop_hook_active) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }

    const result = await processHookEvent(input);

    process.stderr.write(`[HANDOFF] Session saved → ${result.handoffFile}\n`);
    process.stderr.write(`[HANDOFF] Offer: ${result.offer} | Phase: ${result.phase} | Pending: ${result.pendingCount} tasks\n`);

    process.exit(0);
  } catch (err) {
    // FAIL-OPEN: log error silently, never block session end
    try {
      const logDir = `${HOME}/.claude/logs`;
      try { mkdirSync(logDir, { recursive: true }); } catch { /* ignore */ }
      appendFileSync(
        `${logDir}/hook-errors.log`,
        `[${new Date().toISOString()}] session-handoff: ${err}\n`,
      );
    } catch { /* ignore */ }
    process.exit(0);
  }
}

main();
