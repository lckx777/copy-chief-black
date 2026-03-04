'use strict';

/**
 * Agent Activation Hook
 * Event: SubagentStart
 * Budget: <500ms
 *
 * Auto-loads persona + dependencies + offer context when an agent is spawned.
 */

const path = require('path');
const fs = require('fs');

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

  // Extract agent ID from the prompt or description
  const prompt = context.prompt || context.description || '';
  const agentId = detectAgentId(prompt);

  if (!agentId) {
    // Not a Copy Squad agent — skip activation
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // === LINT: Validate AIOS Launch Pattern compliance ===
  const promptLintWarnings = lintPromptFormat(prompt, agentId);
  const hasLintWarnings = promptLintWarnings.length > 0;

  // === GATE: Block Copy Squad agents with wrong subagent_type ===
  // AIOS principle: LLM is CPU, system enforces constraints deterministically.
  // Copy Squad agents REQUIRE general-purpose for MCP access (Apify, Firecrawl, Playwright).
  // Any other subagent_type = silent fallback to WebSearch = broken VOC extraction.
  const agentType = context.agent_type || '';
  if (agentType && agentType !== 'general-purpose') {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: [
        `<subagent-type-gate>`,
        `  <blocked-agent>${agentId}</blocked-agent>`,
        `  <used-type>${agentType}</used-type>`,
        `  <required-type>general-purpose</required-type>`,
        `  <reason>Copy Squad agents REQUIRE subagent_type="general-purpose" for MCP access.`,
        `    Type "${agentType}" does not have ToolSearch → no Apify/Firecrawl/Playwright → 100% WebSearch fallback.</reason>`,
        `  <fix>Re-launch with: Agent(subagent_type: "general-purpose", model: "${context.model || 'sonnet'}", ...)</fix>`,
        `</subagent-type-gate>`,
      ].join('\n'),
    }));
    return;
  }

  // Detect offer path from prompt
  const offerPath = detectOfferPath(prompt);

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  try {
    const { AgentActivationPipeline } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'activation', 'agent-activation-pipeline')
    );

    const pipeline = new AgentActivationPipeline(ecosystemRoot, { debug: false });
    const result = pipeline.activate(agentId, offerPath);

    // Write active persona to SET (not single marker) for production-delegation-gate
    // Fixes race condition: parallel agents no longer overwrite each other
    try {
      const stateDir = path.join(process.env.HOME, '.claude', 'session-state');
      fs.mkdirSync(stateDir, { recursive: true });
      const setPath = path.join(stateDir, 'active-agents.json');

      // Read existing set
      let agentSet = {};
      try {
        if (fs.existsSync(setPath)) {
          agentSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
        }
      } catch { agentSet = {}; }

      // Extract task description from prompt (flexible format)
      const taskDesc = extractTaskDescription(prompt);

      // Add this agent to the set
      agentSet[agentId] = {
        offer: offerPath || null,
        task: taskDesc,
        timestamp: new Date().toISOString(),
        activatedAt: Date.now(),
      };

      fs.writeFileSync(setPath, JSON.stringify(agentSet, null, 2));

      // Also write single marker for backwards compat (last-write-wins, same as before)
      const markerPath = path.join(stateDir, 'active-persona.json');
      fs.writeFileSync(markerPath, JSON.stringify({
        persona: agentId,
        offer: offerPath || null,
        timestamp: new Date().toISOString(),
        activatedAt: Date.now(),
      }, null, 2));
    } catch { /* non-critical — delegation gate will fail-open */ }

    // Close dispatch loop — mark pending dispatch as "dispatched" or CREATE one
    try {
      const { DispatchQueueManager } = require(
        path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'dispatch', 'dispatch-queue-manager')
      );
      const queueManager = new DispatchQueueManager(ecosystemRoot);
      const targetPath = offerPath || null;

      if (targetPath) {
        let queue = queueManager.loadQueue(targetPath);
        let matched = false;

        if (queue) {
          const dispatch = queue.queue.find(d => d.agent_id === agentId && d.status === 'pending');
          if (dispatch) {
            queueManager.markDispatched(queue, dispatch.id);
            queueManager.saveQueueSync(targetPath, queue);
            matched = true;
          }
        }

        // No existing entry — create one so dashboard Task Board always reflects work
        if (!matched) {
          const taskSummary = extractTaskDescription(prompt) || `${agentId} activated`;
          const newDispatch = {
            phase_id: `live-${agentId}-${Date.now()}`,
            agent_id: agentId,
            model: context.model || 'sonnet',
            prompt: taskSummary,
            expected_outputs: [],
            source: 'agent-activation',
          };

          queue = queueManager.addDispatches(targetPath, 'live', [newDispatch]);
          // Mark immediately as dispatched (agent is already running)
          const added = queue.queue.find(
            d => d.agent_id === agentId && d.status === 'pending' && d.source === 'agent-activation'
          );
          if (added) queueManager.markDispatched(queue, added.id);
          queueManager.saveQueueSync(targetPath, queue);
        }
      } else {
        // No offer path — try existing queues
        const searchPaths = findAllOfferPaths(ecosystemRoot);
        for (const rel of searchPaths) {
          const queue = queueManager.loadQueue(rel);
          if (!queue) continue;
          const dispatch = queue.queue.find(d => d.agent_id === agentId && d.status === 'pending');
          if (dispatch) {
            queueManager.markDispatched(queue, dispatch.id);
            queueManager.saveQueueSync(rel, queue);
            break;
          }
        }
      }
    } catch { /* best effort — dispatch loop closure is non-critical */ }

    // Emit dashboard event (fire-and-forget)
    try {
      const dashUrl = process.env.DASHBOARD_URL || 'http://localhost:4001';
      const taskDescForEvent = extractTaskDescription(prompt);
      fetch(`${dashUrl}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'AgentStart',
          timestamp: Date.now(),
          agent_id: agentId,
          offer: offerPath || null,
          task: taskDescForEvent || null,
        }),
        signal: AbortSignal.timeout(1000),
      }).catch(() => {});
    } catch { /* non-critical */ }

    // Inject lint warnings into context so agent + dashboard see them
    let contextWithLint = result.context;
    if (hasLintWarnings) {
      const lintXml = [
        '<launch-pattern-lint status="WARN">',
        ...promptLintWarnings.map(w => `  <warning>${w}</warning>`),
        '  <fix>Use AIOS Launch Pattern: "You are NAME (@handle).\\nRead your instructions: ~/.claude/agents/{name}.md\\nTASK: [task]\\nOFFER: {niche}/{offer} at ~/copywriting-ecosystem/{niche}/{offer}/"</fix>',
        '</launch-pattern-lint>',
      ].join('\n');
      contextWithLint = lintXml + '\n' + contextWithLint;
    }

    const output = {
      hookSpecificOutput: {
        additionalContext: contextWithLint,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (error) {
    // Graceful degradation
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        additionalContext: `<agent-activation><error>${error.message}</error></agent-activation>`,
      },
    }));
  }
}

const KNOWN_AGENTS = ['vox', 'cipher', 'atlas', 'echo', 'forge', 'scout', 'blade', 'hawk', 'sentinel', 'ops', 'strategist'];

/**
 * Lint the agent prompt against AIOS Launch Pattern.
 * Returns array of warning strings (empty = compliant).
 *
 * Required pattern:
 *   You are NAME (@handle).
 *   Read your instructions: ~/.claude/agents/{name}.md
 *   TASK: [specific task]
 *   OFFER: {niche}/{offer} at ~/copywriting-ecosystem/{niche}/{offer}/
 */
function lintPromptFormat(prompt, detectedAgentId) {
  const warnings = [];

  // Check 1: "Read your instructions" line present
  const hasReadInstructions = /read your instructions:\s*~?\/?\.?claude\/agents\/\w+\.md/i.test(prompt);
  if (!hasReadInstructions) {
    warnings.push(`Missing "Read your instructions: ~/.claude/agents/${detectedAgentId}.md" — agent won't load its own persona file. Hook injects context but agent self-reading is the AIOS standard.`);
  }

  // Check 2: TASK: format (not ## TASK or other variants)
  const hasTaskColon = /^TASK:\s*.+/m.test(prompt);
  if (!hasTaskColon) {
    // Check for common deviations
    const hasTaskHeader = /##\s*TASK/i.test(prompt);
    if (hasTaskHeader) {
      warnings.push('TASK uses markdown header "## TASK" instead of "TASK: [description]" — hook regex cannot extract task description for dashboard/dispatch queue.');
    } else {
      warnings.push('Missing "TASK: [description]" line — hook cannot extract task for tracking.');
    }
  }

  // Check 3: OFFER: format with niche/offer path
  const hasOfferFormat = /^OFFER:\s*\S+/m.test(prompt);
  if (!hasOfferFormat) {
    warnings.push('Missing "OFFER: {niche}/{offer} at ~/copywriting-ecosystem/..." — offer detection relies on fallback regex.');
  }

  return warnings;
}

