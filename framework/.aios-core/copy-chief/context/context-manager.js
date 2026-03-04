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
var context_manager_exports = {};
__export(context_manager_exports, {
  ContextManager: () => ContextManager
});
module.exports = __toCommonJS(context_manager_exports);
var import_fs = require("fs");
var import_path = require("path");
class ContextManager {
  workflowId;
  projectRoot;
  stateDir;
  statePath;
  handoffDir;
  confidenceDir;
  _stateCache;
  constructor(workflowId, projectRoot) {
    this.workflowId = workflowId;
    this.projectRoot = projectRoot;
    this.stateDir = (0, import_path.join)(projectRoot, ".aios", "workflow-state");
    this.statePath = (0, import_path.join)(this.stateDir, `${workflowId}.json`);
    this.handoffDir = (0, import_path.join)(this.stateDir, "handoffs");
    this.confidenceDir = (0, import_path.join)(this.stateDir, "confidence");
    this._stateCache = null;
  }
  ensureStateDir() {
    for (const dir of [this.stateDir, this.handoffDir, this.confidenceDir]) {
      if (!(0, import_fs.existsSync)(dir)) (0, import_fs.mkdirSync)(dir, { recursive: true });
    }
  }
  initialize() {
    this.ensureStateDir();
    if ((0, import_fs.existsSync)(this.statePath)) {
      this._stateCache = JSON.parse((0, import_fs.readFileSync)(this.statePath, "utf-8"));
    } else {
      this._stateCache = this._createInitialState();
      this._saveState();
    }
    return this._stateCache;
  }
  _createInitialState() {
    return {
      workflowId: this.workflowId,
      status: "initialized",
      startedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      currentPhase: 0,
      phases: {},
      metadata: { projectRoot: this.projectRoot, delivery_confidence: null }
    };
  }
  loadState() {
    if (this._stateCache) return this._stateCache;
    if ((0, import_fs.existsSync)(this.statePath)) {
      this._stateCache = JSON.parse((0, import_fs.readFileSync)(this.statePath, "utf-8"));
      return this._stateCache;
    }
    return this._createInitialState();
  }
  _saveState() {
    this.ensureStateDir();
    this._stateCache.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    (0, import_fs.writeFileSync)(this.statePath, JSON.stringify(this._stateCache, null, 2));
  }
  savePhaseOutput(phaseNum, output, options = {}) {
    const state = this.loadState();
    const completedAt = (/* @__PURE__ */ new Date()).toISOString();
    state.currentPhase = phaseNum;
    state.status = "in_progress";
    const handoff = this._buildHandoffPackage(phaseNum, output, state, options, completedAt);
    state.phases[phaseNum] = { ...output, completedAt, handoff };
    state.metadata = state.metadata || {};
    state.metadata.delivery_confidence = this._calculateDeliveryConfidence(state);
    this._stateCache = state;
    this._saveState();
    this._saveHandoffFile(handoff);
    this._saveConfidenceFile(state.metadata.delivery_confidence);
  }
  getContextForPhase(phaseNum) {
    const state = this.loadState();
    const previousPhases = {};
    for (let i = 1; i < phaseNum; i++) {
      if (state.phases[i]) previousPhases[i] = state.phases[i];
    }
    const previousHandoffs = {};
    for (const [phaseId, phaseData] of Object.entries(previousPhases)) {
      if (phaseData?.handoff) previousHandoffs[phaseId] = phaseData.handoff;
    }
    return { workflowId: this.workflowId, currentPhase: phaseNum, previousPhases, previousHandoffs, metadata: state.metadata };
  }
  getPreviousPhaseOutputs() {
    return this._stateCache?.phases || {};
  }
  getPhaseOutput(phaseNum) {
    return this.getPreviousPhaseOutputs()[phaseNum] || null;
  }
  markCompleted() {
    const state = this.loadState();
    state.status = "completed";
    state.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    this._stateCache = state;
    this._saveState();
  }
  markFailed(error, failedPhase) {
    const state = this.loadState();
    state.status = "failed";
    state.error = error;
    state.failedPhase = failedPhase;
    state.failedAt = (/* @__PURE__ */ new Date()).toISOString();
    this._stateCache = state;
    this._saveState();
  }
  updateMetadata(metadata) {
    const state = this.loadState();
    state.metadata = { ...state.metadata, ...metadata };
    this._stateCache = state;
    this._saveState();
  }
  getLastCompletedPhase() {
    const phases = this.getPreviousPhaseOutputs();
    const phaseNums = Object.keys(phases).map(Number);
    return phaseNums.length > 0 ? Math.max(...phaseNums) : 0;
  }
  isPhaseCompleted(phaseNum) {
    const output = this.getPhaseOutput(phaseNum);
    return output !== null && output.completedAt !== void 0;
  }
  getDeliveryConfidence() {
    return this._stateCache?.metadata?.delivery_confidence || null;
  }
  getSummary() {
    const state = this._stateCache || this._createInitialState();
    const phases = Object.keys(state.phases).map(Number);
    return {
      workflowId: state.workflowId,
      status: state.status,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      currentPhase: state.currentPhase,
      completedPhases: phases,
      totalPhases: phases.length,
      deliveryConfidence: state.metadata?.delivery_confidence || null
    };
  }
  reset(keepMetadata = true) {
    const savedMetadata = keepMetadata ? this._stateCache?.metadata ?? {} : {};
    this._stateCache = this._createInitialState();
    this._stateCache.metadata = { ...this._stateCache.metadata, ...savedMetadata };
    this._saveState();
  }
  exportState() {
    return { ...this._stateCache };
  }
  importState(state) {
    this._stateCache = state;
    this._saveState();
  }
  // ============ Private Helpers ============
  _buildHandoffPackage(phaseNum, output, state, options, completedAt) {
    const handoffTarget = options.handoffTarget || {};
    return {
      version: "1.0.0",
      workflow_id: this.workflowId,
      generated_at: completedAt,
      from: { phase: phaseNum, agent: output.agent || null, action: output.action || null, task: output.task || null },
      to: { phase: handoffTarget.phase || null, agent: handoffTarget.agent || null },
      context_snapshot: { workflow_status: state.status, current_phase: state.currentPhase, metadata: state.metadata || {} },
      decision_log: this._extractDecisionLog(output),
      evidence_links: this._extractEvidenceLinks(output),
      open_risks: this._extractOpenRisks(output)
    };
  }
  _saveHandoffFile(handoff) {
    const phase = handoff?.from?.phase || "unknown";
    const filePath = (0, import_path.join)(this.handoffDir, `${this.workflowId}-phase-${phase}.handoff.json`);
    if (!(0, import_fs.existsSync)(this.handoffDir)) (0, import_fs.mkdirSync)(this.handoffDir, { recursive: true });
    (0, import_fs.writeFileSync)(filePath, JSON.stringify(handoff, null, 2));
  }
  _saveConfidenceFile(confidence) {
    if (!confidence) return;
    const filePath = (0, import_path.join)(this.confidenceDir, `${this.workflowId}.delivery-confidence.json`);
    if (!(0, import_fs.existsSync)(this.confidenceDir)) (0, import_fs.mkdirSync)(this.confidenceDir, { recursive: true });
    (0, import_fs.writeFileSync)(filePath, JSON.stringify(confidence, null, 2));
  }
  _extractDecisionLog(output) {
    const result = output.result || {};
    const entries = Array.isArray(result.decisions) ? result.decisions : Array.isArray(result.decision_log) ? result.decision_log : [];
    const sourcePaths = [];
    if (result.decisionLogPath) sourcePaths.push(result.decisionLogPath);
    if (result.decision_log_path) sourcePaths.push(result.decision_log_path);
    return { entries, source_paths: sourcePaths, count: entries.length };
  }
  _extractEvidenceLinks(output) {
    const evidence = [];
    const result = output.result || {};
    const validation = output.validation || {};
    if (Array.isArray(result.evidence_links)) evidence.push(...result.evidence_links);
    if (Array.isArray(validation.checks)) {
      for (const check of validation.checks) {
        if (check.path) evidence.push(check.path);
        if (check.checklist) evidence.push(check.checklist);
      }
    }
    return [...new Set(evidence)];
  }
  _extractOpenRisks(output) {
    const result = output.result || {};
    const risks = [];
    if (Array.isArray(result.open_risks)) risks.push(...result.open_risks);
    if (Array.isArray(result.risks)) risks.push(...result.risks);
    if (Array.isArray(result.risk_register)) risks.push(...result.risk_register);
    return risks;
  }
  _calculateDeliveryConfidence(state) {
    const phases = Object.values(state.phases || {});
    const weights = { test_coverage: 0.25, ac_completion: 0.3, risk_score_inv: 0.2, debt_score_inv: 0.15, regression_clear: 0.1 };
    const testCoverage = this._calcTestCoverage(phases);
    const acCompletion = this._calcAcCompletion(phases);
    const riskInv = this._calcRiskInverse(phases);
    const debtInv = this._calcDebtInverse(phases);
    const regressionClear = this._calcRegressionClear(phases, testCoverage);
    const components = { test_coverage: testCoverage, ac_completion: acCompletion, risk_score_inv: riskInv, debt_score_inv: debtInv, regression_clear: regressionClear };
    const scoreBase = Object.entries(weights).reduce((acc, [key, w]) => acc + (components[key] || 0) * w, 0);
    const score = Number((scoreBase * 100).toFixed(2));
    const threshold = Number(process.env.AIOS_DELIVERY_CONFIDENCE_THRESHOLD) || 70;
    return {
      version: "1.0.0",
      calculated_at: (/* @__PURE__ */ new Date()).toISOString(),
      score,
      threshold,
      gate_passed: score >= threshold,
      formula: { expression: "confidence = (test_coverage*0.25 + ac_completion*0.30 + risk_score_inv*0.20 + debt_score_inv*0.15 + regression_clear*0.10) * 100", weights },
      components,
      phase_count: phases.length
    };
  }
  _calcTestCoverage(phases) {
    let total = 0, passed = 0;
    for (const phase of phases) {
      if (!Array.isArray(phase?.validation?.checks)) continue;
      for (const check of phase.validation.checks) {
        total++;
        if (check?.passed) passed++;
      }
    }
    return total === 0 ? phases.length > 0 ? 1 : 0 : passed / total;
  }
  _calcAcCompletion(phases) {
    let total = 0, done = 0, hasExplicit = false;
    for (const phase of phases) {
      const r = phase?.result || {};
      if (Number.isFinite(r.ac_total) && Number.isFinite(r.ac_completed)) {
        hasExplicit = true;
        total += Math.max(0, r.ac_total);
        done += Math.min(Math.max(0, r.ac_completed), Math.max(0, r.ac_total));
      } else if (Array.isArray(r.acceptance_criteria)) {
        hasExplicit = true;
        total += r.acceptance_criteria.length;
        done += r.acceptance_criteria.filter((i) => i?.done || i?.status === "done").length;
      }
    }
    if (hasExplicit && total > 0) return done / total;
    if (phases.length === 0) return 0;
    return phases.filter((p) => p?.result?.status !== "failed").length / phases.length;
  }
  _calcRiskInverse(phases) {
    const totalRisks = phases.reduce((sum, phase) => {
      const handoffRisks = Array.isArray(phase?.handoff?.open_risks) ? phase.handoff.open_risks.length : 0;
      const resultRisks = this._extractOpenRisks(phase).length;
      return sum + Math.max(handoffRisks, resultRisks);
    }, 0);
    return Math.max(0, 1 - totalRisks / 10);
  }
  _calcDebtInverse(phases) {
    const totalDebt = phases.reduce((sum, phase) => {
      const r = phase?.result || {};
      const explicit = Number.isFinite(r.technical_debt_count) ? r.technical_debt_count : Number.isFinite(r.debt_count) ? r.debt_count : 0;
      const listCount = [r.technical_debt, r.debt_items, r.todos, r.hacks].reduce((s, list) => s + (Array.isArray(list) ? list.length : 0), 0);
      return sum + explicit + listCount;
    }, 0);
    return Math.max(0, 1 - totalDebt / 10);
  }
  _calcRegressionClear(phases, fallbackTestCoverage) {
    let total = 0, passed = 0;
    for (const phase of phases) {
      if (!Array.isArray(phase?.validation?.checks)) continue;
      for (const check of phase.validation.checks) {
        const isRegression = [String(check?.type || ""), String(check?.path || ""), String(check?.checklist || "")].some((s) => s.toLowerCase().includes("regression"));
        if (!isRegression) continue;
        total++;
        if (check?.passed) passed++;
      }
    }
    return total === 0 ? fallbackTestCoverage : passed / total;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ContextManager
});
