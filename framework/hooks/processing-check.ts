#!/usr/bin/env bun
/**
 * processing-check.ts — PreToolUse Hook (warn only, thin wrapper)
 *
 * Checks if URLs/paths in research extraction tool calls have been
 * processed before. Warns via stderr if found within TTL. Non-blocking.
 * Triggers on: firecrawl_*, mcp__apify__*, mcp__playwright__*
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/utils/processing-registry.ts
 */

import { readFileSync } from 'fs';
import {
  type HookInput,
  checkForDuplicates,
  formatWarnings,
} from '../.aios-core/copy-chief/utils/processing-registry.ts';

function main(): void {
  // Hard timeout: exit after 2 seconds no matter what
  const timeout = setTimeout(() => process.exit(0), 2000);

  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) { clearTimeout(timeout); process.exit(0); }

    const input: HookInput = JSON.parse(raw);
    const warnings = checkForDuplicates(input);

    if (warnings.length > 0) {
      process.stderr.write(formatWarnings(warnings));
    }
  } catch {
    /* silent fail — non-blocking */
  }

  clearTimeout(timeout);
  process.exit(0); // Never block
}

main();
