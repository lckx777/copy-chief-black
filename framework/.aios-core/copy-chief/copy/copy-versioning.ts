#!/usr/bin/env bun
/**
 * Copy Versioning Library v1.0
 * Auto-backs up production copy before overwriting.
 * Enables A/B comparison between versions.
 *
 * Source: AIOS Pro "status-based branching" concept.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

const MAX_VERSIONS = 5;

export interface VersionMeta {
  version: number;
  timestamp: string;
  score?: number;
  iteration?: number;
  source_file: string;
  size_bytes: number;
}

/**
 * Get the .versions/ directory for a given production file
 */
export function getVersionsDir(filePath: string): string {
  const dir = dirname(filePath);
  return join(dir, '.versions');
}

/**
 * Get all versions of a file, sorted by version number (desc)
 */
export function getVersions(filePath: string): { path: string; meta: VersionMeta }[] {
  const versionsDir = getVersionsDir(filePath);
  if (!existsSync(versionsDir)) return [];

  const name = basename(filePath, extname(filePath));
  const ext = extname(filePath);
  const prefix = `${name}.v`;

  const versions: { path: string; meta: VersionMeta }[] = [];

  try {
    for (const file of readdirSync(versionsDir)) {
      if (!file.startsWith(prefix) || !file.endsWith(ext)) continue;

      const versionStr = file.slice(prefix.length, file.length - ext.length);
      const vNum = parseInt(versionStr);
      if (isNaN(vNum)) continue;

      const vPath = join(versionsDir, file);
      const content = readFileSync(vPath, 'utf-8');

      // Try to extract score from content header
      let score: number | undefined;
      const scoreMatch = content.match(/(?:score|Score|BLACK)\s*:\s*(\d+(?:\.\d+)?)/i);
      if (scoreMatch) score = parseFloat(scoreMatch[1]);

      const stat = statSync(vPath);
      versions.push({
        path: vPath,
        meta: {
          version: vNum,
          timestamp: stat.mtime.toISOString(),
          score,
          source_file: filePath,
          size_bytes: stat.size,
        },
      });
    }
  } catch { /* ignore */ }

  return versions.sort((a, b) => b.meta.version - a.meta.version);
}

/**
 * Get the next version number for a file
 */
export function getNextVersion(filePath: string): number {
  const versions = getVersions(filePath);
  if (versions.length === 0) return 1;
  return versions[0].meta.version + 1;
}

/**
 * Save a backup version of a file before overwriting
 * Returns the version path if saved, null if file didn't exist
 */
export function backupVersion(filePath: string): string | null {
  if (!existsSync(filePath)) return null;

  const versionsDir = getVersionsDir(filePath);
  if (!existsSync(versionsDir)) mkdirSync(versionsDir, { recursive: true });

  const name = basename(filePath, extname(filePath));
  const ext = extname(filePath);
  const vNum = getNextVersion(filePath);
  const versionPath = join(versionsDir, `${name}.v${vNum}${ext}`);

  // Copy current file to version
  const content = readFileSync(filePath, 'utf-8');

  // Add version header
  const header = `<!-- Version: ${vNum} | Backed up: ${new Date().toISOString()} -->\n`;
  writeFileSync(versionPath, header + content);

  // Cleanup old versions (keep MAX_VERSIONS)
  cleanupVersions(filePath);

  return versionPath;
}

/**
 * Remove oldest versions beyond MAX_VERSIONS
 */
function cleanupVersions(filePath: string): void {
  const versions = getVersions(filePath);
  if (versions.length <= MAX_VERSIONS) return;

  const toDelete = versions.slice(MAX_VERSIONS);
  for (const v of toDelete) {
    try { unlinkSync(v.path); } catch { /* ignore */ }
  }
}

/**
 * Get best version (highest score) of a file
 */
export function getBestVersion(filePath: string): { path: string; meta: VersionMeta } | null {
  const versions = getVersions(filePath);
  if (versions.length === 0) return null;

  const scored = versions.filter(v => v.meta.score !== undefined);
  if (scored.length === 0) return versions[0]; // Return latest if no scores

  return scored.sort((a, b) => (b.meta.score || 0) - (a.meta.score || 0))[0];
}

/**
 * Simple word-level diff between two texts
 * Returns { added: string[], removed: string[], unchanged: number }
 */
export function simpleDiff(oldText: string, newText: string): { added: string[]; removed: string[]; unchanged: number } {
  const oldWords = new Set(oldText.split(/\s+/).filter(w => w.length > 3));
  const newWords = new Set(newText.split(/\s+/).filter(w => w.length > 3));

  const added: string[] = [];
  const removed: string[] = [];
  let unchanged = 0;

  for (const w of newWords) {
    if (oldWords.has(w)) unchanged++;
    else added.push(w);
  }
  for (const w of oldWords) {
    if (!newWords.has(w)) removed.push(w);
  }

  return { added, removed, unchanged };
}
