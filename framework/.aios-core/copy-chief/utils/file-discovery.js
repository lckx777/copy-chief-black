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
var file_discovery_exports = {};
__export(file_discovery_exports, {
  EXCLUDED_PATTERNS: () => EXCLUDED_PATTERNS,
  MAX_DEPTH: () => MAX_DEPTH,
  MAX_EXECUTION_MS: () => MAX_EXECUTION_MS,
  MAX_SIMILAR_FILES: () => MAX_SIMILAR_FILES,
  discoverSimilarFiles: () => discoverSimilarFiles,
  extractFilePath: () => extractFilePath,
  filenameSimilarity: () => filenameSimilarity,
  findSimilarInDir: () => findSimilarInDir,
  formatDiscoveryWarning: () => formatDiscoveryWarning,
  getFileModifiedDate: () => getFileModifiedDate,
  isExcludedPath: () => isExcludedPath
});
module.exports = __toCommonJS(file_discovery_exports);
var import_fs = require("fs");
var import_path = require("path");
const MAX_EXECUTION_MS = 3e3;
const MAX_SIMILAR_FILES = 5;
const MAX_DEPTH = 2;
const EXCLUDED_PATTERNS = [
  /\/production\//i,
  /\/research\//i,
  /\/tmp\//i,
  /\/temp\//i,
  /session-state\//i,
  /node_modules\//i,
  /\.git\//i,
  /\/raw\//i,
  /\/processed\//i
];
function extractFilePath(toolInput) {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") {
      return toolInput[field];
    }
  }
  return null;
}
function isExcludedPath(filePath) {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath));
}
function getFileModifiedDate(filePath) {
  try {
    const stats = (0, import_fs.statSync)(filePath);
    const d = stats.mtime;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "unknown";
  }
}
function filenameSimilarity(name1, name2) {
  const base1 = (0, import_path.basename)(name1, (0, import_path.extname)(name1)).toLowerCase();
  const base2 = (0, import_path.basename)(name2, (0, import_path.extname)(name2)).toLowerCase();
  if (base1 === base2) return 1;
  const words1 = new Set(base1.split(/[-_.\s]+/).filter((w) => w.length > 1));
  const words2 = new Set(base2.split(/[-_.\s]+/).filter((w) => w.length > 1));
  if (words1.size === 0 || words2.size === 0) return 0;
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = words1.size + words2.size - intersection;
  if (union === 0) return 0;
  const jaccard = intersection / union;
  const firstWord1 = [...words1][0];
  const firstWord2 = [...words2][0];
  const prefixBonus = firstWord1 === firstWord2 ? 0.15 : 0;
  return Math.min(1, jaccard + prefixBonus);
}
function findSimilarInDir(dir, targetName, targetExt) {
  const results = [];
  try {
    if (!(0, import_fs.existsSync)(dir)) return results;
    const entries = (0, import_fs.readdirSync)(dir);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const fullPath = (0, import_path.join)(dir, entry);
      try {
        const stats = (0, import_fs.statSync)(fullPath);
        if (!stats.isFile()) continue;
      } catch {
        continue;
      }
      const entryExt = (0, import_path.extname)(entry);
      const similarity = filenameSimilarity(targetName, entry);
      const sameExt = entryExt === targetExt;
      const threshold = sameExt ? 0.3 : 0.5;
      if (similarity >= threshold) {
        results.push({
          path: fullPath,
          modified: getFileModifiedDate(fullPath),
          similarity: sameExt ? `nome ${Math.round(similarity * 100)}% similar, mesma extensao` : `nome ${Math.round(similarity * 100)}% similar`
        });
      }
    }
  } catch {
  }
  return results;
}
function discoverSimilarFiles(input) {
  const noWarn = { shouldWarn: false, filePath: "", similar: [] };
  if (input.tool_name !== "Write") return noWarn;
  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return noWarn;
  if ((0, import_fs.existsSync)(filePath)) return noWarn;
  if (isExcludedPath(filePath)) return noWarn;
  const targetDir = (0, import_path.dirname)(filePath);
  const targetName = (0, import_path.basename)(filePath);
  const targetExt = (0, import_path.extname)(filePath);
  const allSimilar = [];
  allSimilar.push(...findSimilarInDir(targetDir, targetName, targetExt));
  let currentDir = targetDir;
  for (let i = 0; i < MAX_DEPTH; i++) {
    const parentDir = (0, import_path.dirname)(currentDir);
    if (parentDir === currentDir) break;
    allSimilar.push(...findSimilarInDir(parentDir, targetName, targetExt));
    currentDir = parentDir;
  }
  const seen = /* @__PURE__ */ new Set();
  const unique = allSimilar.filter((f) => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });
  unique.sort((a, b) => {
    const pctA = parseInt(a.similarity.match(/(\d+)%/)?.[1] || "0");
    const pctB = parseInt(b.similarity.match(/(\d+)%/)?.[1] || "0");
    return pctB - pctA;
  });
  const topResults = unique.slice(0, MAX_SIMILAR_FILES);
  return {
    shouldWarn: topResults.length > 0,
    filePath,
    similar: topResults
  };
}
function formatDiscoveryWarning(result) {
  const fileList = result.similar.map((f) => `  - ${f.path} (modificado: ${f.modified}) [${f.similarity}]`).join("\n");
  return `
\u{1F50D} DISCOVERY CHECK: Criando novo arquivo "${(0, import_path.basename)(result.filePath)}"
Arquivos similares encontrados:
${fileList}

Considere: Estender existente ao inves de criar novo?
(Este e um aviso \u2014 a criacao NAO foi bloqueada)

`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EXCLUDED_PATTERNS,
  MAX_DEPTH,
  MAX_EXECUTION_MS,
  MAX_SIMILAR_FILES,
  discoverSimilarFiles,
  extractFilePath,
  filenameSimilarity,
  findSimilarInDir,
  formatDiscoveryWarning,
  getFileModifiedDate,
  isExcludedPath
});
