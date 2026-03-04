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
var handoff_engine_exports = {};
__export(handoff_engine_exports, {
  completeTask: () => completeTask,
  completeTaskWithEvent: () => completeTaskWithEvent,
  emitHandoffEvent: () => emitHandoffEvent,
  failTask: () => failTask,
  failTaskWithEvent: () => failTaskWithEvent,
  getHandoffStatus: () => getHandoffStatus,
  getNextTask: () => getNextTask,
  getSequence: () => getSequence,
  initHandoff: () => initHandoff,
  loadHandoffState: () => loadHandoffState,
  onHandoffEvent: () => onHandoffEvent,
  saveHandoffState: () => saveHandoffState,
  skipTask: () => skipTask
});
module.exports = __toCommonJS(handoff_engine_exports);
var import_fs = require("fs");
var import_path = require("path");
const SEQUENCES = {
  VSL: {
    sequence: [
      { id: "chapter_1", type: "write_chapter", chapter: 1 },
      { id: "review_1", type: "blind_critic", target: "chapter_1" },
      { id: "chapter_2", type: "write_chapter", chapter: 2 },
      { id: "review_2", type: "blind_critic", target: "chapter_2" },
      { id: "chapter_3", type: "write_chapter", chapter: 3 },
      { id: "review_3", type: "blind_critic", target: "chapter_3" },
      { id: "chapter_4", type: "write_chapter", chapter: 4 },
      { id: "review_4", type: "blind_critic", target: "chapter_4" },
      { id: "chapter_5", type: "write_chapter", chapter: 5 },
      { id: "review_5", type: "blind_critic", target: "chapter_5" },
      { id: "chapter_6", type: "write_chapter", chapter: 6 },
      { id: "review_6", type: "blind_critic", target: "chapter_6" },
      { id: "stress_test", type: "emotional_stress_test", target: "full_vsl" },
      { id: "layered", type: "layered_review", target: "full_vsl" },
      { id: "final", type: "black_validation", target: "full_vsl" }
    ],
    human_gates: ["final"]
  },
  LANDING_PAGE: {
    sequence: [
      { id: "hero", type: "write_block", block: "hero" },
      { id: "problem", type: "write_block", block: "problem" },
      { id: "mechanism", type: "write_block", block: "mechanism" },
      { id: "solution", type: "write_block", block: "solution" },
      { id: "proof", type: "write_block", block: "proof" },
      { id: "offer", type: "write_block", block: "offer" },
      { id: "cta", type: "write_block", block: "cta" },
      { id: "review_lp", type: "blind_critic", target: "full_lp" },
      { id: "stress_test", type: "emotional_stress_test", target: "full_lp" },
      { id: "layered", type: "layered_review", target: "full_lp" },
      { id: "final", type: "black_validation", target: "full_lp" }
    ],
    human_gates: ["final"]
  },
  CREATIVES: {
    sequence: [
      { id: "creative_1", type: "write_creative", variant: 1 },
      { id: "review_c1", type: "blind_critic", target: "creative_1" },
      { id: "creative_2", type: "write_creative", variant: 2 },
      { id: "review_c2", type: "blind_critic", target: "creative_2" },
      { id: "creative_3", type: "write_creative", variant: 3 },
      { id: "review_c3", type: "blind_critic", target: "creative_3" },
      { id: "stress_test", type: "emotional_stress_test", target: "all_creatives" },
      { id: "final", type: "black_validation", target: "all_creatives" }
    ],
    human_gates: ["final"]
  },
  EMAILS: {
    sequence: [
      { id: "email_1", type: "write_email", email: 1 },
      { id: "email_2", type: "write_email", email: 2 },
      { id: "email_3", type: "write_email", email: 3 },
      { id: "review_emails", type: "blind_critic", target: "email_sequence" },
      { id: "stress_test", type: "emotional_stress_test", target: "email_sequence" },
      { id: "final", type: "black_validation", target: "email_sequence" }
    ],
    human_gates: ["final"]
  }
};
function stateToString(state) {
  return JSON.stringify(state, null, 2);
}
function stateFromString(content) {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(
      "[HANDOFF-ENGINE] State file corrupted. Expected JSON format. Re-init the handoff to recover."
    );
  }
}
function getHandoffDir(offerPath) {
  return (0, import_path.join)(offerPath, "handoff-state");
}
function getHandoffFilePath(offerPath, deliverable) {
  return (0, import_path.join)(getHandoffDir(offerPath), `${deliverable}.yaml`);
}
function loadHandoffState(offerPath, deliverable) {
  const filePath = getHandoffFilePath(offerPath, deliverable);
  if (!(0, import_fs.existsSync)(filePath)) return null;
  try {
    const content = (0, import_fs.readFileSync)(filePath, "utf-8");
    return stateFromString(content);
  } catch (err) {
    console.error(`[HANDOFF-ENGINE] Failed to load ${filePath}: ${err}`);
    return null;
  }
}
function saveHandoffState(offerPath, deliverable, state) {
  const dir = getHandoffDir(offerPath);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  const filePath = getHandoffFilePath(offerPath, deliverable);
  (0, import_fs.writeFileSync)(filePath, stateToString(state), "utf-8");
}
function getSequence(type) {
  const seq = SEQUENCES[type];
  if (!seq) {
    throw new Error(`[HANDOFF-ENGINE] Unknown deliverable type: ${type}`);
  }
  return seq;
}
function resolveNextTask(state, seqDef) {
  const { sequence, human_gates } = seqDef;
  const tasks = state.tasks;
  for (let i = 0; i < tasks.length; i++) {
    const ts = tasks[i];
    if (ts.status === "COMPLETED" || ts.status === "SKIPPED") continue;
    if (ts.status === "FAILED") {
      return {
        next_task: sequence[i],
        is_human_gate: false,
        is_complete: false,
        message: `Task "${ts.id}" FAILED. Skip it or re-init to retry.`
      };
    }
    const subTask = sequence[i];
    const isHumanGate = human_gates.includes(ts.id);
    if (isHumanGate && ts.status === "PENDING") {
      return {
        next_task: subTask,
        is_human_gate: true,
        is_complete: false,
        message: `HUMAN GATE: "${ts.id}" requires human approval before proceeding.`
      };
    }
    return {
      next_task: subTask,
      is_human_gate: isHumanGate,
      is_complete: false,
      message: `Next task: "${ts.id}" (${subTask.type})`
    };
  }
  return {
    next_task: null,
    is_human_gate: false,
    is_complete: true,
    message: `All ${state.type} tasks completed for "${state.deliverable}".`
  };
}
function initHandoff(offerPath, deliverable, type) {
  const seqDef = getSequence(type);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const tasks = seqDef.sequence.map((sub) => ({
    id: sub.id,
    status: "PENDING"
  }));
  if (tasks.length > 0) {
    tasks[0].status = "IN_PROGRESS";
    tasks[0].started_at = now;
  }
  const state = {
    deliverable,
    type,
    started_at: now,
    current_task_index: 0,
    status: "IN_PROGRESS",
    tasks
  };
  saveHandoffState(offerPath, deliverable, state);
  return state;
}
function completeTask(offerPath, deliverable, taskId, result) {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}". Call initHandoff first.` };
  }
  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found in "${deliverable}" sequence.` };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  state.tasks[idx].status = "COMPLETED";
  state.tasks[idx].completed_at = now;
  if (result) state.tasks[idx].result = result;
  const nextIdx = findNextPendingIndex(state.tasks, idx + 1);
  if (nextIdx !== -1) {
    state.tasks[nextIdx].status = "IN_PROGRESS";
    state.tasks[nextIdx].started_at = now;
    state.current_task_index = nextIdx;
  } else {
    state.status = "COMPLETED";
    state.current_task_index = state.tasks.length;
  }
  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}
function failTask(offerPath, deliverable, taskId, reason) {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}".` };
  }
  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found.` };
  }
  state.tasks[idx].status = "FAILED";
  state.tasks[idx].completed_at = (/* @__PURE__ */ new Date()).toISOString();
  state.tasks[idx].result = { failure_reason: reason };
  state.status = "FAILED";
  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}
function skipTask(offerPath, deliverable, taskId, reason) {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}".` };
  }
  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found.` };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  state.tasks[idx].status = "SKIPPED";
  state.tasks[idx].completed_at = now;
  state.tasks[idx].skip_reason = reason;
  const nextIdx = findNextPendingIndex(state.tasks, idx + 1);
  if (nextIdx !== -1) {
    state.tasks[nextIdx].status = "IN_PROGRESS";
    state.tasks[nextIdx].started_at = now;
    state.current_task_index = nextIdx;
    state.status = "IN_PROGRESS";
  } else {
    state.status = "COMPLETED";
    state.current_task_index = state.tasks.length;
  }
  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}
function getNextTask(offerPath, deliverable) {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}". Call initHandoff first.` };
  }
  const seqDef = getSequence(state.type);
  return resolveNextTask(state, seqDef);
}
function getHandoffStatus(offerPath, deliverable) {
  return loadHandoffState(offerPath, deliverable);
}
function findNextPendingIndex(tasks, startFrom) {
  for (let i = startFrom; i < tasks.length; i++) {
    if (tasks[i].status === "PENDING") return i;
  }
  return -1;
}
const eventListeners = /* @__PURE__ */ new Map();
function onHandoffEvent(type, listener) {
  if (!eventListeners.has(type)) {
    eventListeners.set(type, []);
  }
  eventListeners.get(type).push(listener);
}
function emitHandoffEvent(event) {
  const listeners = eventListeners.get(event.type) || [];
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error(`[HANDOFF-ENGINE] Event listener error: ${err}`);
    }
  }
  try {
    const logDir = (0, import_path.join)(process.env.HOME || "", ".claude/logs");
    const { mkdirSync: mk, appendFileSync: append, existsSync: ex } = require("fs");
    if (!ex(logDir)) mk(logDir, { recursive: true });
    const logPath = (0, import_path.join)(logDir, "handoff-events.jsonl");
    append(logPath, JSON.stringify(event) + "\n");
  } catch {
  }
}
function completeTaskWithEvent(offerPath, deliverable, taskId, result) {
  const handoffResult = completeTask(offerPath, deliverable, taskId, result);
  emitHandoffEvent({
    type: handoffResult.is_complete ? "pipeline_completed" : "task_completed",
    deliverable,
    task_id: taskId,
    offer_path: offerPath,
    result,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (handoffResult.is_human_gate) {
    emitHandoffEvent({
      type: "human_gate",
      deliverable,
      task_id: handoffResult.next_task?.id || taskId,
      offer_path: offerPath,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return handoffResult;
}
function failTaskWithEvent(offerPath, deliverable, taskId, reason) {
  const handoffResult = failTask(offerPath, deliverable, taskId, reason);
  emitHandoffEvent({
    type: "task_failed",
    deliverable,
    task_id: taskId,
    offer_path: offerPath,
    result: { failure_reason: reason },
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
  return handoffResult;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  completeTask,
  completeTaskWithEvent,
  emitHandoffEvent,
  failTask,
  failTaskWithEvent,
  getHandoffStatus,
  getNextTask,
  getSequence,
  initHandoff,
  loadHandoffState,
  onHandoffEvent,
  saveHandoffState,
  skipTask
});
