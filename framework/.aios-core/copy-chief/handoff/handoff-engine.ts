// ~/.claude/hooks/lib/handoff-engine.ts
// Intra-phase handoff automation engine for copywriting ecosystem
// Determines and triggers the NEXT sub-task when a sub-task completes
// v1.0 - 2026-02-24

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
type DeliverableType = 'VSL' | 'LANDING_PAGE' | 'CREATIVES' | 'EMAILS';

interface SubTask {
  id: string;
  type: string;
  [key: string]: any;
}

interface TaskState {
  id: string;
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, any>;
  skip_reason?: string;
}

interface HandoffState {
  deliverable: string;
  type: DeliverableType;
  started_at: string;
  current_task_index: number;
  status: 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'FAILED';
  tasks: TaskState[];
}

interface HandoffResult {
  next_task: SubTask | null;
  is_human_gate: boolean;
  is_complete: boolean;
  message: string;
}

interface SequenceDefinition {
  sequence: SubTask[];
  human_gates: string[];
}

// ---------------------------------------------------------------------------
// Sequences — sub-task pipelines per deliverable type
// ---------------------------------------------------------------------------

const SEQUENCES: Record<DeliverableType, SequenceDefinition> = {
  VSL: {
    sequence: [
      { id: 'chapter_1', type: 'write_chapter', chapter: 1 },
      { id: 'review_1', type: 'blind_critic', target: 'chapter_1' },
      { id: 'chapter_2', type: 'write_chapter', chapter: 2 },
      { id: 'review_2', type: 'blind_critic', target: 'chapter_2' },
      { id: 'chapter_3', type: 'write_chapter', chapter: 3 },
      { id: 'review_3', type: 'blind_critic', target: 'chapter_3' },
      { id: 'chapter_4', type: 'write_chapter', chapter: 4 },
      { id: 'review_4', type: 'blind_critic', target: 'chapter_4' },
      { id: 'chapter_5', type: 'write_chapter', chapter: 5 },
      { id: 'review_5', type: 'blind_critic', target: 'chapter_5' },
      { id: 'chapter_6', type: 'write_chapter', chapter: 6 },
      { id: 'review_6', type: 'blind_critic', target: 'chapter_6' },
      { id: 'stress_test', type: 'emotional_stress_test', target: 'full_vsl' },
      { id: 'layered', type: 'layered_review', target: 'full_vsl' },
      { id: 'final', type: 'black_validation', target: 'full_vsl' },
    ],
    human_gates: ['final'],
  },
  LANDING_PAGE: {
    sequence: [
      { id: 'hero', type: 'write_block', block: 'hero' },
      { id: 'problem', type: 'write_block', block: 'problem' },
      { id: 'mechanism', type: 'write_block', block: 'mechanism' },
      { id: 'solution', type: 'write_block', block: 'solution' },
      { id: 'proof', type: 'write_block', block: 'proof' },
      { id: 'offer', type: 'write_block', block: 'offer' },
      { id: 'cta', type: 'write_block', block: 'cta' },
      { id: 'review_lp', type: 'blind_critic', target: 'full_lp' },
      { id: 'stress_test', type: 'emotional_stress_test', target: 'full_lp' },
      { id: 'layered', type: 'layered_review', target: 'full_lp' },
      { id: 'final', type: 'black_validation', target: 'full_lp' },
    ],
    human_gates: ['final'],
  },
  CREATIVES: {
    sequence: [
      { id: 'creative_1', type: 'write_creative', variant: 1 },
      { id: 'review_c1', type: 'blind_critic', target: 'creative_1' },
      { id: 'creative_2', type: 'write_creative', variant: 2 },
      { id: 'review_c2', type: 'blind_critic', target: 'creative_2' },
      { id: 'creative_3', type: 'write_creative', variant: 3 },
      { id: 'review_c3', type: 'blind_critic', target: 'creative_3' },
      { id: 'stress_test', type: 'emotional_stress_test', target: 'all_creatives' },
      { id: 'final', type: 'black_validation', target: 'all_creatives' },
    ],
    human_gates: ['final'],
  },
  EMAILS: {
    sequence: [
      { id: 'email_1', type: 'write_email', email: 1 },
      { id: 'email_2', type: 'write_email', email: 2 },
      { id: 'email_3', type: 'write_email', email: 3 },
      { id: 'review_emails', type: 'blind_critic', target: 'email_sequence' },
      { id: 'stress_test', type: 'emotional_stress_test', target: 'email_sequence' },
      { id: 'final', type: 'black_validation', target: 'email_sequence' },
    ],
    human_gates: ['final'],
  },
};

