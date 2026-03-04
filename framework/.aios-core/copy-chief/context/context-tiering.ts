// ~/.claude/hooks/lib/context-tiering.ts
// Context Tiering — Bracket-aware memory bridge for context management
// Estimates context usage and adjusts injection strategy accordingly
// Part of P4: Context Tiering (AIOS Gap Closure)
// Created: 2026-02-24

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const STATE_DIR = join(HOME, '.claude', 'session-state');
const COUNTER_FILE = join(STATE_DIR, 'context-counter.json');

// ==========================================
// Types
// ==========================================

export type ContextBracket = 'FRESH' | 'MODERATE' | 'DEPLETED' | 'CRITICAL';

export interface ContextState {
  tool_calls: number;
  estimated_tokens: number;
  estimated_pct: number;
  bracket: ContextBracket;
  session_start: string;
  last_updated: string;
  warnings_emitted: number;
  last_compact_at?: string;
}

export interface InjectionStrategy {
  bracket: ContextBracket;
  load_hot: boolean;
  load_warm: boolean;
  load_cold: boolean;
  max_injection_tokens: number;
  should_compact: boolean;
  force_compact: boolean;
  warning?: string;
}

// ==========================================
// Constants
// ==========================================

const MAX_CONTEXT_TOKENS = 200_000;
const AVG_TOKENS_PER_TOOL_CALL = 800; // Conservative average including input + output

const BRACKETS: Record<ContextBracket, { min_pct: number; max_pct: number }> = {
  FRESH:    { min_pct: 0,  max_pct: 30 },
  MODERATE: { min_pct: 30, max_pct: 50 },
  DEPLETED: { min_pct: 50, max_pct: 70 },
  CRITICAL: { min_pct: 70, max_pct: 100 },
};

// ==========================================
// State I/O
// ==========================================

function ensureDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function loadState(): ContextState {
  ensureDir();

  if (existsSync(COUNTER_FILE)) {
    try {
      const raw = readFileSync(COUNTER_FILE, 'utf-8');
      return JSON.parse(raw) as ContextState;
    } catch {
      // Corrupted, start fresh
    }
  }

  const now = new Date().toISOString();
  return {
    tool_calls: 0,
    estimated_tokens: 0,
    estimated_pct: 0,
    bracket: 'FRESH',
    session_start: now,
    last_updated: now,
    warnings_emitted: 0,
  };
}

function saveState(state: ContextState): void {
  ensureDir();
  state.last_updated = new Date().toISOString();
  writeFileSync(COUNTER_FILE, JSON.stringify(state, null, 2));
}

// ==========================================
// Bracket Detection
// ==========================================

function detectBracket(pct: number): ContextBracket {
  if (pct < BRACKETS.FRESH.max_pct) return 'FRESH';
  if (pct < BRACKETS.MODERATE.max_pct) return 'MODERATE';
  if (pct < BRACKETS.DEPLETED.max_pct) return 'DEPLETED';
  return 'CRITICAL';
}

// ==========================================
// Core API
// ==========================================

/**
 * Increment tool call counter and recalculate bracket.
 * Called from PostToolUse hook.
 * @param additionalTokens - Optional override for specific tool token count
 */
export function recordToolCall(additionalTokens?: number): ContextState {
  const state = loadState();

  state.tool_calls++;
  state.estimated_tokens += additionalTokens || AVG_TOKENS_PER_TOOL_CALL;
  state.estimated_pct = Math.min(100, Math.round((state.estimated_tokens / MAX_CONTEXT_TOKENS) * 100));
  state.bracket = detectBracket(state.estimated_pct);

  saveState(state);
  return state;
}

/**
 * Get the current injection strategy based on bracket.
 * Used by synapse-inject.ts to decide what to load.
 */
export function getInjectionStrategy(): InjectionStrategy {
  const state = loadState();

  switch (state.bracket) {
    case 'FRESH':
      return {
        bracket: 'FRESH',
        load_hot: true,
        load_warm: true,
        load_cold: false,
        max_injection_tokens: 30_000,
        should_compact: false,
        force_compact: false,
      };

    case 'MODERATE':
      return {
        bracket: 'MODERATE',
        load_hot: true,
        load_warm: true,
        load_cold: false,
        max_injection_tokens: 20_000,
        should_compact: false,
        force_compact: false,
      };

    case 'DEPLETED':
      return {
        bracket: 'DEPLETED',
        load_hot: true,
        load_warm: false,
        load_cold: false,
        max_injection_tokens: 10_000,
        should_compact: true,
        force_compact: false,
        warning: `Context ${state.estimated_pct}% — DEPLETED. /compact recomendado. Warm files nao serao injetados.`,
      };

    case 'CRITICAL':
      return {
        bracket: 'CRITICAL',
        load_hot: true,
        load_warm: false,
        load_cold: false,
        max_injection_tokens: 5_000,
        should_compact: true,
        force_compact: true,
        warning: `Context ${state.estimated_pct}% — CRITICAL! /compact URGENTE. Qualidade degradando significativamente.`,
      };
  }
}

/**
 * Reset counter (called after /compact or session start).
 */
export function resetCounter(reason: 'compact' | 'session_start'): ContextState {
  const state = loadState();

  if (reason === 'compact') {
    // After compact, estimate context reduced by ~60%
    state.estimated_tokens = Math.round(state.estimated_tokens * 0.4);
    state.last_compact_at = new Date().toISOString();
  } else {
    // Fresh session
    state.tool_calls = 0;
    state.estimated_tokens = 0;
    state.warnings_emitted = 0;
    state.session_start = new Date().toISOString();
  }

  state.estimated_pct = Math.min(100, Math.round((state.estimated_tokens / MAX_CONTEXT_TOKENS) * 100));
  state.bracket = detectBracket(state.estimated_pct);

  saveState(state);
  return state;
}

/**
 * Check if a warning should be emitted (avoid spamming).
 * Emits at most once per bracket transition.
 */
export function shouldEmitWarning(): { emit: boolean; message?: string } {
  const state = loadState();
  const strategy = getInjectionStrategy();

  if (!strategy.warning) {
    return { emit: false };
  }

  // Emit warning at most 3 times per session
  if (state.warnings_emitted >= 3) {
    return { emit: false };
  }

  state.warnings_emitted++;
  saveState(state);

  return { emit: true, message: strategy.warning };
}

/**
 * Get context health report for display.
 */
export function getContextHealth(): {
  bracket: ContextBracket;
  pct: number;
  tool_calls: number;
  tokens: number;
  recommendation: string;
} {
  const state = loadState();

  let recommendation: string;
  switch (state.bracket) {
    case 'FRESH':
      recommendation = 'Trabalhar normalmente. Carregar Hot + Warm.';
      break;
    case 'MODERATE':
      recommendation = 'Seletivo com carregamento. Evitar arquivos grandes.';
      break;
    case 'DEPLETED':
      recommendation = '/compact recomendado. Apenas Hot files.';
      break;
    case 'CRITICAL':
      recommendation = '/compact URGENTE. Qualidade em risco.';
      break;
  }

  return {
    bracket: state.bracket,
    pct: state.estimated_pct,
    tool_calls: state.tool_calls,
    tokens: state.estimated_tokens,
    recommendation,
  };
}
