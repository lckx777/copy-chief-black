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
var task_manager_exports = {};
__export(task_manager_exports, {
  ProgressTracker: () => ProgressTracker,
  TaskManager: () => TaskManager
});
module.exports = __toCommonJS(task_manager_exports);
var import_fs = require("fs");
var import_path = require("path");
class ProgressTracker {
  total;
  completed;
  failed;
  skipped;
  startTime;
  smoothedRate;
  smoothingFactor;
  byType;
  constructor(total = 0, options = {}) {
    this.total = total;
    this.completed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.startTime = Date.now();
    this.smoothedRate = null;
    this.smoothingFactor = options.smoothingFactor || 0.2;
    this.byType = /* @__PURE__ */ new Map();
  }
  setTotal(total) {
    this.total = total;
  }
  increment(opts = {}) {
    const { type = "default", status = "completed", count = 1 } = opts;
    if (!this.byType.has(type)) this.byType.set(type, { completed: 0, failed: 0, skipped: 0, total: 0, processed: 0 });
    const ts = this.byType.get(type);
    ts.total += count;
    if (status === "completed") {
      this.completed += count;
      ts.completed += count;
    } else if (status === "failed") {
      this.failed += count;
      ts.failed += count;
    } else if (status === "skipped") {
      this.skipped += count;
      ts.skipped += count;
    }
    const processed = this.completed + this.failed + this.skipped;
    ts.processed = ts.completed + ts.failed + ts.skipped;
    const duration = Date.now() - this.startTime;
    const rate = processed / (duration / 1e3);
    this.smoothedRate = this.smoothedRate === null ? rate : this.smoothingFactor * rate + (1 - this.smoothingFactor) * this.smoothedRate;
  }
  getProgress() {
    const processed = this.completed + this.failed + this.skipped;
    const percentage = this.total > 0 ? processed / this.total * 100 : 0;
    const elapsedMs = Date.now() - this.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1e3);
    const remaining = this.total > 0 ? Math.max(this.total - processed, 0) : 0;
    const rate = this.smoothedRate || processed / Math.max(elapsedSeconds, 1);
    const etaSeconds = rate > 0 ? Math.max(remaining / rate, 0) : Infinity;
    const byType = Array.from(this.byType.entries()).map(([type, stats]) => ({
      type,
      ...stats,
      percentage: stats.total > 0 ? (stats.processed / stats.total * 100).toFixed(1) : "0.0"
    }));
    return {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      skipped: this.skipped,
      processed,
      percentage: percentage.toFixed(1),
      elapsed_seconds: elapsedSeconds,
      elapsed_human: this._formatDuration(elapsedSeconds),
      eta_seconds: Math.floor(etaSeconds),
      eta_human: this._formatDuration(Math.floor(etaSeconds)),
      rate_per_minute: (rate * 60).toFixed(1),
      byType
    };
  }
  _formatDuration(seconds) {
    if (!isFinite(seconds)) return "inf";
    const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  }
}
class TaskManager {
  maxConcurrent;
  maxRetries;
  statePath;
  autoPersistInterval;
  queue;
  running;
  completed;
  failed;
  cancelled;
  dependencies;
  metrics;
  progress;
  _listeners;
  _autoPersistTimer;
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.maxRetries = options.maxRetries || 3;
    this.statePath = options.statePath || null;
    this.autoPersistInterval = options.autoPersistInterval || 1e4;
    this.queue = [];
    this.running = /* @__PURE__ */ new Map();
    this.completed = [];
    this.failed = [];
    this.cancelled = /* @__PURE__ */ new Set();
    this.dependencies = /* @__PURE__ */ new Map();
    this.metrics = { started: 0, completed: 0, failed: 0, retried: 0, cancelled: 0, avgDuration: 0 };
    this.progress = new ProgressTracker(options.total || 0);
    this._listeners = /* @__PURE__ */ new Map();
    this._autoPersistTimer = null;
    if (this.statePath) {
      this._loadState();
      this._autoPersist();
    }
  }
  on(event, listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(listener);
  }
  _emit(event, data) {
    const listeners = this._listeners.get(event) || [];
    for (const listener of listeners) {
      try {
        listener(data);
      } catch {
      }
    }
  }
  addTask(task) {
    const taskWithMetadata = {
      ...task,
      status: "pending",
      attempts: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      result: null,
      error: null
    };
    if (task.dependencies?.length) this.dependencies.set(task.id, task.dependencies);
    this.queue.push(taskWithMetadata);
    this._emit("task_added", taskWithMetadata);
    this._processQueue();
    this._persistState();
  }
  addTasks(tasks) {
    tasks.forEach((task) => this.addTask(task));
  }
  cancelTask(taskId) {
    this.cancelled.add(taskId);
    const runningTask = this.running.get(taskId);
    if (runningTask?.cancel) runningTask.cancel();
    this._emit("task_cancelled", { id: taskId });
    this.metrics.cancelled += 1;
    this._persistState();
  }
  async _processQueue() {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const index = this.queue.findIndex((task2) => this._canRun(task2));
      if (index === -1) break;
      const task = this.queue.splice(index, 1)[0];
      this._executeTask(task);
    }
  }
  _canRun(task) {
    if (this.cancelled.has(task.id)) return false;
    const deps = this.dependencies.get(task.id);
    if (!deps?.length) return true;
    return deps.every(
      (depId) => this.completed.some((t) => t.id === depId) && !this.failed.some((t) => t.id === depId)
    );
  }
  async _executeTask(task) {
    const startTime = Date.now();
    const taskWithCancel = { ...task, status: "running", started_at: startTime, updated_at: startTime };
    this.running.set(task.id, taskWithCancel);
    this.metrics.started += 1;
    this._emit("task_started", taskWithCancel);
    const cancelToken = { cancelled: false };
    taskWithCancel.cancel = () => {
      cancelToken.cancelled = true;
    };
    try {
      const result = await task.execute({ cancelToken });
      if (cancelToken.cancelled) throw new Error("Task cancelled");
      const duration = Date.now() - startTime;
      this.metrics.completed += 1;
      this.metrics.avgDuration = this._computeNewAverage(this.metrics.avgDuration, this.metrics.completed, duration);
      const completedTask = { ...taskWithCancel, status: "completed", completed_at: Date.now(), updated_at: Date.now(), result, duration };
      this.running.delete(task.id);
      this.completed.push(completedTask);
      this.progress.increment({ type: task.type, status: "completed" });
      this._emit("task_completed", completedTask);
    } catch (error) {
      const attempts = task.attempts + 1;
      const taskWithError = { ...taskWithCancel, attempts, error: error.message, updated_at: Date.now() };
      this.running.delete(task.id);
      if (cancelToken.cancelled || this.cancelled.has(task.id)) {
        taskWithError.status = "cancelled";
        this.cancelled.delete(task.id);
        this.metrics.cancelled += 1;
        this._emit("task_cancelled", taskWithError);
      } else if (attempts < (task.maxRetries || this.maxRetries)) {
        taskWithError.status = "retrying";
        this.queue.push(taskWithError);
        this.metrics.retried += 1;
        this._emit("task_retrying", taskWithError);
      } else {
        taskWithError.status = "failed";
        this.failed.push(taskWithError);
        this.metrics.failed += 1;
        this.progress.increment({ type: task.type, status: "failed" });
        this._emit("task_failed", taskWithError);
      }
    }
    this._persistState();
    this._processQueue();
  }
  _loadState() {
    if (!this.statePath || !(0, import_fs.existsSync)(this.statePath)) return;
    try {
      const stateJSON = (0, import_fs.readFileSync)(this.statePath, "utf-8");
      const state = JSON.parse(stateJSON);
      this.queue = (state.queue || []).map((t) => ({ ...t, execute: () => Promise.resolve() }));
      this.completed = state.completed || [];
      this.failed = state.failed || [];
      this.metrics = state.metrics || this.metrics;
      this.dependencies = new Map(Object.entries(state.dependencies || {}));
      this._emit("state_loaded", state);
    } catch (error) {
      if (error.code !== "ENOENT") this._emit("state_load_error", { error: error.message });
    }
  }
  _persistState() {
    if (!this.statePath) return;
    const state = {
      queue: this.queue.map(({ execute, cancel, ...rest }) => rest),
      running: Array.from(this.running.values()).map(({ execute, cancel, ...rest }) => rest),
      completed: this.completed.map(({ execute, cancel, ...rest }) => rest),
      failed: this.failed.map(({ execute, cancel, ...rest }) => rest),
      metrics: this.metrics,
      dependencies: Object.fromEntries(this.dependencies)
    };
    try {
      const dir = (0, import_path.dirname)(this.statePath);
      if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
      (0, import_fs.writeFileSync)(this.statePath, JSON.stringify(state, null, 2));
      this._emit("state_saved", { path: this.statePath });
    } catch (error) {
      this._emit("state_save_error", { error: error.message });
    }
  }
  _autoPersist() {
    if (!this.statePath || this._autoPersistTimer) return;
    this._autoPersistTimer = setInterval(() => this._persistState(), this.autoPersistInterval);
  }
  getStats() {
    return {
      totals: {
        pending: this.queue.length,
        running: this.running.size,
        completed: this.completed.length,
        failed: this.failed.length,
        cancelled: this.metrics.cancelled,
        total: this.queue.length + this.running.size + this.completed.length + this.failed.length
      },
      metrics: { ...this.metrics }
    };
  }
  async flush() {
    this.queue.length = 0;
    this.completed.length = 0;
    this.failed.length = 0;
    this.running.clear();
    this.cancelled.clear();
    this.metrics = { started: 0, completed: 0, failed: 0, retried: 0, cancelled: 0, avgDuration: 0 };
    this._persistState();
  }
  async shutdown() {
    if (this._autoPersistTimer) {
      clearInterval(this._autoPersistTimer);
      this._autoPersistTimer = null;
    }
    this._persistState();
  }
  _computeNewAverage(currentAvg, count, newValue) {
    if (count === 0) return newValue;
    return currentAvg * ((count - 1) / count) + newValue / count;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProgressTracker,
  TaskManager
});
