// ~/.claude/hooks/lib/ids.ts
// IDS — Incremental Decision System with Circuit Breaker v1.0
// Adapted from AIOS-Core Incremental Decision Engine (simplified: snapshot + rollback)
// Created: 2026-02-24

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// ==========================================
// Constants
// ==========================================

const HOME = homedir();
const IDS_DIR = join(HOME, '.claude', 'ids');
const DECISIONS_FILE = join(IDS_DIR, 'decisions.json');
const MAX_DECISIONS = 50;
const CIRCUIT_BREAKER_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CIRCUIT_BREAKER_THRESHOLD = 3; // rollbacks in window

// ==========================================
// Types
// ==========================================

export type DecisionType =
  | 'HOOK_ADD'
  | 'RULE_UPDATE'
  | 'SCHEMA_CHANGE'
  | 'CONFIG_UPDATE'
  | 'COPY_WRITE'
  | 'PHASE_ADVANCE'
  | 'MECANISMO_UPDATE';

export type DecisionStatus = 'APPLIED' | 'ROLLED_BACK';

export interface Decision {
  id: string;
  description: string;
  timestamp: string;
  type: DecisionType;
  files_affected: string[];
  snapshots: Record<string, string | null>; // filepath -> content before change (null = file did not exist)
  status: DecisionStatus;
  rolled_back_at?: string;
}

export interface DecisionRegistry {
  version: string;
  created_at: string;
  updated_at: string;
  decisions: Decision[];
}

export interface CircuitBreakerState {
  triggered: boolean;
  rollbacks_in_window: number;
  window_start: string;
  message?: string;
}

// ==========================================
// Registry I/O
// ==========================================

function ensureDir(): void {
  if (!existsSync(IDS_DIR)) {
    mkdirSync(IDS_DIR, { recursive: true });
  }
}

function loadRegistry(): DecisionRegistry {
  ensureDir();

  if (existsSync(DECISIONS_FILE)) {
    try {
      const raw = readFileSync(DECISIONS_FILE, 'utf-8');
      return JSON.parse(raw) as DecisionRegistry;
    } catch {
      // Corrupted file, start fresh
    }
  }

  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    created_at: now,
    updated_at: now,
    decisions: [],
  };
}

function saveRegistry(registry: DecisionRegistry): void {
  ensureDir();
  registry.updated_at = new Date().toISOString();
  writeFileSync(DECISIONS_FILE, JSON.stringify(registry, null, 2));
}

// ==========================================
// ID Generation
// ==========================================

function generateId(): string {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `ids-${datePart}-${randomPart}`;
}

// ==========================================
// Snapshot Helpers
// ==========================================

function snapshotFile(filePath: string): string | null {
  try {
    if (existsSync(filePath)) {
      return readFileSync(filePath, 'utf-8');
    }
    return null; // File does not exist yet
  } catch {
    return null;
  }
}

