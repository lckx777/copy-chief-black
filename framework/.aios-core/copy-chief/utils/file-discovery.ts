/**
 * file-discovery.ts — Copy Chief OS Layer
 * copy-chief/utils/file-discovery.ts
 *
 * Business logic for "Discovery Before Implementation":
 * before a new file is created, search for similar existing files nearby
 * and emit a warning if any are found.
 *
 * Used by hook: ~/.claude/hooks/discovery-before-create.ts
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface SimilarFile {
  path: string;
  modified: string;
  similarity: string;
}

export interface DiscoveryResult {
  shouldWarn: boolean;
  filePath: string;
  similar: SimilarFile[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_EXECUTION_MS = 3000;
export const MAX_SIMILAR_FILES = 5;
export const MAX_DEPTH = 2;

/** Directories where new files are expected — suppress warnings. */
export const EXCLUDED_PATTERNS = [
  /\/production\//i,
  /\/research\//i,
  /\/tmp\//i,
  /\/temp\//i,
  /session-state\//i,
  /node_modules\//i,
  /\.git\//i,
  /\/raw\//i,
  /\/processed\//i,
];

// ─── Path helpers ─────────────────────────────────────────────────────────────

export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  for (const field of ['file_path', 'path', 'filePath']) {
    if (typeof toolInput[field] === 'string') {
      return toolInput[field] as string;
    }
  }
  return null;
}

export function isExcludedPath(filePath: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath));
}

export function getFileModifiedDate(filePath: string): string {
  try {
    const stats = statSync(filePath);
    const d = stats.mtime;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return 'unknown';
  }
}

// ─── Similarity ───────────────────────────────────────────────────────────────

/**
 * Compute similarity between two filenames using Jaccard on word segments
 * plus a prefix bonus.
 *
 * @returns value in [0, 1]
 */
export function filenameSimilarity(name1: string, name2: string): number {
  const base1 = basename(name1, extname(name1)).toLowerCase();
  const base2 = basename(name2, extname(name2)).toLowerCase();

  if (base1 === base2) return 1.0;

  const words1 = new Set(base1.split(/[-_.\s]+/).filter((w) => w.length > 1));
  const words2 = new Set(base2.split(/[-_.\s]+/).filter((w) => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = words1.size + words2.size - intersection;
  if (union === 0) return 0;

  const jaccard = intersection / union;

  const firstWord1 = [...words1][0];
  const firstWord2 = [...words2][0];
  const prefixBonus = firstWord1 === firstWord2 ? 0.15 : 0;

  return Math.min(1.0, jaccard + prefixBonus);
}

// ─── Directory search ─────────────────────────────────────────────────────────

/**
 * Find files in a single directory that are similar to targetName.
 * Non-recursive.
 */
export function findSimilarInDir(
  dir: string,
  targetName: string,
  targetExt: string,
): SimilarFile[] {
  const results: SimilarFile[] = [];

  try {
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const fullPath = join(dir, entry);

      try {
        const stats = statSync(fullPath);
        if (!stats.isFile()) continue;
      } catch {
        continue;
      }

      const entryExt = extname(entry);
      const similarity = filenameSimilarity(targetName, entry);

      const sameExt = entryExt === targetExt;
      const threshold = sameExt ? 0.3 : 0.5;

      if (similarity >= threshold) {
        results.push({
          path: fullPath,
          modified: getFileModifiedDate(fullPath),
          similarity: sameExt
            ? `nome ${Math.round(similarity * 100)}% similar, mesma extensao`
            : `nome ${Math.round(similarity * 100)}% similar`,
        });
      }
    }
  } catch {
    /* directory read error — skip silently */
  }

  return results;
}

// ─── Main discovery ───────────────────────────────────────────────────────────

/**
 * Run the full discovery check for a Write tool PreToolUse event.
 * Returns a result indicating whether a warning should be emitted.
 */
export function discoverSimilarFiles(input: PreToolUseInput): DiscoveryResult {
  const noWarn: DiscoveryResult = { shouldWarn: false, filePath: '', similar: [] };

  if (input.tool_name !== 'Write') return noWarn;

  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return noWarn;

  // If the file already exists, this is an intentional overwrite — allow silently
  if (existsSync(filePath)) return noWarn;

  if (isExcludedPath(filePath)) return noWarn;

  const targetDir = dirname(filePath);
  const targetName = basename(filePath);
  const targetExt = extname(filePath);

  const allSimilar: SimilarFile[] = [];

  allSimilar.push(...findSimilarInDir(targetDir, targetName, targetExt));

  let currentDir = targetDir;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;

    allSimilar.push(...findSimilarInDir(parentDir, targetName, targetExt));
    currentDir = parentDir;
  }

  // Deduplicate by path
  const seen = new Set<string>();
  const unique = allSimilar.filter((f) => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });

  // Sort by similarity percentage descending
  unique.sort((a, b) => {
    const pctA = parseInt(a.similarity.match(/(\d+)%/)?.[1] || '0');
    const pctB = parseInt(b.similarity.match(/(\d+)%/)?.[1] || '0');
    return pctB - pctA;
  });

  const topResults = unique.slice(0, MAX_SIMILAR_FILES);

  return {
    shouldWarn: topResults.length > 0,
    filePath,
    similar: topResults,
  };
}

/**
 * Format the discovery result into a human-readable stderr warning message.
 */
export function formatDiscoveryWarning(result: DiscoveryResult): string {
  const fileList = result.similar
    .map((f) => `  - ${f.path} (modificado: ${f.modified}) [${f.similarity}]`)
    .join('\n');

  return (
    `\n\ud83d\udd0d DISCOVERY CHECK: Criando novo arquivo "${basename(result.filePath)}"\n` +
    `Arquivos similares encontrados:\n` +
    `${fileList}\n\n` +
    `Considere: Estender existente ao inves de criar novo?\n` +
    `(Este e um aviso — a criacao NAO foi bloqueada)\n\n`
  );
}
