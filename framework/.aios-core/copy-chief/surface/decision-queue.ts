// ~/.claude/hooks/lib/decision-queue.ts
// Decision Queue — Non-blocking human decision queue for overnight production
// Part of P0: Surface Checker + Decision Queue (AIOS Gap Closure)
// Created: 2026-02-24

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { homedir } from 'os';

const HOME = homedir();
const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');

// ==========================================
// Types
// ==========================================

export type DecisionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DecisionStatus = 'PENDING' | 'RESOLVED' | 'EXPIRED' | 'AUTO_RESOLVED';

export type DecisionAction =
  | 'yes_no'
  | 'go_nogo'
  | 'multiple_choice'
  | 'explicit_confirm'
  | 'help_request';

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
  recommended?: boolean;
}

export interface QueuedDecision {
  id: string;
  offer_id: string;
  criterion_id: string;
  type: DecisionAction;
  priority: DecisionPriority;
  status: DecisionStatus;
  blocking: boolean;
  title: string;
  context: string;
  options?: DecisionOption[];
  auto_resolve_after_hours?: number;
  auto_resolve_choice?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: 'human' | 'auto' | 'timeout';
  resolution?: string;
  resolution_rationale?: string;
}

export interface DecisionQueueFile {
  version: string;
  updated_at: string;
  decisions: QueuedDecision[];
}

// ==========================================
// Queue Path
// ==========================================

function getQueuePath(offerId: string): string {
  return join(ECOSYSTEM_ROOT, offerId, 'pending-decisions.yaml');
}

function generateDecisionId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).substring(2, 6);
  return `dec-${ts}-${rand}`;
}

// ==========================================
// Queue I/O
// ==========================================

function loadQueue(offerId: string): DecisionQueueFile {
  const path = getQueuePath(offerId);
  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf-8');
      return parseYaml(raw) as DecisionQueueFile;
    } catch {
      // Corrupted, start fresh
    }
  }
  return {
    version: '1.0.0',
    updated_at: new Date().toISOString(),
    decisions: [],
  };
}

function saveQueue(offerId: string, queue: DecisionQueueFile): void {
  const path = getQueuePath(offerId);
  const dir = join(ECOSYSTEM_ROOT, offerId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  queue.updated_at = new Date().toISOString();
  writeFileSync(path, stringifyYaml(queue));
}

// ==========================================
// Core API
// ==========================================

/**
 * Queue a new decision for human review.
 * Non-blocking decisions allow pipeline to continue.
 * Blocking decisions pause the specific deliverable (not entire pipeline).
 */
export function queueDecision(
  offerId: string,
  criterionId: string,
  opts: {
    type: DecisionAction;
    priority: DecisionPriority;
    blocking: boolean;
    title: string;
    context: string;
    options?: DecisionOption[];
    auto_resolve_after_hours?: number;
    auto_resolve_choice?: string;
  }
): QueuedDecision {
  const queue = loadQueue(offerId);

  const decision: QueuedDecision = {
    id: generateDecisionId(),
    offer_id: offerId,
    criterion_id: criterionId,
    type: opts.type,
    priority: opts.priority,
    status: 'PENDING',
    blocking: opts.blocking,
    title: opts.title,
    context: opts.context,
    options: opts.options,
    auto_resolve_after_hours: opts.auto_resolve_after_hours,
    auto_resolve_choice: opts.auto_resolve_choice,
    created_at: new Date().toISOString(),
  };

  queue.decisions.push(decision);
  saveQueue(offerId, queue);

  return decision;
}

/**
 * Get all pending decisions for an offer, optionally filtered.
 */
export function getPendingDecisions(
  offerId: string,
  opts?: { blocking_only?: boolean; priority?: DecisionPriority }
): QueuedDecision[] {
  const queue = loadQueue(offerId);

  // Auto-resolve expired decisions first
  autoResolveExpired(offerId, queue);

  let pending = queue.decisions.filter((d) => d.status === 'PENDING');

  if (opts?.blocking_only) {
    pending = pending.filter((d) => d.blocking);
  }
  if (opts?.priority) {
    pending = pending.filter((d) => d.priority === opts.priority);
  }

  return pending;
}

/**
 * Resolve a decision with the human's answer.
 */
export function resolveDecision(
  offerId: string,
  decisionId: string,
  resolution: string,
  rationale?: string
): QueuedDecision | null {
  const queue = loadQueue(offerId);
  const decision = queue.decisions.find((d) => d.id === decisionId);

  if (!decision || decision.status !== 'PENDING') {
    return null;
  }

  decision.status = 'RESOLVED';
  decision.resolved_at = new Date().toISOString();
  decision.resolved_by = 'human';
  decision.resolution = resolution;
  decision.resolution_rationale = rationale;

  saveQueue(offerId, queue);
  return decision;
}

/**
 * Check if there are blocking decisions preventing pipeline progress.
 */
export function hasPendingBlockers(offerId: string): boolean {
  const pending = getPendingDecisions(offerId, { blocking_only: true });
  return pending.length > 0;
}

/**
 * Get a summary of the decision queue for display.
 */
export function getQueueSummary(offerId: string): {
  total_pending: number;
  blocking: number;
  non_blocking: number;
  by_priority: Record<DecisionPriority, number>;
  oldest_pending?: string;
} {
  const pending = getPendingDecisions(offerId);
  const blocking = pending.filter((d) => d.blocking);
  const nonBlocking = pending.filter((d) => !d.blocking);

  const byPriority: Record<DecisionPriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };

  for (const d of pending) {
    byPriority[d.priority]++;
  }

  return {
    total_pending: pending.length,
    blocking: blocking.length,
    non_blocking: nonBlocking.length,
    by_priority: byPriority,
    oldest_pending: pending.length > 0 ? pending[0].created_at : undefined,
  };
}

/**
 * Get all decisions (including resolved) for audit trail.
 */
export function getAllDecisions(offerId: string): QueuedDecision[] {
  const queue = loadQueue(offerId);
  return queue.decisions;
}

// ==========================================
// Auto-Resolution
// ==========================================

function autoResolveExpired(offerId: string, queue: DecisionQueueFile): void {
  const now = Date.now();
  let changed = false;

  for (const decision of queue.decisions) {
    if (
      decision.status === 'PENDING' &&
      decision.auto_resolve_after_hours &&
      decision.auto_resolve_choice
    ) {
      const createdAt = new Date(decision.created_at).getTime();
      const expiresAt = createdAt + decision.auto_resolve_after_hours * 60 * 60 * 1000;

      if (now >= expiresAt) {
        decision.status = 'AUTO_RESOLVED';
        decision.resolved_at = new Date().toISOString();
        decision.resolved_by = 'timeout';
        decision.resolution = decision.auto_resolve_choice;
        decision.resolution_rationale = `Auto-resolved after ${decision.auto_resolve_after_hours}h timeout`;
        changed = true;
      }
    }
  }

  if (changed) {
    saveQueue(offerId, queue);
  }
}
