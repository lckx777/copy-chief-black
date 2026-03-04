'use strict';

/**
 * Task Complexity Classifier — Model selection via task complexity scoring.
 * Part of AIOS Core: copy-chief/orchestration
 *
 * Maps task descriptions and context signals to a complexity level,
 * which drives model selection for cost/quality optimization.
 *
 * Complexity levels:
 *   simple  (<0.3)  → haiku  — status checks, reads, lists, routing
 *   medium  (0.3–0.7) → sonnet — research, validation, criativos, LP blocks
 *   complex (>0.7)  → opus   — VSL production, briefing, strategy, HELIX
 *
 * Scoring:
 *   - Keyword scoring (simple vs. complex vocabulary)
 *   - Context signals (file count, deliverable type, multi-offer flag)
 *   - Phase complexity baseline
 *
 * Usage:
 *   const { classify, getModelRecommendation } = require('./task-complexity-classifier');
 *   const result = classify('produce full VSL script', { phase: 'production', deliverableType: 'vsl' });
 *   // → { level: 'complex', confidence: 0.85, recommended_model: 'claude-opus-4-6' }
 *
 * @module task-complexity-classifier
 * @version 1.0.0
 */

// ─── Keyword scoring ──────────────────────────────────────────────────────────

/**
 * Words associated with simple tasks. Each match contributes negatively to score.
 */
const SIMPLE_KEYWORDS = [
  'check', 'list', 'read', 'status', 'show', 'display', 'get', 'fetch',
  'view', 'look', 'find', 'count', 'verify', 'confirm', 'scan', 'report',
  'summary', 'describe', 'summarize', 'print',
];

/**
 * Words associated with complex tasks. Each match contributes positively to score.
 */
const COMPLEX_KEYWORDS = [
  'create', 'produce', 'write', 'generate', 'build', 'design', 'develop',
  'analyze', 'research', 'strategy', 'optimize', 'orchestrate', 'synthesize',
  'brief', 'briefing', 'helix', 'mecanismo', 'vsl', 'copywrite', 'script',
  'persona', 'avatar', 'mechanism', 'persuasion', 'emotional', 'funnel',
  'multi', 'comprehensive', 'complete', 'full', 'entire', 'all',
];

/**
 * Words that moderately increase complexity.
 */
const MEDIUM_KEYWORDS = [
  'validate', 'review', 'evaluate', 'assess', 'critique', 'compare',
  'plan', 'draft', 'outline', 'structure', 'organize', 'update',
  'refine', 'improve', 'edit', 'revise', 'adapt', 'translate',
];

// ─── Phase baseline scores ────────────────────────────────────────────────────

/**
 * Base complexity score contributed by the pipeline phase.
 */
const PHASE_COMPLEXITY = {
  research:   0.45,
  briefing:   0.70,
  mecanismo:  0.65,
  production: 0.70,
  review:     0.45,
  delivery:   0.30,
  setup:      0.20,
};

// ─── Deliverable type scores ──────────────────────────────────────────────────

/**
 * Additional complexity from deliverable type.
 * VSL is the most complex deliverable in the Copy Chief pipeline.
 */
const DELIVERABLE_COMPLEXITY = {
  vsl:          0.30,
  landing_page: 0.15,
  lp:           0.15,
  email:        0.10,
  criativo:     0.10,
  creative:     0.10,
  checklist:    0.05,
  report:       0.05,
};

// ─── Model mapping ────────────────────────────────────────────────────────────

/**
 * Model recommendations per complexity level.
 * Model IDs match the squad CLAUDE.md routing table.
 */
const MODEL_MAP = {
  simple:  'claude-haiku-4',
  medium:  'claude-sonnet-4-6',
  complex: 'claude-opus-4-6',
};

/**
 * Complexity level thresholds.
 */
const THRESHOLDS = {
  simple_max:  0.30,
  complex_min: 0.70,
};

// ─── classify ─────────────────────────────────────────────────────────────────

/**
 * Classify a task description into a complexity level.
 *
 * @param {string} taskDescription - Free-text task description
 * @param {object} [context={}]
 * @param {string}   [context.phase]           - Pipeline phase name
 * @param {string}   [context.deliverableType] - Deliverable type
 * @param {number}   [context.fileCount]       - Number of files involved
 * @param {boolean}  [context.multiOffer]      - Task spans multiple offers
 * @returns {{ level: 'simple'|'medium'|'complex', confidence: number, recommended_model: string, score: number, signals: string[] }}
 */
