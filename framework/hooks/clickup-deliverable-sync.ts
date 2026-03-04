#!/usr/bin/env bun
/**
 * clickup-deliverable-sync.ts — PostToolUse Hook (thin wrapper)
 * Syncs deliverable writes (production/ files) to ClickUp.
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/integrations/clickup-client.ts
 * Created: 2026-02-25 | Refactored: 2026-03-02
 */

import { readFileSync } from 'fs';
import {
  extractFilePath,
  isProductionFile,
  extractOfferFromPath,
  extractDeliverableType,
  loadSyncConfig,
  syncDeliverableWrite,
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

    if (!['Write', 'Edit'].includes(input.tool_name)) { process.exit(0); return; }

    const filePath = extractFilePath(input.tool_input);
    if (!filePath || !isProductionFile(filePath)) { process.exit(0); return; }

    const offerPath = extractOfferFromPath(filePath);
    if (!offerPath) { process.exit(0); return; }

    const syncConfig = loadSyncConfig(offerPath);
    if (!syncConfig) { process.exit(0); return; }

    const deliverableType = extractDeliverableType(filePath);
    if (!deliverableType) { process.exit(0); return; }

    syncDeliverableWrite(offerPath, syncConfig, deliverableType, filePath);

  } catch (error) {
    console.error(`[CLICKUP-DELIVERABLE] Error: ${error}`);
    process.exit(0);
  }
}

main();
