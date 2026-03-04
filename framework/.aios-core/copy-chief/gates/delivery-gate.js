'use strict';

/**
 * Delivery Gate (U-15)
 *
 * Verifies all delivery checklist items are met before final delivery.
 * Reads delivery-checklist.yaml for criteria definitions.
 * Evaluates conditions: file_exists, score_above, gate_passed, human_approved.
 *
 * @module delivery-gate
 * @version 1.0.0
 * @atom U-15
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const CHECKLIST_PATH = path.join(ECOSYSTEM_ROOT, 'squads', 'copy-chief', 'templates', 'delivery-checklist.yaml');

/**
 * Evaluate the delivery gate for an offer.
 *
 * @param {string} offerPath - Relative or absolute offer path
 * @param {object} [scores] - Map of tool scores { blind_critic: 8, emotional_stress_test: 7, ... }
 * @returns {{ passed: boolean, total: number, met: number, unmet: string[], details: object[] }}
 */
function evaluateDeliveryGate(offerPath, scores = {}) {
  const absOffer = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);

  const checklist = loadChecklist();
  if (!checklist || !checklist.criteria) {
    return { passed: true, total: 0, met: 0, unmet: [], details: [] };
  }

  const details = [];
  const unmet = [];
  let metCount = 0;

  for (const criterion of checklist.criteria) {
    const result = evaluateCriterion(criterion, absOffer, scores);
    details.push({ ...criterion, ...result });

    if (result.met) {
      metCount++;
    } else {
      unmet.push(criterion.name || criterion.id || 'unnamed');
    }
  }

  return {
    passed: unmet.length === 0,
    total: checklist.criteria.length,
    met: metCount,
    unmet,
    details,
  };
}

/**
 * Evaluate a single criterion.
 */
function evaluateCriterion(criterion, absOffer, scores) {
  const type = criterion.type || 'file_exists';

  switch (type) {
    case 'file_exists': {
      const filePath = criterion.path
        ? criterion.path.replace('{offer}', absOffer)
        : null;
      if (!filePath) return { met: false, reason: 'no path specified' };
      return { met: fs.existsSync(filePath), reason: fs.existsSync(filePath) ? 'exists' : 'missing' };
    }

    case 'dir_has_files': {
      const dirPath = criterion.path
        ? criterion.path.replace('{offer}', absOffer)
        : null;
      if (!dirPath) return { met: false, reason: 'no path specified' };
      try {
        const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
        const minFiles = criterion.min_files || 1;
        return {
          met: files.length >= minFiles,
          reason: `${files.length} files (need ${minFiles}+)`,
        };
      } catch {
        return { met: false, reason: 'directory not found' };
      }
    }

    case 'score_above': {
      const tool = criterion.tool;
      const threshold = criterion.threshold || 7;
      const score = scores[tool];
      if (score === undefined) return { met: false, reason: `${tool} not evaluated` };
      return { met: score >= threshold, reason: `${tool}: ${score} (need ${threshold}+)` };
    }

    case 'gate_passed': {
      const gatePath = path.join(absOffer, '.aios', 'gate-audit', `${criterion.gate}.yaml`);
      try {
        const content = yaml.load(fs.readFileSync(gatePath, 'utf8'));
        if (!Array.isArray(content) || content.length === 0) {
          return { met: false, reason: `no audit trail for ${criterion.gate}` };
        }
        const last = content[content.length - 1];
        return {
          met: last.verdict === 'PASSED',
          reason: `${criterion.gate}: ${last.verdict}`,
        };
      } catch {
        return { met: false, reason: `${criterion.gate} audit not found` };
      }
    }

    case 'human_approved': {
      const approvalPath = path.join(absOffer, '.aios', 'approvals', `${criterion.id || 'delivery'}.yaml`);
      try {
        const content = yaml.load(fs.readFileSync(approvalPath, 'utf8'));
        return { met: content?.approved === true, reason: content?.approved ? 'approved' : 'pending' };
      } catch {
        return { met: false, reason: 'not yet approved' };
      }
    }

    default:
      return { met: false, reason: `unknown criterion type: ${type}` };
  }
}

/**
 * Load the delivery checklist template.
 */
function loadChecklist(checklistPath) {
  const p = checklistPath || CHECKLIST_PATH;
  try {
    return yaml.load(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = { evaluateDeliveryGate, loadChecklist };
