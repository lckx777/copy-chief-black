'use strict';

/**
 * Deliverable Assignment — Production Delegation Enforcement
 * Equivalent AIOS: executor-assignment.js
 *
 * Deterministic (zero LLM) mapping: path → persona obrigatoria.
 * Orchestrador NUNCA faz work direto em production/.
 *
 * @module deliverable-assignment
 * @version 1.0.0
 */

const path = require('path');

// ─── Assignment Table ────────────────────────────────────────────────────────

const DELIVERABLE_ASSIGNMENT_TABLE = {
  creatives:      { persona: 'scout',  model: 'sonnet', quality_gate: 'hawk' },
  vsl:            { persona: 'echo',   model: 'opus',   quality_gate: 'hawk' },
  'landing-page': { persona: 'forge',  model: 'sonnet', quality_gate: 'hawk' },
  emails:         { persona: 'blade',  model: 'sonnet', quality_gate: 'hawk' },
};

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Extract deliverable type from a file path.
 * Matches production/{type}/ anywhere in the path.
 *
 * @param {string} filePath - Absolute or relative file path
 * @returns {string|null} Deliverable type or null if not a production path
 */
function getDeliverableType(filePath) {
  if (!filePath || typeof filePath !== 'string') return null;

  // Normalize to forward slashes
  const normalized = filePath.replace(/\\/g, '/');

  // Match production/{type}/ pattern
  const match = normalized.match(/production\/([a-z-]+)(?:\/|$)/i);
  if (!match) return null;

  const type = match[1].toLowerCase();

  // Only return known deliverable types
  return DELIVERABLE_ASSIGNMENT_TABLE[type] ? type : null;
}

/**
 * Get the required persona assignment for a production file path.
 *
 * @param {string} filePath - Absolute or relative file path
 * @returns {{ persona: string, model: string, quality_gate: string }|null}
 */
function assignPersonaFromPath(filePath) {
  const type = getDeliverableType(filePath);
  if (!type) return null;

  return { ...DELIVERABLE_ASSIGNMENT_TABLE[type] };
}

/**
 * Validate that a persona is the correct assignee for a deliverable type.
 *
 * @param {string} persona - Agent ID (e.g. 'scout', 'echo')
 * @param {string} deliverableType - Type from getDeliverableType()
 * @returns {boolean}
 */
function validateAssignment(persona, deliverableType) {
  if (!persona || !deliverableType) return false;

  const entry = DELIVERABLE_ASSIGNMENT_TABLE[deliverableType];
  if (!entry) return false;

  return entry.persona === persona.toLowerCase();
}

module.exports = {
  DELIVERABLE_ASSIGNMENT_TABLE,
  getDeliverableType,
  assignPersonaFromPath,
  validateAssignment,
};
