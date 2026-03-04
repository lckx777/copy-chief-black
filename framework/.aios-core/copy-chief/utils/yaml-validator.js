var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var yaml_validator_exports = {};
__export(yaml_validator_exports, {
  YAMLValidator: () => YAMLValidator,
  validateYAML: () => validateYAML
});
module.exports = __toCommonJS(yaml_validator_exports);
var import_fs = require("fs");
var import_js_yaml = __toESM(require("js-yaml"));
const VALIDATION_RULES = {
  "helix-state": {
    required: ["offer", "phase", "gates", "tools_by_phase"],
    optional: ["niche", "status", "updated_at", "helix_phases", "mecanismo_state", "config"],
    structure: {
      gates: {
        required: [],
        optional: ["research", "briefing", "production", "review"]
      },
      tools_by_phase: {
        required: [],
        optional: ["research", "briefing", "production"]
      }
    }
  },
  "mecanismo-unico": {
    required: ["state", "mup", "mus", "gimmick_name"],
    optional: [
      "sexy_cause",
      "origin_story",
      "authority_hook",
      "paradigm_shift",
      "one_belief",
      "promise",
      "rmbc_scores",
      "validation_scores",
      "created_at",
      "updated_at",
      "offer"
    ],
    structure: {
      mup: {
        required: ["statement"],
        optional: ["name", "nova_causa", "problema_fundamental", "why_failed"]
      },
      mus: {
        required: ["statement"],
        optional: ["ingrediente_hero", "formula", "proof"]
      }
    }
  },
  "project-state": {
    required: ["offer", "niche", "status"],
    optional: [
      "sub_niche",
      "ticket",
      "funnel",
      "expert",
      "avatar",
      "mup",
      "mus",
      "phase",
      "quality_gates",
      "updated_at",
      "created_at"
    ],
    structure: {
      quality_gates: {
        required: [],
        optional: ["research", "briefing", "production", "review"]
      }
    }
  }
};
class YAMLValidator {
  validationRules;
  constructor() {
    this.validationRules = VALIDATION_RULES;
  }
  /**
   * Validate YAML content string.
   *
   * @param content - Raw YAML string
   * @param type - Copy Chief YAML type (helix-state, mecanismo-unico, project-state, general)
   */
  async validate(content, type = "general") {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      parsed: null
    };
    try {
      results.parsed = import_js_yaml.default.load(content, {
        schema: import_js_yaml.default.SAFE_SCHEMA,
        onWarning: (warning) => {
          results.warnings.push({
            type: "yaml_warning",
            message: warning.toString()
          });
        }
      });
      if (type !== "general" && this.validationRules[type]) {
        this.validateStructure(results.parsed, type, results);
      }
      this.validateGeneral(results.parsed, results);
    } catch (error) {
      results.valid = false;
      const yamlError = error;
      results.errors.push({
        type: "parse_error",
        message: error.message,
        line: yamlError.mark ? yamlError.mark.line : null,
        column: yamlError.mark ? yamlError.mark.column : null
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
  async validateFile(filePath, type = "general") {
    try {
      if (!(0, import_fs.existsSync)(filePath)) {
        return {
          valid: false,
          filePath,
          errors: [{
            type: "file_error",
            message: `File not found: ${filePath}`
          }],
          warnings: [],
          parsed: null
        };
      }
      const content = (0, import_fs.readFileSync)(filePath, "utf-8");
      const results = await this.validate(content, type);
      results.filePath = filePath;
      return results;
    } catch (error) {
      return {
        valid: false,
        filePath,
        errors: [{
          type: "file_error",
          message: `Could not read file: ${error.message}`
        }],
        warnings: [],
        parsed: null
      };
    }
  }
  /**
   * Validate structure based on Copy Chief YAML type rules.
   */
  validateStructure(data, type, results) {
    if (!data || typeof data !== "object") {
      results.valid = false;
      results.errors.push({
        type: "invalid_type",
        message: `Expected an object at root level, got ${typeof data}`
      });
      return;
    }
    const rules = this.validationRules[type];
    if (!rules) return;
    for (const field of rules.required) {
      if (!Object.prototype.hasOwnProperty.call(data, field)) {
        results.valid = false;
        results.errors.push({
          type: "missing_required",
          field,
          message: `Missing required field: ${field}`
        });
      }
    }
    if (rules.structure) {
      for (const [field, fieldRules] of Object.entries(rules.structure)) {
        if (data[field] && typeof data[field] === "object") {
          this.validateFieldStructure(
            data[field],
            field,
            fieldRules,
            results
          );
        }
      }
    }
    const allKnownFields = [...rules.required || [], ...rules.optional || []];
    for (const field of Object.keys(data)) {
      if (!allKnownFields.includes(field)) {
        results.warnings.push({
          type: "unknown_field",
          field,
          message: `Unknown field: ${field}`
        });
      }
    }
  }
  /**
   * Validate nested field structure (e.g. mup.statement, mus.statement).
   */
  validateFieldStructure(data, fieldName, rules, results) {
    for (const subfield of rules.required || []) {
      if (!Object.prototype.hasOwnProperty.call(data, subfield)) {
        results.valid = false;
        results.errors.push({
          type: "missing_required",
          field: `${fieldName}.${subfield}`,
          message: `Missing required field: ${fieldName}.${subfield}`
        });
      }
    }
    this.validateFieldTypes(data, fieldName, results);
  }
  /**
   * Validate field types (id/name must be non-empty strings, etc.).
   */
  validateFieldTypes(data, fieldName, results) {
    for (const [key, value] of Object.entries(data)) {
      const fullPath = `${fieldName}.${key}`;
      if (value === null || value === void 0) {
        results.warnings.push({
          type: "null_value",
          field: fullPath,
          message: `Null or undefined value at ${fullPath}`
        });
      }
      if (key === "id" || key === "name" || key === "offer") {
        if (typeof value !== "string" || value.trim() === "") {
          results.errors.push({
            type: "invalid_type",
            field: fullPath,
            message: `${fullPath} must be a non-empty string`
          });
          results.valid = false;
        }
      }
      if (key === "state" && fieldName === "") {
        const validStates = ["DRAFT", "VALIDATED", "APPROVED", "REJECTED"];
        if (typeof value === "string" && !validStates.includes(value)) {
          results.warnings.push({
            type: "unknown_field",
            field: fullPath,
            message: `Unexpected state value: ${value}. Expected one of: ${validStates.join(", ")}`
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
  validateGeneral(data, results) {
    try {
      JSON.stringify(data);
    } catch (error) {
      if (error.message?.includes("circular")) {
        results.valid = false;
        results.errors.push({
          type: "circular_reference",
          message: "Circular reference detected in YAML structure"
        });
      }
    }
    const maxDepth = this.getMaxDepth(data);
    if (maxDepth > 10) {
      results.warnings.push({
        type: "deep_nesting",
        depth: maxDepth,
        message: `Deep nesting detected (${maxDepth} levels)`
      });
    }
  }
  /**
   * Recursively compute maximum nesting depth.
   */
  getMaxDepth(obj, currentDepth = 0) {
    if (typeof obj !== "object" || obj === null) return currentDepth;
    let maxDepth = currentDepth;
    for (const value of Object.values(obj)) {
      if (typeof value === "object" && value !== null) {
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
  async autoFix(content, type = "general") {
    let fixed = content;
    fixed = this.fixIndentation(fixed);
    fixed = this.fixQuotes(fixed);
    const validation = await this.validate(fixed, type);
    return {
      content: fixed,
      validation,
      changed: content !== fixed
    };
  }
  /**
   * Fix YAML indentation issues.
   * Normalizes mixed indentation to 2-space consistent indentation.
   */
  fixIndentation(content) {
    const lines = content.split("\n");
    const fixedLines = [];
    const indentStack = [0];
    let currentLevel = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        fixedLines.push(line);
        continue;
      }
      if (trimmed.startsWith("-")) {
        const baseIndent = indentStack[indentStack.length - 1];
        fixedLines.push(" ".repeat(baseIndent) + trimmed);
        if (trimmed.includes(":") && !trimmed.endsWith(":")) {
          const afterDash = trimmed.substring(1).trim();
          if (afterDash.includes(":")) {
            currentLevel = baseIndent + 2;
          }
        }
      } else if (trimmed.includes(":")) {
        const lineIndent = line.length - line.trimStart().length;
        while (indentStack.length > 1 && lineIndent < indentStack[indentStack.length - 1]) {
          indentStack.pop();
        }
        currentLevel = indentStack[indentStack.length - 1];
        fixedLines.push(" ".repeat(currentLevel) + trimmed);
        const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        if (trimmed.endsWith(":") || nextLine.trim() && nextIndent > currentLevel) {
          indentStack.push(currentLevel + 2);
        }
      } else {
        fixedLines.push(" ".repeat(currentLevel) + trimmed);
      }
    }
    return fixedLines.join("\n");
  }
  /**
   * Fix YAML strings that contain special characters without quotes.
   */
  fixQuotes(content) {
    return content.replace(
      /^(\s*\w+):\s*([^"'\n]*[:{}|>&*!%@`][^"'\n]*)$/gm,
      '$1: "$2"'
    );
  }
  /**
   * Generate a human-readable validation report string.
   */
  generateReport(validation) {
    const report = [];
    report.push("YAML Validation Report");
    report.push("=====================");
    report.push(`Valid: ${validation.valid ? "Yes" : "No"}`);
    if (validation.filePath) {
      report.push(`File: ${validation.filePath}`);
    }
    if (validation.errors.length > 0) {
      report.push(`
Errors (${validation.errors.length}):`);
      for (const error of validation.errors) {
        report.push(`  - ${error.message}`);
        if (error.line != null) {
          report.push(`    Line: ${error.line}, Column: ${error.column}`);
        }
      }
    }
    if (validation.warnings.length > 0) {
      report.push(`
Warnings (${validation.warnings.length}):`);
      for (const warning of validation.warnings) {
        report.push(`  - ${warning.message}`);
      }
    }
    if (validation.valid && validation.errors.length === 0) {
      report.push("\nNo issues found.");
    }
    return report.join("\n");
  }
}
async function validateYAML(content, type = "general") {
  const validator = new YAMLValidator();
  const result = await validator.validate(content, type);
  return {
    valid: result.valid,
    error: result.errors.length > 0 ? result.errors[0].message : null,
    errors: result.errors,
    warnings: result.warnings
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  YAMLValidator,
  validateYAML
});
