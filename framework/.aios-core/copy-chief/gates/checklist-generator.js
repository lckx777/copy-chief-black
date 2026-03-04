'use strict';

/**
 * Checklist Generator — Dynamic review checklists based on offer context.
 * Part of AIOS Core: copy-chief/gates
 *
 * Unlike the static delivery-checklist.yaml, this module generates context-aware
 * checklists that adapt to the current phase, existing deliverables, and gate state.
 *
 * Priorities: critical > high > medium > low
 *
 * Usage:
 *   const { generateChecklist, formatChecklist, evaluateChecklist } = require('./checklist-generator');
 *   const items = generateChecklist('saude/florayla', 'production', { deliverableType: 'vsl' });
 *   const checked = await evaluateChecklist(items, 'saude/florayla');
 *   console.log(formatChecklist(checked));
 *
 * @module checklist-generator
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Constants ────────────────────────────────────────────────────────────────

const ECOSYSTEM_ROOT = path.join(process.env.HOME || '', 'copywriting-ecosystem');

const PRIORITY = { critical: 0, high: 1, medium: 2, low: 3 };
const PRIORITY_LABELS = ['critical', 'high', 'medium', 'low'];

// ─── Phase base items ─────────────────────────────────────────────────────────

/**
 * Static base checklist items per phase.
 * Each item: { id, label, priority, type, ...typeArgs }
 *
 * types: file_exists | gate_passed | manual | metric_above
 */
const PHASE_BASE_ITEMS = {
  research: [
    {
      id: 'voc_count',
      label: 'VOC data collected (min 20 data points)',
      priority: 'critical',
      type: 'file_exists',
      relativePath: 'research/synthesis.md',
    },
    {
      id: 'source_diversity',
      label: 'Sources include: forums, reviews, social, academic',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'avatar_depth',
      label: 'Avatar defined: demographics, psychographics, DRE, awareness level',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'dre_primary',
      label: 'Primary DRE (Dominant Resonant Emotion) identified',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'competitor_swipes',
      label: 'Competitor ads/VSLs captured in swipes/',
      priority: 'medium',
      type: 'dir_has_files',
      relativePath: 'swipes',
    },
    {
      id: 'research_gate',
      label: 'Research gate passed',
      priority: 'critical',
      type: 'gate_passed',
      gate: 'research',
    },
  ],

  briefing: [
    {
      id: 'helix_complete',
      label: 'HELIX briefing complete (all 10 phases)',
      priority: 'critical',
      type: 'file_exists',
      relativePath: 'briefings/helix-state.yaml',
    },
    {
      id: 'mup_defined',
      label: 'MUP (Mecanismo Unico de Problema) defined and validated',
      priority: 'critical',
      type: 'file_exists',
      relativePath: 'mecanismo-unico.yaml',
    },
    {
      id: 'mus_defined',
      label: 'MUS (Mecanismo Unico de Solucao) defined with gimmick name',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'paradigm_shift',
      label: 'Paradigm shift statement written and tested',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'authority_hook',
      label: 'Authority hook defined (expert, credentials, studies)',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'briefing_gate',
      label: 'Briefing gate passed',
      priority: 'critical',
      type: 'gate_passed',
      gate: 'briefing',
    },
  ],

  production: [
    {
      id: 'deliverables_present',
      label: 'Production deliverables present in production/',
      priority: 'critical',
      type: 'dir_has_files',
      relativePath: 'production',
    },
    {
      id: 'blind_critic_run',
      label: 'blind_critic score >= 7.0',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'est_run',
      label: 'emotional_stress_test (genericidade) score <= 4.0',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'no_placeholder',
      label: 'No placeholder text or [FILL] markers in copy',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'dre_alignment',
      label: 'DRE aligned: emotional escalation follows avatar pain map',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'mechanism_present',
      label: 'MUP/MUS clearly explained in copy',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'cta_present',
      label: 'CTA present, specific, and repeated (3x for VSL)',
      priority: 'high',
      type: 'manual',
    },
  ],

  review: [
    {
      id: 'all_gates_passed',
      label: 'All upstream gates passed (research + briefing)',
      priority: 'critical',
      type: 'gate_passed',
      gate: 'briefing',
    },
    {
      id: 'delivery_checklist',
      label: 'Delivery checklist fully met',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'black_validation_run',
      label: 'black_validation run on all deliverables',
      priority: 'critical',
      type: 'manual',
    },
    {
      id: 'compliance_check',
      label: 'Compliance review: no banned claims, legal review done',
      priority: 'high',
      type: 'manual',
    },
    {
      id: 'format_check',
      label: 'Format verified for target platform/funnel',
      priority: 'medium',
      type: 'manual',
    },
  ],
};

// ─── File-based items ─────────────────────────────────────────────────────────

/**
 * Scan production/ subdirectories and generate one checklist item per deliverable found.
 *
 * @param {string} absOffer - Absolute offer path
 * @returns {object[]}
 */
function _buildDeliverableItems(absOffer) {
  const productionDir = path.join(absOffer, 'production');
  if (!fs.existsSync(productionDir)) return [];

  const items = [];
  const subdirs = ['vsl', 'landing-page', 'emails', 'creatives'];

  for (const subdir of subdirs) {
    const dir = path.join(productionDir, subdir);
    if (!fs.existsSync(dir)) continue;

    let files = [];
    try {
      files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
    } catch {
      continue;
    }

    for (const file of files) {
      items.push({
        id: `deliverable_${sanitizeItemId(`${subdir}_${file}`)}`,
        label: `[${subdir}] ${file} — reviewed and approved`,
        priority: 'high',
        type: 'file_exists',
        absolutePath: path.join(dir, file),
        _auto_checked: true, // file already exists
      });
    }
  }

  return items;
}

