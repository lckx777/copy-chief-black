'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ECOSYSTEM_ROOT = path.join(process.env.HOME, 'copywriting-ecosystem');
const DATA_DIR = 'squads/copy-chief/data';

class KnowledgeLoader {
  constructor(ecosystemRoot, options = {}) {
    this.ecosystemRoot = ecosystemRoot || ECOSYSTEM_ROOT;
    this.options = { debug: false, ...options };
    this._registryCache = null;
    this._registryMtime = 0;
    this._manifestCache = null;
    this._manifestMtime = 0;
    this._expertCache = new Map();
  }

  // =========================================================================
  // Entry Point 1: Agent Knowledge (shared_files + files_loaded)
  // =========================================================================

  resolveAgentKnowledge(agentId, taskPrompt = '') {
    const registry = this._loadRegistry();
    if (!registry) return null;

    const agentConfig = registry.agents?.[agentId];
    if (!agentConfig) return null;

    // --- V2: files_loaded + shared_files pattern ---
    if (agentConfig.files_loaded !== undefined || agentConfig.copy_sections !== undefined) {
      return this._resolveAgentKnowledgeV2(agentId, agentConfig, registry, taskPrompt);
    }

    // --- V1 fallback: knowledge[] + $craft_core + lazy[] ---
    return this._resolveAgentKnowledgeV1(agentConfig, registry, taskPrompt);
  }

  _resolveAgentKnowledgeV2(agentId, agentConfig, registry, taskPrompt) {
    const expanded = [];

    // 1. Shared files where used_by includes this agent
    const sharedFiles = registry.shared_files || [];
    for (const sf of sharedFiles) {
      if (sf.used_by?.includes(agentId)) {
        expanded.push(sf.path);
      }
    }

    // 2. Agent-specific files_loaded with lazy/condition support
    const filesToLoad = agentConfig.files_loaded || [];
    for (const file of filesToLoad) {
      if (file.lazy && file.condition) {
        if (taskPrompt) {
          const keywords = file.condition.split('|').map(k => k.trim().toLowerCase());
          if (keywords.some(kw => taskPrompt.toLowerCase().includes(kw))) {
            expanded.push(file.path);
          }
        }
      } else {
        expanded.push(file.path);
      }
    }

    // 3. Deduplicate
    const unique = [...new Set(expanded)];

    // 4. Load file contents
    const files = [];
    for (const relPath of unique) {
      const content = this._readEcosystemFile(relPath);
      if (content) {
        files.push({ path: relPath, content });
      }
    }

    return {
      files,
      preFlight: agentConfig.pre_flight || false,
      tier: agentConfig.tier || 'unknown',
      performanceTarget: agentConfig.performance_target || null,
    };
  }

  _resolveAgentKnowledgeV1(agentConfig, registry, taskPrompt) {
    const knowledge = agentConfig.knowledge || [];
    if (knowledge.length === 0 && !agentConfig.pre_flight) return null;

    const craftCore = registry.shared_knowledge?.craft_core || [];
    const expanded = [];
    for (const entry of knowledge) {
      if (entry === '$craft_core') {
        expanded.push(...craftCore);
      } else {
        expanded.push(path.join(DATA_DIR, entry));
      }
    }

    if (agentConfig.lazy && taskPrompt) {
      const promptLower = taskPrompt.toLowerCase();
      for (const lazy of agentConfig.lazy) {
        const keywords = lazy.condition.split('|').map(k => k.trim().toLowerCase());
        if (keywords.some(kw => promptLower.includes(kw))) {
          expanded.push(path.join(DATA_DIR, lazy.file));
        }
      }
    }

    const unique = [...new Set(expanded)];
    const files = [];
    for (const relPath of unique) {
      const content = this._readEcosystemFile(relPath);
      if (content) {
        files.push({ path: relPath, content });
      }
    }

    return {
      files,
      preFlight: agentConfig.pre_flight || false,
      tier: agentConfig.tier || 'unknown',
      maxLoadKb: agentConfig.max_load_kb || 80,
    };
  }

