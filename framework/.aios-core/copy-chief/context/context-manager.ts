/**
 * Context Manager - Persists workflow state between phases
 * Port of: aios-core/.aios-core/core/orchestration/context-manager.js
 *
 * DETERMINISTIC: All operations use file system, no AI involvement.
 *
 * @module aios/context-manager
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ============ Types ============

export interface PhaseOutput {
  agent?: string;
  action?: string;
  task?: string;
  result?: Record<string, any>;
  validation?: { checks?: Array<{ type?: string; path?: string; checklist?: string; passed?: boolean }> };
  completedAt?: string;
  handoff?: HandoffPackage;
}

export interface HandoffPackage {
  version: string;
  workflow_id: string;
  generated_at: string;
  from: { phase: number; agent: string | null; action: string | null; task: string | null };
  to: { phase: number | null; agent: string | null };
  context_snapshot: { workflow_status: string; current_phase: number; metadata: Record<string, any> };
  decision_log: { entries: any[]; source_paths: string[]; count: number };
  evidence_links: string[];
  open_risks: any[];
}

export interface DeliveryConfidence {
  version: string;
  calculated_at: string;
  score: number;
  threshold: number;
  gate_passed: boolean;
  formula: { expression: string; weights: Record<string, number> };
  components: Record<string, number>;
  phase_count: number;
}

export interface WorkflowContextState {
  workflowId: string;
  status: 'initialized' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  currentPhase: number;
  phases: Record<number, PhaseOutput>;
  metadata: Record<string, any>;
  error?: string;
  failedPhase?: number;
  failedAt?: string;
}

// ============ Class ============

export class ContextManager {
  workflowId: string;
  projectRoot: string;
  stateDir: string;
  statePath: string;
  handoffDir: string;
  confidenceDir: string;
  private _stateCache: WorkflowContextState | null;

  constructor(workflowId: string, projectRoot: string) {
    this.workflowId = workflowId;
    this.projectRoot = projectRoot;
    this.stateDir = join(projectRoot, '.aios', 'workflow-state');
    this.statePath = join(this.stateDir, `${workflowId}.json`);
    this.handoffDir = join(this.stateDir, 'handoffs');
    this.confidenceDir = join(this.stateDir, 'confidence');
    this._stateCache = null;
  }

  ensureStateDir(): void {
    for (const dir of [this.stateDir, this.handoffDir, this.confidenceDir]) {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }
  }

  initialize(): WorkflowContextState {
    this.ensureStateDir();
    if (existsSync(this.statePath)) {
      this._stateCache = JSON.parse(readFileSync(this.statePath, 'utf-8'));
    } else {
      this._stateCache = this._createInitialState();
      this._saveState();
    }
    return this._stateCache!;
  }

  private _createInitialState(): WorkflowContextState {
    return {
      workflowId: this.workflowId,
      status: 'initialized',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPhase: 0,
      phases: {},
      metadata: { projectRoot: this.projectRoot, delivery_confidence: null },
    };
  }

  loadState(): WorkflowContextState {
    if (this._stateCache) return this._stateCache;
    if (existsSync(this.statePath)) {
      this._stateCache = JSON.parse(readFileSync(this.statePath, 'utf-8'));
      return this._stateCache!;
    }
    return this._createInitialState();
  }

  private _saveState(): void {
    this.ensureStateDir();
    this._stateCache!.updatedAt = new Date().toISOString();
    writeFileSync(this.statePath, JSON.stringify(this._stateCache, null, 2));
  }

  savePhaseOutput(phaseNum: number, output: PhaseOutput, options: { handoffTarget?: { phase?: number | null; agent?: string | null } } = {}): void {
    const state = this.loadState();
    const completedAt = new Date().toISOString();
    state.currentPhase = phaseNum;
    state.status = 'in_progress';
    const handoff = this._buildHandoffPackage(phaseNum, output, state, options, completedAt);

    state.phases[phaseNum] = { ...output, completedAt, handoff };
    state.metadata = state.metadata || {};
    state.metadata.delivery_confidence = this._calculateDeliveryConfidence(state);

    this._stateCache = state;
    this._saveState();
    this._saveHandoffFile(handoff);
    this._saveConfidenceFile(state.metadata.delivery_confidence);
  }

  getContextForPhase(phaseNum: number): { workflowId: string; currentPhase: number; previousPhases: Record<number, PhaseOutput>; previousHandoffs: Record<string, HandoffPackage>; metadata: Record<string, any> } {
    const state = this.loadState();
    const previousPhases: Record<number, PhaseOutput> = {};
    for (let i = 1; i < phaseNum; i++) {
      if (state.phases[i]) previousPhases[i] = state.phases[i];
    }
    const previousHandoffs: Record<string, HandoffPackage> = {};
    for (const [phaseId, phaseData] of Object.entries(previousPhases)) {
      if (phaseData?.handoff) previousHandoffs[phaseId] = phaseData.handoff;
    }
    return { workflowId: this.workflowId, currentPhase: phaseNum, previousPhases, previousHandoffs, metadata: state.metadata };
  }

  getPreviousPhaseOutputs(): Record<number, PhaseOutput> { return this._stateCache?.phases || {}; }
  getPhaseOutput(phaseNum: number): PhaseOutput | null { return this.getPreviousPhaseOutputs()[phaseNum] || null; }

  markCompleted(): void {
    const state = this.loadState();
    state.status = 'completed';
    state.completedAt = new Date().toISOString();
    this._stateCache = state;
    this._saveState();
  }

  markFailed(error: string, failedPhase: number): void {
    const state = this.loadState();
    state.status = 'failed';
    state.error = error;
    state.failedPhase = failedPhase;
    state.failedAt = new Date().toISOString();
    this._stateCache = state;
    this._saveState();
  }

  updateMetadata(metadata: Record<string, any>): void {
    const state = this.loadState();
    state.metadata = { ...state.metadata, ...metadata };
    this._stateCache = state;
    this._saveState();
  }

  getLastCompletedPhase(): number {
    const phases = this.getPreviousPhaseOutputs();
    const phaseNums = Object.keys(phases).map(Number);
    return phaseNums.length > 0 ? Math.max(...phaseNums) : 0;
  }

  isPhaseCompleted(phaseNum: number): boolean {
    const output = this.getPhaseOutput(phaseNum);
    return output !== null && output.completedAt !== undefined;
  }

  getDeliveryConfidence(): DeliveryConfidence | null {
    return this._stateCache?.metadata?.delivery_confidence || null;
  }

  getSummary(): { workflowId: string; status: string; startedAt: string; completedAt?: string; currentPhase: number; completedPhases: number[]; totalPhases: number; deliveryConfidence: DeliveryConfidence | null } {
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
      deliveryConfidence: state.metadata?.delivery_confidence || null,
    };
  }

  reset(keepMetadata = true): void {
    const savedMetadata = keepMetadata ? (this._stateCache?.metadata ?? {}) : {};
    this._stateCache = this._createInitialState();
    this._stateCache.metadata = { ...this._stateCache.metadata, ...savedMetadata };
    this._saveState();
  }

  exportState(): WorkflowContextState { return { ...this._stateCache! }; }

  importState(state: WorkflowContextState): void {
    this._stateCache = state;
    this._saveState();
  }

  // ============ Private Helpers ============

  private _buildHandoffPackage(phaseNum: number, output: PhaseOutput, state: WorkflowContextState, options: any, completedAt: string): HandoffPackage {
    const handoffTarget = options.handoffTarget || {};
    return {
      version: '1.0.0',
      workflow_id: this.workflowId,
      generated_at: completedAt,
      from: { phase: phaseNum, agent: output.agent || null, action: output.action || null, task: output.task || null },
      to: { phase: handoffTarget.phase || null, agent: handoffTarget.agent || null },
      context_snapshot: { workflow_status: state.status, current_phase: state.currentPhase, metadata: state.metadata || {} },
      decision_log: this._extractDecisionLog(output),
      evidence_links: this._extractEvidenceLinks(output),
      open_risks: this._extractOpenRisks(output),
    };
  }

  private _saveHandoffFile(handoff: HandoffPackage): void {
    const phase = handoff?.from?.phase || 'unknown';
    const filePath = join(this.handoffDir, `${this.workflowId}-phase-${phase}.handoff.json`);
    if (!existsSync(this.handoffDir)) mkdirSync(this.handoffDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(handoff, null, 2));
  }

  private _saveConfidenceFile(confidence: DeliveryConfidence | null): void {
    if (!confidence) return;
    const filePath = join(this.confidenceDir, `${this.workflowId}.delivery-confidence.json`);
    if (!existsSync(this.confidenceDir)) mkdirSync(this.confidenceDir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(confidence, null, 2));
  }

  private _extractDecisionLog(output: PhaseOutput): { entries: any[]; source_paths: string[]; count: number } {
    const result = output.result || {};
    const entries = Array.isArray(result.decisions) ? result.decisions : Array.isArray(result.decision_log) ? result.decision_log : [];
    const sourcePaths: string[] = [];
    if (result.decisionLogPath) sourcePaths.push(result.decisionLogPath);
    if (result.decision_log_path) sourcePaths.push(result.decision_log_path);
    return { entries, source_paths: sourcePaths, count: entries.length };
  }

  private _extractEvidenceLinks(output: PhaseOutput): string[] {
    const evidence: string[] = [];
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

  private _extractOpenRisks(output: PhaseOutput): any[] {
    const result = output.result || {};
    const risks: any[] = [];
    if (Array.isArray(result.open_risks)) risks.push(...result.open_risks);
    if (Array.isArray(result.risks)) risks.push(...result.risks);
    if (Array.isArray(result.risk_register)) risks.push(...result.risk_register);
    return risks;
  }

  private _calculateDeliveryConfidence(state: WorkflowContextState): DeliveryConfidence {
    const phases = Object.values(state.phases || {});
    const weights = { test_coverage: 0.25, ac_completion: 0.30, risk_score_inv: 0.20, debt_score_inv: 0.15, regression_clear: 0.10 };

    const testCoverage = this._calcTestCoverage(phases);
    const acCompletion = this._calcAcCompletion(phases);
    const riskInv = this._calcRiskInverse(phases);
    const debtInv = this._calcDebtInverse(phases);
    const regressionClear = this._calcRegressionClear(phases, testCoverage);

    const components = { test_coverage: testCoverage, ac_completion: acCompletion, risk_score_inv: riskInv, debt_score_inv: debtInv, regression_clear: regressionClear };
    const scoreBase = Object.entries(weights).reduce((acc, [key, w]) => acc + (components[key as keyof typeof components] || 0) * w, 0);
    const score = Number((scoreBase * 100).toFixed(2));
    const threshold = Number(process.env.AIOS_DELIVERY_CONFIDENCE_THRESHOLD) || 70;

    return {
      version: '1.0.0',
      calculated_at: new Date().toISOString(),
      score, threshold,
      gate_passed: score >= threshold,
      formula: { expression: 'confidence = (test_coverage*0.25 + ac_completion*0.30 + risk_score_inv*0.20 + debt_score_inv*0.15 + regression_clear*0.10) * 100', weights },
      components,
      phase_count: phases.length,
    };
  }

  private _calcTestCoverage(phases: PhaseOutput[]): number {
    let total = 0, passed = 0;
    for (const phase of phases) {
      if (!Array.isArray(phase?.validation?.checks)) continue;
      for (const check of phase.validation!.checks!) { total++; if (check?.passed) passed++; }
    }
    return total === 0 ? (phases.length > 0 ? 1 : 0) : passed / total;
  }

  private _calcAcCompletion(phases: PhaseOutput[]): number {
    let total = 0, done = 0, hasExplicit = false;
    for (const phase of phases) {
      const r = phase?.result || {};
      if (Number.isFinite(r.ac_total) && Number.isFinite(r.ac_completed)) {
        hasExplicit = true; total += Math.max(0, r.ac_total); done += Math.min(Math.max(0, r.ac_completed), Math.max(0, r.ac_total));
      } else if (Array.isArray(r.acceptance_criteria)) {
        hasExplicit = true; total += r.acceptance_criteria.length; done += r.acceptance_criteria.filter((i: any) => i?.done || i?.status === 'done').length;
      }
    }
    if (hasExplicit && total > 0) return done / total;
    if (phases.length === 0) return 0;
    return phases.filter(p => p?.result?.status !== 'failed').length / phases.length;
  }

  private _calcRiskInverse(phases: PhaseOutput[]): number {
    const totalRisks = phases.reduce((sum, phase) => {
      const handoffRisks = Array.isArray(phase?.handoff?.open_risks) ? phase.handoff!.open_risks.length : 0;
      const resultRisks = this._extractOpenRisks(phase).length;
      return sum + Math.max(handoffRisks, resultRisks);
    }, 0);
    return Math.max(0, 1 - totalRisks / 10);
  }

  private _calcDebtInverse(phases: PhaseOutput[]): number {
    const totalDebt = phases.reduce((sum, phase) => {
      const r = phase?.result || {};
      const explicit = Number.isFinite(r.technical_debt_count) ? r.technical_debt_count : Number.isFinite(r.debt_count) ? r.debt_count : 0;
      const listCount = [r.technical_debt, r.debt_items, r.todos, r.hacks].reduce((s, list) => s + (Array.isArray(list) ? list.length : 0), 0);
      return sum + explicit + listCount;
    }, 0);
    return Math.max(0, 1 - totalDebt / 10);
  }

  private _calcRegressionClear(phases: PhaseOutput[], fallbackTestCoverage: number): number {
    let total = 0, passed = 0;
    for (const phase of phases) {
      if (!Array.isArray(phase?.validation?.checks)) continue;
      for (const check of phase.validation!.checks!) {
        const isRegression = [String(check?.type || ''), String(check?.path || ''), String(check?.checklist || '')].some(s => s.toLowerCase().includes('regression'));
        if (!isRegression) continue;
        total++; if (check?.passed) passed++;
      }
    }
    return total === 0 ? fallbackTestCoverage : passed / total;
  }
}
