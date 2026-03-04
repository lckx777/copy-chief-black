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
var dashboard_client_exports = {};
__export(dashboard_client_exports, {
  DASHBOARD_URL: () => DASHBOARD_URL,
  SESSION_DIR: () => SESSION_DIR,
  TOOL_SPECIFIC_SCORE_PATTERNS: () => TOOL_SPECIFIC_SCORE_PATTERNS,
  TOOL_START_DIR: () => TOOL_START_DIR,
  VALIDATION_TOOLS: () => VALIDATION_TOOLS,
  cleanupStaleSessions: () => cleanupStaleSessions,
  detectActiveAgent: () => detectActiveAgent,
  detectOffer: () => detectOffer,
  detectPhase: () => detectPhase,
  emitDashboardEvent: () => emitDashboardEvent,
  extractScore: () => extractScore,
  getDurationMs: () => getDurationMs,
  getSessionId: () => getSessionId,
  isMcpTool: () => isMcpTool,
  recordToolStart: () => recordToolStart
});
module.exports = __toCommonJS(dashboard_client_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_semantic_translator = require("./semantic-translator");
const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:4001";
const TOOL_START_DIR = (0, import_path.join)(process.env.HOME || "", ".claude/session-state/tool-starts");
const SESSION_DIR = (0, import_path.join)(process.env.HOME || "", ".claude/session-state/sessions");
const VALIDATION_TOOLS = [
  "mcp__copywriting__blind_critic",
  "mcp__copywriting__emotional_stress_test",
  "mcp__copywriting__black_validation",
  "mcp__copywriting__layered_review"
];
const TOOL_SPECIFIC_SCORE_PATTERNS = {
  mcp__copywriting__blind_critic: [
    /\*\*(?:Average|Overall|Final)\s*(?:Score)?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Overall|Average|Final)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i
  ],
  mcp__copywriting__emotional_stress_test: [
    /\*\*(?:Genericidade|Overall|Score)\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Genericidade|Overall)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i
  ],
  mcp__copywriting__black_validation: [
    /\*\*(?:Final|BLACK|Overall)\s*(?:Score)?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Final|BLACK|Overall)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i
  ],
  mcp__copywriting__layered_review: [
    /\*\*(?:Overall|Final|Score)\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Overall|Final)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i
  ]
};
function getSessionId() {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  if (process.env.SESSION_ID) return process.env.SESSION_ID;
  const ppid = process.ppid || process.pid;
  const sessionFile = (0, import_path.join)(SESSION_DIR, `session-${ppid}.json`);
  try {
    if ((0, import_fs.existsSync)(sessionFile)) {
      const data = JSON.parse((0, import_fs.readFileSync)(sessionFile, "utf-8"));
      if (data.ts && Date.now() - data.ts < 4 * 60 * 60 * 1e3) {
        return data.id;
      }
    }
  } catch {
  }
  const now = /* @__PURE__ */ new Date();
  const id = `claude-${ppid}-${now.toISOString().slice(0, 16).replace(/[T:]/g, "-")}`;
  try {
    if (!(0, import_fs.existsSync)(SESSION_DIR)) (0, import_fs.mkdirSync)(SESSION_DIR, { recursive: true });
    (0, import_fs.writeFileSync)(sessionFile, JSON.stringify({ id, ts: Date.now(), ppid }));
  } catch {
  }
  return id;
}
function cleanupStaleSessions() {
  try {
    if (!(0, import_fs.existsSync)(SESSION_DIR)) return;
    const now = Date.now();
    const maxAge = 8 * 60 * 60 * 1e3;
    for (const file of (0, import_fs.readdirSync)(SESSION_DIR)) {
      if (!file.startsWith("session-") || !file.endsWith(".json")) continue;
      const filePath = (0, import_path.join)(SESSION_DIR, file);
      try {
        const data = JSON.parse((0, import_fs.readFileSync)(filePath, "utf-8"));
        if (data.ts && now - data.ts > maxAge) {
          (0, import_fs.unlinkSync)(filePath);
        }
      } catch {
        try {
          (0, import_fs.unlinkSync)(filePath);
        } catch {
        }
      }
    }
  } catch {
  }
}
function getDurationMs(toolName) {
  const startFile = (0, import_path.join)(TOOL_START_DIR, `${toolName.replace(/[^a-zA-Z0-9_-]/g, "_")}.start`);
  try {
    if ((0, import_fs.existsSync)(startFile)) {
      const startTs = parseInt((0, import_fs.readFileSync)(startFile, "utf-8").trim(), 10);
      (0, import_fs.unlinkSync)(startFile);
      if (!isNaN(startTs) && startTs > 0) {
        return Date.now() - startTs;
      }
    }
  } catch {
  }
  return void 0;
}
function recordToolStart(toolName) {
  try {
    if (!(0, import_fs.existsSync)(TOOL_START_DIR)) (0, import_fs.mkdirSync)(TOOL_START_DIR, { recursive: true });
    const startFile = (0, import_path.join)(TOOL_START_DIR, `${toolName.replace(/[^a-zA-Z0-9_-]/g, "_")}.start`);
    (0, import_fs.writeFileSync)(startFile, String(Date.now()));
  } catch {
  }
}
function detectOffer(input) {
  const explicitOffer = input.tool_input?.offer;
  if (explicitOffer) return explicitOffer;
  const filePath = input.tool_input?.file_path;
  const ecoDir = `${process.env.HOME}/copywriting-ecosystem/`;
  if (filePath?.startsWith(ecoDir)) {
    const rel = filePath.slice(ecoDir.length);
    const parts = rel.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  }
  const cwd = process.cwd();
  if (cwd.startsWith(ecoDir)) {
    const rel = cwd.slice(ecoDir.length);
    const parts = rel.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  }
  return void 0;
}
function detectPhase(input) {
  const toolName = input.tool_name || "";
  const output = typeof input.tool_output === "string" ? input.tool_output : input.tool_output ? JSON.stringify(input.tool_output) : "";
  if (toolName.includes("validate_gate") || toolName.includes("phase")) {
    const phaseMatch = output.match(/phase[:\s]+['"]?(\w+)/i);
    if (phaseMatch) return phaseMatch[1];
  }
  return void 0;
}
function isMcpTool(toolName) {
  return toolName.startsWith("mcp__");
}
function extractScore(toolName, output) {
  const allScoreMatches = [];
  const globalPattern = /(\d+(?:\.\d+)?)\s*\/\s*10/g;
  let gm;
  while ((gm = globalPattern.exec(output)) !== null) {
    const val = parseFloat(gm[1]);
    if (val >= 0 && val <= 10) allScoreMatches.push(val);
  }
  const specificPatterns = TOOL_SPECIFIC_SCORE_PATTERNS[toolName] || [];
  for (const pat of specificPatterns) {
    const m = output.match(pat);
    if (m) {
      const val = parseFloat(m[1]);
      if (val >= 0 && val <= 10) return val;
    }
  }
  if (allScoreMatches.length > 0) {
    return allScoreMatches[allScoreMatches.length - 1];
  }
  return null;
}
function detectActiveAgent() {
  try {
    const setPath = (0, import_path.join)(process.env.HOME || "", ".claude", "session-state", "active-agents.json");
    if (!(0, import_fs.existsSync)(setPath)) return null;
    const raw = (0, import_fs.readFileSync)(setPath, "utf-8");
    const agentSet = JSON.parse(raw);
    const entries = Object.entries(agentSet);
    if (entries.length === 0) return null;
    let latest = null;
    for (const [id, data] of entries) {
      const entry = data;
      const ts = entry.activatedAt || 0;
      if (!latest || ts > latest.ts) {
        latest = { id, ts, offer: entry.offer || null };
      }
    }
    return latest ? { agent_id: latest.id, agent_offer: latest.offer } : null;
  } catch {
    return null;
  }
}
async function emitDashboardEvent(input) {
  const sessionId = getSessionId();
  cleanupStaleSessions();
  const offer = detectOffer(input);
  const phase = detectPhase(input);
  const duration_ms = getDurationMs(input.tool_name);
  const activeAgent = detectActiveAgent();
  const toolOutputStr = typeof input.tool_output === "string" ? input.tool_output : input.tool_output ? JSON.stringify(input.tool_output) : void 0;
  const cwd = process.cwd();
  const payload = {
    type: "PostToolUse",
    timestamp: Date.now(),
    session_id: sessionId,
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_result: toolOutputStr?.substring(0, 500),
    is_error: input.is_error || false,
    duration_ms,
    offer: offer || activeAgent?.agent_offer || void 0,
    phase,
    data: {
      ...isMcpTool(input.tool_name) ? { is_mcp: true } : {},
      ...activeAgent ? { agent_id: activeAgent.agent_id } : {},
      cwd
    }
  };
  try {
    const semantic = (0, import_semantic_translator.translateEvent)({
      type: payload.type,
      tool_name: payload.tool_name,
      tool_input: payload.tool_input,
      tool_result: payload.tool_result,
      offer: payload.offer,
      data: payload.data,
      is_error: payload.is_error
    });
    if (semantic.significance !== "noise") {
      payload.semantic_description = semantic.description;
      payload.significance = semantic.significance;
      payload.semantic_data = {
        agent_name: semantic.agent_name,
        agent_color: semantic.agent_color,
        agent_initial: semantic.agent_initial,
        verb: semantic.verb,
        object: semantic.object,
        offer_short: semantic.offer_short
      };
    }
  } catch {
  }
  await fetch(`${DASHBOARD_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(1500)
  }).catch(() => {
  });
  if (VALIDATION_TOOLS.includes(input.tool_name) && toolOutputStr && offer) {
    const score = extractScore(input.tool_name, toolOutputStr);
    if (score !== null) {
      const metricsPayload = {
        offer,
        tool: input.tool_name,
        score,
        copy_type: input.tool_input?.copy_type || void 0,
        deliverable: input.tool_input?.deliverable || void 0,
        session_id: sessionId
      };
      await fetch(`${DASHBOARD_URL}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metricsPayload),
        signal: AbortSignal.timeout(1500)
      }).catch(() => {
      });
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DASHBOARD_URL,
  SESSION_DIR,
  TOOL_SPECIFIC_SCORE_PATTERNS,
  TOOL_START_DIR,
  VALIDATION_TOOLS,
  cleanupStaleSessions,
  detectActiveAgent,
  detectOffer,
  detectPhase,
  emitDashboardEvent,
  extractScore,
  getDurationMs,
  getSessionId,
  isMcpTool,
  recordToolStart
});
