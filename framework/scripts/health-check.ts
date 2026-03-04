#!/usr/bin/env bun
/**
 * Health Check System v1.0
 * Runs on SessionStart. Fast (~1-2s), cacheable (5min TTL), concise output (~200 tokens max).
 *
 * Domains:
 *   LOCAL (CRITICAL)  — bun, disk, hooks
 *   PROJECT (HIGH)    — constitution, manifest, offers, templates
 *   OFFERS (MEDIUM)   — per-offer helix state, mecanismo, deliverables
 *
 * Usage: bun run ~/.claude/scripts/health-check.ts [--no-cache] [--verbose]
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { join, basename, dirname } from "path";

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME = require('os').homedir();
const CLAUDE_DIR = join(HOME, ".claude");
const ECOSYSTEM_DIR = join(HOME, "copywriting-ecosystem");
const SETTINGS_PATH = join(CLAUDE_DIR, "settings.json");
const CACHE_PATH = join(CLAUDE_DIR, ".health-cache.json");
const CONSTITUTION_PATH = join(CLAUDE_DIR, "constitution.md");
const MANIFEST_PATH = join(CLAUDE_DIR, "synapse-manifest.yaml");
const TEMPLATES_DIR = join(CLAUDE_DIR, "templates");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const NO_CACHE = process.argv.includes("--no-cache");
const VERBOSE = process.argv.includes("--verbose");

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = "CRITICAL" | "HIGH" | "MEDIUM";
type Status = "OK" | "WARN" | "FAIL";
type Domain = "LOCAL" | "PROJECT" | "OFFERS";

interface CheckResult {
  status: Status;
  message?: string;
}

interface HealthCheck {
  name: string;
  domain: Domain;
  severity: Severity;
  check: () => CheckResult;
}

interface OfferInfo {
  name: string;
  path: string;
  phase: string;
  hasHelixState: boolean;
  hasMecanismo: boolean;
  issues: string[];
}

interface CacheData {
  timestamp: number;
  output: string;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

function fileExists(p: string): boolean {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

function readFile(p: string): string | null {
  try {
    return readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}

function countFiles(dir: string): number {
  try {
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).filter((f) => {
      try {
        return statSync(join(dir, f)).isFile();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

function execSafe(cmd: string): string | null {
  try {
    return execSync(cmd, { timeout: 3000, encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

/**
 * Minimal YAML parser: extracts top-level and simple nested key-value pairs.
 * Returns true if the content has at least one parseable key: value line.
 */
