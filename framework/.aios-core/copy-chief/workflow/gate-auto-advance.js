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
var gate_auto_advance_exports = {};
__export(gate_auto_advance_exports, {
  ECOSYSTEM_DIR: () => ECOSYSTEM_DIR,
  GATE_TOOLS: () => GATE_TOOLS,
  HOME: () => HOME,
  PHASE_ORDER: () => PHASE_ORDER,
  advancePhase: () => advancePhase,
  checkMecanismoGuard: () => checkMecanismoGuard,
  extractGateResult: () => extractGateResult,
  findOfferPath: () => findOfferPath,
  handleGateAutoAdvance: () => handleGateAutoAdvance,
  isGateTool: () => isGateTool
});
module.exports = __toCommonJS(gate_auto_advance_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const ECOSYSTEM_DIR = (0, import_path.join)(HOME, "copywriting-ecosystem");
const PHASE_ORDER = ["idle", "research", "briefing", "production", "delivered"];
const GATE_TOOLS = [
  "mcp__copywriting__validate_gate",
  "mcp__copywriting__black_validation",
  "validate_gate",
  "black_validation"
];
function isGateTool(toolName) {
  if (!toolName) return false;
  return GATE_TOOLS.some(
    (g) => toolName.includes(g.replace("mcp__copywriting__", ""))
  );
}
function extractGateResult(output) {
  if (!output) return null;
  const outputStr = typeof output === "string" ? output : JSON.stringify(output);
  const passedMatch = outputStr.match(
    /(?:passed|aprovado|PASSED)[:\s]*(?:true|sim|yes)/i
  );
  const scoreMatch = outputStr.match(
    /(?:score|nota|confidence)[:\s]*(\d+\.?\d*)/i
  );
  const gateMatch = outputStr.match(/(?:gate|fase)[:\s]*["']?(\w+)/i);
  if (!passedMatch && !scoreMatch) return null;
  return {
    passed: !!passedMatch,
    score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
    gate: gateMatch ? gateMatch[1].toLowerCase() : "unknown"
  };
}
function findOfferPath(toolInput) {
  const inputStr = JSON.stringify(toolInput);
  const pathMatch = inputStr.match(/(\w[\w-]*\/[\w-]+)/);
  if (pathMatch) {
    const candidate = pathMatch[1];
    if ((0, import_fs.existsSync)((0, import_path.join)(ECOSYSTEM_DIR, candidate, "helix-state.yaml"))) {
      return candidate;
    }
  }
  const gateInput = toolInput.gate_name || toolInput.gate || "";
  if (gateInput) {
    const logPath = (0, import_path.join)(HOME, ".claude/router-log.jsonl");
    if ((0, import_fs.existsSync)(logPath)) {
      try {
        const lines = (0, import_fs.readFileSync)(logPath, "utf-8").trim().split("\n").reverse();
        for (const line of lines.slice(0, 10)) {
          const entry = JSON.parse(line);
          if (entry.offer) return entry.offer;
        }
      } catch {
      }
    }
  }
  return null;
}
function advancePhase(offerPath, fromPhase) {
  const helixPath = (0, import_path.join)(ECOSYSTEM_DIR, offerPath, "helix-state.yaml");
  if (!(0, import_fs.existsSync)(helixPath)) return false;
  const currentIdx = PHASE_ORDER.indexOf(fromPhase);
  if (currentIdx === -1 || currentIdx >= PHASE_ORDER.length - 1) return false;
  const nextPhase = PHASE_ORDER[currentIdx + 1];
  try {
    let content = (0, import_fs.readFileSync)(helixPath, "utf-8");
    content = content.replace(
      /current_phase:\s*["']?\w+["']?/i,
      `current_phase: "${nextPhase}"`
    );
    const gateKey = fromPhase;
    if (!content.includes(`${gateKey}:`)) {
      const gatesMatch = content.match(/gates:/);
      if (gatesMatch) {
        content = content.replace(
          /gates:/,
          `gates:
  ${gateKey}:
    passed: true
    passed_at: "${(/* @__PURE__ */ new Date()).toISOString()}"`
        );
      }
    } else {
      const gateRegex = new RegExp(`(${gateKey}:[\\s\\S]*?)passed:\\s*\\w+`, "i");
      content = content.replace(gateRegex, `$1passed: true`);
    }
    (0, import_fs.writeFileSync)(helixPath, content, "utf-8");
    return true;
  } catch {
    return false;
  }
}
function checkMecanismoGuard(offerPath) {
  const helixPath = (0, import_path.join)(ECOSYSTEM_DIR, offerPath, "helix-state.yaml");
  if (!(0, import_fs.existsSync)(helixPath)) return null;
  const content = (0, import_fs.readFileSync)(helixPath, "utf-8");
  const mecMatch = content.match(/mecanismo_state:\s*["']?(\w+)/i);
  const mecState = mecMatch ? mecMatch[1] : "UNDEFINED";
  if (!["VALIDATED", "APPROVED"].includes(mecState)) {
    return `mecanismo state is "${mecState}" (needs VALIDATED/APPROVED)`;
  }
  return null;
}
function handleGateAutoAdvance(input) {
  if (!isGateTool(input.tool_name)) {
    return { advanced: false, offerPath: null, fromPhase: "", toPhase: null };
  }
  const gateResult = extractGateResult(input.tool_output);
  if (!gateResult) {
    return { advanced: false, offerPath: null, fromPhase: "", toPhase: null };
  }
  if (!gateResult.passed) {
    return {
      advanced: false,
      offerPath: null,
      fromPhase: gateResult.gate,
      toPhase: null
    };
  }
  const offerPath = findOfferPath(input.tool_input);
  if (!offerPath) {
    return {
      advanced: false,
      offerPath: null,
      fromPhase: gateResult.gate,
      toPhase: null,
      error: "Gate passed but couldn't determine offer path"
    };
  }
  const currentPhase = gateResult.gate;
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  if (currentIdx <= 0 || currentIdx >= PHASE_ORDER.length - 1) {
    return {
      advanced: false,
      offerPath,
      fromPhase: currentPhase,
      toPhase: null,
      error: `Gate "${currentPhase}" not in phase order`
    };
  }
  const nextPhase = PHASE_ORDER[currentIdx + 1];
  if (nextPhase === "production") {
    const blocked = checkMecanismoGuard(offerPath);
    if (blocked) {
      return {
        advanced: false,
        offerPath,
        fromPhase: currentPhase,
        toPhase: nextPhase,
        blocked
      };
    }
  }
  const advanced = advancePhase(offerPath, currentPhase);
  return {
    advanced,
    offerPath,
    fromPhase: currentPhase,
    toPhase: nextPhase,
    error: advanced ? void 0 : `Failed to write helix-state.yaml for ${offerPath}`
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ECOSYSTEM_DIR,
  GATE_TOOLS,
  HOME,
  PHASE_ORDER,
  advancePhase,
  checkMecanismoGuard,
  extractGateResult,
  findOfferPath,
  handleGateAutoAdvance,
  isGateTool
});
