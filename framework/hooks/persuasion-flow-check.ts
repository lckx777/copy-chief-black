#!/usr/bin/env bun
/**
 * persuasion-flow-check.ts — PostToolUse Hook (matcher: "Write|Edit")
 * Part of AIOS: Automated Intelligence Operating System
 *
 * Thin wrapper. All business logic in:
 * ~/.claude/.aios-core/copy-chief/quality/persuasion-flow.ts
 *
 * Exit 0 always (warn-only, never blocks).
 */

import { readFileSync } from "fs";
import { runPersuasionFlowCheck } from "../.aios-core/copy-chief/quality/persuasion-flow";

const MAX_EXECUTION_MS = 3000;
const timeout = setTimeout(() => {
  console.error("[FLOW-CHECK] ⏰ Timeout — skipping");
  process.exit(0);
}, MAX_EXECUTION_MS);

try {
  const stdin = readFileSync(0, 'utf8');
  const input = JSON.parse(stdin);

  const result = runPersuasionFlowCheck(input);

  if (result?.warningMessage) {
    console.error(result.warningMessage);
  }
} catch (err) {
  console.error(`[FLOW-CHECK] Error: ${err}`);
}

clearTimeout(timeout);
process.exit(0);
