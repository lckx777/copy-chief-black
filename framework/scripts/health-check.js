#!/usr/bin/env node
var import_fs = require("fs");
var import_child_process = require("child_process");
var import_path = require("path");
const HOME = require("os").homedir();
const CLAUDE_DIR = (0, import_path.join)(HOME, ".claude");
const ECOSYSTEM_DIR = (0, import_path.join)(HOME, "copywriting-ecosystem");
const SETTINGS_PATH = (0, import_path.join)(CLAUDE_DIR, "settings.json");
const CACHE_PATH = (0, import_path.join)(CLAUDE_DIR, ".health-cache.json");
const CONSTITUTION_PATH = (0, import_path.join)(CLAUDE_DIR, "constitution.md");
const MANIFEST_PATH = (0, import_path.join)(CLAUDE_DIR, "synapse-manifest.yaml");
const TEMPLATES_DIR = (0, import_path.join)(CLAUDE_DIR, "templates");
const CACHE_TTL_MS = 5 * 60 * 1e3;
const NO_CACHE = process.argv.includes("--no-cache");
const VERBOSE = process.argv.includes("--verbose");
function fileExists(p) {
  try {
    return (0, import_fs.existsSync)(p);
  } catch {
    return false;
  }
}
function readFile(p) {
  try {
    return (0, import_fs.readFileSync)(p, "utf-8");
  } catch {
    return null;
  }
}
function countFiles(dir) {
  try {
    if (!(0, import_fs.existsSync)(dir)) return 0;
    return (0, import_fs.readdirSync)(dir).filter((f) => {
      try {
        return (0, import_fs.statSync)((0, import_path.join)(dir, f)).isFile();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}
function execSafe(cmd) {
  try {
    return (0, import_child_process.execSync)(cmd, { timeout: 3e3, encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}
function isYamlParseable(content) {
  const lines = content.split("\n").filter(
    (l) => l.trim() && !l.trim().startsWith("#")
  );
  let foundKv = false;
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      if (key.length > 0 && /^[\w_.-]+$/.test(key)) {
        foundKv = true;
        break;
      }
    }
  }
  return foundKv;
}
function yamlValue(content, key) {
  const regex = new RegExp(`^\\s*${key}:\\s*(.+)$`, "m");
  const match = content.match(regex);
  if (!match) return null;
  let val = match[1].trim();
  if (val.startsWith('"') && val.includes('"', 1)) {
    const closeIdx = val.indexOf('"', 1);
    val = val.substring(1, closeIdx);
  } else if (val.startsWith("'") && val.includes("'", 1)) {
    const closeIdx = val.indexOf("'", 1);
    val = val.substring(1, closeIdx);
  } else {
    const commentIdx = val.indexOf("  #");
    if (commentIdx > 0) val = val.substring(0, commentIdx);
    const hashIdx = val.indexOf(" #");
    if (hashIdx > 0) val = val.substring(0, hashIdx);
  }
  val = val.trim();
  return val || null;
}
function yamlBool(content, key) {
  const val = yamlValue(content, key);
  if (!val) return false;
  return val === "true" || val === "yes" || val === "True";
}
function loadCache() {
  if (NO_CACHE) return null;
  try {
    const raw = readFile(CACHE_PATH);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp < CACHE_TTL_MS) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}
function saveCache(output) {
  try {
    const data = { timestamp: Date.now(), output };
    (0, import_fs.writeFileSync)(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch {
  }
}
function checkBunAvailable() {
  const bunPath = execSafe("which bun");
  if (bunPath) return { status: "OK" };
  return { status: "FAIL", message: "bun not found in PATH" };
}
function checkDiskSpace() {
  const dfOutput = execSafe("df -k /");
  if (!dfOutput) return { status: "WARN", message: "could not read disk space" };
  const lines = dfOutput.split("\n");
  if (lines.length < 2) return { status: "WARN", message: "unexpected df output" };
  const parts = lines[1].split(/\s+/);
  const availKB = parseInt(parts[3], 10);
  if (isNaN(availKB)) return { status: "WARN", message: "could not parse disk space" };
  const availGB = availKB / (1024 * 1024);
  if (availGB < 1) {
    return { status: "FAIL", message: `only ${availGB.toFixed(1)}GB free` };
  }
  return { status: "OK" };
}
function checkHooksValid() {
  const settingsRaw = readFile(SETTINGS_PATH);
  if (!settingsRaw) return { status: "WARN", message: "settings.json not readable" };
  let settings;
  try {
    settings = JSON.parse(settingsRaw);
  } catch {
    return { status: "FAIL", message: "settings.json not valid JSON" };
  }
  const hooks = settings.hooks;
  if (!hooks) return { status: "WARN", message: "no hooks in settings.json" };
  const missing = [];
  let total = 0;
  for (const event of Object.keys(hooks)) {
    const eventHooks = hooks[event];
    if (!Array.isArray(eventHooks)) continue;
    for (const group of eventHooks) {
      const hookList = group.hooks;
      if (!Array.isArray(hookList)) continue;
      for (const hook of hookList) {
        if (hook.type !== "command" || !hook.command) continue;
        total++;
        const cmdStr = hook.command;
        const match = cmdStr.match(/(?:bun run|bash|python3?|sh)\s+(~\/[^\s]+|\/[^\s]+)/);
        if (!match) continue;
        let filePath = match[1];
        if (filePath.startsWith("~/")) {
          filePath = (0, import_path.join)(HOME, filePath.slice(2));
        }
        if (!fileExists(filePath)) {
          missing.push((0, import_path.basename)(filePath));
        }
      }
    }
  }
  if (missing.length === 0) return { status: "OK" };
  if (missing.length <= 2) {
    return { status: "WARN", message: `${missing.length}/${total} hooks missing: ${missing.join(", ")}` };
  }
  return { status: "FAIL", message: `${missing.length}/${total} hook files missing` };
}
function checkConstitutionExists() {
  if (fileExists(CONSTITUTION_PATH)) return { status: "OK" };
  try {
    const template = [
      "# Constitution",
      "",
      "> Core identity and immutable rules for the Copy Chief BLACK ecosystem.",
      "",
      "## Identity",
      "Copywriter Direct Response BLACK.",
      "",
      "## Immutable Rules",
      "1. DRE-First: Emocao Dominante Residente is the primary driver.",
      "2. Copy confortavel = Copy que FALHOU.",
      "3. 5 Lentes de Validacao before any delivery.",
      "4. NUNCA band-aid. SEMPRE explorar 5 solucoes (BSSF).",
      ""
    ].join("\n");
    (0, import_fs.writeFileSync)(CONSTITUTION_PATH, template);
    return { status: "WARN", message: "created basic template (review needed)" };
  } catch {
    return { status: "FAIL", message: "missing and could not auto-create" };
  }
}
function checkSynapseManifestValid() {
  const content = readFile(MANIFEST_PATH);
  if (!content) return { status: "FAIL", message: "synapse-manifest.yaml not found" };
  if (isYamlParseable(content)) return { status: "OK" };
  return { status: "FAIL", message: "synapse-manifest.yaml not parseable" };
}
function checkActiveOfferDetected() {
  if (!(0, import_fs.existsSync)(ECOSYSTEM_DIR)) {
    return { status: "FAIL", message: "ecosystem directory not found" };
  }
  const offers = findOffers();
  if (offers.length > 0) return { status: "OK" };
  return { status: "WARN", message: "no offers with helix-state.yaml found" };
}
function checkTemplatesPresent() {
  const count = countFiles(TEMPLATES_DIR);
  if (count >= 5) return { status: "OK" };
  if (count > 0) return { status: "WARN", message: `only ${count} templates (need 5+)` };
  return { status: "FAIL", message: "templates directory empty or missing" };
}
function findOffers() {
  const offers = [];
  function scanDir(dir, depth) {
    if (depth > 3) return;
    try {
      const entries = (0, import_fs.readdirSync)(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "site" || entry === "export") continue;
        const fullPath = (0, import_path.join)(dir, entry);
        try {
          const stat = (0, import_fs.statSync)(fullPath);
          if (!stat.isDirectory()) continue;
        } catch {
          continue;
        }
        const helixPath = (0, import_path.join)(fullPath, "helix-state.yaml");
        if (fileExists(helixPath)) {
          const relativePath = fullPath.replace(ECOSYSTEM_DIR + "/", "");
          const offer = analyzeOffer(fullPath, relativePath, helixPath);
          offers.push(offer);
        } else {
          scanDir(fullPath, depth + 1);
        }
      }
    } catch {
    }
  }
  scanDir(ECOSYSTEM_DIR, 0);
  return offers;
}
function analyzeOffer(fullPath, relativePath, helixPath) {
  const name = (0, import_path.basename)(fullPath);
  const issues = [];
  const helixContent = readFile(helixPath);
  let phase = "unknown";
  let hasHelixState = false;
  if (helixContent) {
    hasHelixState = isYamlParseable(helixContent);
    if (!hasHelixState) {
      issues.push("helix-state.yaml invalid");
    }
    const workflowPhase = yamlValue(helixContent, "workflow_phase");
    const currentPhase = yamlValue(helixContent, "current_phase");
    phase = workflowPhase || currentPhase || "unknown";
  } else {
    issues.push("helix-state.yaml unreadable");
  }
  const mecanismoPath = (0, import_path.join)(fullPath, "mecanismo-unico.yaml");
  const hasMecanismo = fileExists(mecanismoPath);
  if ((phase === "briefing" || phase === "production") && !hasMecanismo) {
    issues.push("mecanismo-unico.yaml missing");
  }
  if (hasMecanismo && phase === "production") {
    const mecContent = readFile(mecanismoPath);
    if (mecContent) {
      const mecState = yamlValue(mecContent, "state");
      if (mecState && mecState !== "VALIDATED" && mecState !== "APPROVED") {
        issues.push(`mecanismo ${mecState}`);
      }
    }
  }
  const deliverableIssues = checkPhaseDeliverables(fullPath, phase);
  issues.push(...deliverableIssues);
  return { name, path: relativePath, phase, hasHelixState, hasMecanismo, issues };
}
function checkPhaseDeliverables(offerPath, phase) {
  const issues = [];
  if (phase === "production" || phase === "PRODUCTION") {
    const briefingsDir = (0, import_path.join)(offerPath, "briefings");
    if (!(0, import_fs.existsSync)(briefingsDir)) {
      issues.push("briefings/ missing");
    } else {
      const helixComplete = (0, import_path.join)(briefingsDir, "helix-complete.md");
      const phasesDir = (0, import_path.join)(briefingsDir, "phases");
      if (!fileExists(helixComplete) && !(0, import_fs.existsSync)(phasesDir)) {
        issues.push("briefing deliverables missing");
      }
    }
    const productionDir = (0, import_path.join)(offerPath, "production");
    if (!(0, import_fs.existsSync)(productionDir)) {
    }
  }
  if (phase === "research" || phase === "RESEARCH") {
    const researchDir = (0, import_path.join)(offerPath, "research");
    if (!(0, import_fs.existsSync)(researchDir)) {
      issues.push("research/ missing");
    } else {
      const synthesis = (0, import_path.join)(researchDir, "synthesis.md");
      if (!fileExists(synthesis)) {
        issues.push("synthesis.md pending");
      }
    }
  }
  return issues;
}
function buildChecks() {
  return [
    // LOCAL (CRITICAL)
    { name: "bun_available", domain: "LOCAL", severity: "CRITICAL", check: checkBunAvailable },
    { name: "disk_space", domain: "LOCAL", severity: "CRITICAL", check: checkDiskSpace },
    { name: "hooks_valid", domain: "LOCAL", severity: "CRITICAL", check: checkHooksValid },
    // PROJECT (HIGH)
    { name: "constitution_exists", domain: "PROJECT", severity: "HIGH", check: checkConstitutionExists },
    { name: "synapse_manifest_valid", domain: "PROJECT", severity: "HIGH", check: checkSynapseManifestValid },
    { name: "active_offer_detected", domain: "PROJECT", severity: "HIGH", check: checkActiveOfferDetected },
    { name: "templates_present", domain: "PROJECT", severity: "HIGH", check: checkTemplatesPresent }
  ];
}
function run() {
  const startTime = Date.now();
  const cached = loadCache();
  if (cached) {
    const elapsed2 = ((Date.now() - startTime) / 1e3).toFixed(1);
    const cacheAge = Math.round((Date.now() - cached.timestamp) / 1e3);
    console.log(cached.output);
    console.log(`\u23F1 Health check: ${elapsed2}s (cached ${cacheAge}s ago)`);
    return;
  }
  const checks = buildChecks();
  const results = /* @__PURE__ */ new Map();
  for (const domain of ["LOCAL", "PROJECT", "OFFERS"]) {
    results.set(domain, { total: 0, ok: 0, warns: [], fails: [] });
  }
  for (const check of checks) {
    const domainResult = results.get(check.domain);
    domainResult.total++;
    const result = check.check();
    if (result.status === "OK") {
      domainResult.ok++;
    } else if (result.status === "WARN") {
      domainResult.warns.push(result.message || check.name);
    } else {
      domainResult.fails.push(result.message || check.name);
    }
  }
  const offers = findOffers();
  const offersResult = results.get("OFFERS");
  offersResult.total = offers.length;
  const offerIssues = [];
  let offersOk = 0;
  for (const offer of offers) {
    if (offer.issues.length === 0) {
      offersOk++;
    } else {
      const issueStr = offer.issues.join(", ");
      offerIssues.push(`${offer.name} (${issueStr})`);
    }
  }
  offersResult.ok = offersOk;
  const outputLines = [];
  for (const domain of ["LOCAL", "PROJECT"]) {
    const r = results.get(domain);
    const emoji = r.fails.length > 0 ? "\u{1F534}" : r.warns.length > 0 ? "\u{1F7E1}" : "\u{1F7E2}";
    let line = `${emoji} ${domain}: ${r.ok}/${r.total} OK`;
    if (r.fails.length > 0) line += ` | FAIL: ${r.fails.join("; ")}`;
    if (r.warns.length > 0) line += ` | WARN: ${r.warns.join("; ")}`;
    outputLines.push(line);
  }
  const offersEmoji = offerIssues.length > offers.length / 2 ? "\u{1F534}" : offerIssues.length > 0 ? "\u{1F7E1}" : "\u{1F7E2}";
  let offersLine = `${offersEmoji} OFFERS: ${offersOk}/${offers.length} OK`;
  if (offerIssues.length > 0) {
    const maxShow = 3;
    const shown = offerIssues.slice(0, maxShow);
    offersLine += ` | ${shown.join("; ")}`;
    if (offerIssues.length > maxShow) {
      offersLine += ` +${offerIssues.length - maxShow} more`;
    }
  }
  outputLines.push(offersLine);
  if (VERBOSE && offers.length > 0) {
    outputLines.push("");
    outputLines.push("Offers detail:");
    for (const offer of offers) {
      const statusEmoji = offer.issues.length === 0 ? "\u2705" : "\u26A0\uFE0F";
      const phaseLabel = offer.phase.toUpperCase();
      let line = `  ${statusEmoji} ${offer.path} [${phaseLabel}]`;
      if (offer.issues.length > 0) line += ` \u2014 ${offer.issues.join(", ")}`;
      outputLines.push(line);
    }
  }
  const output = outputLines.join("\n");
  const elapsed = ((Date.now() - startTime) / 1e3).toFixed(1);
  saveCache(output);
  console.log(output);
  console.log(`\u23F1 Health check: ${elapsed}s (fresh)`);
}
function ensureCacheFile() {
  if (!fileExists(CACHE_PATH)) {
    try {
      (0, import_fs.writeFileSync)(CACHE_PATH, JSON.stringify({ timestamp: 0, output: "" }));
    } catch {
    }
  }
}
ensureCacheFile();
run();
