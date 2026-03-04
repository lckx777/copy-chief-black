#!/usr/bin/env bun
// ~/.claude/hooks/memory-auto-populate.ts
// AIOS Memory — PostToolUse hook
//
// Thin wrapper. All business logic in:
// ~/.claude/.aios-core/copy-chief/memory/memory-populator.ts
//
// Registered for: PostToolUse (Write | Edit | mcp__copywriting__validate_gate)
// Output: stdout JSON { "continue": true }
// Fail-open: any error silently exits with continue=true

import { readFileSync } from "fs";
import { runMemoryPopulate } from "../.aios-core/copy-chief/memory/memory-populator";

function ok(): void {
  process.stdout.write(JSON.stringify({ continue: true }) + "\n");
}

function main(): void {
  let input: Record<string, unknown> = {};
  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    ok();
    return;
  }

  try {
    runMemoryPopulate(input as Parameters<typeof runMemoryPopulate>[0]);
  } catch {
    // fail-open: never block the agent
  }

  ok();
}

main();
