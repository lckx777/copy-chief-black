#!/usr/bin/env bun
/**
 * Hook: post-mcp-mecanismo-update.ts (thin wrapper)
 *
 * Automatically updates mecanismo-unico.yaml state after MCP validation tools pass.
 * Triggers: PostToolUse — consensus, blind_critic, emotional_stress_test
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/state/mecanismo-updater.ts
 */

import * as fs from 'fs';
import { postToolUse, type HookInput } from '../.aios-core/copy-chief/state/mecanismo-updater.ts';

function main(): void {
  try {
    const stdin = fs.readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);
    const result = postToolUse(input);

    if (result.message) {
      console.log(result.message);
    }
    process.exit(0);
  } catch {
    // Parse errors or unexpected issues — exit cleanly
    process.exit(0);
  }
}

main();
