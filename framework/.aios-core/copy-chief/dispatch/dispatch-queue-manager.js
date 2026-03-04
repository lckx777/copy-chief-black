'use strict';

/**
 * Dispatch Queue Manager
 *
 * Manages the dispatch-queue.yaml per offer in {offer}/.aios/.
 * Foundation for auto-dispatch (Gap 1), chaining (Gap 2), and nested delegation (Gap 3).
 *
 * @module dispatch-queue-manager
 * @version 1.0.0
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

const DispatchStatus = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
};

class DispatchQueueManager {
  constructor(ecosystemRoot, options = {}) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.options = {
      debug: false,
      maxQueueSize: 50,
      ...options,
    };
  }

  /**
   * Load dispatch queue for an offer.
   * Returns null if no queue exists (not an error).
   */
  loadQueue(offerRelativePath) {
    const queuePath = this._queuePath(offerRelativePath);
    if (!fs.existsSync(queuePath)) return null;

    try {
      const content = fs.readFileSync(queuePath, 'utf8');
      return yaml.load(content) || null;
    } catch (e) {
      this._log(`Failed to load queue: ${e.message}`);
      return null;
    }
  }

  /**
   * Save dispatch queue atomically (temp + rename).
   */
  async saveQueue(offerRelativePath, queue) {
    const queuePath = this._queuePath(offerRelativePath);
    const dir = path.dirname(queuePath);
    await fsp.mkdir(dir, { recursive: true });

    const tmpPath = queuePath + '.tmp';
    const content = yaml.dump(queue, { lineWidth: 120, noRefs: true });
    await fsp.writeFile(tmpPath, content, 'utf8');
    await fsp.rename(tmpPath, queuePath);
    this._log(`Queue saved: ${queuePath}`);
  }

  /**
   * Save dispatch queue synchronously (for hooks with budget constraints).
   */
  saveQueueSync(offerRelativePath, queue) {
    const queuePath = this._queuePath(offerRelativePath);
    const dir = path.dirname(queuePath);
    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = queuePath + '.tmp';
    const content = yaml.dump(queue, { lineWidth: 120, noRefs: true });
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, queuePath);
    this._log(`Queue saved (sync): ${queuePath}`);
  }

  /**
   * Create a fresh queue for an offer + workflow.
   */
  createQueue(offerRelativePath, workflowId, dispatches = []) {
    return {
      version: '1.0',
      offer: offerRelativePath,
      workflow: workflowId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      queue: dispatches.map((d, i) => ({
        id: d.id || `dispatch-${String(i + 1).padStart(3, '0')}`,
        phase_id: d.phase_id,
        agent_id: d.agent_id,
        model: d.model || 'sonnet',
        parallel_group: d.parallel_group || null,
        status: DispatchStatus.PENDING,
        prompt: d.prompt || '',
        expected_outputs: d.expected_outputs || [],
        created_at: new Date().toISOString(),
        source: d.source || 'pipeline',
      })),
    };
  }

  /**
   * Add dispatches to an existing queue.
   * Creates queue if it doesn't exist.
   */
  addDispatches(offerRelativePath, workflowId, dispatches) {
    let queue = this.loadQueue(offerRelativePath);
    if (!queue) {
      queue = this.createQueue(offerRelativePath, workflowId);
    }

    const existingCount = queue.queue.length;

    for (let i = 0; i < dispatches.length; i++) {
      const d = dispatches[i];
      const id = d.id || `dispatch-${String(existingCount + i + 1).padStart(3, '0')}`;

      // Dedup: skip if same agent+phase already pending
      const isDuplicate = queue.queue.some(
        existing => existing.agent_id === d.agent_id
          && existing.phase_id === d.phase_id
          && existing.status === DispatchStatus.PENDING
      );

      if (isDuplicate) {
        this._log(`Skipping duplicate dispatch: ${d.agent_id}@${d.phase_id}`);
        continue;
      }

      if (queue.queue.length >= this.options.maxQueueSize) {
        this._log(`Queue full (${this.options.maxQueueSize}), skipping remaining dispatches`);
        break;
      }

      queue.queue.push({
        id,
        phase_id: d.phase_id,
        agent_id: d.agent_id,
        model: d.model || 'sonnet',
        parallel_group: d.parallel_group || null,
        status: DispatchStatus.PENDING,
        prompt: d.prompt || '',
        expected_outputs: d.expected_outputs || [],
        created_at: new Date().toISOString(),
        source: d.source || 'chaining',
      });
    }

    queue.updated_at = new Date().toISOString();
    return queue;
  }

  /**
   * Mark a dispatch as dispatched (agent was launched).
   */
  markDispatched(queue, dispatchId) {
    const entry = queue.queue.find(d => d.id === dispatchId);
    if (entry) {
      entry.status = DispatchStatus.DISPATCHED;
      entry.dispatched_at = new Date().toISOString();
      queue.updated_at = new Date().toISOString();
    }
    return queue;
  }

  /**
   * Mark a dispatch as completed (agent finished).
   */
  markCompleted(queue, agentId, phaseId, result = {}) {
    const entries = queue.queue.filter(
      d => d.agent_id === agentId
        && d.phase_id === phaseId
        && (d.status === DispatchStatus.DISPATCHED || d.status === DispatchStatus.PENDING)
    );

    for (const entry of entries) {
      entry.status = DispatchStatus.COMPLETED;
      entry.completed_at = new Date().toISOString();
      if (result.confidence) entry.confidence = result.confidence;
      if (result.scores) entry.scores = result.scores;
    }

    queue.updated_at = new Date().toISOString();
    return queue;
  }

  /**
   * Mark a dispatch as failed.
   */
  markFailed(queue, agentId, phaseId, reason = '') {
    const entries = queue.queue.filter(
      d => d.agent_id === agentId
        && d.phase_id === phaseId
        && d.status !== DispatchStatus.COMPLETED
    );

    for (const entry of entries) {
      entry.status = DispatchStatus.FAILED;
      entry.failed_at = new Date().toISOString();
      entry.failure_reason = reason;
    }

    queue.updated_at = new Date().toISOString();
    return queue;
  }

  /**
   * Get all pending dispatches.
   */
  getPending(queue) {
    if (!queue?.queue) return [];
    return queue.queue.filter(d => d.status === DispatchStatus.PENDING);
  }

  /**
   * Get pending dispatches grouped by parallel_group.
   * Returns Map<string|null, dispatch[]>
   */
  getPendingByGroup(queue) {
    const pending = this.getPending(queue);
    const groups = new Map();

    for (const d of pending) {
      const key = d.parallel_group || `seq-${d.id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    }

    return groups;
  }

  /**
   * Get the next batch of dispatches to execute.
   * Returns dispatches from the first pending parallel group,
   * or the first sequential pending dispatch.
   */
  getNextBatch(queue) {
    const pending = this.getPending(queue);
    if (pending.length === 0) return [];

    const first = pending[0];
    if (first.parallel_group) {
      // Return all pending in the same parallel group
      return pending.filter(d => d.parallel_group === first.parallel_group);
    }

    // Sequential: return just the first
    return [first];
  }

  /**
   * Check if a parallel group is fully completed.
   */
  isGroupCompleted(queue, parallelGroup) {
    if (!queue?.queue || !parallelGroup) return false;
    const groupEntries = queue.queue.filter(d => d.parallel_group === parallelGroup);
    if (groupEntries.length === 0) return false;
    return groupEntries.every(d => d.status === DispatchStatus.COMPLETED);
  }

  /**
   * Check if queue has any pending dispatches.
   */
  hasPending(queue) {
    return this.getPending(queue).length > 0;
  }

  /**
   * Detect cycles in dispatch requests (A→B→A = refused).
   * Returns true if a cycle would be created.
   */
  detectCycle(queue, requestingAgent, targetAgent) {
    if (requestingAgent === targetAgent) return true;

    // Build a graph of who requested whom
    const graph = new Map();
    for (const d of (queue?.queue || [])) {
      if (d.source === 'delegation' && d.requesting_agent) {
        if (!graph.has(d.requesting_agent)) graph.set(d.requesting_agent, new Set());
        graph.get(d.requesting_agent).add(d.agent_id);
      }
    }

    // Add the proposed edge
    if (!graph.has(requestingAgent)) graph.set(requestingAgent, new Set());
    graph.get(requestingAgent).add(targetAgent);

    // DFS to detect cycle from targetAgent back to requestingAgent
    const visited = new Set();
    const stack = [targetAgent];

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === requestingAgent) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = graph.get(current);
      if (neighbors) {
        for (const n of neighbors) stack.push(n);
      }
    }

    return false;
  }

  /**
   * Abort all active (DISPATCHED and PENDING) entries for an offer.
   * Marks them as SKIPPED. Persists the queue to disk.
   * U-21: supports "abort" / "cancela tudo" intent.
   *
   * @param {string} offerRelativePath Relative or absolute offer path
   * @returns {object|null} Updated queue, or null if no queue exists
   */
  abortActive(offerRelativePath) {
    const queue = this.loadQueue(offerRelativePath);
    if (!queue) return null;

    let changed = false;
    for (const entry of queue.queue) {
      if (entry.status === DispatchStatus.DISPATCHED || entry.status === DispatchStatus.PENDING) {
        entry.status = DispatchStatus.SKIPPED;
        entry.skipped_at = new Date().toISOString();
        entry.skip_reason = 'aborted by user';
        changed = true;
      }
    }

    if (changed) {
      queue.updated_at = new Date().toISOString();
      this.saveQueueSync(offerRelativePath, queue);
    }

    this._log(`abortActive: ${changed ? 'queue aborted' : 'nothing to abort'}`);
    return queue;
  }

  /**
   * Restart a specific phase: mark all entries for that phase as SKIPPED,
   * then append fresh PENDING entries derived from the same entries.
   * U-21: supports "restart {phase}" intent.
   *
   * @param {string} offerRelativePath Relative or absolute offer path
   * @param {string} phaseId           Phase ID to restart
   * @returns {object|null} Updated queue, or null if no queue exists
   */
  restartPhase(offerRelativePath, phaseId) {
    const queue = this.loadQueue(offerRelativePath);
    if (!queue) return null;

    // Collect entries for this phase that are restartable
    const phaseEntries = queue.queue.filter(d => d.phase_id === phaseId);
    if (phaseEntries.length === 0) {
      this._log(`restartPhase: no entries found for phase ${phaseId}`);
      return queue;
    }

    const now = new Date().toISOString();
    const freshEntries = [];
    const existingCount = queue.queue.length;

    for (let i = 0; i < phaseEntries.length; i++) {
      const entry = phaseEntries[i];

      // Mark original as skipped
      entry.status = DispatchStatus.SKIPPED;
      entry.skipped_at = now;
      entry.skip_reason = `restarted by user (phase ${phaseId})`;

      // Build fresh PENDING entry
      freshEntries.push({
        id: `dispatch-restart-${phaseId}-${String(existingCount + i + 1).padStart(3, '0')}`,
        phase_id: entry.phase_id,
        agent_id: entry.agent_id,
        model: entry.model || 'sonnet',
        parallel_group: entry.parallel_group || null,
        status: DispatchStatus.PENDING,
        prompt: entry.prompt || '',
        expected_outputs: entry.expected_outputs || [],
        created_at: now,
        source: 'restart',
        restarted_from: entry.id,
      });
    }

    queue.queue.push(...freshEntries);
    queue.updated_at = now;

    this.saveQueueSync(offerRelativePath, queue);
    this._log(`restartPhase: skipped ${phaseEntries.length} entries, created ${freshEntries.length} fresh entries for phase ${phaseId}`);
    return queue;
  }

  /**
   * Clean up completed/failed entries older than threshold.
   */
  cleanup(queue, maxAgeMs = 24 * 60 * 60 * 1000) {
    if (!queue?.queue) return queue;

    const now = Date.now();
    queue.queue = queue.queue.filter(d => {
      if (d.status === DispatchStatus.PENDING || d.status === DispatchStatus.DISPATCHED) {
        return true;
      }
      const completedAt = d.completed_at || d.failed_at;
      if (!completedAt) return true;
      return (now - new Date(completedAt).getTime()) < maxAgeMs;
    });

    queue.updated_at = new Date().toISOString();
    return queue;
  }

  /**
   * Get queue summary for logging/display.
   */
  getSummary(queue) {
    if (!queue?.queue) return { total: 0, pending: 0, dispatched: 0, completed: 0, failed: 0 };

    const counts = { total: 0, pending: 0, dispatched: 0, completed: 0, failed: 0, skipped: 0 };
    for (const d of queue.queue) {
      counts.total++;
      counts[d.status] = (counts[d.status] || 0) + 1;
    }
    return counts;
  }

  /**
   * Determine if a failure reason is retryable.
   * Retryable: transient infrastructure errors (timeout, overflow, partial output).
   * Non-retryable: logical errors (missing artifacts, gate block, manual abort, validation).
   *
   * @param {string} reason - The failure_reason string
   * @returns {boolean}
   */
  static isRetryable(reason) {
    if (!reason) return false;
    const lower = reason.toLowerCase();
    const retryable = ['agent timeout', 'partial output', 'context overflow', 'mcp timeout'];
    const nonRetryable = ['missing artifacts', 'gate block', 'manual abort', 'validation failed'];
    if (nonRetryable.some(r => lower.includes(r))) return false;
    if (retryable.some(r => lower.includes(r))) return true;
    return false;
  }

  /**
   * Retry a failed dispatch by ID if it is retryable and under the max retry limit.
   * Resets status to 'pending' and increments retry_count.
   *
   * @param {string} offerRelativePath
   * @param {string} dispatchId - The dispatch entry's id field
   * @returns {boolean} true if the dispatch was reset for retry, false if rejected
   */
  retryFailed(offerRelativePath, dispatchId) {
    const queue = this.loadQueue(offerRelativePath);
    if (!queue?.queue) return false;

    const entry = queue.queue.find(d =>
      d.id === dispatchId || d.dispatch_id === dispatchId
    );

    if (!entry) return false;
    if (entry.status !== DispatchStatus.FAILED) return false;

    const reason = entry.failure_reason || '';
    if (!DispatchQueueManager.isRetryable(reason)) return false;

    const retryCount = entry.retry_count || 0;
    if (retryCount >= 2) return false;

    entry.status = DispatchStatus.PENDING;
    entry.retry_count = retryCount + 1;
    entry.retried_at = new Date().toISOString();
    delete entry.failed_at;
    queue.updated_at = new Date().toISOString();

    this.saveQueueSync(offerRelativePath, queue);
    return true;
  }

  /**
   * Format a human-readable summary of the dispatch queue.
   * Shows counts per status, list of pending agents, and failed entries with reasons.
   *
   * @param {string} offerRelativePath
   * @returns {string} Formatted summary text
   */
  formatSummary(offerRelativePath) {
    const queue = this.loadQueue(offerRelativePath);

    if (!queue?.queue) {
      return 'No dispatch queue found.';
    }

    const counts = this.getSummary(queue);
    const lines = [];

    lines.push(`Dispatch Queue: ${queue.offer || offerRelativePath}`);
    lines.push(`Workflow: ${queue.workflow || 'unknown'}`);
    lines.push(`Updated: ${queue.updated_at || 'unknown'}`);
    lines.push('');
    lines.push('Status Counts:');
    lines.push(`  total:      ${counts.total}`);
    lines.push(`  pending:    ${counts.pending || 0}`);
    lines.push(`  dispatched: ${counts.dispatched || 0}`);
    lines.push(`  completed:  ${counts.completed || 0}`);
    lines.push(`  failed:     ${counts.failed || 0}`);
    if (counts.skipped) {
      lines.push(`  skipped:    ${counts.skipped}`);
    }

    const pending = queue.queue.filter(d => d.status === DispatchStatus.PENDING);
    if (pending.length > 0) {
      lines.push('');
      lines.push('Pending Agents:');
      for (const d of pending) {
        const group = d.parallel_group ? ` [group: ${d.parallel_group}]` : '';
        const retries = d.retry_count ? ` (retry ${d.retry_count}/2)` : '';
        lines.push(`  - ${d.agent_id} @ ${d.phase_id || 'unknown'}${group}${retries}`);
      }
    }

    const failed = queue.queue.filter(d => d.status === DispatchStatus.FAILED);
    if (failed.length > 0) {
      lines.push('');
      lines.push('Failed Agents:');
      for (const d of failed) {
        const reason = d.failure_reason ? ` | reason: ${d.failure_reason}` : '';
        const retries = d.retry_count ? ` | retried: ${d.retry_count}x` : '';
        const retryable = d.failure_reason
          ? ` | retryable: ${DispatchQueueManager.isRetryable(d.failure_reason) ? 'yes' : 'no'}`
          : '';
        lines.push(`  - ${d.agent_id} @ ${d.phase_id || 'unknown'}${reason}${retries}${retryable}`);
      }
    }

    return lines.join('\n');
  }

  _queuePath(offerRelativePath) {
    const offerPath = offerRelativePath.startsWith('/')
      ? offerRelativePath
      : path.join(this.ecosystemRoot, offerRelativePath);
    return path.join(offerPath, '.aios', 'dispatch-queue.yaml');
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[DispatchQueue] ${message}`);
    }
  }
}

module.exports = { DispatchQueueManager, DispatchStatus };
