'use strict';

/**
 * Wave Analyzer
 *
 * Analyzes dispatch-queue entries to find parallel execution opportunities.
 * Uses Kahn's algorithm for topological sorting.
 * Computes critical path and optimization gain for scheduling decisions.
 *
 * @module execution/wave-analyzer
 * @version 1.0.0
 */

const path = require('path');
const yaml = require('js-yaml');

// Default estimated duration per agent (minutes) if no timing data is available
const DEFAULT_AGENT_DURATION = {
  vox: 8,
  cipher: 6,
  atlas: 12,
  echo: 15,
  forge: 12,
  scout: 8,
  blade: 8,
  hawk: 6,
  sentinel: 3,
  ops: 4,
  strategist: 10,
};
const FALLBACK_DURATION = 8;

/**
 * Analyzes dispatch entries and groups them into execution waves.
 * Each wave contains tasks that can run in parallel.
 * Uses Kahn's algorithm (BFS topological sort).
 *
 * @param {Array<object>} dispatches - Array of dispatch queue entries.
 *   Each entry should have: { id, agent_id, depends_on? }
 * @returns {{ waves: Array<Array<object>>, order: string[], error: string|null }}
 */
function analyzeWaves(dispatches) {
  if (!Array.isArray(dispatches) || dispatches.length === 0) {
    return { waves: [], order: [], error: null };
  }

  // Detect cycles before proceeding
  const cycleResult = detectCycles(dispatches);
  if (cycleResult.hasCycle) {
    return {
      waves: [],
      order: [],
      error: `Circular dependency detected: ${cycleResult.cycle.join(' → ')}`,
    };
  }

  // Build adjacency structures
  const inDegree = new Map();
  const dependents = new Map(); // id → ids that depend on it

  for (const d of dispatches) {
    const id = d.id;
    if (!inDegree.has(id)) inDegree.set(id, 0);
    if (!dependents.has(id)) dependents.set(id, []);
  }

  for (const d of dispatches) {
    const deps = _normalizeDeps(d.depends_on);
    for (const dep of deps) {
      inDegree.set(d.id, (inDegree.get(d.id) || 0) + 1);
      if (!dependents.has(dep)) dependents.set(dep, []);
      dependents.get(dep).push(d.id);
    }
  }

  const dispatchById = new Map(dispatches.map(d => [d.id, d]));
  const waves = [];
  const order = [];
  let remaining = new Set(dispatches.map(d => d.id));

  while (remaining.size > 0) {
    // Collect all nodes with in-degree 0
    const wave = [];
    for (const id of remaining) {
      if ((inDegree.get(id) || 0) === 0) {
        wave.push(dispatchById.get(id));
      }
    }

    if (wave.length === 0) {
      // Should not happen — cycles caught above
      return { waves, order, error: 'Unresolvable dependency (internal error)' };
    }

    waves.push(wave);

    for (const d of wave) {
      order.push(d.id);
      remaining.delete(d.id);

      // Reduce in-degree for all dependents
      for (const depId of (dependents.get(d.id) || [])) {
        inDegree.set(depId, (inDegree.get(depId) || 0) - 1);
      }
    }
  }

  return { waves, order, error: null };
}

/**
 * Computes the critical path: the longest chain of dependent tasks.
 * Returns the sequence of dispatch IDs forming the bottleneck.
 *
 * @param {Array<object>} dispatches
 * @returns {{ path: string[], duration: number }}
 */
function getCriticalPath(dispatches) {
  if (!Array.isArray(dispatches) || dispatches.length === 0) {
    return { path: [], duration: 0 };
  }

  const dispatchById = new Map(dispatches.map(d => [d.id, d]));

  // Memoized longest-path DP
  const memo = new Map();

  function longestPath(id) {
    if (memo.has(id)) return memo.get(id);

    const d = dispatchById.get(id);
    if (!d) return { duration: 0, path: [] };

    const duration = _agentDuration(d.agent_id);
    const deps = _normalizeDeps(d.depends_on);

    if (deps.length === 0) {
      const result = { duration, path: [id] };
      memo.set(id, result);
      return result;
    }

    let best = { duration: 0, path: [] };
    for (const dep of deps) {
      const sub = longestPath(dep);
      if (sub.duration > best.duration) best = sub;
    }

    const result = { duration: best.duration + duration, path: [...best.path, id] };
    memo.set(id, result);
    return result;
  }

  // Find the longest path across all nodes
  let critical = { path: [], duration: 0 };
  for (const d of dispatches) {
    const result = longestPath(d.id);
    if (result.duration > critical.duration) critical = result;
  }

  return critical;
}

