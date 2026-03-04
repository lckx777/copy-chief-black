/**
 * Parallel Executor - Executes multiple phases concurrently
 * Port of: aios-core/.aios-core/core/orchestration/parallel-executor.js
 *
 * @module aios/parallel-executor
 * @version 1.0.0
 */

// ============ Types ============

export type PhaseStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface PhaseTask {
  phase?: number;
  step?: number;
  [key: string]: any;
}

export interface PhaseResult {
  phase: number;
  status: 'fulfilled' | 'rejected';
  result?: any;
  error?: string;
}

export interface ParallelResult {
  results: PhaseResult[];
  errors: string[];
  summary: { total: number; success: number; failed: number };
}

// ============ Class ============

export class ParallelExecutor {
  maxConcurrency: number;
  runningTasks: Map<number, { status: PhaseStatus; startTime: number; endTime?: number; result?: any; error?: string }>;

  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.runningTasks = new Map();
  }

  async executeParallel(phases: PhaseTask[], executePhase: (phase: PhaseTask) => Promise<any>, options: { maxConcurrency?: number } = {}): Promise<ParallelResult> {
    const maxConcurrency = options.maxConcurrency || this.maxConcurrency;
    const results: PhaseResult[] = [];
    const errors: string[] = [];

    const promises = phases.map(async (phase): Promise<PhaseResult> => {
      const phaseId = phase.phase || phase.step || 0;
      this.runningTasks.set(phaseId, { status: 'running', startTime: Date.now() });

      try {
        const result = await executePhase(phase);
        this.runningTasks.set(phaseId, { status: 'completed', startTime: this.runningTasks.get(phaseId)!.startTime, endTime: Date.now(), result });
        return { phase: phaseId, status: 'fulfilled', result };
      } catch (error: any) {
        this.runningTasks.set(phaseId, { status: 'failed', startTime: this.runningTasks.get(phaseId)!.startTime, endTime: Date.now(), error: error.message });
        return { phase: phaseId, status: 'rejected', error: error.message };
      }
    });

    const settled = await this._executeWithConcurrencyLimit(promises, maxConcurrency);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push(String(result.reason));
      }
    }

    return {
      results: results.concat(settled.filter(s => s.status === 'rejected').map(s => ({ phase: 0, status: 'rejected' as const, error: String(s.reason) }))),
      errors,
      summary: { total: phases.length, success: results.filter(r => r.status === 'fulfilled').length, failed: errors.length },
    };
  }

  private async _executeWithConcurrencyLimit<T>(tasks: Promise<T>[], limit: number): Promise<PromiseSettledResult<T>[]> {
    const results: Promise<T>[] = [];
    const executing = new Set<Promise<void>>();

    for (const task of tasks) {
      const p = Promise.resolve().then(() => task);
      results.push(p);

      if (limit <= tasks.length) {
        const e = p.then(() => { executing.delete(e); }).catch(() => { executing.delete(e); }) as Promise<void>;
        executing.add(e);
        if (executing.size >= limit) await Promise.race(executing);
      }
    }

    return Promise.allSettled(results);
  }

  getStatus(): Record<number, { status: PhaseStatus; startTime: number; endTime?: number; duration?: number }> {
    const status: Record<number, any> = {};
    for (const [id, taskStatus] of this.runningTasks) {
      status[id] = { ...taskStatus };
      if (taskStatus.startTime && taskStatus.endTime) status[id].duration = taskStatus.endTime - taskStatus.startTime;
    }
    return status;
  }

  hasRunningTasks(): boolean {
    for (const [, status] of this.runningTasks) {
      if (status.status === 'running') return true;
    }
    return false;
  }

  async waitForCompletion(timeout = 300000): Promise<void> {
    const startTime = Date.now();
    while (this.hasRunningTasks()) {
      if (Date.now() - startTime > timeout) throw new Error('Timeout waiting for parallel tasks');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  cancelAll(): void {
    for (const [id, status] of this.runningTasks) {
      if (status.status === 'running') this.runningTasks.set(id, { ...status, status: 'cancelled' });
    }
  }

  clear(): void { this.runningTasks.clear(); }

  setMaxConcurrency(max: number): void { this.maxConcurrency = Math.max(1, Math.min(10, max)); }

  getSummary(): { total: number; completed: number; failed: number; running: number; averageDuration: number } {
    let completed = 0, failed = 0, running = 0, totalDuration = 0;
    for (const [, status] of this.runningTasks) {
      if (status.status === 'completed') { completed++; if (status.startTime && status.endTime) totalDuration += status.endTime - status.startTime; }
      else if (status.status === 'failed') failed++;
      else if (status.status === 'running') running++;
    }
    return { total: this.runningTasks.size, completed, failed, running, averageDuration: completed > 0 ? Math.round(totalDuration / completed) : 0 };
  }
}
