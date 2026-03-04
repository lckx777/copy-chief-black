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
var workflow_state_manager_exports = {};
__export(workflow_state_manager_exports, {
  WorkflowStateManager: () => WorkflowStateManager
});
module.exports = __toCommonJS(workflow_state_manager_exports);
var import_fs = require("fs");
var import_path = require("path");
let yaml;
try {
  yaml = require("yaml");
} catch {
  yaml = require("js-yaml");
}
const WORKFLOW_STATE_VERSION = "2.0";
class WorkflowStateManager {
  basePath;
  verbose;
  stateDir;
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.verbose = options.verbose || false;
    this.stateDir = (0, import_path.join)(this.basePath, ".aios");
  }
  _log(message) {
    if (this.verbose) console.log(`[WorkflowStateManager] ${message}`);
  }
  // ============ State CRUD ============
  createState(workflowData, instanceConfig = {}) {
    const wf = workflowData.workflow || workflowData;
    if (!wf || !wf.id) throw new Error("workflow.id is required to create workflow state");
    const instanceId = this._generateInstanceId(wf.id);
    const state = {
      state_version: WORKFLOW_STATE_VERSION,
      workflow_id: wf.id,
      workflow_name: wf.name || wf.id,
      instance_id: instanceId,
      target_context: instanceConfig.target_context || "core",
      squad_name: instanceConfig.squad_name || null,
      started_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      status: "active",
      current_phase: null,
      current_step_index: 0,
      steps: [],
      artifacts: [],
      decisions: []
    };
    if (wf.sequence && Array.isArray(wf.sequence)) {
      state.steps = wf.sequence.map((step, index) => {
        let action = "";
        if (step.creates) action = `creates: ${step.creates}`;
        else if (step.updates) action = `updates: ${step.updates}`;
        else if (step.validates) action = `validates: ${step.validates}`;
        else if (step.action) action = step.action;
        else if (step.repeat_development_cycle) action = "repeat_development_cycle";
        else if (step.workflow_end) action = "workflow_end";
        const isOptional = step.optional === true || !!step.condition;
        return {
          step_index: index,
          phase: step.agent ? `${step.agent}: ${action}` : action,
          agent: step.agent || null,
          action,
          status: "pending",
          optional: isOptional,
          started_at: null,
          completed_at: null,
          artifacts_created: [],
          notes: step.notes || null,
          session_id: null
        };
      });
      if (state.steps.length > 0) {
        state.current_phase = state.steps[0].phase;
      }
      for (let i = 0; i < wf.sequence.length; i++) {
        const step = wf.sequence[i];
        if (step.creates) {
          state.artifacts.push({
            name: step.creates,
            created_by_step: i,
            path: null,
            status: "pending"
          });
        }
      }
    }
    this._ensureStateDir();
    this.saveState(state);
    this._log(`State created: ${instanceId}`);
    return state;
  }
  // ============ Runtime-First Next Action ============
  evaluateExecutionState(signals = {}) {
    const storyStatus = String(signals.story_status || signals.offer_phase || "unknown").toLowerCase();
    const qaStatus = String(signals.qa_status || signals.gate_status || "unknown").toLowerCase();
    const ciStatus = String(signals.ci_status || "unknown").toLowerCase();
    const hasUncommitted = Boolean(signals.has_uncommitted_changes);
    const reasons = [];
    let state = "unknown";
    if (storyStatus === "blocked") {
      state = "blocked";
      reasons.push("story/offer status is blocked");
    } else if (qaStatus === "rejected" || qaStatus === "fail" || qaStatus === "failed" || qaStatus === "blocked") {
      state = "qa_rejected";
      reasons.push(`qa/gate status is ${qaStatus}`);
    } else if (ciStatus === "red" || ciStatus === "failed" || ciStatus === "error") {
      state = "ci_red";
      reasons.push(`ci status is ${ciStatus}`);
    } else if (storyStatus === "done" || storyStatus === "completed" || storyStatus === "delivered") {
      state = "completed";
      reasons.push(`status is ${storyStatus}`);
    } else if (storyStatus === "in_progress" || storyStatus === "production" || storyStatus === "review") {
      if (hasUncommitted) {
        state = "in_development";
        reasons.push("in progress with uncommitted changes");
      } else {
        state = "ready_for_validation";
        reasons.push("in progress with clean state");
      }
    } else if (storyStatus === "research" || storyStatus === "briefing") {
      state = "in_development";
      reasons.push(`phase: ${storyStatus}`);
    }
    return {
      state,
      reasons,
      normalized: {
        story_status: storyStatus,
        qa_status: qaStatus,
        ci_status: ciStatus,
        has_uncommitted_changes: hasUncommitted
      }
    };
  }
  getNextActionRecommendation(signals = {}, options = {}) {
    const result = this.evaluateExecutionState(signals);
    const target = options.story || options.offer || "";
    const targetArg = target ? ` ${target}` : "";
    const map = {
      blocked: {
        command: `/status${targetArg}`,
        agent: "@chief",
        rationale: "Offer is blocked. Surface blockers and unblock path first.",
        confidence: 0.95
      },
      qa_rejected: {
        command: `/validate${targetArg}`,
        agent: "@critic",
        rationale: "Gate rejected. Apply fixes before progressing.",
        confidence: 0.95
      },
      ci_red: {
        command: `/validate${targetArg}`,
        agent: "@critic",
        rationale: "Validation failed. Fix issues first.",
        confidence: 0.92
      },
      completed: {
        command: `/next-action${targetArg}`,
        agent: "@chief",
        rationale: "Phase complete. Move to next deliverable.",
        confidence: 0.9
      },
      in_development: {
        command: `/validate${targetArg}`,
        agent: "@critic",
        rationale: "Work in progress. Validate before advancing.",
        confidence: 0.85
      },
      ready_for_validation: {
        command: `/validate${targetArg}`,
        agent: "@critic",
        rationale: "Work appears stable. Proceed to quality gate.",
        confidence: 0.82
      },
      unknown: {
        command: `/next-action${targetArg}`,
        agent: "@chief",
        rationale: "Context is incomplete. Request explicit workflow guidance.",
        confidence: 0.4
      }
    };
    const recommendation = map[result.state] || map.unknown;
    return { state: result.state, ...recommendation };
  }
  // ============ State I/O ============
  loadState(instanceId) {
    const statePath = this._resolveStatePath(instanceId);
    try {
      const content = (0, import_fs.readFileSync)(statePath, "utf-8");
      const state = (yaml.parse || yaml.load)(content);
      this._log(`State loaded: ${instanceId}`);
      return state;
    } catch (error) {
      if (error.code === "ENOENT") {
        this._log(`State not found: ${instanceId}`);
        return null;
      }
      throw error;
    }
  }
  saveState(state) {
    state.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    const statePath = this._resolveStatePath(state.instance_id);
    this._ensureStateDir();
    const content = (yaml.stringify || yaml.dump)(state, { lineWidth: 120, noRefs: true });
    (0, import_fs.writeFileSync)(statePath, content, "utf-8");
    this._log(`State saved: ${state.instance_id}`);
  }
  listActiveWorkflows() {
    const results = [];
    try {
      const files = (0, import_fs.readdirSync)(this.stateDir);
      const stateFiles = files.filter((f) => f.endsWith("-state.yaml"));
      for (const file of stateFiles) {
        try {
          const content = (0, import_fs.readFileSync)((0, import_path.join)(this.stateDir, file), "utf-8");
          const state = (yaml.parse || yaml.load)(content);
          if (state && state.status === "active") {
            results.push({
              instanceId: state.instance_id,
              workflowId: state.workflow_id,
              workflowName: state.workflow_name,
              status: state.status,
              updatedAt: state.updated_at,
              progress: this.getProgress(state)
            });
          }
        } catch {
        }
      }
    } catch {
    }
    return results;
  }
  // ============ State Transitions ============
  advanceStep(state) {
    const currentIndex = state.current_step_index;
    for (let i = currentIndex + 1; i < state.steps.length; i++) {
      if (state.steps[i].status === "pending") {
        state.current_step_index = i;
        state.current_phase = state.steps[i].phase;
        this._log(`Advanced to step ${i}: ${state.steps[i].phase}`);
        return state;
      }
    }
    state.status = "completed";
    state.current_phase = "Workflow complete";
    this._log("All steps completed");
    return state;
  }
  markStepCompleted(state, stepIndex, artifacts = []) {
    if (stepIndex < 0 || stepIndex >= state.steps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }
    const step = state.steps[stepIndex];
    step.status = "completed";
    step.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    step.artifacts_created = artifacts;
    for (const artifactName of artifacts) {
      const artifact = state.artifacts.find((a) => a.name === artifactName);
      if (artifact) artifact.status = "created";
    }
    this._log(`Step ${stepIndex} marked completed`);
    return state;
  }
  markStepSkipped(state, stepIndex) {
    if (stepIndex < 0 || stepIndex >= state.steps.length) throw new Error(`Invalid step index: ${stepIndex}`);
    const step = state.steps[stepIndex];
    if (!step.optional) throw new Error(`Step ${stepIndex} is not optional and cannot be skipped`);
    step.status = "skipped";
    step.completed_at = (/* @__PURE__ */ new Date()).toISOString();
    this._log(`Step ${stepIndex} marked skipped`);
    return state;
  }
  // ============ Queries ============
  getCurrentStep(state) {
    if (state.status === "completed" || state.status === "aborted") return null;
    return state.steps[state.current_step_index] || null;
  }
  getProgress(state) {
    const total = state.steps.length;
    const completed = state.steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
    const percentage = total > 0 ? Math.round(completed / total * 100) : 0;
    return { completed, total, percentage, currentPhase: state.current_phase };
  }
  getArtifactStatus(state) {
    const created = state.artifacts.filter((a) => a.status === "created");
    const pending = state.artifacts.filter((a) => a.status === "pending");
    return { created, pending };
  }
  // ============ Integration ============
  generateHandoffContext(state) {
    const progress = this.getProgress(state);
    const currentStep = this.getCurrentStep(state);
    const artifacts = this.getArtifactStatus(state);
    const lines = [
      "## Workflow Handoff Context",
      "",
      `**Workflow:** ${state.workflow_name} (${state.instance_id})`,
      `**Status:** ${state.status}`,
      `**Progress:** ${progress.completed}/${progress.total} steps (${progress.percentage}%)`,
      `**Current Phase:** ${state.current_phase}`,
      ""
    ];
    if (currentStep) {
      lines.push("### Current Step");
      lines.push(`- **Step ${currentStep.step_index + 1}:** ${currentStep.phase}`);
      if (currentStep.agent) lines.push(`- **Agent:** @${currentStep.agent}`);
      lines.push(`- **Action:** ${currentStep.action}`);
      if (currentStep.notes) lines.push(`- **Notes:** ${currentStep.notes}`);
      lines.push("");
    }
    if (artifacts.created.length > 0) {
      lines.push("### Completed Artifacts");
      for (const a of artifacts.created) lines.push(`- ${a.name}${a.path ? ` (${a.path})` : ""}`);
      lines.push("");
    }
    if (artifacts.pending.length > 0) {
      lines.push("### Pending Artifacts");
      for (const a of artifacts.pending) lines.push(`- ${a.name}`);
      lines.push("");
    }
    if (state.decisions.length > 0) {
      lines.push("### Key Decisions");
      for (const d of state.decisions) lines.push(`- Step ${d.step_index + 1}: ${d.decision}`);
      lines.push("");
    }
    lines.push("### Resume Command");
    lines.push(`\`/resume ${state.workflow_id}\``);
    return lines.join("\n");
  }
  generateStatusReport(state) {
    const progress = this.getProgress(state);
    const barLength = 20;
    const filledLength = Math.round(progress.percentage / 100 * barLength);
    const bar = "\u2588".repeat(filledLength) + "\u2591".repeat(barLength - filledLength);
    const lines = [
      `=== Workflow Status: ${state.workflow_name} ===`,
      `Instance: ${state.instance_id}`,
      `Status: ${state.status.toUpperCase()}`,
      `Started: ${state.started_at}`,
      `Updated: ${state.updated_at}`,
      "",
      `Progress: [${bar}] ${progress.percentage}% (${progress.completed}/${progress.total})`,
      "",
      "--- Steps ---"
    ];
    for (const step of state.steps) {
      let statusIcon;
      switch (step.status) {
        case "completed":
          statusIcon = "[x]";
          break;
        case "skipped":
          statusIcon = "[-]";
          break;
        case "in_progress":
          statusIcon = "[>]";
          break;
        default:
          statusIcon = "[ ]";
      }
      const isCurrent = step.step_index === state.current_step_index && state.status === "active";
      const marker = isCurrent ? " <-- current" : "";
      const optional = step.optional ? " (optional)" : "";
      lines.push(`  ${statusIcon} Step ${step.step_index + 1}: ${step.phase}${optional}${marker}`);
    }
    if (state.artifacts.length > 0) {
      lines.push("", "--- Artifacts ---");
      for (const a of state.artifacts) {
        const icon = a.status === "created" ? "[x]" : "[ ]";
        lines.push(`  ${icon} ${a.name}${a.path ? ` -> ${a.path}` : ""}`);
      }
    }
    if (state.decisions.length > 0) {
      lines.push("", "--- Decisions ---");
      for (const d of state.decisions) lines.push(`  Step ${d.step_index + 1}: ${d.decision}`);
    }
    return lines.join("\n");
  }
  // ============ Helpers ============
  _resolveStatePath(instanceId) {
    return (0, import_path.join)(this.stateDir, `${instanceId}-state.yaml`);
  }
  _generateInstanceId(workflowId) {
    if (!workflowId || workflowId.includes("..") || workflowId.includes("/") || workflowId.includes("\\")) {
      throw new Error("workflow.id contains invalid path characters");
    }
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).substring(2, 8);
    return `${workflowId}-${date}-${random}`;
  }
  _ensureStateDir() {
    if (!(0, import_fs.existsSync)(this.stateDir)) (0, import_fs.mkdirSync)(this.stateDir, { recursive: true });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WorkflowStateManager
});
