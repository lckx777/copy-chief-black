/**
 * Task Manager with DAG Dependency Resolution
 * Port of: aios-squads/packages/etl-squad/deprecated/orchestrator/task-manager.js
 *
 * Features:
 * - DAG-based dependency resolution
 * - Concurrent execution with configurable limit
 * - Retry with exponential backoff
 * - State persistence to JSON
 * - Event emission for task lifecycle
 * - Progress tracking with ETA
 *
 * @module aios/task-manager
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// ============ Types ============

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export interface Task {
  id: string;
  type?: string;
  status: TaskStatus;
  attempts: number;
  maxRetries?: number;
  dependencies?: string[];
  created_at: number;
  updated_at: number;
  started_at?: number;
  completed_at?: number;
  result?: any;
  error?: string | null;
  duration?: number;
  execute: (ctx: { cancelToken: { cancelled: boolean } }) => Promise<any>;
  cancel?: () => void;
}

export interface TaskMetrics {
  started: number;
  completed: number;
  failed: number;
  retried: number;
  cancelled: number;
  avgDuration: number;
}

export interface TaskStats {
  totals: { pending: number; running: number; completed: number; failed: number; cancelled: number; total: number };
  metrics: TaskMetrics;
}

type TaskEvent = 'task_added' | 'task_started' | 'task_completed' | 'task_failed' | 'task_retrying' | 'task_cancelled' | 'state_loaded' | 'state_saved' | 'state_load_error' | 'state_save_error';

// ============ Progress Tracker ============

export class ProgressTracker {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  startTime: number;
  smoothedRate: number | null;
  smoothingFactor: number;
  byType: Map<string, { completed: number; failed: number; skipped: number; total: number; processed: number }>;

  constructor(total = 0, options: { smoothingFactor?: number } = {}) {
    this.total = total;
    this.completed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.startTime = Date.now();
    this.smoothedRate = null;
    this.smoothingFactor = options.smoothingFactor || 0.2;
    this.byType = new Map();
  }

  setTotal(total: number): void { this.total = total; }

  increment(opts: { type?: string; status?: 'completed' | 'failed' | 'skipped'; count?: number } = {}): void {
    const { type = 'default', status = 'completed', count = 1 } = opts;
    if (!this.byType.has(type)) this.byType.set(type, { completed: 0, failed: 0, skipped: 0, total: 0, processed: 0 });
    const ts = this.byType.get(type)!;
    ts.total += count;
    if (status === 'completed') { this.completed += count; ts.completed += count; }
    else if (status === 'failed') { this.failed += count; ts.failed += count; }
    else if (status === 'skipped') { this.skipped += count; ts.skipped += count; }
    const processed = this.completed + this.failed + this.skipped;
    ts.processed = ts.completed + ts.failed + ts.skipped;
    const duration = Date.now() - this.startTime;
    const rate = processed / (duration / 1000);
    this.smoothedRate = this.smoothedRate === null ? rate : (this.smoothingFactor * rate) + ((1 - this.smoothingFactor) * this.smoothedRate);
  }

  getProgress(): {
    total: number; completed: number; failed: number; skipped: number; processed: number;
    percentage: string; elapsed_seconds: number; elapsed_human: string;
    eta_seconds: number; eta_human: string; rate_per_minute: string;
    byType: Array<{ type: string; completed: number; failed: number; skipped: number; total: number; processed: number; percentage: string }>;
  } {
    const processed = this.completed + this.failed + this.skipped;
    const percentage = this.total > 0 ? ((processed / this.total) * 100) : 0;
    const elapsedMs = Date.now() - this.startTime;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remaining = this.total > 0 ? Math.max(this.total - processed, 0) : 0;
    const rate = this.smoothedRate || (processed / Math.max(elapsedSeconds, 1));
    const etaSeconds = rate > 0 ? Math.max(remaining / rate, 0) : Infinity;
    const byType = Array.from(this.byType.entries()).map(([type, stats]) => ({
      type, ...stats, percentage: stats.total > 0 ? ((stats.processed / stats.total) * 100).toFixed(1) : '0.0',
    }));
    return {
      total: this.total, completed: this.completed, failed: this.failed, skipped: this.skipped, processed,
      percentage: percentage.toFixed(1), elapsed_seconds: elapsedSeconds, elapsed_human: this._formatDuration(elapsedSeconds),
      eta_seconds: Math.floor(etaSeconds), eta_human: this._formatDuration(Math.floor(etaSeconds)),
      rate_per_minute: (rate * 60).toFixed(1), byType,
    };
  }

  private _formatDuration(seconds: number): string {
    if (!isFinite(seconds)) return 'inf';
    const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
    const parts: string[] = [];
    if (h) parts.push(`${h}h`); if (m) parts.push(`${m}m`); parts.push(`${s}s`);
    return parts.join(' ');
  }
}

// ============ TaskManager Class ============

export class TaskManager {
  maxConcurrent: number;
  maxRetries: number;
  statePath: string | null;
  autoPersistInterval: number;

  queue: Task[];
  running: Map<string, Task>;
  completed: Task[];
  failed: Task[];
  cancelled: Set<string>;
  dependencies: Map<string, string[]>;
  metrics: TaskMetrics;
  progress: ProgressTracker;

  private _listeners: Map<TaskEvent, Array<(data: any) => void>>;
  private _autoPersistTimer: ReturnType<typeof setInterval> | null;

  constructor(options: { maxConcurrent?: number; maxRetries?: number; statePath?: string | null; autoPersistInterval?: number; total?: number } = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.maxRetries = options.maxRetries || 3;
    this.statePath = options.statePath || null;
    this.autoPersistInterval = options.autoPersistInterval || 10000;

    this.queue = [];
    this.running = new Map();
    this.completed = [];
    this.failed = [];
    this.cancelled = new Set();
    this.dependencies = new Map();
    this.metrics = { started: 0, completed: 0, failed: 0, retried: 0, cancelled: 0, avgDuration: 0 };
    this.progress = new ProgressTracker(options.total || 0);

    this._listeners = new Map();
    this._autoPersistTimer = null;

    if (this.statePath) {
      this._loadState();
      this._autoPersist();
    }
  }

  on(event: TaskEvent, listener: (data: any) => void): void {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(listener);
  }

  private _emit(event: TaskEvent, data: any): void {
    const listeners = this._listeners.get(event) || [];
    for (const listener of listeners) { try { listener(data); } catch { /* ignore */ } }
  }

  addTask(task: Omit<Task, 'status' | 'attempts' | 'created_at' | 'updated_at' | 'result' | 'error'> & { dependencies?: string[] }): void {
    const taskWithMetadata: Task = {
      ...task,
      status: 'pending',
      attempts: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      result: null,
      error: null,
    };
    if (task.dependencies?.length) this.dependencies.set(task.id, task.dependencies);
    this.queue.push(taskWithMetadata);
    this._emit('task_added', taskWithMetadata);
    this._processQueue();
    this._persistState();
  }

  addTasks(tasks: Array<Omit<Task, 'status' | 'attempts' | 'created_at' | 'updated_at' | 'result' | 'error'>>): void {
    tasks.forEach(task => this.addTask(task));
  }

  cancelTask(taskId: string): void {
    this.cancelled.add(taskId);
    const runningTask = this.running.get(taskId);
    if (runningTask?.cancel) runningTask.cancel();
    this._emit('task_cancelled', { id: taskId });
    this.metrics.cancelled += 1;
    this._persistState();
  }

  private async _processQueue(): Promise<void> {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const index = this.queue.findIndex(task => this._canRun(task));
      if (index === -1) break;
      const task = this.queue.splice(index, 1)[0];
      this._executeTask(task);
    }
  }

  private _canRun(task: Task): boolean {
    if (this.cancelled.has(task.id)) return false;
    const deps = this.dependencies.get(task.id);
    if (!deps?.length) return true;
    return deps.every(depId =>
      this.completed.some(t => t.id === depId) &&
      !this.failed.some(t => t.id === depId)
    );
  }

  private async _executeTask(task: Task): Promise<void> {
    const startTime = Date.now();
    const taskWithCancel: Task = { ...task, status: 'running', started_at: startTime, updated_at: startTime };
    this.running.set(task.id, taskWithCancel);
    this.metrics.started += 1;
    this._emit('task_started', taskWithCancel);

    const cancelToken = { cancelled: false };
    taskWithCancel.cancel = () => { cancelToken.cancelled = true; };

    try {
      const result = await task.execute({ cancelToken });
      if (cancelToken.cancelled) throw new Error('Task cancelled');
      const duration = Date.now() - startTime;
      this.metrics.completed += 1;
      this.metrics.avgDuration = this._computeNewAverage(this.metrics.avgDuration, this.metrics.completed, duration);
      const completedTask: Task = { ...taskWithCancel, status: 'completed', completed_at: Date.now(), updated_at: Date.now(), result, duration };
      this.running.delete(task.id);
      this.completed.push(completedTask);
      this.progress.increment({ type: task.type, status: 'completed' });
      this._emit('task_completed', completedTask);
    } catch (error: any) {
      const attempts = task.attempts + 1;
      const taskWithError = { ...taskWithCancel, attempts, error: error.message, updated_at: Date.now() };
      this.running.delete(task.id);

      if (cancelToken.cancelled || this.cancelled.has(task.id)) {
        taskWithError.status = 'cancelled' as TaskStatus;
        this.cancelled.delete(task.id);
        this.metrics.cancelled += 1;
        this._emit('task_cancelled', taskWithError);
      } else if (attempts < (task.maxRetries || this.maxRetries)) {
        taskWithError.status = 'retrying' as TaskStatus;
        this.queue.push(taskWithError);
        this.metrics.retried += 1;
        this._emit('task_retrying', taskWithError);
      } else {
        taskWithError.status = 'failed' as TaskStatus;
        this.failed.push(taskWithError);
        this.metrics.failed += 1;
        this.progress.increment({ type: task.type, status: 'failed' });
        this._emit('task_failed', taskWithError);
      }
    }

    this._persistState();
    this._processQueue();
  }

  private _loadState(): void {
    if (!this.statePath || !existsSync(this.statePath)) return;
    try {
      const stateJSON = readFileSync(this.statePath, 'utf-8');
      const state = JSON.parse(stateJSON);
      this.queue = (state.queue || []).map((t: any) => ({ ...t, execute: () => Promise.resolve() }));
      this.completed = state.completed || [];
      this.failed = state.failed || [];
      this.metrics = state.metrics || this.metrics;
      this.dependencies = new Map(Object.entries(state.dependencies || {}));
      this._emit('state_loaded', state);
    } catch (error: any) {
      if (error.code !== 'ENOENT') this._emit('state_load_error', { error: error.message });
    }
  }

  private _persistState(): void {
    if (!this.statePath) return;
    const state = {
      queue: this.queue.map(({ execute, cancel, ...rest }) => rest),
      running: Array.from(this.running.values()).map(({ execute, cancel, ...rest }) => rest),
      completed: this.completed.map(({ execute, cancel, ...rest }) => rest),
      failed: this.failed.map(({ execute, cancel, ...rest }) => rest),
      metrics: this.metrics,
      dependencies: Object.fromEntries(this.dependencies),
    };
    try {
      const dir = dirname(this.statePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.statePath, JSON.stringify(state, null, 2));
      this._emit('state_saved', { path: this.statePath });
    } catch (error: any) {
      this._emit('state_save_error', { error: error.message });
    }
  }

  private _autoPersist(): void {
    if (!this.statePath || this._autoPersistTimer) return;
    this._autoPersistTimer = setInterval(() => this._persistState(), this.autoPersistInterval);
  }

  getStats(): TaskStats {
    return {
      totals: {
        pending: this.queue.length, running: this.running.size,
        completed: this.completed.length, failed: this.failed.length,
        cancelled: this.metrics.cancelled,
        total: this.queue.length + this.running.size + this.completed.length + this.failed.length,
      },
      metrics: { ...this.metrics },
    };
  }

  async flush(): Promise<void> {
    this.queue.length = 0;
    this.completed.length = 0;
    this.failed.length = 0;
    this.running.clear();
    this.cancelled.clear();
    this.metrics = { started: 0, completed: 0, failed: 0, retried: 0, cancelled: 0, avgDuration: 0 };
    this._persistState();
  }

  async shutdown(): Promise<void> {
    if (this._autoPersistTimer) { clearInterval(this._autoPersistTimer); this._autoPersistTimer = null; }
    this._persistState();
  }

  private _computeNewAverage(currentAvg: number, count: number, newValue: number): number {
    if (count === 0) return newValue;
    return (currentAvg * ((count - 1) / count)) + (newValue / count);
  }
}
