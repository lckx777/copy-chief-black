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
var gate_resolver_exports = {};
__export(gate_resolver_exports, {
  hasBriefingGatePassed: () => hasBriefingGatePassed,
  hasProductionGatePassed: () => hasProductionGatePassed,
  hasResearchGatePassed: () => hasResearchGatePassed,
  resolveCanWriteToPath: () => resolveCanWriteToPath,
  resolveForRouting: () => resolveForRouting,
  syncSessionFromOffer: () => syncSessionFromOffer
});
module.exports = __toCommonJS(gate_resolver_exports);
var import_fs = require("fs");
var import_path = require("path");
function loadStateMachineModule() {
  try {
    return require("../state/state-machine.js");
  } catch {
    try {
      return require("../state/state-machine");
    } catch {
      return null;
    }
  }
}
function loadSessionStateModule() {
  try {
    return require("../state/session-state.js");
  } catch {
    try {
      return require("../state/session-state");
    } catch {
      return null;
    }
  }
}
function loadOfferStateModule() {
  try {
    return require("../state/offer-state.js");
  } catch {
    try {
      return require("../state/offer-state");
    } catch {
      return null;
    }
  }
}
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
function resolveCanWriteToPath(filePath) {
  const debug = {
    offerStateChecked: false,
    offerGatePassed: void 0,
    sessionStateChecked: false,
    sessionGatePassed: void 0,
    heuristicChecked: false,
    heuristicPassed: void 0
  };
  const smModule = loadStateMachineModule();
  const sessionModule = loadSessionStateModule();
  const offerModule = loadOfferStateModule();
  if (!smModule) {
    return { allowed: true, source: "default", debug };
  }
  const { loadMachine, canWriteToPath: smCanWrite, detectOffer } = smModule;
  const offerPath = detectOffer(filePath);
  if (offerPath) {
    const smCheck = smCanWrite(filePath);
    debug.offerStateChecked = true;
    debug.offerGatePassed = smCheck.allowed;
    if (smCheck.allowed) {
      return {
        allowed: true,
        source: smCheck.source === "heuristic" ? "heuristic" : "state-machine",
        offerPath,
        debug
      };
    }
    if (offerModule) {
      const { hasOfferState, getOfferState } = offerModule;
      if (hasOfferState(offerPath)) {
        const offerState = getOfferState(offerPath);
        const isBriefing = /briefings?\//i.test(filePath);
        const isProduction = /production\//i.test(filePath);
        if (isBriefing && offerState.gates?.research?.passed) {
          debug.offerGatePassed = true;
          return { allowed: true, source: "offer-state", offerPath, debug };
        }
        if (isProduction && offerState.gates?.briefing?.passed) {
          debug.offerGatePassed = true;
          return { allowed: true, source: "offer-state", offerPath, debug };
        }
      }
    }
    if (sessionModule) {
      const { canWriteToPath: sessionCanWrite } = sessionModule;
      debug.sessionStateChecked = true;
      const sessionCheck = sessionCanWrite(filePath);
      debug.sessionGatePassed = sessionCheck.allowed;
      if (sessionCheck.allowed) {
        return { allowed: true, source: "session-state", offerPath, debug };
      }
    }
    const requiredGate = /briefings?\//i.test(filePath) ? "research" : /production\//i.test(filePath) ? "briefing" : void 0;
    return {
      allowed: false,
      source: "state-machine",
      reason: smCheck.reason || `Gate n\xE3o passou para "${offerPath}".`,
      requiredGate,
      offerPath,
      debug
    };
  }
  return { allowed: true, source: "default", debug };
}
function syncSessionFromOffer(offerPath) {
  const smModule = loadStateMachineModule();
  const sessionModule = loadSessionStateModule();
  const offerModule = loadOfferStateModule();
  try {
    if (smModule && sessionModule) {
      const { loadMachine } = smModule;
      const { getSessionState, saveSessionState } = sessionModule;
      const machine = loadMachine(offerPath);
      const sessionState = getSessionState();
      if (machine.gates.research.passed) sessionState.gatesPassed.research = true;
      if (machine.gates.briefing.passed) sessionState.gatesPassed.briefing = true;
      if (machine.gates.production.passed) sessionState.gatesPassed.production = true;
      const phaseMap = {
        IDLE: "idle",
        RESEARCH: "research",
        BRIEFING: "briefing",
        PRODUCTION: "production",
        REVIEW: "production",
        DELIVERED: "delivered"
      };
      sessionState.currentPhase = phaseMap[machine.phase] || "idle";
      sessionState.activeOffer = offerPath;
      saveSessionState(sessionState);
      return;
    }
  } catch {
  }
  try {
    if (offerModule && sessionModule) {
      const { hasOfferState, getOfferState } = offerModule;
      const { getSessionState, saveSessionState } = sessionModule;
      if (hasOfferState(offerPath)) {
        const offerState = getOfferState(offerPath);
        const sessionState = getSessionState();
        if (offerState.gates?.research?.passed) sessionState.gatesPassed.research = true;
        if (offerState.gates?.briefing?.passed) sessionState.gatesPassed.briefing = true;
        if (offerState.gates?.production?.passed) sessionState.gatesPassed.production = true;
        if (offerState.workflow_phase) sessionState.currentPhase = offerState.workflow_phase;
        sessionState.activeOffer = offerPath;
        saveSessionState(sessionState);
      }
    }
  } catch {
  }
}
function resolveForRouting(offerPath) {
  const resolved = offerPath.startsWith("/") ? offerPath : (0, import_path.join)(ECOSYSTEM_ROOT, offerPath);
  const helixStatePath = (0, import_path.join)(resolved, "helix-state.yaml");
  const defaultResult = {
    phase: "IDLE",
    gates: { research: false, briefing: false, production: false },
    offerPath: resolved,
    source: "default"
  };
  try {
    if (!(0, import_fs.existsSync)(helixStatePath)) {
      return defaultResult;
    }
    const content = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    const phaseMatch = content.match(/^phase\s*:\s*(\w+)/m);
    const phase = phaseMatch ? phaseMatch[1].toUpperCase() : "IDLE";
    const gatesSection = content.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || content.substring(content.indexOf("gates:") + 6);
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
    return {
      phase,
      gates: {
        research: researchPassed,
        briefing: briefingPassed,
        production: productionPassed
      },
      offerPath: resolved,
      source: "helix-state"
    };
  } catch {
    return defaultResult;
  }
}
function hasResearchGatePassed(offerPath) {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.research.passed;
}
function hasBriefingGatePassed(offerPath) {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.briefing.passed;
}
function hasProductionGatePassed(offerPath) {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.production.passed;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hasBriefingGatePassed,
  hasProductionGatePassed,
  hasResearchGatePassed,
  resolveCanWriteToPath,
  resolveForRouting,
  syncSessionFromOffer
});
