#!/usr/bin/env bun
/**
 * memory-bracket-injector.ts — Bracket-Aware Memory Injection (AIOS-native)
 * Port: mega-brain memory_hints_injector.py + aios-core memory-bridge.js
 * Hook: UserPromptSubmit
 *
 * Progressively injects memory as context depletes:
 *   FRESH (≥60%)    → 0 tokens (skip)
 *   MODERATE (40-60%) → ~50 tokens (key reminders)
 *   DEPLETED (25-40%) → ~200 tokens (+ gotchas + decisions)
 *   CRITICAL (<25%)  → ~1000 tokens (+ full memory tail + handoff)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const SESSION_STATE = join(process.env.HOME!, ".claude", "session-state");
const MEMORY_DIR = join(process.env.HOME!, ".claude", "memory");
const PROJECT_MEMORY = join(
  process.env.HOME!,
  ".claude",
  "projects",
  "-Users-lucapimenta-copywriting-ecosystem",
  "memory",
  "MEMORY.md"
);
const COUNTER_FILE = join(SESSION_STATE, "bracket-prompt-count.json");

const BRACKETS: Record<string, { maxTokens: number; maxLines: number }> = {
  FRESH:    { maxTokens: 0,    maxLines: 0 },
  MODERATE: { maxTokens: 50,   maxLines: 5 },
  DEPLETED: { maxTokens: 200,  maxLines: 20 },
  CRITICAL: { maxTokens: 1000, maxLines: 50 },
};

const AVG_TOKENS_PER_PROMPT = 1500;
const MAX_CONTEXT = 200_000;

function getBracket(promptCount: number): string {
  const used = promptCount * AVG_TOKENS_PER_PROMPT;
  const pct = Math.max(0, 100 - (used / MAX_CONTEXT) * 100);
  if (pct >= 60) return "FRESH";
  if (pct >= 40) return "MODERATE";
  if (pct >= 25) return "DEPLETED";
  return "CRITICAL";
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function readTail(filePath: string, maxLines: number, maxTokens: number): string {
  if (!existsSync(filePath)) return "";
  try {
    const lines = readFileSync(filePath, "utf-8").split("\n");
    const result: string[] = [];
    let tokens = 0;
    for (let i = lines.length - 1; i >= 0 && result.length < maxLines; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("# ") && result.length === 0) continue;
      const lt = estimateTokens(line);
      if (tokens + lt > maxTokens) break;
      result.unshift(lines[i]);
      tokens += lt;
    }
    return result.join("\n").trim();
  } catch { return ""; }
}

function readJsonArray(filePath: string, maxItems: number): string[] {
  if (!existsSync(filePath)) return [];
  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    if (!Array.isArray(data)) return [];
    return data.slice(-maxItems).map((d: any) => `- ${d.text || d.pattern || JSON.stringify(d)}`);
  } catch { return []; }
}

function incrementCounter(): number {
  mkdirSync(SESSION_STATE, { recursive: true });
  let count = 0;
  try {
    const data = JSON.parse(readFileSync(COUNTER_FILE, "utf-8"));
    // Reset if older than 2 hours
    if (Date.now() - (data.ts || 0) > 7_200_000) count = 0;
    else count = data.count || 0;
  } catch {}
  count++;
  writeFileSync(COUNTER_FILE, JSON.stringify({ count, ts: Date.now() }));
  return count;
}

try {
  const promptCount = incrementCounter();
  const bracket = getBracket(promptCount);
  const cfg = BRACKETS[bracket];

  if (cfg.maxTokens === 0) {
    process.stdout.write(JSON.stringify({ continue: true }));
    process.exit(0);
  }

  const parts: string[] = [];
  let tokensLeft = cfg.maxTokens;

  // Layer 1 (MODERATE+): Key reminders from MEMORY.md
  if (tokensLeft > 0) {
    const budget = Math.min(tokensLeft, bracket === "MODERATE" ? 50 : 100);
    const mem = readTail(PROJECT_MEMORY, 5, budget);
    if (mem) { parts.push(mem); tokensLeft -= estimateTokens(mem); }
  }

  // Layer 2 (DEPLETED+): Gotchas + Decisions
  if (bracket !== "MODERATE" && tokensLeft > 0) {
    const gotchas = readJsonArray(join(MEMORY_DIR, "gotchas.json"), 3);
    if (gotchas.length) {
      const g = "**Gotchas:**\n" + gotchas.join("\n");
      parts.push(g); tokensLeft -= estimateTokens(g);
    }
    const decisions = readJsonArray(join(MEMORY_DIR, "user-decisions.json"), 5);
    if (decisions.length) {
      const d = "**User Decisions:**\n" + decisions.join("\n");
      parts.push(d); tokensLeft -= estimateTokens(d);
    }
  }

  // Layer 3 (CRITICAL): Full memory tail + handoff + compact warning
  if (bracket === "CRITICAL" && tokensLeft > 0) {
    const handoff = readTail(join(SESSION_STATE, "LATEST-SESSION.md"), 20, Math.min(tokensLeft, 400));
    if (handoff) { parts.push("**Last Session:**\n" + handoff); tokensLeft -= estimateTokens(handoff); }
    const moreMem = readTail(PROJECT_MEMORY, 30, Math.min(tokensLeft, 300));
    if (moreMem) { parts.push(moreMem); }
    parts.push("⚠️ Context CRITICAL. Consider /compact or starting new session.");
  }

  if (parts.length > 0) {
    const pct = Math.max(0, Math.round(100 - (promptCount * AVG_TOKENS_PER_PROMPT / MAX_CONTEXT) * 100));
    const feedback = `[MIS:${bracket}] Context ~${pct}% | Prompt #${promptCount}\n${parts.join("\n\n")}`;
    process.stdout.write(JSON.stringify({ continue: true, feedback }));
  } else {
    process.stdout.write(JSON.stringify({ continue: true }));
  }
} catch {
  process.stdout.write(JSON.stringify({ continue: true }));
}
