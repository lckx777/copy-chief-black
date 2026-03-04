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
var self_critique_exports = {};
__export(self_critique_exports, {
  BANNED_WORDS: () => BANNED_WORDS,
  HESITATION_WORDS: () => HESITATION_WORDS,
  check1_vocTokens: () => check1_vocTokens,
  check2_mupMus: () => check2_mupMus,
  check3_cliches: () => check3_cliches,
  check4_especificidade: () => check4_especificidade,
  check5_dre: () => check5_dre,
  detectOfferPath: () => detectOfferPath,
  extractContent: () => extractContent,
  extractFilePath: () => extractFilePath,
  loadVocKeywords: () => loadVocKeywords,
  runSelfCritique: () => runSelfCritique
});
module.exports = __toCommonJS(self_critique_exports);
var import_fs = require("fs");
var import_path = require("path");
const BANNED_WORDS = [
  "revolucion\xE1rio",
  "revolucionario",
  "inovador",
  "incr\xEDvel",
  "inacredit\xE1vel",
  "inacreditavel",
  "empoderar",
  "potencializar",
  "alavancar",
  "desbloquear",
  "transforma\xE7\xE3o",
  "transformacao",
  "jornada"
];
const HESITATION_WORDS = [
  "pode ser",
  "talvez",
  "possivelmente",
  "provavelmente",
  "quem sabe"
];
function extractFilePath(toolInput) {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field];
  }
  return null;
}
function extractContent(toolInput) {
  if (typeof toolInput.content === "string") return toolInput.content;
  if (typeof toolInput.new_string === "string") return toolInput.new_string;
  return "";
}
function detectOfferPath(filePath) {
  let dir = (0, import_path.dirname)(filePath);
  for (let i = 0; i < 10; i++) {
    if ((0, import_fs.existsSync)((0, import_path.join)(dir, "CONTEXT.md")) || (0, import_fs.existsSync)((0, import_path.join)(dir, "mecanismo-unico.yaml"))) {
      return dir;
    }
    const parent = (0, import_path.dirname)(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "";
}
function loadVocKeywords(offerPath) {
  const vocPath = (0, import_path.join)(offerPath, "research", "voc", "summary.md");
  if (!(0, import_fs.existsSync)(vocPath)) return [];
  try {
    const content = (0, import_fs.readFileSync)(vocPath, "utf-8").toLowerCase();
    const stopwords = /* @__PURE__ */ new Set([
      "para",
      "como",
      "mais",
      "est\xE1",
      "esta",
      "esse",
      "essa",
      "isso",
      "sobre",
      "pode",
      "quando",
      "onde",
      "qual",
      "quem",
      "porque",
      "muito",
      "mesmo",
      "ainda",
      "tamb\xE9m",
      "todos",
      "todas",
      "outro",
      "cada",
      "entre",
      "ap\xF3s",
      "antes",
      "desde",
      "parte",
      "forma",
      "being",
      "with",
      "that",
      "this",
      "from",
      "have",
      "they"
    ]);
    const words = content.match(/\b[a-záàâãéêíóôõúüç]{4,}\b/g) || [];
    const freq = {};
    for (const w of words) {
      if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w);
  } catch {
    return [];
  }
}
function check1_vocTokens(content, offerPath) {
  const keywords = loadVocKeywords(offerPath);
  if (keywords.length === 0) {
    return { check: "VOC Tokens", passed: true, detail: "VOC n\xE3o dispon\xEDvel (skip)" };
  }
  const contentLower = content.toLowerCase();
  const hits = keywords.filter((kw) => contentLower.includes(kw));
  const passed = hits.length >= 3;
  return {
    check: "VOC Tokens",
    passed,
    detail: passed ? `${hits.length} keywords VOC encontradas` : `Apenas ${hits.length} keywords VOC (m\xEDn: 3). Reler research/voc/summary.md`
  };
}
function check2_mupMus(content, offerPath) {
  const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
  if (!(0, import_fs.existsSync)(mecPath)) {
    return { check: "MUP/MUS", passed: true, detail: "mecanismo-unico.yaml n\xE3o encontrado (skip)" };
  }
  try {
    const mec = (0, import_fs.readFileSync)(mecPath, "utf-8");
    const contentLower = content.toLowerCase();
    const gimmickName = mec.match(/gimmick_name[:\s]+["']?([^\n"']+)/i)?.[1] || "";
    const sexyCause = mec.match(/sexy_cause[:\s]+["']?([^\n"']+)/i)?.[1] || "";
    const hasGimmick = gimmickName && contentLower.includes(gimmickName.toLowerCase().slice(0, 12));
    const hasCause = sexyCause && contentLower.includes(sexyCause.toLowerCase().slice(0, 12));
    const passed = hasGimmick || hasCause;
    const missing = [];
    if (!hasGimmick && gimmickName) missing.push(`Gimmick: "${gimmickName}"`);
    if (!hasCause && sexyCause) missing.push(`Sexy Cause: "${sexyCause}"`);
    return {
      check: "MUP/MUS",
      passed,
      detail: passed ? "Elementos do mecanismo presentes" : `Faltam: ${missing.join(", ")}`
    };
  } catch {
    return { check: "MUP/MUS", passed: true, detail: "Erro ao ler mecanismo (skip)" };
  }
}
function check3_cliches(content) {
  const contentLower = content.toLowerCase();
  const found = BANNED_WORDS.filter((w) => contentLower.includes(w));
  const hesitations = HESITATION_WORDS.filter((w) => contentLower.includes(w));
  const allFound = [...found, ...hesitations];
  const passed = allFound.length === 0;
  return {
    check: "Clich\xEAs/Hesita\xE7\xE3o",
    passed,
    detail: passed ? "Zero clich\xEAs e hesita\xE7\xF5es" : `${allFound.length} detectado(s): ${allFound.slice(0, 5).join(", ")}`
  };
}
function check4_especificidade(content) {
  let hits = 0;
  if (/\b\d{2}\s*anos\b/i.test(content)) hits++;
  if (/\b(Dona|Sr\.|Sra\.|Dr\.|Maria|João|José|Ana|Pedro)\b/.test(content)) hits++;
  if (/\b\d+[,.]\d+%?\b/.test(content)) hits++;
  if (/(acordou|3h|4h|madrugada|suando|tremendo|chorou)/i.test(content)) hits++;
  if (/(disse|falou|olhou|perguntou)/i.test(content)) hits++;
  const passed = hits >= 3;
  return {
    check: "Especificidade",
    passed,
    detail: passed ? `${hits}/5 elementos espec\xEDficos` : `Apenas ${hits}/5 (m\xEDn: 3). Faltam dados concretos, nomes, cenas`
  };
}
function check5_dre(content) {
  const patterns = {
    medo: /medo|terror|pavor|assust|pânico|panico/gi,
    vergonha: /vergonha|humilha|constrang/gi,
    frustracao: /frustra|desespero|desist|cansad/gi,
    culpa: /culpa|negligên|falh(ei|ou)|arrepen/gi,
    raiva: /raiva|indigna|revolt|injusti/gi
  };
  let maxCount = 0;
  let dominantEmotion = "";
  for (const [emotion, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern) || [];
    if (matches.length > maxCount) {
      maxCount = matches.length;
      dominantEmotion = emotion;
    }
  }
  const passed = maxCount >= 3;
  return {
    check: "DRE Presente",
    passed,
    detail: passed ? `DRE "${dominantEmotion}" com ${maxCount} men\xE7\xF5es` : `DRE fraca: "${dominantEmotion || "nenhuma"}" com ${maxCount} men\xE7\xF5es (m\xEDn: 3)`
  };
}
function runSelfCritique(input) {
  if (!["Write", "Edit"].includes(input.tool_name)) return null;
  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return null;
  if (!/production\//i.test(filePath)) return null;
  if (!filePath.endsWith(".md")) return null;
  const content = extractContent(input.tool_input);
  if (content.length < 200) return null;
  const offerPath = detectOfferPath(filePath);
  const results = [
    check1_vocTokens(content, offerPath),
    check2_mupMus(content, offerPath),
    check3_cliches(content),
    check4_especificidade(content),
    check5_dre(content)
  ];
  const failures = results.filter((r) => !r.passed);
  const passCount = results.length - failures.length;
  const fileName = (0, import_path.basename)(filePath);
  let warningMessage = null;
  if (failures.length > 0) {
    const header = `
\u{1F50D} SELF-CRITIQUE: ${passCount}/5 checks passed para ${fileName}`;
    const details = failures.map((f) => `  \u26A0 ${f.check}: ${f.detail}`).join("\n");
    const footer = failures.length >= 3 ? "  \u{1F4A1} Considere revisar antes de salvar (3+ falhas = copy fr\xE1gil)" : "  \u{1F4A1} Issues menores \u2014 copy pode prosseguir";
    warningMessage = `${header}
${details}
${footer}
`;
  }
  return {
    filePath,
    fileName,
    results,
    failures,
    passCount,
    totalChecks: results.length,
    warningMessage
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BANNED_WORDS,
  HESITATION_WORDS,
  check1_vocTokens,
  check2_mupMus,
  check3_cliches,
  check4_especificidade,
  check5_dre,
  detectOfferPath,
  extractContent,
  extractFilePath,
  loadVocKeywords,
  runSelfCritique
});