// ---------------------------------------------------------------------------
// State serialization (JSON stored with .yaml extension for ecosystem consistency)
// No npm deps — only Bun/Node builtins.
// ---------------------------------------------------------------------------

function stateToString(state: HandoffState): string {
  return JSON.stringify(state, null, 2);
}

function stateFromString(content: string): HandoffState {
  try {
    return JSON.parse(content) as HandoffState;
  } catch {
    throw new Error(
      '[HANDOFF-ENGINE] State file corrupted. Expected JSON format. ' +
      'Re-init the handoff to recover.'
    );
  }
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function getHandoffDir(offerPath: string): string {
  return join(offerPath, 'handoff-state');
}

function getHandoffFilePath(offerPath: string, deliverable: string): string {
  return join(getHandoffDir(offerPath), `${deliverable}.yaml`);
}

// ---------------------------------------------------------------------------
// State I/O
// ---------------------------------------------------------------------------

function loadHandoffState(offerPath: string, deliverable: string): HandoffState | null {
  const filePath = getHandoffFilePath(offerPath, deliverable);
  if (!existsSync(filePath)) return null;
  try {
    const content = readFileSync(filePath, 'utf-8');
    return stateFromString(content);
  } catch (err) {
    console.error(`[HANDOFF-ENGINE] Failed to load ${filePath}: ${err}`);
    return null;
  }
}

function saveHandoffState(offerPath: string, deliverable: string, state: HandoffState): void {
  const dir = getHandoffDir(offerPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const filePath = getHandoffFilePath(offerPath, deliverable);
  writeFileSync(filePath, stateToString(state), 'utf-8');
}

// ---------------------------------------------------------------------------
// Sequence lookup
// ---------------------------------------------------------------------------

function getSequence(type: DeliverableType): SequenceDefinition {
  const seq = SEQUENCES[type];
  if (!seq) {
    throw new Error(`[HANDOFF-ENGINE] Unknown deliverable type: ${type}`);
  }
  return seq;
}

// ---------------------------------------------------------------------------
// Core: resolve the next actionable task from current state
// ---------------------------------------------------------------------------

function resolveNextTask(state: HandoffState, seqDef: SequenceDefinition): HandoffResult {
  const { sequence, human_gates } = seqDef;
  const tasks = state.tasks;

  // Find first non-terminal task (not COMPLETED, SKIPPED, or FAILED-and-moved-past)
  for (let i = 0; i < tasks.length; i++) {
    const ts = tasks[i];

    if (ts.status === 'COMPLETED' || ts.status === 'SKIPPED') continue;

    if (ts.status === 'FAILED') {
      // A failed task blocks the pipeline — caller must skipTask or retry
      return {
        next_task: sequence[i],
        is_human_gate: false,
        is_complete: false,
        message: `Task "${ts.id}" FAILED. Skip it or re-init to retry.`,
      };
    }

    // This is the next task (PENDING, IN_PROGRESS, or BLOCKED)
    const subTask = sequence[i];
    const isHumanGate = human_gates.includes(ts.id);

    if (isHumanGate && ts.status === 'PENDING') {
      return {
        next_task: subTask,
        is_human_gate: true,
        is_complete: false,
        message: `HUMAN GATE: "${ts.id}" requires human approval before proceeding.`,
      };
    }

    return {
      next_task: subTask,
      is_human_gate: isHumanGate,
      is_complete: false,
      message: `Next task: "${ts.id}" (${subTask.type})`,
    };
  }

  // All tasks done
  return {
    next_task: null,
    is_human_gate: false,
    is_complete: true,
    message: `All ${state.type} tasks completed for "${state.deliverable}".`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize a new handoff pipeline for a deliverable.
 * Creates the state file and returns the initial state.
 */
function initHandoff(offerPath: string, deliverable: string, type: DeliverableType): HandoffState {
  const seqDef = getSequence(type);
  const now = new Date().toISOString();

  const tasks: TaskState[] = seqDef.sequence.map((sub) => ({
    id: sub.id,
    status: 'PENDING' as TaskStatus,
  }));

  // Mark the first task as IN_PROGRESS
  if (tasks.length > 0) {
    tasks[0].status = 'IN_PROGRESS';
    tasks[0].started_at = now;
  }

  const state: HandoffState = {
    deliverable,
    type,
    started_at: now,
    current_task_index: 0,
    status: 'IN_PROGRESS',
    tasks,
  };

  saveHandoffState(offerPath, deliverable, state);
  return state;
}

/**
 * Mark a task as completed and advance to the next sub-task.
 * Returns a HandoffResult describing what comes next.
 */
function completeTask(
  offerPath: string,
  deliverable: string,
  taskId: string,
  result?: Record<string, any>,
): HandoffResult {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}". Call initHandoff first.` };
  }

  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found in "${deliverable}" sequence.` };
  }

  const now = new Date().toISOString();
  state.tasks[idx].status = 'COMPLETED';
  state.tasks[idx].completed_at = now;
  if (result) state.tasks[idx].result = result;

  // Advance: mark the next pending task as IN_PROGRESS
  const nextIdx = findNextPendingIndex(state.tasks, idx + 1);
  if (nextIdx !== -1) {
    state.tasks[nextIdx].status = 'IN_PROGRESS';
    state.tasks[nextIdx].started_at = now;
    state.current_task_index = nextIdx;
  } else {
    // All done
    state.status = 'COMPLETED';
    state.current_task_index = state.tasks.length;
  }

  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}

/**
 * Mark a task as failed. The pipeline blocks until the task is skipped or re-inited.
 */
function failTask(
  offerPath: string,
  deliverable: string,
  taskId: string,
  reason: string,
): HandoffResult {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}".` };
  }

  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found.` };
  }

  state.tasks[idx].status = 'FAILED';
  state.tasks[idx].completed_at = new Date().toISOString();
  state.tasks[idx].result = { failure_reason: reason };
  state.status = 'FAILED';

  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}

/**
 * Skip a task (e.g., after failure or if not applicable). Advances the pipeline.
 */
function skipTask(
  offerPath: string,
  deliverable: string,
  taskId: string,
  reason: string,
): HandoffResult {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}".` };
  }

  const seqDef = getSequence(state.type);
  const idx = state.tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `Task "${taskId}" not found.` };
  }

  const now = new Date().toISOString();
  state.tasks[idx].status = 'SKIPPED';
  state.tasks[idx].completed_at = now;
  state.tasks[idx].skip_reason = reason;

  // Advance to next pending
  const nextIdx = findNextPendingIndex(state.tasks, idx + 1);
  if (nextIdx !== -1) {
    state.tasks[nextIdx].status = 'IN_PROGRESS';
    state.tasks[nextIdx].started_at = now;
    state.current_task_index = nextIdx;
    state.status = 'IN_PROGRESS';
  } else {
    state.status = 'COMPLETED';
    state.current_task_index = state.tasks.length;
  }

  saveHandoffState(offerPath, deliverable, state);
  return resolveNextTask(state, seqDef);
}

