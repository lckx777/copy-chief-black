#!/usr/bin/env bun
/**
 * dashboard-emit.ts — PostToolUse hook
 * Part of AIOS: Automated Intelligence Operating System
 *
 * Thin wrapper. All business logic in:
 * ~/.claude/.aios-core/copy-chief/observability/dashboard-client.ts
 *
 * Exit 0 always (fire-and-forget, non-blocking).
 */

import { readFileSync } from "fs";
import { emitDashboardEvent, recordToolStart } from "../.aios-core/copy-chief/observability/dashboard-client";

async function main(): Promise<void> {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input = JSON.parse(stdin);
    await emitDashboardEvent(input);
  } catch {
    // Never block
  }
  process.exit(0);
}

main();

// Export for companion hook (PreToolUse tool-start recorder)
export { recordToolStart };
