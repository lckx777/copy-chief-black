'use strict';

/**
 * Copy Status Writer
 *
 * Writes Copy Chief orchestration state for real-time observability.
 * Inspired by BobStatusWriter but adapted for copy workflows.
 *
 * Storage: {offer}/.aios/execution-status.json
 *
 * @module copy-chief/observability/copy-status-writer
 * @version 1.0.0
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const COPY_STATUS_VERSION = '1.0';

const COPY_PIPELINE_STAGES = [
  'research',
  'briefing',
  'mecanismo',
  'production',
  'review',
  'delivery',
];

function createDefaultCopyStatus() {
  return {
    version: COPY_STATUS_VERSION,
    timestamp: new Date().toISOString(),
    orchestration: {
      active: false,
      offer: null,
      workflow: null,
    },
    pipeline: {
      stages: COPY_PIPELINE_STAGES,
      current_stage: null,
      completed_stages: [],
    },
    current_agent: {
      id: null,
      name: null,
      task: null,
      started_at: null,
    },
    agents_history: [],
    elapsed: {
      workflow_seconds: 0,
      session_seconds: 0,
    },
    errors: [],
  };
}

class CopyStatusWriter {
  constructor(offerPath, options = {}) {
    if (!offerPath || typeof offerPath !== 'string') {
      throw new Error('offerPath is required');
    }

    this.offerPath = offerPath;
    this.options = {
      debug: false,
      ...options,
    };

    this.statusDir = path.join(offerPath, '.aios');
    this.statusPath = path.join(this.statusDir, 'execution-status.json');

    this._status = createDefaultCopyStatus();
    this._sessionStartTime = Date.now();
    this._workflowStartTime = null;
  }

  async initialize(offer, workflow) {
    this._status = createDefaultCopyStatus();
    this._status.orchestration.active = true;
    this._status.orchestration.offer = offer;
    this._status.orchestration.workflow = workflow;
    this._workflowStartTime = Date.now();
    await this._write();
    this._log('CopyStatusWriter initialized');
  }

  async updatePhase(phase) {
    this._status.pipeline.current_stage = phase;
    if (!this._status.pipeline.completed_stages.includes(phase)) {
      // Mark previous stage as completed if there was one
      const stages = this._status.pipeline.stages;
      const currentIdx = stages.indexOf(phase);
      if (currentIdx > 0) {
        const prevStage = stages[currentIdx - 1];
        if (!this._status.pipeline.completed_stages.includes(prevStage)) {
          this._status.pipeline.completed_stages.push(prevStage);
        }
      }
    }
    await this._write();
  }

  async updateAgent(agentId, agentName, task) {
    // Archive current agent if there is one
    if (this._status.current_agent.id) {
      this._status.agents_history.push({
        ...this._status.current_agent,
        ended_at: new Date().toISOString(),
      });
    }

    this._status.current_agent = {
      id: agentId,
      name: agentName,
      task,
      started_at: new Date().toISOString(),
    };

    await this._write();
  }

  async addError(phase, message, recoverable = true) {
    this._status.errors.push({
      phase,
      message,
      recoverable,
      timestamp: new Date().toISOString(),
    });
    await this._write();
  }

  async complete() {
    // Mark current stage as completed
    const currentStage = this._status.pipeline.current_stage;
    if (currentStage && !this._status.pipeline.completed_stages.includes(currentStage)) {
      this._status.pipeline.completed_stages.push(currentStage);
    }

    this._status.orchestration.active = false;
    this._status.current_agent = { id: null, name: null, task: null, started_at: null };
    await this._write();
    this._log('CopyStatusWriter completed');
  }

  formatStatusLine() {
    const s = this._status;
    const parts = [];

    if (s.orchestration.offer) {
      parts.push(s.orchestration.offer);
    }

    if (s.pipeline.current_stage) {
      const completed = s.pipeline.completed_stages.length;
      const total = s.pipeline.stages.length;
      parts.push(`${s.pipeline.current_stage} (${completed}/${total})`);
    }

    if (s.current_agent.id) {
      parts.push(`${s.current_agent.name || s.current_agent.id}: ${s.current_agent.task || 'working'}`);
    }

    if (s.errors.length > 0) {
      parts.push(`${s.errors.length} errors`);
    }

    return parts.join(' | ');
  }

  getStatus() {
    return { ...this._status };
  }

  async readStatus() {
    if (!fs.existsSync(this.statusPath)) return null;

    try {
      const content = await fsp.readFile(this.statusPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async _write() {
    try {
      if (!fs.existsSync(this.statusDir)) {
        await fsp.mkdir(this.statusDir, { recursive: true });
      }

      // Update timestamps
      this._status.timestamp = new Date().toISOString();
      const now = Date.now();
      this._status.elapsed.session_seconds = Math.floor((now - this._sessionStartTime) / 1000);
      if (this._workflowStartTime) {
        this._status.elapsed.workflow_seconds = Math.floor((now - this._workflowStartTime) / 1000);
      }

      await fsp.writeFile(this.statusPath, JSON.stringify(this._status, null, 2), 'utf8');
    } catch (error) {
      this._log(`Failed to write status: ${error.message}`);
    }
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[CopyStatusWriter] ${message}`);
    }
  }
}

module.exports = {
  CopyStatusWriter,
  COPY_STATUS_VERSION,
  COPY_PIPELINE_STAGES,
  createDefaultCopyStatus,
};