  // =========================================================================
  // Entry Point 2: Chief Knowledge (condensed principles)
  // =========================================================================

  loadChiefKnowledge() {
    const registry = this._loadRegistry();
    if (!registry) return null;

    const chiefConfig = registry.chief_knowledge;
    if (!chiefConfig?.source_file) return null;

    const content = this._readEcosystemFile(chiefConfig.source_file);
    return content || null;
  }

  // =========================================================================
  // Entry Point 3: Voice DNA Expert Injection
  // =========================================================================

  resolveVoiceDNA(agentId, taskPrompt = '') {
    const registry = this._loadRegistry();
    if (!registry) return null;

    const agentConfig = registry.agents?.[agentId];
    if (!agentConfig) return null;

    const voiceConfig = registry.voice_dna;
    if (!voiceConfig) return null;

    const maxExperts = voiceConfig.extraction?.max_experts_per_agent || 4;
    const maxTokens = voiceConfig.extraction?.max_tokens_per_expert || 400;

    // --- V2: copy_sections → section_to_expert dynamic resolution ---
    if (agentConfig.copy_sections?.length > 0) {
      return this._resolveVoiceDNAV2(agentConfig, voiceConfig, taskPrompt, maxExperts, maxTokens);
    }

    // --- V1 fallback: agent_defaults + task_routing (hardcoded) ---
    if (agentConfig.voice_dna) {
      return this._resolveVoiceDNAV1(agentConfig, voiceConfig, taskPrompt, maxExperts, maxTokens);
    }

    return null;
  }

  _resolveVoiceDNAV2(agentConfig, voiceConfig, taskPrompt, maxExperts, maxTokens) {
    const manifest = this._loadManifest(voiceConfig);
    if (!manifest) return null;

    const sectionToExpert = manifest.section_to_expert || {};
    const decisionTree = manifest.copy_chief?.decision_tree || {};

    // STEP 1: copy_sections → experts via section_to_expert
    const sectionExperts = new Set();
    for (const section of agentConfig.copy_sections) {
      const expertId = sectionToExpert[section];
      if (expertId) sectionExperts.add(expertId);
    }

    // STEP 2: Task keyword enrichment via decision_tree
    if (taskPrompt) {
      const promptLower = taskPrompt.toLowerCase();
      for (const [taskType, experts] of Object.entries(decisionTree)) {
        const keywords = taskType.split('_');
        if (keywords.some(kw => kw.length > 2 && promptLower.includes(kw))) {
          for (const e of experts) sectionExperts.add(e);
        }
      }
    }

    // STEP 3: Cap at max_experts_per_agent
    const selected = [...sectionExperts].slice(0, maxExperts);
    if (selected.length === 0) return null;

    // STEP 4: Load expert DNA files
    const sourceDir = this._resolveHomePath(voiceConfig.source_dir);
    const preferredSection = voiceConfig.extraction?.preferred_section || '## Injection Prompt';
    const fallbackFields = voiceConfig.extraction?.fallback_fields || ['Core Identity'];

    const experts = [];
    for (const expertId of selected) {
      const content = this._loadExpertDNA(expertId, sourceDir, preferredSection, fallbackFields, maxTokens);
      if (content) {
        experts.push(content);
      }
    }

    return { experts, loaded: experts.length };
  }

