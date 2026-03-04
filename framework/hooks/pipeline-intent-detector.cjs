'use strict';

/**
 * Pipeline Intent Detector
 * Event: UserPromptSubmit
 * Budget: <5s
 *
 * Detects pipeline execution intent from user prompt.
 * When detected, populates dispatch-queue.yaml for the active offer.
 * Gap 1: Auto-Dispatch
 *
 * Two detection paths:
 * 1. Pipeline-level: "executa production" -> full workflow dispatch
 * 2. Task-level: "bater controle do AD03" -> single agent dispatch
 */

const fs = require('fs');
const path = require('path');

const yaml = require('js-yaml');

const INTENT_PATTERNS = [
  /\b(go|execute|start|run|launch)\b.*\b(pipeline|production|research|briefing|review)\b/i,
  /\b(avanca|executa|continua|inicia|roda)\b.*\b(pipeline|producao|pesquisa|briefing|revisao)\b/i,
  /\b(continua|continue)\s+(pipeline|offer|oferta)\b/i,
  /\b(execute|executa)\s+(tudo|all|everything)\b/i,
  /^(go|vai|avanca|executa)$/i,
  /\b(start|begin|kick[- ]?off)\s+(the\s+)?pipeline\b/i,
  /\bproduz(ir|a)?\s+(tudo|copy|vsl|lp|criativos|emails)\b/i,
];

// U-21: Enhanced intent patterns for switch/abort/restart/status
const SWITCH_PATTERNS = [
  /\bswitch\s+to\s+(\w[\w-]*)\b/i,
  /\bmuda(?:r)?\s+para\s+(\w[\w-]*)\b/i,
  /\btrocar?\s+para\s+(\w[\w-]*)\b/i,
  /\bmudar?\s+oferta?\s+para\s+(\w[\w-]*)\b/i,
];

const ABORT_PATTERNS = [
  /^abort$/i,
  /^cancela\s*tudo$/i,
  /^cancela$/i,
  /\bstop\s+all\b/i,
  /\babort\s+all\b/i,
  /\bcancela\s+tudo\b/i,
];

const RESTART_PATTERNS = [
  /^restart$/i,
  /\brestart\s+(\w[\w-]*)\b/i,
  /^recome[cç]a$/i,
  /\brecome[cç]a\s+(\w[\w-]*)\b/i,
];