function isYamlParseable(content: string): boolean {
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

/**
 * Extract a simple value from YAML content by key (top-level or indented).
 * Returns trimmed string value or null.
 */
function yamlValue(content: string, key: string): string | null {
  const regex = new RegExp(`^\\s*${key}:\\s*(.+)$`, "m");
  const match = content.match(regex);
  if (!match) return null;
  let val = match[1].trim();
  // Remove quotes first, then strip inline comments
  if ((val.startsWith('"') && val.includes('"', 1))) {
    // Quoted string: extract content between first pair of quotes
    const closeIdx = val.indexOf('"', 1);
    val = val.substring(1, closeIdx);
  } else if ((val.startsWith("'") && val.includes("'", 1))) {
    const closeIdx = val.indexOf("'", 1);
    val = val.substring(1, closeIdx);
  } else {
    // Unquoted: strip inline YAML comment (# ...)
    const commentIdx = val.indexOf("  #");
    if (commentIdx > 0) val = val.substring(0, commentIdx);
    // Also try single-space comment at end
    const hashIdx = val.indexOf(" #");
    if (hashIdx > 0) val = val.substring(0, hashIdx);
  }
  val = val.trim();
  return val || null;
}

/**
 * Check if a YAML boolean field is true (handles various representations).
 */
function yamlBool(content: string, key: string): boolean {
  const val = yamlValue(content, key);
  if (!val) return false;
  return val === "true" || val === "yes" || val === "True";
}

// ─── Cache ───────────────────────────────────────────────────────────────────

function loadCache(): CacheData | null {
  if (NO_CACHE) return null;
  try {
    const raw = readFile(CACHE_PATH);
    if (!raw) return null;
    const data = JSON.parse(raw) as CacheData;
    if (Date.now() - data.timestamp < CACHE_TTL_MS) {
      return data;
    }
    return null; // expired
  } catch {
    return null;
  }
}

function saveCache(output: string): void {
  try {
    const data: CacheData = { timestamp: Date.now(), output };
    writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
  } catch {
    // silently fail — cache is optional
  }
}

// ─── Check: LOCAL Domain ─────────────────────────────────────────────────────

function checkBunAvailable(): CheckResult {
  const bunPath = execSafe("which bun");
  if (bunPath) return { status: "OK" };
  return { status: "FAIL", message: "bun not found in PATH" };
}

function checkDiskSpace(): CheckResult {
  const dfOutput = execSafe("df -k /");
  if (!dfOutput) return { status: "WARN", message: "could not read disk space" };

  const lines = dfOutput.split("\n");
  if (lines.length < 2) return { status: "WARN", message: "unexpected df output" };

  // Parse available space (column 4 on macOS df -k)
  const parts = lines[1].split(/\s+/);
  const availKB = parseInt(parts[3], 10);
  if (isNaN(availKB)) return { status: "WARN", message: "could not parse disk space" };

  const availGB = availKB / (1024 * 1024);
  if (availGB < 1) {
    return { status: "FAIL", message: `only ${availGB.toFixed(1)}GB free` };
  }
  return { status: "OK" };
}

function checkHooksValid(): CheckResult {
  const settingsRaw = readFile(SETTINGS_PATH);
  if (!settingsRaw) return { status: "WARN", message: "settings.json not readable" };

  let settings: any;
  try {
    settings = JSON.parse(settingsRaw);
  } catch {
    return { status: "FAIL", message: "settings.json not valid JSON" };
  }

  const hooks = settings.hooks;
  if (!hooks) return { status: "WARN", message: "no hooks in settings.json" };

  const missing: string[] = [];
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

        // Extract file path from command string
        // Patterns: "bun run ~/.claude/hooks/X.ts", "bash ~/.claude/hooks/X.sh", "python3 ~/..."
        const cmdStr = hook.command as string;
        const match = cmdStr.match(/(?:bun run|bash|python3?|sh)\s+(~\/[^\s]+|\/[^\s]+)/);
        if (!match) continue;

        let filePath = match[1];
        if (filePath.startsWith("~/")) {
          filePath = join(HOME, filePath.slice(2));
        }

        // Handle commands with arguments like "bash ~/.claude/hooks/X.sh $(pwd)"
        // The path is already extracted above

        if (!fileExists(filePath)) {
          missing.push(basename(filePath));
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

// ─── Check: PROJECT Domain ───────────────────────────────────────────────────

function checkConstitutionExists(): CheckResult {
  if (fileExists(CONSTITUTION_PATH)) return { status: "OK" };

  // Auto-remediation: create basic template
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
      "",
    ].join("\n");
    writeFileSync(CONSTITUTION_PATH, template);
    return { status: "WARN", message: "created basic template (review needed)" };
  } catch {
    return { status: "FAIL", message: "missing and could not auto-create" };
  }
}

function checkSynapseManifestValid(): CheckResult {
  const content = readFile(MANIFEST_PATH);
  if (!content) return { status: "FAIL", message: "synapse-manifest.yaml not found" };
  if (isYamlParseable(content)) return { status: "OK" };
  return { status: "FAIL", message: "synapse-manifest.yaml not parseable" };
}

function checkActiveOfferDetected(): CheckResult {
  if (!existsSync(ECOSYSTEM_DIR)) {
    return { status: "FAIL", message: "ecosystem directory not found" };
  }

  const offers = findOffers();
  if (offers.length > 0) return { status: "OK" };
  return { status: "WARN", message: "no offers with helix-state.yaml found" };
}

function checkTemplatesPresent(): CheckResult {
  const count = countFiles(TEMPLATES_DIR);
  if (count >= 5) return { status: "OK" };
  if (count > 0) return { status: "WARN", message: `only ${count} templates (need 5+)` };
  return { status: "FAIL", message: "templates directory empty or missing" };
}

// ─── Check: OFFERS Domain ────────────────────────────────────────────────────

/**
 * Recursively find all offer directories that contain helix-state.yaml,
 * excluding site/ and export/ directories.
 */
function findOffers(): OfferInfo[] {
  const offers: OfferInfo[] = [];

  function scanDir(dir: string, depth: number) {
    if (depth > 3) return; // max depth to prevent deep traversal
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "site" || entry === "export") continue;
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (!stat.isDirectory()) continue;
        } catch {
          continue;
        }

        const helixPath = join(fullPath, "helix-state.yaml");
        if (fileExists(helixPath)) {
          const relativePath = fullPath.replace(ECOSYSTEM_DIR + "/", "");
          const offer = analyzeOffer(fullPath, relativePath, helixPath);
          offers.push(offer);
        } else {
          scanDir(fullPath, depth + 1);
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }

  scanDir(ECOSYSTEM_DIR, 0);
  return offers;
}

