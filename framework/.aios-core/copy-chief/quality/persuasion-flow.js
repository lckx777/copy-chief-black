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
var persuasion_flow_exports = {};
__export(persuasion_flow_exports, {
  COMPATIBLE_PAIRS: () => COMPATIBLE_PAIRS,
  DRE_LEVEL_REGEX: () => DRE_LEVEL_REGEX,
  EMOTIONAL_ENTRY_REGEX: () => EMOTIONAL_ENTRY_REGEX,
  EMOTIONAL_EXIT_REGEX: () => EMOTIONAL_EXIT_REGEX,
  FRONTMATTER_REGEX: () => FRONTMATTER_REGEX,
  UNIT_HEADER_REGEX: () => UNIT_HEADER_REGEX,
  emotionsCompatible: () => emotionsCompatible,
  extractFilePath: () => extractFilePath,
  isProductionFile: () => isProductionFile,
  normalizeEmotion: () => normalizeEmotion,
  parseFromFrontmatter: () => parseFromFrontmatter,
  parseUnits: () => parseUnits,
  runPersuasionFlowCheck: () => runPersuasionFlowCheck
});
module.exports = __toCommonJS(persuasion_flow_exports);
var import_fs = require("fs");
production;
const UNIT_HEADER_REGEX = /^##\s+(?:Unidade|Unit|Capitulo|Capítulo|Bloco|Section)\s+(\d+)/im;
const EMOTIONAL_ENTRY_REGEX = /(?:ENTRADA\s+EMOCIONAL|emotional[_-]?entry|Entrada)\s*:\s*(.+)/i;
const EMOTIONAL_EXIT_REGEX = /(?:SAÍDA\s+EMOCIONAL|SAIDA\s+EMOCIONAL|emotional[_-]?exit|Saída|Saida)\s*:\s*(.+)/i;
const DRE_LEVEL_REGEX = /(?:DRE\s+LEVEL|dre[_-]?level|DRE)\s*:\s*(\d)/i;
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;
function extractFilePath(toolInput) {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field];
  }
  return null;
}
function isProductionFile(filePath) {
  return /\/production\/.*\.md$/i.test(filePath);
}
function normalizeEmotion(emotion) {
  return emotion.toLowerCase().trim().replace(/[+,&]/g, " ").replace(/\s+/g, " ").replace(/nível\s*\d/gi, "").replace(/nivel\s*\d/gi, "").trim();
}
const COMPATIBLE_PAIRS = {
  medo: ["medo", "ansiedade", "desespero", "urgencia", "urg\xEAncia"],
  curiosidade: ["curiosidade", "interesse", "engajamento", "atencao", "aten\xE7\xE3o"],
  esperanca: ["esperan\xE7a", "esperanca", "crenca", "cren\xE7a", "desejo", "confianca", "confian\xE7a"],
  raiva: ["raiva", "indignacao", "indigna\xE7\xE3o", "frustra\xE7\xE3o", "frustracao"],
  reconhecimento: ["reconhecimento", "medo", "vergonha", "identificacao", "identifica\xE7\xE3o"],
  desejo: ["desejo", "urgencia", "urg\xEAncia", "acao", "a\xE7\xE3o"],
  confianca: ["confianca", "confian\xE7a", "seguranca", "seguran\xE7a", "desejo"],
  seguranca: ["seguranca", "seguran\xE7a", "urgencia", "urg\xEAncia", "acao", "a\xE7\xE3o"],
  crenca: ["crenca", "cren\xE7a", "desejo", "confianca", "confian\xE7a"],
  frustracao: ["frustracao", "frustra\xE7\xE3o", "raiva", "desespero", "esperanca", "esperan\xE7a"],
  vergonha: ["vergonha", "medo", "desespero", "esperanca", "esperan\xE7a"]
};
function emotionsCompatible(exitEmotion, entryEmotion) {
  const exitNorm = normalizeEmotion(exitEmotion);
  const entryNorm = normalizeEmotion(entryEmotion);
  if (exitNorm === entryNorm) return true;
  const exitWords = exitNorm.split(" ").filter((w) => w.length > 3);
  const entryWords = entryNorm.split(" ").filter((w) => w.length > 3);
  for (const word of exitWords) {
    if (entryWords.includes(word)) return true;
  }
  for (const exitWord of exitWords) {
    const compatible = COMPATIBLE_PAIRS[exitWord];
    if (compatible) {
      for (const entryWord of entryWords) {
        if (compatible.includes(entryWord)) return true;
      }
    }
  }
  return false;
}
function parseUnits(content) {
  const units = [];
  const sectionRegex = /^##\s+(?:Unidade|Unit|Capitulo|Capítulo|Bloco|Section)\s+(\d+)\s*[:\-—]\s*(.+)/gim;
  const sections = [];
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      position: parseInt(match[1], 10),
      name: match[2].trim(),
      startIdx: match.index
    });
  }
  if (sections.length === 0) return units;
  for (let i = 0; i < sections.length; i++) {
    const startIdx = sections[i].startIdx;
    const endIdx = i < sections.length - 1 ? sections[i + 1].startIdx : content.length;
    const sectionContent = content.substring(startIdx, endIdx);
    const entryMatch = EMOTIONAL_ENTRY_REGEX.exec(sectionContent);
    const exitMatch = EMOTIONAL_EXIT_REGEX.exec(sectionContent);
    const dreMatch = DRE_LEVEL_REGEX.exec(sectionContent);
    if (entryMatch && exitMatch) {
      units.push({
        position: sections[i].position,
        name: sections[i].name,
        emotional_entry: entryMatch[1].trim(),
        emotional_exit: exitMatch[1].trim(),
        dre_level: dreMatch ? parseInt(dreMatch[1], 10) : 0
      });
    }
  }
  return units;
}
function parseFromFrontmatter(content) {
  const fmMatch = FRONTMATTER_REGEX.exec(content);
  if (!fmMatch) return [];
  const fm = fmMatch[1];
  const units = [];
  const unitBlocks = fm.split(/^-\s+/m).filter((b) => b.trim());
  for (const block of unitBlocks) {
    const posMatch = /position\s*:\s*(\d+)/i.exec(block);
    const nameMatch = /unit_name\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const entryMatch = /emotional_entry\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const exitMatch = /emotional_exit\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const dreMatch = /dre_level\s*:\s*(\d)/i.exec(block);
    if (entryMatch && exitMatch) {
      units.push({
        position: posMatch ? parseInt(posMatch[1], 10) : units.length + 1,
        name: nameMatch ? nameMatch[1].trim() : `Unit ${units.length + 1}`,
        emotional_entry: entryMatch[1].trim(),
        emotional_exit: exitMatch[1].trim(),
        dre_level: dreMatch ? parseInt(dreMatch[1], 10) : 0
      });
    }
  }
  return units;
}
function runPersuasionFlowCheck(input) {
  const filePath = extractFilePath(input.tool_input);
  if (!filePath || !isProductionFile(filePath)) return null;
  if (!(0, import_fs.existsSync)(filePath)) return null;
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  let units = parseUnits(content);
  if (units.length === 0) {
    units = parseFromFrontmatter(content);
  }
  if (units.length < 2) return null;
  units.sort((a, b) => a.position - b.position);
  const checks = [];
  let discontinuities = 0;
  for (let i = 0; i < units.length - 1; i++) {
    const current = units[i];
    const next = units[i + 1];
    const continuous = emotionsCompatible(current.emotional_exit, next.emotional_entry);
    checks.push({
      from_unit: current.position,
      to_unit: next.position,
      exit_emotion: current.emotional_exit,
      entry_emotion: next.emotional_entry,
      continuous
    });
    if (!continuous) discontinuities++;
  }
  let dreDrops = 0;
  for (let i = 0; i < units.length - 1; i++) {
    if (units[i + 1].dre_level > 0 && units[i].dre_level > 0) {
      if (units[i + 1].dre_level < units[i].dre_level - 1) {
        dreDrops++;
      }
    }
  }
  let warningMessage = null;
  if (discontinuities === 0 && dreDrops === 0) {
    warningMessage = `[FLOW-CHECK] \u2705 Fluxo emocional cont\xEDnuo \u2014 ${units.length} unidades, ${checks.length} transi\xE7\xF5es OK`;
  } else {
    const lines = [];
    if (discontinuities > 0) {
      lines.push(`[FLOW-CHECK] \u26A0\uFE0F ${discontinuities} ruptura(s) de fluxo emocional detectada(s):`);
      for (const check of checks) {
        if (!check.continuous) {
          lines.push(`  Unidade ${check.from_unit} \u2192 ${check.to_unit}: sa\xEDda="${check.exit_emotion}" \u2260 entrada="${check.entry_emotion}"`);
        }
      }
    }
    if (dreDrops > 0) {
      lines.push(`[FLOW-CHECK] \u26A0\uFE0F ${dreDrops} queda(s) brusca(s) de DRE level detectada(s) \u2014 escalada deve ser progressiva`);
    }
    warningMessage = lines.join("\n");
  }
  return { filePath, units, checks, discontinuities, dreDrops, warningMessage };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COMPATIBLE_PAIRS,
  DRE_LEVEL_REGEX,
  EMOTIONAL_ENTRY_REGEX,
  EMOTIONAL_EXIT_REGEX,
  FRONTMATTER_REGEX,
  UNIT_HEADER_REGEX,
  emotionsCompatible,
  extractFilePath,
  isProductionFile,
  normalizeEmotion,
  parseFromFrontmatter,
  parseUnits,
  runPersuasionFlowCheck
});