const STATUS_PATTERNS = [
  /^status$/i,
  /^como\s+est[aá]$/i,
  /\bwhat[''']?s\s+the\s+status\b/i,
  /\bstatus\s+da\s+oferta\b/i,
  /\bcomo\s+est[aá]\s+(a\s+)?(oferta|pipeline)\b/i,
];

// Patterns for plan control commands
const PLAN_ADVANCE_PATTERNS = [
  /^(go|approved|aprovado|done|feito|ok|avanca|continua)$/i,
  /\b(approved|aprovado)\b/i,
];

const PLAN_ABANDON_PATTERNS = [
  /\b(skip\s*plan|abandona\s*plano|cancel\s*plan|cancela\s*plano)\b/i,
];

const TASK_PATTERNS = [
  { pattern: /\bbat(er|a|endo)?\s+controle\b/i, agent: 'scout', task: 'beat-control', title: 'Beat Control de Criativo' },
  { pattern: /\bcri(ar|e|a|ando)?\s+(criativo|ad|anuncio|anúncio)\b/i, agent: 'scout', task: 'create-creative', title: 'Criar Criativo' },
  { pattern: /\botimiz(ar|e|a|ando)?\s+(lead|bloco|abertura)\b/i, agent: 'echo', task: 'optimize-block', title: 'Otimizar Bloco de VSL' },
  { pattern: /\b(escrever|escrev(a|e|endo)?|produz(ir|a|indo)?)\s+(vsl|capitulo|capítulo)\b/i, agent: 'echo', task: 'produce-vsl', title: 'Produzir VSL' },
  { pattern: /\bmont(ar|e|a|ando)?\s+(lp|landing\s*page|pagina|página)\b/i, agent: 'forge', task: 'produce-lp', title: 'Produzir Landing Page' },
  { pattern: /\bprepar(ar|e|a|ando)?\s+(emails?|sequencia|sequência)\b/i, agent: 'blade', task: 'produce-emails', title: 'Produzir Emails' },
  { pattern: /\brevis(ar|e|a|ando)?\s+(copy|texto|entrega)\b|\breview\s+copy\b/i, agent: 'hawk', task: 'review', title: 'Revisar Copy' },
  // Research: stems without trailing \b to match PT-BR inflections (extrair, vocs, pesquisar, etc)
  // Group 1 stems: pesquis(ar/a/ando), research, voc(s), extrai(r/ndo), avatar, colet(ar/a), apify
  // Group 2 targets: publico, audiencia, avatar, voc(s), dores, mercado, quotes, comentarios, plataforma(s), organico(s/as)
  { pattern: /\b(pesquis|research|voc\b|vocs\b|extrai|avatar|colet|apify)\w*.*\b(public|audienc|avatar|voc\b|vocs\b|dor|mercad|quote|comentar|plataform|organic|desejos?|obje[cç][oõ])\w*/i, agent: 'vox', task: 'research', title: 'Pesquisa de Audiencia' },
  { pattern: /\b(briefing|helix|preparar?\s+briefing)\b/i, agent: 'atlas', task: 'briefing', title: 'Briefing HELIX' },
];

/**
 * _detectIntent — U-21 Enhanced Intent Detection
 *
 * Detects structured intents from user messages:
 *   - switch_offer: "switch to {offer}", "muda para {offer}"
 *   - abort:        "abort", "cancela", "cancela tudo", "stop all"
 *   - restart:      "restart", "recomeça", "restart {phase}"
 *   - status:       "status", "como está", "what's the status"
 *   - pipeline:     existing pipeline execution patterns
 *
 * Returns { type, offer?, phase? } or null if no structured intent found.
 * Exported for testing.
 *
 * @param {string} message Raw user message
 * @returns {{ type: string, offer?: string, phase?: string } | null}
 */
function _detectIntent(message) {
  if (!message || typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (trimmed.length > 500) return null;

  // switch_offer
  for (const pattern of SWITCH_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'switch_offer', offer: match[1] || null };
    }
  }

  // abort
  for (const pattern of ABORT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: 'abort' };
    }
  }

  // restart
  for (const pattern of RESTART_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return { type: 'restart', phase: match[1] || null };
    }
  }

  // status
  for (const pattern of STATUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { type: 'status' };
    }
  }

  return null;
}

function detectIntent(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const trimmed = prompt.trim();
  if (trimmed.length > 1000) return null;

  for (const pattern of INTENT_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return null;
}

function detectTaskIntent(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const trimmed = prompt.trim();
  if (trimmed.length > 1000) return null;

  for (const entry of TASK_PATTERNS) {
    if (entry.pattern.test(trimmed)) {
      return { ...entry };
    }
  }
  return null;
}

function findActiveOffer(ecosystemRoot) {
  // Dynamic scan: find ALL directories with helix-state.yaml + CONTEXT.md (canonical offer marker)
  // Filters out UUID dirs, hidden dirs, and non-offer locations
  const UUID_RE = /^[0-9a-f]{8}-/;
  const SKIP_DIRS = new Set(['docs', 'scripts', 'site', 'export', 'knowledge', 'squads',
    'squad-prompts', 'metodologias-de-copy', 'pesquisas-setup', 'copy-chief-tutorial', 'research']);
  const offers = [];

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
          const offerDir = path.join(nichePath, dir.name);
          const helixPath = path.join(offerDir, 'helix-state.yaml');
          const contextPath = path.join(offerDir, 'CONTEXT.md');
          // Require BOTH helix-state.yaml AND CONTEXT.md for a valid offer
          if (!fs.existsSync(helixPath) || !fs.existsSync(contextPath)) continue;

          try {
            const _yaml = yaml; // already required at top
            const state = yaml.load(fs.readFileSync(helixPath, 'utf8'));
            const phase = state?.current_phase || state?.phase || 'idle';
            if (phase !== 'delivered' && phase !== 'standby') {
              offers.push({
                relativePath: `${topDir.name}/${dir.name}`,
                phase,
                state,
              });
            }
          } catch { /* skip corrupt files */ }
        }
      } catch { /* skip non-readable dirs */ }
    }
  } catch { /* skip */ }

  // Return the most active offer (prefer in-progress over idle)
  const priorityOrder = ['production', 'review', 'briefing', 'research', 'idle'];
  offers.sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.phase);
    const bIdx = priorityOrder.indexOf(b.phase);
    return aIdx - bIdx;
  });

  return offers[0] || null;
}

function handlePipelineIntent(offer, ecosystemRoot) {
  const { DispatchQueueManager } = require(
    path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'dispatch', 'dispatch-queue-manager')
  );
  const { CopyWorkflowExecutor } = require(
    path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'execution', 'copy-workflow-executor')
  );

  // Determine which workflow to use based on offer phase
  const WORKFLOW_MAP = {
    idle: 'research-pipeline',
    research: 'research-pipeline',
    briefing: 'briefing-pipeline',
    production: 'production-pipeline',
    review: 'review-pipeline',
  };

  const workflowId = WORKFLOW_MAP[offer.phase.toLowerCase()] || 'research-pipeline';
  const workflowPath = path.join(ecosystemRoot, 'squads', 'copy-chief', 'workflows', `${workflowId}.yaml`);

  if (!fs.existsSync(workflowPath)) {
    return null;
  }

  const executor = new CopyWorkflowExecutor(workflowPath, { ecosystemRoot });
  executor.loadWorkflow();

  // Build dispatch entries from the first actionable phase
  const queueManager = new DispatchQueueManager(ecosystemRoot);
  const { CopyPromptBuilder } = require(
    path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'execution', 'copy-prompt-builder')
  );
  const promptBuilder = new CopyPromptBuilder(ecosystemRoot);

  // Load full workflow YAML for phase data
  const workflowContent = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
  const workflowPhases = workflowContent?.workflow?.phases || [];

  // Only populate first actionable phase group (rest chained via handoff)
  const dispatches = [];
  let firstGroupId = null;

  for (const phase of workflowPhases) {
    if (phase.human_gate) continue;

    const groupId = phase.parallel ? phase.id : `seq-${phase.id}`;
    if (firstGroupId && groupId !== firstGroupId) break;
    firstGroupId = groupId;

    const payloads = promptBuilder.buildDispatchPayload(phase, offer.relativePath);

    for (const payload of payloads) {
      dispatches.push({
        phase_id: phase.id,
        agent_id: payload.agentId,
        model: payload.model,
        parallel_group: phase.parallel ? phase.id : null,
        prompt: payload.prompt,
        expected_outputs: payload.expectedOutputs || [],
        source: 'pipeline',
      });
    }
  }

  if (dispatches.length === 0) return null;

  const queue = queueManager.createQueue(offer.relativePath, workflowId, dispatches);
  queueManager.saveQueueSync(offer.relativePath, queue);

  const summary = queueManager.getSummary(queue);
  const agentList = dispatches.map(d => d.agent_id).join(', ');

  return {
    hookSpecificOutput: {
      additionalContext: [
        '<pipeline-intent-detected>',
        `  <offer>${offer.relativePath}</offer>`,
        `  <phase>${offer.phase}</phase>`,
        `  <workflow>${workflowId}</workflow>`,
        `  <dispatches count="${summary.pending}" agents="${agentList}" />`,
        '  <instruction>Dispatch queue populated. Pipeline enforcer will guide execution.</instruction>',
        '</pipeline-intent-detected>',
      ].join('\n'),
    },
  };
}

function handleTaskIntent(taskMatch, offer, ecosystemRoot, userPrompt) {
  const { DispatchQueueManager } = require(
    path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'dispatch', 'dispatch-queue-manager')
  );
  const { CopyPromptBuilder } = require(
    path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'execution', 'copy-prompt-builder')
  );

  const promptBuilder = new CopyPromptBuilder(ecosystemRoot);
  const queueManager = new DispatchQueueManager(ecosystemRoot);

  // Build synthetic phase matching the contract CopyPromptBuilder expects
  const syntheticPhase = {
    id: `task-${taskMatch.task}`,
    title: taskMatch.title,
    agents: [taskMatch.agent],
    tasks: [taskMatch.task],
    handoff_prompt: `USER REQUEST: ${userPrompt.trim()}`,
  };

  // Build 7-layer prompt via CopyPromptBuilder
  const payloads = promptBuilder.buildDispatchPayload(syntheticPhase, offer.relativePath);
  if (!payloads || payloads.length === 0) return null;

  const payload = payloads[0];

  // Append the user's original request to the prompt
  const fullPrompt = payload.prompt + `\n\nUSER REQUEST: ${userPrompt.trim()}`;

  // Create dispatch queue entry
  const dispatches = [{
    phase_id: syntheticPhase.id,
    agent_id: taskMatch.agent,
    model: payload.model,
    parallel_group: null,
    prompt: fullPrompt,
    expected_outputs: payload.expectedOutputs || [],
    source: 'task-intent',
  }];

  const queue = queueManager.createQueue(offer.relativePath, `task-${taskMatch.task}`, dispatches);
  queueManager.saveQueueSync(offer.relativePath, queue);

  // Build Agent() call for additionalContext
  const agentCall = [
    `Agent(`,
    `  description: "${capitalize(taskMatch.agent)}: ${taskMatch.task}",`,
    `  subagent_type: "general-purpose",`,
    `  model: "${payload.model}",`,
    `  prompt: "<see full-prompt below>"`,
    `)`,
  ].join('\n');

  return {
    hookSpecificOutput: {
      additionalContext: [
        '<task-dispatch>',
        `  <offer>${offer.relativePath}</offer>`,
        `  <agent>${taskMatch.agent}</agent>`,
        `  <model>${payload.model}</model>`,
        `  <task>${taskMatch.task}</task>`,
        '  <dispatch-instruction>',
        '    OBRIGATORIO: Dispatch o agente abaixo usando Agent() tool.',
        '    Nao faca o trabalho manualmente.',
        '  </dispatch-instruction>',
        `  <agent-call description="${capitalize(taskMatch.agent)}: ${taskMatch.task}"`,
        `    subagent_type="general-purpose" model="${payload.model}">`,
        `    ${agentCall}`,
        '  </agent-call>',
        '  <full-prompt>',
        `    ${fullPrompt}`,
        '  </full-prompt>',
        '</task-dispatch>',
      ].join('\n'),
    },
  };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Find active execution plan across all offers.
 * Returns { offerPath, plan } or null.
 */
function findActivePlan(ecosystemRoot) {
  const UUID_RE = /^[0-9a-f]{8}-/;
  const SKIP_DIRS = new Set(['docs', 'scripts', 'site', 'export', 'knowledge', 'squads',
    'squad-prompts', 'metodologias-de-copy', 'pesquisas-setup', 'copy-chief-tutorial', 'research']);

  try {
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
        if (fs.existsSync(planPath)) {
          try {
            const plan = yaml.load(fs.readFileSync(planPath, 'utf8'));
            if (plan && plan.status === 'executing') {
              return { offerPath: `${topDir.name}/${dir.name}`, plan };
            }
          } catch { /* skip corrupt */ }
        }
      }
    }
  } catch { /* skip */ }
  return null;
}

/**
 * Handle plan-aware commands: advance, checkpoint resolve, abandon.
 */
function handlePlanCommand(userPrompt, activePlan, ecosystemRoot) {
  const aiosCoreDir = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');
  const { PlanStateMachine } = require(path.join(aiosCoreDir, 'plan', 'plan-state-machine'));
  const { ExecutionPlanGenerator } = require(path.join(aiosCoreDir, 'plan', 'execution-plan-generator'));

  const sm = new PlanStateMachine(ecosystemRoot);
  const gen = new ExecutionPlanGenerator(ecosystemRoot);
  const plan = activePlan.plan;

  // Abandon plan
  if (PLAN_ABANDON_PATTERNS.some(p => p.test(userPrompt))) {
    plan.status = 'abandoned';
    plan.updated_at = new Date().toISOString();
    gen.save(activePlan.offerPath, plan);
    return {
      hookSpecificOutput: {
        additionalContext: '<plan-abandoned>Plano abandonado. Voltando ao routing normal.</plan-abandoned>',
      },
    };
  }

  // Find current task
  const currentTask = plan.current_task
    ? plan.tasks.find(t => t.id === plan.current_task)
    : null;

  // Checkpoint resolution
  if (currentTask?.type === 'checkpoint' && PLAN_ADVANCE_PATTERNS.some(p => p.test(userPrompt))) {
    sm.resolveCheckpoint(plan, currentTask.id, userPrompt.trim());
    gen.save(activePlan.offerPath, plan);

    const nextDirective = sm.getDirective(plan);
    return {
      hookSpecificOutput: {
        additionalContext: nextDirective || '<plan-complete>Checkpoint resolvido. Plano completo.</plan-complete>',
      },
    };
  }

  // Any other prompt with active plan: re-inject current directive
  const directive = sm.getDirective(plan);
  if (directive) {
    return {
      hookSpecificOutput: {
        additionalContext: directive,
      },
    };
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

  const userPrompt = context.prompt || '';

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  // === Path 0: Active plan exists (highest priority) ===
  try {
    const activePlan = findActivePlan(ecosystemRoot);
    if (activePlan) {
      const result = handlePlanCommand(userPrompt, activePlan, ecosystemRoot);
      if (result) {
        process.stdout.write(JSON.stringify(result));
        return;
      }
    }
  } catch { /* fail-open: fall through to existing paths */ }

  // === Path 1: Pipeline-level intent → generate execution plan ===
  if (detectIntent(userPrompt)) {
    const offer = findActiveOffer(ecosystemRoot);
    if (!offer) {
      process.stdout.write(JSON.stringify({}));
      return;
    }

    try {
      // Generate execution plan instead of just dispatch queue
      const result = handlePipelineIntentWithPlan(offer, ecosystemRoot);
      if (result) {
        process.stdout.write(JSON.stringify(result));
        return;
      }
      // Fallback to original dispatch queue
      const fallback = handlePipelineIntent(offer, ecosystemRoot);
      process.stdout.write(JSON.stringify(fallback || {}));
    } catch (error) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          additionalContext: `<pipeline-intent-error>${error.message}</pipeline-intent-error>`,
        },
      }));
    }
    return;
  }

  // === Path 2: Task-level intent ===
  const taskMatch = detectTaskIntent(userPrompt);
  if (taskMatch) {
    const offer = findActiveOffer(ecosystemRoot);
    if (!offer) {
      process.stdout.write(JSON.stringify({}));
      return;
    }

    try {
      const result = handleTaskIntent(taskMatch, offer, ecosystemRoot, userPrompt);
      process.stdout.write(JSON.stringify(result || {}));
    } catch (error) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          additionalContext: `<task-dispatch-error>${error.message}</task-dispatch-error>`,
        },
      }));
    }
    return;
  }

  // No intent detected
  process.stdout.write(JSON.stringify({}));
}

/**
 * Generate execution plan AND first directive for pipeline intent.
 */
function handlePipelineIntentWithPlan(offer, ecosystemRoot) {
  const aiosCoreDir = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');

  try {
    const { ExecutionPlanGenerator } = require(path.join(aiosCoreDir, 'plan', 'execution-plan-generator'));
    const { PlanStateMachine } = require(path.join(aiosCoreDir, 'plan', 'plan-state-machine'));

    const WORKFLOW_MAP = {
      idle: 'research-pipeline',
      research: 'research-pipeline',
      briefing: 'briefing-pipeline',
      production: 'production-pipeline',
      review: 'review-pipeline',
    };

    const workflowId = WORKFLOW_MAP[offer.phase.toLowerCase()] || 'research-pipeline';
    const gen = new ExecutionPlanGenerator(ecosystemRoot);
    const plan = gen.generate(offer.relativePath, workflowId);

    // Save execution plan
    gen.save(offer.relativePath, plan);

    // Also populate dispatch-queue for backward compat with handoff-validator
    try {
      const { DispatchQueueManager } = require(path.join(aiosCoreDir, 'dispatch', 'dispatch-queue-manager'));
      const queueManager = new DispatchQueueManager(ecosystemRoot);
      const dispatches = plan.tasks
        .filter(t => t.type === 'auto' && t.status === 'pending')
        .map(t => ({
          phase_id: `plan-task-${t.id}`,
          agent_id: t.agent,
          model: t.model,
          parallel_group: null,
          prompt: t.prompt,
          expected_outputs: t.expected_outputs || [],
          source: 'execution-plan',
        }));
      if (dispatches.length > 0) {
        const queue = queueManager.createQueue(offer.relativePath, workflowId, dispatches);
        queueManager.saveQueueSync(offer.relativePath, queue);
      }
    } catch { /* dispatch-queue compat is best-effort */ }

    // Generate first directive
    const sm = new PlanStateMachine(ecosystemRoot);
    const directive = sm.getDirective(plan);

    if (directive) {
      return {
        hookSpecificOutput: {
          additionalContext: directive,
        },
      };
    }
  } catch { /* fall through to original handler */ }

  return null;
}

main().catch(() => process.exit(0));

// Export for testing (U-21)
module.exports._detectIntent = _detectIntent;
