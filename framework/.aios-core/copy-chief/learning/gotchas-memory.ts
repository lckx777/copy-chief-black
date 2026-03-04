/**
 * Gotchas Memory
 *
 * Port of: aios-core/.aios-core/core/memory/gotchas-memory.js
 * Adapted for Copy Chief BLACK: copywriting-domain gotchas.
 *
 * Persists to {offer}/.aios/gotchas.json and gotchas.md
 * Auto-captures repeated errors (3x = gotcha).
 *
 * @module lib/gotchas-memory
 * @version 1.0.0
 * @forked aios-core v4.4.6
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { EventEmitter } from 'events';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GotchaCategoryType = 'build' | 'test' | 'lint' | 'runtime' | 'integration' | 'security' | 'general';
export type SeverityType = 'info' | 'warning' | 'critical';

export interface GotchaSource {
  type: 'manual' | 'auto_detected';
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface GotchaTrigger {
  errorPattern?: string;
  files?: string[];
}

export interface Gotcha {
  id: string;
  title: string;
  description: string;
  category: GotchaCategoryType;
  severity: SeverityType;
  workaround: string | null;
  relatedFiles: string[];
  trigger: GotchaTrigger | null;
  source: GotchaSource;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export interface ErrorTracking {
  count: number;
  firstSeen: number;
  lastSeen: number;
  samples: Array<{ timestamp: string; file?: string; context?: unknown }>;
  errorPattern: string;
  category: GotchaCategoryType;
}

export interface GotchaStatistics {
  totalGotchas: number;
  resolved: number;
  unresolved: number;
  byCategory: Record<string, number>;
  bySeverity: { critical: number; warning: number; info: number };
  bySource: { manual: number; auto_detected: number };
  trackedErrors: number;
  pendingAutoCapture: number;
}

export interface AddGotchaData {
  id?: string;
  title?: string;
  description?: string;
  category?: GotchaCategoryType;
  severity?: SeverityType | string;
  workaround?: string;
  relatedFiles?: string[];
  trigger?: GotchaTrigger;
  occurrences?: number;
  firstSeen?: string;
  lastSeen?: string;
}

export interface TrackErrorData {
  message: string;
  stack?: string;
  file?: string;
  category?: GotchaCategoryType;
  context?: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPEAT_THRESHOLD = 3;
const ERROR_WINDOW_MS = 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = 'aios-gotchas-memory-v1';
const VERSION = '1.0.0';

const CATEGORY_KEYWORDS: Record<GotchaCategoryType, string[]> = {
  build: ['build', 'compile', 'webpack', 'bundle', 'typescript', 'tsc'],
  test: ['test', 'jest', 'vitest', 'expect', 'assert', 'coverage'],
  lint: ['lint', 'eslint', 'prettier', 'format', 'indentation'],
  runtime: ['runtime', 'TypeError', 'ReferenceError', 'null', 'undefined', 'crash'],
  integration: ['api', 'http', 'fetch', 'cors', 'database', 'postgres'],
  security: ['security', 'xss', 'csrf', 'injection', 'auth', 'token'],
  general: [],
};

// ─── GotchasMemory ─────────────────────────────────────────────────────────────

export class GotchasMemory extends EventEmitter {
  private rootPath: string;
  private gotchasJsonPath: string;
  private gotchasMdPath: string;
  private errorTrackingPath: string;
  private repeatThreshold: number;
  private quiet: boolean;
  gotchas: Map<string, Gotcha>;
  errorTracking: Map<string, ErrorTracking>;

  constructor(rootPath: string, options: { repeatThreshold?: number; quiet?: boolean } = {}) {
    super();
    this.rootPath = rootPath || process.cwd();
    this.repeatThreshold = options.repeatThreshold ?? REPEAT_THRESHOLD;
    this.quiet = options.quiet ?? false;

    this.gotchasJsonPath = join(this.rootPath, '.aios', 'gotchas.json');
    this.gotchasMdPath = join(this.rootPath, '.aios', 'gotchas.md');
    this.errorTrackingPath = join(this.rootPath, '.aios', 'error-tracking.json');

    this.gotchas = new Map();
    this.errorTracking = new Map();

    this._loadGotchas();
    this._loadErrorTracking();
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  addGotcha(data: AddGotchaData): Gotcha {
    const gotcha = this._createGotcha(data, 'manual');
    this.gotchas.set(gotcha.id, gotcha);
    this._saveGotchas();
    this.emit('gotcha_added', gotcha);
    return gotcha;
  }

  trackError(errorData: TrackErrorData): Gotcha | null {
    const errorHash = this._hashError(errorData);
    const now = Date.now();

    let tracking = this.errorTracking.get(errorHash);
    if (!tracking) {
      tracking = {
        count: 0,
        firstSeen: now,
        lastSeen: now,
        samples: [],
        errorPattern: errorData.message,
        category: this._detectCategory(errorData.message + ' ' + (errorData.stack || '')),
      };
    }

    tracking.count++;
    tracking.lastSeen = now;
    if (tracking.samples.length < 5) {
      tracking.samples.push({
        timestamp: new Date(now).toISOString(),
        file: errorData.file,
        context: errorData.context,
      });
    }

    this.errorTracking.set(errorHash, tracking);
    this._saveErrorTracking();

    this.emit('error_tracked', { errorHash, tracking });

    if (tracking.count >= this.repeatThreshold) {
      const existing = this._findGotchaByErrorPattern(errorData.message);
      if (!existing) {
        return this._autoCaptureGotcha(errorData, tracking);
      }
    }

    return null;
  }

  listGotchas(options: { category?: GotchaCategoryType; severity?: SeverityType; unresolved?: boolean } = {}): Gotcha[] {
    let list = [...this.gotchas.values()];

    if (options.category) list = list.filter(g => g.category === options.category);
    if (options.severity) list = list.filter(g => g.severity === options.severity);
    if (options.unresolved) list = list.filter(g => !g.resolved);

    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    list.sort((a, b) => {
      const diff = (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
      if (diff !== 0) return diff;
      return new Date(b.source.lastSeen).getTime() - new Date(a.source.lastSeen).getTime();
    });

    return list;
  }

  getContextForTask(taskDescription: string, relatedFiles: string[] = []): Array<Gotcha & { relevanceScore: number }> {
    const descLower = taskDescription.toLowerCase();
    const filePaths = relatedFiles.map(f => f.toLowerCase());
    const scored: Array<Gotcha & { relevanceScore: number }> = [];

    for (const gotcha of this.gotchas.values()) {
      if (gotcha.resolved) continue;
      let score = 0;

      if (gotcha.category === this._detectCategory(taskDescription)) score += 3;

      const keywords = this._extractKeywords(`${gotcha.title} ${gotcha.description} ${gotcha.workaround || ''}`);
      for (const kw of keywords) {
        if (descLower.includes(kw)) score += 1;
      }

      for (const gf of (gotcha.relatedFiles || [])) {
        for (const tf of filePaths) {
          if (tf.includes(gf.toLowerCase()) || gf.toLowerCase().includes(tf)) score += 2;
        }
      }

      if (gotcha.trigger?.errorPattern && descLower.includes(gotcha.trigger.errorPattern.toLowerCase())) {
        score += 5;
      }

      if (score > 0) scored.push({ ...gotcha, relevanceScore: score });
    }

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored.slice(0, 5);
  }

  formatForPrompt(gotchas: Gotcha[]): string {
    if (!gotchas || gotchas.length === 0) return '';

    let out = '\n## Known Gotchas (Review Before Proceeding)\n\n';
    for (const g of gotchas) {
      const icon = { critical: '[CRITICAL]', warning: '[WARNING]', info: '[INFO]' }[g.severity] || '[INFO]';
      out += `### ${icon} ${g.title}\n${g.description}\n`;
      if (g.workaround) out += `\n**Workaround:** ${g.workaround}\n`;
      if (g.relatedFiles?.length) out += `**Related Files:** ${g.relatedFiles.join(', ')}\n`;
      out += '\n';
    }
    return out;
  }

  resolveGotcha(gotchaId: string, resolvedBy = 'manual'): Gotcha | null {
    const gotcha = this.gotchas.get(gotchaId);
    if (!gotcha) return null;

    gotcha.resolved = true;
    gotcha.resolvedAt = new Date().toISOString();
    gotcha.resolvedBy = resolvedBy;

    this._saveGotchas();
    this.emit('gotcha_resolved', gotcha);
    return gotcha;
  }

  removeGotcha(gotchaId: string): boolean {
    const gotcha = this.gotchas.get(gotchaId);
    if (!gotcha) return false;

    this.gotchas.delete(gotchaId);
    this._saveGotchas();
    this.emit('gotcha_removed', gotcha);
    return true;
  }

  search(query: string): Gotcha[] {
    const q = query.toLowerCase();
    return [...this.gotchas.values()].filter(g => {
      const text = [g.id, g.title, g.description, g.workaround || '', g.category, ...(g.relatedFiles || [])].join(' ').toLowerCase();
      return text.includes(q);
    });
  }

  getStatistics(): GotchaStatistics {
    const list = [...this.gotchas.values()];
    const byCategory: Record<string, number> = {};
    const bySeverity = { critical: 0, warning: 0, info: 0 };
    const bySource = { manual: 0, auto_detected: 0 };

    for (const g of list) {
      byCategory[g.category] = (byCategory[g.category] || 0) + 1;
      bySeverity[g.severity] = (bySeverity[g.severity] || 0) + 1;
      bySource[g.source.type] = (bySource[g.source.type] || 0) + 1;
    }

    return {
      totalGotchas: list.length,
      resolved: list.filter(g => g.resolved).length,
      unresolved: list.filter(g => !g.resolved).length,
      byCategory,
      bySeverity,
      bySource,
      trackedErrors: this.errorTracking.size,
      pendingAutoCapture: [...this.errorTracking.values()].filter(t => t.count >= this.repeatThreshold - 1 && t.count < this.repeatThreshold).length,
    };
  }

  toJSON(): object {
    return {
      schema: SCHEMA_VERSION,
      version: VERSION,
      lastUpdated: new Date().toISOString(),
      statistics: this.getStatistics(),
      gotchas: [...this.gotchas.values()],
    };
  }

  toMarkdown(): string {
    const stats = this.getStatistics();
    const now = new Date().toISOString();
    const cats = Object.keys(CATEGORY_KEYWORDS) as GotchaCategoryType[];

    let md = `# Known Gotchas\n\n> Last updated: ${now}\n> Total: ${stats.totalGotchas} (${stats.unresolved} unresolved)\n\n---\n\n`;

    for (const cat of cats) {
      const items = this.listGotchas({ category: cat });
      if (!items.length) continue;

      md += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`;
      for (const g of items) {
        const icon = { critical: '**[CRITICAL]**', warning: '**[WARNING]**', info: '[INFO]' }[g.severity] || '';
        md += `### ${g.title}\n\n${icon}${g.resolved ? ' (RESOLVED)' : ''}\n\n${g.description}\n\n`;
        if (g.workaround) md += `**Workaround:** ${g.workaround}\n\n`;
        if (g.relatedFiles?.length) md += `**Related Files:** ${g.relatedFiles.join(', ')}\n\n`;
        md += `**Source:** ${g.source.type} (${g.source.occurrences} occurrences)\n**First Seen:** ${g.source.firstSeen}\n\n---\n\n`;
      }
    }

    md += `---\n\n## Statistics\n\n| Metric | Value |\n|--------|-------|\n| Total | ${stats.totalGotchas} |\n| Unresolved | ${stats.unresolved} |\n| Critical | ${stats.bySeverity.critical} |\n| Warning | ${stats.bySeverity.warning} |\n| Info | ${stats.bySeverity.info} |\n\n*Generated by GotchasMemory v${VERSION}*\n`;
    return md;
  }

  save(): void {
    this._saveGotchas();
    this._saveErrorTracking();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private _createGotcha(data: AddGotchaData, sourceType: 'manual' | 'auto_detected'): Gotcha {
    const now = new Date().toISOString();
    const category = data.category || this._detectCategory(`${data.title || ''} ${data.description || ''}`);

    return {
      id: data.id || this._generateId(),
      title: data.title || 'Untitled Gotcha',
      description: data.description || '',
      category,
      severity: this._normalizeSeverity(data.severity),
      workaround: data.workaround || null,
      relatedFiles: data.relatedFiles || [],
      trigger: data.trigger || null,
      source: {
        type: sourceType,
        occurrences: data.occurrences || 1,
        firstSeen: data.firstSeen || now,
        lastSeen: data.lastSeen || now,
      },
      resolved: false,
      resolvedAt: null,
      resolvedBy: null,
      createdAt: now,
    };
  }

  private _autoCaptureGotcha(errorData: TrackErrorData, tracking: ErrorTracking): Gotcha {
    const gotcha = this._createGotcha({
      title: this._generateTitleFromError(errorData.message),
      description: errorData.message,
      category: tracking.category,
      severity: 'warning',
      relatedFiles: tracking.samples.filter(s => s.file).map(s => s.file!).filter((f, i, arr) => arr.indexOf(f) === i),
      trigger: { errorPattern: this._extractErrorPattern(errorData.message), files: tracking.samples.map(s => s.file).filter(Boolean) as string[] },
      occurrences: tracking.count,
      firstSeen: new Date(tracking.firstSeen).toISOString(),
      lastSeen: new Date(tracking.lastSeen).toISOString(),
    }, 'auto_detected');

    this.gotchas.set(gotcha.id, gotcha);
    this._saveGotchas();
    this.emit('auto_captured', gotcha);
    return gotcha;
  }

  private _findGotchaByErrorPattern(msg: string): Gotcha | null {
    const pattern = this._extractErrorPattern(msg);
    for (const g of this.gotchas.values()) {
      if (g.trigger?.errorPattern === pattern) return g;
      if (g.description?.includes(msg.substring(0, 50))) return g;
    }
    return null;
  }

  private _generateTitleFromError(msg: string): string {
    const first = msg.split('\n')[0].replace(/at .+/, '').replace(/Error:?\s*/i, '').trim();
    return first.length > 60 ? first.substring(0, 57) + '...' : first || 'Repeated Error';
  }

  private _extractErrorPattern(msg: string): string {
    return msg.split('\n')[0].replace(/\d+/g, 'N').replace(/["'].*?["']/g, '"X"').replace(/`.*?`/g, '`X`').substring(0, 100);
  }

  private _hashError(errorData: TrackErrorData): string {
    const pattern = this._extractErrorPattern(errorData.message);
    let hash = 0;
    for (let i = 0; i < pattern.length; i++) {
      hash = (hash << 5) - hash + pattern.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private _detectCategory(text: string): GotchaCategoryType {
    const lower = text.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [GotchaCategoryType, string[]][]) {
      if (cat === 'general') continue;
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) return cat;
      }
    }
    return 'general';
  }

  private _normalizeSeverity(s: string | undefined): SeverityType {
    if (!s) return 'warning';
    const lower = s.toLowerCase();
    if (lower === 'critical' || lower === 'high' || lower === 'error') return 'critical';
    if (lower === 'info' || lower === 'low') return 'info';
    return 'warning';
  }

  private _extractKeywords(text: string): string[] {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  }

  private _generateId(): string {
    return `gotcha-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private _ensureDir(filePath: string): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  private _loadGotchas(): void {
    try {
      if (!existsSync(this.gotchasJsonPath)) return;
      const data = JSON.parse(readFileSync(this.gotchasJsonPath, 'utf-8'));
      if (Array.isArray(data.gotchas)) {
        for (const g of data.gotchas) this.gotchas.set(g.id, g);
      }
    } catch { /* silent */ }
  }

  private _saveGotchas(): void {
    try {
      this._ensureDir(this.gotchasJsonPath);
      writeFileSync(this.gotchasJsonPath, JSON.stringify(this.toJSON(), null, 2), 'utf-8');
      writeFileSync(this.gotchasMdPath, this.toMarkdown(), 'utf-8');
    } catch { /* silent */ }
  }

  private _loadErrorTracking(): void {
    try {
      if (!existsSync(this.errorTrackingPath)) return;
      const data = JSON.parse(readFileSync(this.errorTrackingPath, 'utf-8'));
      if (data.errors && typeof data.errors === 'object') {
        for (const [hash, tracking] of Object.entries(data.errors)) {
          this.errorTracking.set(hash, tracking as ErrorTracking);
        }
      }
    } catch { /* silent */ }
  }

  private _saveErrorTracking(): void {
    try {
      this._ensureDir(this.errorTrackingPath);
      writeFileSync(this.errorTrackingPath, JSON.stringify({ version: VERSION, updatedAt: new Date().toISOString(), errors: Object.fromEntries(this.errorTracking) }, null, 2), 'utf-8');
    } catch { /* silent */ }
  }
}

// ─── Convenience singleton for hooks ─────────────────────────────────────────
// Uses ~/.claude/memory as root (stores in ~/.claude/memory/.aios/)

const MEMORY_ROOT = join(process.env.HOME || '/tmp', '.claude', 'memory');
let _singleton: GotchasMemory | null = null;

function getInstance(): GotchasMemory {
  if (!_singleton) _singleton = new GotchasMemory(MEMORY_ROOT, { quiet: true });
  return _singleton;
}

export function recordError(tool: string, error: string, context?: string): Gotcha | null {
  return getInstance().trackError({ message: `[${tool}] ${error}`, context, file: tool });
}

export function getActiveGotchas(): Gotcha[] {
  const inst = getInstance();
  return Array.from(inst.gotchas.values()).filter(g => g.status === 'active');
}

export function getRelevantGotchas(taskDesc: string, files: string[] = []): Gotcha[] {
  return getInstance().getContextForTask(taskDesc, files);
}
