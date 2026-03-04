'use strict';

/**
 * Confidence Scorer
 *
 * Calculates confidence scores for workflow suggestions using
 * weighted signals: gate status, file completeness, history, and recency.
 *
 * Weights:
 *   GATE_STATUS       0.35
 *   FILE_COMPLETENESS 0.25
 *   HISTORY           0.20
 *   RECENCY           0.20
 *
 * @module workflow/confidence-scorer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

const WEIGHTS = {
  GATE_STATUS: 0.35,
  FILE_COMPLETENESS: 0.25,
  HISTORY: 0.20,
  RECENCY: 0.20,
};

// Required files per target phase (relative to offer root)
const PHASE_REQUIRED_FILES = {
  research: [
    'research/synthesis.md',
    'research/voc-raw.md',
    'research/competitors.md',
    'research/avatar.md',
  ],
  briefing: [
    'briefings/helix-complete.md',
    'mecanismo-unico.yaml',
    'helix-state.yaml',
  ],
  production: [
    'briefings/helix-complete.md',
    'mecanismo-unico.yaml',
    'production/vsl/',
    'production/landing-page/',
    'production/creatives/',
  ],
  delivery: [
    'production/vsl/',
    'production/landing-page/',
    'production/creatives/',
    'production/emails/',
  ],
};

// Gate prerequisites for each target phase
const PHASE_GATE_PREREQS = {
  research: [],               // no prereqs needed to start research
  briefing: ['research'],
  production: ['research', 'briefing'],
  delivery: ['research', 'briefing', 'production'],
};

/**
 * Calculates weighted confidence for transitioning to targetPhase.
 *
 * @param {string} offerPath - Absolute or relative path to offer directory.
 * @param {string} targetPhase - Phase to score: 'research'|'briefing'|'production'|'delivery'
 * @returns {{ total: number, breakdown: object }}
 */
function calculateConfidence(offerPath, targetPhase) {
  const absPath = _resolveOfferPath(offerPath);

  const gateScore = scoreGateStatus(absPath, targetPhase);
  const fileScore = scoreFileCompleteness(absPath, targetPhase);
  const historyScore = _scoreHistory(absPath, targetPhase);
  const recencyScore = _scoreRecency(absPath);

  const total = Math.min(1.0,
    gateScore * WEIGHTS.GATE_STATUS +
    fileScore * WEIGHTS.FILE_COMPLETENESS +
    historyScore * WEIGHTS.HISTORY +
    recencyScore * WEIGHTS.RECENCY
  );

  return {
    total: Math.round(total * 100) / 100,
    breakdown: {
      gate_status: { score: Math.round(gateScore * 100) / 100, weight: WEIGHTS.GATE_STATUS },
      file_completeness: { score: Math.round(fileScore * 100) / 100, weight: WEIGHTS.FILE_COMPLETENESS },
      history: { score: Math.round(historyScore * 100) / 100, weight: WEIGHTS.HISTORY },
      recency: { score: Math.round(recencyScore * 100) / 100, weight: WEIGHTS.RECENCY },
    },
  };
}

/**
 * Scores gate readiness for a target phase.
 * Full score (1.0) if all prerequisite gates are passed.
 * Partial score proportional to fraction of passed prereqs.
 *
 * @param {string} absPath - Absolute offer path.
 * @param {string} targetPhase
 * @returns {number} 0.0–1.0
 */
function scoreGateStatus(absPath, targetPhase) {
  const prereqs = PHASE_GATE_PREREQS[targetPhase] || [];
  if (prereqs.length === 0) return 1.0; // no prerequisites = full score

  const gates = _readGates(absPath);
  let passed = 0;
  for (const gate of prereqs) {
    if (_gateIsPassed(gates[gate])) passed++;
  }

  return passed / prereqs.length;
}

/**
 * Scores how many of the expected input files are already present.
 * Files checked against PHASE_REQUIRED_FILES for the target phase.
 *
 * @param {string} absPath - Absolute offer path.
 * @param {string} targetPhase
 * @returns {number} 0.0–1.0
 */
