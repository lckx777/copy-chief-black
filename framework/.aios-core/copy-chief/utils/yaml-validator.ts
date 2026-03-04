// hooks/lib/yaml-validator.ts — Port of aios-core yaml-validator.js
// Adapted for Copy Chief BLACK: YAML types helix-state, mecanismo-unico, project-state
// Original: AIOS/aios-core/.aios-core/core/utils/yaml-validator.js
//
// Uses js-yaml for parsing (same dependency as config-resolver.ts).
// Manual field checking — no Ajv (too heavy for hook context).
//
// Usage:
//   import { YAMLValidator, validateYAML } from './yaml-validator';
//   const result = await validateYAML(content, 'helix-state');
//   const validator = new YAMLValidator();
//   const report = await validator.validateFile(filePath, 'mecanismo-unico');

import { readFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationError {
  type: 'parse_error' | 'file_error' | 'missing_required' | 'invalid_type' | 'circular_reference';
  field?: string;
  message: string;
  line?: number | null;
  column?: number | null;
}

export interface ValidationWarning {
  type: 'yaml_warning' | 'unknown_field' | 'null_value' | 'empty_icon' | 'deep_nesting';
  field?: string;
  depth?: number;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed: unknown;
  filePath?: string;
}

export type YAMLType = 'helix-state' | 'mecanismo-unico' | 'project-state' | 'general';

interface FieldRules {
  required: string[];
  optional: string[];
  structure?: Record<string, { required: string[]; optional: string[] }>;
}

// ─── Copy Chief BLACK Validation Rules ──────────────────────────────────────
//
// Adapted from aios-core validation rules (agent/manifest/workflow)
// to Copy Chief YAML types.

const VALIDATION_RULES: Record<string, FieldRules> = {
  'helix-state': {
    required: ['offer', 'phase', 'gates', 'tools_by_phase'],
    optional: ['niche', 'status', 'updated_at', 'helix_phases', 'mecanismo_state', 'config'],
    structure: {
      gates: {
        required: [],
        optional: ['research', 'briefing', 'production', 'review'],
      },
      tools_by_phase: {
        required: [],
        optional: ['research', 'briefing', 'production'],
      },
    },
  },
  'mecanismo-unico': {
    required: ['state', 'mup', 'mus', 'gimmick_name'],
    optional: [
      'sexy_cause', 'origin_story', 'authority_hook', 'paradigm_shift',
      'one_belief', 'promise', 'rmbc_scores', 'validation_scores',
      'created_at', 'updated_at', 'offer',
    ],
    structure: {
      mup: {
        required: ['statement'],
        optional: ['name', 'nova_causa', 'problema_fundamental', 'why_failed'],
      },
      mus: {
        required: ['statement'],
        optional: ['ingrediente_hero', 'formula', 'proof'],
      },
    },
  },
  'project-state': {
    required: ['offer', 'niche', 'status'],
    optional: [
      'sub_niche', 'ticket', 'funnel', 'expert', 'avatar',
      'mup', 'mus', 'phase', 'quality_gates', 'updated_at', 'created_at',
    ],
    structure: {
      quality_gates: {
        required: [],
        optional: ['research', 'briefing', 'production', 'review'],
      },
    },
  },
};

// ─── YAMLValidator ───────────────────────────────────────────────────────────

export class YAMLValidator {
  private readonly validationRules: Record<string, FieldRules>;

  constructor() {
    this.validationRules = VALIDATION_RULES;
  }

  /**
   * Validate YAML content string.
   *
   * @param content - Raw YAML string
   * @param type - Copy Chief YAML type (helix-state, mecanismo-unico, project-state, general)
   */
  async validate(content: string, type: YAMLType = 'general'): Promise<ValidationResult> {
    const results: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      parsed: null,
    };

    try {
      results.parsed = yaml.load(content, {
        schema: yaml.SAFE_SCHEMA,
        onWarning: (warning: yaml.YAMLException) => {
          results.warnings.push({
            type: 'yaml_warning',
            message: warning.toString(),
          });
        },
      });

      // Type-specific validation
      if (type !== 'general' && this.validationRules[type]) {
        this.validateStructure(results.parsed as Record<string, unknown>, type, results);
      }

      // General validations (circular refs, depth)
      this.validateGeneral(results.parsed, results);

    } catch (error: unknown) {
      results.valid = false;
      const yamlError = error as yaml.YAMLException & { mark?: { line: number; column: number } };
      results.errors.push({
        type: 'parse_error',
        message: (error as Error).message,
        line: yamlError.mark ? yamlError.mark.line : null,
        column: yamlError.mark ? yamlError.mark.column : null,
      });
    }

    return results;
  }

  /**
   * Validate a YAML file from disk.
   *
   * @param filePath - Absolute path to YAML file
   * @param type - Copy Chief YAML type
   */
  async validateFile(filePath: string, type: YAMLType = 'general'): Promise<ValidationResult> {
    try {
      if (!existsSync(filePath)) {
        return {
          valid: false,
          filePath,
          errors: [{
            type: 'file_error',
            message: `File not found: ${filePath}`,
          }],
          warnings: [],
          parsed: null,
        };
      }

      const content = readFileSync(filePath, 'utf-8');
      const results = await this.validate(content, type);
      results.filePath = filePath;
      return results;

    } catch (error: unknown) {
      return {
        valid: false,
        filePath,
        errors: [{
          type: 'file_error',
          message: `Could not read file: ${(error as Error).message}`,
        }],
        warnings: [],
        parsed: null,
      };
    }
  }

  /**
   * Validate structure based on Copy Chief YAML type rules.
   */
  validateStructure(
    data: Record<string, unknown>,
    type: string,
    results: ValidationResult,
  ): void {
    if (!data || typeof data !== 'object') {
      results.valid = false;
      results.errors.push({
        type: 'invalid_type',
        message: `Expected an object at root level, got ${typeof data}`,
      });
      return;
    }

    const rules = this.validationRules[type];
    if (!rules) return;

    // Check required top-level fields
    for (const field of rules.required) {
      if (!Object.prototype.hasOwnProperty.call(data, field)) {
        results.valid = false;
        results.errors.push({
          type: 'missing_required',
          field,
          message: `Missing required field: ${field}`,
        });
      }
    }

    // Validate structure of nested fields
    if (rules.structure) {
      for (const [field, fieldRules] of Object.entries(rules.structure)) {
        if (data[field] && typeof data[field] === 'object') {
          this.validateFieldStructure(
            data[field] as Record<string, unknown>,
            field,
            fieldRules,
            results,
          );
        }
      }
    }

    // Warn about unknown fields
    const allKnownFields = [...(rules.required || []), ...(rules.optional || [])];
    for (const field of Object.keys(data)) {
      if (!allKnownFields.includes(field)) {
        results.warnings.push({
          type: 'unknown_field',
          field,
          message: `Unknown field: ${field}`,
        });
      }
    }
  }

  /**
   * Validate nested field structure (e.g. mup.statement, mus.statement).
   */
  validateFieldStructure(
    data: Record<string, unknown>,
    fieldName: string,
    rules: { required: string[]; optional: string[] },
    results: ValidationResult,
  ): void {
    for (const subfield of rules.required || []) {
      if (!Object.prototype.hasOwnProperty.call(data, subfield)) {
        results.valid = false;
        results.errors.push({
          type: 'missing_required',
          field: `${fieldName}.${subfield}`,
          message: `Missing required field: ${fieldName}.${subfield}`,
        });
      }
    }

    // Type checks for known semantic fields
    this.validateFieldTypes(data, fieldName, results);
  }

  /**
   * Validate field types (id/name must be non-empty strings, etc.).
   */
  validateFieldTypes(
    data: Record<string, unknown>,
    fieldName: string,
    results: ValidationResult,
  ): void {
    for (const [key, value] of Object.entries(data)) {
      const fullPath = `${fieldName}.${key}`;

      if (value === null || value === undefined) {
        results.warnings.push({
          type: 'null_value',
          field: fullPath,
          message: `Null or undefined value at ${fullPath}`,
        });
      }

      // id and name must be non-empty strings
      if (key === 'id' || key === 'name' || key === 'offer') {
        if (typeof value !== 'string' || value.trim() === '') {
          results.errors.push({
            type: 'invalid_type',
            field: fullPath,
            message: `${fullPath} must be a non-empty string`,
          });
          results.valid = false;
        }
      }

      // state must be a known value for mecanismo-unico
      if (key === 'state' && fieldName === '') {
        const validStates = ['DRAFT', 'VALIDATED', 'APPROVED', 'REJECTED'];
        if (typeof value === 'string' && !validStates.includes(value)) {
          results.warnings.push({
            type: 'unknown_field',
            field: fullPath,
            message: `Unexpected state value: ${value}. Expected one of: ${validStates.join(', ')}`,
          });
        }
      }
    }
  }

  /**
   * General validations for all YAML types:
   * - Circular reference detection
   * - Excessive nesting depth check (warn at >10)
   */
  validateGeneral(data: unknown, results: ValidationResult): void {
    // Circular reference check
    try {
      JSON.stringify(data);
    } catch (error: unknown) {
      if ((error as Error).message?.includes('circular')) {
        results.valid = false;
        results.errors.push({
          type: 'circular_reference',
          message: 'Circular reference detected in YAML structure',
        });
      }
    }

    // Depth check
    const maxDepth = this.getMaxDepth(data);
    if (maxDepth > 10) {
      results.warnings.push({
        type: 'deep_nesting',
        depth: maxDepth,
        message: `Deep nesting detected (${maxDepth} levels)`,
      });
    }
  }

  /**
   * Recursively compute maximum nesting depth.
   */
  getMaxDepth(obj: unknown, currentDepth = 0): number {
    if (typeof obj !== 'object' || obj === null) return currentDepth;

    let maxDepth = currentDepth;
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (typeof value === 'object' && value !== null) {
        const depth = this.getMaxDepth(value, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  /**
   * Auto-fix common YAML issues (indentation, quotes).
   * Returns fixed content + validation result of the fixed version.
   */
  async autoFix(
    content: string,
    type: YAMLType = 'general',
  ): Promise<{ content: string; validation: ValidationResult; changed: boolean }> {
    let fixed = content;

    fixed = this.fixIndentation(fixed);
    fixed = this.fixQuotes(fixed);

    const validation = await this.validate(fixed, type);

    return {
      content: fixed,
      validation,
      changed: content !== fixed,
    };
  }

  /**
   * Fix YAML indentation issues.
   * Normalizes mixed indentation to 2-space consistent indentation.
   */
  fixIndentation(content: string): string {
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    const indentStack = [0];
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Preserve empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        fixedLines.push(line);
        continue;
      }

      // Handle list items
      if (trimmed.startsWith('-')) {
        const baseIndent = indentStack[indentStack.length - 1];
        fixedLines.push(' '.repeat(baseIndent) + trimmed);

        if (trimmed.includes(':') && !trimmed.endsWith(':')) {
          const afterDash = trimmed.substring(1).trim();
          if (afterDash.includes(':')) {
            currentLevel = baseIndent + 2;
          }
        }
      } else if (trimmed.includes(':')) {
        // Pop stack until we find the right indent level
        const lineIndent = line.length - line.trimStart().length;
        while (
          indentStack.length > 1 &&
          lineIndent < indentStack[indentStack.length - 1]
        ) {
          indentStack.pop();
        }

        currentLevel = indentStack[indentStack.length - 1];
        fixedLines.push(' '.repeat(currentLevel) + trimmed);

        // If this opens a new block, push new indent level
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        if (trimmed.endsWith(':') || (nextLine.trim() && nextIndent > currentLevel)) {
          indentStack.push(currentLevel + 2);
        }
      } else {
        fixedLines.push(' '.repeat(currentLevel) + trimmed);
      }
    }

    return fixedLines.join('\n');
  }

  /**
   * Fix YAML strings that contain special characters without quotes.
   */
  fixQuotes(content: string): string {
    return content.replace(
      /^(\s*\w+):\s*([^"'\n]*[:{}|>&*!%@`][^"'\n]*)$/gm,
      '$1: "$2"',
    );
  }

  /**
   * Generate a human-readable validation report string.
   */
  generateReport(validation: ValidationResult): string {
    const report: string[] = [];

    report.push('YAML Validation Report');
    report.push('=====================');
    report.push(`Valid: ${validation.valid ? 'Yes' : 'No'}`);

    if (validation.filePath) {
      report.push(`File: ${validation.filePath}`);
    }

    if (validation.errors.length > 0) {
      report.push(`\nErrors (${validation.errors.length}):`);
      for (const error of validation.errors) {
        report.push(`  - ${error.message}`);
        if (error.line != null) {
          report.push(`    Line: ${error.line}, Column: ${error.column}`);
        }
      }
    }

    if (validation.warnings.length > 0) {
      report.push(`\nWarnings (${validation.warnings.length}):`);
      for (const warning of validation.warnings) {
        report.push(`  - ${warning.message}`);
      }
    }

    if (validation.valid && validation.errors.length === 0) {
      report.push('\nNo issues found.');
    }

    return report.join('\n');
  }
}

// ─── Convenience Function ─────────────────────────────────────────────────────

/**
 * Quick YAML validation — convenience wrapper around YAMLValidator.validate().
 *
 * @param content - Raw YAML string to validate
 * @param type - Copy Chief YAML type (helix-state, mecanismo-unico, project-state, general)
 * @returns { valid, error, errors, warnings }
 */
export async function validateYAML(
  content: string,
  type: YAMLType = 'general',
): Promise<{ valid: boolean; error: string | null; errors: ValidationError[]; warnings: ValidationWarning[] }> {
  const validator = new YAMLValidator();
  const result = await validator.validate(content, type);
  return {
    valid: result.valid,
    error: result.errors.length > 0 ? result.errors[0].message : null,
    errors: result.errors,
    warnings: result.warnings,
  };
}
