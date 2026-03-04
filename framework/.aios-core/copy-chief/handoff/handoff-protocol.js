'use strict';

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

const HandoffStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

const AGENT_HANDOFF_MAP = {
  // From → To mapping based on workflow
  'vox': ['atlas', 'cipher'],
  'cipher': ['atlas'],
  'atlas': ['echo', 'forge', 'scout', 'blade'],
  'echo': ['hawk'],
  'forge': ['hawk'],
  'scout': ['hawk'],
  'blade': ['hawk'],
  'hawk': ['sentinel'],
};

class HandoffProtocol {
  constructor(ecosystemRoot, options = {}) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.options = {
      debug: false,
      ...options,
    };
  }

  async createHandoff(fromAgent, toAgent, offerPath, artifacts, context = {}) {
    const handoffId = `handoff-${Date.now()}-${fromAgent}-${toAgent}`;
    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    // Validate artifacts exist
    const validatedArtifacts = [];
    for (const artifact of artifacts) {
      const artifactPath = artifact.path.startsWith('/')
        ? artifact.path
        : path.join(fullOfferPath, artifact.path);

      validatedArtifacts.push({
        path: artifact.path,
        fullPath: artifactPath,
        required: artifact.required !== false,
        exists: fs.existsSync(artifactPath),
        description: artifact.description || '',
      });
    }

    // Check if all required artifacts exist
    const missingRequired = validatedArtifacts.filter(a => a.required && !a.exists);

    const handoff = {
      id: handoffId,
      version: '1.0',
      created_at: new Date().toISOString(),
      from_agent: fromAgent,
      to_agent: toAgent,
      offer_path: offerPath,
      status: missingRequired.length > 0 ? HandoffStatus.REJECTED : HandoffStatus.PENDING,
      artifacts: validatedArtifacts.map(a => ({
        path: a.path,
        required: a.required,
        exists: a.exists,
        description: a.description,
      })),
      context: {
        confidence: context.confidence || null,
        gate_passed: context.gatePassed || false,
        phase_completed: context.phaseCompleted || null,
        notes: context.notes || '',
        scores: context.scores || {},
      },
      receiving_checklist: this._buildReceivingChecklist(fromAgent, toAgent, context),
      validation: {
        all_required_present: missingRequired.length === 0,
        missing_required: missingRequired.map(a => a.path),
        total_artifacts: validatedArtifacts.length,
        existing_artifacts: validatedArtifacts.filter(a => a.exists).length,
      },
    };

    if (missingRequired.length > 0) {
      handoff.rejection_reason = `Missing required artifacts: ${missingRequired.map(a => a.path).join(', ')}`;
    }

    // Persist handoff
    await this._saveHandoff(fullOfferPath, handoff);

    this._log(`Handoff created: ${handoffId} (${fromAgent} → ${toAgent}) — status: ${handoff.status}`);
    return handoff;
  }

  async validateHandoff(handoffId, offerPath) {
    const handoff = await this.loadHandoff(handoffId, offerPath);
    if (!handoff) {
      return { valid: false, reason: 'Handoff not found' };
    }

    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    // Re-validate artifacts
    let allPresent = true;
    const missing = [];

    for (const artifact of handoff.artifacts) {
      const artifactPath = artifact.path.startsWith('/')
        ? artifact.path
        : path.join(fullOfferPath, artifact.path);

      const exists = fs.existsSync(artifactPath);
      if (artifact.required && !exists) {
        allPresent = false;
        missing.push(artifact.path);
      }
    }

    return {
      valid: allPresent,
      handoffId,
      fromAgent: handoff.from_agent,
      toAgent: handoff.to_agent,
      missingArtifacts: missing,
      confidence: handoff.context?.confidence,
      checklist: handoff.receiving_checklist,
    };
  }

  async loadHandoff(handoffId, offerPath) {
    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    const handoffPath = path.join(fullOfferPath, '.aios', 'handoffs', `${handoffId}.yaml`);

    if (!fs.existsSync(handoffPath)) {
      // Try to find by prefix
      const handoffsDir = path.join(fullOfferPath, '.aios', 'handoffs');
      if (fs.existsSync(handoffsDir)) {
        const files = fs.readdirSync(handoffsDir);
        const match = files.find(f => f.startsWith(handoffId));
        if (match) {
          const content = fs.readFileSync(path.join(handoffsDir, match), 'utf8');
          return yaml.load(content);
        }
      }
      return null;
    }

    try {
      const content = fs.readFileSync(handoffPath, 'utf8');
      return yaml.load(content);
    } catch (e) {
      this._log(`Failed to load handoff: ${e.message}`);
      return null;
    }
  }

  async resolveHandoff(handoffId, offerPath, resolution) {
    const handoff = await this.loadHandoff(handoffId, offerPath);
    if (!handoff) {
      return { success: false, reason: 'Handoff not found' };
    }

    handoff.status = resolution === 'accepted' ? HandoffStatus.ACCEPTED : HandoffStatus.REJECTED;
    handoff.resolved_at = new Date().toISOString();
    handoff.resolution_notes = resolution.notes || '';

    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    await this._saveHandoff(fullOfferPath, handoff);

    this._log(`Handoff resolved: ${handoffId} — ${handoff.status}`);
    return { success: true, status: handoff.status };
  }

  async listHandoffs(offerPath, filter = {}) {
    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    const handoffsDir = path.join(fullOfferPath, '.aios', 'handoffs');
    if (!fs.existsSync(handoffsDir)) return [];

    const handoffs = [];
    try {
      const files = fs.readdirSync(handoffsDir).filter(f => f.endsWith('.yaml'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(handoffsDir, file), 'utf8');
          const handoff = yaml.load(content);

          // Apply filters
          if (filter.status && handoff.status !== filter.status) continue;
          if (filter.fromAgent && handoff.from_agent !== filter.fromAgent) continue;
          if (filter.toAgent && handoff.to_agent !== filter.toAgent) continue;

          handoffs.push(handoff);
        } catch { /* skip corrupt files */ }
      }
    } catch { /* skip */ }

    return handoffs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getLatestHandoff(offerPath, fromAgent, toAgent) {
    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    const handoffsDir = path.join(fullOfferPath, '.aios', 'handoffs');
    if (!fs.existsSync(handoffsDir)) return null;

    try {
      const files = fs.readdirSync(handoffsDir)
        .filter(f => f.endsWith('.yaml') && f.includes(fromAgent) && f.includes(toAgent))
        .sort()
        .reverse();

      if (files.length === 0) return null;

      const content = fs.readFileSync(path.join(handoffsDir, files[0]), 'utf8');
      return yaml.load(content);
    } catch {
      return null;
    }
  }

  formatHandoffContext(handoff) {
    if (!handoff) return '';

    const lines = [];
    lines.push(`<handoff id="${handoff.id}" from="${handoff.from_agent}" to="${handoff.to_agent}" status="${handoff.status}">`);

    // Artifacts
    lines.push('  <artifacts>');
    for (const artifact of handoff.artifacts) {
      const status = artifact.exists ? 'present' : 'missing';
      lines.push(`    <artifact path="${artifact.path}" required="${artifact.required}" status="${status}" />`);
    }
    lines.push('  </artifacts>');

    // Context
    if (handoff.context) {
      lines.push('  <context>');
      if (handoff.context.confidence) {
        lines.push(`    <confidence>${handoff.context.confidence}%</confidence>`);
      }
      if (handoff.context.gate_passed) {
        lines.push(`    <gate-passed>${handoff.context.phase_completed || 'yes'}</gate-passed>`);
      }
      if (handoff.context.notes) {
        lines.push(`    <notes>${handoff.context.notes}</notes>`);
      }
      if (handoff.context.scores && Object.keys(handoff.context.scores).length > 0) {
        lines.push(`    <scores>${JSON.stringify(handoff.context.scores)}</scores>`);
      }
      lines.push('  </context>');
    }

    // Checklist
    if (handoff.receiving_checklist && handoff.receiving_checklist.length > 0) {
      lines.push('  <receiving-checklist>');
      for (const item of handoff.receiving_checklist) {
        lines.push(`    <check>${item}</check>`);
      }
      lines.push('  </receiving-checklist>');
    }

    lines.push('</handoff>');
    return lines.join('\n');
  }

  /**
   * Get the agents for the next phase after a completed phase.
   * Used by handoff-validator-hook for chaining (Gap 2).
   */
  getNextPhaseAgents(workflowPath, completedPhaseId) {
    try {
      if (!fs.existsSync(workflowPath)) return [];

      const content = fs.readFileSync(workflowPath, 'utf8');
      const parsed = yaml.load(content);
      const phases = parsed?.workflow?.phases || [];

      // Find phases that depend on the completed phase
      const nextPhases = phases.filter(p => {
        const deps = p.depends_on || [];
        return deps.includes(completedPhaseId);
      });

      return nextPhases.map(p => ({
        phaseId: p.id,
        title: p.title || p.id,
        agents: p.agents || [],
        parallel: p.parallel || false,
        humanGate: p.human_gate || false,
        handoffPrompt: p.handoff_prompt || '',
      }));
    } catch (e) {
      this._log(`getNextPhaseAgents error: ${e.message}`);
      return [];
    }
  }

  _buildReceivingChecklist(fromAgent, toAgent, context = {}) {
    const checklist = [];

    // Research → Briefing
    if (fromAgent === 'vox' && toAgent === 'atlas') {
      checklist.push('Verify synthesis.md confidence >= 70%');
      checklist.push('Check DRE identification has VOC evidence');
      checklist.push('Confirm 4 research summaries exist (voc, competitors, mechanism, avatar)');
      checklist.push('Validate VOC quotes are authentic (username + engagement)');
    }

    // Briefing → Production
    if (fromAgent === 'atlas' && ['echo', 'forge', 'scout', 'blade'].includes(toAgent)) {
      checklist.push('Verify 10 HELIX phases complete');
      checklist.push('Check mecanismo-unico.yaml state is VALIDATED or APPROVED');
      checklist.push('Confirm MUP and MUS statements passed blind_critic >= 8');
      checklist.push('Verify human approval of MUP/MUS');
    }

    // Production → Review
    if (['echo', 'forge', 'scout', 'blade'].includes(fromAgent) && toAgent === 'hawk') {
      checklist.push('All production files exist in production/ directory');
      checklist.push('blind_critic scores >= 8 for each unit');
      checklist.push('emotional_stress_test genericidade >= 8');
      if (fromAgent === 'echo') {
        checklist.push('All 6 VSL chapters present');
        checklist.push('layered_review (3 layers) completed');
      }
      if (fromAgent === 'forge') {
        checklist.push('All 14 LP blocks present');
      }
    }

    // Add confidence check if provided
    if (context.confidence) {
      checklist.push(`Verify confidence level matches: ${context.confidence}%`);
    }

    return checklist;
  }

  async _saveHandoff(fullOfferPath, handoff) {
    const handoffsDir = path.join(fullOfferPath, '.aios', 'handoffs');
    await fsp.mkdir(handoffsDir, { recursive: true });

    const handoffPath = path.join(handoffsDir, `${handoff.id}.yaml`);
    await fsp.writeFile(handoffPath, yaml.dump(handoff, { lineWidth: 120 }), 'utf8');
    this._log(`Handoff saved: ${handoffPath}`);
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[HandoffProtocol] ${message}`);
    }
  }
}

module.exports = { HandoffProtocol, HandoffStatus, AGENT_HANDOFF_MAP };
