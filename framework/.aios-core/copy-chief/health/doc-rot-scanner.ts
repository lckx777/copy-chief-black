#!/usr/bin/env bun
/**
 * doc-rot-scanner.ts — Documentation Rot Detection Module
 * copy-chief/health/doc-rot-scanner.ts
 *
 * Extracted from ~/.claude/hooks/doc-rot-detector.ts (905L)
 * Provides all detection logic, scoring, and report formatting.
 *
 * 3 Detection Layers:
 *   1. Freshness  — Documents not updated after their dependencies changed
 *   2. Contradiction — State mismatches between related files
 *   3. Link Checking — References to files that don't exist
 */

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname, basename, relative } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface RotIssue {
  type: 'FRESHNESS' | 'CONTRADICTION' | 'BROKEN_LINK';
  severity: Severity;
  file: string;
  message: string;
  suggestion: string;
}

export interface RotReport {
  offer_path: string;
  scan_date: string;
  issues: RotIssue[];
  health_score: number;
  summary: string;
}

export interface FreshnessRule {
  trigger: string;
  dependent: string;
  max_age_days?: number;
  max_staleness_hours?: number;
  condition?: string;
  severity?: Severity;
}

export interface ContradictionRule {
  name: string;
  description: string;
  check: (offerPath: string) => RotIssue | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOME = process.env.HOME || '';
export const DEFAULT_ECOSYSTEM = join(HOME, 'copywriting-ecosystem');
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

// ---------------------------------------------------------------------------
// Freshness Rules
// ---------------------------------------------------------------------------

const FRESHNESS_RULES: FreshnessRule[] = [
  {
    trigger: 'helix-state.yaml',
    dependent: 'research/synthesis.md',
    max_age_days: 7,
    condition: "phase != 'IDLE' && phase != 'RESEARCH'",
    severity: 'WARNING',
  },
  {
    trigger: 'mecanismo-unico.yaml',
    dependent: 'CONTEXT.md',
    max_staleness_hours: 24,
    severity: 'WARNING',
  },
  {
    trigger: 'production/**',
    dependent: 'briefings/helix-complete.md',
    max_age_days: 30,
    severity: 'WARNING',
  },
  {
    trigger: 'mecanismo-unico.yaml',
    dependent: 'briefings/helix-complete.md',
    max_staleness_hours: 48,
    severity: 'INFO',
  },
  {
    trigger: 'research/synthesis.md',
    dependent: 'research/voc/summary.md',
    max_age_days: 14,
    severity: 'INFO',
  },
];

// ---------------------------------------------------------------------------
// Contradiction Rules
// ---------------------------------------------------------------------------

const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    name: 'mecanismo_state_vs_production',
    description: 'Production files exist but mecanismo not validated',
    check: (offerPath: string): RotIssue | null => {
      const prodDir = join(offerPath, 'production');
      const mecPath = join(offerPath, 'mecanismo-unico.yaml');

      if (!existsSync(prodDir)) return null;

      const hasProductionFiles = safeReaddir(prodDir).some((entry) => {
        const full = join(prodDir, entry);
        try {
          const st = statSync(full);
          if (st.isDirectory()) {
            return safeReaddir(full).some((f) => f.endsWith('.md') || f.endsWith('.txt'));
          }
          return entry.endsWith('.md') || entry.endsWith('.txt');
        } catch { return false; }
      });

      if (!hasProductionFiles) return null;

      if (!existsSync(mecPath)) {
        return {
          type: 'CONTRADICTION',
          severity: 'CRITICAL',
          file: mecPath,
          message: 'Production files exist but mecanismo-unico.yaml is MISSING.',
          suggestion: 'Create mecanismo-unico.yaml and validate before producing copy.',
        };
      }

      const state = extractYamlField(mecPath, 'state');
      if (state && state !== 'VALIDATED' && state !== 'APPROVED') {
        return {
          type: 'CONTRADICTION',
          severity: 'CRITICAL',
          file: mecPath,
          message: `Production files exist but mecanismo state is "${state}" (needs VALIDATED or APPROVED).`,
          suggestion: `Run consensus + blind_critic + emotional_stress_test to validate mecanismo.`,
        };
      }

      return null;
    },
  },
  {
    name: 'helix_phase_vs_deliverables',
    description: 'HELIX says phase X but deliverables for phase Y exist',
    check: (offerPath: string): RotIssue | null => {
      const helixPath = join(offerPath, 'helix-state.yaml');
      if (!existsSync(helixPath)) return null;

      const currentPhase = extractYamlField(helixPath, 'current_phase');
      const briefingsDir = join(offerPath, 'briefings');

      if (currentPhase === 'research' || currentPhase === 'RESEARCH' || currentPhase === 'idle' || currentPhase === 'IDLE') {
        if (existsSync(briefingsDir)) {
          const briefingFiles = safeReaddir(briefingsDir).filter(
            (f) => f.endsWith('.md') && f !== 'README.md'
          );
          const phasesDir = join(briefingsDir, 'phases');
          const phaseFiles = existsSync(phasesDir)
            ? safeReaddir(phasesDir).filter((f) => f.endsWith('.md'))
            : [];

          if (briefingFiles.length > 0 || phaseFiles.length > 0) {
            return {
              type: 'CONTRADICTION',
              severity: 'WARNING',
              file: helixPath,
              message: `helix-state says current_phase="${currentPhase}" but briefings/ already has ${briefingFiles.length + phaseFiles.length} file(s).`,
              suggestion: 'Update helix-state.yaml current_phase to match actual progress, or verify this is a manual override.',
            };
          }
        }
      }

      return null;
    },
  },
  {
    name: 'context_vs_mecanismo',
    description: 'CONTEXT.md MUP does not match mecanismo-unico.yaml MUP',
    check: (offerPath: string): RotIssue | null => {
      const contextPath = join(offerPath, 'CONTEXT.md');
      const mecPath = join(offerPath, 'mecanismo-unico.yaml');

      if (!existsSync(contextPath) || !existsSync(mecPath)) return null;

      const contextMup = extractMupFromContext(contextPath);
      const yamlMup = extractMupFromMecanismo(mecPath);

      if (!contextMup || !yamlMup) return null;

      const normContext = normalizeForComparison(contextMup);
      const normYaml = normalizeForComparison(yamlMup);

      if (normContext.length > 3 && normYaml.length > 3 && normContext !== normYaml) {
        if (!normContext.includes(normYaml) && !normYaml.includes(normContext)) {
          return {
            type: 'CONTRADICTION',
            severity: 'CRITICAL',
            file: contextPath,
            message: `MUP name mismatch — CONTEXT.md: "${contextMup}" vs mecanismo-unico.yaml: "${yamlMup}".`,
            suggestion: 'Align MUP name in CONTEXT.md with the validated name in mecanismo-unico.yaml.',
          };
        }
      }

      return null;
    },
  },
  {
    name: 'gates_vs_state',
    description: 'helix-state gates passed but state is behind',
    check: (offerPath: string): RotIssue | null => {
      const helixPath = join(offerPath, 'helix-state.yaml');
      if (!existsSync(helixPath)) return null;

      let content: string;
      try { content = readFileSync(helixPath, 'utf-8'); } catch { return null; }

      const currentPhase = extractYamlField(helixPath, 'current_phase');
      const researchGate = content.match(/gates:\s*\n\s*research:\s*(true|false)/)?.[1];
      const briefingGate = content.match(/gates:[\s\S]*?briefing:\s*(true|false)/)?.[1];

      if (briefingGate === 'true' && (currentPhase === 'research' || currentPhase === 'RESEARCH')) {
        return {
          type: 'CONTRADICTION',
          severity: 'WARNING',
          file: helixPath,
          message: 'Briefing gate is marked as passed but current_phase is still "research".',
          suggestion: 'Update current_phase to "briefing" or "production" to match gate status.',
        };
      }

      if (researchGate === 'false' && currentPhase && currentPhase !== 'idle' && currentPhase !== 'IDLE' && currentPhase !== 'research' && currentPhase !== 'RESEARCH') {
        return {
          type: 'CONTRADICTION',
          severity: 'WARNING',
          file: helixPath,
          message: `current_phase="${currentPhase}" but research gate has not passed.`,
          suggestion: 'Run validate_gate for research or update gate status.',
        };
      }

      return null;
    },
  },
  {
    name: 'synthesis_missing_for_briefing',
    description: 'Briefing exists but synthesis.md is missing',
    check: (offerPath: string): RotIssue | null => {
      const synthesisPath = join(offerPath, 'research', 'synthesis.md');
      const briefingsDir = join(offerPath, 'briefings');

      if (!existsSync(briefingsDir)) return null;

      const phasesDir = join(briefingsDir, 'phases');
      const hasPhases = existsSync(phasesDir) && safeReaddir(phasesDir).some((f) => f.endsWith('.md'));
      const hasHelixComplete = existsSync(join(briefingsDir, 'helix-complete.md'));

      if ((hasPhases || hasHelixComplete) && !existsSync(synthesisPath)) {
        return {
          type: 'CONTRADICTION',
          severity: 'WARNING',
          file: synthesisPath,
          message: 'Briefing files exist but research/synthesis.md is missing.',
          suggestion: 'Ensure research was completed and synthesis.md was generated before briefing.',
        };
      }

      return null;
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeReaddir(dir: string): string[] {
  try { return readdirSync(dir); } catch { return []; }
}

function safeStat(filePath: string): { mtimeMs: number } | null {
  try { return statSync(filePath); } catch { return null; }
}

function extractYamlField(filePath: string, fieldName: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const regex = new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*["']?([^"'\\n]+)["']?`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  } catch { return null; }
}

function extractMupFromContext(contextPath: string): string | null {
  try {
    const content = readFileSync(contextPath, 'utf-8');
    const patterns = [
      /\*\*(?:Sexy Cause|MUP)\*?\*?[^"]*"([^"]+)"/i,
      /MUP[^|]*\|\s*([^\n|]+)/i,
      /Sexy Cause[^|]*\|\s*([^\n|]+)/i,
    ];
    for (const p of patterns) {
      const m = content.match(p);
      if (m) return m[1].trim();
    }
    return null;
  } catch { return null; }
}

function extractMupFromMecanismo(mecPath: string): string | null {
  try {
    const content = readFileSync(mecPath, 'utf-8');
    const match = content.match(/sexy_cause:\s*\n\s*name:\s*["']?([^"'\n]+)["']?/i);
    return match ? match[1].trim() : null;
  } catch { return null; }
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[""''`]/g, '')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFileMtimeMs(filePath: string): number | null {
  const st = safeStat(filePath);
  return st ? st.mtimeMs : null;
}

function resolveGlobMtime(offerPath: string, globPattern: string): number | null {
  if (globPattern.includes('**')) {
    const baseDir = join(offerPath, globPattern.replace('/**', ''));
    return getNewestMtimeRecursive(baseDir);
  }
  return getFileMtimeMs(join(offerPath, globPattern));
}

function getNewestMtimeRecursive(dir: string, maxDepth: number = 3): number | null {
  if (!existsSync(dir) || maxDepth <= 0) return null;
  let newest: number | null = null;

  for (const entry of safeReaddir(dir)) {
    const full = join(dir, entry);
    const st = safeStat(full);
    if (!st) continue;

    try {
      const info = statSync(full);
      if (info.isDirectory()) {
        const sub = getNewestMtimeRecursive(full, maxDepth - 1);
        if (sub !== null && (newest === null || sub > newest)) newest = sub;
      } else {
        if (newest === null || st.mtimeMs > newest) newest = st.mtimeMs;
      }
    } catch { /* skip */ }
  }
  return newest;
}

function evaluateCondition(condition: string, offerPath: string): boolean {
  if (condition.includes('phase')) {
    const helixPath = join(offerPath, 'helix-state.yaml');
    const phase = extractYamlField(helixPath, 'current_phase') || 'IDLE';
    const normalized = phase.toUpperCase();

    if (condition.includes("!= 'IDLE'") && condition.includes("!= 'RESEARCH'")) {
      return normalized !== 'IDLE' && normalized !== 'RESEARCH';
    }
    if (condition.includes("!= 'IDLE'")) return normalized !== 'IDLE';
    if (condition.includes("!= 'RESEARCH'")) return normalized !== 'RESEARCH';
  }
  return true;
}

// ---------------------------------------------------------------------------
// Detection Layer 1: Freshness
// ---------------------------------------------------------------------------

export function checkFreshness(offerPath: string): RotIssue[] {
  const issues: RotIssue[] = [];
  const now = Date.now();

  for (const rule of FRESHNESS_RULES) {
    if (rule.condition && !evaluateCondition(rule.condition, offerPath)) {
      continue;
    }

    const triggerMtime = resolveGlobMtime(offerPath, rule.trigger);
    const dependentPath = join(offerPath, rule.dependent);

    if (triggerMtime === null) continue;

    if (!existsSync(dependentPath)) {
      if (existsSync(join(offerPath, rule.trigger))) {
        issues.push({
          type: 'FRESHNESS',
          severity: rule.severity || 'WARNING',
          file: dependentPath,
          message: `"${rule.dependent}" does not exist but "${rule.trigger}" was last updated ${formatAge(now - triggerMtime)} ago.`,
          suggestion: `Create or update "${rule.dependent}" to stay in sync with "${rule.trigger}".`,
        });
      }
      continue;
    }

    const dependentMtime = getFileMtimeMs(dependentPath);
    if (dependentMtime === null) continue;

    if (rule.max_staleness_hours !== undefined) {
      const staleMs = triggerMtime - dependentMtime;
      const thresholdMs = rule.max_staleness_hours * MS_PER_HOUR;
      if (staleMs > thresholdMs) {
        issues.push({
          type: 'FRESHNESS',
          severity: rule.severity || 'WARNING',
          file: dependentPath,
          message: `"${rule.dependent}" is ${formatAge(staleMs)} older than "${rule.trigger}" (max staleness: ${rule.max_staleness_hours}h).`,
          suggestion: `Update "${rule.dependent}" to reflect changes in "${rule.trigger}".`,
        });
      }
    }

    if (rule.max_age_days !== undefined) {
      const ageMs = now - dependentMtime;
      const thresholdMs = rule.max_age_days * MS_PER_DAY;
      if (ageMs > thresholdMs) {
        issues.push({
          type: 'FRESHNESS',
          severity: rule.severity || 'WARNING',
          file: dependentPath,
          message: `"${rule.dependent}" is ${formatAge(ageMs)} old (max age: ${rule.max_age_days} days).`,
          suggestion: `Review and update "${rule.dependent}" — it may be outdated.`,
        });
      }
    }
  }

  return issues;
}

function formatAge(ms: number): string {
  const hours = Math.floor(ms / MS_PER_HOUR);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// ---------------------------------------------------------------------------
// Detection Layer 2: Contradictions
// ---------------------------------------------------------------------------

export function checkContradictions(offerPath: string): RotIssue[] {
  const issues: RotIssue[] = [];

  for (const rule of CONTRADICTION_RULES) {
    try {
      const issue = rule.check(offerPath);
      if (issue) issues.push(issue);
    } catch (err) {
      issues.push({
        type: 'CONTRADICTION',
        severity: 'INFO',
        file: offerPath,
        message: `Contradiction rule "${rule.name}" failed to execute: ${err}`,
        suggestion: 'Check file permissions and YAML syntax.',
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Detection Layer 3: Link Checking
// ---------------------------------------------------------------------------

export function checkLinks(offerPath: string): RotIssue[] {
  const issues: RotIssue[] = [];
  const mdFiles = collectMarkdownFiles(offerPath, 3);

  for (const mdFile of mdFiles) {
    let content: string;
    try { content = readFileSync(mdFile, 'utf-8'); } catch { continue; }

    const backtickRefs = content.matchAll(/`([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,5})`/g);
    for (const match of backtickRefs) {
      const ref = match[1];
      if (ref.includes('://') || ref.startsWith('.') || ref.includes('*')) continue;
      if (/^\d/.test(ref) || ref.length < 4) continue;

      const candidates = [
        join(dirname(mdFile), ref),
        join(offerPath, ref),
      ];

      const found = candidates.some((c) => existsSync(c));
      if (!found) {
        if (ref.includes('/') && /\.\w{1,5}$/.test(ref)) {
          issues.push({
            type: 'BROKEN_LINK',
            severity: 'INFO',
            file: mdFile,
            message: `Reference to "${ref}" not found.`,
            suggestion: `Verify the path in ${basename(mdFile)} or update the reference.`,
          });
        }
      }
    }

    const refLines = content.matchAll(/(?:Ref|Referencia|Arquivo)[^:]*:\s*`?([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,5})`?/gi);
    for (const match of refLines) {
      const ref = match[1];
      if (ref.includes('://') || ref.includes('*')) continue;

      const candidates = [
        join(dirname(mdFile), ref),
        join(offerPath, ref),
        join(offerPath, '..', ref),
      ];

      const found = candidates.some((c) => existsSync(c));
      if (!found && ref.includes('/')) {
        issues.push({
          type: 'BROKEN_LINK',
          severity: 'WARNING',
          file: mdFile,
          message: `Explicit reference to "${ref}" not found.`,
          suggestion: `Update or remove the broken reference in ${basename(mdFile)}.`,
        });
      }
    }
  }

  return issues;
}

function collectMarkdownFiles(dir: string, maxDepth: number): string[] {
  if (maxDepth <= 0 || !existsSync(dir)) return [];
  const results: string[] = [];

  for (const entry of safeReaddir(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === 'raw') continue;

    const full = join(dir, entry);
    try {
      const st = statSync(full);
      if (st.isDirectory()) {
        results.push(...collectMarkdownFiles(full, maxDepth - 1));
      } else if (entry.endsWith('.md')) {
        results.push(full);
      }
    } catch { /* skip */ }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Health Score
// ---------------------------------------------------------------------------

export function calculateHealthScore(issues: RotIssue[]): number {
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case 'CRITICAL': score -= 20; break;
      case 'WARNING':  score -= 10; break;
      case 'INFO':     score -= 2;  break;
    }
  }

  return Math.max(0, score);
}

// ---------------------------------------------------------------------------
// Core Scan Functions
// ---------------------------------------------------------------------------

export function scanOffer(offerPath: string): RotReport {
  const freshnessIssues = checkFreshness(offerPath);
  const contradictionIssues = checkContradictions(offerPath);
  const linkIssues = checkLinks(offerPath);

  const issues = [...freshnessIssues, ...contradictionIssues, ...linkIssues];
  const healthScore = calculateHealthScore(issues);

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const infoCount = issues.filter((i) => i.severity === 'INFO').length;

  let summary: string;
  if (issues.length === 0) {
    summary = 'No documentation rot detected. All files are consistent and up to date.';
  } else {
    const parts: string[] = [];
    if (criticalCount > 0) parts.push(`${criticalCount} CRITICAL`);
    if (warningCount > 0) parts.push(`${warningCount} WARNING`);
    if (infoCount > 0) parts.push(`${infoCount} INFO`);
    summary = `Found ${issues.length} issue(s): ${parts.join(', ')}. Health Score: ${healthScore}/100.`;
  }

  return {
    offer_path: offerPath,
    scan_date: new Date().toISOString(),
    issues,
    health_score: healthScore,
    summary,
  };
}

export function scanAllOffers(ecosystemPath: string): RotReport[] {
  const reports: RotReport[] = [];
  const offerPaths = discoverOffers(ecosystemPath);

  for (const offerPath of offerPaths) {
    reports.push(scanOffer(offerPath));
  }

  return reports;
}

export function discoverOffers(ecosystemPath: string): string[] {
  const offers: string[] = [];

  for (const nicheDir of safeReaddir(ecosystemPath)) {
    if (nicheDir.startsWith('.') || nicheDir === 'node_modules' || nicheDir === 'site' || nicheDir === 'scripts' || nicheDir === 'export') continue;

    const nichePath = join(ecosystemPath, nicheDir);
    try {
      if (!statSync(nichePath).isDirectory()) continue;
    } catch { continue; }

    for (const offerDir of safeReaddir(nichePath)) {
      if (offerDir.startsWith('.') || offerDir.startsWith('biblioteca_')) continue;

      const offerPath = join(nichePath, offerDir);
      try {
        if (!statSync(offerPath).isDirectory()) continue;
      } catch { continue; }

      const hasContext = existsSync(join(offerPath, 'CONTEXT.md'));
      const hasMecanismo = existsSync(join(offerPath, 'mecanismo-unico.yaml'));
      const hasHelix = existsSync(join(offerPath, 'helix-state.yaml'));

      if (hasContext || hasMecanismo || hasHelix) {
        offers.push(offerPath);
      }
    }
  }

  return offers;
}

// ---------------------------------------------------------------------------
// Output: Human-Readable Report
// ---------------------------------------------------------------------------

export function formatReport(report: RotReport): string {
  const lines: string[] = [];
  const offerName = report.offer_path.split('/').slice(-2).join('/');

  lines.push('='.repeat(60));
  lines.push(`DOC ROT REPORT: ${offerName}`);
  lines.push(`Scan Date: ${report.scan_date}`);
  lines.push(`Health Score: ${report.health_score}/100`);
  lines.push('='.repeat(60));
  lines.push('');

  if (report.issues.length === 0) {
    lines.push('  All clear. No documentation rot detected.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push(report.summary);
  lines.push('');

  const grouped: Record<string, RotIssue[]> = {
    FRESHNESS: [],
    CONTRADICTION: [],
    BROKEN_LINK: [],
  };

  for (const issue of report.issues) {
    grouped[issue.type].push(issue);
  }

  for (const [type, issues] of Object.entries(grouped)) {
    if (issues.length === 0) continue;

    const label = type === 'FRESHNESS' ? 'Freshness Issues'
      : type === 'CONTRADICTION' ? 'Contradiction Issues'
      : 'Broken Links';

    lines.push(`--- ${label} (${issues.length}) ---`);
    lines.push('');

    for (const issue of issues) {
      const sevTag = issue.severity === 'CRITICAL' ? '[CRITICAL]'
        : issue.severity === 'WARNING' ? '[WARNING]'
        : '[INFO]';

      const relFile = relative(report.offer_path, issue.file) || basename(issue.file);
      lines.push(`  ${sevTag} ${relFile}`);
      lines.push(`    ${issue.message}`);
      lines.push(`    -> ${issue.suggestion}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Output: Save YAML Report
// ---------------------------------------------------------------------------

function escapeYamlString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function saveReport(report: RotReport): void {
  const reportPath = join(report.offer_path, 'doc-rot-report.yaml');

  const lines: string[] = [];
  lines.push('# Doc Rot Report — Auto-generated');
  lines.push(`# Do not edit manually. Re-run: bun run ~/.claude/hooks/doc-rot-detector.ts ${report.offer_path}`);
  lines.push('');
  lines.push(`offer_path: "${report.offer_path}"`);
  lines.push(`scan_date: "${report.scan_date}"`);
  lines.push(`health_score: ${report.health_score}`);
  lines.push(`summary: "${escapeYamlString(report.summary)}"`);
  lines.push(`issue_count: ${report.issues.length}`);
  lines.push('');

  if (report.issues.length > 0) {
    lines.push('issues:');
    for (const issue of report.issues) {
      lines.push(`  - type: ${issue.type}`);
      lines.push(`    severity: ${issue.severity}`);
      lines.push(`    file: "${escapeYamlString(relative(report.offer_path, issue.file) || issue.file)}"`);
      lines.push(`    message: "${escapeYamlString(issue.message)}"`);
      lines.push(`    suggestion: "${escapeYamlString(issue.suggestion)}"`);
    }
  } else {
    lines.push('issues: []');
  }

  try {
    writeFileSync(reportPath, lines.join('\n') + '\n');
  } catch (err) {
    console.error(`Failed to save report to ${reportPath}: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Hook Entry Point: processHookEvent
// ---------------------------------------------------------------------------

export interface DocRotHookInput {
  /** Optional: single offer path to scan. If absent, scan all. */
  offer_path?: string;
  ecosystem_path?: string;
}

export interface DocRotHookOutput {
  scanned: number;
  total_issues: number;
  critical: number;
  warning: number;
  info: number;
  avg_health: number;
  warnings: string[];
}

/**
 * Main entry point for hook usage.
 * Scans offer(s) and returns structured output.
 */
export async function processHookEvent(input: DocRotHookInput): Promise<DocRotHookOutput> {
  const ecosystemPath = input.ecosystem_path || DEFAULT_ECOSYSTEM;

  let reports: RotReport[];

  if (input.offer_path) {
    let offerPath = input.offer_path;
    if (!existsSync(offerPath)) {
      offerPath = join(ecosystemPath, input.offer_path);
    }
    reports = existsSync(offerPath) ? [scanOffer(offerPath)] : [];
  } else {
    reports = scanAllOffers(ecosystemPath);
  }

  let totalIssues = 0;
  let critical = 0;
  let warning = 0;
  let info = 0;
  const warnings: string[] = [];

  for (const report of reports) {
    totalIssues += report.issues.length;
    critical += report.issues.filter(i => i.severity === 'CRITICAL').length;
    warning += report.issues.filter(i => i.severity === 'WARNING').length;
    info += report.issues.filter(i => i.severity === 'INFO').length;

    // Collect critical and warning messages for hook stderr output
    for (const issue of report.issues) {
      if (issue.severity === 'CRITICAL' || issue.severity === 'WARNING') {
        const offerName = report.offer_path.split('/').slice(-2).join('/');
        warnings.push(`[DOC-ROT][${issue.severity}] ${offerName}: ${issue.message}`);
      }
    }

    // Save report to disk
    try { saveReport(report); } catch { /* non-fatal */ }
  }

  const avgHealth = reports.length > 0
    ? Math.round(reports.reduce((s, r) => s + r.health_score, 0) / reports.length)
    : 100;

  return {
    scanned: reports.length,
    total_issues: totalIssues,
    critical,
    warning,
    info,
    avg_health: avgHealth,
    warnings,
  };
}
