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
var surface_checker_exports = {};
__export(surface_checker_exports, {
  checkCriterion: () => checkCriterion,
  getCriteria: () => getCriteria,
  invalidateCache: () => invalidateCache,
  shouldSurface: () => shouldSurface
});
module.exports = __toCommonJS(surface_checker_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_yaml = require("yaml");
var import_os = require("os");
var import_decision_queue = require("./decision-queue");
const HOME = (0, import_os.homedir)();
const CRITERIA_PATH = (0, import_path.join)(HOME, ".claude", "copy-surface-criteria.yaml");
let cachedConfig = null;
function loadConfig() {
  if (cachedConfig) return cachedConfig;
  if (!(0, import_fs.existsSync)(CRITERIA_PATH)) {
    throw new Error(`Surface criteria not found: ${CRITERIA_PATH}`);
  }
  const raw = (0, import_fs.readFileSync)(CRITERIA_PATH, "utf-8");
  cachedConfig = (0, import_yaml.parse)(raw);
  return cachedConfig;
}
function evaluateCondition(condition, context, lists) {
  if (condition.includes(" AND ")) {
    const parts = condition.split(" AND ");
    return parts.every((part) => evaluateCondition(part.trim(), context, lists));
  }
  if (condition.includes(" OR ")) {
    const parts = condition.split(" OR ");
    return parts.some((part) => evaluateCondition(part.trim(), context, lists));
  }
  const inMatch = condition.match(/^(\w+)\s+IN\s+(\w+)$/);
  if (inMatch) {
    const [, field, listName] = inMatch;
    const value = String(context[field] || "");
    const list = lists[listName] || [];
    return list.includes(value);
  }
  const compMatch = condition.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const [, field, op, rawRight] = compMatch;
    const leftVal = context[field];
    let rightVal;
    const trimmed = rawRight.trim();
    if (trimmed === "true") rightVal = true;
    else if (trimmed === "false") rightVal = false;
    else if (trimmed === "null") rightVal = null;
    else if (/^'[^']*'$/.test(trimmed)) rightVal = trimmed.slice(1, -1);
    else if (/^"[^"]*"$/.test(trimmed)) rightVal = trimmed.slice(1, -1);
    else if (!isNaN(Number(trimmed))) rightVal = Number(trimmed);
    else rightVal = trimmed;
    switch (op) {
      case "==":
        return leftVal == rightVal;
      case "!=":
        return leftVal != rightVal;
      case ">=":
        return Number(leftVal) >= Number(rightVal);
      case "<=":
        return Number(leftVal) <= Number(rightVal);
      case ">":
        return Number(leftVal) > Number(rightVal);
      case "<":
        return Number(leftVal) < Number(rightVal);
    }
  }
  const bareField = condition.trim();
  if (bareField in context) {
    return !!context[bareField];
  }
  return false;
}
function interpolateMessage(template, context) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = context[key];
    if (val === void 0 || val === null) return match;
    return String(val);
  });
}
function shouldSurface(context) {
  const config = loadConfig();
  for (const criterionId of config.evaluation_order) {
    const criterion = config.criteria[criterionId];
    if (!criterion) continue;
    try {
      const matches = evaluateCondition(criterion.condition, context, config.lists);
      if (matches) {
        const message = interpolateMessage(criterion.message, context);
        let queuedId;
        if (context.offer_id) {
          const queued = (0, import_decision_queue.queueDecision)(context.offer_id, criterionId, {
            type: criterion.action,
            priority: criterion.priority,
            blocking: criterion.blocking,
            title: criterionId.replace(/_/g, " ").replace(/^C\d+\s*/, ""),
            context: message,
            auto_resolve_after_hours: criterion.auto_resolve_after_hours,
            auto_resolve_choice: criterion.auto_resolve_choice
          });
          queuedId = queued.id;
        }
        return {
          should_surface: true,
          criterion_id: criterionId,
          criterion,
          message,
          queued_decision_id: queuedId
        };
      }
    } catch {
      continue;
    }
  }
  return { should_surface: false };
}
function checkCriterion(criterionId, context) {
  const config = loadConfig();
  const criterion = config.criteria[criterionId];
  if (!criterion) return false;
  return evaluateCondition(criterion.condition, context, config.lists);
}
function getCriteria() {
  const config = loadConfig();
  return config.criteria;
}
function invalidateCache() {
  cachedConfig = null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkCriterion,
  getCriteria,
  invalidateCache,
  shouldSurface
});