function detectAgentId(prompt) {
  const lower = prompt.toLowerCase();

  // Check for explicit "You are NAME" pattern
  const youAreMatch = lower.match(/you are (\w+)/);
  if (youAreMatch && KNOWN_AGENTS.includes(youAreMatch[1])) {
    return youAreMatch[1];
  }

  // Check for @handle pattern
  const handleMatch = lower.match(/@(\w+)/);
  if (handleMatch && KNOWN_AGENTS.includes(handleMatch[1])) {
    return handleMatch[1];
  }

  // Check for agent name in prompt
  for (const agent of KNOWN_AGENTS) {
    if (lower.includes(`agents/${agent}.md`) || lower.includes(`agent: ${agent}`)) {
      return agent;
    }
  }

  return null;
}

function findAllOfferPaths(ecosystemRoot) {
  const niches = ['saude', 'relacionamento', 'concursos', 'financeiro', 'educacao'];
  const paths = [];
  for (const niche of niches) {
    const nichePath = path.join(ecosystemRoot, niche);
    if (!fs.existsSync(nichePath)) continue;
    try {
      const dirs = fs.readdirSync(nichePath, { withFileTypes: true });
      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        const queuePath = path.join(nichePath, dir.name, '.aios', 'dispatch-queue.yaml');
        if (fs.existsSync(queuePath)) {
          paths.push(`${niche}/${dir.name}`);
        }
      }
    } catch { /* skip */ }
  }
  return paths;
}

