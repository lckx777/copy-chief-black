#!/usr/bin/env bun
/**
 * session-digest.ts — Session Digest Module
 * copy-chief/lifecycle/session-digest.ts
 *
 * Extracted from ~/.claude/hooks/session-digest-save.ts (342L)
 * Handles: YAML parsing helpers, offer discovery, next-step suggestions,
 * and digest generation before /compact for session continuity.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, statSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME = process.env.HOME || '/tmp';
export const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');
export const DIGESTS_DIR = join(HOME, '.claude', 'session-digests');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OfferInfo {
  name: string;
  path: string;
  fullPath: string;
  phase: string;
  gates: { research: boolean; briefing: boolean; production: boolean };
  mecanismoState: string;
  updatedAt: string;
}

export interface DigestResult {
  filename: string;
  filepath: string;
  offer: OfferInfo;
}

// ─── Minimal YAML Parser ─────────────────────────────────────────────────────

export function parseYamlValue(raw: string): string {
  let v = raw.trim();

  if (v.startsWith('"')) {
    const closeIdx = v.indexOf('"', 1);
    if (closeIdx > 0) return v.slice(1, closeIdx);
  }
  if (v.startsWith("'")) {
    const closeIdx = v.indexOf("'", 1);
    if (closeIdx > 0) return v.slice(1, closeIdx);
  }

  const hashIdx = v.indexOf(' #');
  if (hashIdx > 0) v = v.slice(0, hashIdx).trim();

  return v;
}

export function extractField(content: string, field: string): string {
  const re = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, 'm');
  const m = content.match(re);
  return m ? parseYamlValue(m[1]) : '';
}

export function extractNestedField(content: string, parent: string, field: string): string {
  const parentRe = new RegExp(`^\\s*${parent}\\s*:`, 'm');
  const parentMatch = parentRe.exec(content);
  if (!parentMatch) return '';

  const afterParent = content.slice(parentMatch.index + parentMatch[0].length);
  const lines = afterParent.split('\n');

  for (const line of lines) {
    if (/^\S/.test(line) && line.trim().length > 0) break;
    const fieldRe = new RegExp(`^\\s+${field}\\s*:\\s*(.+)$`);
    const m = line.match(fieldRe);
    if (m) return parseYamlValue(m[1]);
  }
  return '';
}

export function extractGateBool(content: string, gateName: string): boolean {
  const simple = extractNestedField(content, 'gates', gateName);
  if (simple === 'true') return true;
  if (simple === 'false') return false;

  const gatesIdx = content.indexOf('\ngates:');
  if (gatesIdx === -1) return false;

  const afterGates = content.slice(gatesIdx);
  const gateRe = new RegExp(`\\n\\s+${gateName}:\\s*\\n`, 'm');
  const gateMatch = gateRe.exec(afterGates);
  if (!gateMatch) return false;

  const afterGate = afterGates.slice(gateMatch.index + gateMatch[0].length);
  const passedLines = afterGate.split('\n');
  for (const line of passedLines) {
    if (/^\s{2}\S/.test(line) || /^\S/.test(line)) break;
    const passedM = line.match(/^\s+passed\s*:\s*(.+)$/);
    if (passedM) return parseYamlValue(passedM[1]) === 'true';
  }
  return false;
}

export function extractMecanismoState(content: string, offerDir?: string): string {
  const state = extractNestedField(content, 'mecanismo', 'state');
  if (state && state !== '') return state;

  if (offerDir) {
    const mecPath = join(offerDir, 'mecanismo-unico.yaml');
    if (existsSync(mecPath)) {
      try {
        const mecContent = readFileSync(mecPath, 'utf-8');
        const valState = extractNestedField(mecContent, 'validation', 'state');
        if (valState) return valState;
      } catch { /* ignore */ }
    }
  }
  return 'UNDEFINED';
}

export function extractPhase(content: string): string {
  const cp = extractField(content, 'current_phase');
  if (cp) return cp.toUpperCase();
  const wp = extractField(content, 'workflow_phase');
  if (wp) return wp.toUpperCase();
  return 'UNKNOWN';
}

export function extractUpdatedAt(content: string): string {
  return extractField(content, 'updated_at') || '';
}

// ─── File Utilities ───────────────────────────────────────────────────────────

export function findLastModifiedFile(dir: string, maxDepth: number = 3): { path: string; mtime: number } | null {
  if (!existsSync(dir) || maxDepth <= 0) return null;

  let best: { path: string; mtime: number } | null = null;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isFile() && entry.endsWith('.md')) {
          if (!best || st.mtimeMs > best.mtime) {
            best = { path: full, mtime: st.mtimeMs };
          }
        } else if (st.isDirectory()) {
          const sub = findLastModifiedFile(full, maxDepth - 1);
          if (sub && (!best || sub.mtime > best.mtime)) {
            best = sub;
          }
        }
      } catch { /* skip inaccessible */ }
    }
  } catch { /* skip inaccessible */ }

  return best;
}

// ─── Offer Discovery ─────────────────────────────────────────────────────────

