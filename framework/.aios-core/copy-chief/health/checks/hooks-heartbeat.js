'use strict';

/**
 * Hook Health Heartbeat Check
 *
 * Verifies all hooks have recent heartbeats.
 * Stale heartbeat (>1 hour) = WARN. Error pattern (3+) = FAIL.
 *
 * @module hooks-heartbeat
 * @version 1.0.0
 * @atom U-18
 */

const fs = require('fs');
const path = require('path');

const HEARTBEAT_DIR = path.join(process.env.HOME, '.claude', '.hook-health');
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const ERROR_THRESHOLD = 3;

/**
 * @returns {{ name: string, domain: string, severity: string, status: string, details: string }}
 */
function check() {
  const result = {
    name: 'hooks-heartbeat',
    domain: 'LOCAL',
    severity: 'medium',
    status: 'OK',
    details: '',
  };

  if (!fs.existsSync(HEARTBEAT_DIR)) {
    result.status = 'WARN';
    result.details = 'No heartbeat directory found. Hooks may not be instrumented.';
    return result;
  }

  const now = Date.now();
  const warnings = [];
  const failures = [];
  let totalChecked = 0;

  try {
    const files = fs.readdirSync(HEARTBEAT_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
      totalChecked++;
      const filePath = path.join(HEARTBEAT_DIR, file);

      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const hookName = file.replace('.json', '');

        // Check staleness
        const lastSuccess = data.last_success ? new Date(data.last_success).getTime() : 0;
        if (lastSuccess > 0 && (now - lastSuccess) > STALE_THRESHOLD_MS) {
          warnings.push(`${hookName}: stale (last success ${Math.round((now - lastSuccess) / 60000)}min ago)`);
        }

        // Check error pattern
        const errorCount = data.error_count || 0;
        if (errorCount >= ERROR_THRESHOLD) {
          failures.push(`${hookName}: ${errorCount} errors in recent runs`);
        }
      } catch { /* skip corrupt files */ }
    }
  } catch {
    result.status = 'WARN';
    result.details = 'Cannot read heartbeat directory';
    return result;
  }

  if (failures.length > 0) {
    result.status = 'FAIL';
    result.details = `${failures.length} hooks failing: ${failures.join('; ')}`;
  } else if (warnings.length > 0) {
    result.status = 'WARN';
    result.details = `${warnings.length} stale hooks: ${warnings.join('; ')}`;
  } else {
    result.details = `${totalChecked} hooks healthy`;
  }

  return result;
}

/**
 * Write a heartbeat for a hook (call from hooks).
 *
 * @param {string} hookName
 * @param {boolean} success
 * @param {string} [error]
 */
function writeHeartbeat(hookName, success, error) {
  try {
    fs.mkdirSync(HEARTBEAT_DIR, { recursive: true });
    const filePath = path.join(HEARTBEAT_DIR, `${hookName}.json`);

    let data = {};
    try {
      if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch { /* fresh start */ }

    if (success) {
      data.last_success = new Date().toISOString();
      data.error_count = 0;
    } else {
      data.last_error = new Date().toISOString();
      data.last_error_message = error || 'unknown';
      data.error_count = (data.error_count || 0) + 1;
    }

    data.total_runs = (data.total_runs || 0) + 1;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch { /* best effort */ }
}

module.exports = { check, writeHeartbeat, HEARTBEAT_DIR };
