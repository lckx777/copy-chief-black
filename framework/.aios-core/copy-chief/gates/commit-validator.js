#!/usr/bin/env node
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
var commit_validator_exports = {};
__export(commit_validator_exports, {
  detectOfferFromFiles: () => detectOfferFromFiles,
  getStagedFiles: () => getStagedFiles,
  hasProtectedFiles: () => hasProtectedFiles,
  isGitCommitCommand: () => isGitCommitCommand,
  processHookEvent: () => processHookEvent,
  runHealthCheck: () => runHealthCheck,
  validateGatesForOffer: () => validateGatesForOffer,
  validateMecanismo: () => validateMecanismo
});
module.exports = __toCommonJS(commit_validator_exports);
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
var import_config_loader = require("../config/config-loader");
const HOME = (0, import_os.homedir)();
const HEALTH_CHECK = (0, import_path.join)(HOME, ".claude/scripts/health-check.ts");
const ECOSYSTEM_DIR = (0, import_path.join)(HOME, "copywriting-ecosystem");
let PROTECTED_PATHS = ["production/"];
try {
  if ((0, import_config_loader.isCommitValidationEnabled)()) {
    PROTECTED_PATHS = (0, import_config_loader.getProtectedPaths)();
  }
} catch {
}
function isGitCommitCommand(command) {
  const trimmed = command.trim();
  return /\bgit\s+commit\b/.test(trimmed);
}
function getStagedFiles() {
  try {
    const output = (0, import_child_process.execSync)("git diff --cached --name-only", {
      cwd: ECOSYSTEM_DIR,
      encoding: "utf-8",
      timeout: 5e3
    });
    return output.trim().split("\n").filter((f) => f.length > 0);
  } catch {
    return [];
  }
}
function hasProtectedFiles(files) {
  return files.some((f) => PROTECTED_PATHS.some((p) => f.includes(p)));
}
function detectOfferFromFiles(files) {
  for (const file of files) {
    if (file.includes("production/")) {
      const parts = file.split("/");
      const prodIdx = parts.indexOf("production");
      if (prodIdx >= 2) {
        return parts.slice(0, prodIdx).join("/");
      }
    }
  }
  return null;
}
function runHealthCheck() {
  if (!(0, import_fs.existsSync)(HEALTH_CHECK)) {
    return { ok: true, message: "health-check.ts not found, skipping" };
  }
  try {
    const output = (0, import_child_process.execSync)(`bun run ${HEALTH_CHECK} --no-cache 2>&1`, {
      cwd: ECOSYSTEM_DIR,
      encoding: "utf-8",
      timeout: 15e3
    });
    const hasFail = output.includes("FAIL");
    const hasCritical = output.includes("\u{1F534}");
    if (hasCritical) {
      return {
        ok: false,
        message: `Health check has CRITICAL failures:
${output.trim()}`
      };
    }
    return {
      ok: true,
      message: hasFail ? `Health check warnings:
${output.trim()}` : "Health check OK"
    };
  } catch (err) {
    const output = err.stdout || err.message || "Unknown error";
    return {
      ok: false,
      message: `Health check failed:
${String(output).trim()}`
    };
  }
}
function validateMecanismo(offerPath) {
  const fullPath = (0, import_path.join)(ECOSYSTEM_DIR, offerPath, "mecanismo-unico.yaml");
  if (!(0, import_fs.existsSync)(fullPath)) {
    return {
      ok: false,
      message: `mecanismo-unico.yaml not found at ${offerPath}`
    };
  }
  try {
    const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
    const stateMatch = content.match(/state:\s*(\w+)/);
    const state = stateMatch ? stateMatch[1] : "UNKNOWN";
    if (state === "VALIDATED" || state === "APPROVED") {
      return { ok: true, message: `Mecanismo state: ${state}` };
    }
    return {
      ok: false,
      message: `Mecanismo state is ${state} (needs VALIDATED or APPROVED)`
    };
  } catch {
    return { ok: false, message: "Failed to read mecanismo-unico.yaml" };
  }
}
function validateGatesForOffer(offerPath) {
  const helixStatePath = (0, import_path.join)(ECOSYSTEM_DIR, offerPath, "helix-state.yaml");
  if (!(0, import_fs.existsSync)(helixStatePath)) {
    return {
      ok: false,
      message: `helix-state.yaml not found at ${offerPath}`
    };
  }
  try {
    const content = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    const briefingGate = content.match(/briefing[\s\S]*?passed:\s*(true|false)/);
    const briefingPassed = briefingGate ? briefingGate[1] === "true" : false;
    if (!briefingPassed) {
      return {
        ok: false,
        message: `Briefing gate not PASSED for ${offerPath}. Cannot commit to production/.`
      };
    }
    return { ok: true, message: "Gates OK" };
  } catch {
    return { ok: false, message: "Failed to read helix-state.yaml" };
  }
}
async function processHookEvent(input) {
  const command = input.tool_input?.command;
  if (!command || !isGitCommitCommand(command)) {
    return { allow: true, errors: [], warnings: [] };
  }
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    return { allow: true, errors: [], warnings: [] };
  }
  if (!hasProtectedFiles(stagedFiles)) {
    return { allow: true, errors: [], warnings: [] };
  }
  const errors = [];
  const warnings = [];
  const healthResult = runHealthCheck();
  if (!healthResult.ok) {
    errors.push(`[HEALTH] ${healthResult.message}`);
  }
  const offerPath = detectOfferFromFiles(stagedFiles);
  if (offerPath) {
    const mecResult = validateMecanismo(offerPath);
    if (!mecResult.ok) {
      errors.push(`[MECANISMO] ${mecResult.message}`);
    }
    const gateResult = validateGatesForOffer(offerPath);
    if (!gateResult.ok) {
      errors.push(`[GATE] ${gateResult.message}`);
    }
  } else {
    warnings.push("[OFFER] Could not detect offer path from staged production files. Gate validation skipped.");
  }
  return {
    allow: errors.length === 0,
    errors,
    warnings
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  detectOfferFromFiles,
  getStagedFiles,
  hasProtectedFiles,
  isGitCommitCommand,
  processHookEvent,
  runHealthCheck,
  validateGatesForOffer,
  validateMecanismo
});
