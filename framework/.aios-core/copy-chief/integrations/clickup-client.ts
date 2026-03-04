/**
 * clickup-client.ts — Shared ClickUp Integration Client
 * Part of AIOS Copy Chief OS Layer
 *
 * Provides shared logic for all ClickUp-related hook operations:
 * - Gate sync (validate_gate, black_validation results → task status)
 * - Deliverable sync (production/ writes → task progress)
 *
 * Usage:
 *   import { extractOfferPath, extractGateResult, ... } from './clickup-client'
 *
 * Merged from:
 *   ~/.claude/hooks/clickup-gate-sync.ts
 *   ~/.claude/hooks/clickup-deliverable-sync.ts
 * Refactored: 2026-03-02
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME = homedir();
export const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');

export const GATE_TOOLS = [
  'mcp__copywriting__validate_gate',
  'mcp__copywriting__black_validation',
  'validate_gate',
  'black_validation',
];

/** Maps production sub-directory names to normalized deliverable type keys */
export const PATH_TO_DELIVERABLE: Record<string, string> = {
  'vsl': 'vsl',
  'landing-page': 'landing_page',
  'landing_page': 'landing_page',
  'creatives': 'creatives',
  'criativos': 'creatives',
  'emails': 'emails',
  'email': 'emails',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PendingUpdate {
  task_id: string;
  action: string;
  data: Record<string, unknown>;
  queued_at?: string;
}

export interface GateResult {
  gate: string;
  passed: boolean;
  score: number;
}

export interface SyncConfig {
  parent_task_id?: string;
  gate_tasks?: Record<string, string>;
  deliverable_tasks?: Record<string, string>;
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/**
 * Load the ClickUp sync configuration for an offer.
 * Returns null if no clickup-sync.yaml is present (sync not configured).
 */
export function loadSyncConfig(offerPath: string): SyncConfig | null {
  const configPath = join(ECOSYSTEM_ROOT, offerPath, 'clickup-sync.yaml');
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as SyncConfig;
  } catch {
    return null;
  }
}

/**
 * Append a pending ClickUp update to the offer's queue file.
 * Queue is flushed by a separate sync process.
 */
export function appendPendingUpdate(offerPath: string, update: PendingUpdate): void {
  const pendingPath = join(ECOSYSTEM_ROOT, offerPath, 'clickup-pending.json');
  let pending: PendingUpdate[] = [];
  if (existsSync(pendingPath)) {
    try { pending = JSON.parse(readFileSync(pendingPath, 'utf-8')); } catch { pending = []; }
  }
  pending.push({ ...update, queued_at: new Date().toISOString() });
  writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
}

// ─── Gate Sync Helpers ────────────────────────────────────────────────────────

/**
 * Scan the ecosystem to find which offer is referenced in the tool input.
 * Used by gate sync to identify the offer for a validate_gate/black_validation call.
 */
export function extractOfferPath(toolInput: Record<string, unknown>): string | null {
  const inputStr = JSON.stringify(toolInput).toLowerCase();
  const nichos = ['concursos', 'saude', 'relacionamento', 'riqueza'];

  for (const niche of nichos) {
    const nicheDir = join(ECOSYSTEM_ROOT, niche);
    if (!existsSync(nicheDir)) continue;
    try {
      const entries = require('fs').readdirSync(nicheDir) as string[];
      for (const entry of entries) {
        if (inputStr.includes(entry.toLowerCase())) {
          return `${niche}/${entry}`;
        }
      }
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * Parse a gate result (pass/fail, gate name, score) from tool output.
 */
export function extractGateResult(output: unknown): GateResult | null {
  if (!output) return null;
  const str = typeof output === 'string' ? output : JSON.stringify(output);

  let gate = 'unknown';
  if (/research/i.test(str)) gate = 'research';
  else if (/briefing/i.test(str)) gate = 'briefing';
  else if (/production|black/i.test(str)) gate = 'production';

  const passed = /pass|passed|aprovad|complete/i.test(str) && !/fail|block|rejeit/i.test(str);

  const scoreMatch = str.match(/(?:score|nota|media)[:\s]*(\d+\.?\d*)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

  return { gate, passed, score };
}

/**
 * Build and queue ClickUp updates for a gate result.
 * Queues status update and comment on the gate task, plus comment on parent task.
 */
export function syncGateResult(offerPath: string, syncConfig: SyncConfig, result: GateResult): void {
  const taskId = syncConfig.gate_tasks?.[result.gate];
  const parentId = syncConfig.parent_task_id;

  const statusLabel = result.passed ? 'PASSED' : 'FAILED';
  const taskStatus = result.passed ? 'complete' : 'blocked';
  const msg = `Gate ${result.gate} ${statusLabel} (score: ${result.score})`;

  console.error(`[CLICKUP-SYNC] ${msg}`);

  if (taskId) {
    appendPendingUpdate(offerPath, { task_id: taskId, action: 'set_status', data: { status: taskStatus } });
    appendPendingUpdate(offerPath, { task_id: taskId, action: 'add_comment', data: { comment: msg } });
  }

  if (parentId && result.passed) {
    appendPendingUpdate(offerPath, { task_id: parentId, action: 'add_comment', data: { comment: `[Progress] ${msg}` } });
  }
}

// ─── Deliverable Sync Helpers ─────────────────────────────────────────────────

/**
 * Extract the file path from Write or Edit tool input.
 */
export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  if (typeof toolInput.file_path === 'string') return toolInput.file_path;
  if (typeof toolInput.path === 'string') return toolInput.path;
  return null;
}

/**
 * Returns true if the file path is under a production/ directory.
 */
export function isProductionFile(filePath: string): boolean {
  return filePath.includes('/production/');
}

/**
 * Extract the offer path (niche/offer) from a production file path.
 * Pattern: .../copywriting-ecosystem/{niche}/{offer}/production/...
 */
export function extractOfferFromPath(filePath: string): string | null {
  const match = filePath.match(/copywriting-ecosystem\/(\w+)\/([^/]+)\/production/);
  if (match) return `${match[1]}/${match[2]}`;
  return null;
}

/**
 * Extract the normalized deliverable type from a production file path.
 * Pattern: .../production/{type}/...
 */
export function extractDeliverableType(filePath: string): string | null {
  const match = filePath.match(/production\/([^/]+)/);
  if (!match) return null;
  return PATH_TO_DELIVERABLE[match[1]] || null;
}

/**
 * Build and queue ClickUp updates for a deliverable write.
 * Queues status update and comment on the deliverable task, plus comment on parent task.
 */
export function syncDeliverableWrite(
  offerPath: string,
  syncConfig: SyncConfig,
  deliverableType: string,
  filePath: string
): void {
  const taskId = syncConfig.deliverable_tasks?.[deliverableType];
  const parentId = syncConfig.parent_task_id;
  const fileName = basename(filePath);

  if (taskId) {
    console.error(`[CLICKUP-DELIVERABLE] Queued: ${fileName} (${deliverableType})`);
    appendPendingUpdate(offerPath, { task_id: taskId, action: 'set_status', data: { status: 'in progress' } });
    appendPendingUpdate(offerPath, { task_id: taskId, action: 'add_comment', data: { comment: `Deliverable produced: ${fileName}` } });
  }

  if (parentId) {
    appendPendingUpdate(offerPath, { task_id: parentId, action: 'add_comment', data: { comment: `Production: ${fileName} (${deliverableType})` } });
  }
}
