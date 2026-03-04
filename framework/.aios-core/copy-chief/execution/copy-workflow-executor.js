'use strict';

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const { CopyPromptBuilder } = require('./copy-prompt-builder');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const WORKFLOWS_DIR = path.join(ECOSYSTEM_ROOT, 'squads', 'copy-chief', 'workflows');

const ExecutionState = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  HUMAN_GATE: 'human_gate',
};

class CopyWorkflowExecutor {
  constructor(workflowPath, options = {}) {
    if (!workflowPath || typeof workflowPath !== 'string') {
      throw new Error('workflowPath is required');
    }

    this.workflowPath = workflowPath;
    this.options = {
      debug: false,
      ecosystemRoot: ECOSYSTEM_ROOT,
      ...options,
    };

    this.workflow = null;
    this.state = null;
    this.promptBuilder = new CopyPromptBuilder(this.options.ecosystemRoot, {
      debug: this.options.debug,
    });

    // Callbacks
    this._onPhaseChange = null;
    this._onAgentSpawn = null;
  }

  loadWorkflow() {
    if (!fs.existsSync(this.workflowPath)) {
      throw new Error(`Workflow file not found: ${this.workflowPath}`);
    }

    const content = fs.readFileSync(this.workflowPath, 'utf8');
    const parsed = yaml.load(content);

    if (!parsed?.workflow) {
      throw new Error(`Invalid workflow format: missing 'workflow' key`);
    }

    this.workflow = parsed.workflow;
    return this.workflow;
  }

  execute(offerRelativePath, context = {}) {
    if (!this.workflow) {
      this.loadWorkflow();
    }

    const phases = this.workflow.phases || [];
    const execution = {
      workflowId: this.workflow.id,
      workflowTitle: this.workflow.title,
      offerPath: offerRelativePath,
      gateRequired: this.workflow.gate_required || null,
      dependsOnGate: this.workflow.depends_on_gate || null,
      phases: [],
      dispatchQueue: [],
      status: ExecutionState.PENDING,
      startedAt: new Date().toISOString(),
    };

    // Check gate dependency
    if (execution.dependsOnGate) {
      const gateCheck = this._checkGateDependency(offerRelativePath, execution.dependsOnGate);
      if (!gateCheck.passed) {
        execution.status = ExecutionState.BLOCKED;
        execution.blockReason = `Gate "${execution.dependsOnGate}" not passed: ${gateCheck.reason}`;
        return this._formatExecutionContext(execution);
      }
    }

    // Process phases
    const completedPhaseIds = new Set();
    const phaseGroups = this._groupPhases(phases);

    for (const group of phaseGroups) {
      const phaseExecution = {
        groupIndex: group.index,
        phases: [],
        parallel: group.parallel,
      };

      for (const phase of group.phases) {
        // Check dependencies
        const depsMet = this._checkPhaseDependencies(phase, completedPhaseIds);
        if (!depsMet) {
          phaseExecution.phases.push({
            id: phase.id,
            title: phase.title,
            status: ExecutionState.BLOCKED,
            reason: `Dependencies not met: ${(phase.depends_on || []).join(', ')}`,
          });
          continue;
        }

        // Check human gate
        if (phase.human_gate) {
          phaseExecution.phases.push({
            id: phase.id,
            title: phase.title,
            status: ExecutionState.HUMAN_GATE,
            message: 'Requires human approval before proceeding.',
          });
          continue;
        }

        // Build dispatch payloads
        const payloads = this.promptBuilder.buildDispatchPayload(
          phase,
          offerRelativePath,
          { previousOutputs: context.previousOutputs || [] }
        );

        const phaseResult = {
          id: phase.id,
          title: phase.title,
          status: ExecutionState.PENDING,
          parallel: phase.parallel || false,
          agents: (phase.agents || []).join(', '),
          dispatchPayloads: payloads,
        };

        phaseExecution.phases.push(phaseResult);

        // Add to dispatch queue
        for (const payload of payloads) {
          execution.dispatchQueue.push({
            phaseId: phase.id,
            ...payload,
            parallel: phase.parallel || false,
          });
        }

        // Track as "will complete" for dependency resolution
        completedPhaseIds.add(phase.id);
      }

      execution.phases.push(phaseExecution);
    }

    execution.status = ExecutionState.IN_PROGRESS;

    // Emit phase change
    if (this._onPhaseChange) {
      this._onPhaseChange(execution.phases[0]?.phases[0]?.id || 'start', this.workflow.id, null);
    }

    return this._formatExecutionContext(execution);
  }

