'use strict';

/**
 * Workflow Phase Condition Evaluator (U-27)
 *
 * Evaluates conditions defined in workflow YAML phase transitions.
 * Supported condition types:
 * - file_exists: checks fs.existsSync(path)
 * - dir_has_files: checks directory has N+ files
 * - score_above: checks tool score >= threshold
 * - gate_passed: checks gate audit trail last verdict
 * - all_of: all sub-conditions must be met
 * - any_of: at least one sub-condition must be met
 *
 * @module condition-evaluator
 * @version 1.0.0
 * @atom U-27
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

/**
 * Evaluate a single condition.
 *
 * @param {object} condition - Condition definition { type, path, threshold, ... }
 * @param {object} [context] - Runtime context { scores: {}, offerPath: '' }
 * @returns {{ met: boolean, reason: string }}
 */
function evaluate(condition, context = {}) {
  if (!condition || !condition.type) {
    return { met: false, reason: 'no condition type' };
  }

  const offerPath = context.offerPath || '';
  const absOffer = offerPath && !path.isAbsolute(offerPath)
    ? path.join(ECOSYSTEM_ROOT, offerPath)
    : offerPath;

  switch (condition.type) {
    case 'file_exists': {
      const filePath = resolvePath(condition.path, absOffer);
      const exists = fs.existsSync(filePath);
      return { met: exists, reason: exists ? 'file exists' : 'file missing' };
    }

    case 'dir_has_files': {
      const dirPath = resolvePath(condition.path, absOffer);
      try {
        const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
        const min = condition.min_files || 1;
        return {
          met: files.length >= min,
          reason: `${files.length}/${min} files`,
        };
      } catch {
        return { met: false, reason: 'directory not found' };
      }
    }

    case 'score_above': {
      const scores = context.scores || context;
      const tool = condition.tool;
      const threshold = condition.threshold || 7;
      const score = scores[tool];
      if (score === undefined) return { met: false, reason: `${tool} not evaluated` };
      return {
        met: score >= threshold,
        reason: `${tool}: ${score} (threshold: ${threshold})`,
      };
    }

    case 'gate_passed': {
      const gateName = condition.gate;
      const auditPath = path.join(absOffer, '.aios', 'gate-audit', `${gateName}.yaml`);
      try {
        const entries = yaml.load(fs.readFileSync(auditPath, 'utf8'));
        if (!Array.isArray(entries) || entries.length === 0) {
          return { met: false, reason: `no ${gateName} audit entries` };
        }
        const last = entries[entries.length - 1];
        return {
          met: last.verdict === 'PASSED',
          reason: `${gateName}: ${last.verdict}`,
        };
      } catch {
        return { met: false, reason: `${gateName} audit not found` };
      }
    }

    case 'all_of': {
      const subs = condition.conditions || [];
      const results = subs.map(c => evaluate(c, context));
      const allMet = results.every(r => r.met);
      const failed = results.filter(r => !r.met).map(r => r.reason);
      return {
        met: allMet,
        reason: allMet ? 'all conditions met' : `failed: ${failed.join(', ')}`,
      };
    }

    case 'any_of': {
      const subs = condition.conditions || [];
      const results = subs.map(c => evaluate(c, context));
      const anyMet = results.some(r => r.met);
      return {
        met: anyMet,
        reason: anyMet ? 'at least one condition met' : 'no conditions met',
      };
    }

    default:
      return { met: false, reason: `unknown type: ${condition.type}` };
  }
}

/**
 * Evaluate all conditions for a workflow phase transition.
 *
 * @param {object[]} conditions - Array of condition definitions
 * @param {object} context - Runtime context
 * @returns {{ canTransition: boolean, results: object[] }}
 */
function evaluateAll(conditions, context = {}) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return { canTransition: true, results: [] };
  }

  const results = conditions.map(c => ({
    condition: c,
    ...evaluate(c, context),
  }));

  return {
    canTransition: results.every(r => r.met),
    results,
  };
}

function resolvePath(p, absOffer) {
  if (!p) return '';
  let resolved = p.replace(/\{offer\}/g, absOffer);
  resolved = resolved.replace(/\$\{HOME\}/g, process.env.HOME);
  resolved = resolved.replace(/~/g, process.env.HOME);
  if (!path.isAbsolute(resolved)) {
    resolved = path.join(ECOSYSTEM_ROOT, resolved);
  }
  return resolved;
}

module.exports = { evaluate, evaluateAll };
