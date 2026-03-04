'use strict';

/**
 * Pipeline Enforcer
 * Event: Stop
 * Budget: <10s
 *
 * Reads dispatch-queue.yaml. If pending dispatches exist and Claude
 * did NOT spawn agents, blocks with decision: "block".
 * Gaps 1+2+3: Auto-Dispatch + Chaining + Nested Delegation
 */

const fs = require('fs');
const path = require('path');

const STOP_HOOK_MARKER = path.join(process.env.HOME, '.claude', '.aios-core', '.stop-hook-active');
const MARKER_MAX_AGE_MS = 60 * 1000; // 1 minute

function isMarkerActive() {
  try {
    if (!fs.existsSync(STOP_HOOK_MARKER)) return false;
    const stat = fs.statSync(STOP_HOOK_MARKER);
    const age = Date.now() - stat.mtimeMs;
    if (age > MARKER_MAX_AGE_MS) {
      // Stale marker, remove it
      fs.unlinkSync(STOP_HOOK_MARKER);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setMarker() {
  try {
    const dir = path.dirname(STOP_HOOK_MARKER);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STOP_HOOK_MARKER, new Date().toISOString(), 'utf8');
  } catch { /* best effort */ }
}

function clearMarker() {
  try {
    if (fs.existsSync(STOP_HOOK_MARKER)) {
      fs.unlinkSync(STOP_HOOK_MARKER);
    }
  } catch { /* best effort */ }
}

// ---------------------------------------------------------------------------
// Iteration tracking — prevent infinite dispatch loops per dispatch_id
// ---------------------------------------------------------------------------

const ITERATION_STORE_PATH = path.join(
  process.env.HOME, '.claude', '.aios-core', '.dispatch-iterations.json'
);

/**
 * Creates a fresh iteration marker for a dispatch ID.
 * Exported for testing.
 */
function _createMarker(dispatchId) {
  return {
    dispatch_id: dispatchId,
    iteration_count: 1,
    max_iterations: 3,
    timestamp: Date.now(),
  };
}

/**
 * Returns a new marker with iteration_count incremented by 1.
 * Exported for testing.
 */
function _incrementMarker(marker) {
  return Object.assign({}, marker, { iteration_count: marker.iteration_count + 1 });
}

/**
 * Returns true if the marker's iteration_count has reached max_iterations.
 * Exported for testing.
 */
function _shouldAbort(marker) {
  return marker.iteration_count >= marker.max_iterations;
}

/**
 * Returns true if the marker is older than 60000ms (1 minute).
 * Exported for testing.
 */
function _isStale(marker) {
  return (Date.now() - marker.timestamp) > 60000;
}

/**
 * Load persisted iteration store from disk. Returns {} on any error.
 */
function _loadIterationStore() {
  try {
    if (!fs.existsSync(ITERATION_STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(ITERATION_STORE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Persist iteration store to disk (best effort).
 */
function _saveIterationStore(store) {
  try {
    fs.mkdirSync(path.dirname(ITERATION_STORE_PATH), { recursive: true });
    fs.writeFileSync(ITERATION_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch { /* best effort */ }
}

/**
 * Get or create a marker for dispatchId. Increments if existing and not stale.
 * Returns { marker, aborted } where aborted=true if limit exceeded.
 */
function _trackIteration(dispatchId) {
  const store = _loadIterationStore();

  // Purge stale entries
  for (const id of Object.keys(store)) {
    if (_isStale(store[id])) delete store[id];
  }

  let marker;
  if (store[dispatchId]) {
    marker = _incrementMarker(store[dispatchId]);
  } else {
    marker = _createMarker(dispatchId);
  }

  store[dispatchId] = marker;
  _saveIterationStore(store);

  return { marker, aborted: _shouldAbort(marker) };
}

/**
 * Clear iteration tracking for a dispatchId (call after successful dispatch or abort).
 */
function _clearIteration(dispatchId) {
  try {
    const store = _loadIterationStore();
    delete store[dispatchId];
    _saveIterationStore(store);
  } catch { /* best effort */ }
}

/**
 * Find offer with pending dispatch queue, prioritizing session context.
 *
 * Priority order:
 * 1. Offer from active-agents.json (session context) — if it has a pending queue
 * 2. Offer from active-persona.json (backwards compat) — if it has a pending queue
 * 3. Any offer with a non-stale pending queue (original behavior, but with staleness check)
 *
 * Staleness: queues older than 10 minutes with only pending items (never dispatched) are stale.
 */
function findActiveOffer(ecosystemRoot) {
  const yaml = require('js-yaml');
  const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

  // Helper: check if an offer has a non-stale pending queue
  function hasValidQueue(offerRelPath) {
    const queuePath = path.join(ecosystemRoot, offerRelPath, '.aios', 'dispatch-queue.yaml');
    if (!fs.existsSync(queuePath)) return false;

    try {
      const queue = yaml.load(fs.readFileSync(queuePath, 'utf8'));
      if (!queue?.queue) return false;

      const hasPending = queue.queue.some(d => d.status === 'pending');
      if (!hasPending) return false;

      // Staleness check: if queue was created >10min ago AND has no dispatched items, it's stale
      const createdAt = queue.created_at ? new Date(queue.created_at).getTime() : 0;
      const age = Date.now() - createdAt;
      const hasDispatched = queue.queue.some(d => d.status === 'dispatched' || d.status === 'completed');

      if (age > STALE_THRESHOLD_MS && !hasDispatched) {
        return false; // stale — never acted on
      }

      return true;
    } catch {
      return false;
    }
  }

  // Priority 1: Check session context (active-agents.json)
  try {
    const stateDir = path.join(process.env.HOME, '.claude', 'session-state');
    const agentSetPath = path.join(stateDir, 'active-agents.json');
    if (fs.existsSync(agentSetPath)) {
      const agentSet = JSON.parse(fs.readFileSync(agentSetPath, 'utf8'));
      // Find most recent agent's offer
      let newest = null;
      for (const [, info] of Object.entries(agentSet)) {
        if (info.offer && (!newest || (info.activatedAt || 0) > (newest.activatedAt || 0))) {
          newest = info;
        }
      }
      if (newest?.offer && hasValidQueue(newest.offer)) {
        return newest.offer;
      }
    }
  } catch { /* skip */ }

  // Priority 2: Check active-persona.json (backwards compat)
  try {
    const personaPath = path.join(process.env.HOME, '.claude', 'session-state', 'active-persona.json');
    if (fs.existsSync(personaPath)) {
      const persona = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
      if (persona?.offer && hasValidQueue(persona.offer)) {
        return persona.offer;
      }
    }
  } catch { /* skip */ }

  // Priority 3: Fallback — scan for any offer with non-stale pending queue
  const UUID_RE = /^[0-9a-f]{8}-/;
  const SKIP_DIRS = new Set(['docs', 'scripts', 'site', 'export', 'knowledge', 'squads',
    'squad-prompts', 'metodologias-de-copy', 'pesquisas-setup', 'copy-chief-tutorial', 'research']);

  try {
    const topDirs = fs.readdirSync(ecosystemRoot, { withFileTypes: true });
    for (const topDir of topDirs) {
      if (!topDir.isDirectory() || topDir.name.startsWith('.')) continue;
      if (UUID_RE.test(topDir.name) || SKIP_DIRS.has(topDir.name)) continue;
      const nichePath = path.join(ecosystemRoot, topDir.name);

      try {
        const offerDirs = fs.readdirSync(nichePath, { withFileTypes: true });
        for (const dir of offerDirs) {
          if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
          const rel = `${topDir.name}/${dir.name}`;
          if (hasValidQueue(rel)) {
            return rel;
          }
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  return null;
}

/**
 * Check if an active execution plan requires enforcement.
 * Returns { block: true, directive: string } or null if no plan active.
 */
function checkPlanEnforcement(ecosystemRoot, lastMessage) {
  const yaml = require('js-yaml');
  const UUID_RE = /^[0-9a-f]{8}-/;
  const SKIP_DIRS = new Set(['docs', 'scripts', 'site', 'export', 'knowledge', 'squads',
    'squad-prompts', 'metodologias-de-copy', 'pesquisas-setup', 'copy-chief-tutorial', 'research']);

  // Scan for active plan
  const topDirs = fs.readdirSync(ecosystemRoot, { withFileTypes: true });
  for (const topDir of topDirs) {
    if (!topDir.isDirectory() || topDir.name.startsWith('.')) continue;
    if (UUID_RE.test(topDir.name) || SKIP_DIRS.has(topDir.name)) continue;
    const nichePath = path.join(ecosystemRoot, topDir.name);

    let offerDirs;
    try { offerDirs = fs.readdirSync(nichePath, { withFileTypes: true }); } catch { continue; }

    for (const dir of offerDirs) {
      if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
      const planPath = path.join(nichePath, dir.name, '.aios', 'execution-plan.yaml');
      if (!fs.existsSync(planPath)) continue;

      let plan;
      try { plan = yaml.load(fs.readFileSync(planPath, 'utf8')); } catch { continue; }
      if (!plan || plan.status !== 'executing') continue;

      const offerPath = `${topDir.name}/${dir.name}`;
      const aiosCoreDir = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');

      // Check if agent was dispatched and verify completion
      const { PlanStateMachine } = require(path.join(aiosCoreDir, 'plan', 'plan-state-machine'));
      const { PlanVerification } = require(path.join(aiosCoreDir, 'plan', 'plan-verification'));
      const { ExecutionPlanGenerator } = require(path.join(aiosCoreDir, 'plan', 'execution-plan-generator'));

      const sm = new PlanStateMachine(ecosystemRoot);
      const pv = new PlanVerification(ecosystemRoot);
      const gen = new ExecutionPlanGenerator(ecosystemRoot);

      // Check dispatched tasks — verify if outputs exist now
      const dispatched = plan.tasks.filter(t => t.status === 'dispatched');
      let planChanged = false;

      for (const task of dispatched) {
        if (task.type !== 'auto') continue;
        const result = pv.verify(task, offerPath);
        if (result.verified) {
          sm.advanceTask(plan, task.id, 'Verified by plan-verification');
          planChanged = true;
        }
      }

      if (planChanged) {
        gen.save(offerPath, plan);
      }

      const currentTask = plan.current_task
        ? plan.tasks.find(t => t.id === plan.current_task)
        : null;

      if (!currentTask) {
        // Plan may be complete
        const allDone = plan.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
        if (allDone) return null; // pass through
        continue;
      }

      // Checkpoint — don't block (waiting for human)
      if (currentTask.type === 'checkpoint') {
        return null;
      }

      // Auto task pending — need to dispatch
      if (currentTask.status === 'pending') {
        const directive = sm.getDirective(plan);
        if (directive) {
          return { block: true, directive };
        }
      }

      // Auto task dispatched — agents still running, pass through
      if (currentTask.status === 'dispatched') {
        return null;
      }

      return null;
    }
  }

  return null;
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Guard 1: Claude Code built-in stop_hook_active flag
  if (context.stop_hook_active) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Guard 2: if stop hook already fired recently, pass through (prevents infinite block loops)
  if (isMarkerActive()) {
    clearMarker();
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Guard 3: if Claude already dispatched Agent() calls, let it through
  const lastMessage = context.last_assistant_message || '';
  if (/Agent\s*\(/.test(lastMessage) || /subagent_type/.test(lastMessage)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  // === Plan-driven enforcement (priority over dispatch-queue) ===
  try {
    const planResult = checkPlanEnforcement(ecosystemRoot, lastMessage);
    if (planResult) {
      if (planResult.block) {
        setMarker();
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: planResult.directive,
        }));
      } else {
        process.stdout.write(JSON.stringify({}));
      }
      return;
    }
  } catch { /* fail-open: fall through to dispatch-queue */ }

  // === Dispatch-queue enforcement (existing) ===
  const offerRelativePath = findActiveOffer(ecosystemRoot);
  if (!offerRelativePath) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  try {
    const { DispatchQueueManager } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'dispatch', 'dispatch-queue-manager')
    );

    const queueManager = new DispatchQueueManager(ecosystemRoot);
    const queue = queueManager.loadQueue(offerRelativePath);

    if (!queue || !queueManager.hasPending(queue)) {
      process.stdout.write(JSON.stringify({}));
      return;
    }

    // Get next batch to dispatch
    const batch = queueManager.getNextBatch(queue);
    if (batch.length === 0) {
      process.stdout.write(JSON.stringify({}));
      return;
    }

    // Check if Claude's response already contains Agent() calls
    // (the Stop hook response text is not available, but we can check
    // if dispatches were already marked as dispatched)
    const allDispatched = batch.every(d => d.status === 'dispatched');
    if (allDispatched) {
      process.stdout.write(JSON.stringify({}));
      return;
    }

    // Iteration tracking — prevent infinite dispatch loops
    const batchId = batch.map(d => d.id).sort().join('|');
    const iterResult = _trackIteration(batchId);
    if (iterResult.aborted) {
      // Too many re-entries for this batch — clear and pass through
      _clearIteration(batchId);
      clearMarker();
      process.stdout.write(JSON.stringify({
        decision: 'block',
        reason: `<dispatch-enforcer-abort>Max iterations (${iterResult.marker.max_iterations}) reached for dispatch batch [${batchId}]. Clearing to prevent infinite loop.</dispatch-enforcer-abort>`,
      }));
      return;
    }

    // Set marker to prevent infinite loops
    setMarker();

    // Build the blocking directive
    const isParallel = batch.length > 1 && batch[0].parallel_group;
    const agentCalls = batch.map(d => {
      return [
        `Agent(`,
        `  description: "${d.agent_id}: ${d.phase_id}",`,
        `  subagent_type: "general-purpose",`,
        `  model: "${d.model}",`,
        `  prompt: "<see full-prompts section below>"`,
        `)`,
      ].join('\n');
    });

    const directive = [
      '<dispatch-enforcer>',
      `  <offer>${offerRelativePath}</offer>`,
      `  <workflow>${queue.workflow}</workflow>`,
      `  <pending-count>${batch.length}</pending-count>`,
      `  <mode>${isParallel ? 'PARALLEL' : 'SEQUENTIAL'}</mode>`,
      '',
      '  <action>',
      isParallel
        ? `    Launch ${batch.length} Agent() calls in ONE message (parallel):`
        : '    Launch the following Agent() call:',
      '',
      ...agentCalls.map(c => '    ' + c.split('\n').join('\n    ')),
      '  </action>',
      '',
      '  <full-prompts>',
      ...batch.map(d => [
        `    <dispatch id="${d.id}" agent="${d.agent_id}" model="${d.model}">`,
        `      <prompt>${d.prompt}</prompt>`,
        `    </dispatch>`,
      ].join('\n')),
      '  </full-prompts>',
      '</dispatch-enforcer>',
    ].join('\n');

    // Block Claude from stopping — force it to dispatch the agents
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: directive,
    }));
  } catch (error) {
    // Fail-open: don't block on errors
    clearMarker();
    process.stdout.write(JSON.stringify({}));
  }
}

main().catch(() => {
  clearMarker();
  process.exit(0);
});

module.exports = {
  _createMarker,
  _incrementMarker,
  _shouldAbort,
  _isStale,
};
