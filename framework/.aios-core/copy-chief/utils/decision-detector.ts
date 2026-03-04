// ~/.claude/.aios-core/copy-chief/utils/decision-detector.ts
// Decision / preference detection for UserPromptSubmit hooks.
// Extracted from decision-detector.ts hook — v1.0 (2026-03-02)
//
// Detects decision/preference signals in user messages and persists them to
// ~/.claude/memory/user-decisions.json with dedup via MD5-prefix hash.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HOME = process.env.HOME ?? '/tmp';
export const DECISIONS_PATH = join(HOME, '.claude', 'memory', 'user-decisions.json');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DecisionCategory = 'workflow' | 'offer' | 'style' | 'system';

export interface Decision {
  id: string;
  date: string;
  text: string;
  category: DecisionCategory;
  hash: string;
}

// ---------------------------------------------------------------------------
// Detection patterns
// ---------------------------------------------------------------------------

/** Regex patterns with their semantic category. Order matters for precedence. */
export const PATTERNS: Array<{ regex: RegExp; category: DecisionCategory }> = [
  // Workflow — explicit instructions / rules
  { regex: /\b(sempre use|always use)\b/i,             category: 'workflow' },
  { regex: /\b(nunca|never)\b/i,                        category: 'workflow' },
  { regex: /\ba partir de agora\b/i,                    category: 'workflow' },
  { regex: /\bfrom now on\b/i,                          category: 'workflow' },
  { regex: /\bmude para|troque por\b/i,                 category: 'workflow' },
  { regex: /\bswitch to|change to\b/i,                  category: 'workflow' },
  // Approval / continuation
  { regex: /\b(pode continuar|aprovo|approve)\b/i,      category: 'workflow' },
  // System protection
  { regex: /\b(nao quero|nao mexa|don't touch)\b/i,    category: 'system'   },
  // Preferences
  { regex: /\bprefiro\b/i,                              category: 'style'    },
  { regex: /\bprefer[oe]\b/i,                           category: 'style'    },
  // Decisions (offer-level)
  { regex: /\bdecid[io]\b/i,                            category: 'offer'    },
  { regex: /\bescolh[eo]\b/i,                           category: 'offer'    },
  // System settings — model selection
  { regex: /\b(use|usar)\s+(modelo|model|opus|sonnet|haiku)\b/i, category: 'system' },
];

// ---------------------------------------------------------------------------
// Hashing / sentence extraction
// ---------------------------------------------------------------------------

/**
 * Returns an 8-char MD5 prefix of the lowercased, trimmed text.
 * Used for deduplication.
 */
export function hashText(text: string): string {
  return createHash('md5')
    .update(text.toLowerCase().trim())
    .digest('hex')
    .slice(0, 8);
}

/**
 * Extracts the complete sentence surrounding `matchIndex` in `prompt`.
 * Sentence boundaries: `.` `!` `?` `\n`
 * Result is capped at 200 characters.
 */
export function extractSentence(prompt: string, matchIndex: number): string {
  const sentenceBreaks = /[.!?\n]/g;
  let start = 0;
  let end = prompt.length;

  const before = prompt.slice(0, matchIndex);
  const lastBreak = Math.max(
    before.lastIndexOf('.'),
    before.lastIndexOf('!'),
    before.lastIndexOf('?'),
    before.lastIndexOf('\n'),
  );
  if (lastBreak >= 0) start = lastBreak + 1;

  const after = prompt.slice(matchIndex);
  const nextBreakMatch = after.search(sentenceBreaks);
  if (nextBreakMatch >= 0) end = matchIndex + nextBreakMatch;

  return prompt.slice(start, end).trim().slice(0, 200);
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Scans a user prompt for decision/preference signals.
 * Deduplicates by extracted sentence text within a single call.
 *
 * Returns an array of `{ text, category }` for each unique signal found.
 */
export function detectDecisions(
  prompt: string,
): Array<{ text: string; category: DecisionCategory }> {
  const found: Array<{ text: string; category: DecisionCategory }> = [];
  const seen = new Set<string>();

  for (const { regex, category } of PATTERNS) {
    const match = regex.exec(prompt);
    if (!match) continue;

    const sentence = extractSentence(prompt, match.index);
    if (!sentence || seen.has(sentence)) continue;

    seen.add(sentence);
    found.push({ text: sentence, category });
  }

  return found;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/** Loads existing decisions from disk. Returns empty array on missing/corrupt file. */
export function loadDecisions(): Decision[] {
  if (!existsSync(DECISIONS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(DECISIONS_PATH, 'utf-8')) as Decision[];
  } catch {
    return [];
  }
}

/** Persists the decisions array to disk. Creates parent directory if needed. */
export function saveDecisions(decisions: Decision[]): void {
  const dir = dirname(DECISIONS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DECISIONS_PATH, JSON.stringify(decisions, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// High-level: detect + persist (returns number of new entries added)
// ---------------------------------------------------------------------------

/**
 * Detects decision signals in `prompt`, deduplicates against existing records,
 * and persists new ones. Fail-open: errors are swallowed internally.
 *
 * Returns the count of newly added decisions (0 if none).
 */
export function recordNewDecisions(prompt: string): number {
  if (!prompt || prompt.length < 5) return 0;

  const detected = detectDecisions(prompt);
  if (detected.length === 0) return 0;

  const existing = loadDecisions();
  const existingHashes = new Set(existing.map((d) => d.hash));
  let added = 0;

  for (const { text, category } of detected) {
    const hash = hashText(text);
    if (existingHashes.has(hash)) continue;

    const now = new Date();
    existing.push({
      id: `d-${Math.floor(now.getTime() / 1000)}`,
      date: now.toISOString(),
      text,
      category,
      hash,
    });
    existingHashes.add(hash);
    added++;
  }

  if (added > 0) {
    saveDecisions(existing);
  }

  return added;
}