function analyzeOffer(fullPath: string, relativePath: string, helixPath: string): OfferInfo {
  const name = basename(fullPath);
  const issues: string[] = [];

  // Parse helix-state.yaml
  const helixContent = readFile(helixPath);
  let phase = "unknown";
  let hasHelixState = false;

  if (helixContent) {
    hasHelixState = isYamlParseable(helixContent);
    if (!hasHelixState) {
      issues.push("helix-state.yaml invalid");
    }

    // Try to detect phase from various formats
    const workflowPhase = yamlValue(helixContent, "workflow_phase");
    const currentPhase = yamlValue(helixContent, "current_phase");
    phase = workflowPhase || currentPhase || "unknown";
  } else {
    issues.push("helix-state.yaml unreadable");
  }

  // Check mecanismo-unico.yaml for offers in briefing or production
  const mecanismoPath = join(fullPath, "mecanismo-unico.yaml");
  const hasMecanismo = fileExists(mecanismoPath);

  if ((phase === "briefing" || phase === "production") && !hasMecanismo) {
    issues.push("mecanismo-unico.yaml missing");
  }

  // Check mecanismo state if file exists and phase is production
  if (hasMecanismo && phase === "production") {
    const mecContent = readFile(mecanismoPath);
    if (mecContent) {
      const mecState = yamlValue(mecContent, "state");
      if (mecState && mecState !== "VALIDATED" && mecState !== "APPROVED") {
        issues.push(`mecanismo ${mecState}`);
      }
    }
  }

  // Check deliverables based on current phase
  const deliverableIssues = checkPhaseDeliverables(fullPath, phase);
  issues.push(...deliverableIssues);

  return { name, path: relativePath, phase, hasHelixState, hasMecanismo, issues };
}

function checkPhaseDeliverables(offerPath: string, phase: string): string[] {
  const issues: string[] = [];

  if (phase === "production" || phase === "PRODUCTION") {
    // Check if briefing deliverables exist
    const briefingsDir = join(offerPath, "briefings");
    if (!existsSync(briefingsDir)) {
      issues.push("briefings/ missing");
    } else {
      // Check for helix-complete.md or phases directory
      const helixComplete = join(briefingsDir, "helix-complete.md");
      const phasesDir = join(briefingsDir, "phases");
      if (!fileExists(helixComplete) && !existsSync(phasesDir)) {
        issues.push("briefing deliverables missing");
      }
    }

    // Check production directory
    const productionDir = join(offerPath, "production");
    if (!existsSync(productionDir)) {
      // Not an issue per se — might be about to start production
    }
  }

  if (phase === "research" || phase === "RESEARCH") {
    const researchDir = join(offerPath, "research");
    if (!existsSync(researchDir)) {
      issues.push("research/ missing");
    } else {
      const synthesis = join(researchDir, "synthesis.md");
      if (!fileExists(synthesis)) {
        issues.push("synthesis.md pending");
      }
    }
  }

  return issues;
}

// ─── Build Checks ────────────────────────────────────────────────────────────

