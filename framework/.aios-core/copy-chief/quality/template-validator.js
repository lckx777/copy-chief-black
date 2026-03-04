var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var template_validator_exports = {};
__export(template_validator_exports, {
  HOME: () => HOME,
  REQUIRED_FIELDS: () => REQUIRED_FIELDS,
  TEMPLATES_DIR: () => TEMPLATES_DIR,
  VALID_DELIVERABLE_TYPES: () => VALID_DELIVERABLE_TYPES,
  VALID_PHASES: () => VALID_PHASES,
  VALID_TEMPLATE_TYPES: () => VALID_TEMPLATE_TYPES,
  VERSION_PATTERN: () => VERSION_PATTERN,
  extractFilePath: () => extractFilePath,
  formatIssues: () => formatIssues,
  getContentForValidation: () => getContentForValidation,
  isTemplateFile: () => isTemplateFile,
  parseFrontmatter: () => parseFrontmatter,
  runTemplateValidation: () => runTemplateValidation,
  validateFrontmatter: () => validateFrontmatter
});
module.exports = __toCommonJS(template_validator_exports);
var import_fs = require("fs");
var import_path = require("path");
const HOME = process.env.HOME || "";
const TEMPLATES_DIR = (0, import_path.join)(HOME, ".claude/templates");
const VALID_TEMPLATE_TYPES = [
  "production",
  "research",
  "methodology",
  "checklist",
  "agent-prompt",
  "story",
  "niche-pack"
];
const VALID_PHASES = [
  "idle",
  "research",
  "briefing",
  "production",
  "delivered",
  "any"
];
const VALID_DELIVERABLE_TYPES = [
  "vsl",
  "landing-page",
  "criativo",
  "email",
  "quiz",
  "checkout",
  "upsell",
  "downsell",
  "thankyou",
  "voc-extraction",
  "ads-spy",
  "trends-analysis",
  "briefing",
  "review",
  "other"
];
const REQUIRED_FIELDS = [
  "template_name",
  "template_version",
  "template_type",
  "description"
];
const VERSION_PATTERN = /^v?\d+\.\d+(\.\d+)?$|^\d{4}-\d{2}-\d{2}$/;
function extractFilePath(toolInput) {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field];
  }
  return null;
}
function isTemplateFile(filePath) {
  if (!filePath.endsWith(".md")) return false;
  const resolved = filePath.startsWith("/") ? filePath : (0, import_path.join)(process.cwd(), filePath);
  if (!resolved.startsWith(TEMPLATES_DIR)) return false;
  const rel = (0, import_path.relative)(TEMPLATES_DIR, resolved);
  if (rel === "CLAUDE.md") return false;
  return true;
}
function getContentForValidation(toolInput, filePath) {
  if (typeof toolInput.content === "string") {
    return toolInput.content;
  }
  if ((0, import_fs.existsSync)(filePath)) {
    try {
      return (0, import_fs.readFileSync)(filePath, "utf-8");
    } catch {
      return "";
    }
  }
  return "";
}
function parseFrontmatter(content) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) {
    return { found: false, fields: {}, raw: "" };
  }
  const secondDelimiter = trimmed.indexOf("---", 3);
  if (secondDelimiter < 0) {
    return { found: false, fields: {}, raw: "" };
  }
  const raw = trimmed.substring(3, secondDelimiter).trim();
  if (raw.length === 0) {
    return { found: false, fields: {}, raw: "" };
  }
  const fields = {};
  for (const line of raw.split("\n")) {
    const trimLine = line.trim();
    if (!trimLine || trimLine.startsWith("#")) continue;
    const colonIdx = trimLine.indexOf(":");
    if (colonIdx < 1) continue;
    const key = trimLine.substring(0, colonIdx).trim();
    let value = trimLine.substring(colonIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return { found: true, fields, raw };
}
function validateFrontmatter(fields) {
  const issues = [];
  for (const required of REQUIRED_FIELDS) {
    if (!fields[required] || fields[required].trim() === "") {
      issues.push({
        severity: "error",
        field: required,
        message: `Required field '${required}' is missing or empty`
      });
    }
  }
  if (fields.template_type) {
    const typeValue = fields.template_type.trim();
    if (!VALID_TEMPLATE_TYPES.includes(typeValue)) {
      issues.push({
        severity: "error",
        field: "template_type",
        message: `Invalid template_type '${typeValue}'. Valid: ${VALID_TEMPLATE_TYPES.join(", ")}`
      });
    }
  }
  if (fields.template_version) {
    const versionValue = fields.template_version.trim();
    if (!VERSION_PATTERN.test(versionValue)) {
      issues.push({
        severity: "warning",
        field: "template_version",
        message: `Version '${versionValue}' doesn't match semver (X.Y.Z) or date (YYYY-MM-DD) format`
      });
    }
  }
  if (fields.phase) {
    const phaseValue = fields.phase.trim();
    if (!VALID_PHASES.includes(phaseValue)) {
      issues.push({
        severity: "warning",
        field: "phase",
        message: `Invalid phase '${phaseValue}'. Valid: ${VALID_PHASES.join(", ")}`
      });
    }
  }
  if (fields.deliverable_type) {
    const dtValue = fields.deliverable_type.trim();
    if (!VALID_DELIVERABLE_TYPES.includes(dtValue)) {
      issues.push({
        severity: "warning",
        field: "deliverable_type",
        message: `Invalid deliverable_type '${dtValue}'. Valid: ${VALID_DELIVERABLE_TYPES.join(", ")}`
      });
    }
  }
  if (fields.description && fields.description.length > 200) {
    issues.push({
      severity: "warning",
      field: "description",
      message: `Description exceeds 200 chars (${fields.description.length}). Consider shortening.`
    });
  }
  return issues;
}
function formatIssues(issues, relPath) {
  const lines = [];
  lines.push(`\u26A0\uFE0F  Template Header Validation \u2014 ${relPath}`);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  if (errors.length > 0) {
    lines.push(`  \u274C Errors (${errors.length}):`);
    for (const err of errors) {
      lines.push(`     - [${err.field}] ${err.message}`);
    }
  }
  if (warnings.length > 0) {
    lines.push(`  \u26A0\uFE0F  Warnings (${warnings.length}):`);
    for (const warn of warnings) {
      lines.push(`     - [${warn.field}] ${warn.message}`);
    }
  }
  lines.push(`  \u{1F4A1} Schema: ~/.claude/schemas/template-header.schema.yaml`);
  return lines.join("\n");
}
function runTemplateValidation(input) {
  if (!["Write", "Edit"].includes(input.tool_name)) return null;
  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return null;
  if (!isTemplateFile(filePath)) return null;
  const relPath = (0, import_path.relative)(TEMPLATES_DIR, filePath.startsWith("/") ? filePath : (0, import_path.join)(process.cwd(), filePath));
  const content = getContentForValidation(input.tool_input, filePath);
  if (!content) {
    return {
      filePath,
      relPath,
      found: false,
      issues: [],
      warningMessage: [
        `\u26A0\uFE0F  Template Header Validation \u2014 ${relPath}`,
        `  \u274C No content available. New templates MUST include YAML frontmatter.`,
        `  \u{1F4A1} Schema: ~/.claude/schemas/template-header.schema.yaml`
      ].join("\n")
    };
  }
  const { found, fields } = parseFrontmatter(content);
  if (!found) {
    return {
      filePath,
      relPath,
      found: false,
      issues: [],
      warningMessage: [
        `\u26A0\uFE0F  Template Header Validation \u2014 ${relPath}`,
        `  \u274C No YAML frontmatter found. Templates MUST have frontmatter between --- delimiters.`,
        `  \u{1F4A1} Required fields: ${REQUIRED_FIELDS.join(", ")}`,
        `  \u{1F4A1} Schema: ~/.claude/schemas/template-header.schema.yaml`
      ].join("\n")
    };
  }
  const issues = validateFrontmatter(fields);
  return {
    filePath,
    relPath,
    found: true,
    issues,
    warningMessage: issues.length > 0 ? formatIssues(issues, relPath) : null
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HOME,
  REQUIRED_FIELDS,
  TEMPLATES_DIR,
  VALID_DELIVERABLE_TYPES,
  VALID_PHASES,
  VALID_TEMPLATE_TYPES,
  VERSION_PATTERN,
  extractFilePath,
  formatIssues,
  getContentForValidation,
  isTemplateFile,
  parseFrontmatter,
  runTemplateValidation,
  validateFrontmatter
});