export function discoverOffers(): OfferInfo[] {
  const offers: OfferInfo[] = [];
  const niches = ['concursos', 'saude', 'relacionamento', 'riqueza'];

  for (const niche of niches) {
    const nicheDir = join(ECOSYSTEM_ROOT, niche);
    if (!existsSync(nicheDir)) continue;

    let entries: string[];
    try { entries = readdirSync(nicheDir); } catch { continue; }

    for (const entry of entries) {
      const offerDir = join(nicheDir, entry);
      const helixPath = join(offerDir, 'helix-state.yaml');
      if (!existsSync(helixPath)) continue;

      try {
        if (!statSync(offerDir).isDirectory()) continue;
      } catch { continue; }

      const content = readFileSync(helixPath, 'utf-8');
      offers.push({
        name: entry,
        path: `${niche}/${entry}`,
        fullPath: offerDir,
        phase: extractPhase(content),
        gates: {
          research: extractGateBool(content, 'research'),
          briefing: extractGateBool(content, 'briefing'),
          production: extractGateBool(content, 'production'),
        },
        mecanismoState: extractMecanismoState(content, offerDir),
        updatedAt: extractUpdatedAt(content),
      });
    }
  }

  offers.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  return offers;
}

// ─── Next Step Suggestions ────────────────────────────────────────────────────

export function suggestNextSteps(offer: OfferInfo): string[] {
  const { phase, gates, mecanismoState } = offer;
  const steps: string[] = [];

  if (phase === 'PRODUCTION' || (gates.briefing && !gates.production)) {
    if (mecanismoState !== 'VALIDATED' && mecanismoState !== 'APPROVED') {
      steps.push('Validar mecanismo-unico.yaml');
    }
    steps.push('Continuar producao de deliverables');
    steps.push('Rodar blind_critic + emotional_stress_test apos cada bloco');
  } else if (phase === 'BRIEFING' || (gates.research && !gates.briefing)) {
    steps.push('Continuar fases HELIX');
    steps.push('Validar briefing gate ao completar');
  } else if (phase === 'RESEARCH') {
    steps.push('Completar research summaries faltantes');
    steps.push('Validar research gate (validate-gate.py)');
  } else {
    steps.push('Iniciar research (audience-research-agent)');
  }

  return steps;
}

// ─── Digest Generation ────────────────────────────────────────────────────────

export function generateDigest(offer: OfferInfo): string {
  const now = new Date().toISOString();

  let lastModified = '';
  const prodFile = findLastModifiedFile(join(offer.fullPath, 'production'));
  const briefFile = findLastModifiedFile(join(offer.fullPath, 'briefings'));

  if (prodFile && briefFile) {
    const best = prodFile.mtime > briefFile.mtime ? prodFile : briefFile;
    lastModified = best.path.replace(offer.fullPath + '/', '');
  } else if (prodFile) {
    lastModified = prodFile.path.replace(offer.fullPath + '/', '');
  } else if (briefFile) {
    lastModified = briefFile.path.replace(offer.fullPath + '/', '');
  }

  const nextSteps = suggestNextSteps(offer);

  const lines: string[] = [];
  lines.push('# Auto-generated before /compact');
  lines.push('digest:');
  lines.push(`  timestamp: "${now}"`);
  lines.push(`  offer: "${offer.name}"`);
  lines.push(`  offer_path: "${offer.path}"`);
  lines.push(`  phase: "${offer.phase}"`);
  lines.push('  gates:');
  lines.push(`    research: ${offer.gates.research}`);
  lines.push(`    briefing: ${offer.gates.briefing}`);
  lines.push(`    production: ${offer.gates.production}`);
  lines.push(`  mecanismo: "${offer.mecanismoState}"`);
  if (lastModified) {
    lines.push(`  last_modified_file: "${lastModified}"`);
  }
  lines.push('  next_steps:');
  for (const step of nextSteps) {
    lines.push(`    - "${step}"`);
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

export function cleanupOldDigests(): void {
  if (!existsSync(DIGESTS_DIR)) return;

  try {
    const files = readdirSync(DIGESTS_DIR)
      .filter(f => f.endsWith('.yaml'))
      .sort()
      .reverse();

    if (files.length > 10) {
      for (const file of files.slice(10)) {
        try {
          unlinkSync(join(DIGESTS_DIR, file));
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}

// ─── Main Hook Entry Point ────────────────────────────────────────────────────

/**
 * Process a PreCompact event — saves a YAML digest for session continuity.
 * Returns digest result with path info and console feedback lines.
 */
export async function processHookEvent(_input: unknown): Promise<DigestResult | null> {
  if (!existsSync(DIGESTS_DIR)) {
    mkdirSync(DIGESTS_DIR, { recursive: true });
  }

  if (!existsSync(ECOSYSTEM_ROOT)) return null;

  const offers = discoverOffers();
  if (offers.length === 0) return null;

  const active = offers.filter(o => o.phase !== 'IDLE' && o.phase !== 'UNKNOWN' && o.phase !== 'DELIVERED');
  const focus = active.length > 0 ? active[0] : offers[0];

  const digest = generateDigest(focus);

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toISOString().slice(11, 16).replace(':', '');
  const filename = `${dateStr}-${timeStr}-${focus.name}.yaml`;
  const filepath = join(DIGESTS_DIR, filename);

  writeFileSync(filepath, digest, 'utf-8');
  cleanupOldDigests();

  return { filename, filepath, offer: focus };
}
