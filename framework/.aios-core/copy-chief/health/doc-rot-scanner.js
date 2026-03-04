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
var doc_rot_scanner_exports = {};
__export(doc_rot_scanner_exports, {
  DEFAULT_ECOSYSTEM: () => DEFAULT_ECOSYSTEM,
  calculateHealthScore: () => calculateHealthScore,
  checkContradictions: () => checkContradictions,
  checkFreshness: () => checkFreshness,
  checkLinks: () => checkLinks,
  discoverOffers: () => discoverOffers,
  formatReport: () => formatReport,
  processHookEvent: () => processHookEvent,
  saveReport: () => saveReport,
  scanAllOffers: () => scanAllOffers,
  scanOffer: () => scanOffer
});
module.exports = __toCommonJS(doc_rot_scanner_exports);
var import_fs = require("fs");
var import_path = require("path");
const HOME = process.env.HOME || "";
const DEFAULT_ECOSYSTEM = (0, import_path.join)(HOME, "copywriting-ecosystem");
const MS_PER_HOUR = 36e5;
const MS_PER_DAY = 864e5;
const FRESHNESS_RULES = [
  {
    trigger: "helix-state.yaml",
    dependent: "research/synthesis.md",
    max_age_days: 7,
    condition: "phase != 'IDLE' && phase != 'RESEARCH'",
    severity: "WARNING"
  },
  {
    trigger: "mecanismo-unico.yaml",
    dependent: "CONTEXT.md",
    max_staleness_hours: 24,
    severity: "WARNING"
  },
  {
    trigger: "production/**",
    dependent: "briefings/helix-complete.md",
    max_age_days: 30,
    severity: "WARNING"
  },
  {
    trigger: "mecanismo-unico.yaml",
    dependent: "briefings/helix-complete.md",
    max_staleness_hours: 48,
    severity: "INFO"
  },
  {
    trigger: "research/synthesis.md",
    dependent: "research/voc/summary.md",
    max_age_days: 14,
    severity: "INFO"
  }
];
const CONTRADICTION_RULES = [
  {
    name: "mecanismo_state_vs_production",
    description: "Production files exist but mecanismo not validated",
    check: (offerPath) => {
      const prodDir = (0, import_path.join)(offerPath, "production");
      const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
      if (!(0, import_fs.existsSync)(prodDir)) return null;
      const hasProductionFiles = safeReaddir(prodDir).some((entry) => {
        const full = (0, import_path.join)(prodDir, entry);
        try {
          const st = (0, import_fs.statSync)(full);
          if (st.isDirectory()) {
            return safeReaddir(full).some((f) => f.endsWith(".md") || f.endsWith(".txt"));
          }
          return entry.endsWith(".md") || entry.endsWith(".txt");
        } catch {
          return false;
        }
      });
      if (!hasProductionFiles) return null;
      if (!(0, import_fs.existsSync)(mecPath)) {
        return {
          type: "CONTRADICTION",
          severity: "CRITICAL",
          file: mecPath,
          message: "Production files exist but mecanismo-unico.yaml is MISSING.",
          suggestion: "Create mecanismo-unico.yaml and validate before producing copy."
        };
      }
      const state = extractYamlField(mecPath, "state");
      if (state && state !== "VALIDATED" && state !== "APPROVED") {
        return {
          type: "CONTRADICTION",
          severity: "CRITICAL",
          file: mecPath,
          message: `Production files exist but mecanismo state is "${state}" (needs VALIDATED or APPROVED).`,
          suggestion: `Run consensus + blind_critic + emotional_stress_test to validate mecanismo.`
        };
      }
      return null;
    }
  },
  {
    name: "helix_phase_vs_deliverables",
    description: "HELIX says phase X but deliverables for phase Y exist",
    check: (offerPath) => {
      const helixPath = (0, import_path.join)(offerPath, "helix-state.yaml");
      if (!(0, import_fs.existsSync)(helixPath)) return null;
      const currentPhase = extractYamlField(helixPath, "current_phase");
      const briefingsDir = (0, import_path.join)(offerPath, "briefings");
      if (currentPhase === "research" || currentPhase === "RESEARCH" || currentPhase === "idle" || currentPhase === "IDLE") {
        if ((0, import_fs.existsSync)(briefingsDir)) {
          const briefingFiles = safeReaddir(briefingsDir).filter(
            (f) => f.endsWith(".md") && f !== "README.md"
          );
          const phasesDir = (0, import_path.join)(briefingsDir, "phases");
          const phaseFiles = (0, import_fs.existsSync)(phasesDir) ? safeReaddir(phasesDir).filter((f) => f.endsWith(".md")) : [];
          if (briefingFiles.length > 0 || phaseFiles.length > 0) {
            return {
              type: "CONTRADICTION",
              severity: "WARNING",
              file: helixPath,
              message: `helix-state says current_phase="${currentPhase}" but briefings/ already has ${briefingFiles.length + phaseFiles.length} file(s).`,
              suggestion: "Update helix-state.yaml current_phase to match actual progress, or verify this is a manual override."
            };
          }
        }
      }
      return null;
    }
  },
  {
    name: "context_vs_mecanismo",
    description: "CONTEXT.md MUP does not match mecanismo-unico.yaml MUP",
    check: (offerPath) => {
      const contextPath = (0, import_path.join)(offerPath, "CONTEXT.md");
      const mecPath = (0, import_path.join)(offerPath, "mecanismo-unico.yaml");
      if (!(0, import_fs.existsSync)(contextPath) || !(0, import_fs.existsSync)(mecPath)) return null;
      const contextMup = extractMupFromContext(contextPath);
      const yamlMup = extractMupFromMecanismo(mecPath);
      if (!contextMup || !yamlMup) return null;
      const normContext = normalizeForComparison(contextMup);
      const normYaml = normalizeForComparison(yamlMup);
      if (normContext.length > 3 && normYaml.length > 3 && normContext !== normYaml) {
        if (!normContext.includes(normYaml) && !normYaml.includes(normContext)) {
          return {
            type: "CONTRADICTION",
            severity: "CRITICAL",
            file: contextPath,
            message: `MUP name mismatch \u2014 CONTEXT.md: "${contextMup}" vs mecanismo-unico.yaml: "${yamlMup}".`,
            suggestion: "Align MUP name in CONTEXT.md with the validated name in mecanismo-unico.yaml."
          };
        }
      }
      return null;
    }
  },
  {
    name: "gates_vs_state",
    description: "helix-state gates passed but state is behind",
    check: (offerPath) => {
      const helixPath = (0, import_path.join)(offerPath, "helix-state.yaml");
      if (!(0, import_fs.existsSync)(helixPath)) return null;
      let content;
      try {
        content = (0, import_fs.readFileSync)(helixPath, "utf-8");
      } catch {
        return null;
      }
      const currentPhase = extractYamlField(helixPath, "current_phase");
      const researchGate = content.match(/gates:\s*\n\s*research:\s*(true|false)/)?.[1];
      const briefingGate = content.match(/gates:[\s\S]*?briefing:\s*(true|false)/)?.[1];
      if (briefingGate === "true" && (currentPhase === "research" || currentPhase === "RESEARCH")) {
        return {
          type: "CONTRADICTION",
          severity: "WARNING",
          file: helixPath,
          message: 'Briefing gate is marked as passed but current_phase is still "research".',
          suggestion: 'Update current_phase to "briefing" or "production" to match gate status.'
        };
      }
      if (researchGate === "false" && currentPhase && currentPhase !== "idle" && currentPhase !== "IDLE" && currentPhase !== "research" && currentPhase !== "RESEARCH") {
        return {
          type: "CONTRADICTION",
          severity: "WARNING",
          file: helixPath,
          message: `current_phase="${currentPhase}" but research gate has not passed.`,
          suggestion: "Run validate_gate for research or update gate status."
        };
      }
      return null;
    }
  },
  {
    name: "synthesis_missing_for_briefing",
    description: "Briefing exists but synthesis.md is missing",
    check: (offerPath) => {
      const synthesisPath = (0, import_path.join)(offerPath, "research", "synthesis.md");
      const briefingsDir = (0, import_path.join)(offerPath, "briefings");
      if (!(0, import_fs.existsSync)(briefingsDir)) return null;
      const phasesDir = (0, import_path.join)(briefingsDir, "phases");
      const hasPhases = (0, import_fs.existsSync)(phasesDir) && safeReaddir(phasesDir).some((f) => f.endsWith(".md"));
      const hasHelixComplete = (0, import_fs.existsSync)((0, import_path.join)(briefingsDir, "helix-complete.md"));
      if ((hasPhases || hasHelixComplete) && !(0, import_fs.existsSync)(synthesisPath)) {
        return {
          type: "CONTRADICTION",
          severity: "WARNING",
          file: synthesisPath,
          message: "Briefing files exist but research/synthesis.md is missing.",
          suggestion: "Ensure research was completed and synthesis.md was generated before briefing."
        };
      }
      return null;
    }
  }
];
function safeReaddir(dir) {
  try {
    return (0, import_fs.readdirSync)(dir);
  } catch {
    return [];
  }
}
function safeStat(filePath) {
  try {
    return (0, import_fs.statSync)(filePath);
  } catch {
    return null;
  }
}
function extractYamlField(filePath, fieldName) {
  try {
    const content = (0, import_fs.readFileSync)(filePath, "utf-8");
    const regex = new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*["']?([^"'\\n]+)["']?`, "i");
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}
function extractMupFromContext(contextPath) {
  try {
    const content = (0, import_fs.readFileSync)(contextPath, "utf-8");
    const patterns = [
      /\*\*(?:Sexy Cause|MUP)\*?\*?[^"]*"([^"]+)"/i,
      /MUP[^|]*\|\s*([^\n|]+)/i,
      /Sexy Cause[^|]*\|\s*([^\n|]+)/i
    ];
    for (const p of patterns) {
      const m = content.match(p);
      if (m) return m[1].trim();
    }
    return null;
  } catch {
    return null;
  }
}
function extractMupFromMecanismo(mecPath) {
  try {
    const content = (0, import_fs.readFileSync)(mecPath, "utf-8");
    const match = content.match(/sexy_cause:\s*\n\s*name:\s*["']?([^"'\n]+)["']?/i);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}
function normalizeForComparison(text) {
  return text.toLowerCase().replace(/[""''`]/g, "").replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e").replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u").replace(/[ç]/g, "c").replace(/[ñ]/g, "n").replace(/\s+/g, " ").trim();
}
function getFileMtimeMs(filePath) {
  const st = safeStat(filePath);
  return st ? st.mtimeMs : null;
}
function resolveGlobMtime(offerPath, globPattern) {
  if (globPattern.includes("**")) {
    const baseDir = (0, import_path.join)(offerPath, globPattern.replace("/**", ""));
    return getNewestMtimeRecursive(baseDir);
  }
  return getFileMtimeMs((0, import_path.join)(offerPath, globPattern));
}
function getNewestMtimeRecursive(dir, maxDepth = 3) {
  if (!(0, import_fs.existsSync)(dir) || maxDepth <= 0) return null;
  let newest = null;
  for (const entry of safeReaddir(dir)) {
    const full = (0, import_path.join)(dir, entry);
    const st = safeStat(full);
    if (!st) continue;
    try {
      const info = (0, import_fs.statSync)(full);
      if (info.isDirectory()) {
        const sub = getNewestMtimeRecursive(full, maxDepth - 1);
        if (sub !== null && (newest === null || sub > newest)) newest = sub;
      } else {
        if (newest === null || st.mtimeMs > newest) newest = st.mtimeMs;
      }
    } catch {
    }
  }
  return newest;
}
function evaluateCondition(condition, offerPath) {
  if (condition.includes("phase")) {
    const helixPath = (0, import_path.join)(offerPath, "helix-state.yaml");
    const phase = extractYamlField(helixPath, "current_phase") || "IDLE";
    const normalized = phase.toUpperCase();
    if (condition.includes("!= 'IDLE'") && condition.includes("!= 'RESEARCH'")) {
      return normalized !== "IDLE" && normalized !== "RESEARCH";
    }
    if (condition.includes("!= 'IDLE'")) return normalized !== "IDLE";
    if (condition.includes("!= 'RESEARCH'")) return normalized !== "RESEARCH";
  }
  return true;
}
function checkFreshness(offerPath) {
  const issues = [];
  const now = Date.now();
  for (const rule of FRESHNESS_RULES) {
    if (rule.condition && !evaluateCondition(rule.condition, offerPath)) {
      continue;
    }
    const triggerMtime = resolveGlobMtime(offerPath, rule.trigger);
    const dependentPath = (0, import_path.join)(offerPath, rule.dependent);
    if (triggerMtime === null) continue;
    if (!(0, import_fs.existsSync)(dependentPath)) {
      if ((0, import_fs.existsSync)((0, import_path.join)(offerPath, rule.trigger))) {
        issues.push({
          type: "FRESHNESS",
          severity: rule.severity || "WARNING",
          file: dependentPath,
          message: `"${rule.dependent}" does not exist but "${rule.trigger}" was last updated ${formatAge(now - triggerMtime)} ago.`,
          suggestion: `Create or update "${rule.dependent}" to stay in sync with "${rule.trigger}".`
        });
      }
      continue;
    }
    const dependentMtime = getFileMtimeMs(dependentPath);
    if (dependentMtime === null) continue;
    if (rule.max_staleness_hours !== void 0) {
      const staleMs = triggerMtime - dependentMtime;
      const thresholdMs = rule.max_staleness_hours * MS_PER_HOUR;
      if (staleMs > thresholdMs) {
        issues.push({
          type: "FRESHNESS",
          severity: rule.severity || "WARNING",
          file: dependentPath,
          message: `"${rule.dependent}" is ${formatAge(staleMs)} older than "${rule.trigger}" (max staleness: ${rule.max_staleness_hours}h).`,
          suggestion: `Update "${rule.dependent}" to reflect changes in "${rule.trigger}".`
        });
      }
    }
    if (rule.max_age_days !== void 0) {
      const ageMs = now - dependentMtime;
      const thresholdMs = rule.max_age_days * MS_PER_DAY;
      if (ageMs > thresholdMs) {
        issues.push({
          type: "FRESHNESS",
          severity: rule.severity || "WARNING",
          file: dependentPath,
          message: `"${rule.dependent}" is ${formatAge(ageMs)} old (max age: ${rule.max_age_days} days).`,
          suggestion: `Review and update "${rule.dependent}" \u2014 it may be outdated.`
        });
      }
    }
  }
  return issues;
}
function formatAge(ms) {
  const hours = Math.floor(ms / MS_PER_HOUR);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
function checkContradictions(offerPath) {
  const issues = [];
  for (const rule of CONTRADICTION_RULES) {
    try {
      const issue = rule.check(offerPath);
      if (issue) issues.push(issue);
    } catch (err) {
      issues.push({
        type: "CONTRADICTION",
        severity: "INFO",
        file: offerPath,
        message: `Contradiction rule "${rule.name}" failed to execute: ${err}`,
        suggestion: "Check file permissions and YAML syntax."
      });
    }
  }
  return issues;
}
function checkLinks(offerPath) {
  const issues = [];
  const mdFiles = collectMarkdownFiles(offerPath, 3);
  for (const mdFile of mdFiles) {
    let content;
    try {
      content = (0, import_fs.readFileSync)(mdFile, "utf-8");
    } catch {
      continue;
    }
    const backtickRefs = content.matchAll(/`([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,5})`/g);
    for (const match of backtickRefs) {
      const ref = match[1];
      if (ref.includes("://") || ref.startsWith(".") || ref.includes("*")) continue;
      if (/^\d/.test(ref) || ref.length < 4) continue;
      const candidates = [
        (0, import_path.join)((0, import_path.dirname)(mdFile), ref),
        (0, import_path.join)(offerPath, ref)
      ];
      const found = candidates.some((c) => (0, import_fs.existsSync)(c));
      if (!found) {
        if (ref.includes("/") && /\.\w{1,5}$/.test(ref)) {
          issues.push({
            type: "BROKEN_LINK",
            severity: "INFO",
            file: mdFile,
            message: `Reference to "${ref}" not found.`,
            suggestion: `Verify the path in ${(0, import_path.basename)(mdFile)} or update the reference.`
          });
        }
      }
    }
    const refLines = content.matchAll(/(?:Ref|Referencia|Arquivo)[^:]*:\s*`?([a-zA-Z0-9_./-]+\.[a-zA-Z]{1,5})`?/gi);
    for (const match of refLines) {
      const ref = match[1];
      if (ref.includes("://") || ref.includes("*")) continue;
      const candidates = [
        (0, import_path.join)((0, import_path.dirname)(mdFile), ref),
        (0, import_path.join)(offerPath, ref),
        (0, import_path.join)(offerPath, "..", ref)
      ];
      const found = candidates.some((c) => (0, import_fs.existsSync)(c));
      if (!found && ref.includes("/")) {
        issues.push({
          type: "BROKEN_LINK",
          severity: "WARNING",
          file: mdFile,
          message: `Explicit reference to "${ref}" not found.`,
          suggestion: `Update or remove the broken reference in ${(0, import_path.basename)(mdFile)}.`
        });
      }
    }
  }
  return issues;
}
function collectMarkdownFiles(dir, maxDepth) {
  if (maxDepth <= 0 || !(0, import_fs.existsSync)(dir)) return [];
  const results = [];
  for (const entry of safeReaddir(dir)) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "raw") continue;
    const full = (0, import_path.join)(dir, entry);
    try {
      const st = (0, import_fs.statSync)(full);
      if (st.isDirectory()) {
        results.push(...collectMarkdownFiles(full, maxDepth - 1));
      } else if (entry.endsWith(".md")) {
        results.push(full);
      }
    } catch {
    }
  }
  return results;
}
function calculateHealthScore(issues) {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "CRITICAL":
        score -= 20;
        break;
      case "WARNING":
        score -= 10;
        break;
      case "INFO":
        score -= 2;
        break;
    }
  }
  return Math.max(0, score);
}
function scanOffer(offerPath) {
  const freshnessIssues = checkFreshness(offerPath);
  const contradictionIssues = checkContradictions(offerPath);
  const linkIssues = checkLinks(offerPath);
  const issues = [...freshnessIssues, ...contradictionIssues, ...linkIssues];
  const healthScore = calculateHealthScore(issues);
  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
  const warningCount = issues.filter((i) => i.severity === "WARNING").length;
  const infoCount = issues.filter((i) => i.severity === "INFO").length;
  let summary;
  if (issues.length === 0) {
    summary = "No documentation rot detected. All files are consistent and up to date.";
  } else {
    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} CRITICAL`);
    if (warningCount > 0) parts.push(`${warningCount} WARNING`);
    if (infoCount > 0) parts.push(`${infoCount} INFO`);
    summary = `Found ${issues.length} issue(s): ${parts.join(", ")}. Health Score: ${healthScore}/100.`;
  }
  return {
    offer_path: offerPath,
    scan_date: (/* @__PURE__ */ new Date()).toISOString(),
    issues,
    health_score: healthScore,
    summary
  };
}
function scanAllOffers(ecosystemPath) {
  const reports = [];
  const offerPaths = discoverOffers(ecosystemPath);
  for (const offerPath of offerPaths) {
    reports.push(scanOffer(offerPath));
  }
  return reports;
}
function discoverOffers(ecosystemPath) {
  const offers = [];
  for (const nicheDir of safeReaddir(ecosystemPath)) {
    if (nicheDir.startsWith(".") || nicheDir === "node_modules" || nicheDir === "site" || nicheDir === "scripts" || nicheDir === "export") continue;
    const nichePath = (0, import_path.join)(ecosystemPath, nicheDir);
    try {
      if (!(0, import_fs.statSync)(nichePath).isDirectory()) continue;
    } catch {
      continue;
    }
    for (const offerDir of safeReaddir(nichePath)) {
      if (offerDir.startsWith(".") || offerDir.startsWith("biblioteca_")) continue;
      const offerPath = (0, import_path.join)(nichePath, offerDir);
      try {
        if (!(0, import_fs.statSync)(offerPath).isDirectory()) continue;
      } catch {
        continue;
      }
      const hasContext = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "CONTEXT.md"));
      const hasMecanismo = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "mecanismo-unico.yaml"));
      const hasHelix = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "helix-state.yaml"));
      if (hasContext || hasMecanismo || hasHelix) {
        offers.push(offerPath);
      }
    }
  }
  return offers;
}
function formatReport(report) {
  const lines = [];
  const offerName = report.offer_path.split("/").slice(-2).join("/");
  lines.push("=".repeat(60));
  lines.push(`DOC ROT REPORT: ${offerName}`);
  lines.push(`Scan Date: ${report.scan_date}`);
  lines.push(`Health Score: ${report.health_score}/100`);
  lines.push("=".repeat(60));
  lines.push("");
  if (report.issues.length === 0) {
    lines.push("  All clear. No documentation rot detected.");
    lines.push("");
    return lines.join("\n");
  }
  lines.push(report.summary);
  lines.push("");
  const grouped = {
    FRESHNESS: [],
    CONTRADICTION: [],
    BROKEN_LINK: []
  };
  for (const issue of report.issues) {
    grouped[issue.type].push(issue);
  }
  for (const [type, issues] of Object.entries(grouped)) {
    if (issues.length === 0) continue;
    const label = type === "FRESHNESS" ? "Freshness Issues" : type === "CONTRADICTION" ? "Contradiction Issues" : "Broken Links";
    lines.push(`--- ${label} (${issues.length}) ---`);
    lines.push("");
    for (const issue of issues) {
      const sevTag = issue.severity === "CRITICAL" ? "[CRITICAL]" : issue.severity === "WARNING" ? "[WARNING]" : "[INFO]";
      const relFile = (0, import_path.relative)(report.offer_path, issue.file) || (0, import_path.basename)(issue.file);
      lines.push(`  ${sevTag} ${relFile}`);
      lines.push(`    ${issue.message}`);
      lines.push(`    -> ${issue.suggestion}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}
