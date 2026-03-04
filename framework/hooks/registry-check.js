#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
const REGISTRY_PATH = path.join(process.env.HOME, ".claude/registry.yaml");
let inputData = "";
try {
  inputData = fs.readFileSync(0, "utf8");
} catch {
  process.exit(0);
}
let input;
try {
  input = JSON.parse(inputData);
} catch {
  process.exit(0);
}
function isSimilar(a, b) {
  if (a === b) return true;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al.includes(bl) || bl.includes(al)) return true;
  const aWords = al.split(/[-_.]/).filter((w) => w.length > 2);
  const bWords = bl.split(/[-_.]/).filter((w) => w.length > 2);
  const overlap = aWords.filter((w) => bWords.includes(w));
  return overlap.length >= 2;
}
function parseRegistryYaml(content) {
  const entities = {};
  let currentCategory = "";
  let currentItem = null;
  for (const line of content.split("\n")) {
    const categoryMatch = line.match(/^  (\w+):$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      entities[currentCategory] = [];
      currentItem = null;
      continue;
    }
    const itemMatch = line.match(/^    - (\w+):\s*"?([^"]*)"?$/);
    if (itemMatch && currentCategory) {
      currentItem = { [itemMatch[1]]: itemMatch[2] };
      entities[currentCategory].push(currentItem);
      continue;
    }
    const propMatch = line.match(/^      (\w+):\s*"?([^"]*)"?$/);
    if (propMatch && currentItem) {
      currentItem[propMatch[1]] = propMatch[2];
    }
  }
  return entities;
}
function main() {
  if (!["Write", "Edit"].includes(input.tool_name)) return;
  const filePath = input.tool_input?.file_path;
  if (!filePath) return;
  const watchPaths = [
    "/.claude/hooks/",
    "/.claude/skills/",
    "/.claude/rules/",
    "/.claude/scripts/workers/"
  ];
  if (!watchPaths.some((p) => filePath.includes(p))) return;
  if (fs.existsSync(filePath)) return;
  let registryContent;
  try {
    registryContent = fs.readFileSync(REGISTRY_PATH, "utf8");
  } catch {
    return;
  }
  const entities = parseRegistryYaml(registryContent);
  const newName = path.basename(filePath).replace(/\.[^.]+$/, "");
  for (const category of Object.keys(entities)) {
    const items = entities[category];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const existingName = (item.name || item.path || "").replace(/\.[^.]+$/, "");
      if (!existingName) continue;
      if (isSimilar(newName, existingName)) {
        console.error(`\u26A0\uFE0F [REGISTRY] Componente similar encontrado: ${category}/${item.name || item.path}`);
        console.error(`   Novo: ${newName}`);
        console.error(`   Existente: ${existingName}`);
        console.error(`   Verifique se nao e duplicata antes de criar.`);
        return;
      }
    }
  }
}
main();
