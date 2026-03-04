'use strict';

/**
 * Consistency Collector — Copy Chief BLACK Edition
 *
 * Cross-validates system state for inconsistencies across 4 checks:
 *
 * 1. Bracket consistency — hook-metrics.json bracket is a known valid value
 * 2. Agent consistency — active-agents.json IDs match known agents in core-config.yaml
 * 3. Timestamp consistency — hook-metrics.json and active-agents.json are <10min apart
 * 4. Config consistency — core-config.yaml is parseable and has required top-level sections
 *
 * @module core/synapse/diagnostics/collectors/consistency-collector
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-14)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const yaml = require('js-yaml');

const HOME = os.homedir();

/** Maximum acceptable age gap between metrics files (ms). */
const MAX_TIMESTAMP_GAP_MS = 10 * 60 * 1000; // 10 minutes

/** Valid bracket values. */
const VALID_BRACKETS = ['FRESH', 'MODERATE', 'DEPLETED', 'CRITICAL'];

/** Required top-level sections in core-config.yaml. */
const REQUIRED_CONFIG_SECTIONS = ['project', 'agents', 'quality_gates', 'synapse', 'paths'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read and parse a JSON file.
 * @param {string} filePath
 * @returns {object|null}
 */
function _safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Safely read and parse a YAML file.
 * @param {string} filePath
 * @returns {object|null}
 */
function _safeReadYaml(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

/**
 * Check 1: Bracket consistency.
 * The bracket value in hook-metrics.json must be one of the 4 valid values.
 *
 * @param {object|null} hookData - Parsed hook-metrics.json
 * @returns {{ name: string, status: string, detail: string }}
 */
function _checkBracket(hookData) {
  if (!hookData) {
    return {
      name: 'bracket-consistency',
      status: 'WARN',
      detail: 'hook-metrics.json not found — cannot verify bracket',
    };
  }

  const bracket = hookData.bracket;
  if (VALID_BRACKETS.includes(bracket)) {
    return {
      name: 'bracket-consistency',
      status: 'PASS',
      detail: `bracket "${bracket}" is valid`,
    };
  }

  return {
    name: 'bracket-consistency',
    status: 'FAIL',
    detail: `bracket "${bracket || 'undefined'}" is not one of: ${VALID_BRACKETS.join(', ')}`,
  };
}

/**
 * Check 2: Agent consistency.
 * Active agents in active-agents.json must be registered in core-config.yaml agents section.
 *
 * @param {object|null} activeAgents - Parsed active-agents.json
 * @param {object|null} coreConfig - Parsed core-config.yaml
 * @returns {{ name: string, status: string, detail: string }}
 */
function _checkAgents(activeAgents, coreConfig) {
  if (!activeAgents) {
    return {
      name: 'agent-consistency',
      status: 'WARN',
      detail: 'active-agents.json not found — no active agents',
    };
  }

  if (!coreConfig || !coreConfig.agents) {
    return {
      name: 'agent-consistency',
      status: 'WARN',
      detail: 'core-config.yaml agents section missing — cannot validate',
    };
  }

  const activeIds = Object.keys(activeAgents);
  if (activeIds.length === 0) {
    return {
      name: 'agent-consistency',
      status: 'PASS',
      detail: 'no active agents (idle session)',
    };
  }

  const knownAgents = Object.keys(coreConfig.agents);
  const unknown = activeIds.filter(id => !knownAgents.includes(id));

  if (unknown.length === 0) {
    return {
      name: 'agent-consistency',
      status: 'PASS',
      detail: `${activeIds.length} active agent(s) all registered: ${activeIds.join(', ')}`,
    };
  }

  return {
    name: 'agent-consistency',
    status: 'FAIL',
    detail: `unknown agent(s) in active-agents.json: ${unknown.join(', ')} (not in core-config.yaml)`,
  };
}

/**
 * Check 3: Timestamp consistency.
 * active-agents.json activation timestamps vs hook-metrics.json timestamp
 * should be within MAX_TIMESTAMP_GAP_MS (agent activated -> hook ran soon after).
 *
 * @param {object|null} activeAgents - Parsed active-agents.json
 * @param {object|null} hookData - Parsed hook-metrics.json
 * @returns {{ name: string, status: string, detail: string }}
 */
function _checkTimestamps(activeAgents, hookData) {
  if (!activeAgents || !hookData) {
    return {
      name: 'timestamp-consistency',
      status: 'WARN',
      detail: 'missing metrics file(s) — cannot check timestamp alignment',
    };
  }

  const hookTs = hookData.timestamp ? new Date(hookData.timestamp).getTime() : null;
  if (!hookTs) {
    return {
      name: 'timestamp-consistency',
      status: 'WARN',
      detail: 'hook-metrics.json has no timestamp field',
    };
  }

  // Find the most recent agent activation
  const activeIds = Object.keys(activeAgents);
  if (activeIds.length === 0) {
    return {
      name: 'timestamp-consistency',
      status: 'PASS',
      detail: 'no active agents to compare',
    };
  }

  let latestActivation = 0;
  let latestAgent = null;
  for (const id of activeIds) {
    const ts = activeAgents[id].activatedAt || 0;
    if (ts > latestActivation) {
      latestActivation = ts;
      latestAgent = id;
    }
  }

  if (latestActivation === 0) {
    return {
      name: 'timestamp-consistency',
      status: 'WARN',
      detail: 'active-agents.json entries have no activatedAt timestamps',
    };
  }

  // hook-metrics updates every prompt, agent activates once — hook should be >= agent
  const gapMs = Math.abs(hookTs - latestActivation);
  const gapSec = Math.round(gapMs / 1000);

  if (gapMs <= MAX_TIMESTAMP_GAP_MS) {
    return {
      name: 'timestamp-consistency',
      status: 'PASS',
      detail: `hook-metrics vs @${latestAgent} activation: ${gapSec}s apart (within ${MAX_TIMESTAMP_GAP_MS / 60000}min)`,
    };
  }

  return {
    name: 'timestamp-consistency',
    status: 'WARN',
    detail: `hook-metrics vs @${latestAgent} activation: ${gapSec}s apart (exceeds ${MAX_TIMESTAMP_GAP_MS / 60000}min threshold — stale session?)`,
  };
}

/**
 * Check 4: Config consistency.
 * core-config.yaml must be parseable and contain required sections.
 *
 * @param {object|null} coreConfig - Parsed core-config.yaml (null = parse failed)
 * @param {string} configPath - Path used for error message
 * @returns {{ name: string, status: string, detail: string }}
 */
function _checkConfig(coreConfig, configPath) {
  if (!fs.existsSync(configPath)) {
    return {
      name: 'config-consistency',
      status: 'FAIL',
      detail: `core-config.yaml not found at ${configPath}`,
    };
  }

  if (!coreConfig) {
    return {
      name: 'config-consistency',
      status: 'FAIL',
      detail: 'core-config.yaml exists but failed to parse (invalid YAML)',
    };
  }

  const missing = REQUIRED_CONFIG_SECTIONS.filter(section => !coreConfig[section]);
  if (missing.length === 0) {
    const agentCount = coreConfig.agents ? Object.keys(coreConfig.agents).length : 0;
    return {
      name: 'config-consistency',
      status: 'PASS',
      detail: `all required sections present, ${agentCount} agents registered`,
    };
  }

  return {
    name: 'config-consistency',
    status: 'FAIL',
    detail: `missing required sections: ${missing.join(', ')}`,
  };
}

// ---------------------------------------------------------------------------
// Main collector
// ---------------------------------------------------------------------------

/**
 * Collect cross-system consistency checks.
 *
 * @param {string} projectRoot - Absolute path to copywriting-ecosystem root
 * @returns {{
 *   name: string,
 *   status: string,
 *   data: {
 *     available: boolean,
 *     checks: Array<{ name: string, status: string, detail: string }>,
 *     score: number,
 *     maxScore: number
 *   },
 *   message: string
 * }}
 */
function collectConsistencyMetrics(projectRoot) {
  const hookData = _safeReadJson(
    path.join(projectRoot, '.synapse', 'metrics', 'hook-metrics.json')
  );
  const activeAgents = _safeReadJson(
    path.join(HOME, '.claude', 'session-state', 'active-agents.json')
  );
  const configPath = path.join(HOME, '.claude', '.aios-core', 'core-config.yaml');
  const coreConfig = _safeReadYaml(configPath);

  const checks = [];
  let score = 0;
  const maxScore = 4;

  const bracketCheck = _checkBracket(hookData);
  checks.push(bracketCheck);
  if (bracketCheck.status === 'PASS') score++;

  const agentCheck = _checkAgents(activeAgents, coreConfig);
  checks.push(agentCheck);
  if (agentCheck.status === 'PASS') score++;

  const tsCheck = _checkTimestamps(activeAgents, hookData);
  checks.push(tsCheck);
  if (tsCheck.status === 'PASS') score++;

  const configCheck = _checkConfig(coreConfig, configPath);
  checks.push(configCheck);
  if (configCheck.status === 'PASS') score++;

  // Overall status: any FAIL = FAIL, any WARN = WARN, else OK
  const hasFail = checks.some(c => c.status === 'FAIL');
  const hasWarn = checks.some(c => c.status === 'WARN');
  const status = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'OK';

  const failCount = checks.filter(c => c.status === 'FAIL').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;

  let message;
  if (status === 'OK') {
    message = `${score}/${maxScore} checks passed`;
  } else {
    const parts = [];
    if (failCount > 0) parts.push(`${failCount} fail`);
    if (warnCount > 0) parts.push(`${warnCount} warn`);
    message = `${score}/${maxScore} checks passed (${parts.join(', ')})`;
  }

  return {
    name: 'consistency',
    status,
    data: {
      available: true,
      checks,
      score,
      maxScore,
    },
    message,
  };
}

module.exports = {
  collectConsistencyMetrics,
  MAX_TIMESTAMP_GAP_MS,
  VALID_BRACKETS,
  REQUIRED_CONFIG_SECTIONS,
};
