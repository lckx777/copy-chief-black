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
var session_handoff_exports = {};
__export(session_handoff_exports, {
  CURRENT_SESSION_FILE: () => CURRENT_SESSION_FILE,
  ECOSYSTEM_ROOT: () => ECOSYSTEM_ROOT,
  LATEST_SESSION_FILE: () => LATEST_SESSION_FILE,
  SESSION_STATE_DIR: () => SESSION_STATE_DIR,
  buildHandoffContent: () => buildHandoffContent,
  detectActiveOffer: () => detectActiveOffer,
  detectCurrentPhase: () => detectCurrentPhase,
  extractDecisions: () => extractDecisions,
  extractPendingTasks: () => extractPendingTasks,
  formatDateTime: () => formatDateTime,
  formatTimestamp: () => formatTimestamp,
  getGitModifiedFiles: () => getGitModifiedFiles,
  getRecentGitLog: () => getRecentGitLog,
  inferNextSteps: () => inferNextSteps,
  pad2: () => pad2,
  processHookEvent: () => processHookEvent,
  readSessionState: () => readSessionState,
  safeExec: () => safeExec
});
module.exports = __toCommonJS(session_handoff_exports);
var import_fs = require("fs");
var import_child_process = require("child_process");
const HOME = process.env.HOME || "/tmp";
const SESSION_STATE_DIR = `${HOME}/.claude/session-state`;
const ECOSYSTEM_ROOT = `${HOME}/copywriting-ecosystem`;
const LATEST_SESSION_FILE = `${SESSION_STATE_DIR}/LATEST-SESSION.md`;
const CURRENT_SESSION_FILE = `${SESSION_STATE_DIR}/current-session.json`;
function safeExec(cmd, cwd) {
  try {
    return (0, import_child_process.execSync)(cmd, {
      cwd: cwd || ECOSYSTEM_ROOT,
      timeout: 3e3,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatDateTime(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatTimestamp(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}
function readSessionState() {
  if (!(0, import_fs.existsSync)(CURRENT_SESSION_FILE)) return {};
  try {
    const raw = (0, import_fs.readFileSync)(CURRENT_SESSION_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function getGitModifiedFiles() {
  const raw = safeExec("git status --short", ECOSYSTEM_ROOT);
  if (!raw) return [];
  return raw.split("\n").filter((l) => l.trim().length > 0).map((l) => l.trim());
}
function getRecentGitLog() {
  const raw = safeExec("git log --oneline -5", ECOSYSTEM_ROOT);
  if (!raw) return [];
  return raw.split("\n").filter((l) => l.trim().length > 0);
}
function detectActiveOffer(state) {
  if (state.activeOffer) return state.activeOffer;
  const allFiles = [...state.filesWritten || [], ...state.filesRead || []];
  const niches = ["saude", "relacionamento", "concursos", "riqueza"];
  for (const f of allFiles) {
    for (const niche of niches) {
      const match = f.match(new RegExp(`${niche}/([^/]+)`));
      if (match) return `${niche}/${match[1]}`;
    }
  }
  return "none detected";
}
function detectCurrentPhase(state) {
  if (state.currentPhase && state.currentPhase !== "idle") {
    return state.currentPhase.toUpperCase();
  }
  if (!state.gatesPassed) return "UNKNOWN";
  const { research, briefing, production } = state.gatesPassed;
  if (production) return "PRODUCTION";
  if (briefing) return "BRIEFING";
  if (research) return "RESEARCH";
  return "SETUP";
}
function extractPendingTasks() {
  const progressPath = `${ECOSYSTEM_ROOT}/progress.md`;
  const taskPlanPath = `${ECOSYSTEM_ROOT}/task_plan.md`;
  const pending = [];
  for (const filePath of [progressPath, taskPlanPath]) {
    if (!(0, import_fs.existsSync)(filePath)) continue;
    try {
      const content = (0, import_fs.readFileSync)(filePath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        const m = line.match(/^[\s*-]*\[\s\]\s+(.+)$/);
        if (m) {
          const task = m[1].trim();
          if (task.length > 0 && pending.length < 10) {
            pending.push(task);
          }
        }
      }
    } catch {
    }
    if (pending.length >= 10) break;
  }
  return pending;
}
function inferNextSteps(state, offer, phase, pending) {
  const steps = [];
  for (const t of pending.slice(0, 3)) {
    steps.push(t);
  }
  if (steps.length < 2) {
    switch (phase) {
      case "PRODUCTION":
        steps.push("Continuar producao de deliverables (VSL/LP/Criativos)");
        steps.push("Rodar blind_critic + emotional_stress_test apos cada bloco");
        break;
      case "BRIEFING":
        steps.push("Continuar fases HELIX");
        steps.push("Validar MUP/MUS via consensus + blind_critic");
        break;
      case "RESEARCH":
        steps.push("Completar research summaries");
        steps.push("Validar research gate");
        break;
      default:
        steps.push("Revisar status do projeto em progress.md");
        steps.push("Identificar proxima tarefa prioritaria");
    }
  }
  return steps.slice(0, 5);
}
function extractDecisions(state) {
  const decisions = [];
  const mcpTools = state.mcpToolsUsed || [];
  if (mcpTools.includes("validate_gate")) {
    decisions.push("Gate de fase validado via validate_gate");
  }
  if (mcpTools.includes("black_validation")) {
    decisions.push("Validacao final executada via black_validation");
  }
  if (mcpTools.includes("consensus")) {
    decisions.push("Decisao tomada via consensus multi-modelo");
  }
  if (mcpTools.includes("blind_critic")) {
    decisions.push("Copy avaliada via blind_critic");
  }
  const gates = state.gatesPassed || {};
  if (gates.research) decisions.push("Research gate: PASSED");
  if (gates.briefing) decisions.push("Briefing gate: PASSED");
  if (gates.production) decisions.push("Production gate: PASSED");
  return decisions;
}
function buildHandoffContent(now, state, offer, phase, modifiedFiles, recentLog, pendingTasks, nextSteps, decisions) {
  const dt = formatDateTime(now);
  const sessionId = state.sessionId || "unknown";
  const modifiedSection = modifiedFiles.length > 0 ? modifiedFiles.map((f) => `- ${f}`).join("\n") : "- (no changes detected)";
  const pendingSection = pendingTasks.length > 0 ? pendingTasks.map((t) => `- [ ] ${t}`).join("\n") : "- (none detected)";
  const nextSection = nextSteps.length > 0 ? nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n") : "1. Revisar progress.md e continuar";
  const decisionsSection = decisions.length > 0 ? decisions.map((d) => `- ${d}`).join("\n") : "- (none recorded)";
  const gitSection = recentLog.length > 0 ? recentLog.map((l) => `- ${l}`).join("\n") : "- (no recent commits)";
  const filesWrittenCount = (state.filesWritten || []).length;
  const filesReadCount = (state.filesRead || []).length;
  const mcpTools = (state.mcpToolsUsed || []).join(", ") || "none";
  return `# Session Handoff \u2014 ${dt}

## Status
- Session: ${sessionId}
- Offer: ${offer}
- Phase: ${phase}
- Files Read: ${filesReadCount} | Files Written: ${filesWrittenCount}
- MCP Tools Used: ${mcpTools}

## Files Modified (git status)
${modifiedSection}

## Recent Commits
${gitSection}

## Pending Tasks
${pendingSection}

## Next Steps
${nextSection}

## Decisions Made
${decisionsSection}

## Resume Command
\`leia progress.md e continue o plano\`

---
*Generated by session-handoff.ts at ${now.toISOString()}*
`;
}
function cleanupOldHandoffs() {
  try {
    const handoffs = (0, import_fs.readdirSync)(SESSION_STATE_DIR).filter((f) => f.startsWith("HANDOFF-") && f.endsWith(".md")).sort().reverse();
    if (handoffs.length > 20) {
      for (const old of handoffs.slice(20)) {
        try {
          (0, import_fs.unlinkSync)(`${SESSION_STATE_DIR}/${old}`);
        } catch {
        }
      }
    }
  } catch {
  }
}
async function processHookEvent(input) {
  if (!(0, import_fs.existsSync)(SESSION_STATE_DIR)) {
    (0, import_fs.mkdirSync)(SESSION_STATE_DIR, { recursive: true });
  }
  const now = /* @__PURE__ */ new Date();
  const state = readSessionState();
  const offer = detectActiveOffer(state);
  const phase = detectCurrentPhase(state);
  const modifiedFiles = getGitModifiedFiles();
  const recentLog = getRecentGitLog();
  const pendingTasks = extractPendingTasks();
  const nextSteps = inferNextSteps(state, offer, phase, pendingTasks);
  const decisions = extractDecisions(state);
  const content = buildHandoffContent(
    now,
    state,
    offer,
    phase,
    modifiedFiles,
    recentLog,
    pendingTasks,
    nextSteps,
    decisions
  );
  (0, import_fs.writeFileSync)(LATEST_SESSION_FILE, content, "utf-8");
  const ts = formatTimestamp(now);
  const handoffFile = `${SESSION_STATE_DIR}/HANDOFF-${ts}.md`;
  (0, import_fs.writeFileSync)(handoffFile, content, "utf-8");
  cleanupOldHandoffs();
  return { handoffFile, offer, phase, pendingCount: pendingTasks.length };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CURRENT_SESSION_FILE,
  ECOSYSTEM_ROOT,
  LATEST_SESSION_FILE,
  SESSION_STATE_DIR,
  buildHandoffContent,
  detectActiveOffer,
  detectCurrentPhase,
  extractDecisions,
  extractPendingTasks,
  formatDateTime,
  formatTimestamp,
  getGitModifiedFiles,
  getRecentGitLog,
  inferNextSteps,
  pad2,
  processHookEvent,
  readSessionState,
  safeExec
});
