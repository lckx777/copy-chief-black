var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var mecanismo_gate_exports = {};
__export(mecanismo_gate_exports, {
  BLIND_CRITIC_THRESHOLD: () => BLIND_CRITIC_THRESHOLD,
  EMOTIONAL_STRESS_THRESHOLD: () => EMOTIONAL_STRESS_THRESHOLD,
  buildInvalidMecanismoMessage: () => buildInvalidMecanismoMessage,
  buildMissingMecanismoMessage: () => buildMissingMecanismoMessage,
  findOfferRoot: () => findOfferRoot,
  isMecanismoValidated: () => isMecanismoValidated,
  loadMecanismo: () => loadMecanismo,
  preToolUse: () => preToolUse
});
module.exports = __toCommonJS(mecanismo_gate_exports);
var import_fs = require("fs");
var path = __toESM(require("path"));
var import_yaml = require("yaml");
const BLIND_CRITIC_THRESHOLD = 8;
const EMOTIONAL_STRESS_THRESHOLD = 8;
function findOfferRoot(filePath) {
  let current = path.dirname(filePath);
  const maxDepth = 10;
  let depth = 0;
  while (depth < maxDepth) {
    if ((0, import_fs.existsSync)(path.join(current, "CONTEXT.md")) || (0, import_fs.existsSync)(path.join(current, "mecanismo-unico.yaml"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }
  return null;
}
function loadMecanismo(offerPath) {
  const mecanismoPath = path.join(offerPath, "mecanismo-unico.yaml");
  if (!(0, import_fs.existsSync)(mecanismoPath)) {
    return null;
  }
  try {
    const content = (0, import_fs.readFileSync)(mecanismoPath, "utf-8");
    return (0, import_yaml.parse)(content);
  } catch (e) {
    console.error(`Error parsing mecanismo-unico.yaml: ${e}`);
    return null;
  }
}
function isMecanismoValidated(data) {
  const validation = data.unique_mechanism?.validation || data.validation || data;
  const state = data.unique_mechanism?.validation?.state || data.state || validation?.state || "UNDEFINED";
  if (state === "APPROVED" || state === "VALIDATED") {
    return { valid: true, reason: `State: ${state}` };
  }
  const mcp = validation?.mcp_validation || data.unique_mechanism?.validation?.mcp_validation;
  if (!mcp) {
    return {
      valid: false,
      reason: "MCP validation not run. Execute: consensus, blind_critic, emotional_stress_test"
    };
  }
  const issues = [];
  if (!mcp.consensus_passed) {
    issues.push("consensus not passed");
  }
  if ((mcp.blind_critic_mup_score || 0) < BLIND_CRITIC_THRESHOLD) {
    issues.push(`blind_critic MUP: ${mcp.blind_critic_mup_score || 0}/10 (need ${BLIND_CRITIC_THRESHOLD}+)`);
  }
  if ((mcp.blind_critic_mus_score || 0) < BLIND_CRITIC_THRESHOLD) {
    issues.push(`blind_critic MUS: ${mcp.blind_critic_mus_score || 0}/10 (need ${BLIND_CRITIC_THRESHOLD}+)`);
  }
  if ((mcp.emotional_stress_test_score || 0) < EMOTIONAL_STRESS_THRESHOLD) {
    issues.push(`emotional_stress_test: ${mcp.emotional_stress_test_score || 0}/10 (need ${EMOTIONAL_STRESS_THRESHOLD}+)`);
  }
  if (issues.length > 0) {
    return { valid: false, reason: `MCP validation issues: ${issues.join(", ")}` };
  }
  return { valid: false, reason: `State is ${state}, needs VALIDATED or APPROVED` };
}
function buildMissingMecanismoMessage(offerRoot) {
  return `
\u{1F6AB} BLOQUEADO - MECANISMO UNICO NAO DEFINIDO

Para escrever em production/, o Mecanismo Unico deve estar validado.

Arquivo faltando: ${path.join(offerRoot, "mecanismo-unico.yaml")}

ACAO OBRIGATORIA:
1. Crie mecanismo-unico.yaml usando o template
2. Preencha MUP, MUS e INDUTOR
3. Valide via MCP (consensus, blind_critic, emotional_stress_test)
4. Marque human_approved: true

Template: ~/.claude/templates/mecanismo-unico-template.md
Schema: ~/.claude/schemas/mecanismo-unico.schema.yaml
`;
}
function buildInvalidMecanismoMessage(reason, offerRoot) {
  return `
\u{1F6AB} BLOQUEADO - MECANISMO NAO VALIDADO

${reason}

Para escrever em production/, o Mecanismo Unico deve estar VALIDATED ou APPROVED.

ACAO OBRIGATORIA:
1. Complete mecanismo-unico.yaml
2. Run: consensus (selecionar MUP/MUS)
3. Run: blind_critic (score >= 8 para MUP e MUS)
4. Run: emotional_stress_test (score >= 8)
5. Set human_approved: true

Validar: python3 ~/copywriting-ecosystem/scripts/validate-mecanismo.py ${offerRoot}
`;
}
function preToolUse(input) {
  const { tool_name, tool_input } = input;
  if (tool_name === "Write" && tool_input.file_path) {
    const filePath = tool_input.file_path;
    if (!filePath.includes("/production/")) {
      return { decision: "allow" };
    }
    const offerRoot = findOfferRoot(filePath);
    if (!offerRoot) {
      console.warn("Could not determine offer root for production write");
      return { decision: "allow" };
    }
    const mecanismo = loadMecanismo(offerRoot);
    if (!mecanismo) {
      return {
        decision: "block",
        message: buildMissingMecanismoMessage(offerRoot)
      };
    }
    const { valid, reason } = isMecanismoValidated(mecanismo);
    if (!valid) {
      return {
        decision: "block",
        message: buildInvalidMecanismoMessage(reason, offerRoot)
      };
    }
    return { decision: "allow" };
  }
  if (tool_name === "mcp__copywriting__validate_gate" && tool_input.gate_name === "briefing") {
    console.log("validate_gate(briefing) called - ensure mecanismo-unico.yaml is validated");
    return { decision: "allow" };
  }
  return { decision: "allow" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BLIND_CRITIC_THRESHOLD,
  EMOTIONAL_STRESS_THRESHOLD,
  buildInvalidMecanismoMessage,
  buildMissingMecanismoMessage,
  findOfferRoot,
  isMecanismoValidated,
  loadMecanismo,
  preToolUse
});
