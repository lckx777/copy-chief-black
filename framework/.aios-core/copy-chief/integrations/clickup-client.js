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
var clickup_client_exports = {};
__export(clickup_client_exports, {
  ECOSYSTEM_ROOT: () => ECOSYSTEM_ROOT,
  GATE_TOOLS: () => GATE_TOOLS,
  PATH_TO_DELIVERABLE: () => PATH_TO_DELIVERABLE,
  appendPendingUpdate: () => appendPendingUpdate,
  extractDeliverableType: () => extractDeliverableType,
  extractFilePath: () => extractFilePath,
  extractGateResult: () => extractGateResult,
  extractOfferFromPath: () => extractOfferFromPath,
  extractOfferPath: () => extractOfferPath,
  isProductionFile: () => isProductionFile,
  loadSyncConfig: () => loadSyncConfig,
  syncDeliverableWrite: () => syncDeliverableWrite,
  syncGateResult: () => syncGateResult
});
module.exports = __toCommonJS(clickup_client_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
const GATE_TOOLS = [
  "mcp__copywriting__validate_gate",
  "mcp__copywriting__black_validation",
  "validate_gate",
  "black_validation"
];
const PATH_TO_DELIVERABLE = {
  "vsl": "vsl",
  "landing-page": "landing_page",
  "landing_page": "landing_page",
  "creatives": "creatives",
  "criativos": "creatives",
  "emails": "emails",
  "email": "emails"
};
function loadSyncConfig(offerPath) {
  const configPath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "clickup-sync.yaml");
  if (!(0, import_fs.existsSync)(configPath)) return null;
  try {
    return JSON.parse((0, import_fs.readFileSync)(configPath, "utf-8"));
  } catch {
    return null;
  }
}
function appendPendingUpdate(offerPath, update) {
  const pendingPath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "clickup-pending.json");
  let pending = [];
  if ((0, import_fs.existsSync)(pendingPath)) {
    try {
      pending = JSON.parse((0, import_fs.readFileSync)(pendingPath, "utf-8"));
    } catch {
      pending = [];
    }
  }
  pending.push({ ...update, queued_at: (/* @__PURE__ */ new Date()).toISOString() });
  (0, import_fs.writeFileSync)(pendingPath, JSON.stringify(pending, null, 2));
}
function extractOfferPath(toolInput) {
  const inputStr = JSON.stringify(toolInput).toLowerCase();
  const nichos = ["concursos", "saude", "relacionamento", "riqueza"];
  for (const niche of nichos) {
    const nicheDir = (0, import_path.join)(ECOSYSTEM_ROOT, niche);
    if (!(0, import_fs.existsSync)(nicheDir)) continue;
    try {
      const entries = require("fs").readdirSync(nicheDir);
      for (const entry of entries) {
        if (inputStr.includes(entry.toLowerCase())) {
          return `${niche}/${entry}`;
        }
      }
    } catch {
    }
  }
  return null;
}
function extractGateResult(output) {
  if (!output) return null;
  const str = typeof output === "string" ? output : JSON.stringify(output);
  let gate = "unknown";
  if (/research/i.test(str)) gate = "research";
  else if (/briefing/i.test(str)) gate = "briefing";
  else if (/production|black/i.test(str)) gate = "production";
  const passed = /pass|passed|aprovad|complete/i.test(str) && !/fail|block|rejeit/i.test(str);
  const scoreMatch = str.match(/(?:score|nota|media)[:\s]*(\d+\.?\d*)/i);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
  return { gate, passed, score };
}
function syncGateResult(offerPath, syncConfig, result) {
  const taskId = syncConfig.gate_tasks?.[result.gate];
  const parentId = syncConfig.parent_task_id;
  const statusLabel = result.passed ? "PASSED" : "FAILED";
  const taskStatus = result.passed ? "complete" : "blocked";
  const msg = `Gate ${result.gate} ${statusLabel} (score: ${result.score})`;
  console.error(`[CLICKUP-SYNC] ${msg}`);
  if (taskId) {
    appendPendingUpdate(offerPath, { task_id: taskId, action: "set_status", data: { status: taskStatus } });
    appendPendingUpdate(offerPath, { task_id: taskId, action: "add_comment", data: { comment: msg } });
  }
  if (parentId && result.passed) {
    appendPendingUpdate(offerPath, { task_id: parentId, action: "add_comment", data: { comment: `[Progress] ${msg}` } });
  }
}
function extractFilePath(toolInput) {
  if (typeof toolInput.file_path === "string") return toolInput.file_path;
  if (typeof toolInput.path === "string") return toolInput.path;
  return null;
}
function isProductionFile(filePath) {
  return filePath.includes("/production/");
}
function extractOfferFromPath(filePath) {
  const match = filePath.match(/copywriting-ecosystem\/(\w+)\/([^/]+)\/production/);
  if (match) return `${match[1]}/${match[2]}`;
  return null;
}
function extractDeliverableType(filePath) {
  const match = filePath.match(/production\/([^/]+)/);
  if (!match) return null;
  return PATH_TO_DELIVERABLE[match[1]] || null;
}
function syncDeliverableWrite(offerPath, syncConfig, deliverableType, filePath) {
  const taskId = syncConfig.deliverable_tasks?.[deliverableType];
  const parentId = syncConfig.parent_task_id;
  const fileName = (0, import_path.basename)(filePath);
  if (taskId) {
    console.error(`[CLICKUP-DELIVERABLE] Queued: ${fileName} (${deliverableType})`);
    appendPendingUpdate(offerPath, { task_id: taskId, action: "set_status", data: { status: "in progress" } });
    appendPendingUpdate(offerPath, { task_id: taskId, action: "add_comment", data: { comment: `Deliverable produced: ${fileName}` } });
  }
  if (parentId) {
    appendPendingUpdate(offerPath, { task_id: parentId, action: "add_comment", data: { comment: `Production: ${fileName} (${deliverableType})` } });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ECOSYSTEM_ROOT,
  GATE_TOOLS,
  PATH_TO_DELIVERABLE,
  appendPendingUpdate,
  extractDeliverableType,
  extractFilePath,
  extractGateResult,
  extractOfferFromPath,
  extractOfferPath,
  isProductionFile,
  loadSyncConfig,
  syncDeliverableWrite,
  syncGateResult
});
