'use strict';

/**
 * Gotcha Registry
 *
 * Enhanced gotcha system. Learns from errors to prevent repetition across
 * agents, offers, and niches. Uses relevance scoring to surface the right
 * gotchas at the right time.
 *
 * Storage: ~/copywriting-ecosystem/.synapse/learning/gotcha-registry.yaml
 * Cap: 500 entries (FIFO).
 *
 * Relevance weights:
 *   same_agent      0.30
 *   same_niche      0.20
 *   same_error_type 0.30
 *   recency         0.20
 *
 * @module learning/gotcha-registry
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const REGISTRY_FILE = path.join(ECOSYSTEM_ROOT, '.synapse', 'learning', 'gotcha-registry.yaml');
const MAX_ENTRIES = 500;
const RELEVANCE_THRESHOLD = 0.7;

const RELEVANCE_WEIGHTS = {
  same_agent: 0.30,
  same_niche: 0.20,
  same_error_type: 0.30,
  recency: 0.20,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Registers a new gotcha (error + resolution pair).
 * Deduplicates via string similarity on error_type + resolution.
 *
 * @param {object} context
 * @param {string} context.agent         - Agent handle (e.g. '@vox', 'vox', 'echo')
 * @param {string} context.offer         - Offer path or name (e.g. 'saude/florayla')
 * @param {string} context.error_type    - Short description of the error category
 * @param {string} context.resolution    - How the error was resolved
 * @param {number} [context.confidence]  - Confidence in resolution (0-1), defaults to 0.8
 * @param {string} [context.phase]       - Phase where the error occurred
 * @param {string} [context.task]        - Task description for context
 * @returns {{ registered: boolean, id: string|null, duplicate: boolean }}
 */
function registerGotcha(context) {
  if (!context || !context.agent || !context.error_type || !context.resolution) {
    return { registered: false, id: null, duplicate: false, error: 'Missing required fields: agent, error_type, resolution' };
  }

  const registry = _loadRegistry();

  // Dedup check
  const duplicate = _findDuplicate(registry.entries, context);
  if (duplicate) {
    // Update occurrence count and last_seen
    duplicate.occurrences = (duplicate.occurrences || 1) + 1;
    duplicate.last_seen = new Date().toISOString();
    _saveRegistry(registry);
    return { registered: false, id: duplicate.id, duplicate: true };
  }

  const niche = _extractNiche(context.offer || '');
  const entry = {
    id: _generateId(),
    agent: _normalizeAgent(context.agent),
    niche,
    offer: _offerKey(context.offer || ''),
    error_type: String(context.error_type).trim(),
    resolution: String(context.resolution).trim(),
    confidence: typeof context.confidence === 'number' ? context.confidence : 0.8,
    phase: context.phase || null,
    task: context.task || null,
    occurrences: 1,
    registered_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  };

  registry.entries.push(entry);
  registry.total_registered = (registry.total_registered || 0) + 1;
  registry.last_updated = new Date().toISOString();

  // FIFO cap
  if (registry.entries.length > MAX_ENTRIES) {
    registry.entries = registry.entries.slice(registry.entries.length - MAX_ENTRIES);
  }

  _saveRegistry(registry);
  return { registered: true, id: entry.id, duplicate: false };
}

/**
 * Queries gotchas relevant to the current context.
 * Returns only entries with relevance >= 0.7 (RELEVANCE_THRESHOLD).
 *
 * @param {string} agentId      - Agent handle (e.g. 'vox', '@atlas')
 * @param {string} offerPath    - Offer path for niche matching
 * @param {string} currentTask  - Current task description for error_type matching
 * @returns {Array<object>} Sorted by relevance desc (highest first)
 */
function queryRelevant(agentId, offerPath, currentTask) {
  const registry = _loadRegistry();
  const agent = _normalizeAgent(agentId || '');
  const niche = _extractNiche(offerPath || '');
  const taskLower = (currentTask || '').toLowerCase();

  const scored = [];

  for (const entry of registry.entries) {
    const relevance = _calculateRelevance(entry, agent, niche, taskLower);
    if (relevance >= RELEVANCE_THRESHOLD) {
      scored.push({ ...entry, relevance: Math.round(relevance * 100) / 100 });
    }
  }

  scored.sort((a, b) => b.relevance - a.relevance);
  return scored;
}

