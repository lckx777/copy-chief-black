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
var session_digest_exports = {};
__export(session_digest_exports, {
  DIGESTS_DIR: () => DIGESTS_DIR,
  ECOSYSTEM_ROOT: () => ECOSYSTEM_ROOT,
  cleanupOldDigests: () => cleanupOldDigests,
  discoverOffers: () => discoverOffers,
  extractField: () => extractField,
  extractGateBool: () => extractGateBool,
  extractMecanismoState: () => extractMecanismoState,
  extractNestedField: () => extractNestedField,
  extractPhase: () => extractPhase,
  extractUpdatedAt: () => extractUpdatedAt,
  findLastModifiedFile: () => findLastModifiedFile,
  generateDigest: () => generateDigest,
  parseYamlValue: () => parseYamlValue,
  processHookEvent: () => processHookEvent,
  suggestNextSteps: () => suggestNextSteps
});
module.exports = __toCommonJS(session_digest_exports);
var import_fs = require("fs");
var import_path = require("path");
const HOME = process.env.HOME || "/tmp";
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
const DIGESTS_DIR = (0, import_path.join)(HOME, ".claude", "session-digests");
function parseYamlValue(raw) {
  let v = raw.trim();
  if (v.startsWith('"')) {
    const closeIdx = v.indexOf('"', 1);
    if (closeIdx > 0) return v.slice(1, closeIdx);
  }
  if (v.startsWith("'")) {
    const closeIdx = v.indexOf("'", 1);
    if (closeIdx > 0) return v.slice(1, closeIdx);
  }
  const hashIdx = v.indexOf(" #");
  if (hashIdx > 0) v = v.slice(0, hashIdx).trim();
  return v;
}
function extractField(content, field) {
  const re = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, "m");
  const m = content.match(re);
  return m ? parseYamlValue(m[1]) : "";
}
function extractNestedField(content, parent, field) {
  const parentRe = new RegExp(`^\\s*${parent}\\s*:`, "m");
  const parentMatch = parentRe.exec(content);
  if (!parentMatch) return "";
  const afterParent = content.slice(parentMatch.index + parentMatch[0].length);
  const lines = afterParent.split("\n");
  for (const line of lines) {
    if (/^\S/.test(line) && line.trim().length > 0) break;
    const fieldRe = new RegExp(`^\\s+${field}\\s*:\\s*(.+)$`);
    const m = line.match(fieldRe);
    if (m) return parseYamlValue(m[1]);
  }
  return "";
}
function extractGateBool(content, gateName) {
  const simple = extractNestedField(content, "gates", gateName);
  if (simple === "true") return true;
  if (simple === "false") return false;
  const gatesIdx = content.indexOf("\ngates:");
  if (gatesIdx === -1) return false;
  const afterGates = content.slice(gatesIdx);
  const gateRe = new RegExp(`\\n\\s+${gateName}:\\s*\\n`, "m");
  const gateMatch = gateRe.exec(afterGates);
  if (!gateMatch) return false;
  const afterGate = afterGates.slice(gateMatch.index + gateMatch[0].length);
  const passedLines = afterGate.split("\n");
  for (const line of passedLines) {
    if (/^\s{2}\S/.test(line) || /^\S/.test(line)) break;
    const passedM = line.match(/^\s+passed\s*:\s*(.+)$/);
    if (passedM) return parseYamlValue(passedM[1]) === "true";
  }
  return false;
}
function extractMecanismoState(content, offerDir) {
  const state = extractNestedField(content, "mecanismo", "state");
  if (state && state !== "") return state;
  if (offerDir) {
    const mecPath = (0, import_path.join)(offerDir, "mecanismo-unico.yaml");
    if ((0, import_fs.existsSync)(mecPath)) {
      try {
        const mecContent = (0, import_fs.readFileSync)(mecPath, "utf-8");
        const valState = extractNestedField(mecContent, "validation", "state");
        if (valState) return valState;
      } catch {
      }
    }
  }
  return "UNDEFINED";
}
function extractPhase(content) {
  const cp = extractField(content, "current_phase");
  if (cp) return cp.toUpperCase();
  const wp = extractField(content, "workflow_phase");
  if (wp) return wp.toUpperCase();
  return "UNKNOWN";
}
function extractUpdatedAt(content) {
  return extractField(content, "updated_at") || "";
}
function findLastModifiedFile(dir, maxDepth = 3) {
  if (!(0, import_fs.existsSync)(dir) || maxDepth <= 0) return null;
  let best = null;
  try {
    const entries = (0, import_fs.readdirSync)(dir);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const full = (0, import_path.join)(dir, entry);
      try {
        const st = (0, import_fs.statSync)(full);
        if (st.isFile() && entry.endsWith(".md")) {
          if (!best || st.mtimeMs > best.mtime) {
            best = { path: full, mtime: st.mtimeMs };
          }
        } else if (st.isDirectory()) {
          const sub = findLastModifiedFile(full, maxDepth - 1);
          if (sub && (!best || sub.mtime > best.mtime)) {
            best = sub;
          }
        }
      } catch {
      }
    }
  } catch {
  }
  return best;
}
function discoverOffers() {
  const offers = [];
  const niches = ["concursos", "saude", "relacionamento", "riqueza"];
  for (const niche of niches) {
    const nicheDir = (0, import_path.join)(ECOSYSTEM_ROOT, niche);
    if (!(0, import_fs.existsSync)(nicheDir)) continue;
    let entries;
    try {
      entries = (0, import_fs.readdirSync)(nicheDir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const offerDir = (0, import_path.join)(nicheDir, entry);
      const helixPath = (0, import_path.join)(offerDir, "helix-state.yaml");
      if (!(0, import_fs.existsSync)(helixPath)) continue;
      try {
        if (!(0, import_fs.statSync)(offerDir).isDirectory()) continue;
      } catch {
        continue;
      }
      const content = (0, import_fs.readFileSync)(helixPath, "utf-8");
      offers.push({
        name: entry,
        path: `${niche}/${entry}`,
        fullPath: offerDir,
        phase: extractPhase(content),
        gates: {
          research: extractGateBool(content, "research"),
          briefing: extractGateBool(content, "briefing"),
          production: extractGateBool(content, "production")
        },
        mecanismoState: extractMecanismoState(content, offerDir),
        updatedAt: extractUpdatedAt(content)
      });
    }
  }
  offers.sort((a, b) => b.updatedAt > a.updatedAt ? 1 : -1);
  return offers;
}
function suggestNextSteps(offer) {
  const { phase, gates, mecanismoState } = offer;
  const steps = [];
  if (phase === "PRODUCTION" || gates.briefing && !gates.production) {
    if (mecanismoState !== "VALIDATED" && mecanismoState !== "APPROVED") {
      steps.push("Validar mecanismo-unico.yaml");
    }
    steps.push("Continuar producao de deliverables");
    steps.push("Rodar blind_critic + emotional_stress_test apos cada bloco");
  } else if (phase === "BRIEFING" || gates.research && !gates.briefing) {
    steps.push("Continuar fases HELIX");
    steps.push("Validar briefing gate ao completar");
  } else if (phase === "RESEARCH") {
    steps.push("Completar research summaries faltantes");
    steps.push("Validar research gate (validate-gate.py)");
  } else {
    steps.push("Iniciar research (audience-research-agent)");
  }
  return steps;
}
function generateDigest(offer) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let lastModified = "";
  const prodFile = findLastModifiedFile((0, import_path.join)(offer.fullPath, "production"));
  const briefFile = findLastModifiedFile((0, import_path.join)(offer.fullPath, "briefings"));
  if (prodFile && briefFile) {
    const best = prodFile.mtime > briefFile.mtime ? prodFile : briefFile;
    lastModified = best.path.replace(offer.fullPath + "/", "");
  } else if (prodFile) {
    lastModified = prodFile.path.replace(offer.fullPath + "/", "");
  } else if (briefFile) {
    lastModified = briefFile.path.replace(offer.fullPath + "/", "");
  }
  const nextSteps = suggestNextSteps(offer);
  const lines = [];
  lines.push("# Auto-generated before /compact");
  lines.push("digest:");
  lines.push(`  timestamp: "${now}"`);
  lines.push(`  offer: "${offer.name}"`);
  lines.push(`  offer_path: "${offer.path}"`);
  lines.push(`  phase: "${offer.phase}"`);
  lines.push("  gates:");
  lines.push(`    research: ${offer.gates.research}`);
  lines.push(`    briefing: ${offer.gates.briefing}`);
  lines.push(`    production: ${offer.gates.production}`);
  lines.push(`  mecanismo: "${offer.mecanismoState}"`);
  if (lastModified) {
    lines.push(`  last_modified_file: "${lastModified}"`);
  }
  lines.push("  next_steps:");
  for (const step of nextSteps) {
    lines.push(`    - "${step}"`);
  }
  lines.push("");
  return lines.join("\n");
}
function cleanupOldDigests() {
  if (!(0, import_fs.existsSync)(DIGESTS_DIR)) return;
  try {
    const files = (0, import_fs.readdirSync)(DIGESTS_DIR).filter((f) => f.endsWith(".yaml")).sort().reverse();
    if (files.length > 10) {
      for (const file of files.slice(10)) {
        try {
          (0, import_fs.unlinkSync)((0, import_path.join)(DIGESTS_DIR, file));
        } catch {
        }
      }
    }
  } catch {
  }
}
async function processHookEvent(_input) {
  if (!(0, import_fs.existsSync)(DIGESTS_DIR)) {
    (0, import_fs.mkdirSync)(DIGESTS_DIR, { recursive: true });
  }
  if (!(0, import_fs.existsSync)(ECOSYSTEM_ROOT)) return null;
  const offers = discoverOffers();
  if (offers.length === 0) return null;
  const active = offers.filter((o) => o.phase !== "IDLE" && o.phase !== "UNKNOWN" && o.phase !== "DELIVERED");
  const focus = active.length > 0 ? active[0] : offers[0];
  const digest = generateDigest(focus);
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const timeStr = (/* @__PURE__ */ new Date()).toISOString().slice(11, 16).replace(":", "");
  const filename = `${dateStr}-${timeStr}-${focus.name}.yaml`;
  const filepath = (0, import_path.join)(DIGESTS_DIR, filename);
  (0, import_fs.writeFileSync)(filepath, digest, "utf-8");
  cleanupOldDigests();
  return { filename, filepath, offer: focus };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DIGESTS_DIR,
  ECOSYSTEM_ROOT,
  cleanupOldDigests,
  discoverOffers,
  extractField,
  extractGateBool,
  extractMecanismoState,
  extractNestedField,
  extractPhase,
  extractUpdatedAt,
  findLastModifiedFile,
  generateDigest,
  parseYamlValue,
  processHookEvent,
  suggestNextSteps
});
