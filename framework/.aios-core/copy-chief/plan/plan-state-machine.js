'use strict';

/**
 * Plan State Machine
 *
 * Reads the execution plan and generates deterministic <execution-directive> XML.
 * Does NOT decide anything — only reads the plan and produces the next directive.
 *
 * Directive types:
 * - dispatch: single agent task
 * - parallel-dispatch: multiple agents in same wave
 * - checkpoint: human verification point
 * - resume: continue from previous session
 * - plan-complete: all tasks done
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

class PlanStateMachine {
  constructor(ecosystemRoot) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
  }

  /**
   * Get the current directive based on plan state.
   * Returns XML string to inject into context.
   */
  getDirective(plan) {
    if (!plan || !plan.tasks || plan.tasks.length === 0) {
      return null;
    }

    // Check if plan is completed
    const pending = plan.tasks.filter(t => t.status === 'pending');
    const dispatched = plan.tasks.filter(t => t.status === 'dispatched');

    if (pending.length === 0 && dispatched.length === 0) {
      return this._buildCompleteDirective(plan);
    }

    // If tasks are dispatched (running), wait
    if (dispatched.length > 0 && pending.length === 0) {
      return this._buildWaitingDirective(plan, dispatched);
    }

    // Find the current task(s) to execute
    const currentTask = plan.current_task
      ? plan.tasks.find(t => t.id === plan.current_task)
      : pending[0];

    if (!currentTask) {
      return this._buildCompleteDirective(plan);
    }

    // Check if dependencies are met
    if (currentTask.depends_on) {
      const depsMet = currentTask.depends_on.every(depId => {
        const dep = plan.tasks.find(t => t.id === depId);
        return dep && (dep.status === 'completed' || dep.status === 'skipped');
      });
      if (!depsMet) {
        // Dependencies not met — find what's blocking
        const blocking = currentTask.depends_on.filter(depId => {
          const dep = plan.tasks.find(t => t.id === depId);
          return dep && dep.status !== 'completed' && dep.status !== 'skipped';
        });
        return this._buildWaitingDirective(plan, blocking.map(id => plan.tasks.find(t => t.id === id)).filter(Boolean));
      }
    }

    // Checkpoint
    if (currentTask.type === 'checkpoint') {
      return this._buildCheckpointDirective(plan, currentTask);
    }

    // Find all tasks in the same wave that are ready
    const waveTasks = pending.filter(t =>
      t.type === 'auto' &&
      t.wave === currentTask.wave &&
      this._dependenciesMet(t, plan)
    );

    if (waveTasks.length > 1) {
      return this._buildParallelDirective(plan, waveTasks);
    }

    if (waveTasks.length === 1) {
      return this._buildDispatchDirective(plan, waveTasks[0]);
    }

    // Single task dispatch
    if (currentTask.type === 'auto') {
      return this._buildDispatchDirective(plan, currentTask);
    }

    return null;
  }

  /**
   * Mark a task as completed and advance the plan pointer.
   */
  advanceTask(plan, taskId, result) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return plan;

    task.status = 'completed';
    task.completed_at = new Date().toISOString();
    if (result) {
      task.result = typeof result === 'string' ? result : JSON.stringify(result).slice(0, 500);
    }

    // Check if all tasks in this wave are done
    const waveTasks = plan.tasks.filter(t => t.wave === task.wave);
    const waveComplete = waveTasks.every(t =>
      t.status === 'completed' || t.status === 'skipped'
    );

    if (waveComplete) {
      // Advance to next pending task
      const nextPending = plan.tasks.find(t =>
        t.status === 'pending' && this._dependenciesMet(t, plan)
      );
      plan.current_task = nextPending ? nextPending.id : null;
    }

    // Check if plan is complete
    const allDone = plan.tasks.every(t =>
      t.status === 'completed' || t.status === 'skipped'
    );
    if (allDone) {
      plan.status = 'completed';
      plan.completed_at = new Date().toISOString();
    }

    plan.updated_at = new Date().toISOString();
    return plan;
  }

  /**
   * Mark a task as dispatched (agent spawned).
   */
  markDispatched(plan, taskId) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task) return plan;
    task.status = 'dispatched';
    task.started_at = new Date().toISOString();
    plan.updated_at = new Date().toISOString();
    return plan;
  }

  /**
   * Resolve a checkpoint (human response).
   */
  resolveCheckpoint(plan, taskId, response) {
    const task = plan.tasks.find(t => t.id === taskId);
    if (!task || task.type !== 'checkpoint') return plan;

    task.status = 'completed';
    task.completed_at = new Date().toISOString();
    task.human_response = response;

    plan.decisions.push({
      task_id: taskId,
      response,
      timestamp: new Date().toISOString(),
    });

    // Advance to next pending
    const nextPending = plan.tasks.find(t =>
      t.status === 'pending' && this._dependenciesMet(t, plan)
    );
    plan.current_task = nextPending ? nextPending.id : null;

    if (!plan.current_task) {
      const allDone = plan.tasks.every(t =>
        t.status === 'completed' || t.status === 'skipped'
      );
      if (allDone) {
        plan.status = 'completed';
        plan.completed_at = new Date().toISOString();
      }
    }

    plan.status = plan.current_task ? 'executing' : plan.status;
    plan.updated_at = new Date().toISOString();
    return plan;
  }

  /**
   * Write continue-here.yaml for session continuity.
   */
  writeContinueHere(plan, offerPath) {
    const aiosDir = path.join(this.ecosystemRoot, offerPath, '.aios');
    fs.mkdirSync(aiosDir, { recursive: true });

    const completedTasks = plan.tasks
      .filter(t => t.status === 'completed' || t.status === 'skipped')
      .map(t => t.id);

    const currentTask = plan.current_task
      ? plan.tasks.find(t => t.id === plan.current_task)
      : null;

    const lastCompleted = plan.tasks
      .filter(t => t.status === 'completed')
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
      [0];

    const continueHere = {
      plan_id: plan.plan_id,
      offer: offerPath,
      current_task: plan.current_task,
      completed_tasks: completedTasks,
      last_agent: lastCompleted?.agent || null,
      checkpoint_active: currentTask?.type === 'checkpoint',
      checkpoint_type: currentTask?.type === 'checkpoint' ? currentTask.checkpoint_type : null,
      resume_instruction: currentTask?.type === 'checkpoint'
        ? currentTask.resume_signal
        : 'Continue executing the plan from the current task.',
      saved_at: new Date().toISOString(),
    };

    const continuePath = path.join(aiosDir, 'continue-here.yaml');
    fs.writeFileSync(continuePath, yaml.dump(continueHere, { lineWidth: 120 }), 'utf8');
    return continuePath;
  }

  /**
   * Load continue-here.yaml.
   */
  loadContinueHere(offerPath) {
    const continuePath = path.join(this.ecosystemRoot, offerPath, '.aios', 'continue-here.yaml');
    if (!fs.existsSync(continuePath)) return null;
    try {
      return yaml.load(fs.readFileSync(continuePath, 'utf8'));
    } catch {
      return null;
    }
  }

  // --- Directive builders ---

  _buildDispatchDirective(plan, task) {
    const lines = [
      `<execution-directive type="dispatch" plan-id="${plan.plan_id}" task="${task.id}">`,
      `  <instruction>Execute a task abaixo usando Agent() tool. NAO faca o trabalho manualmente.</instruction>`,
      `  <task-info title="${this._escapeXml(task.title)}" agent="${task.agent}" model="${task.model}" wave="${task.wave}" />`,
      `  <agent-call>`,
      `    Agent(`,
      `      description: "${this._capitalize(task.agent)}: ${this._escapeXml(task.title)}",`,
      `      subagent_type: "general-purpose",`,
      `      model: "${task.model}",`,
      `      prompt: "<see full-prompt below>"`,
      `    )`,
      `  </agent-call>`,
      `  <full-prompt><![CDATA[${task.prompt}]]></full-prompt>`,
    ];

    if (task.expected_outputs && task.expected_outputs.length > 0) {
      lines.push(`  <expected-outputs>${task.expected_outputs.join(', ')}</expected-outputs>`);
    }

    lines.push(`  <progress>${this._getProgressSummary(plan)}</progress>`);
    lines.push(`</execution-directive>`);
    return lines.join('\n');
  }

  _buildParallelDirective(plan, tasks) {
    const wave = tasks[0].wave;
    const lines = [
      `<execution-directive type="parallel-dispatch" plan-id="${plan.plan_id}" wave="${wave}" count="${tasks.length}">`,
      `  <instruction>Lance os ${tasks.length} Agent() calls abaixo em UMA mensagem (paralelo).</instruction>`,
    ];

    for (const task of tasks) {
      lines.push(`  <agent-call id="${task.id}" agent="${task.agent}" model="${task.model}" title="${this._escapeXml(task.title)}">`);
      lines.push(`    Agent(`);
      lines.push(`      description: "${this._capitalize(task.agent)}: ${this._escapeXml(task.title)}",`);
      lines.push(`      subagent_type: "general-purpose",`);
      lines.push(`      model: "${task.model}",`);
      lines.push(`      prompt: "<see full-prompt-${task.id} below>"`);
      lines.push(`    )`);
      lines.push(`  </agent-call>`);
    }

    for (const task of tasks) {
      lines.push(`  <full-prompt-${task.id}><![CDATA[${task.prompt}]]></full-prompt-${task.id}>`);
    }

    lines.push(`  <progress>${this._getProgressSummary(plan)}</progress>`);
    lines.push(`</execution-directive>`);
    return lines.join('\n');
  }

  _buildCheckpointDirective(plan, task) {
    const completedTasks = plan.tasks.filter(t =>
      t.status === 'completed' && t.type === 'auto'
    );
    const completedSummary = completedTasks.map(t =>
      `- Task ${t.id}: ${t.title} (${t.agent || 'system'})`
    ).join('\n    ');

    const lines = [
      `<execution-directive type="checkpoint" plan-id="${plan.plan_id}" task="${task.id}">`,
      `  <checkpoint-type>${task.checkpoint_type}</checkpoint-type>`,
      `  <title>${this._escapeXml(task.title)}</title>`,
      `  <completed>`,
      `    ${completedSummary}`,
      `  </completed>`,
      `  <description>${this._escapeXml(task.description)}</description>`,
      `  <options>`,
      `    1. "approved" — avanca para proxima fase`,
      `    2. Descreva problemas — iterar`,
      `    3. "skip" — pular checkpoint`,
      `  </options>`,
      `  <progress>${this._getProgressSummary(plan)}</progress>`,
      `</execution-directive>`,
    ];
    return lines.join('\n');
  }

  _buildResumeDirective(plan, continueHere) {
    const currentTask = plan.tasks.find(t => t.id === continueHere.current_task);
    const completedCount = continueHere.completed_tasks?.length || 0;
    const totalCount = plan.tasks.length;

    const lines = [
      `<execution-directive type="resume" plan-id="${plan.plan_id}" task="${continueHere.current_task}">`,
      `  <context>Sessao anterior parou na task ${continueHere.current_task}. ${completedCount}/${totalCount} tasks completas.</context>`,
    ];

    if (currentTask?.type === 'checkpoint') {
      lines.push(`  <instruction>Apresente o checkpoint abaixo ao usuario.</instruction>`);
      lines.push(`  <checkpoint>${this._escapeXml(currentTask.description || currentTask.title)}</checkpoint>`);
      lines.push(`  <resume-signal>${continueHere.resume_instruction}</resume-signal>`);
    } else if (currentTask?.type === 'auto') {
      lines.push(`  <instruction>Continue executando o plano. Proxima task: ${this._escapeXml(currentTask.title)}</instruction>`);
    }

    lines.push(`  <progress>${this._getProgressSummary(plan)}</progress>`);
    lines.push(`</execution-directive>`);
    return lines.join('\n');
  }

  _buildCompleteDirective(plan) {
    const completedCount = plan.tasks.filter(t => t.status === 'completed').length;
    const totalCount = plan.tasks.length;

    const lines = [
      `<execution-directive type="plan-complete" plan-id="${plan.plan_id}">`,
      `  <summary>Pipeline ${plan.workflow} concluido. ${completedCount}/${totalCount} tasks completas.</summary>`,
      `  <next-action>Avancar fase para REVIEW via validate_gate.</next-action>`,
      `</execution-directive>`,
    ];
    return lines.join('\n');
  }

  _buildWaitingDirective(plan, waitingOn) {
    const names = waitingOn.map(t => `${t.agent || 'task'} (${t.title})`).join(', ');
    const lines = [
      `<execution-directive type="waiting" plan-id="${plan.plan_id}">`,
      `  <waiting-on>${names}</waiting-on>`,
      `  <instruction>Aguardando agents em execucao completarem. Nao faça nada ate completar.</instruction>`,
      `  <progress>${this._getProgressSummary(plan)}</progress>`,
      `</execution-directive>`,
    ];
    return lines.join('\n');
  }

  // --- Helpers ---

  _dependenciesMet(task, plan) {
    if (!task.depends_on || task.depends_on.length === 0) return true;
    return task.depends_on.every(depId => {
      const dep = plan.tasks.find(t => t.id === depId);
      return dep && (dep.status === 'completed' || dep.status === 'skipped');
    });
  }

  _getProgressSummary(plan) {
    const completed = plan.tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
    const total = plan.tasks.length;
    const pending = plan.tasks.filter(t => t.status === 'pending').length;
    const dispatched = plan.tasks.filter(t => t.status === 'dispatched').length;
    return `${completed}/${total} completas, ${dispatched} em execucao, ${pending} pendentes`;
  }

  _capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  _escapeXml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

module.exports = { PlanStateMachine };