function escapeYamlString(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}
function saveReport(report) {
  const reportPath = (0, import_path.join)(report.offer_path, "doc-rot-report.yaml");
  const lines = [];
  lines.push("# Doc Rot Report \u2014 Auto-generated");
  lines.push(`# Do not edit manually. Re-run: bun run ~/.claude/hooks/doc-rot-detector.ts ${report.offer_path}`);
  lines.push("");
  lines.push(`offer_path: "${report.offer_path}"`);
  lines.push(`scan_date: "${report.scan_date}"`);
  lines.push(`health_score: ${report.health_score}`);
  lines.push(`summary: "${escapeYamlString(report.summary)}"`);
  lines.push(`issue_count: ${report.issues.length}`);
  lines.push("");
  if (report.issues.length > 0) {
    lines.push("issues:");
    for (const issue of report.issues) {
      lines.push(`  - type: ${issue.type}`);
      lines.push(`    severity: ${issue.severity}`);
      lines.push(`    file: "${escapeYamlString((0, import_path.relative)(report.offer_path, issue.file) || issue.file)}"`);
      lines.push(`    message: "${escapeYamlString(issue.message)}"`);
      lines.push(`    suggestion: "${escapeYamlString(issue.suggestion)}"`);
    }
  } else {
    lines.push("issues: []");
  }
  try {
    (0, import_fs.writeFileSync)(reportPath, lines.join("\n") + "\n");
  } catch (err) {
    console.error(`Failed to save report to ${reportPath}: ${err}`);
  }
}
async function processHookEvent(input) {
  const ecosystemPath = input.ecosystem_path || DEFAULT_ECOSYSTEM;
  let reports;
  if (input.offer_path) {
    let offerPath = input.offer_path;
    if (!(0, import_fs.existsSync)(offerPath)) {
      offerPath = (0, import_path.join)(ecosystemPath, input.offer_path);
    }
    reports = (0, import_fs.existsSync)(offerPath) ? [scanOffer(offerPath)] : [];
  } else {
    reports = scanAllOffers(ecosystemPath);
  }
  let totalIssues = 0;
  let critical = 0;
  let warning = 0;
  let info = 0;
  const warnings = [];
  for (const report of reports) {
    totalIssues += report.issues.length;
    critical += report.issues.filter((i) => i.severity === "CRITICAL").length;
    warning += report.issues.filter((i) => i.severity === "WARNING").length;
    info += report.issues.filter((i) => i.severity === "INFO").length;
    for (const issue of report.issues) {
      if (issue.severity === "CRITICAL" || issue.severity === "WARNING") {
        const offerName = report.offer_path.split("/").slice(-2).join("/");
        warnings.push(`[DOC-ROT][${issue.severity}] ${offerName}: ${issue.message}`);
      }
    }
    try {
      saveReport(report);
    } catch {
    }
  }
  const avgHealth = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.health_score, 0) / reports.length) : 100;
  return {
    scanned: reports.length,
    total_issues: totalIssues,
    critical,
    warning,
    info,
    avg_health: avgHealth,
    warnings
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_ECOSYSTEM,
  calculateHealthScore,
  checkContradictions,
  checkFreshness,
  checkLinks,
  discoverOffers,
  formatReport,
  processHookEvent,
  saveReport,
  scanAllOffers,
  scanOffer
});