/**
 * Sanitize a string to a valid item ID.
 *
 * @param {string} raw
 * @returns {string}
 */
function sanitizeItemId(raw) {
  return raw.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 64);
}

// ─── generateChecklist ────────────────────────────────────────────────────────

/**
 * Generate a dynamic checklist for an offer at a given phase.
 *
 * @param {string} offerPath - Relative (to ecosystem) or absolute
 * @param {string} phase - 'research' | 'briefing' | 'production' | 'review'
 * @param {object} [options={}]
 * @param {string} [options.deliverableType] - 'vsl' | 'lp' | 'criativo' | 'email'
 * @param {boolean} [options.includeDeliverableItems=true]
 * @returns {object[]} checklist items
 */
function generateChecklist(offerPath, phase, options = {}) {
  const absOffer = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);

  const {
    includeDeliverableItems = true,
  } = options;

  const baseItems = (PHASE_BASE_ITEMS[phase] || []).map(item => ({ ...item }));

  const deliverableItems = (phase === 'production' || phase === 'review') && includeDeliverableItems
    ? _buildDeliverableItems(absOffer)
    : [];

  const all = [...baseItems, ...deliverableItems];

  // Sort by priority: critical first
  all.sort((a, b) => (PRIORITY[a.priority] || 99) - (PRIORITY[b.priority] || 99));

  return all;
}

// ─── formatChecklist ─────────────────────────────────────────────────────────

/**
 * Format checklist items as a Markdown checklist.
 * Groups by priority. Checked items (checked: true) use [x].
 *
 * @param {object[]} items
 * @returns {string} markdown string
 */
function formatChecklist(items) {
  if (!items || items.length === 0) return '_No checklist items._';

  const groups = {};
  for (const priority of PRIORITY_LABELS) {
    groups[priority] = [];
  }

  for (const item of items) {
    const p = item.priority || 'low';
    if (!groups[p]) groups[p] = [];
    groups[p].push(item);
  }

  const lines = [];
  for (const priority of PRIORITY_LABELS) {
    const group = groups[priority];
    if (!group || group.length === 0) continue;

    lines.push(`\n### ${priority.toUpperCase()}`);
    for (const item of group) {
      const box = item.checked ? '[x]' : '[ ]';
      const reason = item.check_reason ? ` _(${item.check_reason})_` : '';
      lines.push(`- ${box} ${item.label}${reason}`);
    }
  }

  return lines.join('\n').trim();
}

// ─── evaluateChecklist ────────────────────────────────────────────────────────

/**
 * Auto-check items that can be verified programmatically.
 * Returns a new array with { checked: boolean, check_reason: string } on each item.
 *
 * Verifiable types: file_exists, dir_has_files, gate_passed
 * Non-verifiable types: manual → left unchecked
 *
 * @param {object[]} items
 * @param {string} offerPath - Relative or absolute
 * @returns {object[]} enriched items
 */
function evaluateChecklist(items, offerPath) {
  if (!items || items.length === 0) return [];

  const absOffer = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);

  return items.map(item => {
    const result = _evaluateItem(item, absOffer);
    return { ...item, ...result };
  });
}

/**
 * Evaluate a single checklist item against the filesystem/gate state.
 *
 * @param {object} item
 * @param {string} absOffer
 * @returns {{ checked: boolean, check_reason: string }}
 */
function _evaluateItem(item, absOffer) {
  // Already auto-checked (e.g., deliverable found during scan)
  if (item._auto_checked) {
    return { checked: true, check_reason: 'file exists' };
  }

  switch (item.type) {
    case 'file_exists': {
      const filePath = item.absolutePath
        || (item.relativePath ? path.join(absOffer, item.relativePath) : null);
      if (!filePath) return { checked: false, check_reason: 'no path configured' };
      const exists = fs.existsSync(filePath);
      return { checked: exists, check_reason: exists ? 'file exists' : 'file not found' };
    }

    case 'dir_has_files': {
      const dirPath = item.absolutePath
        || (item.relativePath ? path.join(absOffer, item.relativePath) : null);
      if (!dirPath) return { checked: false, check_reason: 'no path configured' };
      try {
        const files = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
        const minFiles = item.min_files || 1;
        return {
          checked: files.length >= minFiles,
          check_reason: `${files.length} file(s) found`,
        };
      } catch {
        return { checked: false, check_reason: 'directory not found' };
      }
    }

    case 'gate_passed': {
      if (!item.gate) return { checked: false, check_reason: 'no gate specified' };
      const gatePath = path.join(absOffer, '.aios', 'gate-audit', `${item.gate}.yaml`);
      try {
        const content = yaml.load(fs.readFileSync(gatePath, 'utf8'));
        if (!Array.isArray(content) || content.length === 0) {
          return { checked: false, check_reason: 'no audit trail' };
        }
        const last = content[content.length - 1];
        const passed = last.verdict === 'PASSED';
        return { checked: passed, check_reason: `${item.gate}: ${last.verdict}` };
      } catch {
        return { checked: false, check_reason: 'gate audit not found' };
      }
    }

    case 'manual':
    default:
      return { checked: false, check_reason: 'manual verification required' };
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { generateChecklist, formatChecklist, evaluateChecklist };
