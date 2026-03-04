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
var repetition_detector_exports = {};
__export(repetition_detector_exports, {
  LAST_N_TO_COMPARE: () => LAST_N_TO_COMPARE,
  MAX_ENTRIES: () => MAX_ENTRIES,
  PROMPTS_FILE: () => PROMPTS_FILE,
  SESSION_DIR: () => SESSION_DIR,
  SIMILARITY_THRESHOLD: () => SIMILARITY_THRESHOLD,
  TRUNCATE_LENGTH: () => TRUNCATE_LENGTH,
  appendPrompt: () => appendPrompt,
  detectRepetition: () => detectRepetition,
  ensureSessionDir: () => ensureSessionDir,
  formatWarningMessage: () => formatWarningMessage,
  jaccardSimilarity: () => jaccardSimilarity,
  readPreviousPrompts: () => readPreviousPrompts,
  tokenize: () => tokenize,
  truncate: () => truncate
});
module.exports = __toCommonJS(repetition_detector_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const SESSION_DIR = (0, import_path.join)(HOME, ".claude/session-state");
const PROMPTS_FILE = (0, import_path.join)(SESSION_DIR, "user-prompts.jsonl");
const SIMILARITY_THRESHOLD = 0.6;
const MAX_ENTRIES = 10;
const LAST_N_TO_COMPARE = 5;
const TRUNCATE_LENGTH = 120;
function tokenize(text) {
  const normalized = text.toLowerCase().replace(/[^\w\sáàãâéêíóôõúüçñ]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter((w) => w.length > 2);
  return new Set(words);
}
function jaccardSimilarity(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}
function truncate(text, maxLen) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}
function ensureSessionDir() {
  if (!(0, import_fs.existsSync)(SESSION_DIR)) {
    (0, import_fs.mkdirSync)(SESSION_DIR, { recursive: true });
  }
}
function readPreviousPrompts() {
  try {
    if (!(0, import_fs.existsSync)(PROMPTS_FILE)) return [];
    const content = (0, import_fs.readFileSync)(PROMPTS_FILE, "utf-8").trim();
    if (!content) return [];
    const entries = [];
    for (const line of content.split("\n")) {
      try {
        const entry = JSON.parse(line);
        if (entry && typeof entry.prompt === "string") {
          entries.push(entry);
        }
      } catch {
      }
    }
    return entries;
  } catch {
    return [];
  }
}
function appendPrompt(prompt, existingEntries) {
  ensureSessionDir();
  const newEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    prompt
  };
  const allEntries = [...existingEntries, newEntry];
  const trimmed = allEntries.slice(-MAX_ENTRIES);
  const content = trimmed.map((e) => JSON.stringify(e)).join("\n") + "\n";
  (0, import_fs.writeFileSync)(PROMPTS_FILE, content);
}
function detectRepetition(currentPrompt) {
  const previousEntries = readPreviousPrompts();
  const recentEntries = previousEntries.slice(-LAST_N_TO_COMPARE);
  const currentTokens = tokenize(currentPrompt);
  let highestSimilarity = 0;
  let mostSimilarPrompt = "";
  if (currentTokens.size >= 3) {
    for (const entry of recentEntries) {
      const previousTokens = tokenize(entry.prompt);
      if (previousTokens.size < 3) continue;
      const similarity = jaccardSimilarity(currentTokens, previousTokens);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostSimilarPrompt = entry.prompt;
      }
    }
  }
  appendPrompt(currentPrompt, previousEntries);
  return {
    detected: highestSimilarity > SIMILARITY_THRESHOLD,
    similarity: highestSimilarity,
    mostSimilarPrompt,
    currentPrompt
  };
}
function formatWarningMessage(result) {
  const similarityPct = Math.round(result.similarity * 100);
  return `
\u26A0\uFE0F REGRA 2x DETECTADA (similaridade: ${similarityPct}%): Usuario repetiu instrucao similar.
Prompt anterior: "${truncate(result.mostSimilarPrompt, TRUNCATE_LENGTH)}"
Prompt atual: "${truncate(result.currentPrompt, TRUNCATE_LENGTH)}"

ACAO OBRIGATORIA:
1. PARE imediatamente
2. Releia o pedido ORIGINAL com atencao
3. Faca EXATAMENTE o que foi pedido
4. NAO justifique, NAO explique \u2014 apenas execute

`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LAST_N_TO_COMPARE,
  MAX_ENTRIES,
  PROMPTS_FILE,
  SESSION_DIR,
  SIMILARITY_THRESHOLD,
  TRUNCATE_LENGTH,
  appendPrompt,
  detectRepetition,
  ensureSessionDir,
  formatWarningMessage,
  jaccardSimilarity,
  readPreviousPrompts,
  tokenize,
  truncate
});
