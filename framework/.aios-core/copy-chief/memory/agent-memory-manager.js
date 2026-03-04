'use strict';

/**
 * Agent Memory Manager
 *
 * CRUD for persistent agent memory across sessions.
 * Three files per agent:
 *   - episodic.yaml: Task-level learnings (what worked, what didn't)
 *   - execution-log.yaml: Run history (when, what, result)
 *   - technique-register.yaml: Proven patterns (reusable techniques)
 *
 * Gap 4: Persistent Agent State
 *
 * @module agent-memory-manager
 * @version 1.0.0
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const AGENT_MEMORY_DIR = path.join(process.env.HOME, '.claude', 'agent-memory');

const MEMORY_CAPS = {
  episodic: 50,
  'execution-log': 30,
  'technique-register': 20,
};

const VALID_MEMORY_TYPES = ['episodic', 'execution-log', 'technique-register'];

class AgentMemoryManager {
  constructor(options = {}) {
    this.options = {
      debug: false,
      memoryDir: AGENT_MEMORY_DIR,
      ...options,
    };
  }

  /**
   * Load a memory file for an agent.
   * Returns [] if file doesn't exist.
   */
  load(agentId, memoryType) {
    this._validateType(memoryType);
    const filePath = this._memoryPath(agentId, memoryType);

    if (!fs.existsSync(filePath)) return [];

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      this._log(`Failed to load ${memoryType} for ${agentId}: ${e.message}`);
      return [];
    }
  }

  /**
   * Append an entry to a memory file (prepends to array, caps at max).
   */
  async append(agentId, memoryType, entry) {
    this._validateType(memoryType);
    const filePath = this._memoryPath(agentId, memoryType);

    let entries = this.load(agentId, memoryType);
    entries.unshift({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });

    // Cap entries
    const cap = MEMORY_CAPS[memoryType] || 50;
    if (entries.length > cap) {
      entries = entries.slice(0, cap);
    }

    await this._atomicWrite(filePath, entries);
    await this._updateIndex(agentId, memoryType, entry);

    this._log(`Appended to ${memoryType} for ${agentId} (total: ${entries.length})`);
    return entries;
  }

  /**
   * Append synchronously (for hooks with budget constraints).
   */
  appendSync(agentId, memoryType, entry) {
    this._validateType(memoryType);
    const filePath = this._memoryPath(agentId, memoryType);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    let entries = this.load(agentId, memoryType);
    entries.unshift({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });

    const cap = MEMORY_CAPS[memoryType] || 50;
    if (entries.length > cap) {
      entries = entries.slice(0, cap);
    }

    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, yaml.dump(entries, { lineWidth: 120, noRefs: true }), 'utf8');
    fs.renameSync(tmpPath, filePath);

    this._log(`Appended (sync) to ${memoryType} for ${agentId}`);
    return entries;
  }

  /**
   * Get the last N entries from a memory type.
   */
  getRecent(agentId, memoryType, count = 5) {
    const entries = this.load(agentId, memoryType);
    return entries.slice(0, count);
  }

  /**
   * Query entries filtered by offer and/or nicho.
   */
  query(agentId, memoryType, filter = {}) {
    const entries = this.load(agentId, memoryType);

    return entries.filter(entry => {
      if (filter.offer && entry.offer !== filter.offer) return false;
      if (filter.niche && entry.niche !== filter.niche) return false;
      if (filter.deliverable_type && entry.deliverable_type !== filter.deliverable_type) return false;
      if (filter.minScore && entry.score && entry.score < filter.minScore) return false;
      return true;
    });
  }

  /**
   * Update an existing entry by matching predicate.
   */
  async update(agentId, memoryType, matchFn, updater) {
    this._validateType(memoryType);
    const entries = this.load(agentId, memoryType);
    let updated = false;

    for (let i = 0; i < entries.length; i++) {
      if (matchFn(entries[i])) {
        entries[i] = { ...entries[i], ...updater(entries[i]) };
        updated = true;
        break;
      }
    }

    if (updated) {
      const filePath = this._memoryPath(agentId, memoryType);
      await this._atomicWrite(filePath, entries);
    }

    return updated;
  }

  /**
   * Delete entries matching a predicate.
   */
  async delete(agentId, memoryType, matchFn) {
    this._validateType(memoryType);
    const entries = this.load(agentId, memoryType);
    const filtered = entries.filter(e => !matchFn(e));

    if (filtered.length !== entries.length) {
      const filePath = this._memoryPath(agentId, memoryType);
      await this._atomicWrite(filePath, filtered);
    }

    return entries.length - filtered.length;
  }

  /**
   * Get summary stats for an agent's memory.
   */
  getStats(agentId) {
    const stats = {};
    for (const type of VALID_MEMORY_TYPES) {
      const entries = this.load(agentId, type);
      stats[type] = {
        count: entries.length,
        cap: MEMORY_CAPS[type],
        newest: entries[0]?.timestamp || null,
        oldest: entries[entries.length - 1]?.timestamp || null,
      };
    }
    return stats;
  }

  /**
   * Build context string for agent activation (Tier 2.5).
   * Returns XML-formatted memory context.
   */
  buildActivationContext(agentId, offerPath = null) {
    const lines = [];
    lines.push(`<agent-memory agent="${agentId}">`);

    // Recent episodic entries (last 5)
    const episodic = this.getRecent(agentId, 'episodic', 5);
    if (episodic.length > 0) {
      lines.push('  <episodic-memory>');
      for (const entry of episodic) {
        lines.push(`    <entry offer="${entry.offer || 'unknown'}" score="${entry.score || 'n/a'}">`);
        if (entry.learning) lines.push(`      <learning>${entry.learning}</learning>`);
        if (entry.tool) lines.push(`      <tool>${entry.tool}</tool>`);
        if (entry.result) lines.push(`      <result>${entry.result}</result>`);
        lines.push('    </entry>');
      }
      lines.push('  </episodic-memory>');
    }

    // Recent execution log (last 3)
    const execLog = this.getRecent(agentId, 'execution-log', 3);
    if (execLog.length > 0) {
      lines.push('  <execution-history>');
      for (const entry of execLog) {
        lines.push(`    <run offer="${entry.offer || 'unknown'}" result="${entry.result || 'unknown'}" timestamp="${entry.timestamp}" />`);
      }
      lines.push('  </execution-history>');
    }

    // Cross-offer: technique register relevant to niche
    if (offerPath) {
      const niche = offerPath.split('/')[0];
      const techniques = this.query(agentId, 'technique-register', { niche });
      if (techniques.length > 0) {
        lines.push(`  <techniques niche="${niche}">`);
        for (const tech of techniques.slice(0, 5)) {
          lines.push(`    <technique name="${tech.name || ''}">`);
          if (tech.description) lines.push(`      ${tech.description}`);
          lines.push('    </technique>');
        }
        lines.push('  </techniques>');
      }
    }

    // Semantic memory hint for deeper context retrieval
    const offerName = offerPath ? offerPath.split('/').pop() : null;
    lines.push('  <semantic-memory-hint>');
    lines.push('    Use mcp__copywriting__semantic_memory_search para contexto mais profundo.');
    lines.push(`    Query sugerida: descricao da sua task atual.`);
    lines.push(`    Filtros uteis: agent_id="${agentId}"${offerName ? `, offer="${offerName}"` : ''}`);
    lines.push('  </semantic-memory-hint>');

    lines.push('</agent-memory>');

    // Only return if there's actual content
    if (episodic.length === 0 && execLog.length === 0) return '';
    return lines.join('\n');
  }

  /**
   * Cleanup old entries across all memory types for an agent.
   */
  async cleanup(agentId, maxAgeDays = 90) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let totalRemoved = 0;

    for (const type of VALID_MEMORY_TYPES) {
      const removed = await this.delete(agentId, type, entry => {
        if (!entry.timestamp) return false;
        return (now - new Date(entry.timestamp).getTime()) > maxAgeMs;
      });
      totalRemoved += removed;
    }

    return totalRemoved;
  }

  _validateType(memoryType) {
    if (!VALID_MEMORY_TYPES.includes(memoryType)) {
      throw new Error(`Invalid memory type: ${memoryType}. Valid: ${VALID_MEMORY_TYPES.join(', ')}`);
    }
  }

  _memoryPath(agentId, memoryType) {
    return path.join(this.options.memoryDir, agentId, `${memoryType}.yaml`);
  }

  async _atomicWrite(filePath, data) {
    const dir = path.dirname(filePath);
    await fsp.mkdir(dir, { recursive: true });

    const tmpPath = filePath + '.tmp';
    await fsp.writeFile(tmpPath, yaml.dump(data, { lineWidth: 120, noRefs: true }), 'utf8');
    await fsp.rename(tmpPath, filePath);
  }

  async _updateIndex(agentId, memoryType, entry) {
    try {
      const { IndexUpdater } = require('./index-updater');
      const updater = new IndexUpdater(this.options);
      await updater.update(agentId, memoryType, entry);
    } catch {
      // Index update is non-critical
    }
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[AgentMemory] ${message}`);
    }
  }
}

module.exports = { AgentMemoryManager, MEMORY_CAPS, VALID_MEMORY_TYPES };