/**
 * Get the next task without modifying state.
 */
function getNextTask(offerPath: string, deliverable: string): HandoffResult {
  const state = loadHandoffState(offerPath, deliverable);
  if (!state) {
    return { next_task: null, is_human_gate: false, is_complete: false, message: `No handoff state found for "${deliverable}". Call initHandoff first.` };
  }
  const seqDef = getSequence(state.type);
  return resolveNextTask(state, seqDef);
}

/**
 * Get full handoff status for a deliverable.
 */
function getHandoffStatus(offerPath: string, deliverable: string): HandoffState | null {
  return loadHandoffState(offerPath, deliverable);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function findNextPendingIndex(tasks: TaskState[], startFrom: number): number {
  for (let i = startFrom; i < tasks.length; i++) {
    if (tasks[i].status === 'PENDING') return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Event System (v2.0 — Plan 2 Integration)
// ---------------------------------------------------------------------------

type HandoffEventType = 'task_completed' | 'task_failed' | 'task_skipped' | 'pipeline_completed' | 'human_gate';

interface HandoffEvent {
  type: HandoffEventType;
  deliverable: string;
  task_id: string;
  offer_path?: string;
  result?: Record<string, any>;
  timestamp: string;
}

type HandoffEventListener = (event: HandoffEvent) => void;

const eventListeners: Map<HandoffEventType, HandoffEventListener[]> = new Map();

/**
 * Register a listener for handoff events.
 */
function onHandoffEvent(type: HandoffEventType, listener: HandoffEventListener): void {
  if (!eventListeners.has(type)) {
    eventListeners.set(type, []);
  }
  eventListeners.get(type)!.push(listener);
}

/**
 * Emit a handoff event to all registered listeners.
 */
function emitHandoffEvent(event: HandoffEvent): void {
  const listeners = eventListeners.get(event.type) || [];
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (err) {
      console.error(`[HANDOFF-ENGINE] Event listener error: ${err}`);
    }
  }

  // Also write to event log for pipeline-executor to consume
  try {
    const logDir = join(process.env.HOME || '', '.claude/logs');
    const { mkdirSync: mk, appendFileSync: append, existsSync: ex } = require('fs');
    if (!ex(logDir)) mk(logDir, { recursive: true });
    const logPath = join(logDir, 'handoff-events.jsonl');
    append(logPath, JSON.stringify(event) + '\n');
  } catch {}
}

/**
 * Enhanced completeTask that emits events.
 */
function completeTaskWithEvent(
  offerPath: string,
  deliverable: string,
  taskId: string,
  result?: Record<string, any>,
): HandoffResult {
  const handoffResult = completeTask(offerPath, deliverable, taskId, result);

  emitHandoffEvent({
    type: handoffResult.is_complete ? 'pipeline_completed' : 'task_completed',
    deliverable,
    task_id: taskId,
    offer_path: offerPath,
    result,
    timestamp: new Date().toISOString(),
  });

  if (handoffResult.is_human_gate) {
    emitHandoffEvent({
      type: 'human_gate',
      deliverable,
      task_id: handoffResult.next_task?.id || taskId,
      offer_path: offerPath,
      timestamp: new Date().toISOString(),
    });
  }

  return handoffResult;
}

/**
 * Enhanced failTask that emits events.
 */
function failTaskWithEvent(
  offerPath: string,
  deliverable: string,
  taskId: string,
  reason: string,
): HandoffResult {
  const handoffResult = failTask(offerPath, deliverable, taskId, reason);

  emitHandoffEvent({
    type: 'task_failed',
    deliverable,
    task_id: taskId,
    offer_path: offerPath,
    result: { failure_reason: reason },
    timestamp: new Date().toISOString(),
  });

  return handoffResult;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  initHandoff,
  completeTask,
  completeTaskWithEvent,
  failTask,
  failTaskWithEvent,
  skipTask,
  getNextTask,
  getHandoffStatus,
  loadHandoffState,
  saveHandoffState,
  getSequence,
  onHandoffEvent,
  emitHandoffEvent,
};

export type {
  HandoffState,
  HandoffResult,
  DeliverableType,
  TaskStatus,
  SubTask,
  TaskState,
  SequenceDefinition,
  HandoffEvent,
  HandoffEventType,
};
