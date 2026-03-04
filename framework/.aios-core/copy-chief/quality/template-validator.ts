/**
 * template-validator.ts — Copy Chief Quality Module
 * Part of AIOS Core: copy-chief/quality
 *
 * Validates YAML frontmatter on template files before Write/Edit operations.
 * Checks:
 * 1. Frontmatter block exists (between --- delimiters)
 * 2. All 4 required fields present: template_name, template_version, template_type, description
 * 3. template_type is a valid enum value
 * 4. template_version matches semver or date pattern
 * 5. phase (if present) is a valid enum value
 * 6. deliverable_type (if present) is a valid enum value
 *
 * Warn-only: never blocks. Reports issues via stderr.
 * Target: ~/.claude/templates/**\/*.md files only.
 *
 * Created: 2026-02-28 (Sprint S21.3)
 * Refactored: 2026-03-02 (AIOS Core module extraction)
 */

import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";

// ─── Constants ───────────────────────────────────────────────────────────────

export const HOME = process.env.HOME || "";
export const TEMPLATES_DIR = join(HOME, ".claude/templates");

export const VALID_TEMPLATE_TYPES = [
  "production",
  "research",
  "methodology",
  "checklist",
  "agent-prompt",
  "story",
  "niche-pack",
] as const;

export const VALID_PHASES = [
  "idle",
  "research",
  "briefing",
  "production",
  "delivered",
  "any",
] as const;

export const VALID_DELIVERABLE_TYPES = [
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
  "other",
] as const;

export const REQUIRED_FIELDS = [
  "template_name",
  "template_version",
  "template_type",
  "description",
] as const;

export const VERSION_PATTERN = /^v?\d+\.\d+(\.\d+)?$|^\d{4}-\d{2}-\d{2}$/;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateValidatorInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

export interface TemplateValidationOutput {
  filePath: string;
  relPath: string;
  found: boolean;
  issues: ValidationIssue[];
  warningMessage: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field] as string;
  }
  return null;
}

export function isTemplateFile(filePath: string): boolean {
  if (!filePath.endsWith(".md")) return false;
  const resolved = filePath.startsWith("/") ? filePath : join(process.cwd(), filePath);
  if (!resolved.startsWith(TEMPLATES_DIR)) return false;
  const rel = relative(TEMPLATES_DIR, resolved);
  if (rel === "CLAUDE.md") return false;
  return true;
}

export function getContentForValidation(toolInput: Record<string, unknown>, filePath: string): string {
  if (typeof toolInput.content === "string") {
    return toolInput.content;
  }
  if (existsSync(filePath)) {
    try {
      return readFileSync(filePath, "utf-8");
    } catch {
      return "";
    }
  }
  return "";
}

export function parseFrontmatter(content: string): { found: boolean; fields: Record<string, string>; raw: string } {
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

  const fields: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimLine = line.trim();
    if (!trimLine || trimLine.startsWith("#")) continue;
    const colonIdx = trimLine.indexOf(":");
    if (colonIdx < 1) continue;
    const key = trimLine.substring(0, colonIdx).trim();
    let value = trimLine.substring(colonIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return { found: true, fields, raw };
}

export function validateFrontmatter(fields: Record<string, string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const required of REQUIRED_FIELDS) {
    if (!fields[required] || fields[required].trim() === "") {
      issues.push({
        severity: "error",
        field: required,
        message: `Required field '${required}' is missing or empty`,
      });
    }
  }

  if (fields.template_type) {
    const typeValue = fields.template_type.trim();
    if (!(VALID_TEMPLATE_TYPES as readonly string[]).includes(typeValue)) {
      issues.push({
        severity: "error",
        field: "template_type",
        message: `Invalid template_type '${typeValue}'. Valid: ${VALID_TEMPLATE_TYPES.join(", ")}`,
      });
    }
  }

  if (fields.template_version) {
    const versionValue = fields.template_version.trim();
    if (!VERSION_PATTERN.test(versionValue)) {
      issues.push({
        severity: "warning",
        field: "template_version",
        message: `Version '${versionValue}' doesn't match semver (X.Y.Z) or date (YYYY-MM-DD) format`,
      });
    }
  }

  if (fields.phase) {
    const phaseValue = fields.phase.trim();
    if (!(VALID_PHASES as readonly string[]).includes(phaseValue)) {
      issues.push({
        severity: "warning",
        field: "phase",
        message: `Invalid phase '${phaseValue}'. Valid: ${VALID_PHASES.join(", ")}`,
      });
    }
  }

  if (fields.deliverable_type) {
    const dtValue = fields.deliverable_type.trim();
    if (!(VALID_DELIVERABLE_TYPES as readonly string[]).includes(dtValue)) {
      issues.push({
        severity: "warning",
        field: "deliverable_type",
        message: `Invalid deliverable_type '${dtValue}'. Valid: ${VALID_DELIVERABLE_TYPES.join(", ")}`,
      });
    }
  }

  if (fields.description && fields.description.length > 200) {
    issues.push({
      severity: "warning",
      field: "description",
      message: `Description exceeds 200 chars (${fields.description.length}). Consider shortening.`,
    });
  }

  return issues;
}

export function formatIssues(issues: ValidationIssue[], relPath: string): string {
  const lines: string[] = [];
  lines.push(`⚠️  Template Header Validation — ${relPath}`);

  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");

  if (errors.length > 0) {
    lines.push(`  ❌ Errors (${errors.length}):`);
    for (const err of errors) {
      lines.push(`     - [${err.field}] ${err.message}`);
    }
  }

  if (warnings.length > 0) {
    lines.push(`  ⚠️  Warnings (${warnings.length}):`);
    for (const warn of warnings) {
      lines.push(`     - [${warn.field}] ${warn.message}`);
    }
  }

  lines.push(`  💡 Schema: ~/.claude/schemas/template-header.schema.yaml`);
  return lines.join("\n");
}

// ─── Main exported function ───────────────────────────────────────────────────

export function runTemplateValidation(input: TemplateValidatorInput): TemplateValidationOutput | null {
  if (!["Write", "Edit"].includes(input.tool_name)) return null;

  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return null;

  if (!isTemplateFile(filePath)) return null;

  const relPath = relative(TEMPLATES_DIR, filePath.startsWith("/") ? filePath : join(process.cwd(), filePath));
  const content = getContentForValidation(input.tool_input, filePath);

  if (!content) {
    return {
      filePath,
      relPath,
      found: false,
      issues: [],
      warningMessage: [
        `⚠️  Template Header Validation — ${relPath}`,
        `  ❌ No content available. New templates MUST include YAML frontmatter.`,
        `  💡 Schema: ~/.claude/schemas/template-header.schema.yaml`,
      ].join("\n"),
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
        `⚠️  Template Header Validation — ${relPath}`,
        `  ❌ No YAML frontmatter found. Templates MUST have frontmatter between --- delimiters.`,
        `  💡 Required fields: ${REQUIRED_FIELDS.join(", ")}`,
        `  💡 Schema: ~/.claude/schemas/template-header.schema.yaml`,
      ].join("\n"),
    };
  }

  const issues = validateFrontmatter(fields);

  return {
    filePath,
    relPath,
    found: true,
    issues,
    warningMessage: issues.length > 0 ? formatIssues(issues, relPath) : null,
  };
}
