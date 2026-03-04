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
var state_machine_exports = {};
__export(state_machine_exports, {
  REQUIRED_TOOLS: () => REQUIRED_TOOLS,
  canTransition: () => canTransition,
  canWriteToPath: () => canWriteToPath,
  checkStuck: () => checkStuck,
  createMachine: () => createMachine,
  detectOffer: () => detectOffer,
  detectPhaseFromPath: () => detectPhaseFromPath,
  getMissingTools: () => getMissingTools,
  getSession: () => getSession,
  incrementSessionCount: () => incrementSessionCount,
  loadMachine: () => loadMachine,
  recordGateBlocked: () => recordGateBlocked,
  recordGatePassed: () => recordGatePassed,
  recordTool: () => recordTool,
  saveMachine: () => saveMachine,
  saveSession: () => saveSession,
  transition: () => transition
});
module.exports = __toCommonJS(state_machine_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_yaml = require("yaml");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
const STATE_DIR = (0, import_path.join)(process.env.HOME, ".claude", "session-state");
const SESSION_FILE = (0, import_path.join)(STATE_DIR, "current-session.json");
const VALID_TRANSITIONS = {
  IDLE: ["RESEARCH"],
  RESEARCH: ["BRIEFING"],
  BRIEFING: ["PRODUCTION"],
  PRODUCTION: ["REVIEW"],
  REVIEW: ["DELIVERED", "PRODUCTION"],
  // Can go back for fixes
  DELIVERED: ["IDLE"]
  // Start new offer
};
const TRANSITION_PRECONDITIONS = {
  "RESEARCH\u2192BRIEFING": (m) => ({
    ok: m.gates.research.passed,
    reason: 'Research gate must PASS via validate_gate("research") first'
  }),
  "BRIEFING\u2192PRODUCTION": (m) => ({
    ok: m.gates.briefing.passed && ["VALIDATED", "APPROVED"].includes(m.mecanismo.state),
    reason: `Briefing gate must PASS and mecanismo must be VALIDATED/APPROVED (current: ${m.mecanismo.state})`
  }),
  "PRODUCTION\u2192REVIEW": (m) => {
    const hasBlind = m.tools_by_phase.production?.includes("blind_critic");
    const hasStress = m.tools_by_phase.production?.includes("emotional_stress_test");
    return {
      ok: hasBlind && hasStress,
      reason: "blind_critic and emotional_stress_test must be run in production phase"
    };
  },
  "REVIEW\u2192DELIVERED": (m) => ({
    ok: m.gates.production.passed && (m.gates.production.score ?? 0) >= 8,
    reason: `black_validation score must be >= 8 (current: ${m.gates.production.score ?? "none"})`
  })
};
const REQUIRED_TOOLS = {
  IDLE: [],
  RESEARCH: ["firecrawl_agent", "voc_search"],
  BRIEFING: ["get_phase_context"],
  PRODUCTION: ["blind_critic", "emotional_stress_test"],
  REVIEW: ["black_validation"],
  DELIVERED: []
};
function getStatePath(offerPath) {
  return (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
}
function loadMachine(offerPath) {
  const statePath = getStatePath(offerPath);
  if ((0, import_fs.existsSync)(statePath)) {
    try {
      const raw = (0, import_yaml.parse)((0, import_fs.readFileSync)(statePath, "utf-8"));
      return migrateState(raw, offerPath);
    } catch {
    }
  }
  return createMachine(offerPath);
}
function createMachine(offerPath) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const machine = {
    offer_path: offerPath,
    phase: "IDLE",
    created_at: now,
    updated_at: now,
    session_count: 0,
    gates: {
      research: { passed: false },
      briefing: { passed: false, phases_completed: 0 },
      production: { passed: false }
    },
    tools_by_phase: {},
    gate_history: [],
    mecanismo: { state: "UNDEFINED", mup_validated: false, mus_validated: false },
    consecutive_sessions_same_phase: 0
  };
  saveMachine(machine);
  return machine;
}
function saveMachine(machine) {
  const statePath = getStatePath(machine.offer_path);
  machine.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  const dir = (0, import_path.dirname)(statePath);
  if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
  (0, import_fs.writeFileSync)(statePath, (0, import_yaml.stringify)(machine));
}
function canTransition(machine, targetPhase) {
  const validTargets = VALID_TRANSITIONS[machine.phase];
  if (!validTargets?.includes(targetPhase)) {
    return { ok: false, reason: `Invalid transition: ${machine.phase} \u2192 ${targetPhase}. Valid: ${validTargets?.join(", ")}` };
  }
  const key = `${machine.phase}\u2192${targetPhase}`;
  const precondition = TRANSITION_PRECONDITIONS[key];
  if (precondition) {
    return precondition(machine);
  }
  return { ok: true };
}
function transition(machine, targetPhase) {
  const check = canTransition(machine, targetPhase);
  if (!check.ok) return check;
  machine.phase = targetPhase;
  machine.last_phase_change_at = (/* @__PURE__ */ new Date()).toISOString();
  machine.consecutive_sessions_same_phase = 0;
  saveMachine(machine);
  return { ok: true };
}
function recordGatePassed(machine, gate, details) {
  machine.gates[gate].passed = true;
  machine.gates[gate].passed_at = (/* @__PURE__ */ new Date()).toISOString();
  machine.gate_history.push({
    type: gate,
    result: "PASSED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details
  });
  const gateToPhase = {
    research: "BRIEFING",
    briefing: "PRODUCTION",
    production: "DELIVERED"
  };
  const target = gateToPhase[gate];
  if (target && VALID_TRANSITIONS[machine.phase]?.includes(target)) {
    machine.phase = target;
    machine.last_phase_change_at = (/* @__PURE__ */ new Date()).toISOString();
    machine.consecutive_sessions_same_phase = 0;
  }
  saveMachine(machine);
}
function recordGateBlocked(machine, gate, details) {
  machine.gate_history.push({
    type: gate,
    result: "BLOCKED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    details
  });
  saveMachine(machine);
}
function recordTool(machine, toolName) {
  const phase = machine.phase.toLowerCase();
  if (!machine.tools_by_phase[phase]) {
    machine.tools_by_phase[phase] = [];
  }
  const normalized = toolName.replace(/^mcp__[^_]+__/, "");
  if (!machine.tools_by_phase[phase].includes(normalized)) {
    machine.tools_by_phase[phase].push(normalized);
  }
  saveMachine(machine);
}
function getMissingTools(machine) {
  const required = REQUIRED_TOOLS[machine.phase] || [];
  const used = machine.tools_by_phase[machine.phase.toLowerCase()] || [];
  return required.filter((t) => !used.includes(t));
}
function canWriteToPath(filePath) {
  const offerPath = detectOffer(filePath);
  if (!offerPath) return { allowed: true, source: "no-offer" };
  const isResearch = /research\//i.test(filePath);
  const isBriefing = /briefings?\//i.test(filePath);
  const isProduction = /production\//i.test(filePath);
  if (isResearch) return { allowed: true, source: "research-always-allowed" };
  const machine = loadMachine(offerPath);
  if (isBriefing) {
    if (machine.gates.research.passed) return { allowed: true, source: "gate" };
    if (hasResearchFiles(offerPath)) return { allowed: true, source: "heuristic" };
    return {
      allowed: false,
      reason: `Research gate not passed for "${offerPath}". Run validate_gate("research") first.`,
      source: "blocked"
    };
  }
  if (isProduction) {
    if (machine.gates.briefing.passed) return { allowed: true, source: "gate" };
    if (hasBriefingFiles(offerPath)) return { allowed: true, source: "heuristic" };
    return {
      allowed: false,
      reason: `Briefing gate not passed for "${offerPath}". Run validate_gate("briefing") first.`,
      source: "blocked"
    };
  }
  return { allowed: true, source: "default" };
}
function checkStuck(machine) {
  if (machine.consecutive_sessions_same_phase >= 3) {
    return `\u26A0\uFE0F Stuck: ${machine.consecutive_sessions_same_phase} sessions in ${machine.phase}. Missing: ${getMissingTools(machine).join(", ") || "none"}.`;
  }
  return null;
}
function incrementSessionCount(machine) {
  machine.session_count++;
  machine.consecutive_sessions_same_phase++;
  saveMachine(machine);
}
function detectOffer(filePath) {
  const match = filePath.match(/([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i) || filePath.match(/copywriting-ecosystem\/([^/]+\/[^/]+)\//i);
  return match ? match[1] : null;
}
function detectPhaseFromPath(filePath) {
  if (/research\//i.test(filePath)) return "RESEARCH";
  if (/briefings?\//i.test(filePath)) return "BRIEFING";
  if (/production\//i.test(filePath)) return "PRODUCTION";
  return "IDLE";
}
function hasResearchFiles(offerPath) {
  const base = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath);
  return (0, import_fs.existsSync)((0, import_path.join)(base, "research", "synthesis.md")) || (0, import_fs.existsSync)((0, import_path.join)(base, "research", "voc", "summary.md"));
}
function hasBriefingFiles(offerPath) {
  const phasesDir = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "briefings", "phases");
  if (!(0, import_fs.existsSync)(phasesDir)) return false;
  try {
    const files = (0, import_fs.readdirSync)(phasesDir).filter((f) => f.endsWith(".md"));
    return files.length >= 10;
  } catch {
    return false;
  }
}
function migrateState(raw, offerPath) {
  if (raw.phase && raw.tools_by_phase !== void 0) {
    return raw;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const machine = {
    offer_path: offerPath,
    phase: mapOldPhase(raw.workflow_phase || raw.currentPhase || "idle"),
    created_at: raw.created_at || now,
    updated_at: now,
    session_count: raw.metadata?.total_sessions || 0,
    gates: {
      research: { passed: raw.gates?.research?.passed || false, passed_at: raw.gates?.research?.passed_at },
      briefing: { passed: raw.gates?.briefing?.passed || false, passed_at: raw.gates?.briefing?.passed_at, phases_completed: raw.gates?.briefing?.phases_completed || 0 },
      production: { passed: raw.gates?.production?.passed || false, passed_at: raw.gates?.production?.passed_at, score: raw.gates?.production?.black_validation_score }
    },
    tools_by_phase: raw.toolsUsedByPhase || raw.tools_by_phase || {},
    gate_history: raw.gate_history || raw.gateHistory || [],
    mecanismo: raw.mecanismo || { state: "UNDEFINED", mup_validated: false, mus_validated: false },
    consecutive_sessions_same_phase: 0
  };
  return machine;
}
function mapOldPhase(old) {
  const map = {
    idle: "IDLE",
    research: "RESEARCH",
    briefing: "BRIEFING",
    production: "PRODUCTION",
    review: "REVIEW",
    delivered: "DELIVERED"
  };
  return map[old.toLowerCase()] || "IDLE";
}
function getSession() {
  if (!(0, import_fs.existsSync)(STATE_DIR)) (0, import_fs.mkdirSync)(STATE_DIR, { recursive: true });
  if ((0, import_fs.existsSync)(SESSION_FILE)) {
    try {
      const raw = JSON.parse((0, import_fs.readFileSync)(SESSION_FILE, "utf-8"));
      const last = new Date(raw.lastActivity || 0);
      if (Date.now() - last.getTime() < 2 * 60 * 60 * 1e3) {
        return {
          sessionId: raw.sessionId,
          startedAt: raw.startedAt,
          lastActivity: raw.lastActivity,
          activeOffer: raw.activeOffer || null,
          currentPhase: mapOldPhase(raw.currentPhase || "idle"),
          mcpToolsUsed: raw.mcpToolsUsed || []
        };
      }
    } catch {
    }
  }
  const session = {
    sessionId: crypto.randomUUID(),
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastActivity: (/* @__PURE__ */ new Date()).toISOString(),
    activeOffer: null,
    currentPhase: "IDLE",
    mcpToolsUsed: []
  };
  (0, import_fs.writeFileSync)(SESSION_FILE, JSON.stringify(session, null, 2));
  return session;
}
function saveSession(session) {
  session.lastActivity = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(SESSION_FILE, JSON.stringify(session, null, 2));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  REQUIRED_TOOLS,
  canTransition,
  canWriteToPath,
  checkStuck,
  createMachine,
  detectOffer,
  detectPhaseFromPath,
  getMissingTools,
  getSession,
  incrementSessionCount,
  loadMachine,
  recordGateBlocked,
  recordGatePassed,
  recordTool,
  saveMachine,
  saveSession,
  transition
});
