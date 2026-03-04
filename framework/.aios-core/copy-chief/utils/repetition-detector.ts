/**
 * repetition-detector.ts — Regra 2x Detection Module
 * Part of AIOS Copy Chief OS Layer
 *
 * Detects when user repeats a similar instruction ("Regra 2x"):
 * If the user has to repeat themselves, Claude didn't understand.
 *
 * Usage: import { detectRepetition } from './repetition-detector'
 *
 * Extracted from: ~/.claude/hooks/regra-2x-detector.ts
 * Created: 2026-02-26 | Refactored: 2026-03-02
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME = homedir();
export const SESSION_DIR = join(HOME, '.claude/session-state');
export const PROMPTS_FILE = join(SESSION_DIR, 'user-prompts.jsonl');
export const SIMILARITY_THRESHOLD = 0.6;
export const MAX_ENTRIES = 10;
export const LAST_N_TO_COMPARE = 5;
export const TRUNCATE_LENGTH = 120;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PromptEntry {
  timestamp: string;
  prompt: string;
}

export interface RepetitionResult {
  detected: boolean;
  similarity: number;
  mostSimilarPrompt: string;
  currentPrompt: string;
}

// ─── Core Logic ──────────────────────────────────────────────────────────────

export function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\sáàãâéêíóôõúüçñ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized.split(' ').filter(w => w.length > 2);
  return new Set(words);
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }

  const union = a.size + b.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function ensureSessionDir(): void {
  if (!existsSync(SESSION_DIR)) {
    mkdirSync(SESSION_DIR, { recursive: true });
  }
}

export function readPreviousPrompts(): PromptEntry[] {
  try {
    if (!existsSync(PROMPTS_FILE)) return [];

    const content = readFileSync(PROMPTS_FILE, 'utf-8').trim();
    if (!content) return [];

    const entries: PromptEntry[] = [];
    for (const line of content.split('\n')) {
      try {
        const entry = JSON.parse(line);
        if (entry && typeof entry.prompt === 'string') {
          entries.push(entry);
        }
      } catch {
        // Skip malformed lines
      }
    }
    return entries;
  } catch {
    return [];
  }
}

export function appendPrompt(prompt: string, existingEntries: PromptEntry[]): void {
  ensureSessionDir();

  const newEntry: PromptEntry = {
    timestamp: new Date().toISOString(),
    prompt,
  };

  const allEntries = [...existingEntries, newEntry];
  const trimmed = allEntries.slice(-MAX_ENTRIES);

  const content = trimmed.map(e => JSON.stringify(e)).join('\n') + '\n';
  writeFileSync(PROMPTS_FILE, content);
}

/**
 * Main detection function. Checks current prompt against recent history.
 * Always appends the current prompt to history regardless of detection result.
 *
 * @param currentPrompt - The prompt to check
 * @returns RepetitionResult with detection status and details
 */
export function detectRepetition(currentPrompt: string): RepetitionResult {
  const previousEntries = readPreviousPrompts();
  const recentEntries = previousEntries.slice(-LAST_N_TO_COMPARE);
  const currentTokens = tokenize(currentPrompt);

  let highestSimilarity = 0;
  let mostSimilarPrompt = '';

  if (currentTokens.size >= 3) {
    for (const entry of recentEntries) {
      const previousTokens = tokenize(entry.prompt);
      if (previousTokens.size < 3) continue;

      const similarity = jaccardSimilarity(currentTokens, previousTokens);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarPrompt = entry.prompt;
      }
    }
  }

  // Always append (even when not detected)
  appendPrompt(currentPrompt, previousEntries);

  return {
    detected: highestSimilarity > SIMILARITY_THRESHOLD,
    similarity: highestSimilarity,
    mostSimilarPrompt,
    currentPrompt,
  };
}

/**
 * Format a Regra 2x warning message for stderr output.
 */
export function formatWarningMessage(result: RepetitionResult): string {
  const similarityPct = Math.round(result.similarity * 100);
  return (
    `\n\u26a0\ufe0f REGRA 2x DETECTADA (similaridade: ${similarityPct}%): Usuario repetiu instrucao similar.\n` +
    `Prompt anterior: "${truncate(result.mostSimilarPrompt, TRUNCATE_LENGTH)}"\n` +
    `Prompt atual: "${truncate(result.currentPrompt, TRUNCATE_LENGTH)}"\n\n` +
    `ACAO OBRIGATORIA:\n` +
    `1. PARE imediatamente\n` +
    `2. Releia o pedido ORIGINAL com atencao\n` +
    `3. Faca EXATAMENTE o que foi pedido\n` +
    `4. NAO justifique, NAO explique — apenas execute\n\n`
  );
}