/**
 * Extract task description from prompt — flexible format support.
 * Priority: "TASK: xxx" > "## TASK\nxxx" > description field > first line after identity
 */
function extractTaskDescription(prompt) {
  // Format 1: TASK: [description] (AIOS standard)
  const taskColon = prompt.match(/^TASK:\s*(.+?)(?:\n|$)/mi);
  if (taskColon) return taskColon[1].trim();

  // Format 2: ## TASK\n[description] (markdown variant)
  const taskHeader = prompt.match(/##\s*TASK\s*\n+(.+?)(?:\n|$)/i);
  if (taskHeader) return taskHeader[1].trim();

  // Format 3: "Extract" / "Produce" / "Validate" imperative at start of a line
  const imperative = prompt.match(/^(Extract|Produce|Validate|Create|Generate|Analyze|Write|Build|Research)\s+(.{10,80}?)(?:\.|$)/mi);
  if (imperative) return `${imperative[1]} ${imperative[2]}`.trim();

  return null;
}

function detectOfferPath(prompt) {
  // Match patterns like "saude/florayla" or "relacionamento/quimica-amarracao"
  const offerMatch = prompt.match(/(?:OFFER|offer|oferta)[:\s]+(?:~\/copywriting-ecosystem\/)?([a-z-]+\/[a-z-]+)/i);
  if (offerMatch) return offerMatch[1];

  // Match niche/offer pattern directly
  const pathMatch = prompt.match(/\b(saude|relacionamento|concursos|financeiro|educacao)\/([a-z][a-z0-9-]+)\b/);
  if (pathMatch) return `${pathMatch[1]}/${pathMatch[2]}`;

  return null;
}

main().catch(err => {
  process.stderr.write(`[agent-activation-hook] Fatal: ${err.message}\n`);
  process.exit(0);
});
