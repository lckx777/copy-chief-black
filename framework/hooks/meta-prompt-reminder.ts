#!/usr/bin/env bun
/**
 * meta-prompt-reminder.ts — PostToolUse Hook (matcher: ".*")
 * Part of AIOS: Automated Intelligence Operating System
 *
 * After every N tool calls (default 30), injects a meta-prompt reminder
 * into the agent's context via stderr, prompting self-reflection.
 *
 * Logic:
 * 1. Reads tool call info from stdin
 * 2. Increments counter in session state file
 * 3. At threshold → emits reminder via stderr and resets counter
 * 4. Always exits 0 (never blocks)
 *
 * Created: 2026-02-26
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ─── Constants ──────────────────────────────────────────────────────────────

const HOME = require('os').homedir();
const SESSION_DIR = join(HOME, '.claude/session-state');
const COUNTER_FILE = join(SESSION_DIR, 'tool-call-counter.json');
const THRESHOLD = 30;
const MAX_EXECUTION_MS = 2000;

// ─── Types ──────────────────────────────────────────────────────────────────

interface CounterState {
  count: number;
  last_reminder: string;
}

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string | Record<string, unknown>;
  is_error?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureSessionDir(): void {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }
}

function readCounter(): CounterState {
  try {
    if (existsSync(COUNTER_FILE)) {
      const content = readFileSync(COUNTER_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (typeof parsed.count === 'number' && typeof parsed.last_reminder === 'string') {
        return parsed;
      }
    }
  } catch {
    // Corrupted file — reset
  }

  return { count: 0, last_reminder: new Date().toISOString() };
}

function writeCounter(state: CounterState): void {
  ensureSessionDir();
  writeFileSync(COUNTER_FILE, JSON.stringify(state, null, 2));
}

// ─── Main Hook ──────────────────────────────────────────────────────────────

function main(): void {
  // Safety timeout — ensure we never hang
  const timeout = setTimeout(() => {
    process.exit(0);
  }, MAX_EXECUTION_MS);

  try {
    // Read stdin (tool call info) — we don't need the content,
    // but we must consume stdin to avoid pipe errors
    let stdin = '';
    try {
      stdin = readFileSync(0, 'utf8');
    } catch {
      // stdin not available — exit cleanly
      clearTimeout(timeout);
      process.exit(0);
      return;
    }

    // Validate it's a real tool call (basic check)
    try {
      const input: PostToolUseInput = JSON.parse(stdin);
      if (!input.tool_name) {
        clearTimeout(timeout);
        process.exit(0);
        return;
      }
    } catch {
      // Not valid JSON — skip
      clearTimeout(timeout);
      process.exit(0);
      return;
    }

    // Read and increment counter
    const state = readCounter();
    state.count += 1;

    // Check if threshold reached
    if (state.count >= THRESHOLD) {
      // Emit meta-prompt reminder via stderr
      const timeSinceLast = state.last_reminder
        ? timeDiffDescription(new Date(state.last_reminder), new Date())
        : 'unknown';

      process.stderr.write(
        `\n\ud83e\udde0 META-PROMPT REMINDER (${THRESHOLD} tool calls desde ultimo check, ${timeSinceLast}):\n` +
        `Pergunte-se:\n` +
        `- O que deveria ter perguntado ao usuario que nao perguntei?\n` +
        `- Que contexto esta faltando para produzir melhor?\n` +
        `- Que suposicoes estou fazendo que deveriam ser validadas?\n` +
        `- Estou seguindo o briefing ou derivei?\n\n` +
        `Dica: Releia synthesis.md e mecanismo-unico.yaml da oferta ativa.\n\n`
      );

      // Reset counter
      state.count = 0;
      state.last_reminder = new Date().toISOString();
    }

    // Persist state
    writeCounter(state);

    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    // Fail-open: log error, never block
    try {
      process.stderr.write(`[META-PROMPT] Error: ${error}\n`);
    } catch {}
    clearTimeout(timeout);
    process.exit(0);
  }
}

function timeDiffDescription(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime();

  if (isNaN(diffMs) || diffMs < 0) return 'unknown';

  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return 'menos de 1 minuto';
  if (minutes < 60) return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours < 24) {
    return remainingMins > 0
      ? `${hours}h ${remainingMins}min`
      : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days} dia${days !== 1 ? 's' : ''}`;
}

main();