function restoreFile(filePath: string, content: string | null): void {
  if (content === null) {
    // File did not exist before — remove it
    try {
      const fs = require('fs');
      if (existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Best effort: if we cannot remove, leave it
    }
    return;
  }

  // Ensure parent directory exists
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(filePath, content);
}

// ==========================================
// Circuit Breaker
// ==========================================

export function checkCircuitBreaker(): CircuitBreakerState {
  const registry = loadRegistry();
  const now = Date.now();
  const windowStart = now - CIRCUIT_BREAKER_WINDOW_MS;

  const recentRollbacks = registry.decisions.filter(
    (d) =>
      d.status === 'ROLLED_BACK' &&
      d.rolled_back_at &&
      new Date(d.rolled_back_at).getTime() >= windowStart
  );

  const count = recentRollbacks.length;
  const triggered = count >= CIRCUIT_BREAKER_THRESHOLD;

  return {
    triggered,
    rollbacks_in_window: count,
    window_start: new Date(windowStart).toISOString(),
    message: triggered
      ? `CIRCUIT BREAKER: ${count} rollbacks in the last hour (threshold: ${CIRCUIT_BREAKER_THRESHOLD}). Recent structural changes are unstable. Review before making further changes.`
      : undefined,
  };
}

// ==========================================
// Core API
// ==========================================

/**
 * Register a decision by snapshotting the current content of affected files.
 * Call this BEFORE making the actual changes.
 */
export function registerDecision(
  description: string,
  type: DecisionType,
  filePaths: string[]
): Decision {
  const registry = loadRegistry();

  // Snapshot current state of all affected files
  const snapshots: Record<string, string | null> = {};
  for (const fp of filePaths) {
    snapshots[fp] = snapshotFile(fp);
  }

  const decision: Decision = {
    id: generateId(),
    description,
    timestamp: new Date().toISOString(),
    type,
    files_affected: filePaths,
    snapshots,
    status: 'APPLIED',
  };

  registry.decisions.push(decision);

  // Auto-prune: keep only the most recent MAX_DECISIONS
  if (registry.decisions.length > MAX_DECISIONS) {
    const excess = registry.decisions.length - MAX_DECISIONS;
    registry.decisions = registry.decisions.slice(excess);
  }

  saveRegistry(registry);

  // Check circuit breaker and emit warning if triggered
  const cb = checkCircuitBreaker();
  if (cb.triggered) {
    console.error(`\n[IDS] WARNING: ${cb.message}\n`);
  }

  return decision;
}

/**
 * Roll back a decision by restoring files from snapshots.
 * Returns the rolled-back decision, or null if not found / already rolled back.
 */
export function rollbackDecision(decisionId: string): {
  success: boolean;
  decision?: Decision;
  error?: string;
  circuitBreaker?: CircuitBreakerState;
} {
  const registry = loadRegistry();
  const decision = registry.decisions.find((d) => d.id === decisionId);

  if (!decision) {
    return { success: false, error: `Decision "${decisionId}" not found` };
  }

  if (decision.status === 'ROLLED_BACK') {
    return {
      success: false,
      error: `Decision "${decisionId}" was already rolled back at ${decision.rolled_back_at}`,
      decision,
    };
  }

  // Restore all files from snapshots
  const errors: string[] = [];
  for (const [filePath, content] of Object.entries(decision.snapshots)) {
    try {
      restoreFile(filePath, content);
    } catch (err) {
      errors.push(`Failed to restore ${filePath}: ${err}`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Partial rollback. Errors:\n${errors.join('\n')}`,
      decision,
    };
  }

  // Mark as rolled back
  decision.status = 'ROLLED_BACK';
  decision.rolled_back_at = new Date().toISOString();
  saveRegistry(registry);

  // Check circuit breaker after rollback
  const cb = checkCircuitBreaker();

  return { success: true, decision, circuitBreaker: cb };
}

/**
 * Get recent decisions, optionally limited.
 */
export function getDecisions(limit?: number): Decision[] {
  const registry = loadRegistry();
  const decisions = [...registry.decisions].reverse(); // newest first
  if (limit && limit > 0) {
    return decisions.slice(0, limit);
  }
  return decisions;
}

/**
 * Get a single decision by ID.
 */
export function getDecision(id: string): Decision | null {
  const registry = loadRegistry();
  return registry.decisions.find((d) => d.id === id) || null;
}

/**
 * Get the most recent APPLIED decision (for --last rollback).
 */
export function getLastAppliedDecision(): Decision | null {
  const registry = loadRegistry();
  for (let i = registry.decisions.length - 1; i >= 0; i--) {
    if (registry.decisions[i].status === 'APPLIED') {
      return registry.decisions[i];
    }
  }
  return null;
}

/**
 * Get registry stats.
 */
export function getStats(): {
  total: number;
  applied: number;
  rolled_back: number;
  by_type: Record<DecisionType, number>;
} {
  const registry = loadRegistry();
  const stats = {
    total: registry.decisions.length,
    applied: 0,
    rolled_back: 0,
    by_type: {
      HOOK_ADD: 0,
      RULE_UPDATE: 0,
      SCHEMA_CHANGE: 0,
      CONFIG_UPDATE: 0,
      COPY_WRITE: 0,
      PHASE_ADVANCE: 0,
      MECANISMO_UPDATE: 0,
    } as Record<DecisionType, number>,
  };

  for (const d of registry.decisions) {
    if (d.status === 'APPLIED') stats.applied++;
    else stats.rolled_back++;
    stats.by_type[d.type] = (stats.by_type[d.type] || 0) + 1;
  }

  return stats;
}
