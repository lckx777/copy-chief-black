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
var offer_state_exports = {};
__export(offer_state_exports, {
  HELIX_REQUIRED_TOOLS: () => HELIX_REQUIRED_TOOLS,
  TOOL_DISPLAY_NAMES: () => TOOL_DISPLAY_NAMES,
  canWriteHelixPhase: () => canWriteHelixPhase,
  createOfferState: () => createOfferState,
  detectOfferFromPath: () => detectOfferFromPath,
  detectPhaseFromPath: () => detectPhaseFromPath,
  getCompletedPhases: () => getCompletedPhases,
  getOfferState: () => getOfferState,
  getOfferStatePath: () => getOfferStatePath,
  hasOfferState: () => hasOfferState,
  markPhaseComplete: () => markPhaseComplete,
  normalizeToolName: () => normalizeToolName,
  recordToolUseInPhase: () => recordToolUseInPhase,
  saveOfferState: () => saveOfferState,
  syncOfferStateWithFiles: () => syncOfferStateWithFiles,
  validatePhaseFileHeader: () => validatePhaseFileHeader
});
module.exports = __toCommonJS(offer_state_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_yaml = require("yaml");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
const TEMPLATE_PATH = (0, import_path.join)(process.env.HOME, ".claude", "templates", "helix-state-template.yaml");
const HELIX_REQUIRED_TOOLS = {
  1: ["get_phase_context"],
  2: ["get_phase_context"],
  3: ["get_phase_context", "voc_search"],
  4: ["get_phase_context", "voc_search"],
  5: ["get_phase_context", "voc_search", "consensus", "blind_critic"],
  6: ["get_phase_context", "blind_critic", "emotional_stress_test"],
  7: ["get_phase_context"],
  8: ["get_phase_context"],
  9: ["get_phase_context"],
  10: ["get_phase_context", "validate_gate"]
};
const TOOL_DISPLAY_NAMES = {
  "get_phase_context": "mcp__copywriting__get_phase_context",
  "voc_search": "mcp__copywriting__voc_search",
  "consensus": "mcp__zen__consensus",
  "blind_critic": "mcp__copywriting__blind_critic",
  "emotional_stress_test": "mcp__copywriting__emotional_stress_test",
  "validate_gate": "mcp__copywriting__validate_gate",
  "sequential_thinking": "mcp__sequential-thinking__sequentialthinking",
  "thinkdeep": "mcp__zen__thinkdeep"
};
function detectOfferFromPath(filePath) {
  const patterns = [
    // concursos/gabaritando-portugues/briefings/...
    /([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i,
    // concursos/gabaritando-portugues/...
    /copywriting-ecosystem\/([^/]+\/[^/]+)\//i
  ];
  for (const pattern of patterns) {
    const match = filePath.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}
function getOfferStatePath(offerPath) {
  return (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
}
function hasOfferState(offerPath) {
  return (0, import_fs.existsSync)(getOfferStatePath(offerPath));
}
function createOfferState(offerPath) {
  const statePath = getOfferStatePath(offerPath);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const state = {
    offer_path: offerPath,
    created_at: now,
    updated_at: now,
    workflow_phase: "idle",
    gates: {
      research: { passed: false },
      briefing: { passed: false, phases_completed: 0 },
      production: { passed: false }
    },
    helix_phases: {},
    mecanismo: {
      state: "UNDEFINED",
      mup_validated: false,
      mus_validated: false
    },
    validation_history: [],
    metadata: {
      version: "1.0.0",
      total_sessions: 0
    }
  };
  for (let i = 1; i <= 10; i++) {
    const required = HELIX_REQUIRED_TOOLS[i] || ["get_phase_context"];
    state.helix_phases[`phase_${i}`] = {
      status: "not_started",
      tools_used: [],
      tools_required: required,
      tools_missing: [...required]
    };
  }
  const dir = (0, import_path.dirname)(statePath);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  (0, import_fs.writeFileSync)(statePath, (0, import_yaml.stringify)(state));
  return state;
}
function getOfferState(offerPath) {
  const statePath = getOfferStatePath(offerPath);
  if (!(0, import_fs.existsSync)(statePath)) {
    return createOfferState(offerPath);
  }
  try {
    const content = (0, import_fs.readFileSync)(statePath, "utf-8");
    const state = (0, import_yaml.parse)(content);
    if (!state.helix_phases) {
      state.helix_phases = {};
    }
    for (let i = 1; i <= 10; i++) {
      const key = `phase_${i}`;
      if (!state.helix_phases[key]) {
        const required = HELIX_REQUIRED_TOOLS[i] || ["get_phase_context"];
        state.helix_phases[key] = {
          status: "not_started",
          tools_used: [],
          tools_required: required,
          tools_missing: [...required]
        };
      }
    }
    return state;
  } catch (error) {
    console.error(`[OFFER-STATE] Erro ao ler ${statePath}: ${error}`);
    return createOfferState(offerPath);
  }
}
function saveOfferState(state) {
  const statePath = getOfferStatePath(state.offer_path);
  state.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(statePath, (0, import_yaml.stringify)(state));
}
function recordToolUseInPhase(offerPath, phase, toolName) {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;
  if (!state.helix_phases[phaseKey]) {
    return;
  }
  const phaseState = state.helix_phases[phaseKey];
  const normalizedTool = normalizeToolName(toolName);
  if (!phaseState.tools_used.includes(normalizedTool)) {
    phaseState.tools_used.push(normalizedTool);
  }
  phaseState.tools_missing = phaseState.tools_required.filter(
    (t) => !phaseState.tools_used.includes(t)
  );
  if (phaseState.status === "not_started") {
    phaseState.status = "in_progress";
    phaseState.started_at = (/* @__PURE__ */ new Date()).toISOString();
  }
  state.validation_history.push({
    tool: normalizedTool,
    phase,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    result: "passed"
  });
  saveOfferState(state);
}
function normalizeToolName(toolName) {
  const match = toolName.match(/mcp__[^_]+__(.+)/);
  if (match) {
    return match[1];
  }
  return toolName;
}
function canWriteHelixPhase(offerPath, phase) {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;
  const phaseState = state.helix_phases[phaseKey];
  if (!phaseState) {
    return { allowed: true };
  }
  const missingTools = phaseState.tools_missing;
  if (missingTools.length > 0) {
    const missingDisplay = missingTools.map(
      (t) => TOOL_DISPLAY_NAMES[t] || t
    );
    return {
      allowed: false,
      reason: `Ferramentas obrigat\xF3rias n\xE3o usadas para Fase ${phase}:
${missingDisplay.map((t) => `  - ${t}`).join("\n")}

Ferramentas j\xE1 usadas: ${phaseState.tools_used.length > 0 ? phaseState.tools_used.join(", ") : "(nenhuma)"}`,
      missingTools
    };
  }
  return { allowed: true };
}
function markPhaseComplete(offerPath, phase) {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;
  if (state.helix_phases[phaseKey]) {
    state.helix_phases[phaseKey].status = "completed";
    state.helix_phases[phaseKey].completed_at = (/* @__PURE__ */ new Date()).toISOString();
    const completedCount = Object.values(state.helix_phases).filter(
      (p) => p.status === "completed"
    ).length;
    state.gates.briefing.phases_completed = completedCount;
    saveOfferState(state);
  }
}
function getCompletedPhases(offerPath) {
  const state = getOfferState(offerPath);
  const completed = [];
  for (let i = 1; i <= 10; i++) {
    const phaseKey = `phase_${i}`;
    if (state.helix_phases[phaseKey]?.status === "completed") {
      completed.push(i);
    }
  }
  return completed;
}
function validatePhaseFileHeader(filePath) {
  if (!(0, import_fs.existsSync)(filePath)) {
    return { valid: true, toolsFound: [] };
  }
  try {
    const content = (0, import_fs.readFileSync)(filePath, "utf-8");
    const headerMatch = content.match(
      />\s*\*\*Ferramentas usadas:\*\*\s*([^\n]+)/i
    );
    if (!headerMatch) {
      return {
        valid: false,
        toolsFound: [],
        reason: 'Header "Ferramentas usadas" n\xE3o encontrado no arquivo'
      };
    }
    const toolsLine = headerMatch[1];
    const toolsFound = [];
    const toolMatches = toolsLine.matchAll(/(\w+)\s*✅/g);
    for (const match of toolMatches) {
      toolsFound.push(match[1]);
    }
    return { valid: true, toolsFound };
  } catch (error) {
    return { valid: false, toolsFound: [], reason: `Erro ao ler arquivo: ${error}` };
  }
}
function detectPhaseFromPath(filePath) {
  const match = filePath.match(/phase-0?(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
function syncOfferStateWithFiles(offerPath) {
  const state = getOfferState(offerPath);
  const phasesDir = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "briefings", "phases");
  if (!(0, import_fs.existsSync)(phasesDir)) {
    return;
  }
  for (let i = 1; i <= 10; i++) {
    const possibleNames = [
      `phase-${String(i).padStart(2, "0")}-`,
      `phase-${i}-`,
      `fase-${String(i).padStart(2, "0")}-`,
      `fase-${i}-`
    ];
    for (const prefix of possibleNames) {
      const files = (0, import_fs.existsSync)(phasesDir) ? require("fs").readdirSync(phasesDir) : [];
      const phaseFile = files.find(
        (f) => f.toLowerCase().startsWith(prefix.toLowerCase()) && f.endsWith(".md")
      );
      if (phaseFile) {
        const filePath = (0, import_path.join)(phasesDir, phaseFile);
        const phaseKey = `phase_${i}`;
        const headerValidation = validatePhaseFileHeader(filePath);
        if (state.helix_phases[phaseKey]) {
          state.helix_phases[phaseKey].file_path = filePath;
          if (headerValidation.valid && headerValidation.toolsFound.length > 0) {
            for (const tool of headerValidation.toolsFound) {
              const normalized = normalizeToolName(tool);
              if (!state.helix_phases[phaseKey].tools_used.includes(normalized)) {
                state.helix_phases[phaseKey].tools_used.push(normalized);
              }
            }
            state.helix_phases[phaseKey].tools_missing = state.helix_phases[phaseKey].tools_required.filter(
              (t) => !state.helix_phases[phaseKey].tools_used.includes(t)
            );
          }
          if (state.helix_phases[phaseKey].status === "not_started") {
            state.helix_phases[phaseKey].status = "completed";
          }
        }
        break;
      }
    }
  }
  saveOfferState(state);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HELIX_REQUIRED_TOOLS,
  TOOL_DISPLAY_NAMES,
  canWriteHelixPhase,
  createOfferState,
  detectOfferFromPath,
  detectPhaseFromPath,
  getCompletedPhases,
  getOfferState,
  getOfferStatePath,
  hasOfferState,
  markPhaseComplete,
  normalizeToolName,
  recordToolUseInPhase,
  saveOfferState,
  syncOfferStateWithFiles,
  validatePhaseFileHeader
});
