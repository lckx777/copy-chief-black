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
var offer_detector_exports = {};
__export(offer_detector_exports, {
  TRACKABLE_TOOLS: () => TRACKABLE_TOOLS,
  detectOfferForTool: () => detectOfferForTool,
  detectPhaseFromToolInput: () => detectPhaseFromToolInput,
  resolvePhaseForOffer: () => resolvePhaseForOffer
});
module.exports = __toCommonJS(offer_detector_exports);
var import_offer_state = require("./offer-state");
var import_session_state = require("./session-state");
const TRACKABLE_TOOLS = [
  "mcp__copywriting__get_phase_context",
  "mcp__copywriting__voc_search",
  "mcp__copywriting__validate_gate",
  "mcp__copywriting__blind_critic",
  "mcp__copywriting__emotional_stress_test",
  "mcp__copywriting__layered_review",
  "mcp__copywriting__black_validation",
  "mcp__copywriting__write_chapter",
  "mcp__zen__consensus",
  "mcp__zen__thinkdeep",
  "mcp__zen__challenge",
  "mcp__sequential-thinking__sequentialthinking"
];
const PRIORITY_FILE_PATTERNS = [
  /briefings\/phases\//i,
  /research\//i,
  /mecanismo-unico\.yaml$/i,
  /helix-state\.yaml$/i
];
function detectPhaseFromToolInput(toolName, input) {
  if (toolName === "mcp__copywriting__get_phase_context") {
    const phase = input.phase;
    if (phase && phase >= 1 && phase <= 10) {
      return phase;
    }
  }
  return null;
}
function detectOfferForTool(toolInput) {
  const sessionState = (0, import_session_state.getSessionState)();
  if (toolInput.offer_path) {
    const path = toolInput.offer_path;
    console.error(`[OFFER-DETECTOR] P1 tool_input.offer_path: ${path}`);
    return path;
  }
  const filesRead = sessionState.filesRead ?? [];
  if (filesRead.length > 0) {
    for (const pattern of PRIORITY_FILE_PATTERNS) {
      for (const file of filesRead) {
        if (pattern.test(file)) {
          const detected = (0, import_offer_state.detectOfferFromPath)(file);
          if (detected) {
            console.error(`[OFFER-DETECTOR] P2a filesRead (priority pattern): ${detected}`);
            return detected;
          }
        }
      }
    }
    for (const file of filesRead) {
      const detected = (0, import_offer_state.detectOfferFromPath)(file);
      if (detected) {
        console.error(`[OFFER-DETECTOR] P2b filesRead (any): ${detected}`);
        return detected;
      }
    }
  }
  if (sessionState.activeOffer) {
    console.error(`[OFFER-DETECTOR] P3 activeOffer: ${sessionState.activeOffer}`);
    return sessionState.activeOffer;
  }
  return null;
}
function resolvePhaseForOffer(offerPath) {
  try {
    const state = (0, import_offer_state.getOfferState)(offerPath);
    for (let i = 1; i <= 10; i++) {
      const phaseState = state.helix_phases[`phase_${i}`];
      if (phaseState?.status === "in_progress") {
        return i;
      }
    }
    for (let i = 1; i <= 10; i++) {
      const phaseState = state.helix_phases[`phase_${i}`];
      if (phaseState?.status === "not_started") {
        return i;
      }
    }
  } catch (e) {
    console.error(`[OFFER-DETECTOR] resolvePhaseForOffer error: ${e}`);
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TRACKABLE_TOOLS,
  detectOfferForTool,
  detectPhaseFromToolInput,
  resolvePhaseForOffer
});
