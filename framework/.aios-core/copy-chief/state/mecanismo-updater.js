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
var mecanismo_updater_exports = {};
__export(mecanismo_updater_exports, {
  BLIND_CRITIC_THRESHOLD: () => BLIND_CRITIC_THRESHOLD,
  EMOTIONAL_STRESS_THRESHOLD: () => EMOTIONAL_STRESS_THRESHOLD,
  RELEVANT_TOOLS: () => RELEVANT_TOOLS,
  RMBC_THRESHOLD: () => RMBC_THRESHOLD,
  checkAllPassed: () => checkAllPassed,
  findMecanismoFile: () => findMecanismoFile,
  parseScore: () => parseScore,
  postToolUse: () => postToolUse,
  updateYamlField: () => updateYamlField
});
module.exports = __toCommonJS(mecanismo_updater_exports);
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
const BLIND_CRITIC_THRESHOLD = 8;
const EMOTIONAL_STRESS_THRESHOLD = 8;
const RMBC_THRESHOLD = 7;
const RELEVANT_TOOLS = [
  "mcp__zen__consensus",
  "mcp__copywriting__blind_critic",
  "mcp__copywriting__emotional_stress_test"
];
function findMecanismoFile(startPath) {
  let current = startPath;
  const maxDepth = 10;
  let depth = 0;
  while (depth < maxDepth) {
    const mecanismoPath = path.join(current, "mecanismo-unico.yaml");
    if (fs.existsSync(mecanismoPath)) {
      return mecanismoPath;
    }
    if (fs.existsSync(path.join(current, "CONTEXT.md"))) {
      return null;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }
  return null;
}
function parseScore(output, pattern) {
  const match = output.match(pattern);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}
function updateYamlField(filePath, fieldPattern, newValue) {
  let content = fs.readFileSync(filePath, "utf-8");
  const regex = new RegExp(`(${fieldPattern}:)\\s*.*$`, "m");
  content = content.replace(regex, `$1 ${newValue}`);
  fs.writeFileSync(filePath, content, "utf-8");
}
function checkAllPassed(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const consensusMatch = content.match(/consensus_passed:\s*(true|false)/);
  const mupMatch = content.match(/blind_critic_mup_score:\s*(\d+)/);
  const musMatch = content.match(/blind_critic_mus_score:\s*(\d+)/);
  const estMatch = content.match(/emotional_stress_test_score:\s*(\d+)/);
  const consensus = consensusMatch?.[1] === "true";
  const mup = parseInt(mupMatch?.[1] || "0") >= BLIND_CRITIC_THRESHOLD;
  const mus = parseInt(musMatch?.[1] || "0") >= BLIND_CRITIC_THRESHOLD;
  const est = parseInt(estMatch?.[1] || "0") >= EMOTIONAL_STRESS_THRESHOLD;
  return consensus && mup && mus && est;
}
function postToolUse(input) {
  const { tool_name, tool_output, session_context } = input;
  if (!RELEVANT_TOOLS.includes(tool_name)) {
    return { continue: true };
  }
  const cwd = session_context?.current_directory || process.cwd();
  const mecanismoPath = findMecanismoFile(cwd);
  if (!mecanismoPath) {
    console.log("[post-mcp-mecanismo] No mecanismo-unico.yaml found in context");
    return { continue: true };
  }
  console.log(`[post-mcp-mecanismo] Processing ${tool_name} for ${mecanismoPath}`);
  try {
    if (tool_name === "mcp__zen__consensus") {
      const passed = tool_output.includes("agreement") || tool_output.includes("consensus") || tool_output.includes("approved") || tool_output.includes("selected");
      updateYamlField(mecanismoPath, "consensus_passed", passed);
      console.log(`[post-mcp-mecanismo] Updated consensus_passed: ${passed}`);
    }
    if (tool_name === "mcp__copywriting__blind_critic") {
      const scorePatterns = [
        /score[:\s]+(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*\/\s*10/i,
        /rating[:\s]+(\d+(?:\.\d+)?)/i,
        /média[:\s]+(\d+(?:\.\d+)?)/i
      ];
      let score = null;
      for (const pattern of scorePatterns) {
        score = parseScore(tool_output, pattern);
        if (score !== null) break;
      }
      if (score !== null) {
        const isMUS = tool_output.toLowerCase().includes("mus") || tool_output.toLowerCase().includes("solu\xE7\xE3o") || tool_output.toLowerCase().includes("solucao");
        if (isMUS) {
          updateYamlField(mecanismoPath, "blind_critic_mus_score", Math.round(score));
          console.log(`[post-mcp-mecanismo] Updated blind_critic_mus_score: ${score}`);
        } else {
          updateYamlField(mecanismoPath, "blind_critic_mup_score", Math.round(score));
          console.log(`[post-mcp-mecanismo] Updated blind_critic_mup_score: ${score}`);
        }
      }
    }
    if (tool_name === "mcp__copywriting__emotional_stress_test") {
      const scorePatterns = [
        /genericidade[:\s]+(\d+(?:\.\d+)?)/i,
        /score[:\s]+(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*\/\s*10/i
      ];
      let score = null;
      for (const pattern of scorePatterns) {
        score = parseScore(tool_output, pattern);
        if (score !== null) break;
      }
      if (score !== null) {
        updateYamlField(mecanismoPath, "emotional_stress_test_score", Math.round(score));
        console.log(`[post-mcp-mecanismo] Updated emotional_stress_test_score: ${score}`);
      }
    }
    if (checkAllPassed(mecanismoPath)) {
      const content = fs.readFileSync(mecanismoPath, "utf-8");
      const stateMatch = content.match(/state:\s*"?(\w+)"?/);
      const currentState = stateMatch?.[1] || "DRAFT";
      if (currentState !== "VALIDATED" && currentState !== "APPROVED") {
        updateYamlField(mecanismoPath, "state", '"VALIDATED"');
        updateYamlField(mecanismoPath, "all_passed", "true");
        const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        updateYamlField(mecanismoPath, "updated_at", `"${date}"`);
        console.log(`[post-mcp-mecanismo] State advanced to VALIDATED`);
        return {
          continue: true,
          message: `\u2705 MECANISMO VALIDATED - Todos os thresholds atingidos!

Arquivo atualizado: ${mecanismoPath}
State: VALIDATED

Pr\xF3ximo: HUMANO deve aprovar (human_approved: true, state: APPROVED)`
        };
      }
    }
  } catch (error) {
    console.error(`[post-mcp-mecanismo] Error: ${error}`);
  }
  return { continue: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BLIND_CRITIC_THRESHOLD,
  EMOTIONAL_STRESS_THRESHOLD,
  RELEVANT_TOOLS,
  RMBC_THRESHOLD,
  checkAllPassed,
  findMecanismoFile,
  parseScore,
  postToolUse,
  updateYamlField
});
