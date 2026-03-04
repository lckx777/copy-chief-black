#!/usr/bin/env bun
/**
 * self-critique-preflight.ts — PreToolUse Hook (matcher: "Write|Edit")
 * Part of AIOS: Automated Intelligence Operating System
 *
 * Thin wrapper. All business logic in:
 * ~/.claude/.aios-core/copy-chief/quality/self-critique.ts
 *
 * Exit 0 always (warn-only, never blocks).
 */

import { readFileSync } from "fs";
import { runSelfCritique } from "../.aios-core/copy-chief/quality/self-critique";

const MAX_EXECUTION_MS = 3000;
const timeout = setTimeout(() => process.exit(0), MAX_EXECUTION_MS);

try {
  let stdin = "";
  try {
    stdin = readFileSync(0, 'utf8');
  } catch {
    clearTimeout(timeout);
    process.exit(0);
  }

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(stdin);
  } catch {
    clearTimeout(timeout);
    process.exit(0);
  }

  const result = runSelfCritique(input as Parameters<typeof runSelfCritique>[0]);

  if (result?.warningMessage) {
    process.stderr.write(result.warningMessage + "\n");
  }
} catch (err) {
  try { process.stderr.write(`[SELF-CRITIQUE] Error: ${err}\n`); } catch {}
}

clearTimeout(timeout);
process.exit(0);
