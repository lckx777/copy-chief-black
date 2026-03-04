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
var journey_tracker_exports = {};
__export(journey_tracker_exports, {
  ECOSYSTEM_ROOT: () => ECOSYSTEM_ROOT,
  LOGS_DIR: () => LOGS_DIR,
  PRODUCTION_TOOLS: () => PRODUCTION_TOOLS,
  VALIDATION_TOOLS: () => VALIDATION_TOOLS,
  applyWIESuggestions: () => applyWIESuggestions,
  detectDeliverable: () => detectDeliverable,
  detectOffer: () => detectOffer,
  extractFailureReasons: () => extractFailureReasons,
  feedSelfLearning: () => feedSelfLearning,
  getLogPath: () => getLogPath,
  learnPatterns: () => learnPatterns,
  loadLog: () => loadLog,
  parseScore: () => parseScore,
  processJourneyIteration: () => processJourneyIteration,
  saveLog: () => saveLog
});
module.exports = __toCommonJS(journey_tracker_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_yaml = require("yaml");
var import_self_learning = require("./self-learning");
var import_workflow_intelligence = require("../workflow/workflow-intelligence");
const HOME = process.env.HOME || "";
const LOGS_DIR = (0, import_path.join)(HOME, ".claude/production-logs");
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
const VALIDATION_TOOLS = [
  "mcp__copywriting__blind_critic",
  "mcp__copywriting__emotional_stress_test",
  "mcp__copywriting__black_validation",
  "mcp__copywriting__layered_review"
];
const PRODUCTION_TOOLS = [
  "mcp__copywriting__write_chapter",
  "Write",
  "Edit"
];
function detectOffer() {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : "unknown";
}
function detectDeliverable(toolInput) {
  const copyType = toolInput.copy_type || "unknown";
  const context = toolInput.context || "";
  if (context.includes("bloco") || context.includes("block")) {
    const blockMatch = context.match(/bloco?\s*(\d+)/i);
    if (blockMatch) return `landing-page/bloco-${blockMatch[1].padStart(2, "0")}`;
  }
  if (context.includes("vsl") || context.includes("capitulo")) {
    return `vsl/${copyType}`;
  }
  if (context.includes("criativo") || context.includes("creative")) {
    return `creatives/${copyType}`;
  }
  return copyType || "unknown";
}
function parseScore(output) {
  const patterns = [
    /score[:\s]+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/i,
    /média[:\s]+(\d+(?:\.\d+)?)/i,
    /rating[:\s]+(\d+(?:\.\d+)?)/i,
    /genericidade[:\s]+(\d+(?:\.\d+)?)/i
  ];
  for (const p of patterns) {
    const m = output.match(p);
    if (m) return parseFloat(m[1]);
  }
  return null;
}
function extractFailureReasons(output) {
  const reasons = [];
  const lines = output.split("\n");
  for (const line of lines) {
    if (/melhora|weak|fraco|genéric|falta|missing|precisa|needs/i.test(line) && line.trim().length > 10) {
      const cleaned = line.replace(/^[\s\-\*•]+/, "").trim();
      if (cleaned.length > 10 && cleaned.length < 200) {
        reasons.push(cleaned);
      }
    }
  }
  return reasons.slice(0, 5);
}
function getLogPath(offer) {
  const safeName = offer.replace(/\//g, "_");
  return (0, import_path.join)(LOGS_DIR, `${safeName}-journey.yaml`);
}
function loadLog(offer) {
  const logPath = getLogPath(offer);
  if (!(0, import_fs.existsSync)(logPath)) return [];
  try {
    return (0, import_yaml.parse)((0, import_fs.readFileSync)(logPath, "utf-8")) || [];
  } catch {
    return [];
  }
}
function saveLog(offer, logs) {
  if (!(0, import_fs.existsSync)(LOGS_DIR)) (0, import_fs.mkdirSync)(LOGS_DIR, { recursive: true });
  (0, import_fs.writeFileSync)(getLogPath(offer), (0, import_yaml.stringify)(logs));
}
function learnPatterns(journey) {
  const recent = journey.iterations.slice(-5);
  const failedIterations = recent.filter((i) => i.status === "FAILED");
  const reasonCounts = {};
  for (const iter of failedIterations) {
    for (const reason of iter.failure_reasons) {
      const key = reason.slice(0, 60);
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    }
  }
  for (const [reason, count] of Object.entries(reasonCounts)) {
    if (count >= 2) {
      const pattern = `Recurring: "${reason}" (${count}x in last 5)`;
      if (!journey.patterns_learned.includes(pattern)) {
        journey.patterns_learned.push(pattern);
      }
    }
  }
  const scores = recent.filter((i) => i.score !== null).map((i) => i.score);
  if (scores.length >= 2) {
    const lastTwo = scores.slice(-2);
    if (lastTwo[1] < lastTwo[0] - 1) {
      const pattern = `Regression: score dropped from ${lastTwo[0]} to ${lastTwo[1]}`;
      if (!journey.patterns_learned.some((p) => p.startsWith("Regression:"))) {
        journey.patterns_learned.push(pattern);
      }
    }
  }
}
function applyWIESuggestions(journey, toolShort) {
  try {
    const recentTools = journey.iterations.slice(-5).map((i) => i.tool);
    const suggestions = (0, import_workflow_intelligence.getScoredSuggestions)(toolShort, recentTools);
    if (suggestions.length > 0) {
      const top = suggestions[0];
      if (top.confidence > 0.5) {
        journey.patterns_learned.push(
          `WIE ${(top.confidence * 100).toFixed(0)}%: ${top.pattern.title} \u2014 ${top.pattern.benefit}`
        );
      }
    }
  } catch {
  }
}
function feedSelfLearning(offer, deliverable, toolShort, score, failureReasons, iterationCount, status) {
  try {
    let phase = "PRODUCTION";
    const helixPath = (0, import_path.join)(ECOSYSTEM_ROOT, offer, "helix-state.yaml");
    if ((0, import_fs.existsSync)(helixPath)) {
      try {
        const hs = (0, import_yaml.parse)((0, import_fs.readFileSync)(helixPath, "utf-8"));
        if (hs?.current_phase) phase = hs.current_phase.toUpperCase();
      } catch {
      }
    }
    (0, import_self_learning.recordValidation)({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      offer_path: offer,
      deliverable_type: deliverable.split("/")[0] || deliverable,
      phase,
      tool: toolShort,
      score,
      iteration: iterationCount,
      criteria_failed: failureReasons.map((r) => r.slice(0, 80)),
      passed: status === "PASSED"
    });
  } catch {
  }
}
function processJourneyIteration(input) {
  const isValidation = VALIDATION_TOOLS.includes(input.tool_name);
  const isProduction = PRODUCTION_TOOLS.includes(input.tool_name);
  if (isProduction && !isValidation) {
    const filePath = input.tool_input.file_path || "";
    if (!filePath.includes("/production/") && input.tool_name !== "mcp__copywriting__write_chapter") {
      return { handled: false };
    }
  }
  if (!isValidation && !isProduction) return { handled: false };
  if (input.is_error) return { handled: false };
  const offer = detectOffer();
  const deliverable = detectDeliverable(input.tool_input);
  const toolShort = input.tool_name.replace(/^mcp__[^_]+__/, "");
  let score = null;
  let failureReasons = [];
  let status = "UNKNOWN";
  if (isValidation && input.tool_output) {
    score = parseScore(input.tool_output);
    failureReasons = score !== null && score < 8 ? extractFailureReasons(input.tool_output) : [];
    status = score === null ? "UNKNOWN" : score >= 8 ? "PASSED" : "FAILED";
  }
  const logs = loadLog(offer);
  let journey = logs.find((l) => l.deliverable === deliverable && l.final_status === "IN_PROGRESS");
  if (!journey) {
    journey = {
      offer,
      deliverable,
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      iterations: [],
      final_status: "IN_PROGRESS",
      patterns_learned: []
    };
    logs.push(journey);
  }
  journey.iterations.push({
    iteration: journey.iterations.length + 1,
    tool: toolShort,
    score,
    failure_reasons: failureReasons,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    status
  });
  journey.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  try {
    (0, import_workflow_intelligence.recordToolUsage)(input.tool_name);
  } catch {
  }
  if (toolShort === "black_validation" && status === "PASSED") {
    journey.final_status = "PASSED";
  }
  if (isValidation && journey.iterations.length >= 3) {
    learnPatterns(journey);
  }
  if (isValidation && journey.iterations.length >= 2) {
    applyWIESuggestions(journey, toolShort);
  }
  saveLog(offer, logs);
  if (isValidation && score !== null) {
    feedSelfLearning(offer, deliverable, toolShort, score, failureReasons, journey.iterations.length, status);
  }
  if (isValidation) {
    const indicator = score !== null ? score >= 8 ? "\u{1F7E2}" : score >= 6 ? "\u{1F7E1}" : "\u{1F534}" : "\u26AA";
    const patternsMsg = journey.patterns_learned.length > 0 ? ` | Patterns: ${journey.patterns_learned.length}` : "";
    console.error(
      `[JOURNEY] ${indicator} ${deliverable}: ${toolShort} ${score !== null ? `${score}/10` : "N/A"} (iter #${journey.iterations.length})${patternsMsg}`
    );
    if (status === "FAILED" && failureReasons.length > 0) {
      console.error(`  Issues: ${failureReasons.slice(0, 2).join("; ")}`);
    }
    try {
      const waveSummary = (0, import_workflow_intelligence.getWaveSummary)();
      if (waveSummary) {
        console.error(`[JOURNEY:WIE] ${waveSummary}`);
      }
    } catch {
    }
  }
  return { handled: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ECOSYSTEM_ROOT,
  LOGS_DIR,
  PRODUCTION_TOOLS,
  VALIDATION_TOOLS,
  applyWIESuggestions,
  detectDeliverable,
  detectOffer,
  extractFailureReasons,
  feedSelfLearning,
  getLogPath,
  learnPatterns,
  loadLog,
  parseScore,
  processJourneyIteration,
  saveLog
});
