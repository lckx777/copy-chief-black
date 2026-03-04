'use strict';

/**
 * Pattern Capture
 *
 * Captures and retrieves workflow execution patterns from completed sessions.
 * Records agent sequences, phases, success rates, and durations to inform
 * future orchestration decisions.
 *
 * Storage: ~/copywriting-ecosystem/.synapse/patterns/workflow-patterns.yaml
 * Cap: 200 patterns (FIFO).
 *
 * @module workflow/pattern-capture
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const PATTERNS_FILE = path.join(ECOSYSTEM_ROOT, '.synapse', 'patterns', 'workflow-patterns.yaml');
const MAX_PATTERNS = 200;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Records a workflow pattern from a completed session.
 *
 * @param {string} offerPath - Relative or absolute path to the offer.
 * @param {object} sessionData - Session data object with the following fields:
 *   @param {string[]} sessionData.agents      - Ordered list of agents invoked.
 *   @param {string}   sessionData.phase       - Phase ID (e.g. 'research', 'briefing').
 *   @param {boolean}  sessionData.success     - Whether the phase completed successfully.
 *   @param {number}   [sessionData.duration]  - Elapsed time in minutes.
 *   @param {string}   [sessionData.workflow]  - Workflow ID used.
 *   @param {object}   [sessionData.scores]    - Quality scores { blind_critic, est, black_validation }.
 * @returns {object} The recorded pattern entry.
 */
function capturePattern(offerPath, sessionData) {
  if (!offerPath || !sessionData) {
    throw new Error('capturePattern requires offerPath and sessionData');
  }

  const patterns = _loadPatterns();
  const offerKey = _offerKey(offerPath);
  const niche = _extractNiche(offerPath);

  const entry = {
    id: _generateId(),
    offer: offerKey,
    niche,
    phase: sessionData.phase || 'unknown',
    workflow: sessionData.workflow || null,
    agents: Array.isArray(sessionData.agents) ? sessionData.agents : [],
    success: sessionData.success === true,
    duration: typeof sessionData.duration === 'number' ? sessionData.duration : null,
    scores: sessionData.scores || null,
    captured_at: new Date().toISOString(),
  };

  patterns.entries.push(entry);
  patterns.total_captured = (patterns.total_captured || 0) + 1;
  patterns.last_updated = new Date().toISOString();

  // Prune to cap
  if (patterns.entries.length > MAX_PATTERNS) {
    patterns.entries = patterns.entries.slice(patterns.entries.length - MAX_PATTERNS);
  }

  _savePatterns(patterns);
  return entry;
}

/**
 * Returns all stored patterns, optionally filtered by phase and niche.
 *
 * @param {object} [filters]
 * @param {string} [filters.phase]
 * @param {string} [filters.niche]
 * @param {boolean} [filters.successOnly]
 * @returns {Array<object>}
 */
function getPatterns(filters) {
  const patterns = _loadPatterns();
  let entries = patterns.entries || [];

  if (!filters) return entries;

  if (filters.phase) {
    entries = entries.filter(e => e.phase === filters.phase);
  }
  if (filters.niche) {
    entries = entries.filter(e => e.niche === filters.niche);
  }
  if (filters.successOnly) {
    entries = entries.filter(e => e.success === true);
  }

  return entries;
}

/**
 * Returns the most common agent sequences for a given phase,
 * ranked by frequency and success rate.
 *
 * @param {string} phase - Phase ID to query (e.g. 'research', 'briefing').
 * @returns {Array<{ sequence: string[], frequency: number, success_rate: number }>}
 */
function getFrequentSequences(phase) {
  const entries = getPatterns({ phase });
  if (entries.length === 0) return [];

  // Group by agent sequence string
  const seqMap = new Map();

  for (const entry of entries) {
    const seqKey = (entry.agents || []).join('→');
    if (!seqKey) continue;

    if (!seqMap.has(seqKey)) {
      seqMap.set(seqKey, {
        sequence: entry.agents,
        frequency: 0,
        successes: 0,
      });
    }

    const record = seqMap.get(seqKey);
    record.frequency++;
    if (entry.success) record.successes++;
  }

  const sequences = [];
  for (const [, record] of seqMap) {
    sequences.push({
      sequence: record.sequence,
      frequency: record.frequency,
      success_rate: record.frequency > 0
        ? Math.round((record.successes / record.frequency) * 100) / 100
        : 0,
    });
  }

  // Sort by frequency desc, then success_rate desc
  sequences.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return b.success_rate - a.success_rate;
  });

  return sequences.slice(0, 10);
}

/**
 * Prunes oldest entries to stay within MAX_PATTERNS cap.
 * Also removes entries older than maxAgeDays.
 *
 * @param {number} [maxAgeDays=90] - Entries older than this are removed.
 * @returns {{ removed: number, remaining: number }}
 */
function prunePatterns(maxAgeDays) {
  const ageDays = typeof maxAgeDays === 'number' ? maxAgeDays : 90;
  const patterns = _loadPatterns();
  const before = patterns.entries.length;
  const cutoff = Date.now() - ageDays * 24 * 60 * 60 * 1000;

  // Remove old entries
  patterns.entries = patterns.entries.filter(e => {
    if (!e.captured_at) return true;
    return new Date(e.captured_at).getTime() > cutoff;
  });

  // FIFO cap
  if (patterns.entries.length > MAX_PATTERNS) {
    patterns.entries = patterns.entries.slice(patterns.entries.length - MAX_PATTERNS);
  }

  const removed = before - patterns.entries.length;
  patterns.last_updated = new Date().toISOString();

  if (removed > 0) _savePatterns(patterns);

  return { removed, remaining: patterns.entries.length };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _loadPatterns() {
  if (!fs.existsSync(PATTERNS_FILE)) {
    return {
      version: '1.0',
      total_captured: 0,
      last_updated: null,
      entries: [],
    };
  }

  try {
    return yaml.load(fs.readFileSync(PATTERNS_FILE, 'utf8')) || {
      version: '1.0',
      total_captured: 0,
      last_updated: null,
      entries: [],
    };
  } catch (_) {
    return { version: '1.0', total_captured: 0, last_updated: null, entries: [] };
  }
}

function _savePatterns(patterns) {
  const dir = path.dirname(PATTERNS_FILE);
  fs.mkdirSync(dir, { recursive: true });

  const tmp = PATTERNS_FILE + '.tmp';
  fs.writeFileSync(tmp, yaml.dump(patterns, { lineWidth: 120, noRefs: true }), 'utf8');
  fs.renameSync(tmp, PATTERNS_FILE);
}

function _offerKey(offerPath) {
  const abs = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);
  return path.relative(ECOSYSTEM_ROOT, abs);
}

function _extractNiche(offerPath) {
  const key = _offerKey(offerPath);
  const parts = key.split(path.sep);
  return parts.length > 0 ? parts[0] : 'unknown';
}

function _generateId() {
  return `pat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { capturePattern, getPatterns, getFrequentSequences, prunePatterns };
