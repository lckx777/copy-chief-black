'use strict';

/**
 * Suggestion Engine
 *
 * Predicts the next task based on current offer state.
 * Reads helix-state.yaml, dispatch-queue.yaml, and project_state.yaml
 * to produce a ranked list of actionable suggestions.
 *
 * Cache: 5-minute mtime-based invalidation per offer.
 *
 * @module workflow/suggestion-engine
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Phase progression rules ──────────────────────────────────────────────────

// Maps gate name → next suggested action
const PHASE_PROGRESSION = [
  {
    gate: null,
    description: 'No gates passed',
    action: 'launch-research',
    label: 'Start Research Pipeline',
    agents: ['vox', 'cipher'],
    workflow: 'research-pipeline',
    baseConfidence: 0.90,
    reason: 'No gates have been passed yet. Research is the mandatory first step.',
  },
  {
    gate: 'research',
    description: 'Research passed',
    action: 'launch-briefing',
    label: 'Start HELIX Briefing Pipeline',
    agents: ['atlas'],
    workflow: 'briefing-pipeline',
    baseConfidence: 0.92,
    reason: 'Research gate PASSED. Atlas should begin the 10-phase HELIX briefing.',
  },
  {
    gate: 'briefing',
    description: 'Briefing passed',
    action: 'launch-production',
    label: 'Start Production Pipeline',
    agents: ['echo', 'forge', 'scout'],
    workflow: 'production-pipeline',
    baseConfidence: 0.92,
    reason: 'Briefing gate PASSED. Parallel production of VSL, LP, and Creatives can begin.',
  },
  {
    gate: 'production',
    description: 'Production passed',
    action: 'launch-review',
    label: 'Start Review Pipeline',
    agents: ['hawk'],
    workflow: 'review-pipeline',
    baseConfidence: 0.88,
    reason: 'Production gate PASSED. Hawk should run adversarial review and delivery gate.',
  },
  {
    gate: 'delivery',
    description: 'All gates passed',
    action: 'offer-complete',
    label: 'Offer Fully Delivered',
    agents: [],
    workflow: null,
    baseConfidence: 1.0,
    reason: 'All gates passed. Offer is complete and ready for deployment.',
  },
];

// ─── Cache ────────────────────────────────────────────────────────────────────

// Map<offerPath, { suggestions, cachedAt, mtimes }>
const _cache = new Map();

/**
 * Returns ranked suggestions for the given offer.
 *
 * @param {string} offerPath - Absolute or relative path to offer dir.
 * @param {string} [currentPhase] - Optional override for current phase.
 * @returns {Array<{ action, label, confidence, reason, agents, workflow }>}
 */
function getSuggestions(offerPath, currentPhase) {
  const absPath = _resolveOfferPath(offerPath);

  // Check cache validity
  const cached = _cache.get(absPath);
  if (cached && _isCacheValid(absPath, cached)) {
    return cached.suggestions;
  }

  const state = _readOfferState(absPath);
  const suggestions = _buildSuggestions(absPath, state, currentPhase);

  _cache.set(absPath, {
    suggestions,
    cachedAt: Date.now(),
    mtimes: _readMtimes(absPath),
  });

  return suggestions;
}

/**
 * Returns the single highest-confidence suggestion.
 *
 * @param {string} offerPath
 * @param {string} [currentPhase]
 * @returns {{ action, label, confidence, reason, agents, workflow } | null}
 */
function getTopSuggestion(offerPath, currentPhase) {
  const suggestions = getSuggestions(offerPath, currentPhase);
  return suggestions.length > 0 ? suggestions[0] : null;
}

/**
 * Invalidates the cache for a specific offer (or all offers if no path given).
 *
 * @param {string} [offerPath]
 */
function invalidateCache(offerPath) {
  if (offerPath) {
    _cache.delete(_resolveOfferPath(offerPath));
  } else {
    _cache.clear();
  }
}

// ─── Private: state reading ───────────────────────────────────────────────────