function scoreFileCompleteness(absPath, targetPhase) {
  const required = PHASE_REQUIRED_FILES[targetPhase] || [];
  if (required.length === 0) return 0.5; // unknown phase = neutral

  let found = 0;
  for (const rel of required) {
    const full = path.join(absPath, rel);
    if (fs.existsSync(full)) found++;
  }

  return found / required.length;
}

// ─── Private scorers ──────────────────────────────────────────────────────────

/**
 * History score: based on whether this offer has completed similar phases before.
 * Reads execution-log.yaml from .aios/ if present.
 *
 * @param {string} absPath
 * @param {string} targetPhase
 * @returns {number} 0.0–1.0
 */
function _scoreHistory(absPath, targetPhase) {
  const logPath = path.join(absPath, '.aios', 'execution-log.yaml');
  if (!fs.existsSync(logPath)) return 0.5; // no history = neutral

  try {
    const log = yaml.load(fs.readFileSync(logPath, 'utf8')) || {};
    const entries = log.entries || log.log || [];
    if (!Array.isArray(entries) || entries.length === 0) return 0.5;

    // Count successful completions relevant to the target phase
    const relevant = entries.filter(e => {
      const phase = (e.phase || e.phase_id || '').toLowerCase();
      const status = (e.status || e.outcome || '').toLowerCase();
      return phase.includes(targetPhase) && (status === 'completed' || status === 'passed');
    });

    if (relevant.length === 0) return 0.4; // attempted but not completed
    if (relevant.length >= 2) return 1.0;  // done it multiple times
    return 0.75; // done it once
  } catch (_) {
    return 0.5;
  }
}

/**
 * Recency score: more urgent if the offer has been idle.
 * Reads updated_at from helix-state.yaml.
 *
 * @param {string} absPath
 * @returns {number} 0.0–1.0
 */
function _scoreRecency(absPath) {
  const helixPath = path.join(absPath, 'helix-state.yaml');
  let lastUpdated = null;

  if (fs.existsSync(helixPath)) {
    try {
      const helix = yaml.load(fs.readFileSync(helixPath, 'utf8')) || {};
      lastUpdated = helix.updated_at || helix.last_updated || null;
      if (!lastUpdated) {
        lastUpdated = fs.statSync(helixPath).mtime.toISOString();
      }
    } catch (_) {
      lastUpdated = null;
    }
  }

  if (!lastUpdated) return 0.5; // no data = neutral

  const diffMs = Date.now() - new Date(lastUpdated).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // More idle = higher urgency = higher score
  if (diffDays > 14) return 1.0;
  if (diffDays > 7) return 0.85;
  if (diffDays > 3) return 0.70;
  if (diffDays > 1) return 0.55;
  return 0.40; // active today = low urgency bonus
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _readGates(absPath) {
  const gates = {};

  const helixPath = path.join(absPath, 'helix-state.yaml');
  if (fs.existsSync(helixPath)) {
    try {
      const helix = yaml.load(fs.readFileSync(helixPath, 'utf8')) || {};
      Object.assign(gates, helix.gates || {});
    } catch (_) { /* silent */ }
  }

  const projPath = path.join(absPath, 'project_state.yaml');
  if (fs.existsSync(projPath)) {
    try {
      const proj = yaml.load(fs.readFileSync(projPath, 'utf8')) || {};
      Object.assign(gates, proj.gates || {});
    } catch (_) { /* silent */ }
  }

  return gates;
}

function _gateIsPassed(val) {
  if (val === true || val === 'passed' || val === 'PASSED') return true;
  if (typeof val === 'object' && val !== null) {
    return val.status === 'passed' || val.status === 'PASSED' || val.passed === true;
  }
  return false;
}

function _resolveOfferPath(offerPath) {
  if (!offerPath) return ECOSYSTEM_ROOT;
  return path.isAbsolute(offerPath) ? offerPath : path.join(ECOSYSTEM_ROOT, offerPath);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { calculateConfidence, scoreGateStatus, scoreFileCompleteness };