  _resolveVoiceDNAV1(agentConfig, voiceConfig, taskPrompt, maxExperts, maxTokens) {
    const defaultsRef = agentConfig.voice_dna.replace('$', '');
    const defaultExperts = voiceConfig.agent_defaults?.[defaultsRef] || [];

    const routingExperts = [];
    if (taskPrompt && voiceConfig.task_routing) {
      const promptLower = taskPrompt.toLowerCase();
      for (const [pattern, experts] of Object.entries(voiceConfig.task_routing)) {
        const keywords = pattern.split('|').map(k => k.trim().toLowerCase());
        if (keywords.some(kw => promptLower.includes(kw))) {
          routingExperts.push(...experts);
        }
      }
    }

    const allExperts = [...defaultExperts];
    for (const e of routingExperts) {
      if (!allExperts.includes(e)) allExperts.push(e);
    }

    const selected = allExperts.slice(0, maxExperts);
    if (selected.length === 0) return null;

    const sourceDir = this._resolveHomePath(voiceConfig.source_dir);
    const preferredSection = voiceConfig.extraction?.preferred_section || '## Injection Prompt';
    const fallbackFields = voiceConfig.extraction?.fallback_fields || ['Core Identity'];

    const experts = [];
    for (const expertId of selected) {
      const content = this._loadExpertDNA(expertId, sourceDir, preferredSection, fallbackFields, maxTokens);
      if (content) {
        experts.push(content);
      }
    }

    return { experts, loaded: experts.length };
  }

  // =========================================================================
  // Entry Point 4: Skill Knowledge Bridge (Tier 2.2)
  // =========================================================================

