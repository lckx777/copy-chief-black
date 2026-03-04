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
var processing_registry_exports = {};
__export(processing_registry_exports, {
  DEFAULT_TTL_DAYS: () => DEFAULT_TTL_DAYS,
  ECOSYSTEM: () => ECOSYSTEM,
  EXTRACTION_TOOL_PATTERNS: () => EXTRACTION_TOOL_PATTERNS,
  HOME: () => HOME,
  REGISTRY_FILENAME: () => REGISTRY_FILENAME,
  checkForDuplicates: () => checkForDuplicates,
  daysAgo: () => daysAgo,
  extractTargets: () => extractTargets,
  findAllRegistries: () => findAllRegistries,
  formatWarnings: () => formatWarnings,
  hashInput: () => hashInput,
  isExtractionTool: () => isExtractionTool,
  lookupTarget: () => lookupTarget,
  parseEntries: () => parseEntries
});
module.exports = __toCommonJS(processing_registry_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_crypto = require("crypto");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const ECOSYSTEM = (0, import_path.join)(HOME, "copywriting-ecosystem");
const REGISTRY_FILENAME = "processing-registry.yaml";
const DEFAULT_TTL_DAYS = 30;
const EXTRACTION_TOOL_PATTERNS = [
  /^mcp__firecrawl__/,
  /^mcp__apify__/,
  /^mcp__playwright__/
];
function hashInput(input) {
  return (0, import_crypto.createHash)("sha256").update(input).digest("hex").slice(0, 16);
}
function daysAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1e3 * 60 * 60 * 24));
}
function isExtractionTool(toolName) {
  return EXTRACTION_TOOL_PATTERNS.some((pat) => pat.test(toolName));
}
function extractTargets(toolInput) {
  const candidates = [];
  const check = (val) => {
    if (typeof val === "string" && val.length > 5) {
      if (val.startsWith("http") || val.startsWith("/") || val.includes(".com") || val.includes(".io")) {
        candidates.push(val);
      }
    }
  };
  for (const key of [
    "url",
    "urls",
    "startUrl",
    "searchTerms",
    "query",
    "path",
    "website",
    "link"
  ]) {
    const val = toolInput[key];
    if (Array.isArray(val)) {
      val.forEach(check);
    } else {
      check(val);
    }
  }
  for (const val of Object.values(toolInput)) {
    check(val);
  }
  return [...new Set(candidates)];
}
function findAllRegistries() {
  const result = [];
  if (!(0, import_fs.existsSync)(ECOSYSTEM)) return result;
  try {
    const niches = (0, import_fs.readdirSync)(ECOSYSTEM).filter((d) => {
      if (d.startsWith(".")) return false;
      try {
        return (0, import_fs.statSync)((0, import_path.join)(ECOSYSTEM, d)).isDirectory();
      } catch {
        return false;
      }
    });
    for (const niche of niches) {
      let offers = [];
      try {
        offers = (0, import_fs.readdirSync)((0, import_path.join)(ECOSYSTEM, niche)).filter((d) => {
          if (d.startsWith(".")) return false;
          try {
            return (0, import_fs.statSync)((0, import_path.join)(ECOSYSTEM, niche, d)).isDirectory();
          } catch {
            return false;
          }
        });
      } catch {
        continue;
      }
      for (const offer of offers) {
        const rp = (0, import_path.join)(ECOSYSTEM, niche, offer, REGISTRY_FILENAME);
        if ((0, import_fs.existsSync)(rp)) result.push({ offer, regPath: rp });
      }
    }
  } catch {
  }
  return result;
}
function parseEntries(content) {
  const entries = [];
  const blocks = content.split(/\n  - hash:/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key) => {
      const m = block.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n]+)["']?`, "m"));
      return m ? m[1].trim() : void 0;
    };
    const getNum = (key) => {
      const m = block.match(new RegExp(`^\\s*${key}:\\s*(\\d+)`, "m"));
      return m ? parseInt(m[1], 10) : void 0;
    };
    const firstLine = block.split("\n")[0].trim().replace(/^["']|["']$/g, "");
    const entry = {
      hash: firstLine,
      path: get("path") || "",
      date: get("date") || "",
      source: get("source") || "",
      offer: get("offer") || "",
      type: get("type") || "",
      extracted_count: getNum("extracted_count"),
      confidence: get("confidence"),
      ttl_days: getNum("ttl_days")
    };
    if (entry.hash && entry.path && entry.date) entries.push(entry);
  }
  return entries;
}
function lookupTarget(target) {
  const targetHash = hashInput(target);
  const registries = findAllRegistries();
  for (const { regPath } of registries) {
    try {
      const content = (0, import_fs.readFileSync)(regPath, "utf-8");
      const entries = parseEntries(content);
      const match = entries.find(
        (e) => e.hash === targetHash || e.path === target || e.path.includes(target)
      );
      if (match) {
        const age = daysAgo(match.date);
        const ttl = match.ttl_days ?? DEFAULT_TTL_DAYS;
        if (age <= ttl) return match;
      }
    } catch {
    }
  }
  return null;
}
function checkForDuplicates(input) {
  if (!isExtractionTool(input.tool_name)) return [];
  const targets = extractTargets(input.tool_input);
  if (targets.length === 0) return [];
  const warnings = [];
  for (const target of targets) {
    const match = lookupTarget(target);
    if (match) {
      warnings.push({ target, entry: match, agedays: daysAgo(match.date) });
    }
  }
  return warnings;
}
function formatWarnings(warnings) {
  const lines = ["\n[PROCESSING-CHECK] Duplicate extraction detected:"];
  for (const { target, entry, agedays } of warnings) {
    const ttl = entry.ttl_days ?? DEFAULT_TTL_DAYS;
    const countStr = entry.extracted_count !== void 0 ? ` (${entry.extracted_count} items extracted)` : "";
    const confStr = entry.confidence ? ` [${entry.confidence}]` : "";
    lines.push(
      `WARNING [REGISTRY] Already processed ${entry.source}/${entry.type}${confStr}: ${target.slice(0, 80)}
  Offer: ${entry.offer} | Processed: ${entry.date.split("T")[0]} (${agedays}d ago, TTL ${ttl}d)${countStr}
  Re-register after TTL or use: bun run scripts/processing-registry.ts reset ${entry.offer} --confirm`
    );
  }
  lines.push("  To skip: ignore this warning and proceed.");
  lines.push("  To track new results: re-register with updated --count.\n");
  return lines.join("\n");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_TTL_DAYS,
  ECOSYSTEM,
  EXTRACTION_TOOL_PATTERNS,
  HOME,
  REGISTRY_FILENAME,
  checkForDuplicates,
  daysAgo,
  extractTargets,
  findAllRegistries,
  formatWarnings,
  hashInput,
  isExtractionTool,
  lookupTarget,
  parseEntries
});
