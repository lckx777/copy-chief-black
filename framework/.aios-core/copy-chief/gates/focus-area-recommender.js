'use strict';

/**
 * Focus Area Recommender — Prioritizes human review effort for copy deliverables.
 * Part of AIOS Core: copy-chief/gates
 *
 * Automated tools (spelling, formatting, structure) handle low-level checks.
 * This module surfaces the areas where human judgment adds the most value:
 * emotional depth, mechanism clarity, persuasion flow, compliance, etc.
 *
 * Deliverable-type risk mapping:
 *   vsl       → emotional_depth + persuasion_flow (primary)
 *   lp        → mechanism_clarity + CTA_strength (primary)
 *   criativo  → emotional_depth + specificity (primary)
 *   email     → emotional_depth + CTA_strength (primary)
 *
 * Usage:
 *   const { recommend, formatRecommendation } = require('./focus-area-recommender');
 *   const result = recommend('saude/florayla', 'vsl');
 *   console.log(formatRecommendation(result));
 *
 * @module focus-area-recommender
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Constants ────────────────────────────────────────────────────────────────

const ECOSYSTEM_ROOT = path.join(process.env.HOME || '', 'copywriting-ecosystem');

/**
 * All focus categories with human-readable labels and review questions.
 */
const CATEGORIES = {
  emotional_depth: {
    label: 'Emotional Depth (DRE Alignment)',
    questions: [
      'Does the copy open at the avatar\'s current emotional state — not where we want them to go?',
      'Is the DRE (Dominant Resonant Emotion) activated within the first 60 seconds?',
      'Does emotional escalation follow the avatar pain map (awareness → fear → urgency)?',
      'Are there specific, concrete details that make the pain feel real vs. generic?',
      'Is the emotional payoff (relief, hope, vindication) delivered clearly at the close?',
    ],
  },
  mechanism_clarity: {
    label: 'Mechanism Clarity (MUP/MUS)',
    questions: [
      'Is the MUP (root cause) explained in language a 12-year-old could understand?',
      'Does the paradigm shift clearly contradict the old belief before introducing the new one?',
      'Is the MUS (solution mechanism) differentiated from what the avatar has already tried?',
      'Does the gimmick name make the mechanism memorable and "ownable"?',
      'Is the authority hook (expert/study) credible and specific — not vague?',
    ],
  },
  persuasion_flow: {
    label: 'Persuasion Flow',
    questions: [
      'Does the structure follow a coherent flow: hook → problem → mechanism → solution → CTA?',
      'Are transitions between sections smooth — does each section earn the next?',
      'Is there a natural build of trust (problem empathy → authority → proof → offer)?',
      'Is curiosity maintained throughout — no premature payoffs?',
      'Is the offer introduction timed correctly (after problem is fully activated)?',
    ],
  },
  compliance: {
    label: 'Compliance',
    questions: [
      'Are all health/cure claims substantiated or removed?',
      'No absolute claims (e.g., "cures", "eliminates", "guaranteed") without qualifier?',
      'Testimonials follow FTC/platform guidelines (no income/result guarantees)?',
      'Disclaimer present where required (supplement, financial, etc.)?',
      'No competitor name-drops that could create legal exposure?',
    ],
  },
  specificity: {
    label: 'Specificity & Concreteness',
    questions: [
      'Are statistics cited with source and methodology context?',
      'Are benefits expressed in specific outcomes (not vague improvements)?',
      'Are timeframes realistic and specific ("within 3 weeks" vs. "fast")?',
      'Does the proof section use real, verifiable details — not generic testimonials?',
      'Are price anchors and savings expressed as specific numbers?',
    ],
  },
  proof_integration: {
    label: 'Proof Integration',
    questions: [
      'Is social proof distributed throughout — not dumped in one section?',
      'Do testimonials speak to the mechanism, not just generic satisfaction?',
      'Is authority proof (studies, experts) integrated naturally — not as a list?',
      'Is there a "before/after" proof arc in at least one testimonial?',
      'Is proof positioned to handle the avatar\'s primary objection?',
    ],
  },
  CTA_strength: {
    label: 'CTA Strength',
    questions: [
      'Is the primary CTA specific and action-oriented (not "click here")?',
      'Is urgency or scarcity justified by the mechanism — not manufactured?',
      'Is the CTA repeated at the right moments (post-mechanism, post-proof, close)?',
      'Does the CTA page/button copy match the emotional state activated in the copy?',
      'Is the guarantee positioned as a risk-eliminator — framed from the avatar\'s perspective?',
    ],
  },
};

/**
 * Areas automated tools handle well — skip in human review.
 */
const SKIP_AREAS = [
  'formatting',
  'spelling',
  'grammar',
  'generic_structure',
  'word_count',
];

/**
 * Deliverable type → { primary: string[], secondary: string[] } category mapping.
 */