  resumeFrom(phaseId, offerRelativePath, context = {}) {
    if (!this.workflow) {
      this.loadWorkflow();
    }

    const phases = this.workflow.phases || [];
    const resumeIndex = phases.findIndex(p => p.id === phaseId);

    if (resumeIndex === -1) {
      return {
        error: `Phase "${phaseId}" not found in workflow`,
        availablePhases: phases.map(p => p.id),
      };
    }

    // Mark all phases before resumeIndex as completed
    const completedContext = {
      ...context,
      previousOutputs: context.previousOutputs || [],
    };

    // Re-execute from the specified phase
    const remainingPhases = phases.slice(resumeIndex);
    const modifiedWorkflow = { ...this.workflow, phases: remainingPhases };

    const originalWorkflow = this.workflow;
    this.workflow = modifiedWorkflow;
    const result = this.execute(offerRelativePath, completedContext);
    this.workflow = originalWorkflow;

    return result;
  }

  getPhases() {
    if (!this.workflow) {
      this.loadWorkflow();
    }
    return (this.workflow.phases || []).map(p => ({
      id: p.id,
      title: p.title,
      agents: p.agents || [],
      parallel: p.parallel || false,
      dependsOn: p.depends_on || [],
      humanGate: p.human_gate || false,
    }));
  }

  getWorkflowInfo() {
    if (!this.workflow) {
      this.loadWorkflow();
    }
    return {
      id: this.workflow.id,
      title: this.workflow.title,
      description: this.workflow.description,
      gateRequired: this.workflow.gate_required,
      dependsOnGate: this.workflow.depends_on_gate,
      phaseCount: (this.workflow.phases || []).length,
    };
  }

  onPhaseChange(callback) {
    this._onPhaseChange = callback;
  }

  onAgentSpawn(callback) {
    this._onAgentSpawn = callback;
  }

  async saveState(offerRelativePath) {
    if (!this.state) return;

    const offerPath = path.join(this.options.ecosystemRoot, offerRelativePath);
    const stateDir = path.join(offerPath, '.aios');
    const statePath = path.join(stateDir, `${this.workflow.id}-state.yaml`);

    try {
      await fsp.mkdir(stateDir, { recursive: true });
      await fsp.writeFile(statePath, yaml.dump(this.state), 'utf8');
      this._log(`State saved to ${statePath}`);
    } catch (e) {
      this._log(`Failed to save state: ${e.message}`);
    }
  }

  async loadState(offerRelativePath) {
    const offerPath = path.join(this.options.ecosystemRoot, offerRelativePath);
    const statePath = path.join(offerPath, '.aios', `${this.workflow?.id || 'unknown'}-state.yaml`);

    if (!fs.existsSync(statePath)) return null;

    try {
      const content = await fsp.readFile(statePath, 'utf8');
      this.state = yaml.load(content);
      return this.state;
    } catch (e) {
      this._log(`Failed to load state: ${e.message}`);
      return null;
    }
  }

  _groupPhases(phases) {
    const groups = [];
    let currentGroup = null;

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const hasDeps = phase.depends_on && phase.depends_on.length > 0;

      if (phase.parallel && !hasDeps) {
        // Check if next phases are also parallel without deps
        if (!currentGroup || !currentGroup.parallel) {
          currentGroup = { index: groups.length, parallel: true, phases: [] };
          groups.push(currentGroup);
        }
        currentGroup.phases.push(phase);
      } else {
        currentGroup = { index: groups.length, parallel: false, phases: [phase] };
        groups.push(currentGroup);
      }
    }

