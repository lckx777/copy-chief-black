'use strict';

/**
 * Plan Verification
 *
 * Verifies if a task was actually completed by checking filesystem,
 * helix-state gates, and validation scores.
 *
 * Reuses logic from pipeline-state-projector.cjs (isStepCompleted, hasFiles).
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

class PlanVerification {
  constructor(ecosystemRoot) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
  }

  /**
   * Verify if a task is completed based on its verification rules.
   * @param {object} task - The task from execution-plan.yaml
   * @param {string} offerPath - Relative offer path
   * @returns {{ verified: boolean, reason: string }}
   */
  verify(task, offerPath) {
    if (!task.verification) {
      // No verification rule — assume completed if agent returned
      return { verified: true, reason: 'No verification rule defined' };
    }

    const offerDir = path.join(this.ecosystemRoot, offerPath);
    const v = task.verification;

    switch (v.type) {
      case 'dir_has_files':
        return this._verifyDirHasFiles(path.join(offerDir, v.path));

      case 'file_exists':
        return this._verifyFileExists(path.join(offerDir, v.path));

      case 'gate_passed':
        return this._verifyGatePassed(offerDir, v.gate);

      case 'score_threshold':
        return this._verifyScoreThreshold(offerDir, v.tool, v.threshold);

      default:
        return { verified: false, reason: `Unknown verification type: ${v.type}` };
    }
  }

  /**
   * Verify all completed tasks in a plan.
   * Returns list of tasks that fail verification.
   */
  verifyPlan(plan, offerPath) {
    const failures = [];
    for (const task of plan.tasks) {
      if (task.status !== 'completed' || task.type !== 'auto') continue;
      const result = this.verify(task, offerPath);
      if (!result.verified) {
        failures.push({ taskId: task.id, title: task.title, reason: result.reason });
      }
    }
    return failures;
  }

  // --- Verification methods ---

  _verifyDirHasFiles(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return { verified: false, reason: `Directory not found: ${dirPath}` };
    }

    if (this._hasFiles(dirPath)) {
      return { verified: true, reason: 'Directory contains files' };
    }

    return { verified: false, reason: `Directory exists but is empty: ${dirPath}` };
  }

  _verifyFileExists(filePath) {
    if (fs.existsSync(filePath)) {
      return { verified: true, reason: 'File exists' };
    }
    return { verified: false, reason: `File not found: ${filePath}` };
  }

  _verifyGatePassed(offerDir, gateName) {
    const helixPath = path.join(offerDir, 'helix-state.yaml');
    if (!fs.existsSync(helixPath)) {
      return { verified: false, reason: 'helix-state.yaml not found' };
    }

    try {
      const state = yaml.load(fs.readFileSync(helixPath, 'utf8'));
      const gateValue = state?.gates?.[gateName];

      if (gateValue === true || gateValue?.passed === true || gateValue === 'passed') {
        return { verified: true, reason: `Gate ${gateName} passed` };
      }

      return { verified: false, reason: `Gate ${gateName} is ${JSON.stringify(gateValue) || 'not set'}` };
    } catch (e) {
      return { verified: false, reason: `Error reading helix-state: ${e.message}` };
    }
  }

  _verifyScoreThreshold(offerDir, toolName, threshold) {
    const helixPath = path.join(offerDir, 'helix-state.yaml');
    if (!fs.existsSync(helixPath)) {
      return { verified: false, reason: 'helix-state.yaml not found' };
    }

    try {
      const state = yaml.load(fs.readFileSync(helixPath, 'utf8'));
      const history = state?.validation_history || [];

      // Find latest result for this tool
      const latest = history
        .filter(h => h.tool === toolName)
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        [0];

      if (!latest) {
        return { verified: false, reason: `No ${toolName} result found in validation_history` };
      }

      const score = latest.score || latest.overall_score || 0;
      if (score >= threshold) {
        return { verified: true, reason: `${toolName} score ${score} >= ${threshold}` };
      }

      return { verified: false, reason: `${toolName} score ${score} < ${threshold}` };
    } catch (e) {
      return { verified: false, reason: `Error checking score: ${e.message}` };
    }
  }

  /**
   * Recursively check if directory contains at least one real file.
   */
  _hasFiles(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) return true;
        if (entry.isDirectory()) {
          if (this._hasFiles(path.join(dirPath, entry.name))) return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

module.exports = { PlanVerification };