  resolveSkillKnowledge(agentId, offerPath, taskPrompt = '') {
    const registry = this._loadRegistry();
    if (!registry?.skill_bridge) return null;

    const bridge = registry.skill_bridge;
    const agentBridge = bridge.agents?.[agentId];
    if (!agentBridge) return null;

    const skillRoot = this._resolveHomePath(bridge.skills_root);
    const skillDir = path.join(skillRoot, agentBridge.skill_id);
    if (!fs.existsSync(skillDir)) return null;

    const result = { methodology: [], swipes: [], onDemand: [], loaded: 0 };

    // 1. Methodology files (always loaded)
    for (const entry of agentBridge.methodology || []) {
      const entryPath = typeof entry === 'string' ? entry : entry.path;
      const filePath = path.join(skillDir, entryPath);

      if (entry.extract_sections) {
        const fullContent = this._readFileSafe(filePath);
        if (fullContent) {
          const extracted = entry.extract_sections
            .map(s => this._extractMarkdownSection(fullContent, s))
            .filter(Boolean)
            .join('\n\n');
          if (extracted) {
            result.methodology.push({ path: `skills/${agentBridge.skill_id}/${entryPath}`, content: extracted });
            result.loaded++;
          }
        }
      } else {
        const content = this._readFileSafe(filePath);
        if (content) {
          result.methodology.push({ path: `skills/${agentBridge.skill_id}/${entryPath}`, content });
          result.loaded++;
        }
      }
    }

    // 2. On-demand files (conditional on taskPrompt)
    if (taskPrompt) {
      const promptLower = taskPrompt.toLowerCase();
      for (const od of agentBridge.on_demand || []) {
        const keywords = od.condition.split('|').map(k => k.trim().toLowerCase());
        if (keywords.some(kw => promptLower.includes(kw))) {
          const filePath = path.join(skillDir, od.path);
          const content = this._readFileSafe(filePath);
          if (content) {
            result.onDemand.push({ path: `skills/${agentBridge.skill_id}/${od.path}`, content });
            result.loaded++;
          }
        }
      }
    }

    // 3. Niche-matched swipes (only if agent has swipes: true)
    if (agentBridge.swipes && offerPath) {
      const swipeRoot = this._resolveHomePath(bridge.swipe_root);
      const nicheDirs = this._resolveNicheSwipeDirs(bridge, offerPath);
      const maxSwipes = bridge.max_swipes || 5;
      const maxSize = bridge.max_swipe_size || 4096;

      for (const nicheDir of nicheDirs) {
        if (result.swipes.length >= maxSwipes) break;
        const dirPath = path.join(swipeRoot, nicheDir);
        if (!fs.existsSync(dirPath)) continue;

        let files;
        try { files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')); }
        catch { continue; }

        for (const file of files) {
          if (result.swipes.length >= maxSwipes) break;
          const filePath = path.join(dirPath, file);
          const content = this._readFileSafe(filePath);
          if (content && content.length > 200) {
            const truncated = content.length > maxSize
              ? content.substring(0, maxSize) + '\n...[truncated]'
              : content;
            result.swipes.push({ path: `swipe-files/${nicheDir}/${file}`, content: truncated });
            result.loaded++;
          }
        }
      }
    }

    return result.loaded > 0 ? result : null;
  }

  // Private: Resolve niche directories from offer context
  _resolveNicheSwipeDirs(bridge, offerPath) {
    const nicheMap = bridge.niche_map || {};
    const matched = new Set();

    const terms = this._extractNicheTerms(offerPath);

    for (const term of terms) {
      const termLower = term.toLowerCase();
      for (const [keyword, dirs] of Object.entries(nicheMap)) {
        if (termLower.includes(keyword)) {
          for (const d of dirs) matched.add(d);
        }
      }
    }

    return [...matched];
  }

  // Private: Extract niche terms from offer path + CONTEXT.md
  _extractNicheTerms(offerPath) {
    const terms = offerPath.split('/');

    // Try to read sub_niche from CONTEXT.md
    const contextPath = path.join(this.ecosystemRoot, offerPath, 'CONTEXT.md');
    try {
      if (fs.existsSync(contextPath)) {
        const ctx = fs.readFileSync(contextPath, 'utf8').substring(0, 3000);
        const subNiche = ctx.match(/sub[_-]?nicho[:\s|]*\*?\*?\s*([^\n|*]+)/i);
        if (subNiche) {
          terms.push(...subNiche[1].trim().toLowerCase().split(/[\s\/]+/));
        }
      }
    } catch { /* graceful */ }

    // Read project_state.yaml for sub_niche too
    const statePath = path.join(this.ecosystemRoot, offerPath, 'project_state.yaml');
    try {
      if (fs.existsSync(statePath)) {
        const state = fs.readFileSync(statePath, 'utf8').substring(0, 1000);
        const subMatch = state.match(/sub_niche:\s*["']?([^"'\n]+)/i);
        if (subMatch) {
          terms.push(...subMatch[1].trim().toLowerCase().split(/[\s\/-]+/));
        }
      }
    } catch { /* graceful */ }

    return [...new Set(terms)];
  }

  // Private: Extract a markdown section by heading
  _extractMarkdownSection(content, heading) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}[^\n]*\n([\\s\\S]*?)(?=\n##\\s|$)`);
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  // Private: Read file safely with size guard
  _readFileSafe(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const stats = fs.statSync(filePath);
      if (stats.size > 100000) {
        this._log(`File too large for skill bridge: ${filePath}`);
        return null;
      }
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  // =========================================================================
  // Private: Registry loading with mtime cache
  // =========================================================================

  _loadRegistry() {
    const registryPath = path.join(this.ecosystemRoot, DATA_DIR, 'copy-chief-data-requirements.yaml');

    try {
      if (!fs.existsSync(registryPath)) {
        this._log('Registry not found, using frontmatter fallback');
        return null;
      }

      const stat = fs.statSync(registryPath);
      const mtime = stat.mtimeMs;

      if (this._registryCache && mtime === this._registryMtime) {
        return this._registryCache;
      }

      const content = fs.readFileSync(registryPath, 'utf8');
      this._registryCache = yaml.load(content);
      this._registryMtime = mtime;
      return this._registryCache;
    } catch (e) {
      this._log(`Registry load error: ${e.message}`);
      return null;
    }
  }

  // =========================================================================
  // Private: Manifest loading with mtime cache
  // =========================================================================

  _loadManifest(voiceConfig) {
    const manifestPath = this._resolveHomePath(voiceConfig?.manifest);
    if (!manifestPath) return null;

    try {
      if (!fs.existsSync(manifestPath)) {
        this._log('Manifest not found');
        return null;
      }

      const stat = fs.statSync(manifestPath);
      const mtime = stat.mtimeMs;

      if (this._manifestCache && mtime === this._manifestMtime) {
        return this._manifestCache;
      }

      const content = fs.readFileSync(manifestPath, 'utf8');
      this._manifestCache = yaml.load(content);
      this._manifestMtime = mtime;
      return this._manifestCache;
    } catch (e) {
      this._log(`Manifest load error: ${e.message}`);
      return null;
    }
  }

  // =========================================================================
  // Private: Expert DNA extraction
  // =========================================================================

  _loadExpertDNA(expertId, sourceDir, preferredSection, fallbackFields, maxTokens) {
    if (this._expertCache.has(expertId)) {
      return this._expertCache.get(expertId);
    }

    const candidateFiles = [
      path.join(sourceDir, `${expertId}.md`),
    ];

    let filePath = null;
    for (const candidate of candidateFiles) {
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }

    if (!filePath) {
      this._log(`Expert file not found: ${expertId}`);
      return null;
    }

    try {
      const fullContent = fs.readFileSync(filePath, 'utf8');

      const nameMatch = fullContent.match(/^# (.+?)(?:\s*-|$)/m);
      const name = nameMatch ? nameMatch[1].trim() : expertId;

      const sectionsMatch = fullContent.match(/>\s*\*\*Sections:\*\*\s*(.+)/);
      const sections = sectionsMatch
        ? sectionsMatch[1].trim()
        : '';

      let extracted = this._extractSection(fullContent, preferredSection);

      if (!extracted) {
        extracted = this._extractFallback(fullContent, fallbackFields);
      }

      if (!extracted) {
        this._log(`No extractable content for expert: ${expertId}`);
        return null;
      }

      const maxChars = maxTokens * 4;
      if (extracted.length > maxChars) {
        extracted = extracted.substring(0, maxChars) + '\n...[truncated]';
      }

      const result = { id: expertId, name, sections, content: extracted };
      this._expertCache.set(expertId, result);
      return result;
    } catch (e) {
      this._log(`Expert load error for ${expertId}: ${e.message}`);
      return null;
    }
  }

  _extractSection(content, heading) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escapedHeading}[^\n]*\n([\s\S]*?)(?=\n##\\s|$)`);
    const match = content.match(regex);
    if (!match) return null;
    const extracted = match[1].trim();
    return extracted.length > 50 ? extracted : null;
  }

  _extractFallback(content, fallbackFields) {
    const parts = [];

    for (const field of fallbackFields) {
      const regex = new RegExp(`>\\s*\\*\\*${field}:\\*\\*\\s*(.+)`);
      const match = content.match(regex);
      if (match) {
        parts.push(match[1].trim());
      }
    }

    const vpMatch = content.match(/## Voice Patterns\n([\s\S]*?)(?=\n## [^V]|\n---\s*\n## |$)/);
    if (vpMatch) {
      const vpContent = vpMatch[1];
      const headers = vpContent.match(/### \d+\. .+/g);
      if (headers) {
        parts.push('Voice Patterns: ' + headers.map(h => h.replace(/^### \d+\.\s*/, '')).join(', '));
      }
    }

    return parts.length > 0 ? parts.join('\n') : null;
  }

  // =========================================================================
  // Private: File reading helpers
  // =========================================================================

  _readEcosystemFile(relPath) {
    try {
      const fullPath = path.join(this.ecosystemRoot, relPath);
      if (!fs.existsSync(fullPath)) {
        this._log(`File not found: ${relPath}`);
        return null;
      }
      return fs.readFileSync(fullPath, 'utf8');
    } catch (e) {
      this._log(`Read error: ${relPath} — ${e.message}`);
      return null;
    }
  }

  _resolveHomePath(p) {
    if (!p) return '';
    return p.replace(/^~/, process.env.HOME);
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[KnowledgeLoader] ${message}`);
    }
  }
}

module.exports = { KnowledgeLoader };
