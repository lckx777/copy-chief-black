'use strict';

/**
 * Lock Manager
 *
 * File-based distributed locking for multi-terminal safety.
 * Adapted from Synkra's lock-manager.js for the Copy Chief ecosystem.
 *
 * Lock files live at ~/.claude/.lock/{resource}.lock.yaml
 * Schema: { owner, pid, resource, acquired_at, ttl_ms, purpose }
 *
 * @module lock-manager
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCK_DIR = path.join(process.env.HOME, '.claude', '.lock');
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a resource name to a safe lock file name.
 * Replaces path separators and spaces with underscores.
 */
function resourceToFileName(resource) {
  return resource.replace(/[/\\:\s]+/g, '_') + '.lock.yaml';
}

/**
 * Absolute path to the lock file for a resource.
 */
function lockFilePath(resource) {
  fs.mkdirSync(LOCK_DIR, { recursive: true });
  return path.join(LOCK_DIR, resourceToFileName(resource));
}

/**
 * Read a lock file safely. Returns null if missing or corrupt.
 */
function readLock(resource) {
  const filePath = lockFilePath(resource);
  try {
    if (!fs.existsSync(filePath)) return null;
    return yaml.load(fs.readFileSync(filePath, 'utf8')) || null;
  } catch (_) {
    return null;
  }
}

/**
 * Write a lock file atomically.
 */
function writeLock(resource, lockData) {
  const filePath = lockFilePath(resource);
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, yaml.dump(lockData, { lineWidth: 120, noRefs: true }), 'utf8');
  fs.renameSync(tmp, filePath);
}

/**
 * Delete a lock file. Swallows errors.
 */
function deleteLock(resource) {
  try {
    fs.unlinkSync(lockFilePath(resource));
  } catch (_) {}
}

/**
 * Check whether a process with the given PID is still alive.
 * Uses POSIX signal 0 (does not actually send a signal).
 * Returns false on any error (process gone or permission denied).
 */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Check whether a lock is stale.
 * A lock is stale when its TTL has expired OR its owner PID is no longer alive.
 */
function isStale(lockData) {
  if (!lockData) return true;

  const acquiredAt = new Date(lockData.acquired_at).getTime();
  const ttl = lockData.ttl_ms || DEFAULT_TTL_MS;
  const now = Date.now();

  if (now - acquiredAt > ttl) return true;
  if (lockData.pid && !isPidAlive(lockData.pid)) return true;

  return false;
}

/**
 * Sleep for ms milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Current ISO timestamp.
 */
function now() {
  return new Date().toISOString();
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Acquire a lock on a resource.
 *
 * Will retry up to RETRY_ATTEMPTS times if the resource is already locked
 * (and the lock is not stale). Stale locks are forcibly removed before
 * attempting acquisition.
 *
 * @param {string} resource - Logical resource name (e.g. 'florayla-dispatch-queue')
 * @param {string} owner - Owner identifier (e.g. agent handle or session id)
 * @param {object} [options]
 * @param {number} [options.ttl_ms] - Lock TTL in ms (default: 5 minutes)
 * @param {string} [options.purpose] - Human-readable reason for the lock
 * @returns {{ acquired: boolean, reason?: string, lock?: object }}
 */
async function acquire(resource, owner, options = {}) {
  const ttl = options.ttl_ms || DEFAULT_TTL_MS;
  const purpose = options.purpose || '';

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    const existing = readLock(resource);

    if (existing) {
      if (isStale(existing)) {
        // Remove stale lock and proceed
        deleteLock(resource);
      } else if (existing.owner === owner) {
        // Same owner re-acquiring (refresh TTL)
        existing.acquired_at = now();
        existing.ttl_ms = ttl;
        writeLock(resource, existing);
        return { acquired: true, lock: existing };
      } else {
        // Locked by a different, live owner
        if (attempt < RETRY_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return {
          acquired: false,
          reason: `Resource '${resource}' locked by '${existing.owner}' (PID ${existing.pid})`,
        };
      }
    }

    // Slot is free — create lock
    const lockData = {
      owner,
      pid: process.pid,
      resource,
      acquired_at: now(),
      ttl_ms: ttl,
      purpose,
    };

    try {
      writeLock(resource, lockData);
      return { acquired: true, lock: lockData };
    } catch (err) {
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { acquired: false, reason: `Failed to write lock file: ${err.message}` };
    }
  }

  return { acquired: false, reason: 'Exceeded retry attempts' };
}

/**
 * Release a lock on a resource.
 *
 * Only releases if the current lock owner matches the provided owner.
 *
 * @param {string} resource
 * @param {string} owner
 * @returns {{ released: boolean, reason?: string }}
 */
function release(resource, owner) {
  const existing = readLock(resource);

  if (!existing) {
    return { released: true, reason: 'Lock did not exist (already released)' };
  }

  if (existing.owner !== owner) {
    return {
      released: false,
      reason: `Cannot release: lock owned by '${existing.owner}', not '${owner}'`,
    };
  }

  deleteLock(resource);
  return { released: true };
}

/**
 * Check whether a resource is currently locked (by any live owner).
 *
 * @param {string} resource
 * @returns {boolean}
 */
function isLocked(resource) {
  const existing = readLock(resource);
  if (!existing) return false;
  if (isStale(existing)) {
    deleteLock(resource);
    return false;
  }
  return true;
}

/**
 * Remove all stale lock files from the lock directory.
 *
 * @returns {{ cleaned: number, errors: string[] }}
 */
function cleanupStale() {
  const errors = [];
  let cleaned = 0;

  let files;
  try {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
    files = fs.readdirSync(LOCK_DIR).filter((f) => f.endsWith('.lock.yaml'));
  } catch (err) {
    return { cleaned: 0, errors: [`Cannot read lock dir: ${err.message}`] };
  }

  for (const file of files) {
    const filePath = path.join(LOCK_DIR, file);
    try {
      const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
      if (isStale(content)) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    } catch (err) {
      // Corrupt lock file — remove it
      try {
        fs.unlinkSync(filePath);
        cleaned++;
      } catch (e2) {
        errors.push(`Failed to remove ${file}: ${e2.message}`);
      }
    }
  }

  return { cleaned, errors };
}

/**
 * Get full information about a lock without modifying it.
 *
 * @param {string} resource
 * @returns {{ locked: boolean, stale: boolean, lock: object|null }}
 */
function getLockInfo(resource) {
  const existing = readLock(resource);
  if (!existing) {
    return { locked: false, stale: false, lock: null };
  }
  const stale = isStale(existing);
  return { locked: !stale, stale, lock: existing };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  acquire,
  release,
  isLocked,
  cleanupStale,
  getLockInfo,
  // Constants (exposed for callers that need custom TTLs)
  DEFAULT_TTL_MS,
  LOCK_DIR,
};
