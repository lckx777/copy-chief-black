'use strict';

/**
 * Memory Compactor
 *
 * Groups episodic entries by offer+deliverable_type, extracts proven patterns
 * into technique-register entries, prunes episodic to ≤30 entries.
 *
 * Source: AIOS Agent Memory — 3-file architecture with caps (50/30/20)
 * Pattern: PatternStore auto-prune at 90% capacity
 *
 * @module memory-compactor
 * @version 1.0.0
 * @atom U-07
 */

const fs = require('fs');
const path = require('path');

const AGENT_MEMORY_DIR = path.join(process.env.HOME, '.claude', 'agent-memory');
const EPISODIC_CAP_POST_COMPACT = 30;
const MIN_GROUP_SIZE_FOR_TECHNIQUE = 3;
const TECHNIQUE_MIN_SCORE = 6;

/**
 * Compact episodic memory for a single agent.
 * Groups by offer+deliverable_type, extracts techniques, prunes old entries.
 *
 * @param {string} agentId - Agent identifier (e.g. 'echo', 'scout')
 * @param {object} memoryManager - AgentMemoryManager instance
 * @returns {{ prunedCount: number, techniquesExtracted: number }}
 */
async function compactAgent(agentId, memoryManager) {
  const episodic = memoryManager.load(agentId, 'episodic');

  if (episodic.length <= EPISODIC_CAP_POST_COMPACT) {
    return { prunedCount: 0, techniquesExtracted: 0 };
  }

  // Group by offer + deliverable_type
  const groups = {};
  for (const entry of episodic) {
    const key = `${entry.offer || 'unknown'}::${entry.deliverable_type || 'unknown'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }

  // Extract techniques from groups with 3+ entries and good scores
  let techniquesExtracted = 0;
  const existingTechniques = memoryManager.load(agentId, 'technique-register');
  const existingNames = new Set(existingTechniques.map(t => t.name));

  for (const [key, entries] of Object.entries(groups)) {
    if (entries.length < MIN_GROUP_SIZE_FOR_TECHNIQUE) continue;

    const scored = entries.filter(e => e.score && e.score >= TECHNIQUE_MIN_SCORE);
    if (scored.length < 2) continue;

    const [offer, deliverableType] = key.split('::');
    const niche = offer.includes('/') ? offer.split('/')[0] : 'unknown';

    // Build technique from high-scoring entries
    const learnings = scored
      .filter(e => e.learning)
      .map(e => e.learning)
      .slice(0, 5);

    if (learnings.length === 0) continue;

    const techniqueName = `${deliverableType}-pattern-${offer.replace(/\//g, '-')}`;
    if (existingNames.has(techniqueName)) continue;

    const technique = {
      name: techniqueName,
      offer,
      niche,
      deliverable_type: deliverableType,
      description: learnings.join(' | '),
      source_count: scored.length,
      avg_score: Math.round((scored.reduce((s, e) => s + (e.score || 0), 0) / scored.length) * 10) / 10,
      extracted_from: 'compaction',
      timestamp: new Date().toISOString(),
    };

    await memoryManager.append(agentId, 'technique-register', technique);
    existingNames.add(techniqueName);
    techniquesExtracted++;
  }

  // Prune episodic to cap — keep most recent entries
  const prunedCount = episodic.length - EPISODIC_CAP_POST_COMPACT;
  if (prunedCount > 0) {
    const kept = episodic.slice(0, EPISODIC_CAP_POST_COMPACT);
    const filePath = path.join(AGENT_MEMORY_DIR, agentId, 'episodic.yaml');

    // Backup before prune
    const backupPath = filePath + '.pre-compact';
    try {
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
      }
    } catch { /* non-critical */ }

    // Write pruned entries via manager's internal method
    const yaml = require('js-yaml');
    const tmpPath = filePath + '.tmp';
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(tmpPath, yaml.dump(kept, { lineWidth: 120, noRefs: true }), 'utf8');
    fs.renameSync(tmpPath, filePath);
  }

  return { prunedCount: Math.max(0, prunedCount), techniquesExtracted };
}

/**
 * Compact memory for all agents that have episodic files.
 *
 * @param {object} memoryManager - AgentMemoryManager instance
 * @returns {{ agents: Object.<string, {prunedCount: number, techniquesExtracted: number}>, totalPruned: number, totalTechniques: number }}
 */
async function compactAll(memoryManager) {
  const memDir = memoryManager.options?.memoryDir || AGENT_MEMORY_DIR;
  const result = { agents: {}, totalPruned: 0, totalTechniques: 0 };

  if (!fs.existsSync(memDir)) return result;

  try {
    const dirs = fs.readdirSync(memDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const agentId = dir.name;
      const episodicPath = path.join(memDir, agentId, 'episodic.yaml');
      if (!fs.existsSync(episodicPath)) continue;

      try {
        const agentResult = await compactAgent(agentId, memoryManager);
        if (agentResult.prunedCount > 0 || agentResult.techniquesExtracted > 0) {
          result.agents[agentId] = agentResult;
          result.totalPruned += agentResult.prunedCount;
          result.totalTechniques += agentResult.techniquesExtracted;
        }
      } catch (e) {
        // Non-critical — skip agent
      }
    }
  } catch { /* empty dir or no access */ }

  return result;
}

module.exports = { compactAgent, compactAll, EPISODIC_CAP_POST_COMPACT, MIN_GROUP_SIZE_FOR_TECHNIQUE };
