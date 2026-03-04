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
var agent_memory_writeback_exports = {};
__export(agent_memory_writeback_exports, {
  AGENTS_DIR: () => AGENTS_DIR,
  HOME: () => HOME,
  PERSONA_MAP: () => PERSONA_MAP,
  appendAndTrim: () => appendAndTrim,
  buildEntry: () => buildEntry,
  extractKeyLearnings: () => extractKeyLearnings,
  extractPersona: () => extractPersona,
  extractSummary: () => extractSummary,
  handleAgentMemoryWriteback: () => handleAgentMemoryWriteback
});
module.exports = __toCommonJS(agent_memory_writeback_exports);
var import_fs = require("fs");
var import_path = require("path");
const HOME = process.env.HOME || "/tmp";
const AGENTS_DIR = (0, import_path.join)(HOME, ".claude", "agents");
const PERSONA_MAP = {
  vox: "vox",
  researcher: "vox",
  "@researcher": "vox",
  cipher: "cipher",
  miner: "cipher",
  "@miner": "cipher",
  atlas: "atlas",
  briefer: "atlas",
  "@briefer": "atlas",
  blade: "blade",
  producer: "blade",
  "@producer": "blade",
  echo: "echo",
  vsl: "echo",
  "@vsl": "echo",
  forge: "forge",
  lp: "forge",
  "@lp": "forge",
  scout: "scout",
  creative: "scout",
  "@creative": "scout",
  hawk: "hawk",
  critic: "hawk",
  "@critic": "hawk",
  sentinel: "sentinel",
  gatekeeper: "sentinel",
  "@gatekeeper": "sentinel",
  helix: "helix",
  chief: "helix",
  "@chief": "helix"
};
function extractPersona(description) {
  if (!description) return null;
  const prefixMatch = description.match(/^([A-Za-z@][A-Za-z_-]*)[\s:]/);
  if (prefixMatch) {
    const candidate = prefixMatch[1].toLowerCase().replace(/^@/, "");
    if (PERSONA_MAP[candidate]) return PERSONA_MAP[candidate];
    if (PERSONA_MAP[`@${candidate}`]) return PERSONA_MAP[`@${candidate}`];
  }
  const lower = description.toLowerCase();
  for (const [keyword, dir] of Object.entries(PERSONA_MAP)) {
    if (lower.includes(keyword.toLowerCase())) return dir;
  }
  return null;
}
function extractSummary(output, taskDesc) {
  if (!output) return taskDesc.slice(0, 120);
  const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);
  const meaningful = lines.filter((l) => !l.startsWith("#") && l.length > 10);
  if (meaningful.length === 0) return taskDesc.slice(0, 120);
  return meaningful[0].slice(0, 120);
}
function extractKeyLearnings(output) {
  if (!output) return [];
  const learnings = [];
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if ((trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.match(/^\d+\./)) && trimmed.length > 10) {
      learnings.push(
        trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").slice(0, 100)
      );
      if (learnings.length >= 3) break;
    }
  }
  if (learnings.length === 0) {
    const meaningful = lines.map((l) => l.trim()).filter((l) => l.length > 15 && !l.startsWith("#")).slice(-2);
    learnings.push(...meaningful.map((l) => l.slice(0, 100)));
  }
  return learnings.slice(0, 3);
}
function buildEntry(taskSummary, learnings) {
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().slice(0, 16).replace("T", " ");
  const keyLines = learnings.length > 0 ? learnings.map((l) => `- Key: ${l}`).join("\n") : "- Key: (no structured output detected)";
  return `
### ${dateStr} \u2014 ${taskSummary}
${keyLines}
`;
}
function appendAndTrim(memPath, entry) {
  const existing = (0, import_fs.existsSync)(memPath) ? (0, import_fs.readFileSync)(memPath, "utf-8") : "";
  const combined = existing.trimEnd() + "\n" + entry;
  const allLines = combined.split("\n");
  let finalLines;
  if (allLines.length > 200) {
    const header = allLines.slice(0, 20);
    const recent = allLines.slice(-175);
    finalLines = [
      ...header,
      "",
      "<!-- Older entries trimmed by agent-memory-writeback.ts -->",
      "",
      ...recent
    ];
  } else {
    finalLines = allLines;
  }
  (0, import_fs.writeFileSync)(memPath, finalLines.join("\n"), "utf-8");
}
function handleAgentMemoryWriteback(data, startMs, timeoutMs) {
  if (data.tool_name !== "Agent") {
    return { continue: true };
  }
  const description = data.tool_input?.description || "";
  const output = typeof data.tool_output === "string" ? data.tool_output : JSON.stringify(data.tool_output || "");
  const persona = extractPersona(description);
  if (!persona) {
    return {
      continue: true,
      feedback: "[AMW] No persona detected \u2014 skipping writeback"
    };
  }
  if (Date.now() - startMs > timeoutMs) {
    return {
      continue: true,
      feedback: "[AMW] Timeout after persona extract"
    };
  }
  const memPath = (0, import_path.join)(AGENTS_DIR, persona, "MEMORY.md");
  (0, import_fs.mkdirSync)((0, import_path.dirname)(memPath), { recursive: true });
  const taskSummary = extractSummary(description, description);
  const learnings = extractKeyLearnings(output);
  const entry = buildEntry(taskSummary, learnings);
  appendAndTrim(memPath, entry);
  const elapsedMs = Date.now() - startMs;
  return {
    continue: true,
    feedback: `[AMW] Memory written to ${persona}/MEMORY.md (${elapsedMs}ms)`
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AGENTS_DIR,
  HOME,
  PERSONA_MAP,
  appendAndTrim,
  buildEntry,
  extractKeyLearnings,
  extractPersona,
  extractSummary,
  handleAgentMemoryWriteback
});
