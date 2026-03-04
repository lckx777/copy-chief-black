'use strict';

/**
 * Mermaid Formatter — Converts Copy Chief system state to Mermaid diagram syntax.
 * Part of AIOS Core: core/graph-dashboard
 *
 * Produces Mermaid flowchart/graph definitions for the War Room dashboard:
 *   - Workflow phase graphs with agent assignments
 *   - Dispatch queue graphs with status colors
 *   - Offer pipeline progression from helix-state.yaml
 *
 * All output is pure strings — no I/O side effects in format functions.
 * formatOfferPipeline reads helix-state.yaml (read-only).
 *
 * Status colors:
 *   completed  = #10B981 (green)
 *   pending    = #94A3B8 (slate)
 *   failed     = #EF4444 (red)
 *   dispatched = #3B82F6 (blue)
 *   skipped    = #6B7280 (gray)
 *
 * @module core/graph-dashboard/mermaid-formatter
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Color map ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  completed:  '#10B981',
  passed:     '#10B981',
  done:       '#10B981',
  pending:    '#94A3B8',
  not_started:'#94A3B8',
  failed:     '#EF4444',
  error:      '#EF4444',
  dispatched: '#3B82F6',
  in_progress:'#3B82F6',
  skipped:    '#6B7280',
};

const ECOSYSTEM_ROOT = path.join(process.env.HOME || '', 'copywriting-ecosystem');

// ─── ID sanitization ──────────────────────────────────────────────────────────

/**
 * Sanitize a string into a valid Mermaid node ID.
 * Keeps alphanumeric chars and hyphens only, replaces everything else with _.
 *
 * @param {string} raw
 * @returns {string}
 */
function sanitizeId(raw) {
  if (!raw || typeof raw !== 'string') return 'node';
  return raw
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .replace(/^[0-9]/, 'n_$&')  // Mermaid IDs must not start with digit
    .substring(0, 64);
}

/**
 * Resolve color for a given status string.
 *
 * @param {string} status
 * @returns {string} hex color
 */
function _colorFor(status) {
  if (!status) return STATUS_COLORS.pending;
  const normalized = String(status).toLowerCase().replace(/\s+/g, '_');
  return STATUS_COLORS[normalized] || STATUS_COLORS.pending;
}

// ─── Workflow graph ───────────────────────────────────────────────────────────

/**
 * Convert a workflow definition to a Mermaid flowchart.
 *
 * Expected workflow shape:
 *   {
 *     name: string,
 *     phases: [{ id, label, agent, status, depends_on?: string[] }]
 *   }
 *
 * @param {object} workflow
 * @returns {string} Mermaid flowchart definition
 */
function formatWorkflowGraph(workflow) {
  if (!workflow || !Array.isArray(workflow.phases)) {
    return 'flowchart TD\n  ERR["No workflow data"]';
  }

  const lines = ['flowchart TD'];
  const styleLines = [];

  for (const phase of workflow.phases) {
    const id = sanitizeId(phase.id || phase.label || 'phase');
    const label = phase.label || phase.id || id;
    const agent = phase.agent ? ` @${phase.agent}` : '';
    const color = _colorFor(phase.status);

    lines.push(`  ${id}["${label}${agent}"]`);
    styleLines.push(`  style ${id} fill:${color},color:#fff,stroke:none`);
  }

  // Edges: either explicit depends_on or sequential
  const phases = workflow.phases;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const toId = sanitizeId(phase.id || phase.label || 'phase');

    if (Array.isArray(phase.depends_on) && phase.depends_on.length > 0) {
      for (const dep of phase.depends_on) {
        const fromId = sanitizeId(dep);
        lines.push(`  ${fromId} --> ${toId}`);
      }
    } else if (i > 0) {
      const prevId = sanitizeId(phases[i - 1].id || phases[i - 1].label || 'phase');
      lines.push(`  ${prevId} --> ${toId}`);
    }
  }

  return [...lines, ...styleLines].join('\n');
}

// ─── Dispatch graph ───────────────────────────────────────────────────────────

/**
 * Convert a dispatch queue array to a Mermaid graph.
 *
 * Expected dispatch shape:
 *   [{ id, agent, task, status, depends_on?: string[] }]
 *
 * @param {object[]} dispatches
 * @returns {string} Mermaid graph definition
 */
