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
var decision_queue_exports = {};
__export(decision_queue_exports, {
  getAllDecisions: () => getAllDecisions,
  getPendingDecisions: () => getPendingDecisions,
  getQueueSummary: () => getQueueSummary,
  hasPendingBlockers: () => hasPendingBlockers,
  queueDecision: () => queueDecision,
  resolveDecision: () => resolveDecision
});
module.exports = __toCommonJS(decision_queue_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_yaml = require("yaml");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const ECOSYSTEM_ROOT = (0, import_path.join)(HOME, "copywriting-ecosystem");
function getQueuePath(offerId) {
  return (0, import_path.join)(ECOSYSTEM_ROOT, offerId, "pending-decisions.yaml");
}
function generateDecisionId() {
  const now = /* @__PURE__ */ new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).substring(2, 6);
  return `dec-${ts}-${rand}`;
}
function loadQueue(offerId) {
  const path = getQueuePath(offerId);
  if ((0, import_fs.existsSync)(path)) {
    try {
      const raw = (0, import_fs.readFileSync)(path, "utf-8");
      return (0, import_yaml.parse)(raw);
    } catch {
    }
  }
  return {
    version: "1.0.0",
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    decisions: []
  };
}
function saveQueue(offerId, queue) {
  const path = getQueuePath(offerId);
  const dir = (0, import_path.join)(ECOSYSTEM_ROOT, offerId);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  queue.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  (0, import_fs.writeFileSync)(path, (0, import_yaml.stringify)(queue));
}
function queueDecision(offerId, criterionId, opts) {
  const queue = loadQueue(offerId);
  const decision = {
    id: generateDecisionId(),
    offer_id: offerId,
    criterion_id: criterionId,
    type: opts.type,
    priority: opts.priority,
    status: "PENDING",
    blocking: opts.blocking,
    title: opts.title,
    context: opts.context,
    options: opts.options,
    auto_resolve_after_hours: opts.auto_resolve_after_hours,
    auto_resolve_choice: opts.auto_resolve_choice,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  queue.decisions.push(decision);
  saveQueue(offerId, queue);
  return decision;
}
function getPendingDecisions(offerId, opts) {
  const queue = loadQueue(offerId);
  autoResolveExpired(offerId, queue);
  let pending = queue.decisions.filter((d) => d.status === "PENDING");
  if (opts?.blocking_only) {
    pending = pending.filter((d) => d.blocking);
  }
  if (opts?.priority) {
    pending = pending.filter((d) => d.priority === opts.priority);
  }
  return pending;
}
function resolveDecision(offerId, decisionId, resolution, rationale) {
  const queue = loadQueue(offerId);
  const decision = queue.decisions.find((d) => d.id === decisionId);
  if (!decision || decision.status !== "PENDING") {
    return null;
  }
  decision.status = "RESOLVED";
  decision.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
  decision.resolved_by = "human";
  decision.resolution = resolution;
  decision.resolution_rationale = rationale;
  saveQueue(offerId, queue);
  return decision;
}
function hasPendingBlockers(offerId) {
  const pending = getPendingDecisions(offerId, { blocking_only: true });
  return pending.length > 0;
}
function getQueueSummary(offerId) {
  const pending = getPendingDecisions(offerId);
  const blocking = pending.filter((d) => d.blocking);
  const nonBlocking = pending.filter((d) => !d.blocking);
  const byPriority = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };
  for (const d of pending) {
    byPriority[d.priority]++;
  }
  return {
    total_pending: pending.length,
    blocking: blocking.length,
    non_blocking: nonBlocking.length,
    by_priority: byPriority,
    oldest_pending: pending.length > 0 ? pending[0].created_at : void 0
  };
}
function getAllDecisions(offerId) {
  const queue = loadQueue(offerId);
  return queue.decisions;
}
function autoResolveExpired(offerId, queue) {
  const now = Date.now();
  let changed = false;
  for (const decision of queue.decisions) {
    if (decision.status === "PENDING" && decision.auto_resolve_after_hours && decision.auto_resolve_choice) {
      const createdAt = new Date(decision.created_at).getTime();
      const expiresAt = createdAt + decision.auto_resolve_after_hours * 60 * 60 * 1e3;
      if (now >= expiresAt) {
        decision.status = "AUTO_RESOLVED";
        decision.resolved_at = (/* @__PURE__ */ new Date()).toISOString();
        decision.resolved_by = "timeout";
        decision.resolution = decision.auto_resolve_choice;
        decision.resolution_rationale = `Auto-resolved after ${decision.auto_resolve_after_hours}h timeout`;
        changed = true;
      }
    }
  }
  if (changed) {
    saveQueue(offerId, queue);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAllDecisions,
  getPendingDecisions,
  getQueueSummary,
  hasPendingBlockers,
  queueDecision,
  resolveDecision
});
