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
var parallel_executor_exports = {};
__export(parallel_executor_exports, {
  ParallelExecutor: () => ParallelExecutor
});
module.exports = __toCommonJS(parallel_executor_exports);
class ParallelExecutor {
  maxConcurrency;
  runningTasks;
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.runningTasks = /* @__PURE__ */ new Map();
  }
  async executeParallel(phases, executePhase, options = {}) {
    const maxConcurrency = options.maxConcurrency || this.maxConcurrency;
    const results = [];
    const errors = [];
    const promises = phases.map(async (phase) => {
      const phaseId = phase.phase || phase.step || 0;
      this.runningTasks.set(phaseId, { status: "running", startTime: Date.now() });
      try {
        const result = await executePhase(phase);
        this.runningTasks.set(phaseId, { status: "completed", startTime: this.runningTasks.get(phaseId).startTime, endTime: Date.now(), result });
        return { phase: phaseId, status: "fulfilled", result };
      } catch (error) {
        this.runningTasks.set(phaseId, { status: "failed", startTime: this.runningTasks.get(phaseId).startTime, endTime: Date.now(), error: error.message });
        return { phase: phaseId, status: "rejected", error: error.message };
      }
    });
    const settled = await this._executeWithConcurrencyLimit(promises, maxConcurrency);
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        errors.push(String(result.reason));
      }
    }
    return {
      results: results.concat(settled.filter((s) => s.status === "rejected").map((s) => ({ phase: 0, status: "rejected", error: String(s.reason) }))),
      errors,
      summary: { total: phases.length, success: results.filter((r) => r.status === "fulfilled").length, failed: errors.length }
    };
  }
  async _executeWithConcurrencyLimit(tasks, limit) {
    const results = [];
    const executing = /* @__PURE__ */ new Set();
    for (const task of tasks) {
      const p = Promise.resolve().then(() => task);
      results.push(p);
      if (limit <= tasks.length) {
        const e = p.then(() => {
          executing.delete(e);
        }).catch(() => {
          executing.delete(e);
        });
        executing.add(e);
        if (executing.size >= limit) await Promise.race(executing);
      }
    }
    return Promise.allSettled(results);
  }
  getStatus() {
    const status = {};
    for (const [id, taskStatus] of this.runningTasks) {
      status[id] = { ...taskStatus };
      if (taskStatus.startTime && taskStatus.endTime) status[id].duration = taskStatus.endTime - taskStatus.startTime;
    }
    return status;
  }
  hasRunningTasks() {
    for (const [, status] of this.runningTasks) {
      if (status.status === "running") return true;
    }
    return false;
  }
  async waitForCompletion(timeout = 3e5) {
    const startTime = Date.now();
    while (this.hasRunningTasks()) {
      if (Date.now() - startTime > timeout) throw new Error("Timeout waiting for parallel tasks");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  cancelAll() {
    for (const [id, status] of this.runningTasks) {
      if (status.status === "running") this.runningTasks.set(id, { ...status, status: "cancelled" });
    }
  }
  clear() {
    this.runningTasks.clear();
  }
  setMaxConcurrency(max) {
    this.maxConcurrency = Math.max(1, Math.min(10, max));
  }
  getSummary() {
    let completed = 0, failed = 0, running = 0, totalDuration = 0;
    for (const [, status] of this.runningTasks) {
      if (status.status === "completed") {
        completed++;
        if (status.startTime && status.endTime) totalDuration += status.endTime - status.startTime;
      } else if (status.status === "failed") failed++;
      else if (status.status === "running") running++;
    }
    return { total: this.runningTasks.size, completed, failed, running, averageDuration: completed > 0 ? Math.round(totalDuration / completed) : 0 };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParallelExecutor
});
