#!/usr/bin/env bun
/**
 * template-header-validation.ts — PreToolUse Hook (matcher: "Write|Edit")
 * Part of AIOS: Automated Intelligence Operating System
 *
 * Thin wrapper. All business logic in:
 * ~/.claude/.aios-core/copy-chief/quality/template-validator.ts
 *
 * Exit 0 always (warn-only, never blocks).
 */

import { runTemplateValidation } from "../.aios-core/copy-chief/quality/template-validator";

const MAX_EXECUTION_MS = 2000;
const startTime = Date.now();

async function main(): Promise<void> {
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(require('fs').readFileSync(0, 'utf8') as string) as Record<string, unknown>;
  } catch {
    return;
  }

  if (Date.now() - startTime > MAX_EXECUTION_MS) return;

  const result = runTemplateValidation(input as Parameters<typeof runTemplateValidation>[0]);

  if (result?.warningMessage) {
    console.error(result.warningMessage);
  }

  const elapsed = Date.now() - startTime;
  if (elapsed > 1000) {
    console.error(`  ⏱  template-header-validation took ${elapsed}ms (target: <${MAX_EXECUTION_MS}ms)`);
  }
}

main().catch(() => {
  // Never crash, never block
});
