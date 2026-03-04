'use strict';

/**
 * Gate Audit Trail (U-14)
 *
 * Records every gate evaluation to a per-gate YAML file under
 * {offerPath}/.aios/gate-audit/{gateName}.yaml.
 * Each file holds an array of entries (max 20, FIFO).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const MAX_ENTRIES = 20;

/**
 * Resolve offerPath to an absolute path.
 * Relative paths are resolved against ECOSYSTEM_ROOT.
 */
function _resolveOfferPath(offerPath) {
  if (path.isAbsolute(offerPath)) {
    return offerPath;
  }
  return path.join(ECOSYSTEM_ROOT, offerPath);
}

/**
 * Return the absolute path for the audit YAML file.
 */
function _auditFilePath(offerPath, gateName) {
  const absOffer = _resolveOfferPath(offerPath);
  return path.join(absOffer, '.aios', 'gate-audit', `${gateName}.yaml`);
}

/**
 * Load existing audit trail array from disk.
 * Returns [] on any error (missing file, parse failure).
 */
function _loadRaw(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * writeAudit(offerPath, gateName, result)
 *
 * Appends a new entry to the audit trail for the given gate.
 * result shape: { total_weighted, verdict, criteria }
 * FIFO: keeps at most MAX_ENTRIES (20) entries, removing oldest when exceeded.
 */
function writeAudit(offerPath, gateName, result) {
  const filePath = _auditFilePath(offerPath, gateName);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const entries = _loadRaw(filePath);

  const entry = {
    timestamp: new Date().toISOString(),
    total_weighted: result.total_weighted != null ? result.total_weighted : null,
    verdict: result.verdict || null,
    criteria: Array.isArray(result.criteria) ? result.criteria : [],
  };

  entries.push(entry);

  // FIFO: remove oldest entries beyond MAX_ENTRIES
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }

  try {
    fs.writeFileSync(filePath, yaml.dump(entries, { lineWidth: -1 }), 'utf8');
  } catch (e) {
    // Non-fatal: audit write failure should not break the pipeline
    console.error(`[GateAudit] Failed to write audit for ${gateName}: ${e.message}`);
  }
}

/**
 * readAuditTrail(offerPath, gateName)
 *
 * Returns the full array of audit entries for the given gate.
 * Returns [] if the file does not exist or cannot be parsed.
 */
function readAuditTrail(offerPath, gateName) {
  const filePath = _auditFilePath(offerPath, gateName);
  return _loadRaw(filePath);
}

/**
 * getLastAudit(offerPath, gateName)
 *
 * Returns the most recent audit entry or null if no entries exist.
 */
function getLastAudit(offerPath, gateName) {
  const trail = readAuditTrail(offerPath, gateName);
  if (trail.length === 0) {
    return null;
  }
  return trail[trail.length - 1];
}

module.exports = { writeAudit, readAuditTrail, getLastAudit };
