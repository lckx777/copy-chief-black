/**
 * processing-registry.ts — Copy Chief OS Layer
 * copy-chief/utils/processing-registry.ts
 *
 * Business logic for checking whether URLs/paths have already been processed
 * by research extraction tools within a configurable TTL window.
 *
 * Used by hook: ~/.claude/hooks/processing-check.ts
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface RegistryEntry {
  hash: string;
  path: string;
  date: string;
  source: string;
  offer: string;
  type: string;
  extracted_count?: number;
  confidence?: string;
  ttl_days?: number;
}

export interface DuplicateWarning {
  target: string;
  entry: RegistryEntry;
  agedays: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const HOME = homedir();
export const ECOSYSTEM = join(HOME, 'copywriting-ecosystem');
export const REGISTRY_FILENAME = 'processing-registry.yaml';
export const DEFAULT_TTL_DAYS = 30;

export const EXTRACTION_TOOL_PATTERNS = [
  /^mcp__firecrawl__/,
  /^mcp__apify__/,
  /^mcp__playwright__/,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashInput(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function isExtractionTool(toolName: string): boolean {
  return EXTRACTION_TOOL_PATTERNS.some((pat) => pat.test(toolName));
}

/**
 * Extract URL/path candidates from tool input.
 * Handles various field shapes used by Firecrawl, Apify, Playwright.
 */
export function extractTargets(toolInput: Record<string, unknown>): string[] {
  const candidates: string[] = [];

  const check = (val: unknown): void => {
    if (typeof val === 'string' && val.length > 5) {
      if (
        val.startsWith('http') ||
        val.startsWith('/') ||
        val.includes('.com') ||
        val.includes('.io')
      ) {
        candidates.push(val);
      }
    }
  };

  for (const key of [
    'url',
    'urls',
    'startUrl',
    'searchTerms',
    'query',
    'path',
    'website',
    'link',
  ]) {
    const val = toolInput[key];
    if (Array.isArray(val)) {
      val.forEach(check);
    } else {
      check(val);
    }
  }

  // Also check all string values at top level
  for (const val of Object.values(toolInput)) {
    check(val);
  }

  return [...new Set(candidates)];
}

// ─── Registry lookup ──────────────────────────────────────────────────────────

/**
 * Scan the ecosystem directory for all processing-registry.yaml files.
 */
export function findAllRegistries(): { offer: string; regPath: string }[] {
  const result: { offer: string; regPath: string }[] = [];

  if (!existsSync(ECOSYSTEM)) return result;

  try {
    const niches = readdirSync(ECOSYSTEM).filter((d) => {
      if (d.startsWith('.')) return false;
      try {
        return statSync(join(ECOSYSTEM, d)).isDirectory();
      } catch {
        return false;
      }
    });

    for (const niche of niches) {
      let offers: string[] = [];
      try {
        offers = readdirSync(join(ECOSYSTEM, niche)).filter((d) => {
          if (d.startsWith('.')) return false;
          try {
            return statSync(join(ECOSYSTEM, niche, d)).isDirectory();
          } catch {
            return false;
          }
        });
      } catch {
        continue;
      }

      for (const offer of offers) {
        const rp = join(ECOSYSTEM, niche, offer, REGISTRY_FILENAME);
        if (existsSync(rp)) result.push({ offer, regPath: rp });
      }
    }
  } catch {
    /* scan failed */
  }

  return result;
}

/**
 * Parse YAML registry file into structured RegistryEntry objects.
 */
export function parseEntries(content: string): RegistryEntry[] {
  const entries: RegistryEntry[] = [];
  const blocks = content.split(/\n  - hash:/);

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key: string): string | undefined => {
      const m = block.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n]+)["']?`, 'm'));
      return m ? m[1].trim() : undefined;
    };
    const getNum = (key: string): number | undefined => {
      const m = block.match(new RegExp(`^\\s*${key}:\\s*(\\d+)`, 'm'));
      return m ? parseInt(m[1], 10) : undefined;
    };

    const firstLine = block.split('\n')[0].trim().replace(/^["']|["']$/g, '');
    const entry: RegistryEntry = {
      hash: firstLine,
      path: get('path') || '',
      date: get('date') || '',
      source: get('source') || '',
      offer: get('offer') || '',
      type: get('type') || '',
      extracted_count: getNum('extracted_count'),
      confidence: get('confidence'),
      ttl_days: getNum('ttl_days'),
    };

    if (entry.hash && entry.path && entry.date) entries.push(entry);
  }

  return entries;
}

/**
 * Look up a target URL/path across all registries.
 * Returns a matching entry if found within TTL, otherwise null.
 */
export function lookupTarget(target: string): RegistryEntry | null {
  const targetHash = hashInput(target);
  const registries = findAllRegistries();

  for (const { regPath } of registries) {
    try {
      const content = readFileSync(regPath, 'utf-8');
      const entries = parseEntries(content);

      const match = entries.find(
        (e) => e.hash === targetHash || e.path === target || e.path.includes(target),
      );

      if (match) {
        const age = daysAgo(match.date);
        const ttl = match.ttl_days ?? DEFAULT_TTL_DAYS;
        if (age <= ttl) return match;
      }
    } catch {
      /* skip */
    }
  }

  return null;
}

/**
 * Check all targets from a tool call against the registry.
 * Returns an array of duplicate warnings (empty if none found).
 */
export function checkForDuplicates(input: HookInput): DuplicateWarning[] {
  if (!isExtractionTool(input.tool_name)) return [];

  const targets = extractTargets(input.tool_input);
  if (targets.length === 0) return [];

  const warnings: DuplicateWarning[] = [];

  for (const target of targets) {
    const match = lookupTarget(target);
    if (match) {
      warnings.push({ target, entry: match, agedays: daysAgo(match.date) });
    }
  }

  return warnings;
}

/**
 * Format a set of duplicate warnings into a human-readable stderr message.
 */
export function formatWarnings(warnings: DuplicateWarning[]): string {
  const lines: string[] = ['\n[PROCESSING-CHECK] Duplicate extraction detected:'];

  for (const { target, entry, agedays } of warnings) {
    const ttl = entry.ttl_days ?? DEFAULT_TTL_DAYS;
    const countStr =
      entry.extracted_count !== undefined ? ` (${entry.extracted_count} items extracted)` : '';
    const confStr = entry.confidence ? ` [${entry.confidence}]` : '';

    lines.push(
      `WARNING [REGISTRY] Already processed ${entry.source}/${entry.type}${confStr}: ${target.slice(0, 80)}\n` +
        `  Offer: ${entry.offer} | Processed: ${entry.date.split('T')[0]} (${agedays}d ago, TTL ${ttl}d)${countStr}\n` +
        `  Re-register after TTL or use: bun run scripts/processing-registry.ts reset ${entry.offer} --confirm`,
    );
  }

  lines.push('  To skip: ignore this warning and proceed.');
  lines.push('  To track new results: re-register with updated --count.\n');

  return lines.join('\n');
}
