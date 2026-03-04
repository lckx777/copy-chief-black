'use strict';

/**
 * Workflow Validator
 *
 * Validates workflow YAML files against expected schema.
 * Checks structure, required fields, valid transitions.
 *
 * @module workflow-validator
 * @version 1.0.0
 * @atom U-24
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const REQUIRED_WORKFLOW_FIELDS = ['id', 'name', 'phases'];
const REQUIRED_PHASE_FIELDS = ['id', 'title'];
const VALID_PHASE_KEYS = new Set([
  'id', 'title', 'agents', 'depends_on', 'parallel', 'human_gate',
  'tasks', 'expected_outputs', 'handoff_prompt', 'timeout_minutes',
  'retry_policy', 'expected_duration_minutes', 'conditions',
]);

/**
 * Validate a workflow YAML file.
 *
 * @param {string} workflowPath - Absolute path to workflow YAML
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateWorkflow(workflowPath) {
  const result = { valid: true, errors: [], warnings: [] };

  if (!fs.existsSync(workflowPath)) {
    result.errors.push(`File not found: ${workflowPath}`);
    result.valid = false;
    return result;
  }

  let content;
  try {
    content = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
  } catch (e) {
    result.errors.push(`YAML parse error: ${e.message}`);
    result.valid = false;
    return result;
  }

  const workflow = content?.workflow || content;
  if (!workflow) {
    result.errors.push('Empty workflow definition');
    result.valid = false;
    return result;
  }

  // Check required top-level fields
  for (const field of REQUIRED_WORKFLOW_FIELDS) {
    if (!workflow[field]) {
      if (field === 'phases') {
        result.errors.push(`Missing required field: workflow.${field}`);
        result.valid = false;
      } else {
        result.warnings.push(`Missing optional field: workflow.${field}`);
      }
    }
  }

  if (!workflow.version) {
    result.warnings.push('Missing version field');
  }

  const phases = workflow.phases || [];
  if (!Array.isArray(phases)) {
    result.errors.push('phases must be an array');
    result.valid = false;
    return result;
  }

  const phaseIds = new Set();

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const prefix = `phases[${i}]`;

    // Required fields
    for (const field of REQUIRED_PHASE_FIELDS) {
      if (!phase[field]) {
        result.errors.push(`${prefix}: missing required field '${field}'`);
        result.valid = false;
      }
    }

    // Duplicate ID check
    if (phase.id) {
      if (phaseIds.has(phase.id)) {
        result.errors.push(`${prefix}: duplicate phase id '${phase.id}'`);
        result.valid = false;
      }
      phaseIds.add(phase.id);
    }

    // Unknown keys
    if (phase && typeof phase === 'object') {
      for (const key of Object.keys(phase)) {
        if (!VALID_PHASE_KEYS.has(key)) {
          result.warnings.push(`${prefix}: unknown field '${key}'`);
        }
      }
    }

    // depends_on validation
    if (phase.depends_on && Array.isArray(phase.depends_on)) {
      for (const dep of phase.depends_on) {
        if (!phaseIds.has(dep)) {
          // Forward reference — warn, not error (could be defined later)
          result.warnings.push(`${prefix}: depends_on '${dep}' not yet defined (forward reference)`);
        }
      }
    }

    // Agents validation
    if (phase.agents && !Array.isArray(phase.agents)) {
      result.errors.push(`${prefix}: agents must be an array`);
      result.valid = false;
    }

    // timeout_minutes validation
    if (phase.timeout_minutes !== undefined && typeof phase.timeout_minutes !== 'number') {
      result.warnings.push(`${prefix}: timeout_minutes should be a number`);
    }
  }

  return result;
}

/**
 * Validate all workflow YAML files in a directory.
 *
 * @param {string} workflowDir - Directory containing workflow YAML files
 * @returns {Object.<string, {valid: boolean, errors: string[], warnings: string[]}>}
 */
function validateAllWorkflows(workflowDir) {
  const results = {};
  if (!fs.existsSync(workflowDir)) return results;

  const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const file of files) {
    results[file] = validateWorkflow(path.join(workflowDir, file));
  }
  return results;
}

module.exports = { validateWorkflow, validateAllWorkflows, VALID_PHASE_KEYS };
