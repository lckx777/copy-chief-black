'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { KnowledgeLoader } = require('../activation/knowledge-loader');

const AGENTS_DIR = path.join(process.env.HOME, '.claude', 'agents');
const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

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
};

class CopyPromptBuilder {
  constructor(ecosystemRoot, options = {}) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.options = {
      debug: false,
      agentsDir: AGENTS_DIR,
      maxFileSize: 50000,
      ...options,
    };
    this._knowledgeLoader = new KnowledgeLoader(this.ecosystemRoot, { debug: this.options.debug });
  }

  buildDispatchPayload(phase, offerRelativePath, context = {}) {
    const agents = phase.agents || [];
    const payloads = [];

    for (const agentId of agents) {
      const payload = this._buildSinglePayload(agentId, phase, offerRelativePath, context);
      payloads.push(payload);
    }

    return payloads;
  }

  _buildSinglePayload(agentId, phase, offerRelativePath, context = {}) {
    const agentFile = path.join(this.options.agentsDir, `${agentId}.md`);
    const agentDef = this._parseAgentFile(agentFile);
    const model = AGENT_MODELS[agentId] || 'sonnet';

    const promptParts = [];

    // Layer 1: Identity
    promptParts.push(`You are ${agentDef.name} (@${agentId}).`);
    promptParts.push(`Read your instructions: ~/.claude/agents/${agentId}.md`);
    promptParts.push('');

    // Layer 2: Task
    promptParts.push(`TASK: ${phase.title || phase.id}`);
    promptParts.push(`OFFER: ${offerRelativePath} at ~/copywriting-ecosystem/${offerRelativePath}/`);
    promptParts.push('');

    // Layer 3: Handoff prompt from workflow YAML
    if (phase.handoff_prompt) {
      promptParts.push('INSTRUCTIONS:');
      promptParts.push(phase.handoff_prompt.trim());
      promptParts.push('');
    }

    // Layer 4: Knowledge context (registry-first, frontmatter fallback)
    const taskPrompt = phase.title || phase.id || '';
    const registryKnowledge = this._knowledgeLoader.resolveAgentKnowledge(agentId, taskPrompt);

    if (registryKnowledge && registryKnowledge.preFlight) {
      promptParts.push('PRE-FLIGHT KNOWLEDGE (MANDATORY STEP 0):');
      promptParts.push('Read and internalize these files BEFORE writing ANY copy:');
      for (const file of registryKnowledge.files) {
        promptParts.push(`- ${file.path}`);
      }
      promptParts.push('After reading, confirm: DRE level target, checklist lenses, writing rules.');
      promptParts.push('');

      // Voice DNA experts
      const voiceDNA = this._knowledgeLoader.resolveVoiceDNA(agentId, taskPrompt);
      if (voiceDNA && voiceDNA.experts.length > 0) {
        promptParts.push('VOICE DNA EXPERTS (channel these voices):');
        for (const expert of voiceDNA.experts) {
          promptParts.push(`- ${expert.name} (${expert.sections})`);
        }
        promptParts.push('');
      }
    } else if (registryKnowledge && registryKnowledge.files.length > 0) {
      promptParts.push('DEPENDENCIES TO READ:');
      for (const file of registryKnowledge.files) {
        promptParts.push(`- ${file.path}`);
      }
      promptParts.push('');
    } else if (agentDef.dependencies && agentDef.dependencies.length > 0) {
      // Fallback to frontmatter
      promptParts.push('DEPENDENCIES TO READ:');
      for (const dep of agentDef.dependencies) {
        promptParts.push(`- ${dep}`);
      }
      promptParts.push('');
    }

    // Layer 5: Offer context files
    const offerPath = path.join(this.ecosystemRoot, offerRelativePath);
    const contextFiles = this._getOfferContextFiles(offerPath);
    if (contextFiles.length > 0) {
      promptParts.push('OFFER CONTEXT FILES:');
      for (const cf of contextFiles) {
        promptParts.push(`- ${cf}`);
      }
      promptParts.push('');
    }

    // Layer 6: Previous phase outputs
    if (context.previousOutputs && context.previousOutputs.length > 0) {
      promptParts.push('PREVIOUS PHASE OUTPUTS:');
      for (const output of context.previousOutputs) {
        promptParts.push(`- ${output}`);
      }
      promptParts.push('');
    }

    // Layer 7: Expected outputs
    const expectedOutputs = this._resolveExpectedOutputs(phase, offerRelativePath);
    if (expectedOutputs.length > 0) {
      promptParts.push('EXPECTED OUTPUTS:');
      for (const output of expectedOutputs) {
        promptParts.push(`- ${output}`);
      }
      promptParts.push('');
    }

    promptParts.push('Write outputs to files. Return YAML summary.');

    return {
      agentId,
      agentFile,
      model,
      subagentType: 'general-purpose',
      prompt: promptParts.join('\n'),
      offerPath: offerRelativePath,
      phase: { id: phase.id, title: phase.title || phase.id },
      dependencies: agentDef.dependencies,
      expectedOutputs,
      timeout: 600000,
    };
  }

  _parseAgentFile(agentFile) {
    const result = {
      name: path.basename(agentFile, '.md'),
      dependencies: [],
    };

    if (!fs.existsSync(agentFile)) {
      this._log(`Agent file not found: ${agentFile}`);
      return result;
    }

    try {
      const content = fs.readFileSync(agentFile, 'utf8');

      // Parse YAML frontmatter
      const fmMatch = content.match(/^#[^\n]*\n+[^\n]*\n+---\n([\s\S]*?)---/);
      if (fmMatch) {
        const fm = yaml.load(fmMatch[1]);
        result.name = fm?.agent?.name || result.name;
        result.dependencies = fm?.dependencies?.data || [];
      }
    } catch (e) {
      this._log(`Failed to parse agent file: ${e.message}`);
    }

    return result;
  }

  _getOfferContextFiles(offerPath) {
    const candidates = [
      'CONTEXT.md',
      'helix-state.yaml',
      'mecanismo-unico.yaml',
      'research/synthesis.md',
      'briefings/helix-complete.md',
    ];

    return candidates
      .filter(f => fs.existsSync(path.join(offerPath, f)))
      .map(f => `~/copywriting-ecosystem/${path.relative(this.ecosystemRoot, path.join(offerPath, f))}`);
  }

  _resolveExpectedOutputs(phase, offerRelativePath) {
    const outputs = [];
    const tasks = phase.tasks || [];

    const taskOutputMap = {
      'voc-extraction': [
        '{offer}/research/voc/summary.md',
        '{offer}/research/voc/trends-analysis.md',
      ],
      'competitor-analysis': [
        '{offer}/research/competitors/summary.md',
        '{offer}/research/competitors/ads-library-spy.md',
      ],
      'avatar-profiling': [
        '{offer}/research/avatar/summary.md',
      ],
      'helix-briefing': [
        '{offer}/briefings/phases/',
      ],
      'validate-mecanismo': [
        '{offer}/mecanismo-unico.yaml',
      ],
      'produce-vsl': [
        '{offer}/production/vsl/',
      ],
      'produce-landing-page': [
        '{offer}/production/landing-page/',
      ],
      'produce-creatives': [
        '{offer}/production/creatives/',
      ],
      'produce-emails': [
        '{offer}/production/emails/',
      ],
      'validate-deliverable': [
        '{offer}/production/review-results.md',
      ],
    };

    for (const task of tasks) {
      const taskOutputs = taskOutputMap[task] || [];
      for (const output of taskOutputs) {
        outputs.push(output.replace('{offer}', offerRelativePath));
      }
    }

    return outputs;
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[CopyPromptBuilder] ${message}`);
    }
  }
}

module.exports = { CopyPromptBuilder, AGENT_MODELS };
