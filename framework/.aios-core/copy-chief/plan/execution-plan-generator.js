'use strict';

/**
 * Execution Plan Generator
 *
 * Converts Workflow YAML + helix-state.yaml into a concrete execution-plan.yaml
 * with numbered tasks, waves, checkpoints, and verification rules.
 *
 * Reuses CopyWorkflowExecutor.loadWorkflow() and CopyPromptBuilder.buildDispatchPayload().
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const WORKFLOWS_DIR = path.join(ECOSYSTEM_ROOT, 'squads', 'copy-chief', 'workflows');

// Maps task types to verification rules
const TASK_VERIFICATION_MAP = {
  'produce-vsl': { type: 'dir_has_files', path: 'production/vsl/' },
  'produce-landing-page': { type: 'dir_has_files', path: 'production/landing-page/' },
  'produce-creatives': { type: 'dir_has_files', path: 'production/creatives/' },
  'produce-emails': { type: 'dir_has_files', path: 'production/emails/' },
  'validate-deliverable': { type: 'file_exists', path: 'production/review-results.md' },
  'voc-extraction': { type: 'file_exists', path: 'research/voc/summary.md' },
  'competitor-analysis': { type: 'file_exists', path: 'research/competitors/summary.md' },
  'avatar-profiling': { type: 'file_exists', path: 'research/avatar/summary.md' },
  'helix-briefing': { type: 'dir_has_files', path: 'briefings/phases/' },
  'validate-mecanismo': { type: 'file_exists', path: 'mecanismo-unico.yaml' },
};

// Gate names that trigger automatic checkpoints after completion
const CHECKPOINT_AFTER_GATES = ['blind_critic', 'black_validation', 'emotional_stress_test'];

class ExecutionPlanGenerator {
  constructor(ecosystemRoot) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.workflowsDir = path.join(this.ecosystemRoot, 'squads', 'copy-chief', 'workflows');
  }

  /**
   * Generate an execution plan from a workflow YAML + offer state.
   * @param {string} offerPath - Relative offer path (e.g. "saude/florayla")
   * @param {string} workflowId - Workflow ID (e.g. "production-pipeline")
   * @returns {object} The execution plan object
   */
  generate(offerPath, workflowId) {
    const workflowPath = path.join(this.workflowsDir, `${workflowId}.yaml`);
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`Workflow not found: ${workflowPath}`);
    }

    const content = yaml.load(fs.readFileSync(workflowPath, 'utf8'));
    const workflow = content?.workflow;
    if (!workflow) {
      throw new Error(`Invalid workflow format in ${workflowPath}`);
    }

    // Load CopyPromptBuilder for 7-layer prompts
    const { CopyPromptBuilder } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'execution', 'copy-prompt-builder')
    );
    const promptBuilder = new CopyPromptBuilder(this.ecosystemRoot);

    // Load helix-state for skip detection
    const helixState = this._loadHelixState(offerPath);

    const now = new Date().toISOString();
    const plan = {
      plan_id: `${workflowId}-${Date.now()}`,
      offer: offerPath,
      workflow: workflowId,
      status: 'pending',
      created_at: now,
      updated_at: now,
      current_task: null,
      tasks: [],
      decisions: [],
      context: '',
    };

    const phases = workflow.phases || [];
    let taskId = 0;
    let currentWave = 0;
    const phaseToWaveMap = {};

    // First pass: assign waves based on dependencies and parallel flags
    const phaseOrder = this._resolvePhaseOrder(phases);

    for (const phase of phaseOrder) {
      // Determine wave number
      const deps = phase.depends_on || [];
      let wave;
      if (deps.length > 0) {
        // Wave = max wave of deps + 1
        const depWaves = deps.map(d => phaseToWaveMap[d] || 0);
        wave = Math.max(...depWaves) + 1;
      } else if (phase.parallel) {
        // Parallel phases without deps share wave with adjacent parallel phases
        wave = currentWave;
      } else {
        wave = currentWave;
      }

      phaseToWaveMap[phase.id] = wave;

      // Check if phase is human_gate → becomes checkpoint
      if (phase.human_gate) {
        taskId++;
        const depTaskIds = this._getDependentTaskIds(plan.tasks, deps);
        plan.tasks.push({
          id: taskId,
          type: 'checkpoint',
          checkpoint_type: 'human-verify',
          wave,
          title: phase.title || `Gate: ${phase.id}`,
          description: phase.handoff_prompt || 'Verificar antes de prosseguir.',
          resume_signal: 'approved ou descreva problemas',
          depends_on: depTaskIds.length > 0 ? depTaskIds : undefined,
          status: 'pending',
        });
        currentWave = wave + 1;
        continue;
      }

      // Build agent tasks from phase
      const agents = phase.agents || [];
      const tasks = phase.tasks || [];

      for (let i = 0; i < agents.length; i++) {
        const agentId = agents[i];
        const taskType = tasks[i] || phase.id;

        // Check if already completed (skip)
        if (this._isTaskCompleted(taskType, offerPath, helixState)) {
          taskId++;
          plan.tasks.push({
            id: taskId,
            type: 'auto',
            wave,
            agent: agentId,
            model: this._getAgentModel(agentId),
            title: phase.title || taskType,
            prompt: '', // skipped, no prompt needed
            expected_outputs: this._getExpectedOutputs(taskType, offerPath),
            verification: TASK_VERIFICATION_MAP[taskType] || null,
            depends_on: undefined,
            status: 'skipped',
            skipped_reason: 'Already completed (detected from filesystem/helix-state)',
          });
          continue;
        }

        // Build 7-layer prompt via CopyPromptBuilder
        const syntheticPhase = {
          id: phase.id,
          title: phase.title || taskType,
          agents: [agentId],
          tasks: [taskType],
          handoff_prompt: phase.handoff_prompt,
        };

        const payloads = promptBuilder.buildDispatchPayload(syntheticPhase, offerPath);
        const payload = payloads[0];

        if (!payload) continue;

        const depTaskIds = this._getDependentTaskIds(plan.tasks, deps);

        taskId++;
        plan.tasks.push({
          id: taskId,
          type: 'auto',
          wave,
          agent: agentId,
          model: payload.model,
          title: phase.title || taskType,
          prompt: payload.prompt,
          expected_outputs: payload.expectedOutputs || [],
          verification: TASK_VERIFICATION_MAP[taskType] || null,
          depends_on: depTaskIds.length > 0 ? depTaskIds : undefined,
          status: 'pending',
        });
      }

      // Insert checkpoint after review phases (quality gate phases)
      if (phase.id.includes('review') || phase.id.includes('gate')) {
        taskId++;
        plan.tasks.push({
          id: taskId,
          type: 'checkpoint',
          checkpoint_type: 'human-verify',
          wave: wave + 1,
          title: `Verificar: ${phase.title || phase.id}`,
          description: `Review/gate completo. Verificar resultados antes de prosseguir.`,
          resume_signal: 'approved ou descreva problemas',
          depends_on: [taskId - 1],
          status: 'pending',
        });
      }

      currentWave = wave + 1;
    }

    // Set current_task to first pending
    const firstPending = plan.tasks.find(t => t.status === 'pending');
    plan.current_task = firstPending ? firstPending.id : null;

    if (plan.current_task) {
      plan.status = 'executing';
    }

    return plan;
  }

  /**
   * Save execution plan to {offer}/.aios/execution-plan.yaml
   */
  save(offerPath, plan) {
    const aiosDir = path.join(this.ecosystemRoot, offerPath, '.aios');
    fs.mkdirSync(aiosDir, { recursive: true });
    const planPath = path.join(aiosDir, 'execution-plan.yaml');
    plan.updated_at = new Date().toISOString();
    fs.writeFileSync(planPath, yaml.dump(plan, { lineWidth: 120, noRefs: true }), 'utf8');
    return planPath;
  }

  /**
   * Load execution plan from {offer}/.aios/execution-plan.yaml
   */
  load(offerPath) {
    const planPath = path.join(this.ecosystemRoot, offerPath, '.aios', 'execution-plan.yaml');
    if (!fs.existsSync(planPath)) return null;
    try {
      return yaml.load(fs.readFileSync(planPath, 'utf8'));
    } catch {
      return null;
    }
  }

  // --- Private helpers ---

  _resolvePhaseOrder(phases) {
    // Topological sort respecting depends_on
    const resolved = [];
    const resolvedIds = new Set();
    const remaining = [...phases];
    let maxIterations = phases.length * 2;

    while (remaining.length > 0 && maxIterations-- > 0) {
      const next = remaining.findIndex(p => {
        const deps = p.depends_on || [];
        return deps.every(d => resolvedIds.has(d));
      });

      if (next === -1) {
        // Circular dep or unresolvable — push remaining as-is
        resolved.push(...remaining);
        break;
      }

      const phase = remaining.splice(next, 1)[0];
      resolved.push(phase);
      resolvedIds.add(phase.id);
    }

    return resolved;
  }

  _getDependentTaskIds(existingTasks, depPhaseIds) {
    if (!depPhaseIds || depPhaseIds.length === 0) return [];
    // Find task IDs that belong to the dependent phases
    const ids = [];
    for (const task of existingTasks) {
      // Match by title containing the phase id, or by the task being in the same wave group
      for (const depId of depPhaseIds) {
        if (task.title && task.title.toLowerCase().includes(depId.replace(/-/g, ' ').toLowerCase())) {
          ids.push(task.id);
        }
      }
    }
    return [...new Set(ids)];
  }

  _loadHelixState(offerPath) {
    const helixPath = path.join(this.ecosystemRoot, offerPath, 'helix-state.yaml');
    if (!fs.existsSync(helixPath)) return {};
    try {
      return yaml.load(fs.readFileSync(helixPath, 'utf8')) || {};
    } catch {
      return {};
    }
  }

  _isTaskCompleted(taskType, offerPath, helixState) {
    const verification = TASK_VERIFICATION_MAP[taskType];
    if (!verification) return false;

    const offerDir = path.join(this.ecosystemRoot, offerPath);

    switch (verification.type) {
      case 'dir_has_files':
        return this._hasFiles(path.join(offerDir, verification.path));
      case 'file_exists':
        return fs.existsSync(path.join(offerDir, verification.path));
      case 'gate_passed':
        return helixState?.gates?.[verification.gate]?.passed === true;
      default:
        return false;
    }
  }

  _hasFiles(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return false;
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile()) return true;
        if (entry.isDirectory()) {
          if (this._hasFiles(path.join(dirPath, entry.name))) return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  _getExpectedOutputs(taskType, offerPath) {
    const map = {
      'produce-vsl': [`${offerPath}/production/vsl/`],
      'produce-landing-page': [`${offerPath}/production/landing-page/`],
      'produce-creatives': [`${offerPath}/production/creatives/`],
      'produce-emails': [`${offerPath}/production/emails/`],
      'validate-deliverable': [`${offerPath}/production/review-results.md`],
      'voc-extraction': [`${offerPath}/research/voc/summary.md`],
      'competitor-analysis': [`${offerPath}/research/competitors/summary.md`],
      'avatar-profiling': [`${offerPath}/research/avatar/summary.md`],
      'helix-briefing': [`${offerPath}/briefings/phases/`],
    };
    return map[taskType] || [];
  }

  _getAgentModel(agentId) {
    const models = {
      vox: 'sonnet', cipher: 'sonnet', atlas: 'opus',
      echo: 'opus', forge: 'sonnet', scout: 'sonnet',
      blade: 'sonnet', hawk: 'sonnet', sentinel: 'sonnet',
    };
    return models[agentId] || 'sonnet';
  }
}

module.exports = { ExecutionPlanGenerator, TASK_VERIFICATION_MAP };
