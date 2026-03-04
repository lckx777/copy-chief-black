'use strict';

/**
 * Frontmatter Validator (U-06)
 *
 * Validates required fields in a parsed agent frontmatter object.
 * Non-blocking: returns an array of warning strings.
 * Empty array means the frontmatter is valid.
 */

/** Required field descriptors: { path, label, type } */
const REQUIRED_FIELDS = [
  { path: ['agent', 'id'],     label: 'agent.id',     type: 'string' },
  { path: ['agent', 'name'],   label: 'agent.name',   type: 'string' },
  { path: ['persona', 'role'], label: 'persona.role', type: 'string' },
  { path: ['persona', 'style'],label: 'persona.style', type: 'string' },
];

/**
 * Safely get a nested value from an object given an array of keys.
 * Returns undefined if any key in the path is missing.
 */
function _getNestedValue(obj, keys) {
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * validate(frontmatter, filename)
 *
 * Validates the parsed frontmatter object against required fields.
 *
 * @param {Object} frontmatter - Parsed YAML frontmatter object (or null/undefined).
 * @param {string} filename    - Agent filename (used in warning messages).
 * @returns {string[]}         - Array of warning strings. Empty = valid.
 */
function validate(frontmatter, filename) {
  const warnings = [];

  if (!frontmatter || typeof frontmatter !== 'object') {
    warnings.push(
      `[${filename}] Frontmatter is missing or not a valid object. ` +
      `Required fields: ${REQUIRED_FIELDS.map((f) => f.label).join(', ')}.`
    );
    return warnings;
  }

  for (const field of REQUIRED_FIELDS) {
    const value = _getNestedValue(frontmatter, field.path);

    if (value === undefined || value === null) {
      warnings.push(
        `[${filename}] Missing required frontmatter field: ${field.label}`
      );
      continue;
    }

    if (field.type === 'string' && typeof value !== 'string') {
      warnings.push(
        `[${filename}] Frontmatter field ${field.label} must be a string, got ${typeof value}`
      );
      continue;
    }

    if (field.type === 'string' && value.trim() === '') {
      warnings.push(
        `[${filename}] Frontmatter field ${field.label} must not be empty`
      );
    }
  }

  return warnings;
}

module.exports = { validate };
