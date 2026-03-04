'use strict';

/**
 * Recovery Handler
 *
 * Handles failure recovery for dispatch queue entries.
 * Adapted from Synkra's recovery-handler.js for the Copy Chief ecosystem.
 *
 * 5 strategies: RETRY, ROLLBACK, SKIP, ESCALATE, ABORT
 * Error classes: transient, state, config, fatal
 *
 * @module recovery-handler
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

const AIOS_DIR = '.aios';
const DISPATCH_QUEUE_FILE = 'dispatch-queue.yaml';
const RECOVERY_LOG_FILE = 'recovery-log.yaml';

/** Error classifications */
const ErrorType = {
  TRANSIENT: 'transient',  // timeout, partial output — safe to retry
  STATE: 'state',           // corrupt yaml, bad state transition
  CONFIG: 'config',         // missing files, bad config
  FATAL: 'fatal',           // gate block, unrecoverable
};

/** Recovery strategies */
const RecoveryStrategy = {
  RETRY: 'RETRY',           // Reset dispatch entry to pending, try again
  ROLLBACK: 'ROLLBACK',     // Revert dispatch status to original pre-dispatch state
  SKIP: 'SKIP',             // Mark entry as skipped, continue pipeline
  ESCALATE: 'ESCALATE',     // Write human-decision.yaml, pause pipeline
  ABORT: 'ABORT',           // Mark all pending entries as aborted
};

/** Maps error type + retry count to preferred strategy */
const STRATEGY_MATRIX = {
  [ErrorType.TRANSIENT]: [
    RecoveryStrategy.RETRY,    // 0 retries
    RecoveryStrategy.RETRY,    // 1 retry
    RecoveryStrategy.RETRY,    // 2 retries
    RecoveryStrategy.SKIP,     // 3 retries — give up, skip
  ],
  [ErrorType.STATE]: [
    RecoveryStrategy.ROLLBACK, // 0 retries
    RecoveryStrategy.RETRY,    // 1 retry
    RecoveryStrategy.ESCALATE, // 2 retries — needs human review
    RecoveryStrategy.ESCALATE,
  ],
  [ErrorType.CONFIG]: [
    RecoveryStrategy.ESCALATE, // config errors → always escalate immediately
    RecoveryStrategy.ESCALATE,
    RecoveryStrategy.ESCALATE,
    RecoveryStrategy.ABORT,
  ],
  [ErrorType.FATAL]: [
    RecoveryStrategy.ABORT,    // fatal → always abort
    RecoveryStrategy.ABORT,
    RecoveryStrategy.ABORT,
    RecoveryStrategy.ABORT,
  ],
};

/** Patterns that classify error reasons */
const ERROR_PATTERNS = {
  [ErrorType.TRANSIENT]: [
    /timeout/i,
    /partial output/i,
    /timed out/i,
    /connection reset/i,
    /ECONNRESET/,
    /incomplete/i,
    /interrupted/i,
  ],
  [ErrorType.STATE]: [
    /corrupt/i,
    /invalid yaml/i,
    /parse error/i,
    /unexpected state/i,
    /bad state/i,
    /transition/i,
    /schema/i,
  ],
  [ErrorType.CONFIG]: [
    /missing file/i,
    /not found/i,
    /ENOENT/,
    /no such file/i,
    /config/i,
    /undefined offer/i,
    /missing workflow/i,
  ],
  [ErrorType.FATAL]: [
    /gate block/i,
    /gate failed/i,
    /quality gate/i,
    /validation failed/i,
    /black_validation/i,
    /cycle detected/i,
    /infinite loop/i,
    /unauthorized/i,
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the .aios directory for an offer path.
 * offerPath can be absolute or relative to HOME.
 */
function resolveAiosDir(offerPath) {
  const base = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(process.env.HOME, offerPath);
  return path.join(base, AIOS_DIR);
}

/**
 * Read a YAML file safely. Returns null on any error.
 */
function readYaml(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return yaml.load(fs.readFileSync(filePath, 'utf8')) || null;
  } catch (_) {
    return null;
  }
}

/**
 * Write a YAML file atomically (write to .tmp then rename).
 */
function writeYamlSync(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, yaml.dump(data, { lineWidth: 120, noRefs: true }), 'utf8');
  fs.renameSync(tmp, filePath);
}

/**
 * Current ISO timestamp.
 */
function now() {
  return new Date().toISOString();
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Classify an error reason string into an ErrorType.
 *
 * @param {string} reason - Human-readable error description
 * @returns {string} One of ErrorType.*
 */
function classifyError(reason) {
  if (!reason || typeof reason !== 'string') return ErrorType.TRANSIENT;

  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(reason)) return type;
    }
  }

  // Default: treat unknown as transient (safe to retry)
  return ErrorType.TRANSIENT;
}

/**
 * Select a recovery strategy based on error type and current retry count.
 *
 * @param {string} errorType - One of ErrorType.*
 * @param {number} retryCount - How many times this entry has already been retried
 * @returns {string} One of RecoveryStrategy.*
 */
function selectStrategy(errorType, retryCount) {
  const matrix = STRATEGY_MATRIX[errorType] || STRATEGY_MATRIX[ErrorType.TRANSIENT];
  const idx = Math.min(retryCount, MAX_RETRIES);
  return matrix[idx] || RecoveryStrategy.SKIP;
}