/**
 * Formats gotchas as markdown for injection into agent context.
 *
 * @param {Array<object>} gotchas - Array of gotcha entries (from queryRelevant).
 * @returns {string} Markdown string.
 */
function formatForAgent(gotchas) {
  if (!Array.isArray(gotchas) || gotchas.length === 0) return '';

  const lines = [
    '## Known Gotchas — Review Before Starting',
    '',
    '> These issues have occurred in similar contexts. Avoid them proactively.',
    '',
  ];

  for (const g of gotchas) {
    const relevancePct = Math.round((g.relevance || 0) * 100);
    const occurrences = g.occurrences > 1 ? ` (${g.occurrences}x)` : '';
    lines.push(`### [${relevancePct}% match] ${g.error_type}${occurrences}`);
    if (g.phase) lines.push(`**Phase:** ${g.phase}`);
    if (g.agent) lines.push(`**Seen by:** @${g.agent}`);
    lines.push('');
    lines.push(`**Resolution:** ${g.resolution}`);
    if (g.confidence < 0.8) {
      lines.push(`> Confidence in this resolution: ${Math.round(g.confidence * 100)}%`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Prunes old entries by age and enforces the FIFO cap.
 *
 * @param {number} [maxAgeDays=180] - Entries older than this are removed.
 * @returns {{ removed: number, remaining: number }}
 */
function pruneGotchas(maxAgeDays) {
  const ageDays = typeof maxAgeDays === 'number' ? maxAgeDays : 180;
  const registry = _loadRegistry();
  const before = registry.entries.length;
  const cutoff = Date.now() - ageDays * 24 * 60 * 60 * 1000;

  registry.entries = registry.entries.filter(e => {
    if (!e.registered_at) return true;
    return new Date(e.registered_at).getTime() > cutoff;
  });

  if (registry.entries.length > MAX_ENTRIES) {
    registry.entries = registry.entries.slice(registry.entries.length - MAX_ENTRIES);
  }

  const removed = before - registry.entries.length;
  registry.last_updated = new Date().toISOString();

  if (removed > 0) _saveRegistry(registry);

  return { removed, remaining: registry.entries.length };
}

/**
 * Returns summary statistics about the registry.
 *
 * @returns {{ total: number, by_agent: object, by_niche: object, by_phase: object, avg_confidence: number }}
 */
function getStats() {
  const registry = _loadRegistry();
  const entries = registry.entries || [];

  const by_agent = {};
  const by_niche = {};
  const by_phase = {};
  let confidence_sum = 0;

  for (const e of entries) {
    const agent = e.agent || 'unknown';
    const niche = e.niche || 'unknown';
    const phase = e.phase || 'unknown';

    by_agent[agent] = (by_agent[agent] || 0) + 1;
    by_niche[niche] = (by_niche[niche] || 0) + 1;
    by_phase[phase] = (by_phase[phase] || 0) + 1;
    confidence_sum += typeof e.confidence === 'number' ? e.confidence : 0.8;
  }

  return {
    total: entries.length,
    total_registered: registry.total_registered || entries.length,
    by_agent,
    by_niche,
    by_phase,
    avg_confidence: entries.length > 0
      ? Math.round((confidence_sum / entries.length) * 100) / 100
      : 0,
  };
}

// ─── Private: relevance calculation ──────────────────────────────────────────

function _calculateRelevance(entry, agent, niche, taskLower) {
  let score = 0;

  // same_agent (0.30)
  if (_normalizeAgent(entry.agent) === agent) {
    score += RELEVANCE_WEIGHTS.same_agent;
  } else if (agent && entry.agent && _agentFamily(entry.agent) === _agentFamily(agent)) {
    score += RELEVANCE_WEIGHTS.same_agent * 0.4; // partial credit for same family
  }

  // same_niche (0.20)
  if (niche && entry.niche === niche) {
    score += RELEVANCE_WEIGHTS.same_niche;
  }

  // same_error_type (0.30) — string similarity
  if (taskLower && entry.error_type) {
    const errorLower = entry.error_type.toLowerCase();
    const sim = _stringSimilarity(taskLower, errorLower);
    score += RELEVANCE_WEIGHTS.same_error_type * sim;
  }

  // recency (0.20)
  score += RELEVANCE_WEIGHTS.recency * _recencyScore(entry.last_seen || entry.registered_at);

  return Math.min(1.0, score);
}

/**
 * Approximate string similarity using character bigram overlap (Sørensen–Dice).
 * Fast enough for runtime use without external deps.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} 0.0–1.0
 */
function _stringSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  // Exact substring match
  if (a.includes(b) || b.includes(a)) {
    return 0.85;
  }

  // Bigram-based Dice coefficient
  const bigrams = (s) => {
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.substring(i, i + 2));
    return set;
  };

  const setA = bigrams(a);
  const setB = bigrams(b);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const bg of setA) {
    if (setB.has(bg)) intersection++;
  }

  return (2 * intersection) / (setA.size + setB.size);
}

function _recencyScore(timestamp) {
  if (!timestamp) return 0.3;
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return 1.0;
  if (diffDays <= 7) return 0.80;
  if (diffDays <= 30) return 0.55;
  if (diffDays <= 90) return 0.35;
  return 0.15;
}

// ─── Private: deduplication ───────────────────────────────────────────────────

function _findDuplicate(entries, context) {
  const agent = _normalizeAgent(context.agent);
  const errorLower = context.error_type.toLowerCase().trim();
  const resLower = context.resolution.toLowerCase().trim();

  for (const e of entries) {
    if (_normalizeAgent(e.agent) !== agent) continue;

    const eErrorLower = (e.error_type || '').toLowerCase();
    const eResLower = (e.resolution || '').toLowerCase();

    const errorSim = _stringSimilarity(errorLower, eErrorLower);
    const resSim = _stringSimilarity(resLower, eResLower);

    // Duplicate if both error_type and resolution are highly similar
    if (errorSim > 0.80 && resSim > 0.75) {
      return e;
    }
  }

  return null;
}

// ─── Private: IO ──────────────────────────────────────────────────────────────

function _loadRegistry() {
  if (!fs.existsSync(REGISTRY_FILE)) {
    return { version: '1.0', total_registered: 0, last_updated: null, entries: [] };
  }

  try {
    return yaml.load(fs.readFileSync(REGISTRY_FILE, 'utf8')) || {
      version: '1.0', total_registered: 0, last_updated: null, entries: [],
    };
  } catch (_) {
    return { version: '1.0', total_registered: 0, last_updated: null, entries: [] };
  }
}

function _saveRegistry(registry) {
  const dir = path.dirname(REGISTRY_FILE);
  fs.mkdirSync(dir, { recursive: true });

  const tmp = REGISTRY_FILE + '.tmp';
  fs.writeFileSync(tmp, yaml.dump(registry, { lineWidth: 120, noRefs: true }), 'utf8');
  fs.renameSync(tmp, REGISTRY_FILE);
}

// ─── Private: normalizers ─────────────────────────────────────────────────────

function _normalizeAgent(agent) {
  return String(agent || '').toLowerCase().replace(/^@/, '');
}

// Group agents by family (e.g. all "production" agents)
const AGENT_FAMILIES = {
  vox: 'research', cipher: 'research',
  atlas: 'briefing',
  echo: 'production', forge: 'production', scout: 'production', blade: 'production',
  hawk: 'review', sentinel: 'review',
  ops: 'ops', strategist: 'strategy',
};

function _agentFamily(agent) {
  return AGENT_FAMILIES[_normalizeAgent(agent)] || 'unknown';
}

function _extractNiche(offerPath) {
  const key = _offerKey(offerPath);
  const parts = key.split(path.sep);
  return parts.length > 0 ? parts[0] : 'unknown';
}

function _offerKey(offerPath) {
  if (!offerPath) return '';
  const abs = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);
  return path.relative(ECOSYSTEM_ROOT, abs);
}

function _generateId() {
  return `gr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { registerGotcha, queryRelevant, formatForAgent, pruneGotchas, getStats };