function buildChecks(): HealthCheck[] {
  return [
    // LOCAL (CRITICAL)
    { name: "bun_available", domain: "LOCAL", severity: "CRITICAL", check: checkBunAvailable },
    { name: "disk_space", domain: "LOCAL", severity: "CRITICAL", check: checkDiskSpace },
    { name: "hooks_valid", domain: "LOCAL", severity: "CRITICAL", check: checkHooksValid },

    // PROJECT (HIGH)
    { name: "constitution_exists", domain: "PROJECT", severity: "HIGH", check: checkConstitutionExists },
    { name: "synapse_manifest_valid", domain: "PROJECT", severity: "HIGH", check: checkSynapseManifestValid },
    { name: "active_offer_detected", domain: "PROJECT", severity: "HIGH", check: checkActiveOfferDetected },
    { name: "templates_present", domain: "PROJECT", severity: "HIGH", check: checkTemplatesPresent },
  ];
}

// ─── Run ─────────────────────────────────────────────────────────────────────

function run(): void {
  const startTime = Date.now();

  // Check cache first
  const cached = loadCache();
  if (cached) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
    console.log(cached.output);
    console.log(`\u23F1 Health check: ${elapsed}s (cached ${cacheAge}s ago)`);
    return;
  }

  // Run all checks
  const checks = buildChecks();
  const results: Map<Domain, { total: number; ok: number; warns: string[]; fails: string[] }> = new Map();

  for (const domain of ["LOCAL", "PROJECT", "OFFERS"] as Domain[]) {
    results.set(domain, { total: 0, ok: 0, warns: [], fails: [] });
  }

  // Domain checks (LOCAL + PROJECT)
  for (const check of checks) {
    const domainResult = results.get(check.domain)!;
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

  // OFFERS domain (per-offer)
  const offers = findOffers();
  const offersResult = results.get("OFFERS")!;
  offersResult.total = offers.length;

  const offerIssues: string[] = [];
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

  // Build output
  const outputLines: string[] = [];

  for (const domain of ["LOCAL", "PROJECT"] as Domain[]) {
    const r = results.get(domain)!;
    const emoji = r.fails.length > 0 ? "\uD83D\uDD34" : r.warns.length > 0 ? "\uD83D\uDFE1" : "\uD83D\uDFE2";
    let line = `${emoji} ${domain}: ${r.ok}/${r.total} OK`;
    if (r.fails.length > 0) line += ` | FAIL: ${r.fails.join("; ")}`;
    if (r.warns.length > 0) line += ` | WARN: ${r.warns.join("; ")}`;
    outputLines.push(line);
  }

  // OFFERS line
  const offersEmoji = offerIssues.length > offers.length / 2 ? "\uD83D\uDD34" : offerIssues.length > 0 ? "\uD83D\uDFE1" : "\uD83D\uDFE2";
  let offersLine = `${offersEmoji} OFFERS: ${offersOk}/${offers.length} OK`;
  if (offerIssues.length > 0) {
    // Truncate if too many issues to keep output concise
    const maxShow = 3;
    const shown = offerIssues.slice(0, maxShow);
    offersLine += ` | ${shown.join("; ")}`;
    if (offerIssues.length > maxShow) {
      offersLine += ` +${offerIssues.length - maxShow} more`;
    }
  }
  outputLines.push(offersLine);

  // Verbose: show all offers
  if (VERBOSE && offers.length > 0) {
    outputLines.push("");
    outputLines.push("Offers detail:");
    for (const offer of offers) {
      const statusEmoji = offer.issues.length === 0 ? "\u2705" : "\u26A0\uFE0F";
      const phaseLabel = offer.phase.toUpperCase();
      let line = `  ${statusEmoji} ${offer.path} [${phaseLabel}]`;
      if (offer.issues.length > 0) line += ` — ${offer.issues.join(", ")}`;
      outputLines.push(line);
    }
  }

  const output = outputLines.join("\n");
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Save cache
  saveCache(output);

  // Print
  console.log(output);
  console.log(`\u23F1 Health check: ${elapsed}s (fresh)`);
}

// ─── Auto-remediation for cache file ─────────────────────────────────────────

function ensureCacheFile(): void {
  if (!fileExists(CACHE_PATH)) {
    try {
      writeFileSync(CACHE_PATH, JSON.stringify({ timestamp: 0, output: "" }));
    } catch {
      // ok
    }
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

ensureCacheFile();
run();
