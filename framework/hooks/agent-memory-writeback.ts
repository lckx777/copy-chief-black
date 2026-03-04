#!/usr/bin/env bun
// ~/.claude/hooks/agent-memory-writeback.ts (thin wrapper)
// Copy Chief BLACK — PostToolUse hook (Agent tool completion)
//
// When an Agent tool call completes, persists a learning entry to the
// persona's MEMORY.md file.
//
// Business logic: ~/.claude/.aios-core/copy-chief/memory/agent-memory-writeback.ts
// Registered for: PostToolUse (Agent)
// Timeout: 3000ms hard budget, always exits 0 (fail-open)

import { readFileSync } from 'fs';
import {
  type AgentToolEvent,
  handleAgentMemoryWriteback,
} from '../.aios-core/copy-chief/memory/agent-memory-writeback.ts';

const TIMEOUT_MS = 3000;

function main(): void {
  const startMs = Date.now();

  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }

    const data: AgentToolEvent = JSON.parse(raw);
    const result = handleAgentMemoryWriteback(data, startMs, TIMEOUT_MS);
    process.stdout.write(JSON.stringify(result));
  } catch (err: any) {
    // Fail-open: never block
    process.stdout.write(JSON.stringify({
      continue: true,
      feedback: `[AMW] Error (fail-open): ${String(err?.message || err)}`,
    }));
  }
}

main();
