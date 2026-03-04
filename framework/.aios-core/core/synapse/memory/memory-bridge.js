'use strict';

/**
 * Memory Bridge — Bracket-aware episodic memory retrieval for Copy Chief agents.
 * Part of AIOS Core: core/synapse/memory
 *
 * Reads agent episodic memories and enforces token budgets per context bracket.
 * Bracket budgets align with bracket-config.yaml:
 *   FRESH    → 0 tokens (skip — full context available, no memory needed)
 *   MODERATE → 50 tokens
 *   DEPLETED → 200 tokens
 *   CRITICAL → 500 tokens
 *
 * Reads from: ~/.claude/agent-memory/{agentId}/episodic.yaml
 * (Written by AgentMemoryManager / agent-state-recorder hook)
 *
 * Non-blocking, graceful: missing files → empty array. Never throws.
 *
 * Usage:
 *   const { getMemoryForBracket, estimateTokens, BRACKET_BUDGETS } = require('./memory-bridge');
 *   const memories = getMemoryForBracket('vox', 'DEPLETED');
 *   // → [{ task, learning, offer, timestamp, tokens }, ...]
 *
 * @module core/synapse/memory/memory-bridge
 * @version 2.0.0 (Copy Chief adaptation — reads episodic.yaml directly)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Constants ────────────────────────────────────────────────────────────────

const AGENT_MEMORY_DIR = path.join(process.env.HOME || '', '.claude', 'agent-memory');

/**
 * Token budgets per context bracket.
 * 0 = skip memory retrieval entirely.
 */
const BRACKET_BUDGETS = {
  FRESH:    0,
  MODERATE: 50,
  DEPLETED: 200,
  CRITICAL: 500,
};

/**
 * Approximate characters per token (GPT/Claude tokenization heuristic).
 */
const CHARS_PER_TOKEN = 4;

// ─── estimateTokens ───────────────────────────────────────────────────────────

/**
 * Estimate token count for a string.
 * Uses the 4-chars-per-token heuristic (accurate to ±15% for English/Portuguese).
 *
 * @param {string} text
 * @returns {number}
 */
function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ─── Memory loading ───────────────────────────────────────────────────────────

/**
 * Load the episodic.yaml file for an agent.
 * Returns [] on any error (file not found, parse error, etc.).
 *
 * @param {string} agentId
 * @returns {object[]}
 */
function _loadEpisodic(agentId) {
  const filePath = path.join(AGENT_MEMORY_DIR, agentId, 'episodic.yaml');
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = yaml.load(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// ─── Relevance scoring ────────────────────────────────────────────────────────

/**
 * Compute a relevance score for a memory entry.
 * Combines recency (higher = more recent) and explicit relevance_score field.
 *
 * @param {object} entry
 * @param {number} nowMs - Current timestamp in ms
 * @returns {number} 0–1 score
 */
function _scoreRelevance(entry, nowMs) {
  let score = 0.5; // default neutral

  // Explicit relevance score from agent (0–1)
  if (typeof entry.relevance_score === 'number') {
    score = Math.max(0, Math.min(1, entry.relevance_score));
  } else if (typeof entry.score === 'number') {
    // Normalize from 0–10 scale if needed
    const raw = entry.score;
    score = raw > 1 ? Math.max(0, Math.min(1, raw / 10)) : Math.max(0, Math.min(1, raw));
  }

  // Recency bonus: decay over 7 days (604800000 ms)
  if (entry.timestamp) {
    try {
      const entryMs = new Date(entry.timestamp).getTime();
      if (!isNaN(entryMs)) {
        const ageMs = nowMs - entryMs;
        const decayDays = 7;
        const decayMs = decayDays * 24 * 60 * 60 * 1000;
        const recency = Math.max(0, 1 - ageMs / decayMs);
        // Blend: 70% relevance + 30% recency
        score = score * 0.70 + recency * 0.30;
      }
    } catch {
      // Invalid timestamp — ignore recency
    }
  }

  return Math.max(0, Math.min(1, score));
}

// ─── Token-aware serialization ────────────────────────────────────────────────

/**
 * Serialize a memory entry to a compact string for context injection.
 * Format: "[{date}] {task} → {learning}"
 *
 * @param {object} entry
 * @returns {string}
 */
function _serializeEntry(entry) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toISOString().slice(0, 10)
    : 'unknown';

  const task = entry.task || entry.description || entry.type || 'task';
  const learning = entry.learning || entry.insight || entry.outcome || entry.result || '';
  const offer = entry.offer ? ` [${entry.offer}]` : '';

  return `[${date}]${offer} ${task}${learning ? ` → ${learning}` : ''}`.trim();
}

// ─── getMemoryForBracket ──────────────────────────────────────────────────────

/**
 * Retrieve relevant episodic memories for an agent within the token budget
 * determined by the current context bracket.
 *
 * Returns [] for FRESH bracket (no memory needed).
 * Sorts by relevance score descending, then truncates to token budget.
 *
 * @param {string} agentId  - Agent ID (e.g., 'vox', 'atlas', 'echo')
 * @param {string} bracket  - Context bracket: 'FRESH' | 'MODERATE' | 'DEPLETED' | 'CRITICAL'
 * @returns {{ text: string, tokens: number, relevance: number, entry: object }[]}
 */
function getMemoryForBracket(agentId, bracket) {
  // Validate bracket
  const budget = BRACKET_BUDGETS[bracket];

  // FRESH = skip, budget 0 = skip
  if (budget === 0 || budget === undefined) return [];

  // Load raw entries
  const entries = _loadEpisodic(agentId);
  if (entries.length === 0) return [];

  const nowMs = Date.now();

  // Score and serialize all entries
  const scored = entries
    .filter(e => e && typeof e === 'object')
    .map(entry => {
      const relevance = _scoreRelevance(entry, nowMs);
      const text = _serializeEntry(entry);
      const tokens = estimateTokens(text);
      return { text, tokens, relevance, entry };
    })
    .filter(item => item.tokens > 0);

  // Sort: highest relevance first (most recent/relevant at top)
  scored.sort((a, b) => b.relevance - a.relevance);

  // Enforce token budget: greedily include until budget exhausted
  const result = [];
  let tokensUsed = 0;

  for (const item of scored) {
    if (tokensUsed + item.tokens > budget) {
      // Try to fit smaller remaining entries
      continue;
    }
    result.push(item);
    tokensUsed += item.tokens;
    if (tokensUsed >= budget) break;
  }

  return result;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getMemoryForBracket,
  estimateTokens,
  BRACKET_BUDGETS,
};
