'use strict';

/**
 * Synapse Diagnostics — Copy Chief BLACK Edition
 *
 * Orchestrates all diagnostic collectors and generates a comprehensive
 * report of the SYNAPSE pipeline state, adapted for the Copy Chief
 * ecosystem (no UAP bridge — uses active-agents.json + core-config.yaml).
 *
 * Usage:
 *   const { runDiagnostics, runDiagnosticsRaw } = require('./synapse-diagnostics');
 *   const report = runDiagnostics('/path/to/copywriting-ecosystem');
 *
 * @module core/synapse/diagnostics/synapse-diagnostics
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-13)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HOME = os.homedir();
const ECOSYSTEM_ROOT = path.join(HOME, 'copywriting-ecosystem');

// ---------------------------------------------------------------------------
// Collector discovery (mirrors doctor.js pattern)
// ---------------------------------------------------------------------------

const COLLECTORS_DIR = path.join(__dirname, 'collectors');

/**
 * Discover and load all collector modules from ./collectors/.
 * Each collector must export a function matching one of the known signatures.
 * We map by basename to a canonical name.
 *
 * @returns {Map<string, Function>} Map of collectorName -> collectFn
 */
function _discoverCollectors() {
  const map = new Map();

  const COLLECTOR_MAP = [
    { file: 'timing-collector.js',      name: 'timing',      fn: 'collectTimingMetrics' },
    { file: 'quality-collector.js',     name: 'quality',     fn: 'collectQualityMetrics' },
    { file: 'consistency-collector.js', name: 'consistency', fn: 'collectConsistencyMetrics' },
    { file: 'hook-collector.js',        name: 'hooks',       fn: 'collectHookHeartbeats' },
  ];

  for (const entry of COLLECTOR_MAP) {
    const filePath = path.join(COLLECTORS_DIR, entry.file);
    try {
      const mod = require(filePath);
      if (typeof mod[entry.fn] === 'function') {
        map.set(entry.name, mod[entry.fn]);
      }
    } catch (err) {
      // Collector missing or broken — skip gracefully
      process.stderr.write(`[synapse-diagnostics] Collector ${entry.file} failed to load: ${err.message}\n`);
    }
  }

  return map;
}

/**
 * Safely execute a collector, returning an error-marked object on failure.
 * Diagnostics must never crash due to a broken collector.
 *
 * @param {string} name - Collector name for error reporting
 * @param {Function} fn - Collector function
 * @param {string} projectRoot - Project root path passed to collectors
 * @returns {object} Collector result or { error: true, name, message }
 */
function _safeCollect(name, fn, projectRoot) {
  try {
    return fn(projectRoot);
  } catch (err) {
    return { error: true, name, message: err.message, checks: [], data: {} };
  }
}

// ---------------------------------------------------------------------------
// Active agent detection (Copy Chief ecosystem — active-agents.json)
// ---------------------------------------------------------------------------

/**
 * Detect active agents from ~/.claude/session-state/active-agents.json.
 *
 * @returns {{ agents: string[], primary: string|null }}
 */
function _detectActiveAgents() {
  const agentsPath = path.join(HOME, '.claude', 'session-state', 'active-agents.json');
  try {
    if (!fs.existsSync(agentsPath)) return { agents: [], primary: null };
    const data = JSON.parse(fs.readFileSync(agentsPath, 'utf8'));
    const agents = Object.keys(data);
    // Primary = first agent by activatedAt timestamp
    const sorted = agents.sort((a, b) => {
      const tA = data[a].activatedAt || 0;
      const tB = data[b].activatedAt || 0;
      return tA - tB;
    });
    return { agents: sorted, primary: sorted[0] || null };
  } catch {
    return { agents: [], primary: null };
  }
}

// ---------------------------------------------------------------------------
// Core orchestration
// ---------------------------------------------------------------------------

/**
 * Run all collectors and return raw results object.
 * Used internally by both runDiagnostics and runDiagnosticsRaw.
 *
 * @param {string} [projectRoot] - Absolute path to copywriting-ecosystem root
 * @returns {object} Raw collector results keyed by collector name
 */
function _collectAll(projectRoot) {
  const root = projectRoot || ECOSYSTEM_ROOT;
  const collectors = _discoverCollectors();
  const agentInfo = _detectActiveAgents();

  const results = {
    _meta: {
      projectRoot: root,
      timestamp: new Date().toISOString(),
      activeAgents: agentInfo.agents,
      primaryAgent: agentInfo.primary,
    },
  };

  for (const [name, fn] of collectors) {
    results[name] = _safeCollect(name, fn, root);
  }

  return results;
}

/**
 * Run full SYNAPSE diagnostics and return formatted markdown report.
 *
 * @param {string} [projectRoot] - Absolute path to copywriting-ecosystem root
 *   (defaults to ~/copywriting-ecosystem)
 * @returns {string} Formatted markdown diagnostic report
 */
function runDiagnostics(projectRoot) {
  const data = _collectAll(projectRoot);
  const { formatReport } = require('./report-formatter');
  return formatReport(data);
}

/**
 * Run diagnostics and return raw collector data (for programmatic use).
 *
 * @param {string} [projectRoot] - Absolute path to copywriting-ecosystem root
 * @returns {object} Raw collector results
 */
function runDiagnosticsRaw(projectRoot) {
  return _collectAll(projectRoot);
}

module.exports = { runDiagnostics, runDiagnosticsRaw };
