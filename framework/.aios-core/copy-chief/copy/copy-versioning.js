#!/usr/bin/env node
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
var copy_versioning_exports = {};
__export(copy_versioning_exports, {
  backupVersion: () => backupVersion,
  getBestVersion: () => getBestVersion,
  getNextVersion: () => getNextVersion,
  getVersions: () => getVersions,
  getVersionsDir: () => getVersionsDir,
  simpleDiff: () => simpleDiff
});
module.exports = __toCommonJS(copy_versioning_exports);
var import_fs = require("fs");
var import_path = require("path");
const MAX_VERSIONS = 5;
function getVersionsDir(filePath) {
  const dir = (0, import_path.dirname)(filePath);
  return (0, import_path.join)(dir, ".versions");
}
function getVersions(filePath) {
  const versionsDir = getVersionsDir(filePath);
  if (!(0, import_fs.existsSync)(versionsDir)) return [];
  const name = (0, import_path.basename)(filePath, (0, import_path.extname)(filePath));
  const ext = (0, import_path.extname)(filePath);
  const prefix = `${name}.v`;
  const versions = [];
  try {
    for (const file of (0, import_fs.readdirSync)(versionsDir)) {
      if (!file.startsWith(prefix) || !file.endsWith(ext)) continue;
      const versionStr = file.slice(prefix.length, file.length - ext.length);
      const vNum = parseInt(versionStr);
      if (isNaN(vNum)) continue;
      const vPath = (0, import_path.join)(versionsDir, file);
      const content = (0, import_fs.readFileSync)(vPath, "utf-8");
      let score;
      const scoreMatch = content.match(/(?:score|Score|BLACK)\s*:\s*(\d+(?:\.\d+)?)/i);
      if (scoreMatch) score = parseFloat(scoreMatch[1]);
      const stat = (0, import_fs.statSync)(vPath);
      versions.push({
        path: vPath,
        meta: {
          version: vNum,
          timestamp: stat.mtime.toISOString(),
          score,
          source_file: filePath,
          size_bytes: stat.size
        }
      });
    }
  } catch {
  }
  return versions.sort((a, b) => b.meta.version - a.meta.version);
}
function getNextVersion(filePath) {
  const versions = getVersions(filePath);
  if (versions.length === 0) return 1;
  return versions[0].meta.version + 1;
}
function backupVersion(filePath) {
  if (!(0, import_fs.existsSync)(filePath)) return null;
  const versionsDir = getVersionsDir(filePath);
  if (!(0, import_fs.existsSync)(versionsDir)) (0, import_fs.mkdirSync)(versionsDir, { recursive: true });
  const name = (0, import_path.basename)(filePath, (0, import_path.extname)(filePath));
  const ext = (0, import_path.extname)(filePath);
  const vNum = getNextVersion(filePath);
  const versionPath = (0, import_path.join)(versionsDir, `${name}.v${vNum}${ext}`);
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const header = `<!-- Version: ${vNum} | Backed up: ${(/* @__PURE__ */ new Date()).toISOString()} -->
`;
  (0, import_fs.writeFileSync)(versionPath, header + content);
  cleanupVersions(filePath);
  return versionPath;
}
function cleanupVersions(filePath) {
  const versions = getVersions(filePath);
  if (versions.length <= MAX_VERSIONS) return;
  const toDelete = versions.slice(MAX_VERSIONS);
  for (const v of toDelete) {
    try {
      (0, import_fs.unlinkSync)(v.path);
    } catch {
    }
  }
}
function getBestVersion(filePath) {
  const versions = getVersions(filePath);
  if (versions.length === 0) return null;
  const scored = versions.filter((v) => v.meta.score !== void 0);
  if (scored.length === 0) return versions[0];
  return scored.sort((a, b) => (b.meta.score || 0) - (a.meta.score || 0))[0];
}
function simpleDiff(oldText, newText) {
  const oldWords = new Set(oldText.split(/\s+/).filter((w) => w.length > 3));
  const newWords = new Set(newText.split(/\s+/).filter((w) => w.length > 3));
  const added = [];
  const removed = [];
  let unchanged = 0;
  for (const w of newWords) {
    if (oldWords.has(w)) unchanged++;
    else added.push(w);
  }
  for (const w of oldWords) {
    if (!newWords.has(w)) removed.push(w);
  }
  return { added, removed, unchanged };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  backupVersion,
  getBestVersion,
  getNextVersion,
  getVersions,
  getVersionsDir,
  simpleDiff
});