/**
 * Execute a recovery strategy against a specific dispatch entry.
 *
 * @param {string} offerPath - Absolute or relative path to the offer directory
 * @param {string} dispatchId - The id of the dispatch entry to recover
 * @param {string} strategy - One of RecoveryStrategy.*
 * @returns {{ success: boolean, action: string, message: string }}
 */
function executeRecovery(offerPath, dispatchId, strategy) {
  const aiosDir = resolveAiosDir(offerPath);
  const queuePath = path.join(aiosDir, DISPATCH_QUEUE_FILE);
  const logPath = path.join(aiosDir, RECOVERY_LOG_FILE);

  // Load queue
  const queue = readYaml(queuePath);
  if (!queue || !Array.isArray(queue.entries)) {
    return _fail('Queue not found or malformed', dispatchId, strategy, logPath);
  }

  const entry = queue.entries.find((e) => e.id === dispatchId);
  if (!entry) {
    return _fail(`Dispatch entry not found: ${dispatchId}`, dispatchId, strategy, logPath);
  }

  let result;

  switch (strategy) {
    case RecoveryStrategy.RETRY: {
      // Increment retry count and reset status to pending
      entry.retry_count = (entry.retry_count || 0) + 1;
      entry.status = 'pending';
      entry.last_retry_at = now();
      entry.last_error = entry.error || null;
      delete entry.error;
      writeYamlSync(queuePath, queue);
      result = {
        success: true,
        action: 'RETRY',
        message: `Entry ${dispatchId} reset to pending (retry #${entry.retry_count})`,
      };
      break;
    }

    case RecoveryStrategy.ROLLBACK: {
      // Revert status to the pre-dispatch state (default: pending)
      entry.status = entry.pre_dispatch_status || 'pending';
      entry.retry_count = (entry.retry_count || 0) + 1;
      entry.rolled_back_at = now();
      entry.last_error = entry.error || null;
      delete entry.error;
      writeYamlSync(queuePath, queue);
      result = {
        success: true,
        action: 'ROLLBACK',
        message: `Entry ${dispatchId} rolled back to '${entry.status}'`,
      };
      break;
    }

    case RecoveryStrategy.SKIP: {
      entry.status = 'skipped';
      entry.skipped_at = now();
      entry.skip_reason = entry.error || 'max retries exceeded';
      writeYamlSync(queuePath, queue);
      result = {
        success: true,
        action: 'SKIP',
        message: `Entry ${dispatchId} marked as skipped`,
      };
      break;
    }

    case RecoveryStrategy.ESCALATE: {
      // Write human-decision.yaml and pause the entry
      entry.status = 'escalated';
      entry.escalated_at = now();
      writeYamlSync(queuePath, queue);

      const humanDecision = {
        created_at: now(),
        dispatch_id: dispatchId,
        offer_path: offerPath,
        reason: entry.error || 'Unknown error requiring human decision',
        entry_snapshot: { ...entry },
        options: [
          { action: 'retry', description: 'Reset to pending and retry' },
          { action: 'skip', description: 'Skip this entry and continue' },
          { action: 'abort', description: 'Abort all pending entries' },
          { action: 'manual', description: 'Resolve manually and update queue' },
        ],
        resolution: null,
      };
      writeYamlSync(path.join(aiosDir, 'human-decision.yaml'), humanDecision);

      result = {
        success: true,
        action: 'ESCALATE',
        message: `Entry ${dispatchId} escalated — human-decision.yaml written at ${aiosDir}`,
      };
      break;
    }

    case RecoveryStrategy.ABORT: {
      // Mark this entry + all pending entries as aborted
      let aborted = 0;
      for (const e of queue.entries) {
        if (e.id === dispatchId || e.status === 'pending') {
          e.status = 'aborted';
          e.aborted_at = now();
          e.abort_reason = `Abort triggered by recovery of entry ${dispatchId}`;
          aborted++;
        }
      }
      queue.aborted_at = now();
      queue.abort_trigger = dispatchId;
      writeYamlSync(queuePath, queue);
      result = {
        success: true,
        action: 'ABORT',
        message: `Aborted ${aborted} entries (trigger: ${dispatchId})`,
      };
      break;
    }

    default: {
      result = _fail(`Unknown strategy: ${strategy}`, dispatchId, strategy, logPath);
      break;
    }
  }

  // Append to recovery log
  _appendLog(logPath, dispatchId, strategy, result);

  return result;
}

/**
 * Read the recovery log for an offer.
 *
 * @param {string} offerPath
 * @returns {Array} Array of log entries, newest first
 */
function getRecoveryLog(offerPath) {
  const aiosDir = resolveAiosDir(offerPath);
  const logPath = path.join(aiosDir, RECOVERY_LOG_FILE);
  const log = readYaml(logPath);
  if (!log || !Array.isArray(log.entries)) return [];
  return [...log.entries].reverse();
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _fail(message, dispatchId, strategy, logPath) {
  const result = { success: false, action: strategy, message };
  _appendLog(logPath, dispatchId, strategy, result);
  return result;
}

function _appendLog(logPath, dispatchId, strategy, result) {
  try {
    const existing = readYaml(logPath) || { entries: [] };
    if (!Array.isArray(existing.entries)) existing.entries = [];

    existing.entries.push({
      timestamp: now(),
      dispatch_id: dispatchId,
      strategy,
      success: result.success,
      message: result.message,
    });

    writeYamlSync(logPath, existing);
  } catch (_) {
    // Best-effort logging; never throw from log writes
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  ErrorType,
  RecoveryStrategy,
  classifyError,
  selectStrategy,
  executeRecovery,
  getRecoveryLog,
};
