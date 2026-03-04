'use strict';

/**
 * Handoff Validator Hook (Enhanced)
 * Event: SubagentStop
 * Budget: <5s
 *
 * Creates handoff contracts when Copy Squad agents complete their work.
 * Enhanced for:
 * - Gap 2: Workflow-aware queueing (chain next phase)
 * - Gap 3: Dispatch-request ingestion (nested delegation)
 * - Gap 4: Execution log writing (persistent state)
 */

const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const KNOWN_AGENTS = ['vox', 'cipher', 'atlas', 'echo', 'forge', 'scout', 'blade', 'hawk', 'sentinel', 'ops', 'strategist'];

const AGENT_NEXT_MAP = {
  'vox': 'atlas',
  'cipher': 'atlas',
  'atlas': 'echo',
  'echo': 'hawk',
  'forge': 'hawk',
  'scout': 'hawk',
  'blade': 'hawk',
  'hawk': 'sentinel',
  'strategist': 'helix',
  // ops does not chain (terminal agent)
};

const AGENT_ARTIFACTS = {
  'vox': [
    { path: 'research/voc/summary.md', required: true },
    { path: 'research/synthesis.md', required: true },
    { path: 'research/competitors/summary.md', required: false },
    { path: 'research/avatar/summary.md', required: false },
  ],
  'cipher': [
    { path: 'research/competitors/ads-library-spy.md', required: true },
    { path: 'research/competitors/summary.md', required: false },
  ],
  'atlas': [
    { path: 'briefings/helix-complete.md', required: true },
    { path: 'mecanismo-unico.yaml', required: true },
  ],
  'echo': [
    { path: 'production/vsl/', required: true, description: 'VSL chapters directory' },
  ],
  'forge': [
    { path: 'production/landing-page/', required: true, description: 'LP blocks directory' },
  ],
  'scout': [
    { path: 'production/creatives/', required: true, description: 'Creatives directory' },
  ],
  'blade': [
    { path: 'production/emails/', required: true, description: 'Email sequences directory' },
  ],
  'hawk': [
    { path: 'production/review-results.md', required: true, description: 'Review results' },
  ],
  'ops': [
    { path: '~/.claude/logs/ops.log', required: false, description: 'Operations log' },
  ],
  'strategist': [
    { path: 'strategy/', required: false, description: 'Strategy analysis' },
  ],
};

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

  // Extract agent ID and offer path from context
  const prompt = context.prompt || context.description || '';
  const agentId = detectAgentId(prompt);
  const offerPath = detectOfferPath(prompt);

  // Clear active persona marker (production-delegation-gate)
  try {
    const markerPath = path.join(process.env.HOME, '.claude', 'session-state', 'active-persona.json');
    fs.unlinkSync(markerPath);
  } catch { /* marker may not exist — OK */ }

  // Remove agent from active-agents.json set
  if (agentId) {
    try {
      const setPath = path.join(process.env.HOME, '.claude', 'session-state', 'active-agents.json');
      if (fs.existsSync(setPath)) {
        const agentSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
        delete agentSet[agentId];
        if (Object.keys(agentSet).length === 0) {
          fs.unlinkSync(setPath);
        } else {
          fs.writeFileSync(setPath, JSON.stringify(agentSet, null, 2));
        }
      }
    } catch { /* non-critical */ }
  }

  // Emit dashboard event (fire-and-forget)
  if (agentId) {
    try {
      const dashUrl = process.env.DASHBOARD_URL || 'http://localhost:4001';
      fetch(`${dashUrl}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'AgentStop',
          timestamp: Date.now(),
          offer: offerPath || null,
          data: { agent_id: agentId, offer: offerPath || null },
        }),
        signal: AbortSignal.timeout(1000),
      }).catch(() => {});
    } catch { /* non-critical */ }
  }

  if (!agentId || !offerPath) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');
  const aiosCoreDir = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');

  const results = [];

  // === ORIGINAL: Create handoff contract ===
  try {
    const nextAgent = AGENT_NEXT_MAP[agentId];
    const artifacts = AGENT_ARTIFACTS[agentId] || [];

    if (nextAgent && artifacts.length > 0) {
      const { HandoffProtocol } = require(path.join(aiosCoreDir, 'handoff', 'handoff-protocol'));
      const protocol = new HandoffProtocol(ecosystemRoot, { debug: false });
      const handoff = await protocol.createHandoff(agentId, nextAgent, offerPath, artifacts, {
        phaseCompleted: agentId,
      });
      const handoffContext = protocol.formatHandoffContext(handoff);
      results.push(handoffContext);
    }
  } catch (error) {
    results.push(`<handoff-error>${error.message}</handoff-error>`);
  }

  // === GAP 2: Workflow-aware queue chaining ===
  try {
    const { DispatchQueueManager } = require(path.join(aiosCoreDir, 'dispatch', 'dispatch-queue-manager'));
    const queueManager = new DispatchQueueManager(ecosystemRoot);
    let queue = queueManager.loadQueue(offerPath);

    if (queue) {
      // Detect if agent failed (context.result may be 'error' or context.failure may be set)
      const agentFailed = context.result === 'error' || !!context.failure || context.exit_code > 0;
      const failureReason = context.failure_reason || context.failure || context.error || '';

      if (agentFailed && failureReason) {
        // Mark dispatched entries for this agent as failed
        for (const d of queue.queue) {
          if (d.agent_id === agentId && (d.status === 'dispatched' || d.status === 'pending')) {
            queueManager.markFailed(queue, agentId, d.phase_id, String(failureReason));
          }
        }

        // Auto-retry if failure is retryable and under retry limit
        const failedEntries = queue.queue.filter(
          d => d.agent_id === agentId && d.status === 'failed'
        );
        for (const entry of failedEntries) {
          const isRetryable = DispatchQueueManager.isRetryable(entry.failure_reason || '');
          const retryCount = entry.retry_count || 0;
          if (isRetryable && retryCount < 2) {
            const retried = queueManager.retryFailed(offerPath, entry.id);
            if (retried) {
              results.push([
                '<retry-queued>',
                `  <agent>${agentId}</agent>`,
                `  <dispatch-id>${entry.id}</dispatch-id>`,
                `  <reason>${entry.failure_reason}</reason>`,
                `  <retry-count>${retryCount + 1}</retry-count>`,
                '</retry-queued>',
              ].join('\n'));
            }
          } else if (!isRetryable) {
            results.push([
              '<retry-rejected>',
              `  <agent>${agentId}</agent>`,
              `  <reason>${entry.failure_reason}</reason>`,
              `  <verdict>non-retryable — escalate to user</verdict>`,
              '</retry-rejected>',
            ].join('\n'));
          } else {
            results.push([
              '<retry-exhausted>',
              `  <agent>${agentId}</agent>`,
              `  <retry-count>${retryCount}</retry-count>`,
              `  <verdict>max retries (2) reached — escalate to user</verdict>`,
              '</retry-exhausted>',
            ].join('\n'));
          }
        }

        // Save queue after failure/retry processing and exit gap 2
        queueManager.saveQueueSync(offerPath, queue);
      } else {
      // Mark this agent's dispatch as completed
      queueManager.markCompleted(queue, agentId, null, {});
      // Try all phases - markCompleted matches by agent_id
      for (const d of queue.queue) {
        if (d.agent_id === agentId && (d.status === 'dispatched' || d.status === 'pending')) {
          queueManager.markCompleted(queue, agentId, d.phase_id, {});
        }
      }

      // Check if current parallel group is now fully completed
      const completedDispatch = queue.queue.find(d => d.agent_id === agentId && d.status === 'completed');
      if (completedDispatch?.parallel_group) {
        const groupComplete = queueManager.isGroupCompleted(queue, completedDispatch.parallel_group);

        if (groupComplete) {
          // Determine next phase from workflow
          const nextPhaseDispatches = getNextPhaseDispatches(
            ecosystemRoot, queue.workflow, completedDispatch.parallel_group, offerPath
          );

          if (nextPhaseDispatches.length > 0) {
            queue = queueManager.addDispatches(offerPath, queue.workflow, nextPhaseDispatches);
            results.push([
              '<chaining-update>',
              `  <completed-group>${completedDispatch.parallel_group}</completed-group>`,
              `  <queued-next count="${nextPhaseDispatches.length}" agents="${nextPhaseDispatches.map(d => d.agent_id).join(', ')}" />`,
              '</chaining-update>',
            ].join('\n'));
          }
        } else {
          // Group not yet complete — note which agents are still running
          const remaining = queue.queue.filter(
            d => d.parallel_group === completedDispatch.parallel_group && d.status !== 'completed'
          );
          results.push([
            '<chaining-waiting>',
            `  <group>${completedDispatch.parallel_group}</group>`,
            `  <remaining>${remaining.map(d => d.agent_id).join(', ')}</remaining>`,
            '</chaining-waiting>',
          ].join('\n'));
        }
      } else if (completedDispatch && !completedDispatch.parallel_group) {
        // Sequential dispatch completed, check for next phase
        let chainedViaWorkflow = false;
        const nextPhaseDispatches = getNextPhaseDispatches(
          ecosystemRoot, queue.workflow, completedDispatch.phase_id, offerPath
        );

        if (nextPhaseDispatches.length > 0) {
          queue = queueManager.addDispatches(offerPath, queue.workflow, nextPhaseDispatches);
          results.push([
            '<chaining-update>',
            `  <completed-phase>${completedDispatch.phase_id}</completed-phase>`,
            `  <queued-next count="${nextPhaseDispatches.length}" agents="${nextPhaseDispatches.map(d => d.agent_id).join(', ')}" />`,
            '</chaining-update>',
          ].join('\n'));
          chainedViaWorkflow = true;
        }

        // === FALLBACK: AGENT_NEXT_MAP chaining for manual launches ===
        // When no workflow YAML exists (manual Agent() call), use the static
        // AGENT_NEXT_MAP to queue the next agent. This closes the gap between
        // manual launches and the workflow-based chaining system.
        if (!chainedViaWorkflow && agentId && AGENT_NEXT_MAP[agentId]) {
          const nextAgentId = AGENT_NEXT_MAP[agentId];
          const nextModel = AGENT_MODELS[nextAgentId] || 'sonnet';

          // Verify required artifacts exist before chaining
          const artifactsOk = verifyArtifacts(agentId, offerPath, ecosystemRoot);

          if (artifactsOk) {
            const nextPrompt = buildChainPrompt(nextAgentId, agentId, offerPath);
            const fallbackDispatch = {
              phase_id: `chain-${agentId}-${nextAgentId}-${Date.now()}`,
              agent_id: nextAgentId,
              model: nextModel,
              prompt: nextPrompt,
              expected_outputs: (AGENT_ARTIFACTS[nextAgentId] || []).map(a => a.path),
              source: 'map-chaining',
            };

            queue = queueManager.addDispatches(offerPath, queue.workflow || 'manual', [fallbackDispatch]);
            results.push([
              '<map-chaining>',
              `  <completed-agent>${agentId}</completed-agent>`,
              `  <next-agent>${nextAgentId}</next-agent>`,
              `  <model>${nextModel}</model>`,
              `  <artifacts-verified>true</artifacts-verified>`,
              `  <source>AGENT_NEXT_MAP fallback (no workflow context)</source>`,
              '</map-chaining>',
            ].join('\n'));
          } else {
            results.push([
              '<map-chaining-blocked>',
              `  <completed-agent>${agentId}</completed-agent>`,
              `  <next-agent>${AGENT_NEXT_MAP[agentId]}</next-agent>`,
              `  <reason>Required artifacts not found — chaining blocked</reason>`,
              '</map-chaining-blocked>',
            ].join('\n'));
          }
        }
      }

      // === GAP 3: Dispatch-request ingestion ===
      const dispatchRequestPath = path.join(ecosystemRoot, offerPath, '.aios', 'dispatch-request.yaml');
      if (fs.existsSync(dispatchRequestPath)) {
        try {
          const requestContent = yaml.load(fs.readFileSync(dispatchRequestPath, 'utf8'));
          const requests = requestContent?.requests || [];
          const requestingAgent = requestContent?.requesting_agent || agentId;

          const delegationDispatches = [];
          for (const req of requests) {
            // Cycle detection
            if (queueManager.detectCycle(queue, requestingAgent, req.agent)) {
              results.push(`<delegation-refused agent="${req.agent}" reason="cycle-detected" />`);
              continue;
            }

            delegationDispatches.push({
              phase_id: `delegation-${requestingAgent}-${req.agent}`,
              agent_id: req.agent,
              model: req.model || 'sonnet',
              prompt: buildDelegationPrompt(req, offerPath),
              expected_outputs: req.expected_output ? [req.expected_output] : [],
              source: 'delegation',
              requesting_agent: requestingAgent,
            });
          }

          if (delegationDispatches.length > 0) {
            queue = queueManager.addDispatches(offerPath, queue.workflow, delegationDispatches);
            results.push([
              '<delegation-ingested>',
              `  <from>${requestingAgent}</from>`,
              `  <requests count="${delegationDispatches.length}" agents="${delegationDispatches.map(d => d.agent_id).join(', ')}" />`,
              '</delegation-ingested>',
            ].join('\n'));
          }

          // Rename to .processed
          const processedPath = dispatchRequestPath.replace('.yaml', `.processed-${Date.now()}.yaml`);
          fs.renameSync(dispatchRequestPath, processedPath);
        } catch (reqError) {
          results.push(`<delegation-error>${reqError.message}</delegation-error>`);
        }
      }

      // Save updated queue
      queueManager.saveQueueSync(offerPath, queue);
      } // end else (agent succeeded path)
    }
  } catch (queueError) {
    results.push(`<queue-error>${queueError.message}</queue-error>`);
  }

  // === PLAN UPDATE: Mark task completed in execution plan ===
  try {
    updateExecutionPlan(agentId, offerPath, ecosystemRoot);
  } catch { /* non-critical */ }

  // === GAP 4: Write execution log ===
  try {
    writeExecutionLog(agentId, offerPath, context);
  } catch { /* non-critical */ }

  // Output combined context
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      additionalContext: results.join('\n'),
    },
  }));
}

/**
 * Update execution plan when an agent completes.
 * Finds the task matching the agent, verifies outputs, marks completed, advances pointer.
 */
function updateExecutionPlan(agentId, offerPath, ecosystemRoot) {
  const aiosCoreDir = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');
  const planPath = path.join(ecosystemRoot, offerPath, '.aios', 'execution-plan.yaml');
  if (!fs.existsSync(planPath)) return;

  let plan;
  try { plan = yaml.load(fs.readFileSync(planPath, 'utf8')); } catch { return; }
  if (!plan || plan.status !== 'executing') return;

  const { PlanStateMachine } = require(path.join(aiosCoreDir, 'plan', 'plan-state-machine'));
  const { PlanVerification } = require(path.join(aiosCoreDir, 'plan', 'plan-verification'));
  const { ExecutionPlanGenerator } = require(path.join(aiosCoreDir, 'plan', 'execution-plan-generator'));

  const sm = new PlanStateMachine(ecosystemRoot);
  const pv = new PlanVerification(ecosystemRoot);
  const gen = new ExecutionPlanGenerator(ecosystemRoot);

  // Find task(s) for this agent that are dispatched
  const agentTasks = plan.tasks.filter(t =>
    t.agent === agentId && (t.status === 'dispatched' || t.status === 'pending')
  );

  let changed = false;
  for (const task of agentTasks) {
    // Verify outputs if verification rule exists
    const result = pv.verify(task, offerPath);
    if (result.verified || !task.verification) {
      sm.advanceTask(plan, task.id, `Agent ${agentId} completed. ${result.reason || ''}`);
      changed = true;
    }
  }

  if (changed) {
    gen.save(offerPath, plan);
  }
}

/**
 * Get next phase dispatches from workflow YAML.
 */
function getNextPhaseDispatches(ecosystemRoot, workflowId, completedPhaseId, offerPath) {
  try {
    const workflowPath = path.join(ecosystemRoot, 'squads', 'copy-chief', 'workflows', `${workflowId}.yaml`);
    if (!fs.existsSync(workflowPath)) return [];

    const content = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
    const phases = content?.workflow?.phases || [];

    // Find phases that depend on the completed phase
    const nextPhases = phases.filter(p => {
      const deps = p.depends_on || [];
      return deps.includes(completedPhaseId);
    });

    if (nextPhases.length === 0) return [];

    // Build dispatch entries using CopyPromptBuilder
    const { CopyPromptBuilder } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'execution', 'copy-prompt-builder')
    );
    const promptBuilder = new CopyPromptBuilder(ecosystemRoot);

    const dispatches = [];
    for (const phase of nextPhases) {
      // Skip human_gate phases
      if (phase.human_gate) continue;

      const payloads = promptBuilder.buildDispatchPayload(phase, offerPath);
      for (const payload of payloads) {
        dispatches.push({
          phase_id: phase.id,
          agent_id: payload.agentId,
          model: payload.model,
          parallel_group: phase.parallel ? phase.id : null,
          prompt: payload.prompt,
          expected_outputs: payload.expectedOutputs || [],
          source: 'chaining',
        });
      }
    }

    return dispatches;
  } catch {
    return [];
  }
}

/**
 * Build a prompt for delegated sub-tasks.
 */
function buildDelegationPrompt(request, offerPath) {
  const parts = [
    `You are ${request.agent} (@${request.agent}).`,
    `Read your instructions: ~/.claude/agents/${request.agent}.md`,
    '',
    `TASK: ${request.task}`,
    `OFFER: ${offerPath} at ~/copywriting-ecosystem/${offerPath}/`,
    '',
    'This is a DELEGATED sub-task. Focus on the specific task above.',
  ];

  if (request.expected_output) {
    parts.push(`EXPECTED OUTPUT: ${request.expected_output}`);
  }

  parts.push('', 'Write outputs to files. Return YAML summary.');
  return parts.join('\n');
}

/**
 * Write execution log entry for the completed agent.
 */
function writeExecutionLog(agentId, offerPath, context) {
  const memoryDir = path.join(process.env.HOME, '.claude', 'agent-memory', agentId);
  fs.mkdirSync(memoryDir, { recursive: true });

  const logPath = path.join(memoryDir, 'execution-log.yaml');
  let log = [];

  if (fs.existsSync(logPath)) {
    try {
      log = yaml.load(fs.readFileSync(logPath, 'utf8')) || [];
    } catch { log = []; }
  }

  if (!Array.isArray(log)) log = [];

  // Add new entry
  log.unshift({
    timestamp: new Date().toISOString(),
    offer: offerPath,
    task: (context.description || '').slice(0, 200),
    result: context.result ? 'success' : 'unknown',
    duration_hint: context.duration || null,
  });

  // Cap at 30 entries
  if (log.length > 30) log = log.slice(0, 30);

  fs.writeFileSync(logPath, yaml.dump(log, { lineWidth: 120 }), 'utf8');
}

const AGENT_MODELS = {
  vox: 'sonnet',
  cipher: 'sonnet',
  atlas: 'opus',
  echo: 'opus',
  forge: 'sonnet',
  scout: 'sonnet',
  blade: 'sonnet',
  hawk: 'sonnet',
  sentinel: 'sonnet',
  ops: 'sonnet',
  strategist: 'opus',
};

/**
 * Verify that an agent's required artifacts exist before chaining.
 */
function verifyArtifacts(agentId, offerPath, ecosystemRoot) {
  const artifacts = AGENT_ARTIFACTS[agentId] || [];
  const requiredArtifacts = artifacts.filter(a => a.required);
  if (requiredArtifacts.length === 0) return true;

  const fullOfferPath = path.join(ecosystemRoot, offerPath);

  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(fullOfferPath, artifact.path);
    if (!fs.existsSync(artifactPath)) return false;
    // For directories, check they're not empty
    try {
      const stats = fs.statSync(artifactPath);
      if (stats.isDirectory()) {
        const entries = fs.readdirSync(artifactPath);
        if (entries.length === 0) return false;
      }
    } catch { return false; }
  }
  return true;
}

/**
 * Build AIOS-compliant prompt for the next agent in the chain.
 */
function buildChainPrompt(nextAgentId, fromAgentId, offerPath) {
  const parts = [
    `You are ${nextAgentId} (@${nextAgentId}).`,
    `Read your instructions: ~/.claude/agents/${nextAgentId}.md`,
    '',
    `TASK: Continue pipeline after ${fromAgentId} completed`,
    `OFFER: ${offerPath} at ~/copywriting-ecosystem/${offerPath}/`,
    '',
    `Previous agent @${fromAgentId} has completed their work.`,
    'Read the available research/briefing outputs and continue the pipeline.',
    '',
    'Write outputs to files. Return YAML summary.',
  ];
  return parts.join('\n');
}

function detectAgentId(prompt) {
  const lower = prompt.toLowerCase();
  for (const agent of KNOWN_AGENTS) {
    if (lower.includes(`you are ${agent}`) ||
        lower.includes(`@${agent}`) ||
        lower.includes(`agents/${agent}.md`)) {
      return agent;
    }
  }
  // Match description prefix: "Scout: task description" or "scout: task"
  for (const agent of KNOWN_AGENTS) {
    if (lower.startsWith(`${agent}:`) || lower.startsWith(`${agent} `)) {
      return agent;
    }
  }
  return null;
}

function detectOfferPath(prompt) {
  const offerMatch = prompt.match(/(?:OFFER|offer|oferta)[:\s]+(?:~\/copywriting-ecosystem\/)?([a-z-]+\/[a-z-]+)/i);
  if (offerMatch) return offerMatch[1];

  const pathMatch = prompt.match(/\b(saude|relacionamento|concursos|financeiro|educacao)\/([a-z][a-z0-9-]+)\b/);
  if (pathMatch) return `${pathMatch[1]}/${pathMatch[2]}`;

  return null;
}

main().catch(() => {
  process.exit(0);
});
