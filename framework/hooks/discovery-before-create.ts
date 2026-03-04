#!/usr/bin/env bun
/**
 * discovery-before-create.ts — PreToolUse Hook (thin wrapper)
 *
 * Before creating a NEW file, checks if similar files already exist nearby.
 * Implements "Discovery Before Implementation" principle.
 * Never blocks — warns via stderr only.
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/utils/file-discovery.ts
 */

import { readFileSync } from 'fs';
import {
  type PreToolUseInput,
  MAX_EXECUTION_MS,
  discoverSimilarFiles,
  formatDiscoveryWarning,
} from '../.aios-core/copy-chief/utils/file-discovery.ts';

function main(): void {
  const timeout = setTimeout(() => process.exit(0), MAX_EXECUTION_MS);

  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);
    const result = discoverSimilarFiles(input);
    if (result.shouldWarn) process.stderr.write(formatDiscoveryWarning(result));
  } catch (error) {
    try { process.stderr.write(`[DISCOVERY] Error: ${error}\n`); } catch {}
  }

  clearTimeout(timeout);
  process.exit(0); // NEVER block
}

main();
