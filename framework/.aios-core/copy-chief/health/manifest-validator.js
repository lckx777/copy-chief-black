'use strict';

/**
 * Manifest Validator
 *
 * Validates .synapse/manifest against actual .synapse/ files.
 * Checks bidirectional consistency: manifest entries have files, files have entries.
 *
 * @module manifest-validator
 * @version 1.0.0
 * @atom U-02
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate manifest consistency.
 *
 * Checks:
 * 1. Every DOMAIN_STATE=active has matching .synapse/{domain} file
 * 2. Every .synapse/ domain file has manifest entry
 * 3. AGENT_TRIGGER domains match agents/ directory
 * 4. WORKFLOW_TRIGGER domains match workflows/ directory
 *
 * @param {string} synapsePath - Path to .synapse/ directory
 * @param {object} options
 * @param {string} [options.agentsDir] - Path to agents/ directory
 * @returns {{ valid: boolean, warnings: string[], errors: string[] }}
 */
function validateManifest(synapsePath, options = {}) {
  const result = { valid: true, warnings: [], errors: [] };

  const manifestPath = path.join(synapsePath, 'manifest');
  if (!fs.existsSync(manifestPath)) {
    result.errors.push('manifest file not found');
    result.valid = false;
    return result;
  }

  // Parse manifest
  const manifest = parseManifest(fs.readFileSync(manifestPath, 'utf8'));

  // Get actual .synapse/ files (excluding dirs and special files)
  const SKIP_ENTRIES = new Set(['manifest', 'metrics', 'sessions', 'star-commands', 'commands', 'constitution']);
  let synapseFiles;
  try {
    synapseFiles = fs.readdirSync(synapsePath, { withFileTypes: true })
      .filter(e => !e.isDirectory() || !SKIP_ENTRIES.has(e.name))
      .filter(e => !e.name.startsWith('.') && !SKIP_ENTRIES.has(e.name))
      .map(e => e.name);
  } catch {
    result.errors.push('cannot read .synapse/ directory');
    result.valid = false;
    return result;
  }

  // Check 1: Active domains have matching files
  for (const [domain, state] of Object.entries(manifest.domains)) {
    if (state !== 'active') continue;
    const domainFile = domain.toLowerCase().replace(/_/g, '-');
    if (!synapseFiles.includes(domainFile)) {
      result.warnings.push(`Domain ${domain} is active in manifest but no .synapse/${domainFile} file`);
    }
  }

  // Check 2: Synapse files have manifest entries
  const manifestDomainFiles = new Set(
    Object.keys(manifest.domains).map(d => d.toLowerCase().replace(/_/g, '-'))
  );
  const manifestAgentFiles = new Set(
    Object.keys(manifest.agentTriggers).map(a => `agent-${a.toLowerCase()}`)
  );
  const manifestWorkflowFiles = new Set(
    Object.keys(manifest.workflowTriggers).map(w => `workflow-${w.toLowerCase().replace(/_/g, '-')}`)
  );
  const allManifestFiles = new Set([...manifestDomainFiles, ...manifestAgentFiles, ...manifestWorkflowFiles]);

  for (const file of synapseFiles) {
    if (!allManifestFiles.has(file)) {
      result.warnings.push(`File .synapse/${file} exists but has no manifest entry`);
    }
  }

  // Check 3: Agent triggers match agents/ directory
  const agentsDir = options.agentsDir || path.join(process.env.HOME, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const agentName of Object.keys(manifest.agentTriggers)) {
      const agentFile = path.join(agentsDir, `${agentName}.md`);
      const agentDir = path.join(agentsDir, agentName);
      if (!fs.existsSync(agentFile) && !fs.existsSync(agentDir)) {
        result.warnings.push(`Agent trigger ${agentName} has no matching agent file`);
      }
    }
  }

  // Check 4: Workflow triggers match workflow files
  for (const workflowName of Object.keys(manifest.workflowTriggers)) {
    const wfFile = `workflow-${workflowName.replace(/_/g, '-')}`;
    if (!synapseFiles.includes(wfFile)) {
      result.warnings.push(`Workflow trigger ${workflowName} has no .synapse/${wfFile} file`);
    }
  }

  if (result.errors.length > 0) result.valid = false;
  return result;
}

/**
 * Parse manifest KEY=VALUE format.
 * @param {string} content
 * @returns {{ domains: Object, agentTriggers: Object, workflowTriggers: Object, raw: Object }}
 */
function parseManifest(content) {
  const raw = {};
  const domains = {};
  const agentTriggers = {};
  const workflowTriggers = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;

    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();
    raw[key] = value;

    // Domain states: {NAME}_STATE=active
    const domainMatch = key.match(/^([A-Z_]+)_STATE$/);
    if (domainMatch && !key.includes('AGENT_TRIGGER') && !key.includes('WORKFLOW_TRIGGER')) {
      const name = domainMatch[1];
      // Skip agent/workflow state entries
      if (!raw[`${name}_AGENT_TRIGGER`] && !raw[`${name}_WORKFLOW_TRIGGER`]) {
        domains[name] = value;
      }
    }

    // Agent triggers: {NAME}_AGENT_TRIGGER=id
    const agentMatch = key.match(/^([A-Z_]+)_AGENT_TRIGGER$/);
    if (agentMatch) {
      agentTriggers[value] = agentMatch[1];
    }

    // Workflow triggers: {NAME}_WORKFLOW_TRIGGER=id
    const wfMatch = key.match(/^([A-Z_]+)_WORKFLOW_TRIGGER$/);
    if (wfMatch) {
      workflowTriggers[value] = wfMatch[1];
    }
  }

  return { domains, agentTriggers, workflowTriggers, raw };
}

module.exports = { validateManifest, parseManifest };
