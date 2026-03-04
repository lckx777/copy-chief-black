'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { validate: validateFrontmatter } = require('./frontmatter-validator');
const { KnowledgeLoader } = require('./knowledge-loader');

const AGENTS_DIR = path.join(process.env.HOME, '.claude', 'agents');
const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');

class AgentActivationPipeline {
  constructor(ecosystemRoot, options = {}) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.options = {
      debug: false,
      agentsDir: AGENTS_DIR,
      maxTier2Files: 10,
      maxTier3Files: 5,
      maxFileSize: 50000,
      ...options,
    };
    this._knowledgeLoader = new KnowledgeLoader(this.ecosystemRoot, { debug: this.options.debug });
  }

  activate(agentId, offerPath, taskContext = {}) {
    const startTime = Date.now();
    const result = {
      agentId,
      offerPath,
      tiers: { t1: null, t2: null, t2_1: null, t2_2: null, t2_5: null, t3: null },
      context: '',
      timing: { t1: 0, t2: 0, t2_1: 0, t2_2: 0, t2_5: 0, t3: 0, total: 0 },
      warnings: [],
    };

    // Tier 1: Agent persona + frontmatter
    try {
      const t1Start = Date.now();
      result.tiers.t1 = this._loadTier1(agentId);
      result.timing.t1 = Date.now() - t1Start;

      // U-06: Merge frontmatter validation warnings (non-blocking)
      if (result.tiers.t1.frontmatterWarnings && result.tiers.t1.frontmatterWarnings.length > 0) {
        for (const w of result.tiers.t1.frontmatterWarnings) {
          result.warnings.push(`Frontmatter: ${w}`);
        }
      }
    } catch (e) {
      result.warnings.push(`Tier 1 failed: ${e.message}`);
      this._log(`Tier 1 failure for ${agentId}: ${e.message}`);
      // Tier 1 failure is fatal — can't activate without persona
      result.timing.total = Date.now() - startTime;
      result.context = this._buildContext(result);
      return result;
    }

    // Tier 2: Dependencies — registry-first, frontmatter fallback
    try {
      const t2Start = Date.now();
      const taskPrompt = taskContext.taskPrompt || '';
      const registryKnowledge = this._knowledgeLoader.resolveAgentKnowledge(agentId, taskPrompt);
      if (registryKnowledge) {
        result.tiers.t2 = {
          files: registryKnowledge.files,
          loaded: registryKnowledge.files.length,
          skipped: 0,
          source: 'registry',
          preFlight: registryKnowledge.preFlight,
          tier: registryKnowledge.tier,
        };
      } else {
        // Fallback to frontmatter dependencies
        result.tiers.t2 = this._loadTier2(result.tiers.t1);
      }
      result.timing.t2 = Date.now() - t2Start;
    } catch (e) {
      result.warnings.push(`Tier 2 degraded: ${e.message}`);
      this._log(`Tier 2 failure for ${agentId}: ${e.message}`);
    }

    // Tier 2.1: Voice DNA experts
    try {
      const t21Start = Date.now();
      const taskPrompt = taskContext.taskPrompt || '';
      const voiceDNA = this._knowledgeLoader.resolveVoiceDNA(agentId, taskPrompt);
      if (voiceDNA && voiceDNA.experts.length > 0) {
        result.tiers.t2_1 = voiceDNA;
      }
      result.timing.t2_1 = Date.now() - t21Start;
    } catch (e) {
      result.warnings.push(`Tier 2.1 degraded: ${e.message}`);
      this._log(`Tier 2.1 failure for ${agentId}: ${e.message}`);
    }

    // Tier 2.2: Skill Knowledge Bridge
    try {
      const t22Start = Date.now();
      const taskPrompt22 = taskContext.taskPrompt || '';
      const skillKnowledge = this._knowledgeLoader.resolveSkillKnowledge(agentId, offerPath, taskPrompt22);
      if (skillKnowledge && skillKnowledge.loaded > 0) {
        result.tiers.t2_2 = skillKnowledge;
      }
      result.timing.t2_2 = Date.now() - t22Start;
    } catch (e) {
      result.warnings.push(`Tier 2.2 degraded: ${e.message}`);
      this._log(`Tier 2.2 failure for ${agentId}: ${e.message}`);
    }

    // Tier 2.5: Agent memory (Gap 4 — persistent state)
    try {
      const t25Start = Date.now();
      result.tiers.t2_5 = this._loadTier2_5(agentId, offerPath);
      result.timing.t2_5 = Date.now() - t25Start;
    } catch (e) {
      result.warnings.push(`Tier 2.5 degraded: ${e.message}`);
      this._log(`Tier 2.5 failure for ${agentId}: ${e.message}`);
    }

    // Tier 3: Offer context
    if (offerPath) {
      try {
        const t3Start = Date.now();
        result.tiers.t3 = this._loadTier3(offerPath, taskContext);
        result.timing.t3 = Date.now() - t3Start;
      } catch (e) {
        result.warnings.push(`Tier 3 degraded: ${e.message}`);
        this._log(`Tier 3 failure for ${agentId}: ${e.message}`);
      }
    }

    result.timing.total = Date.now() - startTime;
    result.context = this._buildContext(result);
    return result;
  }

  _loadTier1(agentId) {
    const agentFile = path.join(this.options.agentsDir, `${agentId}.md`);
    if (!fs.existsSync(agentFile)) {
      throw new Error(`Agent file not found: ${agentFile}`);
    }

    const content = fs.readFileSync(agentFile, 'utf8');
    const frontmatter = this._parseFrontmatter(content);

    // U-06: Validate frontmatter required fields (non-blocking)
    const frontmatterWarnings = validateFrontmatter(frontmatter, path.basename(agentFile));

    return {
      agentId,
      agentFile,
      name: frontmatter?.agent?.name || agentId,
      title: frontmatter?.agent?.title || '',
      icon: frontmatter?.agent?.icon || '',
      persona: frontmatter?.persona || {},
      commands: frontmatter?.commands || [],
      dependencies: frontmatter?.dependencies || {},
      fullContent: content,
      frontmatterWarnings,
    };
  }

  _loadTier2(tier1Data) {
    const deps = tier1Data.dependencies?.data || [];
    if (deps.length === 0) {
      return { files: [], loaded: 0, skipped: 0 };
    }

    const files = [];
    let skipped = 0;

    for (const dep of deps.slice(0, this.options.maxTier2Files)) {
      const depPath = path.join(this.ecosystemRoot, dep);
      if (!fs.existsSync(depPath)) {
        // Try from home
        const homePath = path.join(process.env.HOME, dep);
        if (fs.existsSync(homePath)) {
          const content = this._readFileSafe(homePath);
          if (content) {
            files.push({ path: dep, content, source: 'home' });
          } else {
            skipped++;
          }
        } else {
          skipped++;
          this._log(`Tier 2 dep not found: ${dep}`);
        }
        continue;
      }

      const content = this._readFileSafe(depPath);
      if (content) {
        files.push({ path: dep, content, source: 'ecosystem' });
      } else {
        skipped++;
      }
    }

    return { files, loaded: files.length, skipped };
  }

  _loadTier2_5(agentId, offerPath) {
    try {
      const { AgentMemoryManager } = require('../memory/agent-memory-manager');
      const memoryManager = new AgentMemoryManager({ debug: this.options.debug });

      const context = memoryManager.buildActivationContext(agentId, offerPath);
      if (!context) return null;

      return { context, loaded: true };
    } catch (e) {
      this._log(`Tier 2.5 load error: ${e.message}`);
      return null;
    }
  }

  _loadTier3(offerPath, taskContext = {}) {
    const fullOfferPath = offerPath.startsWith('/')
      ? offerPath
      : path.join(this.ecosystemRoot, offerPath);

    const files = [];
    const filesToLoad = [
      { name: 'CONTEXT.md', required: true },
      { name: 'helix-state.yaml', required: true },
      { name: 'mecanismo-unico.yaml', required: false },
      { name: 'research/synthesis.md', required: false },
      { name: 'briefings/helix-complete.md', required: false },
    ];

    for (const fileSpec of filesToLoad) {
      const filePath = path.join(fullOfferPath, fileSpec.name);
      if (!fs.existsSync(filePath)) {
        if (fileSpec.required) {
          this._log(`Tier 3 required file missing: ${fileSpec.name}`);
        }
        continue;
      }

      const content = this._readFileSafe(filePath);
      if (content) {
        files.push({ name: fileSpec.name, content, required: fileSpec.required });
      }
    }

    return {
      offerPath: fullOfferPath,
      files,
      loaded: files.length,
      taskContext,
    };
  }

  _parseFrontmatter(content) {
    const fmMatch = content.match(/^#[^\n]*\n+[^\n]*\n+---\n([\s\S]*?)---/);
    if (!fmMatch) return null;

    try {
      return yaml.load(fmMatch[1]);
    } catch {
      return null;
    }
  }

  _readFileSafe(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.options.maxFileSize) {
        this._log(`File too large, truncating: ${filePath} (${stats.size} bytes)`);
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(this.options.maxFileSize);
        fs.readSync(fd, buffer, 0, this.options.maxFileSize, 0);
        fs.closeSync(fd);
        return buffer.toString('utf8') + '\n...[truncated]';
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      this._log(`Failed to read: ${filePath} — ${e.message}`);
      return null;
    }
  }

  _buildContext(activationResult) {
    const lines = [];
    const t1 = activationResult.tiers.t1;
    const t2 = activationResult.tiers.t2;
    const t3 = activationResult.tiers.t3;

    lines.push('<agent-activation>');
    lines.push(`<agent id="${activationResult.agentId}" name="${t1?.name || 'unknown'}" title="${t1?.title || ''}">`);

    // Tier 1: Persona
    if (t1) {
      lines.push('<persona>');
      lines.push(t1.fullContent);
      lines.push('</persona>');
    }

    // Tier 2: Dependencies / Pre-Flight Knowledge
    if (t2 && t2.files.length > 0) {
      if (t2.preFlight) {
        // Registry-sourced with pre-flight instruction
        lines.push(`<pre-flight-knowledge loaded="${t2.loaded}" source="${t2.source || 'frontmatter'}" tier="${t2.tier || 'unknown'}">`);
        lines.push('<instruction>MANDATORY STEP 0: Read and internalize ALL knowledge below BEFORE producing any copy.');
        lines.push('After reading, confirm internally: DRE level target, BLACK checklist lenses, writing rules applied.</instruction>');
        for (const file of t2.files) {
          lines.push(`<dep path="${file.path}">`);
          lines.push(file.content);
          lines.push('</dep>');
        }
        lines.push('</pre-flight-knowledge>');
      } else {
        // Standard dependencies (backward compat)
        lines.push(`<dependencies loaded="${t2.loaded}" skipped="${t2.skipped || 0}">`);
        for (const file of t2.files) {
          lines.push(`<dep path="${file.path}">`);
          lines.push(file.content);
          lines.push('</dep>');
        }
        lines.push('</dependencies>');
      }
    }

    // Tier 2.1: Voice DNA
    const t2_1 = activationResult.tiers.t2_1;
    if (t2_1 && t2_1.experts.length > 0) {
      const expertIds = t2_1.experts.map(e => e.id).join(',');
      lines.push(`<voice-dna experts="${expertIds}">`);
      lines.push('<instruction>These are the Voice DNA patterns of master copywriters relevant to your task.');
      lines.push('INTERNALIZE their voice patterns and apply them to your writing. Do not copy — channel.</instruction>');
      for (const expert of t2_1.experts) {
        lines.push(`<expert id="${expert.id}" name="${expert.name}" sections="${expert.sections}">`);
        lines.push(expert.content);
        lines.push('</expert>');
      }
      lines.push('</voice-dna>');
    }

    // Tier 2.2: Skill Knowledge
    const t2_2 = activationResult.tiers.t2_2;
    if (t2_2) {
      const skillId = t2_2.methodology[0]?.path.split('/')[1] || 'unknown';
      lines.push(`<skill-knowledge skill="${skillId}" loaded="${t2_2.loaded}">`);

      if (t2_2.methodology.length > 0) {
        lines.push('<methodology>');
        for (const m of t2_2.methodology) {
          lines.push(`<file path="${m.path}">`);
          lines.push(m.content);
          lines.push('</file>');
        }
        lines.push('</methodology>');
      }

      if (t2_2.onDemand.length > 0) {
        lines.push('<on-demand>');
        for (const od of t2_2.onDemand) {
          lines.push(`<file path="${od.path}">`);
          lines.push(od.content);
          lines.push('</file>');
        }
        lines.push('</on-demand>');
      }

      if (t2_2.swipes.length > 0) {
        lines.push(`<swipes count="${t2_2.swipes.length}">`);
        lines.push('<instruction>Reference swipe files from your niche. Study structure and techniques, do NOT copy.</instruction>');
        for (const s of t2_2.swipes) {
          lines.push(`<swipe path="${s.path}">`);
          lines.push(s.content);
          lines.push('</swipe>');
        }
        lines.push('</swipes>');
      }

      lines.push('</skill-knowledge>');
    }

    // Tier 2.5: Agent memory
    const t2_5 = activationResult.tiers.t2_5;
    if (t2_5 && t2_5.context) {
      lines.push(t2_5.context);
    }

    // Tier 3: Offer context
    if (t3 && t3.files.length > 0) {
      lines.push(`<offer-context path="${t3.offerPath}" loaded="${t3.loaded}">`);
      for (const file of t3.files) {
        lines.push(`<file name="${file.name}" required="${file.required}">`);
        lines.push(file.content);
        lines.push('</file>');
      }
      lines.push('</offer-context>');
    }

    // Warnings
    if (activationResult.warnings.length > 0) {
      lines.push('<activation-warnings>');
      for (const w of activationResult.warnings) {
        lines.push(`  <warning>${w}</warning>`);
      }
      lines.push('</activation-warnings>');
    }

    // Timing
    lines.push(`<timing t1="${activationResult.timing.t1}ms" t2="${activationResult.timing.t2}ms" t2.1="${activationResult.timing.t2_1}ms" t2.2="${activationResult.timing.t2_2}ms" t2.5="${activationResult.timing.t2_5}ms" t3="${activationResult.timing.t3}ms" total="${activationResult.timing.total}ms" />`);

    lines.push('</agent>');
    lines.push('</agent-activation>');

    return lines.join('\n');
  }

  _handleTierFailure(tier, error) {
    this._log(`Tier ${tier} failed: ${error.message}`);
    return null;
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[AgentActivation] ${message}`);
    }
  }
}

module.exports = { AgentActivationPipeline };
