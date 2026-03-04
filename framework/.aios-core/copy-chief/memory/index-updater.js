'use strict';

/**
 * Index Updater
 *
 * Maintains _index.yaml files for cross-agent memory queries.
 * Allows querying entries across agents by niche, deliverable_type, etc.
 *
 * @module index-updater
 * @version 1.0.0
 */

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const AGENT_MEMORY_DIR = path.join(process.env.HOME, '.claude', 'agent-memory');
const INDEX_MAX_ENTRIES = 200;

class IndexUpdater {
  constructor(options = {}) {
    this.options = {
      memoryDir: AGENT_MEMORY_DIR,
      debug: false,
      ...options,
    };
  }

  /**
   * Update the cross-agent index with a new entry.
   */
  async update(agentId, memoryType, entry) {
    if (!entry.offer && !entry.niche) return; // Nothing to index

    const indexPath = path.join(this.options.memoryDir, '_index.yaml');
    let index = this._loadIndex(indexPath);

    const niche = entry.niche || (entry.offer ? entry.offer.split('/')[0] : 'unknown');

    index.entries.unshift({
      agent: agentId,
      memory_type: memoryType,
      niche,
      offer: entry.offer || null,
      deliverable_type: entry.deliverable_type || null,
      score: entry.score || null,
      timestamp: entry.timestamp || new Date().toISOString(),
      summary: (entry.learning || entry.task || '').slice(0, 100),
    });

    // Cap
    if (index.entries.length > INDEX_MAX_ENTRIES) {
      index.entries = index.entries.slice(0, INDEX_MAX_ENTRIES);
    }

    index.updated_at = new Date().toISOString();
    await this._save(indexPath, index);
  }

  /**
   * Query the index for entries matching filters.
   */
  query(filter = {}) {
    const indexPath = path.join(this.options.memoryDir, '_index.yaml');
    const index = this._loadIndex(indexPath);

    return index.entries.filter(entry => {
      if (filter.niche && entry.niche !== filter.niche) return false;
      if (filter.agent && entry.agent !== filter.agent) return false;
      if (filter.deliverable_type && entry.deliverable_type !== filter.deliverable_type) return false;
      if (filter.offer && entry.offer !== filter.offer) return false;
      return true;
    });
  }

  _loadIndex(indexPath) {
    if (!fs.existsSync(indexPath)) {
      return { version: '1.0', entries: [], updated_at: new Date().toISOString() };
    }

    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      const data = yaml.load(content);
      if (!data || !Array.isArray(data.entries)) {
        return { version: '1.0', entries: [], updated_at: new Date().toISOString() };
      }
      return data;
    } catch {
      return { version: '1.0', entries: [], updated_at: new Date().toISOString() };
    }
  }

  async _save(indexPath, index) {
    const dir = path.dirname(indexPath);
    await fsp.mkdir(dir, { recursive: true });

    const tmpPath = indexPath + '.tmp';
    await fsp.writeFile(tmpPath, yaml.dump(index, { lineWidth: 120, noRefs: true }), 'utf8');
    await fsp.rename(tmpPath, indexPath);
  }
}

module.exports = { IndexUpdater };
