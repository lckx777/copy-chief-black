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
var decision_detector_exports = {};
__export(decision_detector_exports, {
  DECISIONS_PATH: () => DECISIONS_PATH,
  PATTERNS: () => PATTERNS,
  detectDecisions: () => detectDecisions,
  extractSentence: () => extractSentence,
  hashText: () => hashText,
  loadDecisions: () => loadDecisions,
  recordNewDecisions: () => recordNewDecisions,
  saveDecisions: () => saveDecisions
});
module.exports = __toCommonJS(decision_detector_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_crypto = require("crypto");
const HOME = process.env.HOME ?? "/tmp";
const DECISIONS_PATH = (0, import_path.join)(HOME, ".claude", "memory", "user-decisions.json");
const PATTERNS = [
  // Workflow — explicit instructions / rules
  { regex: /\b(sempre use|always use)\b/i, category: "workflow" },
  { regex: /\b(nunca|never)\b/i, category: "workflow" },
  { regex: /\ba partir de agora\b/i, category: "workflow" },
  { regex: /\bfrom now on\b/i, category: "workflow" },
  { regex: /\bmude para|troque por\b/i, category: "workflow" },
  { regex: /\bswitch to|change to\b/i, category: "workflow" },
  // Approval / continuation
  { regex: /\b(pode continuar|aprovo|approve)\b/i, category: "workflow" },
  // System protection
  { regex: /\b(nao quero|nao mexa|don't touch)\b/i, category: "system" },
  // Preferences
  { regex: /\bprefiro\b/i, category: "style" },
  { regex: /\bprefer[oe]\b/i, category: "style" },
  // Decisions (offer-level)
  { regex: /\bdecid[io]\b/i, category: "offer" },
  { regex: /\bescolh[eo]\b/i, category: "offer" },
  // System settings — model selection
  { regex: /\b(use|usar)\s+(modelo|model|opus|sonnet|haiku)\b/i, category: "system" }
];
function hashText(text) {
  return (0, import_crypto.createHash)("md5").update(text.toLowerCase().trim()).digest("hex").slice(0, 8);
}
function extractSentence(prompt, matchIndex) {
  const sentenceBreaks = /[.!?\n]/g;
  let start = 0;
  let end = prompt.length;
  const before = prompt.slice(0, matchIndex);
  const lastBreak = Math.max(
    before.lastIndexOf("."),
    before.lastIndexOf("!"),
    before.lastIndexOf("?"),
    before.lastIndexOf("\n")
  );
  if (lastBreak >= 0) start = lastBreak + 1;
  const after = prompt.slice(matchIndex);
  const nextBreakMatch = after.search(sentenceBreaks);
  if (nextBreakMatch >= 0) end = matchIndex + nextBreakMatch;
  return prompt.slice(start, end).trim().slice(0, 200);
}
function detectDecisions(prompt) {
  const found = [];
  const seen = /* @__PURE__ */ new Set();
  for (const { regex, category } of PATTERNS) {
    const match = regex.exec(prompt);
    if (!match) continue;
    const sentence = extractSentence(prompt, match.index);
    if (!sentence || seen.has(sentence)) continue;
    seen.add(sentence);
    found.push({ text: sentence, category });
  }
  return found;
}
function loadDecisions() {
  if (!(0, import_fs.existsSync)(DECISIONS_PATH)) return [];
  try {
    return JSON.parse((0, import_fs.readFileSync)(DECISIONS_PATH, "utf-8"));
  } catch {
    return [];
  }
}
function saveDecisions(decisions) {
  const dir = (0, import_path.dirname)(DECISIONS_PATH);
  if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
  (0, import_fs.writeFileSync)(DECISIONS_PATH, JSON.stringify(decisions, null, 2), "utf-8");
}
function recordNewDecisions(prompt) {
  if (!prompt || prompt.length < 5) return 0;
  const detected = detectDecisions(prompt);
  if (detected.length === 0) return 0;
  const existing = loadDecisions();
  const existingHashes = new Set(existing.map((d) => d.hash));
  let added = 0;
  for (const { text, category } of detected) {
    const hash = hashText(text);
    if (existingHashes.has(hash)) continue;
    const now = /* @__PURE__ */ new Date();
    existing.push({
      id: `d-${Math.floor(now.getTime() / 1e3)}`,
      date: now.toISOString(),
      text,
      category,
      hash
    });
    existingHashes.add(hash);
    added++;
  }
  if (added > 0) {
    saveDecisions(existing);
  }
  return added;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DECISIONS_PATH,
  PATTERNS,
  detectDecisions,
  extractSentence,
  hashText,
  loadDecisions,
  recordNewDecisions,
  saveDecisions
});