const DELIVERABLE_RISK_MAP = {
  vsl: {
    primary: ['emotional_depth', 'persuasion_flow'],
    secondary: ['mechanism_clarity', 'proof_integration', 'CTA_strength'],
  },
  lp: {
    primary: ['mechanism_clarity', 'CTA_strength'],
    secondary: ['specificity', 'proof_integration', 'compliance'],
  },
  criativo: {
    primary: ['emotional_depth', 'specificity'],
    secondary: ['CTA_strength', 'compliance'],
  },
  email: {
    primary: ['emotional_depth', 'CTA_strength'],
    secondary: ['specificity', 'persuasion_flow'],
  },
  // Aliases
  landing_page: {
    primary: ['mechanism_clarity', 'CTA_strength'],
    secondary: ['specificity', 'proof_integration', 'compliance'],
  },
  creative: {
    primary: ['emotional_depth', 'specificity'],
    secondary: ['CTA_strength', 'compliance'],
  },
};

// ─── recommend ────────────────────────────────────────────────────────────────

/**
 * Generate focus area recommendations for a deliverable.
 *
 * Reads helix-state.yaml to check if compliance is flagged as required.
 * Falls back to deliverable-type risk map defaults.
 *
 * @param {string} offerPath - Relative (to ecosystem) or absolute
 * @param {string} deliverableType - 'vsl' | 'lp' | 'criativo' | 'email' | 'landing_page'
 * @returns {{ primary: string[], secondary: string[], skip: string[] }}
 */
function recommend(offerPath, deliverableType) {
  const absOffer = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);

  const normalizedType = (deliverableType || '').toLowerCase().replace(/-/g, '_');
  const riskProfile = DELIVERABLE_RISK_MAP[normalizedType] || {
    primary: ['emotional_depth', 'persuasion_flow'],
    secondary: ['mechanism_clarity', 'CTA_strength', 'specificity'],
  };

  // Check helix-state for compliance signals
  const complianceRequired = _detectComplianceRisk(absOffer);

  let primary = [...riskProfile.primary];
  let secondary = [...riskProfile.secondary];

  // Elevate compliance if flagged
  if (complianceRequired && !primary.includes('compliance')) {
    secondary = secondary.filter(c => c !== 'compliance');
    primary = ['compliance', ...primary];
  } else if (complianceRequired && !secondary.includes('compliance')) {
    secondary = ['compliance', ...secondary];
  }

  // Deduplicate: secondary must not overlap with primary
  secondary = secondary.filter(c => !primary.includes(c));

  return {
    primary,
    secondary,
    skip: SKIP_AREAS,
  };
}

/**
 * Detect compliance risk from helix-state.yaml.
 * Returns true if the offer is in a regulated niche (saude, suplemento, etc.)
 *
 * @param {string} absOffer
 * @returns {boolean}
 */
function _detectComplianceRisk(absOffer) {
  // Path-based heuristic: health niche
  const normalizedPath = absOffer.toLowerCase();
  if (
    normalizedPath.includes('/saude/') ||
    normalizedPath.includes('/health/') ||
    normalizedPath.includes('/suplemento/')
  ) {
    return true;
  }

  // helix-state check: compliance flag
  const statePath = path.join(absOffer, 'helix-state.yaml');
  try {
    const state = yaml.load(fs.readFileSync(statePath, 'utf8'));
    if (state && (state.compliance_required === true || state.niche === 'saude')) {
      return true;
    }
  } catch {
    // File not found — fall back to path heuristic result
  }

  return false;
}

// ─── formatRecommendation ─────────────────────────────────────────────────────

/**
 * Format a recommendation result as a Markdown review guide.
 * Includes review questions per focus area.
 *
 * @param {{ primary: string[], secondary: string[], skip: string[] }} result
 * @returns {string}
 */
function formatRecommendation(result) {
  if (!result) return '_No recommendation data._';

  const lines = [];

  if (result.primary && result.primary.length > 0) {
    lines.push('## Primary Review Focus\n');
    lines.push('_These areas carry the highest conversion risk. Review carefully._\n');

    for (const key of result.primary) {
      const cat = CATEGORIES[key];
      if (!cat) continue;
      lines.push(`### ${cat.label}`);
      for (const q of cat.questions) {
        lines.push(`- [ ] ${q}`);
      }
      lines.push('');
    }
  }

  if (result.secondary && result.secondary.length > 0) {
    lines.push('## Secondary Review Focus\n');
    lines.push('_Important but lower risk than primary areas._\n');

    for (const key of result.secondary) {
      const cat = CATEGORIES[key];
      if (!cat) continue;
      lines.push(`### ${cat.label}`);
      for (const q of cat.questions) {
        lines.push(`- [ ] ${q}`);
      }
      lines.push('');
    }
  }

  if (result.skip && result.skip.length > 0) {
    lines.push('## Skip (Automated Coverage)');
    lines.push(`_Handled by automated tools: ${result.skip.join(', ')}_`);
  }

  return lines.join('\n').trim();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { recommend, formatRecommendation, CATEGORIES, DELIVERABLE_RISK_MAP };