function classify(taskDescription, context = {}) {
  const desc = String(taskDescription || '').toLowerCase();
  const words = desc.split(/\s+/).filter(Boolean);

  const signals = [];
  let score = 0;

  // ── Keyword scoring ──────────────────────────────────────────────────────

  let simpleHits = 0;
  let complexHits = 0;
  let mediumHits = 0;

  for (const word of words) {
    if (SIMPLE_KEYWORDS.some(kw => word.includes(kw))) simpleHits++;
    if (COMPLEX_KEYWORDS.some(kw => word.includes(kw))) complexHits++;
    if (MEDIUM_KEYWORDS.some(kw => word.includes(kw))) mediumHits++;
  }

  // Normalize keyword contribution (max ±0.35)
  const keywordNet = (complexHits * 0.12) - (simpleHits * 0.08) + (mediumHits * 0.04);
  const keywordContrib = Math.max(-0.35, Math.min(0.35, keywordNet));
  score += keywordContrib;

  if (complexHits > 0) signals.push(`complex keywords: ${complexHits}`);
  if (simpleHits > 0) signals.push(`simple keywords: ${simpleHits}`);
  if (mediumHits > 0) signals.push(`medium keywords: ${mediumHits}`);

  // ── Phase baseline ────────────────────────────────────────────────────────

  const { phase, deliverableType, fileCount, multiOffer } = context;

  if (phase) {
    const phaseScore = PHASE_COMPLEXITY[phase.toLowerCase()];
    if (phaseScore !== undefined) {
      // Phase contributes up to 0.40 (scaled from baseline, not additive)
      const phaseContrib = phaseScore * 0.40;
      score += phaseContrib;
      signals.push(`phase(${phase}): +${phaseContrib.toFixed(2)}`);
    }
  } else {
    // No phase: apply neutral baseline
    score += 0.15;
  }

  // ── Deliverable type signal ───────────────────────────────────────────────

  if (deliverableType) {
    const normalized = deliverableType.toLowerCase().replace(/-/g, '_');
    const delivContrib = DELIVERABLE_COMPLEXITY[normalized];
    if (delivContrib !== undefined) {
      score += delivContrib;
      signals.push(`deliverable(${deliverableType}): +${delivContrib.toFixed(2)}`);
    }
  }

  // ── Context signals ───────────────────────────────────────────────────────

  if (fileCount && typeof fileCount === 'number') {
    if (fileCount > 10) {
      score += 0.10;
      signals.push(`file count(${fileCount}): +0.10`);
    } else if (fileCount > 3) {
      score += 0.05;
      signals.push(`file count(${fileCount}): +0.05`);
    }
  }

  if (multiOffer === true) {
    score += 0.15;
    signals.push('multi-offer: +0.15');
  }

  // ── Clamp to [0, 1] ───────────────────────────────────────────────────────

  const finalScore = Math.max(0, Math.min(1, score));

  // ── Level and confidence ──────────────────────────────────────────────────

  let level;
  let confidence;

  if (finalScore < THRESHOLDS.simple_max) {
    level = 'simple';
    // Higher confidence the further below simple_max
    confidence = Math.round((1 - finalScore / THRESHOLDS.simple_max) * 0.7 + 0.3, 2);
  } else if (finalScore >= THRESHOLDS.complex_min) {
    level = 'complex';
    confidence = Math.round(Math.min(1, (finalScore - THRESHOLDS.complex_min) / (1 - THRESHOLDS.complex_min) * 0.7 + 0.3), 2);
  } else {
    level = 'medium';
    const midpoint = (THRESHOLDS.simple_max + THRESHOLDS.complex_min) / 2;
    confidence = Math.round(1 - Math.abs(finalScore - midpoint) / midpoint * 0.5, 2);
  }

  confidence = Math.max(0.1, Math.min(1, confidence));

  return {
    level,
    confidence: Math.round(confidence * 100) / 100,
    recommended_model: MODEL_MAP[level],
    score: Math.round(finalScore * 100) / 100,
    signals,
  };
}

// ─── getModelRecommendation ───────────────────────────────────────────────────

/**
 * Convenience wrapper: returns just the recommended model string.
 *
 * @param {string} taskDescription
 * @param {object} [context={}]
 * @returns {string} model ID
 */
function getModelRecommendation(taskDescription, context = {}) {
  return classify(taskDescription, context).recommended_model;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  classify,
  getModelRecommendation,
  MODEL_MAP,
  THRESHOLDS,
  PHASE_COMPLEXITY,
  DELIVERABLE_COMPLEXITY,
};
