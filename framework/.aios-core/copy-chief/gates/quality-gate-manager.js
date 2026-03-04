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
var quality_gate_manager_exports = {};
__export(quality_gate_manager_exports, {
  QualityGateManager: () => QualityGateManager,
  getToolDisplayName: () => getToolDisplayName,
  normalizeToolName: () => normalizeToolName
});
module.exports = __toCommonJS(quality_gate_manager_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_config_resolver = require("../config/config-resolver");
const HOME = process.env.HOME || "/tmp";
const STATUS_PATH = (0, import_path.join)(HOME, ".claude", "qa-status.json");
const TOOL_MAPPINGS = {
  voc_search: "mcp__copywriting__voc_search",
  firecrawl_agent: "mcp__firecrawl__firecrawl_agent",
  firecrawl_scrape: "mcp__firecrawl__firecrawl_scrape",
  firecrawl_search: "mcp__firecrawl__firecrawl_search",
  browser_navigate: "mcp__playwright__browser_navigate",
  get_phase_context: "mcp__copywriting__get_phase_context",
  blind_critic: "mcp__copywriting__blind_critic",
  emotional_stress_test: "mcp__copywriting__emotional_stress_test",
  get_meta_ads: "mcp__fb_ad_library__get_meta_ads",
  get_meta_platform_id: "mcp__fb_ad_library__get_meta_platform_id",
  analyze_ad_video: "mcp__fb_ad_library__analyze_ad_video",
  consensus: "mcp__zen__consensus",
  thinkdeep: "mcp__zen__thinkdeep",
  layered_review: "mcp__copywriting__layered_review",
  write_chapter: "mcp__copywriting__write_chapter",
  black_validation: "mcp__copywriting__black_validation",
  validate_gate: "mcp__copywriting__validate_gate"
};
const TOOL_DISPLAY_NAMES = {
  mcp__copywriting__voc_search: "VOC Search",
  mcp__firecrawl__firecrawl_agent: "Firecrawl Agent",
  mcp__copywriting__get_phase_context: "Get Phase Context",
  mcp__copywriting__blind_critic: "Blind Critic",
  mcp__copywriting__emotional_stress_test: "Emotional Stress Test",
  mcp__copywriting__black_validation: "BLACK Validation",
  mcp__fb_ad_library__get_meta_ads: "Meta Ads Library",
  mcp__fb_ad_library__analyze_ad_video: "Analyze Ad Video",
  mcp__zen__consensus: "Consensus (Zen)"
};
function normalizeToolName(name) {
  if (name.startsWith("mcp__")) return name;
  return TOOL_MAPPINGS[name] || name;
}
function getToolDisplayName(name) {
  const normalized = normalizeToolName(name);
  return TOOL_DISPLAY_NAMES[normalized] || name;
}
class QualityGateManager {
  phase;
  offerPath;
  results = [];
  startTime = 0;
  endTime = 0;
  constructor(phase, offerPath) {
    this.phase = phase;
    this.offerPath = offerPath;
  }
  // ─── Layer 1: Tool Enforcement ─────────────────────────────────────────────
  /**
   * Check if required MCP tools have been used for the current phase.
   *
   * @param toolsUsed — Array of tool names that have been used in session
   */
  runLayer1(toolsUsed) {
    const startTime = Date.now();
    const requiredTools = (0, import_config_resolver.getRequiredTools)(this.phase, this.offerPath);
    const results = [];
    const normalizedUsed = new Set(toolsUsed.map(normalizeToolName));
    for (const tool of requiredTools) {
      const normalized = normalizeToolName(tool);
      const used = normalizedUsed.has(normalized);
      results.push({
        check: `tool:${tool}`,
        pass: used,
        message: used ? `${getToolDisplayName(tool)} \u2014 used` : `${getToolDisplayName(tool)} \u2014 NOT USED (required for ${this.phase})`,
        details: { tool, normalized, phase: this.phase }
      });
    }
    const allPassed = results.every((r) => r.pass);
    const duration = Date.now() - startTime;
    const layer = {
      layer: "Layer 1: Tool Enforcement",
      pass: allPassed,
      status: allPassed ? "passed" : "failed",
      results,
      duration
    };
    this.results.push(layer);
    return layer;
  }
  // ─── Layer 2: Quality Scores ───────────────────────────────────────────────
  /**
   * Check if quality scores meet thresholds.
   *
   * @param scores — Map of tool name to score (e.g. { blind_critic: 8.5, est: 7.1 })
   */
  runLayer2(scores) {
    const startTime = Date.now();
    const results = [];
    const checksPerPhase = {
      research: [],
      // No score checks for research
      briefing: [],
      // No score checks for briefing
      production: [
        { tool: "blind_critic", configKey: "blind_critic" },
        { tool: "emotional_stress_test", configKey: "emotional_stress_test" }
      ],
      delivery: [
        { tool: "black_validation", configKey: "black_validation" }
      ]
    };
    const checks = checksPerPhase[this.phase] || [];
    for (const check of checks) {
      const threshold = (0, import_config_resolver.getThreshold)(check.configKey, this.offerPath);
      const score = scores[check.tool];
      const hasScore = score !== void 0 && score !== null;
      const pass = hasScore && score >= threshold;
      results.push({
        check: `score:${check.tool}`,
        pass,
        score: score || 0,
        threshold,
        message: hasScore ? `${check.tool}: ${score}/${threshold} \u2014 ${pass ? "PASS" : "FAIL"}` : `${check.tool}: NO SCORE (threshold: ${threshold})`
      });
    }
    if (checks.length === 0) {
      results.push({
        check: "phase_scores",
        pass: true,
        message: `No score checks required for ${this.phase} phase`,
        skipped: true
      });
    }
    const allPassed = results.every((r) => r.pass || r.skipped);
    const duration = Date.now() - startTime;
    const layer = {
      layer: "Layer 2: Quality Scores",
      pass: allPassed,
      status: allPassed ? "passed" : "failed",
      results,
      duration
    };
    this.results.push(layer);
    return layer;
  }
  // ─── Layer 3: Human Review ─────────────────────────────────────────────────
  /**
   * Check if human review requirements are met.
   *
   * @param context — Human review state
   */
  runLayer3(context) {
    const startTime = Date.now();
    const results = [];
    if (this.phase === "production" || this.phase === "delivery") {
      const mecanismoOk = context.mecanismoState === "VALIDATED" || context.mecanismoState === "APPROVED";
      results.push({
        check: "human:mecanismo",
        pass: mecanismoOk,
        message: mecanismoOk ? `Mecanismo: ${context.mecanismoState}` : `Mecanismo: ${context.mecanismoState || "UNDEFINED"} (need VALIDATED or APPROVED)`
      });
    }
    if (this.phase === "delivery") {
      results.push({
        check: "human:approval",
        pass: !!context.humanApproved,
        message: context.humanApproved ? "Human approval: APPROVED" : "Human approval: PENDING"
      });
    }
    if (context.storyComplete !== void 0) {
      results.push({
        check: "human:story",
        pass: context.storyComplete,
        message: context.storyComplete ? "Story: all acceptance criteria met" : "Story: acceptance criteria pending"
      });
    }
    if (results.length === 0) {
      results.push({
        check: "human:none",
        pass: true,
        message: `No human review required for ${this.phase} phase`,
        skipped: true
      });
    }
    const allPassed = results.every((r) => r.pass || r.skipped);
    const duration = Date.now() - startTime;
    const layer = {
      layer: "Layer 3: Human Review",
      pass: allPassed,
      status: allPassed ? "passed" : "failed",
      results,
      duration
    };
    this.results.push(layer);
    return layer;
  }
  // ─── Orchestration ─────────────────────────────────────────────────────────
  /**
   * Run the full 3-layer pipeline with fail-fast behavior.
   * For the briefing phase, delegates weighted scoring to evaluateBriefingGate()
   * from weighted-gates instead of calculating inline.
   */
  orchestrate(context) {
    this.startTime = Date.now();
    this.results = [];
    const l1 = this.runLayer1(context.toolsUsed);
    if (!l1.pass) {
      this.endTime = Date.now();
      return this.failFast("layer1", l1);
    }
    let scoresForLayer2 = context.scores;
    if (this.phase === "briefing" && this.offerPath) {
      const briefingScore = context.briefingWeightedScore !== void 0 ? context.briefingWeightedScore : null;
      const startL2 = Date.now();
      const l2Results = [];
      if (briefingScore !== null) {
        const minScore = 75;
        const pass = briefingScore >= minScore;
        l2Results.push({
          check: "score:briefing_weighted",
          pass,
          score: briefingScore,
          threshold: minScore,
          message: `Briefing weighted score: ${briefingScore}/${minScore} \u2014 ${pass ? "PASS" : "FAIL"} (via evaluateBriefingGate)`,
          details: { source: "evaluateBriefingGate", offerPath: this.offerPath }
        });
      } else {
        const l2 = this.runLayer2(scoresForLayer2);
        if (!l2.pass) {
          this.endTime = Date.now();
          return this.failFast("layer2", l2);
        }
        const l32 = this.runLayer3(context);
        this.endTime = Date.now();
        if (!l32.pass) {
          return {
            pass: false,
            status: "pending_human_review",
            duration: this.getDuration(),
            layers: this.results,
            exitCode: 0,
            message: "Layers 1+2 passed. Awaiting human review."
          };
        }
        return {
          pass: true,
          status: "passed",
          duration: this.getDuration(),
          layers: this.results,
          exitCode: 0,
          message: "All quality gates passed."
        };
      }
      const allL2Passed = l2Results.every((r) => r.pass || r.skipped);
      const l2Layer = {
        layer: "Layer 2: Quality Scores",
        pass: allL2Passed,
        status: allL2Passed ? "passed" : "failed",
        results: l2Results,
        duration: Date.now() - startL2
      };
      this.results.push(l2Layer);
      if (!l2Layer.pass) {
        this.endTime = Date.now();
        return this.failFast("layer2", l2Layer);
      }
    } else {
      const l2 = this.runLayer2(scoresForLayer2);
      if (!l2.pass) {
        this.endTime = Date.now();
        return this.failFast("layer2", l2);
      }
    }
    const l3 = this.runLayer3(context);
    this.endTime = Date.now();
    if (!l3.pass) {
      return {
        pass: false,
        status: "pending_human_review",
        duration: this.getDuration(),
        layers: this.results,
        exitCode: 0,
        // Not a hard failure — pending review
        message: "Layers 1+2 passed. Awaiting human review."
      };
    }
    return {
      pass: true,
      status: "passed",
      duration: this.getDuration(),
      layers: this.results,
      exitCode: 0,
      message: "All quality gates passed."
    };
  }
  // ─── Helpers ───────────────────────────────────────────────────────────────
  failFast(stoppedAt, failedLayer) {
    const failedChecks = failedLayer.results.filter((r) => !r.pass && !r.skipped);
    return {
      pass: false,
      status: "failed",
      stoppedAt,
      reason: "fail-fast",
      duration: this.getDuration(),
      layers: this.results,
      exitCode: 1,
      message: `${failedLayer.layer} failed: ${failedChecks.map((c) => c.message).join("; ")}`
    };
  }
  getDuration() {
    if (!this.startTime) return 0;
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }
  // ─── Status Persistence ────────────────────────────────────────────────────
  /**
   * Save gate results to status file.
   */
  saveStatus() {
    const status = {
      lastRun: (/* @__PURE__ */ new Date()).toISOString(),
      phase: this.phase,
      offerPath: this.offerPath,
      layer1: this.results[0] || null,
      layer2: this.results[1] || null,
      layer3: this.results[2] || null,
      overall: this.results.every((l) => l.pass) ? "passed" : "failed"
    };
    try {
      const dir = (0, import_path.dirname)(STATUS_PATH);
      if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
      (0, import_fs.writeFileSync)(STATUS_PATH, JSON.stringify(status, null, 2));
    } catch (error) {
      console.error(`[QGM] Failed to save status: ${error}`);
    }
  }
  /**
   * Load last gate status from file.
   */
  static loadStatus() {
    try {
      if (!(0, import_fs.existsSync)(STATUS_PATH)) return null;
      const content = (0, import_fs.readFileSync)(STATUS_PATH, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  // ─── Status Query ──────────────────────────────────────────────────────────
  /**
   * Get current gate status (last run or null).
   * Mirrors aios-core quality-gate-manager getStatus().
   */
  getStatus() {
    if (this.results.length === 0) {
      return QualityGateManager.loadStatus();
    }
    return {
      lastRun: (/* @__PURE__ */ new Date()).toISOString(),
      phase: this.phase,
      offerPath: this.offerPath,
      layer1: this.results[0] || null,
      layer2: this.results[1] || null,
      layer3: this.results[2] || null,
      overall: this.results.every((l) => l.pass) ? "passed" : "failed"
    };
  }
  /**
   * Generate a Markdown report and save it to ~/.claude/qa-reports/{offerId}.md.
   * Mirrors aios-core quality-gate-manager saveReport().
   */
  saveReport(offerId) {
    const status = this.getStatus();
    const lines = [
      `# Quality Gate Report \u2014 ${offerId}`,
      "",
      `**Phase:** ${this.phase}`,
      `**Date:** ${(/* @__PURE__ */ new Date()).toISOString()}`,
      `**Overall:** ${status?.overall?.toUpperCase() ?? "UNKNOWN"}`,
      "",
      "## Layer Results",
      ""
    ];
    for (const layer of this.results) {
      const icon = layer.pass ? "PASS" : "FAIL";
      lines.push(`### [${icon}] ${layer.layer}`);
      lines.push("");
      for (const r of layer.results) {
        const checkIcon = r.pass ? "- [x]" : r.skipped ? "- [-]" : "- [ ]";
        lines.push(`${checkIcon} ${r.message}`);
      }
      lines.push("");
    }
    lines.push(`---`);
    lines.push(`*Generated by QualityGateManager v1.0.0*`);
    try {
      const reportsDir = (0, import_path.join)(HOME, ".claude", "qa-reports");
      if (!(0, import_fs.existsSync)(reportsDir)) (0, import_fs.mkdirSync)(reportsDir, { recursive: true });
      const reportPath = (0, import_path.join)(reportsDir, `${offerId.replace(/\//g, "-")}.md`);
      (0, import_fs.writeFileSync)(reportPath, lines.join("\n"));
    } catch (error) {
      console.error(`[QGM] Failed to save report: ${error}`);
    }
  }
  /**
   * Get all checks from the last run that require human review (pending).
   * Mirrors aios-core quality-gate-manager getPendingReviews().
   */
  getPendingReviews() {
    const layer3 = this.results.find((l) => l.layer.includes("Layer 3") || l.layer.includes("Human"));
    if (!layer3) return [];
    return layer3.results.filter((r) => !r.pass && !r.skipped);
  }
  // ─── Formatting ────────────────────────────────────────────────────────────
  /**
   * Format results for display (system-reminder output).
   */
  formatResults() {
    const lines = [];
    lines.push("Quality Gate Pipeline Results");
    lines.push("\u2501".repeat(50));
    for (const layer of this.results) {
      const icon = layer.pass ? "\u2705" : "\u274C";
      lines.push(`${icon} ${layer.layer} \u2014 ${layer.status.toUpperCase()}`);
      for (const result of layer.results) {
        const checkIcon = result.pass ? "\u2713" : "\u2717";
        const skipped = result.skipped ? " (skipped)" : "";
        lines.push(`   ${checkIcon} ${result.message}${skipped}`);
      }
    }
    lines.push("\u2501".repeat(50));
    lines.push(`Duration: ${this.getDuration()}ms`);
    return lines.join("\n");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  QualityGateManager,
  getToolDisplayName,
  normalizeToolName
});
