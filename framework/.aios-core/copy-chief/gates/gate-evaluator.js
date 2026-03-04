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
var gate_evaluator_exports = {};
__export(gate_evaluator_exports, {
  GateEvaluator: () => GateEvaluator,
  GateVerdict: () => GateVerdict,
  canAdvancePhase: () => canAdvancePhase
});
module.exports = __toCommonJS(gate_evaluator_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_module = require("module");
var import_os = require("os");
const import_meta = {};
const _require = (0, import_module.createRequire)(import_meta.url);
let yaml;
try {
  yaml = _require("yaml");
} catch {
  try {
    yaml = _require("js-yaml");
  } catch {
    yaml = { parse: JSON.parse, load: JSON.parse };
  }
}
const GateVerdict = {
  APPROVED: "approved",
  NEEDS_REVISION: "needs_revision",
  BLOCKED: "blocked"
};
const DEFAULT_GATE_CONFIG = {
  research_to_briefing: {
    blocking: true,
    checks: ["voc_collected", "competitors_analyzed", "synthesis_exists"]
  },
  briefing_to_production: {
    blocking: true,
    checks: ["helix_complete", "mecanismo_validated", "mup_defined", "mus_defined"]
  },
  production_to_review: {
    blocking: true,
    checks: ["blind_critic_passed", "emotional_stress_passed", "no_critical_errors"]
  },
  review_to_delivery: {
    blocking: true,
    checks: ["black_validation_passed", "human_approved"],
    requireApproval: true
  }
};
class GateEvaluator {
  projectRoot;
  strictMode;
  gateConfig;
  results;
  logs;
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.strictMode = options.strictMode ?? false;
    this.gateConfig = options.gateConfig || null;
    this.results = [];
    this.logs = [];
  }
  _log(message, level = "info") {
    this.logs.push({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), level, message });
  }
  _loadConfig() {
    if (this.gateConfig) return this.gateConfig;
    try {
      const configPath = (0, import_path.join)(this.projectRoot, ".claude", "core-config.yaml");
      if ((0, import_fs.existsSync)(configPath)) {
        const content = (0, import_fs.readFileSync)(configPath, "utf8");
        const config = (yaml.parse || yaml.load)(content);
        if (config?.gates) return { ...DEFAULT_GATE_CONFIG, ...config.gates };
      }
    } catch (error) {
      this._log(`Failed to load gate config: ${error.message}`, "warn");
    }
    return DEFAULT_GATE_CONFIG;
  }
  _getGateKey(fromPhase, toPhase) {
    return `${fromPhase}_to_${toPhase}`;
  }
  evaluate(fromPhase, toPhase, phaseResult) {
    const gateKey = this._getGateKey(fromPhase, toPhase);
    this._log(`Evaluating gate: ${gateKey}`, "info");
    const config = this._loadConfig();
    const gateConfig = config[gateKey] || { blocking: false, checks: [] };
    const result = {
      gate: gateKey,
      fromPhase,
      toPhase,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      verdict: GateVerdict.APPROVED,
      score: 0,
      checks: [],
      issues: [],
      config: gateConfig
    };
    try {
      const checks = this._runGateChecks(fromPhase, toPhase, phaseResult, gateConfig);
      result.checks = checks;
      const passedChecks = checks.filter((c) => c.passed).length;
      result.score = checks.length > 0 ? passedChecks / checks.length * 5 : 5;
      result.issues = checks.filter((c) => !c.passed).map((c) => ({
        check: c.name,
        message: c.message,
        severity: c.severity
      }));
      result.verdict = this._determineVerdict(result, gateConfig);
      this._log(`Gate ${gateKey}: ${result.verdict} (score: ${result.score.toFixed(1)})`, "info");
    } catch (error) {
      result.verdict = GateVerdict.BLOCKED;
      result.issues.push({ check: "gate_evaluation", message: error.message, severity: "critical" });
      this._log(`Gate evaluation failed: ${error.message}`, "error");
    }
    this.results.push(result);
    return result;
  }
  _runGateChecks(fromPhase, _toPhase, phaseResult, gateConfig) {
    const checks = [];
    const checkNames = gateConfig.checks || [];
    for (const checkName of checkNames) {
      checks.push(this._runCheck(checkName, phaseResult));
    }
    if (gateConfig.minScore !== void 0 && phaseResult.score !== void 0) {
      checks.push({
        name: "min_score",
        passed: phaseResult.score >= gateConfig.minScore,
        message: `Score ${phaseResult.score} ${phaseResult.score >= gateConfig.minScore ? ">=" : "<"} min ${gateConfig.minScore}`,
        severity: "high"
      });
    }
    return checks;
  }
  _runCheck(checkName, phaseResult) {
    const result = { name: checkName, passed: false, message: "", severity: "medium" };
    switch (checkName) {
      // Research checks
      case "voc_collected":
        result.passed = !!phaseResult.voc_data || (phaseResult.tools_used || []).includes("voc_search");
        result.message = result.passed ? "VOC data collected" : "No VOC data found";
        result.severity = "critical";
        break;
      case "competitors_analyzed":
        result.passed = !!phaseResult.competitor_data || (phaseResult.tools_used || []).includes("get_meta_ads");
        result.message = result.passed ? "Competitors analyzed" : "No competitor analysis";
        result.severity = "high";
        break;
      case "synthesis_exists":
        result.passed = !!phaseResult.synthesis_path;
        result.message = result.passed ? "Synthesis document exists" : "No synthesis document";
        result.severity = "high";
        break;
      // Briefing checks
      case "helix_complete":
        result.passed = !!phaseResult.helix_complete || (phaseResult.phases_completed || 0) >= 10;
        result.message = result.passed ? "HELIX 10/10 complete" : "HELIX incomplete";
        result.severity = "critical";
        break;
      case "mecanismo_validated":
        result.passed = phaseResult.mecanismo_state === "VALIDATED" || phaseResult.mecanismo_state === "APPROVED";
        result.message = result.passed ? `Mecanismo: ${phaseResult.mecanismo_state}` : "Mecanismo not validated";
        result.severity = "critical";
        break;
      case "mup_defined":
        result.passed = !!phaseResult.mup_statement;
        result.message = result.passed ? "MUP defined" : "No MUP statement";
        result.severity = "critical";
        break;
      case "mus_defined":
        result.passed = !!phaseResult.mus_statement;
        result.message = result.passed ? "MUS defined" : "No MUS statement";
        result.severity = "critical";
        break;
      // Production checks
      case "blind_critic_passed":
        result.passed = (phaseResult.blind_critic_score || 0) >= 8;
        result.message = `blind_critic: ${phaseResult.blind_critic_score || 0}/10 (min: 8)`;
        result.severity = "high";
        break;
      case "emotional_stress_passed":
        result.passed = (phaseResult.emotional_stress_score || 0) >= 8;
        result.message = `emotional_stress: ${phaseResult.emotional_stress_score || 0}/10 (min: 8)`;
        result.severity = "high";
        break;
      case "no_critical_errors":
        const criticalErrors = (phaseResult.errors || []).filter((e) => e.severity === "critical");
        result.passed = criticalErrors.length === 0;
        result.message = result.passed ? "No critical errors" : `${criticalErrors.length} critical errors`;
        result.severity = "critical";
        break;
      // Review checks
      case "black_validation_passed":
        result.passed = (phaseResult.black_validation_score || 0) >= 8;
        result.message = `black_validation: ${phaseResult.black_validation_score || 0}/10 (min: 8)`;
        result.severity = "critical";
        break;
      case "human_approved":
        result.passed = !!phaseResult.human_approved;
        result.message = result.passed ? "Human approved" : "Awaiting human approval";
        result.severity = "critical";
        break;
      default:
        result.passed = true;
        result.message = `Unknown check: ${checkName}`;
        result.severity = "low";
    }
    return result;
  }
  _determineVerdict(result, gateConfig) {
    if (this.strictMode && result.issues.length > 0) return GateVerdict.BLOCKED;
    const criticalIssues = result.issues.filter((i) => i.severity === "critical");
    if (criticalIssues.length > 0) return GateVerdict.BLOCKED;
    if (gateConfig.minScore !== void 0 && result.score < gateConfig.minScore) {
      return gateConfig.blocking ? GateVerdict.BLOCKED : GateVerdict.NEEDS_REVISION;
    }
    const highIssues = result.issues.filter((i) => i.severity === "high");
    if (highIssues.length > 0) return gateConfig.blocking ? GateVerdict.BLOCKED : GateVerdict.NEEDS_REVISION;
    if (gateConfig.allowMinorIssues && result.issues.every((i) => i.severity === "low" || i.severity === "medium")) {
      return GateVerdict.APPROVED;
    }
    if (result.issues.length > 0) return GateVerdict.NEEDS_REVISION;
    return GateVerdict.APPROVED;
  }
  shouldBlock(verdict) {
    return verdict === GateVerdict.BLOCKED;
  }
  needsRevision(verdict) {
    return verdict === GateVerdict.NEEDS_REVISION;
  }
  getResults() {
    return [...this.results];
  }
  getResult(gateKey) {
    return this.results.find((r) => r.gate === gateKey) || null;
  }
  getSummary() {
    const approved = this.results.filter((r) => r.verdict === GateVerdict.APPROVED).length;
    const needsRevision = this.results.filter((r) => r.verdict === GateVerdict.NEEDS_REVISION).length;
    const blocked = this.results.filter((r) => r.verdict === GateVerdict.BLOCKED).length;
    return {
      total: this.results.length,
      approved,
      needsRevision,
      blocked,
      allPassed: blocked === 0 && needsRevision === 0,
      averageScore: this.results.length > 0 ? this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length : 0
    };
  }
  clear() {
    this.results = [];
    this.logs = [];
  }
  getLogs() {
    return [...this.logs];
  }
  // ─── Added: async _loadConfig, _runCheckForType (parity with aios-core) ────
  /**
   * Async variant of _loadConfig — reads core-config.yaml with fs.promises.
   * Mirrors aios-core gate-evaluator._loadConfig() (async/await version).
   */
  async loadConfigAsync() {
    if (this.gateConfig) return this.gateConfig;
    try {
      const { readFileSync: readFileSync2, existsSync: existsSync2 } = await import("fs");
      const configPath = (0, import_path.join)(this.projectRoot, ".claude", "core-config.yaml");
      if (existsSync2(configPath)) {
        const content = readFileSync2(configPath, "utf8");
        const config = (yaml.parse || yaml.load)(content);
        if (config?.gates) return { ...DEFAULT_GATE_CONFIG, ...config.gates };
      }
    } catch (err) {
      this._log(`Failed to load gate config (async): ${err.message}`, "warn");
    }
    return DEFAULT_GATE_CONFIG;
  }
  /**
   * Run a check by type, matching the aios-core _runCheckForType() pattern.
   *
   * Supported check types:
   *   - toolsUsed: checks if a tool name appears in phaseResult.tools_used[]
   *   - scoreAbove: checks if phaseResult[checkName] >= threshold
   *   - mecanismoState: checks phaseResult.mecanismo_state === 'VALIDATED' | 'APPROVED'
   *   - filesExist: checks phaseResult.artifacts[] or phaseResult.synthesis_path
   *
   * @param checkType — 'toolsUsed' | 'scoreAbove' | 'mecanismoState' | 'filesExist'
   * @param checkName — specific check value (tool name, score key, state value, file path)
   * @param phaseResult — phase execution result object
   * @param threshold — optional numeric threshold for scoreAbove checks
   */
  runCheckForType(checkType, checkName, phaseResult, threshold = 8) {
    const result = { name: checkName, passed: false, message: "", severity: "medium" };
    switch (checkType) {
      case "toolsUsed": {
        const used = phaseResult.tools_used || [];
        result.passed = used.some((t) => t === checkName || t.endsWith(checkName) || t.includes(checkName));
        result.message = result.passed ? `Tool used: ${checkName}` : `Tool NOT used: ${checkName}`;
        result.severity = "high";
        break;
      }
      case "scoreAbove": {
        const score = typeof phaseResult[checkName] === "number" ? phaseResult[checkName] : 0;
        result.passed = score >= threshold;
        result.message = `${checkName}: ${score} ${result.passed ? ">=" : "<"} ${threshold}`;
        result.severity = result.passed ? "low" : "high";
        break;
      }
      case "mecanismoState": {
        const state = phaseResult.mecanismo_state || "";
        const validStates = ["VALIDATED", "APPROVED"];
        result.passed = validStates.includes(state.toUpperCase());
        result.message = result.passed ? `Mecanismo state: ${state}` : `Mecanismo state '${state}' not in ${validStates.join("|")}`;
        result.severity = "critical";
        break;
      }
      case "filesExist": {
        const artifacts = (phaseResult.artifacts || []).map((a) => typeof a === "string" ? a : a?.path || "");
        const hasDirect = !!phaseResult.synthesis_path || !!phaseResult.specPath || !!phaseResult[checkName];
        const hasArtifact = artifacts.some((p) => p.includes(checkName));
        result.passed = hasDirect || hasArtifact;
        result.message = result.passed ? `File/artifact exists: ${checkName}` : `File/artifact missing: ${checkName}`;
        result.severity = "high";
        break;
      }
      default:
        result.passed = true;
        result.message = `Unknown checkType: ${checkType}`;
        result.severity = "low";
    }
    return result;
  }
}
const HOME_DIR = (0, import_os.homedir)();
const ECOSYSTEM_ROOT_GE = (0, import_path.join)(HOME_DIR, "copywriting-ecosystem");
function canAdvancePhase(offerPath, targetPhase) {
  const resolved = offerPath.startsWith("/") ? offerPath : (0, import_path.join)(ECOSYSTEM_ROOT_GE, offerPath);
  const helixStatePath = (0, import_path.join)(resolved, "helix-state.yaml");
  const phase = targetPhase.toUpperCase();
  if (phase === "RESEARCH" || phase === "IDLE") {
    return { allowed: true, reason: `${phase} is always accessible as the initial phase` };
  }
  let helixContent = "";
  try {
    if ((0, import_fs.existsSync)(helixStatePath)) {
      helixContent = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    }
  } catch {
    return {
      allowed: true,
      reason: "helix-state.yaml unreadable \u2014 allowing by default (fail-open)"
    };
  }
  if (!helixContent) {
    return {
      allowed: false,
      reason: `helix-state.yaml not found at ${helixStatePath} \u2014 cannot determine gate status`
    };
  }
  const gatesSection = helixContent.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || helixContent.substring(helixContent.indexOf("gates:") + 6);
  const gateLines = gatesSection.split("\n");
  let researchPassed = false;
  let briefingPassed = false;
  let productionPassed = false;
  let currentGate = "";
  for (const line of gateLines) {
    const gateNameMatch = line.match(/^\s{2}(research|briefing|production)\s*:/);
    if (gateNameMatch) {
      currentGate = gateNameMatch[1];
      continue;
    }
    const passedMatch = line.match(/^\s+passed\s*:\s*(true|false)/);
    if (passedMatch && currentGate) {
      const val = passedMatch[1] === "true";
      if (currentGate === "research") researchPassed = val;
      else if (currentGate === "briefing") briefingPassed = val;
      else if (currentGate === "production") productionPassed = val;
    }
  }
  const phasesMatch = helixContent.match(/phases_completed\s*:\s*(\d+)/);
  let helixPhases = phasesMatch ? parseInt(phasesMatch[1], 10) : 0;
  if (helixPhases === 0) {
    const completedMatches = helixContent.match(/status:\s*completed/g);
    helixPhases = completedMatches ? completedMatches.length : 0;
  }
  const mecanismoStateMatch = helixContent.match(/state\s*:\s*(\w+)/);
  const mecanismoState = mecanismoStateMatch ? mecanismoStateMatch[1].toUpperCase() : "UNKNOWN";
  const scores = { researchPassed, briefingPassed, productionPassed, helixPhases, mecanismoState };
  switch (phase) {
    case "BRIEFING":
      if (!researchPassed) {
        return {
          allowed: false,
          reason: "Research gate not passed \u2014 complete research phase before advancing to BRIEFING",
          scores
        };
      }
      return { allowed: true, reason: "Research gate passed \u2014 BRIEFING accessible", scores };
    case "PRODUCTION":
      if (!researchPassed) {
        return {
          allowed: false,
          reason: "Research gate not passed \u2014 complete research phase first",
          scores
        };
      }
      if (!briefingPassed) {
        return {
          allowed: false,
          reason: `Briefing gate not passed (${helixPhases}/10 HELIX phases) \u2014 complete briefing before PRODUCTION`,
          scores
        };
      }
      return { allowed: true, reason: "Research + Briefing gates passed \u2014 PRODUCTION accessible", scores };
    case "REVIEW":
      if (!productionPassed) {
        return {
          allowed: false,
          reason: "Production gate not passed \u2014 complete production phase before REVIEW",
          scores
        };
      }
      return { allowed: true, reason: "Production gate passed \u2014 REVIEW accessible", scores };
    case "DELIVERED":
      if (!productionPassed) {
        return {
          allowed: false,
          reason: "Production gate not passed \u2014 complete production and review before DELIVERED",
          scores
        };
      }
      return { allowed: true, reason: "Production gate passed \u2014 DELIVERED accessible", scores };
    default:
      return {
        allowed: false,
        reason: `Unknown target phase: "${targetPhase}". Valid phases: RESEARCH, BRIEFING, PRODUCTION, REVIEW, DELIVERED`,
        scores
      };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GateEvaluator,
  GateVerdict,
  canAdvancePhase
});
