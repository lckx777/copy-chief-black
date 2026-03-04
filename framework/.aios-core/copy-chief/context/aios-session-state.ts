/**
 * Session State Persistence Module
 * Port of: aios-core/.aios-core/core/orchestration/session-state.js
 *
 * Provides session state persistence to disk for:
 * - Resume work days later without losing context
 * - Crash recovery with state restoration
 * - Progress tracking across offer/deliverable development
 *
 * Adapted for Copy Chief: epic→offer, story→deliverable, phase→HELIX phase
 *
 * @module aios/session-state
 * @version 1.2.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

let yaml: any;
try { yaml = require('yaml'); } catch { yaml = require('js-yaml'); }

const SESSION_STATE_VERSION = '1.2';
const SESSION_STATE_FILENAME = '.session-state.yaml';
const CRASH_THRESHOLD_MINUTES = 30;

export const ActionType = {
  GO: 'GO',
  PAUSE: 'PAUSE',
  REVIEW: 'REVIEW',
  ABORT: 'ABORT',
  PHASE_CHANGE: 'PHASE_CHANGE',
  OFFER_STARTED: 'OFFER_STARTED',
  DELIVERABLE_STARTED: 'DELIVERABLE_STARTED',
  DELIVERABLE_COMPLETED: 'DELIVERABLE_COMPLETED',
  CHECKPOINT_REACHED: 'CHECKPOINT_REACHED',
  ERROR_OCCURRED: 'ERROR_OCCURRED',
} as const;

export const HelixPhase = {
  RESEARCH: 'research',
  BRIEFING: 'briefing',
  PRODUCTION: 'production',
  REVIEW: 'review',
  DELIVERY: 'delivery',
} as const;

export const ResumeOption = {
  CONTINUE: 'continue',
  REVIEW: 'review',
  RESTART: 'restart',
  DISCARD: 'discard',
} as const;

// ============ Types ============

export interface OfferContext {
  id: string;
  title: string;
  total_deliverables: number;
}

export interface SessionProgress {
  current_deliverable: string | null;
  deliverables_done: string[];
  deliverables_pending: string[];
}

export interface WorkflowContext {
  current_phase: string | null;
  attempt_count: number;
  phase_results: Record<string, any>;
  started_at: string;
}

export interface LastAction {
  type: string;
  timestamp: string;
  deliverable: string | null;
  phase: string | null;
}

export interface ContextSnapshot {
  files_modified: number;
  persona_distribution: Record<string, number>;
  last_persona: string | null;
  branch: string;
}

export interface SessionStateData {
  session_state: {
    version: string;
    last_updated: string;
    offer: OfferContext;
    progress: SessionProgress;
    workflow: WorkflowContext;
    last_action: LastAction;
    context_snapshot: ContextSnapshot;
    resume_instructions: string;
    overrides: Record<string, any>;
  };
}

export interface CrashDetectionResult {
  isCrash: boolean;
  minutesSinceUpdate: number;
  lastActionType: string;
  lastPhase: string | null;
  lastDeliverable: string | null;
  reason: string;
}

// ============ Class ============

export class AiosSessionState {
  projectRoot: string;
  options: { debug: boolean; autoMigrate: boolean };
  stateFilePath: string;
  state: SessionStateData | null;

  constructor(projectRoot: string, options: { debug?: boolean; autoMigrate?: boolean } = {}) {
    this.projectRoot = projectRoot;
    this.options = { debug: false, autoMigrate: true, ...options };
    this.stateFilePath = join(projectRoot, '.aios', SESSION_STATE_FILENAME);
    this.state = null;
  }

  getStateFilePath(): string { return this.stateFilePath; }

  exists(): boolean {
    return existsSync(this.stateFilePath);
  }

  createSessionState(offerInfo: { id: string; title: string; totalDeliverables: number; deliverableIds: string[] }, branch = 'main'): SessionStateData {
    const now = new Date().toISOString();
    this.state = {
      session_state: {
        version: SESSION_STATE_VERSION,
        last_updated: now,
        offer: {
          id: offerInfo.id,
          title: offerInfo.title,
          total_deliverables: offerInfo.totalDeliverables,
        },
        progress: {
          current_deliverable: offerInfo.deliverableIds[0] || null,
          deliverables_done: [],
          deliverables_pending: [...offerInfo.deliverableIds],
        },
        workflow: {
          current_phase: null,
          attempt_count: 0,
          phase_results: {},
          started_at: now,
        },
        last_action: {
          type: ActionType.OFFER_STARTED,
          timestamp: now,
          deliverable: offerInfo.deliverableIds[0] || null,
          phase: null,
        },
        context_snapshot: {
          files_modified: 0,
          persona_distribution: {},
          last_persona: null,
          branch,
        },
        resume_instructions: this._generateResumeInstructions({
          offerTitle: offerInfo.title,
          currentDeliverable: offerInfo.deliverableIds[0],
          deliverablesDone: 0,
          totalDeliverables: offerInfo.totalDeliverables,
          lastPhase: null,
          lastPersona: null,
        }),
        overrides: {},
      },
    };
    this.save();
    if (this.options.debug) console.log(`[AiosSessionState] Created: ${this.stateFilePath}`);
    return this.state;
  }

  loadSessionState(): SessionStateData | null {
    if (this.exists()) {
      const content = readFileSync(this.stateFilePath, 'utf8');
      this.state = (yaml.parse || yaml.load)(content) as SessionStateData;
      if (this.options.debug) console.log(`[AiosSessionState] Loaded from: ${this.stateFilePath}`);
      return this.state;
    }
    return null;
  }

  updateSessionState(updates: Partial<{
    progress: Partial<SessionProgress>;
    workflow: Partial<WorkflowContext>;
    last_action: Partial<LastAction>;
    context_snapshot: Partial<ContextSnapshot>;
    overrides: Record<string, any>;
  }>): SessionStateData {
    if (!this.state) throw new Error('Session state not initialized.');
    const now = new Date().toISOString();
    const ss = this.state.session_state;
    ss.last_updated = now;

    if (updates.progress) ss.progress = { ...ss.progress, ...updates.progress };
    if (updates.workflow) ss.workflow = { ...ss.workflow, ...updates.workflow };
    if (updates.last_action) ss.last_action = { ...updates.last_action, timestamp: now } as LastAction;
    if (updates.context_snapshot) ss.context_snapshot = { ...ss.context_snapshot, ...updates.context_snapshot };
    if (updates.overrides) ss.overrides = { ...(ss.overrides || {}), ...updates.overrides };

    ss.resume_instructions = this._generateResumeInstructions({
      offerTitle: ss.offer.title,
      currentDeliverable: ss.progress.current_deliverable,
      deliverablesDone: ss.progress.deliverables_done.length,
      totalDeliverables: ss.offer.total_deliverables,
      lastPhase: ss.last_action.phase,
      lastPersona: ss.context_snapshot.last_persona,
    });

    this.save();
    return this.state;
  }

  recordPhaseChange(phase: string, deliverableId: string, persona: string): SessionStateData {
    const updates: any = {
      workflow: { current_phase: phase },
      last_action: { type: ActionType.PHASE_CHANGE, deliverable: deliverableId, phase },
      context_snapshot: { last_persona: persona },
    };
    if (this.state && persona) {
      const dist = this.state.session_state.context_snapshot.persona_distribution || {};
      dist[persona] = (dist[persona] || 0) + 1;
      updates.context_snapshot.persona_distribution = dist;
    }
    return this.updateSessionState(updates);
  }

  recordDeliverableCompleted(deliverableId: string, nextDeliverableId: string | null = null): SessionStateData {
    const done = [...this.state!.session_state.progress.deliverables_done, deliverableId];
    const pending = this.state!.session_state.progress.deliverables_pending.filter(id => id !== deliverableId);
    return this.updateSessionState({
      progress: {
        current_deliverable: nextDeliverableId || pending[0] || null,
        deliverables_done: done,
        deliverables_pending: pending,
      },
      workflow: { current_phase: null, attempt_count: 0, phase_results: {} },
      last_action: { type: ActionType.DELIVERABLE_COMPLETED, deliverable: deliverableId, phase: null },
    });
  }

  recordPause(deliverableId: string, phase: string): SessionStateData {
    return this.updateSessionState({
      last_action: { type: ActionType.PAUSE, deliverable: deliverableId, phase },
    });
  }

  // ============ Crash Detection ============

  detectCrash(): CrashDetectionResult {
    if (!this.state) this.loadSessionState();
    if (!this.state) return { isCrash: false, minutesSinceUpdate: 0, lastActionType: '', lastPhase: null, lastDeliverable: null, reason: 'No session state found' };

    const lastUpdated = new Date(this.state.session_state.last_updated);
    const lastActionType = this.state.session_state.last_action.type;
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    const normalEndStates = [ActionType.PAUSE, ActionType.DELIVERABLE_COMPLETED, ActionType.ABORT];
    const isCrash = minutesSinceUpdate > CRASH_THRESHOLD_MINUTES && !normalEndStates.includes(lastActionType as any);

    return {
      isCrash,
      minutesSinceUpdate: Math.round(minutesSinceUpdate),
      lastActionType,
      lastPhase: this.state.session_state.last_action.phase,
      lastDeliverable: this.state.session_state.last_action.deliverable,
      reason: isCrash
        ? `Session appears to have crashed ${Math.round(minutesSinceUpdate)} minutes ago during ${lastActionType}`
        : 'Session ended normally',
    };
  }

  // ============ Resume ============

  getResumeOptions(): Record<string, { label: string; description: string }> {
    const current = this.state?.session_state.progress.current_deliverable || '?';
    return {
      [ResumeOption.CONTINUE]: { label: 'Continuar de onde parou', description: 'Resume from last saved state' },
      [ResumeOption.REVIEW]: { label: 'Revisar o que foi feito', description: 'Show progress summary before continuing' },
      [ResumeOption.RESTART]: { label: `Recomecar ${current} do zero`, description: 'Restart current deliverable' },
      [ResumeOption.DISCARD]: { label: 'Iniciar nova oferta (descarta sessao)', description: 'Discard session' },
    };
  }

  getResumeSummary(): string {
    if (!this.state) return 'No session state loaded.';
    const { offer, progress, last_action } = this.state.session_state;
    return `Session anterior detectada!\n\nOferta: ${offer.title}\nProgresso: ${progress.deliverables_done.length} de ${offer.total_deliverables} deliverables\nUltimo: ${progress.current_deliverable}\nFase: ${last_action.phase || 'N/A'}`;
  }

  handleResumeOption(option: string): { action: string; deliverable?: string | null; phase?: string | null; summary?: any; message?: string } {
    switch (option) {
      case ResumeOption.CONTINUE:
        return { action: 'continue', deliverable: this.state!.session_state.progress.current_deliverable, phase: this.state!.session_state.workflow.current_phase };
      case ResumeOption.REVIEW:
        return { action: 'review', summary: this.getProgressSummary() };
      case ResumeOption.RESTART:
        this.updateSessionState({
          workflow: { current_phase: null, attempt_count: 0, phase_results: {}, started_at: new Date().toISOString() },
          last_action: { type: ActionType.DELIVERABLE_STARTED, deliverable: this.state!.session_state.progress.current_deliverable, phase: null },
        });
        return { action: 'restart', deliverable: this.state!.session_state.progress.current_deliverable };
      case ResumeOption.DISCARD:
        this.discard();
        return { action: 'discard', message: 'Session discarded. Ready for new offer.' };
      default:
        throw new Error(`Unknown resume option: ${option}`);
    }
  }

  getProgressSummary(): any {
    if (!this.state) return null;
    const { offer, progress, workflow, context_snapshot } = this.state.session_state;
    return {
      offer: { id: offer.id, title: offer.title, totalDeliverables: offer.total_deliverables },
      progress: {
        completed: progress.deliverables_done.length,
        total: offer.total_deliverables,
        percentage: Math.round((progress.deliverables_done.length / offer.total_deliverables) * 100),
        deliverablesDone: progress.deliverables_done,
        deliverablesPending: progress.deliverables_pending,
        currentDeliverable: progress.current_deliverable,
      },
      workflow: { currentPhase: workflow.current_phase, attemptCount: workflow.attempt_count, phaseResults: workflow.phase_results },
      context: { filesModified: context_snapshot.files_modified, personaDistribution: context_snapshot.persona_distribution, branch: context_snapshot.branch },
    };
  }

  // ============ Persistence ============

  save(): void {
    if (!this.state) throw new Error('No state to save');
    const dir = dirname(this.stateFilePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const content = (yaml.stringify || yaml.dump)(this.state, { lineWidth: 120, noRefs: true });
    writeFileSync(this.stateFilePath, content, 'utf8');
  }

  discard(): void {
    if (this.exists()) {
      const archivePath = `${this.stateFilePath}.discarded.${Date.now()}`;
      renameSync(this.stateFilePath, archivePath);
      if (this.options.debug) console.log(`[AiosSessionState] Archived to: ${archivePath}`);
    }
    this.state = null;
  }

  // ============ Helpers ============

  private _generateResumeInstructions(context: { offerTitle: string; currentDeliverable: string | null; deliverablesDone: number; totalDeliverables: number; lastPhase: string | null; lastPersona: string | null }): string {
    let instructions = '';
    if (context.currentDeliverable) instructions += `Deliverable ${context.currentDeliverable} em fase de ${context.lastPhase || 'inicio'}.\n`;
    if (context.lastPersona) instructions += `${context.lastPersona} estava trabalhando.\n`;
    instructions += `Progresso: ${context.deliverablesDone} de ${context.totalDeliverables} deliverables completos.\n`;
    instructions += 'Proximo passo: continuar producao ou revisar o que foi feito.';
    return instructions;
  }

  static validateSchema(state: SessionStateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!state?.session_state) { errors.push('Missing session_state root'); return { isValid: false, errors }; }
    const ss = state.session_state;
    if (!ss.version) errors.push('Missing version');
    if (!ss.offer?.id || !ss.offer?.title || ss.offer?.total_deliverables === undefined) errors.push('Invalid offer field');
    if (!ss.progress || !Array.isArray(ss.progress.deliverables_done) || !Array.isArray(ss.progress.deliverables_pending)) errors.push('Invalid progress field');
    if (!ss.last_action?.type || !ss.last_action?.timestamp) errors.push('Invalid last_action field');
    return { isValid: errors.length === 0, errors };
  }
}

export { SESSION_STATE_VERSION, SESSION_STATE_FILENAME, CRASH_THRESHOLD_MINUTES };
