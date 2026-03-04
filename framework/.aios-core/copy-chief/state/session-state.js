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
var session_state_exports = {};
__export(session_state_exports, {
  HELIX_PHASE_NAMES: () => import_helix_requirements.HELIX_PHASE_NAMES,
  HELIX_PHASE_RECOMMENDED: () => import_helix_requirements.HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_REQUIREMENTS: () => import_helix_requirements.HELIX_PHASE_REQUIREMENTS,
  areAllHelixPhasesComplete: () => areAllHelixPhasesComplete,
  canWriteHelixPhase: () => canWriteHelixPhase,
  canWriteToPath: () => canWriteToPath,
  createNewSession: () => createNewSession,
  detectCurrentHelixPhase: () => detectCurrentHelixPhase,
  getActiveOffer: () => getActiveOffer,
  getCompletedHelixPhases: () => getCompletedHelixPhases,
  getCurrentPhase: () => getCurrentPhase,
  getGatesStatus: () => getGatesStatus,
  getHelixPhaseName: () => getHelixPhaseName,
  getMcpToolsUsed: () => getMcpToolsUsed,
  getMissingRequiredTools: () => getMissingRequiredTools,
  getRequiredMcpToolsForPhase: () => getRequiredMcpToolsForPhase,
  getRequiredReadings: () => getRequiredReadings,
  getSessionState: () => getSessionState,
  getToolsUsedInPhase: () => getToolsUsedInPhase,
  getValidationStatus: () => getValidationStatus,
  hasGatePassed: () => hasGatePassed,
  hasMinimumReasoningDepth: () => hasMinimumReasoningDepth,
  hasPassedFullValidation: () => hasPassedFullValidation,
  hasPassedProductionValidation: () => hasPassedProductionValidation,
  hasReadMethodology: () => hasReadMethodology,
  hasUsedSequentialThinking: () => hasUsedSequentialThinking,
  markPlanCreated: () => markPlanCreated,
  recordBlackValidationScore: () => recordBlackValidationScore,
  recordFileRead: () => recordFileRead,
  recordFileWrite: () => recordFileWrite,
  recordGateBlocked: () => recordGateBlocked,
  recordGatePassed: () => recordGatePassed,
  recordHelixPhaseComplete: () => recordHelixPhaseComplete,
  recordMcpToolUse: () => recordMcpToolUse,
  recordSequentialThinking: () => recordSequentialThinking,
  recordToolInPhase: () => recordToolInPhase,
  resetGatesForNewOffer: () => resetGatesForNewOffer,
  saveSessionState: () => saveSessionState,
  setActiveOffer: () => setActiveOffer,
  setCurrentPhase: () => setCurrentPhase
});
module.exports = __toCommonJS(session_state_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_helix_requirements = require("../workflow/helix-requirements");
const STATE_DIR = (0, import_path.join)(process.env.HOME, ".claude", "session-state");
const STATE_FILE = (0, import_path.join)(STATE_DIR, "current-session.json");
function ensureStateDir() {
  if (!(0, import_fs.existsSync)(STATE_DIR)) {
    (0, import_fs.mkdirSync)(STATE_DIR, { recursive: true });
  }
}
function getSessionState() {
  ensureStateDir();
  if (!(0, import_fs.existsSync)(STATE_FILE)) {
    return createNewSession();
  }
  try {
    const state = JSON.parse((0, import_fs.readFileSync)(STATE_FILE, "utf-8"));
    const lastActivity = new Date(state.lastActivity);
    const now = /* @__PURE__ */ new Date();
    const twoHoursMs = 2 * 60 * 60 * 1e3;
    if (now.getTime() - lastActivity.getTime() > twoHoursMs) {
      return createNewSession();
    }
    if (!state.gatesPassed) {
      state.gatesPassed = { research: false, briefing: false, production: false };
    }
    if (!state.gateHistory) {
      state.gateHistory = [];
    }
    if (!state.toolsUsedByPhase) {
      state.toolsUsedByPhase = { research: [], briefing: [], production: [] };
    }
    if (!state.copyValidations) {
      state.copyValidations = { blind_critic: false, emotional_stress_test: false, black_validation_score: null };
    }
    if (state.activeOffer === void 0) {
      state.activeOffer = null;
    }
    return state;
  } catch {
    return createNewSession();
  }
}
function createNewSession() {
  const state = {
    // Identificação
    sessionId: crypto.randomUUID(),
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastActivity: (/* @__PURE__ */ new Date()).toISOString(),
    // v7.0: State Machine
    activeOffer: null,
    currentPhase: "idle",
    // v7.0: Gates
    gatesPassed: {
      research: false,
      briefing: false,
      production: false
    },
    // v7.0: Histórico
    gateHistory: [],
    // v7.0: Tools por fase
    toolsUsedByPhase: {
      research: [],
      briefing: [],
      production: []
    },
    // Tracking de arquivos
    filesRead: [],
    filesWritten: [],
    // Metodologia
    methodologyLoaded: false,
    frameworksConsulted: [],
    reasoningDepth: 0,
    planCreated: false,
    sequentialThinkingUsed: false,
    // v6.9: Tool tracking (compatibilidade)
    mcpToolsUsed: [],
    validationsPassed: {
      blind_critic: false,
      emotional_stress_test: false,
      layered_review: false,
      black_validation: false,
      validate_gate: false,
      consensus: false
    },
    // v7.0: Copy validations
    copyValidations: {
      blind_critic: false,
      emotional_stress_test: false,
      black_validation_score: null
    }
  };
  saveSessionState(state);
  return state;
}
function saveSessionState(state) {
  ensureStateDir();
  state.lastActivity = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(STATE_FILE, JSON.stringify(state, null, 2));
}
function setActiveOffer(offerPath) {
  const state = getSessionState();
  state.activeOffer = offerPath;
  if (state.currentPhase === "idle") {
    state.currentPhase = "research";
  }
  saveSessionState(state);
}
function getActiveOffer() {
  return getSessionState().activeOffer;
}
function recordGatePassed(gateType, details) {
  const state = getSessionState();
  state.gatesPassed[gateType] = true;
  state.gateHistory.push({
    type: gateType,
    result: "PASSED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    offer: state.activeOffer || void 0,
    details
  });
  const phaseTransitions = {
    research: "briefing",
    briefing: "production",
    production: "delivered"
  };
  state.currentPhase = phaseTransitions[gateType];
  saveSessionState(state);
}
function recordGateBlocked(gateType, details) {
  const state = getSessionState();
  state.gateHistory.push({
    type: gateType,
    result: "BLOCKED",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    offer: state.activeOffer || void 0,
    details
  });
  saveSessionState(state);
}
function hasGatePassed(gateType) {
  return getSessionState().gatesPassed[gateType];
}
function canWriteToPath(filePath) {
  const state = getSessionState();
  const isBriefingPath = /briefings?\//i.test(filePath);
  const isProductionPath = /production\//i.test(filePath);
  const isResearchPath = /research\//i.test(filePath);
  if (isResearchPath) {
    return { allowed: true };
  }
  if (isBriefingPath) {
    if (!state.gatesPassed.research) {
      return {
        allowed: false,
        reason: `Research gate n\xE3o passou. Execute validate_gate('research', '${state.activeOffer || "[oferta]"}') primeiro.`,
        requiredGate: "research"
      };
    }
    return { allowed: true };
  }
  if (isProductionPath) {
    if (!state.gatesPassed.briefing) {
      return {
        allowed: false,
        reason: `Briefing gate n\xE3o passou. Execute validate_gate('briefing', '${state.activeOffer || "[oferta]"}') primeiro.`,
        requiredGate: "briefing"
      };
    }
    return { allowed: true };
  }
  return { allowed: true };
}
function recordToolInPhase(toolName) {
  const state = getSessionState();
  const phase = state.currentPhase;
  if (phase === "idle" || phase === "delivered") {
    return;
  }
  if (!state.toolsUsedByPhase[phase].includes(toolName)) {
    state.toolsUsedByPhase[phase].push(toolName);
  }
  saveSessionState(state);
}
function getToolsUsedInPhase(phase) {
  return getSessionState().toolsUsedByPhase[phase];
}
function recordBlackValidationScore(score) {
  const state = getSessionState();
  state.copyValidations.black_validation_score = score;
  if (score >= 8) {
    state.gatesPassed.production = true;
    state.gateHistory.push({
      type: "production",
      result: "PASSED",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      offer: state.activeOffer || void 0,
      details: `black_validation score: ${score}/10`
    });
    state.currentPhase = "delivered";
  }
  saveSessionState(state);
}
function resetGatesForNewOffer(offerPath) {
  const state = getSessionState();
  state.activeOffer = offerPath;
  state.currentPhase = "research";
  state.gatesPassed = {
    research: false,
    briefing: false,
    production: false
  };
  state.toolsUsedByPhase = {
    research: [],
    briefing: [],
    production: []
  };
  state.copyValidations = {
    blind_critic: false,
    emotional_stress_test: false,
    black_validation_score: null
  };
  saveSessionState(state);
}
function getGatesStatus() {
  return getSessionState().gatesPassed;
}
function getCurrentPhase() {
  return getSessionState().currentPhase;
}
function recordFileRead(filePath) {
  const state = getSessionState();
  const normalizedPath = filePath.replace(/^\.\//, "");
  if (!state.filesRead.includes(normalizedPath)) {
    state.filesRead.push(normalizedPath);
  }
  const methodologyPatterns = [
    /skills\/.*\/(SKILL|methodology|framework|principles)/i,
    /skills\/.*\/references\//i,
    /RMBC|DRE|Puzzle.*Pieces|MUP|MUS/i,
    /metodologia|principios|formulas/i,
    /references\/(core|fundamentos|templates)/i,
    /helix.*system/i,
    /copy-fundamentals\/vitais\//i,
    /psicologia-persuasao/i,
    /estrutura-mecanismo/i,
    /principios-escrita/i,
    /erros-fatais/i
  ];
  const isMethodologyFile = methodologyPatterns.some((p) => p.test(normalizedPath));
  if (isMethodologyFile) {
    state.methodologyLoaded = true;
    if (!state.frameworksConsulted.includes(normalizedPath)) {
      state.frameworksConsulted.push(normalizedPath);
    }
    const isVital = /copy-fundamentals\/vitais\//i.test(normalizedPath);
    const isFundamental = /fundamentos|principios|core/i.test(normalizedPath);
    const increment = isVital ? 0.3 : isFundamental ? 0.25 : 0.15;
    state.reasoningDepth = Math.min(1, state.reasoningDepth + increment);
  }
  saveSessionState(state);
}
function hasReadMethodology() {
  const state = getSessionState();
  return state.methodologyLoaded && state.frameworksConsulted.length > 0;
}
function hasMinimumReasoningDepth(threshold = 0.6) {
  return getSessionState().reasoningDepth >= threshold;
}
function getRequiredReadings(taskType = "default") {
  const taskReadings = {
    "origin-story": [
      "skills/helix-system-agent/references/core/RMBC.md",
      "skills/helix-system-agent/references/fundamentos/principios_fundamentais.md"
    ],
    "headline": [
      "skills/criativos-agent/references/headline-formulas.md",
      "skills/helix-system-agent/references/fundamentos/puzzle_pieces.md"
    ],
    "copy": [
      "skills/helix-system-agent/SKILL.md",
      "skills/helix-system-agent/references/core/metodologias.md"
    ],
    "default": [
      "skills/helix-system-agent/SKILL.md"
    ]
  };
  return taskReadings[taskType] || taskReadings["default"];
}
function markPlanCreated() {
  const state = getSessionState();
  state.planCreated = true;
  saveSessionState(state);
}
function recordSequentialThinking() {
  const state = getSessionState();
  state.sequentialThinkingUsed = true;
  state.reasoningDepth = Math.min(1, state.reasoningDepth + 0.2);
  saveSessionState(state);
}
function hasUsedSequentialThinking() {
  return getSessionState().sequentialThinkingUsed;
}
function recordMcpToolUse(toolName) {
  const state = getSessionState();
  if (!state.mcpToolsUsed.includes(toolName)) {
    state.mcpToolsUsed.push(toolName);
  }
  const validationMap = {
    "mcp__copywriting__blind_critic": "blind_critic",
    "mcp__copywriting__emotional_stress_test": "emotional_stress_test",
    "mcp__copywriting__layered_review": "layered_review",
    "mcp__copywriting__black_validation": "black_validation",
    "mcp__copywriting__validate_gate": "validate_gate",
    "mcp__zen__consensus": "consensus"
  };
  const validationKey = validationMap[toolName];
  if (validationKey) {
    state.validationsPassed[validationKey] = true;
  }
  recordToolInPhase(toolName);
  saveSessionState(state);
}
function recordFileWrite(filePath) {
  const state = getSessionState();
  if (!state.filesWritten.includes(filePath)) {
    state.filesWritten.push(filePath);
  }
  if (!state.activeOffer) {
    const offerMatch = filePath.match(/([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i);
    if (offerMatch) {
      state.activeOffer = offerMatch[1];
    }
  }
  if (state.currentPhase === "idle") {
    if (/research\//i.test(filePath)) {
      state.currentPhase = "research";
    }
  }
  saveSessionState(state);
}
function setCurrentPhase(phase) {
  const state = getSessionState();
  state.currentPhase = phase;
  saveSessionState(state);
}
function getMcpToolsUsed() {
  return getSessionState().mcpToolsUsed;
}
function getValidationStatus() {
  return getSessionState().validationsPassed;
}
function hasPassedProductionValidation() {
  const validations = getValidationStatus();
  return validations.blind_critic && validations.emotional_stress_test;
}
function hasPassedFullValidation() {
  const validations = getValidationStatus();
  return validations.blind_critic && validations.emotional_stress_test && validations.black_validation;
}
function getRequiredMcpToolsForPhase(phase) {
  const toolsByPhase = {
    idle: [],
    research: [
      "mcp__firecrawl__firecrawl_agent",
      "mcp__copywriting__voc_search"
    ],
    briefing: [
      "mcp__copywriting__get_phase_context",
      "mcp__copywriting__voc_search"
    ],
    production: [
      "mcp__copywriting__blind_critic",
      "mcp__copywriting__emotional_stress_test",
      "mcp__copywriting__black_validation"
    ],
    delivered: []
  };
  return toolsByPhase[phase] || [];
}
function getMissingRequiredTools() {
  const state = getSessionState();
  const required = getRequiredMcpToolsForPhase(state.currentPhase);
  return required.filter((tool) => !state.mcpToolsUsed.includes(tool));
}
function detectCurrentHelixPhase(filePath) {
  return (0, import_helix_requirements.detectHelixPhaseFromPath)(filePath);
}
function getHelixPhaseName(phase) {
  return import_helix_requirements.HELIX_PHASE_NAMES[phase] || `Fase ${phase}`;
}
function canWriteHelixPhase(filePath) {
  if (!filePath.includes("briefings/phases/") && !filePath.includes("briefings\\phases\\")) {
    return { allowed: true };
  }
  const phase = (0, import_helix_requirements.detectHelixPhaseFromPath)(filePath);
  if (!phase) {
    return { allowed: true };
  }
  const state = getSessionState();
  const toolsUsed = state.toolsUsedByPhase.briefing;
  const missingRequired = (0, import_helix_requirements.getMissingRequiredTools)(phase, toolsUsed);
  if (missingRequired.length > 0) {
    return {
      allowed: false,
      reason: (0, import_helix_requirements.generateMissingToolsMessage)(phase, missingRequired),
      missingTools: missingRequired,
      phase
    };
  }
  const missingRecommended = (0, import_helix_requirements.getMissingRecommendedTools)(phase, toolsUsed);
  if (missingRecommended.length > 0) {
    console.error(`[SESSION-STATE] \u26A0\uFE0F Ferramentas recomendadas n\xE3o usadas para fase ${phase}: ${missingRecommended.join(", ")}`);
  }
  return { allowed: true, phase };
}
function recordHelixPhaseComplete(phase) {
  const state = getSessionState();
  if (!state.helixPhasesCompleted) {
    state.helixPhasesCompleted = [];
  }
  if (!state.helixPhasesCompleted.includes(phase)) {
    state.helixPhasesCompleted.push(phase);
  }
  saveSessionState(state);
}
function getCompletedHelixPhases() {
  const state = getSessionState();
  return state.helixPhasesCompleted || [];
}
function areAllHelixPhasesComplete() {
  const completed = getCompletedHelixPhases();
  for (let i = 1; i <= 10; i++) {
    if (!completed.includes(i)) {
      return false;
    }
  }
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HELIX_PHASE_NAMES,
  HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_REQUIREMENTS,
  areAllHelixPhasesComplete,
  canWriteHelixPhase,
  canWriteToPath,
  createNewSession,
  detectCurrentHelixPhase,
  getActiveOffer,
  getCompletedHelixPhases,
  getCurrentPhase,
  getGatesStatus,
  getHelixPhaseName,
  getMcpToolsUsed,
  getMissingRequiredTools,
  getRequiredMcpToolsForPhase,
  getRequiredReadings,
  getSessionState,
  getToolsUsedInPhase,
  getValidationStatus,
  hasGatePassed,
  hasMinimumReasoningDepth,
  hasPassedFullValidation,
  hasPassedProductionValidation,
  hasReadMethodology,
  hasUsedSequentialThinking,
  markPlanCreated,
  recordBlackValidationScore,
  recordFileRead,
  recordFileWrite,
  recordGateBlocked,
  recordGatePassed,
  recordHelixPhaseComplete,
  recordMcpToolUse,
  recordSequentialThinking,
  recordToolInPhase,
  resetGatesForNewOffer,
  saveSessionState,
  setActiveOffer,
  setCurrentPhase
});
