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
var ids_exports = {};
__export(ids_exports, {
  checkCircuitBreaker: () => checkCircuitBreaker,
  getDecision: () => getDecision,
  getDecisions: () => getDecisions,
  getLastAppliedDecision: () => getLastAppliedDecision,
  getStats: () => getStats,
  registerDecision: () => registerDecision,
  rollbackDecision: () => rollbackDecision
});
module.exports = __toCommonJS(ids_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const IDS_DIR = (0, import_path.join)(HOME, ".claude", "ids");
const DECISIONS_FILE = (0, import_path.join)(IDS_DIR, "decisions.json");
const MAX_DECISIONS = 50;
const CIRCUIT_BREAKER_WINDOW_MS = 60 * 60 * 1e3;
const CIRCUIT_BREAKER_THRESHOLD = 3;
function ensureDir() {
  if (!(0, import_fs.existsSync)(IDS_DIR)) {
    (0, import_fs.mkdirSync)(IDS_DIR, { recursive: true });
  }
}
function loadRegistry() {
  ensureDir();
  if ((0, import_fs.existsSync)(DECISIONS_FILE)) {
    try {
      const raw = (0, import_fs.readFileSync)(DECISIONS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch {
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    version: "1.0.0",
    created_at: now,
    updated_at: now,
    decisions: []
  };
}
function saveRegistry(registry) {
  ensureDir();
  registry.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(DECISIONS_FILE, JSON.stringify(registry, null, 2));
}
function generateId() {
  const now = /* @__PURE__ */ new Date();
  const datePart = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `ids-${datePart}-${randomPart}`;
}
function snapshotFile(filePath) {
  try {
    if ((0, import_fs.existsSync)(filePath)) {
      return (0, import_fs.readFileSync)(filePath, "utf-8");
    }
    return null;
  } catch {
    return null;
  }
}
function restoreFile(filePath, content) {
  if (content === null) {
    try {
      const fs = require("fs");
      if ((0, import_fs.existsSync)(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
    }
    return;
  }
  const dir = (0, import_path.dirname)(filePath);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  (0, import_fs.writeFileSync)(filePath, content);
}
function checkCircuitBreaker() {
  const registry = loadRegistry();
  const now = Date.now();
  const windowStart = now - CIRCUIT_BREAKER_WINDOW_MS;
  const recentRollbacks = registry.decisions.filter(
    (d) => d.status === "ROLLED_BACK" && d.rolled_back_at && new Date(d.rolled_back_at).getTime() >= windowStart
  );
  const count = recentRollbacks.length;
  const triggered = count >= CIRCUIT_BREAKER_THRESHOLD;
  return {
    triggered,
    rollbacks_in_window: count,
    window_start: new Date(windowStart).toISOString(),
    message: triggered ? `CIRCUIT BREAKER: ${count} rollbacks in the last hour (threshold: ${CIRCUIT_BREAKER_THRESHOLD}). Recent structural changes are unstable. Review before making further changes.` : void 0
  };
}
function registerDecision(description, type, filePaths) {
  const registry = loadRegistry();
  const snapshots = {};
  for (const fp of filePaths) {
    snapshots[fp] = snapshotFile(fp);
  }
  const decision = {
    id: generateId(),
    description,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    files_affected: filePaths,
    snapshots,
    status: "APPLIED"
  };
  registry.decisions.push(decision);
  if (registry.decisions.length > MAX_DECISIONS) {
    const excess = registry.decisions.length - MAX_DECISIONS;
    registry.decisions = registry.decisions.slice(excess);
  }
  saveRegistry(registry);
  const cb = checkCircuitBreaker();
  if (cb.triggered) {
    console.error(`
[IDS] WARNING: ${cb.message}
`);
  }
  return decision;
}
function rollbackDecision(decisionId) {
  const registry = loadRegistry();
  const decision = registry.decisions.find((d) => d.id === decisionId);
  if (!decision) {
    return { success: false, error: `Decision "${decisionId}" not found` };
  }
  if (decision.status === "ROLLED_BACK") {
    return {
      success: false,
      error: `Decision "${decisionId}" was already rolled back at ${decision.rolled_back_at}`,
      decision
    };
  }
  const errors = [];
  for (const [filePath, content] of Object.entries(decision.snapshots)) {
    try {
      restoreFile(filePath, content);
    } catch (err) {
      errors.push(`Failed to restore ${filePath}: ${err}`);
    }
  }
  if (errors.length > 0) {
    return {
      success: false,
      error: `Partial rollback. Errors:
${errors.join("\n")}`,
      decision
    };
  }
  decision.status = "ROLLED_BACK";
  decision.rolled_back_at = (/* @__PURE__ */ new Date()).toISOString();
  saveRegistry(registry);
  const cb = checkCircuitBreaker();
  return { success: true, decision, circuitBreaker: cb };
}
function getDecisions(limit) {
  const registry = loadRegistry();
  const decisions = [...registry.decisions].reverse();
  if (limit && limit > 0) {
    return decisions.slice(0, limit);
  }
  return decisions;
}
function getDecision(id) {
  const registry = loadRegistry();
  return registry.decisions.find((d) => d.id === id) || null;
}
function getLastAppliedDecision() {
  const registry = loadRegistry();
  for (let i = registry.decisions.length - 1; i >= 0; i--) {
    if (registry.decisions[i].status === "APPLIED") {
      return registry.decisions[i];
    }
  }
  return null;
}
function getStats() {
  const registry = loadRegistry();
  const stats = {
    total: registry.decisions.length,
    applied: 0,
    rolled_back: 0,
    by_type: {
      HOOK_ADD: 0,
      RULE_UPDATE: 0,
      SCHEMA_CHANGE: 0,
      CONFIG_UPDATE: 0,
      COPY_WRITE: 0,
      PHASE_ADVANCE: 0,
      MECANISMO_UPDATE: 0
    }
  };
  for (const d of registry.decisions) {
    if (d.status === "APPLIED") stats.applied++;
    else stats.rolled_back++;
    stats.by_type[d.type] = (stats.by_type[d.type] || 0) + 1;
  }
  return stats;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkCircuitBreaker,
  getDecision,
  getDecisions,
  getLastAppliedDecision,
  getStats,
  registerDecision,
  rollbackDecision
});