/**
 * Calculates the optimization gain from parallel execution vs sequential.
 *
 * @param {Array<object>} dispatches
 * @returns {{ sequential_time: number, parallel_time: number, speedup_factor: number, wave_count: number }}
 */
function getOptimizationGain(dispatches) {
  if (!Array.isArray(dispatches) || dispatches.length === 0) {
    return { sequential_time: 0, parallel_time: 0, speedup_factor: 1, wave_count: 0 };
  }

  const sequential_time = dispatches.reduce((sum, d) => sum + _agentDuration(d.agent_id), 0);

  const { waves, error } = analyzeWaves(dispatches);
  if (error) {
    return { sequential_time, parallel_time: sequential_time, speedup_factor: 1, wave_count: 0, error };
  }

  // Parallel time = sum of max duration per wave
  const parallel_time = waves.reduce((sum, wave) => {
    const waveMax = Math.max(...wave.map(d => _agentDuration(d.agent_id)));
    return sum + waveMax;
  }, 0);

  const speedup_factor = parallel_time > 0 ? Math.round((sequential_time / parallel_time) * 100) / 100 : 1;

  return {
    sequential_time,
    parallel_time,
    speedup_factor,
    wave_count: waves.length,
  };
}

/**
 * Detects circular dependencies using DFS.
 *
 * @param {Array<object>} dispatches
 * @returns {{ hasCycle: boolean, cycle: string[] }}
 */
function detectCycles(dispatches) {
  if (!Array.isArray(dispatches) || dispatches.length === 0) {
    return { hasCycle: false, cycle: [] };
  }

  const depMap = new Map();
  for (const d of dispatches) {
    depMap.set(d.id, _normalizeDeps(d.depends_on));
  }

  const WHITE = 0; // unvisited
  const GRAY = 1;  // in current DFS stack
  const BLACK = 2; // fully processed

  const color = new Map();
  const parent = new Map();

  for (const id of depMap.keys()) {
    color.set(id, WHITE);
    parent.set(id, null);
  }

  let cycleStart = null;
  let cycleEnd = null;

  function dfs(u) {
    color.set(u, GRAY);

    for (const v of (depMap.get(u) || [])) {
      if (!color.has(v)) continue; // dep references unknown id — skip
      if (color.get(v) === GRAY) {
        cycleStart = v;
        cycleEnd = u;
        return true;
      }
      if (color.get(v) === WHITE) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }

    color.set(u, BLACK);
    return false;
  }

  for (const id of depMap.keys()) {
    if (color.get(id) === WHITE) {
      if (dfs(id)) {
        // Reconstruct cycle path
        const cycle = [cycleStart];
        let cur = cycleEnd;
        while (cur && cur !== cycleStart) {
          cycle.unshift(cur);
          cur = parent.get(cur);
        }
        if (cycleStart) cycle.unshift(cycleStart);
        return { hasCycle: true, cycle };
      }
    }
  }

  return { hasCycle: false, cycle: [] };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _normalizeDeps(depends_on) {
  if (!depends_on) return [];
  if (Array.isArray(depends_on)) return depends_on.filter(Boolean);
  if (typeof depends_on === 'string') return [depends_on];
  return [];
}

function _agentDuration(agentId) {
  if (!agentId) return FALLBACK_DURATION;
  const key = String(agentId).toLowerCase().replace(/@/g, '');
  return DEFAULT_AGENT_DURATION[key] || FALLBACK_DURATION;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { analyzeWaves, getCriticalPath, getOptimizationGain, detectCycles };