function _readOfferState(absPath) {
  const state = {
    gates: {},
    currentPhase: null,
    pendingDispatches: 0,
    lastActivityAt: null,
    projectState: {},
  };

  // helix-state.yaml
  const helixPath = path.join(absPath, 'helix-state.yaml');
  if (fs.existsSync(helixPath)) {
    try {
      const helix = yaml.load(fs.readFileSync(helixPath, 'utf8')) || {};
      state.gates = helix.gates || {};
      state.currentPhase = helix.current_phase || helix.phase || null;
      state.lastActivityAt = helix.updated_at || helix.last_updated || null;
    } catch (_) { /* silent */ }
  }

  // project_state.yaml
  const projPath = path.join(absPath, 'project_state.yaml');
  if (fs.existsSync(projPath)) {
    try {
      state.projectState = yaml.load(fs.readFileSync(projPath, 'utf8')) || {};
      // project_state may also carry gate info
      if (state.projectState.gates) {
        state.gates = Object.assign({}, state.projectState.gates, state.gates);
      }
    } catch (_) { /* silent */ }
  }

  // dispatch-queue.yaml (count pending)
  const queuePath = path.join(absPath, '.aios', 'dispatch-queue.yaml');
  if (fs.existsSync(queuePath)) {
    try {
      const queue = yaml.load(fs.readFileSync(queuePath, 'utf8')) || {};
      const entries = queue.queue || [];
      state.pendingDispatches = entries.filter(e => e.status === 'pending' || e.status === 'dispatched').length;
    } catch (_) { /* silent */ }
  }

  // Infer last activity from mtime of helix-state
  if (!state.lastActivityAt && fs.existsSync(helixPath)) {
    state.lastActivityAt = fs.statSync(helixPath).mtime.toISOString();
  }

  return state;
}

function _buildSuggestions(absPath, state, currentPhaseOverride) {
  const suggestions = [];
  const gates = state.gates || {};

  // Determine highest passed gate
  const gateOrder = ['research', 'briefing', 'production', 'delivery'];
  let highestPassed = null;
  for (const g of gateOrder) {
    if (_gateIsPassed(gates[g])) highestPassed = g;
  }

  // If there are pending dispatches, add a "resume pipeline" suggestion first
  if (state.pendingDispatches > 0) {
    suggestions.push({
      action: 'resume-pipeline',
      label: `Resume pipeline (${state.pendingDispatches} pending dispatch${state.pendingDispatches > 1 ? 'es' : ''})`,
      confidence: 0.95,
      reason: `Dispatch queue has ${state.pendingDispatches} pending entries. Resume before launching new phases.`,
      agents: [],
      workflow: null,
    });
  }

  // Walk progression rules
  for (const rule of PHASE_PROGRESSION) {
    if (rule.gate === highestPassed) {
      // This is our primary suggestion
      let confidence = rule.baseConfidence;

      // Bonus: offer idle longest (lower recency = more urgent)
      const idleBonus = _idleBonus(state.lastActivityAt);
      confidence = Math.min(1.0, confidence + idleBonus);

      // Phase already in progress — lower confidence
      if (state.pendingDispatches > 0 && rule.action !== 'offer-complete') {
        confidence = Math.max(0.5, confidence - 0.15);
      }

      suggestions.push({
        action: rule.action,
        label: rule.label,
        confidence: Math.round(confidence * 100) / 100,
        reason: rule.reason,
        agents: rule.agents,
        workflow: rule.workflow,
      });
      break;
    }
  }

  // Secondary: if mecanismo not validated after briefing phase is started
  if (highestPassed === 'research' && !_gateIsPassed(gates.mecanismo)) {
    suggestions.push({
      action: 'validate-mecanismo',
      label: 'Validate Mecanismo Unico (MUP/MUS)',
      confidence: 0.60,
      reason: 'Mecanismo gate not yet APPROVED. Validate before or during briefing.',
      agents: ['atlas', 'hawk'],
      workflow: null,
    });
  }

  // Sort descending by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return suggestions;
}

function _gateIsPassed(val) {
  if (val === true || val === 'passed' || val === 'PASSED') return true;
  if (typeof val === 'object' && val !== null) {
    return val.status === 'passed' || val.status === 'PASSED' || val.passed === true;
  }
  return false;
}

function _idleBonus(lastActivityAt) {
  if (!lastActivityAt) return 0.05; // unknown = slightly more urgent
  const diffMs = Date.now() - new Date(lastActivityAt).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > 7) return 0.08;
  if (diffDays > 3) return 0.05;
  if (diffDays > 1) return 0.02;
  return 0;
}

// ─── Private: cache helpers ───────────────────────────────────────────────────

function _readMtimes(absPath) {
  const files = [
    path.join(absPath, 'helix-state.yaml'),
    path.join(absPath, 'project_state.yaml'),
    path.join(absPath, '.aios', 'dispatch-queue.yaml'),
  ];
  const mtimes = {};
  for (const f of files) {
    if (fs.existsSync(f)) {
      mtimes[f] = fs.statSync(f).mtimeMs;
    }
  }
  return mtimes;
}

function _isCacheValid(absPath, cached) {
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) return false;
  const current = _readMtimes(absPath);
  for (const [f, mtime] of Object.entries(current)) {
    if (cached.mtimes[f] !== mtime) return false;
  }
  return true;
}

function _resolveOfferPath(offerPath) {
  if (!offerPath) return ECOSYSTEM_ROOT;
  return path.isAbsolute(offerPath) ? offerPath : path.join(ECOSYSTEM_ROOT, offerPath);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { getSuggestions, getTopSuggestion, invalidateCache };