function formatDispatchGraph(dispatches) {
  if (!Array.isArray(dispatches) || dispatches.length === 0) {
    return 'graph LR\n  EMPTY["Dispatch queue is empty"]';
  }

  const lines = ['graph LR'];
  const styleLines = [];

  for (const dispatch of dispatches) {
    const id = sanitizeId(dispatch.id || dispatch.agent || 'task');
    const agent = dispatch.agent || 'unknown';
    const task = dispatch.task || dispatch.description || '';
    const status = dispatch.status || 'pending';
    const color = _colorFor(status);
    const label = task ? `${agent}: ${task.substring(0, 40)}` : agent;

    lines.push(`  ${id}["${label}"]`);
    styleLines.push(`  style ${id} fill:${color},color:#fff,stroke:none`);

    if (Array.isArray(dispatch.depends_on)) {
      for (const dep of dispatch.depends_on) {
        const fromId = sanitizeId(dep);
        lines.push(`  ${fromId} --> ${id}`);
      }
    }
  }

  return [...lines, ...styleLines].join('\n');
}

// ─── Offer pipeline ───────────────────────────────────────────────────────────

/**
 * Read helix-state.yaml for an offer and render phase progression as Mermaid.
 *
 * Resolves offerPath relative to ECOSYSTEM_ROOT if not absolute.
 * Returns a fallback graph if state file is missing.
 *
 * @param {string} offerPath - e.g. 'saude/florayla' or absolute path
 * @returns {string} Mermaid flowchart definition
 */
function formatOfferPipeline(offerPath) {
  const absOffer = path.isAbsolute(offerPath)
    ? offerPath
    : path.join(ECOSYSTEM_ROOT, offerPath);

  const statePath = path.join(absOffer, 'helix-state.yaml');

  let state = null;
  try {
    state = yaml.load(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return `flowchart LR\n  ERR["helix-state.yaml not found\\n${offerPath}"]`;
  }

  if (!state) {
    return `flowchart LR\n  ERR["Empty helix-state.yaml\\n${offerPath}"]`;
  }

  // Normalize phases from helix-state structure
  const phases = _extractPhasesFromHelixState(state);
  if (phases.length === 0) {
    return `flowchart LR\n  ERR["No phases in helix-state.yaml\\n${offerPath}"]`;
  }

  const offerLabel = state.offer || offerPath;
  const lines = [`flowchart LR\n  TITLE(["${offerLabel}"])`];
  const styleLines = ['  style TITLE fill:#1E293B,color:#F8FAFC,stroke:none'];
  let prev = 'TITLE';

  for (const phase of phases) {
    const id = sanitizeId(phase.id);
    const label = phase.label || phase.id;
    const color = _colorFor(phase.status);

    lines.push(`  ${id}["${label}\\n${phase.status}"]`);
    styleLines.push(`  style ${id} fill:${color},color:#fff,stroke:none`);
    lines.push(`  ${prev} --> ${id}`);
    prev = id;
  }

  return [...lines, ...styleLines].join('\n');
}

/**
 * Extract a normalized phases array from helix-state.yaml.
 * Handles both { phases: [...] } and { gates: {...} } formats.
 *
 * @param {object} state
 * @returns {{ id: string, label: string, status: string }[]}
 */
function _extractPhasesFromHelixState(state) {
  // Format 1: explicit phases array
  if (Array.isArray(state.phases)) {
    return state.phases.map(p => ({
      id: p.id || p.name || 'phase',
      label: p.label || p.name || p.id,
      status: p.status || 'pending',
    }));
  }

  // Format 2: gates object (research_gate, briefing_gate, production_gate)
  if (state.gates && typeof state.gates === 'object') {
    return Object.entries(state.gates).map(([key, val]) => ({
      id: key,
      label: key.replace(/_gate$/, '').replace(/_/g, ' '),
      status: typeof val === 'object' ? (val.status || val.verdict || 'pending') : String(val),
    }));
  }

  // Format 3: flat status fields (research_status, briefing_status, ...)
  const phaseOrder = ['research', 'briefing', 'mecanismo', 'production', 'review', 'delivery'];
  const phases = [];
  for (const phaseName of phaseOrder) {
    const statusKey = `${phaseName}_status`;
    const gateKey = `${phaseName}_gate`;
    const status = state[statusKey] || state[gateKey];
    if (status !== undefined) {
      phases.push({
        id: phaseName,
        label: phaseName.charAt(0).toUpperCase() + phaseName.slice(1),
        status: String(status),
      });
    }
  }

  return phases;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  formatWorkflowGraph,
  formatDispatchGraph,
  formatOfferPipeline,
  sanitizeId,
};
