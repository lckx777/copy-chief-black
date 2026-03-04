'use strict';

/**
 * Squad Creator (U-33)
 *
 * Generates a new squad structure from a definition object.
 * Creates: squad.yaml, agent .md files, workflow YAMLs, manifest entries.
 *
 * @module squad-creator
 * @version 1.0.0
 * @atom U-33
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Create a new squad at the specified directory.
 *
 * @param {string} outputDir - Directory to create squad in
 * @param {object} definition - Squad definition
 * @param {string} definition.domain - Squad domain (e.g., 'sales', 'support')
 * @param {object[]} definition.agents - Array of { id, role, style }
 * @param {string[]} definition.workflows - Workflow names to generate
 * @returns {{ files: string[], warnings: string[] }}
 */
function createSquad(outputDir, definition) {
  const files = [];
  const warnings = [];

  // Ensure directories exist
  const dirs = ['agents', 'workflows', 'data', 'templates'];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(outputDir, dir), { recursive: true });
  }

  // 1. Generate squad.yaml
  const squadYaml = {
    squad: {
      name: definition.domain,
      id: definition.domain.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: `${definition.domain} squad`,
      agents: (definition.agents || []).map(a => ({
        id: a.id,
        role: a.role,
        handle: `@${a.id}`,
        tier: a.tier || 3,
      })),
      workflows: definition.workflows || [],
    },
  };

  const squadPath = path.join(outputDir, 'squad.yaml');
  fs.writeFileSync(squadPath, yaml.dump(squadYaml, { lineWidth: 120 }), 'utf8');
  files.push(squadPath);

  // 2. Generate agent .md files
  for (const agent of (definition.agents || [])) {
    const agentContent = [
      '---',
      `agent:`,
      `  name: ${agent.id.charAt(0).toUpperCase() + agent.id.slice(1)}`,
      `  id: ${agent.id}`,
      `  handle: "@${agent.id}"`,
      `  tier: ${agent.tier || 3}`,
      `persona:`,
      `  role: "${agent.role}"`,
      `  style: "${agent.style || 'professional'}"`,
      '---',
      '',
      `# ${agent.id.charAt(0).toUpperCase() + agent.id.slice(1)}`,
      '',
      `You are ${agent.id.charAt(0).toUpperCase() + agent.id.slice(1)} (@${agent.id}).`,
      `Role: ${agent.role}`,
      '',
      '## Instructions',
      '',
      `[Define ${agent.role} instructions here]`,
      '',
    ].join('\n');

    const agentPath = path.join(outputDir, 'agents', `${agent.id}.md`);
    fs.writeFileSync(agentPath, agentContent, 'utf8');
    files.push(agentPath);
  }

  // 3. Generate workflow YAMLs
  for (const workflow of (definition.workflows || [])) {
    const wfContent = {
      id: workflow,
      title: workflow.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      version: '1.0.0',
      phases: [
        {
          id: `${workflow}-phase-1`,
          title: 'Phase 1',
          agents: (definition.agents || []).slice(0, 2).map(a => a.id),
          parallel: false,
        },
      ],
    };

    const wfPath = path.join(outputDir, 'workflows', `${workflow}.yaml`);
    fs.writeFileSync(wfPath, yaml.dump(wfContent, { lineWidth: 120 }), 'utf8');
    files.push(wfPath);
  }

  return { files, warnings };
}

module.exports = { createSquad };