    return groups;
  }

  _checkPhaseDependencies(phase, completedPhaseIds) {
    const deps = phase.depends_on || [];
    return deps.every(dep => completedPhaseIds.has(dep));
  }

  _checkGateDependency(offerRelativePath, gateName) {
    const helixStatePath = path.join(this.options.ecosystemRoot, offerRelativePath, 'helix-state.yaml');

    if (!fs.existsSync(helixStatePath)) {
      return { passed: false, reason: 'helix-state.yaml not found' };
    }

    try {
      const content = fs.readFileSync(helixStatePath, 'utf8');
      const state = yaml.load(content);
      const gateValue = state?.gates?.[gateName];

      if (gateValue === true || gateValue === 'passed') {
        return { passed: true };
      }

      return { passed: false, reason: `Gate "${gateName}" is ${gateValue || 'not set'}` };
    } catch (e) {
      return { passed: false, reason: `Error reading state: ${e.message}` };
    }
  }

  _formatExecutionContext(execution) {
    const lines = [];
    lines.push('<workflow-execution>');
    lines.push(`<workflow id="${execution.workflowId}" title="${execution.workflowTitle}" status="${execution.status}">`);
    lines.push(`  <offer>${execution.offerPath}</offer>`);

    if (execution.blockReason) {
      lines.push(`  <blocked reason="${execution.blockReason}" />`);
    }

    // Phase summary
    lines.push('  <phases>');
    for (const group of execution.phases) {
      for (const phase of group.phases) {
        const attrs = [
          `id="${phase.id}"`,
          `title="${phase.title}"`,
          `status="${phase.status}"`,
          phase.parallel ? 'parallel="true"' : '',
          phase.agents ? `agents="${phase.agents}"` : '',
        ].filter(Boolean).join(' ');

        if (phase.status === ExecutionState.HUMAN_GATE) {
          lines.push(`    <phase ${attrs}><human-gate>${phase.message}</human-gate></phase>`);
        } else if (phase.status === ExecutionState.BLOCKED) {
          lines.push(`    <phase ${attrs}><blocked>${phase.reason}</blocked></phase>`);
        } else {
          lines.push(`    <phase ${attrs} />`);
        }
      }
    }
    lines.push('  </phases>');

    // Dispatch queue (what to execute)
    if (execution.dispatchQueue.length > 0) {
      lines.push('  <dispatch-queue>');
      for (const dispatch of execution.dispatchQueue) {
        lines.push(`    <dispatch phase="${dispatch.phaseId}" agent="${dispatch.agentId}" model="${dispatch.model}" parallel="${dispatch.parallel}">`);
        lines.push(`      <prompt><![CDATA[${dispatch.prompt}]]></prompt>`);
        if (dispatch.expectedOutputs.length > 0) {
          lines.push(`      <expected-outputs>${dispatch.expectedOutputs.join(', ')}</expected-outputs>`);
        }
        lines.push('    </dispatch>');
      }
      lines.push('  </dispatch-queue>');
    }

    // Instructions for Helix
    lines.push('  <instructions>');
    if (execution.status === ExecutionState.BLOCKED) {
      lines.push('    BLOCKED: Resolve the gate dependency before proceeding.');
    } else {
      const parallelDispatches = execution.dispatchQueue.filter(d => d.parallel);
      const sequentialDispatches = execution.dispatchQueue.filter(d => !d.parallel);

      if (parallelDispatches.length > 0) {
        lines.push(`    PARALLEL: Launch ${parallelDispatches.length} agents in ONE message (${parallelDispatches.map(d => d.agentId).join(', ')}).`);
      }
      if (sequentialDispatches.length > 0) {
        lines.push(`    SEQUENTIAL: Execute ${sequentialDispatches.length} agents one at a time.`);
      }
      lines.push('    Use Agent() tool with subagent_type="general-purpose" for each dispatch.');
      lines.push('    After each phase completes, verify expected outputs exist before proceeding.');
    }
    lines.push('  </instructions>');

    lines.push('</workflow>');
    lines.push('</workflow-execution>');

    return lines.join('\n');
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[CopyWorkflowExecutor] ${message}`);
    }
  }
}

module.exports = { CopyWorkflowExecutor, ExecutionState };
