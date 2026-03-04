'use strict';

/**
 * Hook Collector — Copy Chief BLACK Edition
 *
 * Reads heartbeat files from ~/.claude/.hook-health/ to report the health
 * status of each wired hook in the Copy Chief BLACK ecosystem.
 *
 * Heartbeat files are written by hooks themselves via writeHeartbeat()
 * (from copy-chief/health/checks/hooks-heartbeat.js pattern).
 * Each file: { last_success, last_error, last_error_message, error_count, total_runs }
 *
 * Staleness threshold: >30min since last success = STALE (WARN).
 * Absence of heartbeat dir: WARN (hooks may not be instrumented).
 *
 * @module core/synapse/diagnostics/collectors/hook-collector
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-13)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

/** Path to hook heartbeat directory. */
const HEARTBEAT_DIR = path.join(HOME, '.claude', '.hook-health');

/** Stale threshold — hooks not seen in this window are flagged as stale. */
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Read a single heartbeat file safely.
 * @param {string} filePath
 * @returns {object|null}
 */
function _readHeartbeat(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Compute a per-hook status from its heartbeat data.
 *
 * @param {string} hookName - Hook name (filename without .json)
 * @param {object|null} data - Parsed heartbeat data
 * @param {number} now - Current timestamp in ms
 * @returns {{
 *   hookName: string,
 *   status: 'OK' | 'WARN' | 'FAIL' | 'UNKNOWN',
 *   lastSuccess: string|null,
 *   lastError: string|null,
 *   errorCount: number,
 *   totalRuns: number,
 *   stale: boolean,
 *   ageMs: number,
 *   detail: string
 * }}
 */
function _evaluateHook(hookName, data, now) {
  if (!data) {
    return {
      hookName,
      status: 'UNKNOWN',
      lastSuccess: null,
      lastError: null,
      errorCount: 0,
      totalRuns: 0,
      stale: false,
      ageMs: 0,
      detail: 'heartbeat file unreadable or corrupt',
    };
  }

  const lastSuccessTs = data.last_success ? new Date(data.last_success).getTime() : 0;
  const ageMs = lastSuccessTs > 0 ? now - lastSuccessTs : Infinity;
  const stale = ageMs > STALE_THRESHOLD_MS;
  const errorCount = data.error_count || 0;
  const totalRuns = data.total_runs || 0;

  let status = 'OK';
  let detail;

  if (errorCount > 0 && lastSuccessTs === 0) {
    // Never succeeded — only errors
    status = 'FAIL';
    detail = `${errorCount} error(s), never succeeded. Last: ${data.last_error_message || 'unknown'}`;
  } else if (stale && lastSuccessTs === 0) {
    status = 'WARN';
    detail = 'never fired successfully';
  } else if (stale) {
    status = 'WARN';
    const ageMin = Math.round(ageMs / 60000);
    detail = `stale — last success ${ageMin}min ago`;
  } else if (errorCount > 0) {
    status = 'WARN';
    const ageMin = lastSuccessTs > 0 ? Math.round(ageMs / 60000) : null;
    detail = `${errorCount} recent error(s)${ageMin !== null ? `, last success ${ageMin}min ago` : ''}`;
  } else {
    const ageMin = Math.round(ageMs / 60000);
    detail = `healthy, last success ${ageMin}min ago (${totalRuns} total runs)`;
  }

  return {
    hookName,
    status,
    lastSuccess: data.last_success || null,
    lastError: data.last_error || null,
    errorCount,
    totalRuns,
    stale,
    ageMs: ageMs === Infinity ? -1 : ageMs,
    detail,
  };
}

/**
 * Collect hook heartbeat data from ~/.claude/.hook-health/.
 *
 * @param {string} _projectRoot - Unused (hooks are global, not per-project)
 * @returns {{
 *   name: string,
 *   status: string,
 *   data: {
 *     available: boolean,
 *     heartbeatDir: string,
 *     hooks: Array,
 *     totalHooks: number,
 *     healthyCount: number,
 *     warnCount: number,
 *     failCount: number,
 *     staleCount: number
 *   },
 *   message: string
 * }}
 */
function collectHookHeartbeats(_projectRoot) {
  const now = Date.now();

  if (!fs.existsSync(HEARTBEAT_DIR)) {
    return {
      name: 'hooks',
      status: 'WARN',
      data: {
        available: false,
        heartbeatDir: HEARTBEAT_DIR,
        hooks: [],
        totalHooks: 0,
        healthyCount: 0,
        warnCount: 0,
        failCount: 0,
        staleCount: 0,
      },
      message: `Heartbeat directory not found at ${HEARTBEAT_DIR} — hooks may not be instrumented`,
    };
  }

  let files;
  try {
    files = fs.readdirSync(HEARTBEAT_DIR).filter(f => f.endsWith('.json'));
  } catch (err) {
    return {
      name: 'hooks',
      status: 'WARN',
      data: {
        available: false,
        heartbeatDir: HEARTBEAT_DIR,
        hooks: [],
        totalHooks: 0,
        healthyCount: 0,
        warnCount: 0,
        failCount: 0,
        staleCount: 0,
      },
      message: `Cannot read heartbeat directory: ${err.message}`,
    };
  }

  if (files.length === 0) {
    return {
      name: 'hooks',
      status: 'WARN',
      data: {
        available: true,
        heartbeatDir: HEARTBEAT_DIR,
        hooks: [],
        totalHooks: 0,
        healthyCount: 0,
        warnCount: 0,
        failCount: 0,
        staleCount: 0,
      },
      message: 'No hook heartbeat files found — hooks have not fired yet this session',
    };
  }

  const hooks = files.map(file => {
    const hookName = file.replace('.json', '');
    const filePath = path.join(HEARTBEAT_DIR, file);
    const data = _readHeartbeat(filePath);
    return _evaluateHook(hookName, data, now);
  });

  // Sort: FAIL first, then WARN, then OK
  hooks.sort((a, b) => {
    const order = { FAIL: 0, WARN: 1, UNKNOWN: 2, OK: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  const totalHooks = hooks.length;
  const failCount = hooks.filter(h => h.status === 'FAIL').length;
  const warnCount = hooks.filter(h => h.status === 'WARN').length;
  const healthyCount = hooks.filter(h => h.status === 'OK').length;
  const staleCount = hooks.filter(h => h.stale).length;

  const status = failCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARN' : 'OK';

  let message;
  if (status === 'OK') {
    message = `${totalHooks} hook(s) healthy`;
  } else {
    const parts = [];
    if (failCount > 0) parts.push(`${failCount} failing`);
    if (warnCount > 0) parts.push(`${warnCount} warn`);
    if (staleCount > 0) parts.push(`${staleCount} stale`);
    message = `${healthyCount}/${totalHooks} healthy (${parts.join(', ')})`;
  }

  return {
    name: 'hooks',
    status,
    data: {
      available: true,
      heartbeatDir: HEARTBEAT_DIR,
      hooks,
      totalHooks,
      healthyCount,
      warnCount,
      failCount,
      staleCount,
    },
    message,
  };
}

module.exports = {
  collectHookHeartbeats,
  HEARTBEAT_DIR,
  STALE_THRESHOLD_MS,
};
