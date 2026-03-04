#!/usr/bin/env bun
/**
 * clickup-gate-sync.ts — PostToolUse Hook (thin wrapper)
 * Syncs gate results (validate_gate, black_validation) to ClickUp.
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/integrations/clickup-client.ts
 * Created: 2026-02-25 | Refactored: 2026-03-02
 */

import { readFileSync } from 'fs';
import {
  GATE_TOOLS,
  extractOfferPath,
  extractGateResult,
  loadSyncConfig,
  syncGateResult,
} from '../.aios-core/copy-chief/integrations/clickup-client';

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);

    if (!GATE_TOOLS.includes(input.tool_name)) { process.exit(0); return; }

    const offerPath = extractOfferPath(input.tool_input);
    if (!offerPath) { process.exit(0); return; }

    const syncConfig = loadSyncConfig(offerPath);
    if (!syncConfig) { process.exit(0); return; }

    const gateResult = extractGateResult(input.tool_output);
    if (!gateResult) { process.exit(0); return; }

    syncGateResult(offerPath, syncConfig, gateResult);

  } catch (error) {
    console.error(`[CLICKUP-SYNC] Error: ${error}`);
    process.exit(0);
  }
}

main();
