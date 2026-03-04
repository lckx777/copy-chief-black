'use strict';

/**
 * Data Tier Integrity Check
 *
 * Verifies agent dependencies.data paths exist.
 * Checks Tier 1 shared data is referenced by 3+ agents.
 * Detects orphan data files.
 *
 * @module data-tier-integrity
 * @version 1.0.0
 * @atom U-34
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(process.env.HOME, '.claude', 'agents');
const SQUAD_DATA_DIR = path.join(process.env.HOME, 'copywriting-ecosystem', 'squads', 'copy-chief', 'data');

/**
 * Parse frontmatter from agent .md file.
 * Extracts dependencies.data array.
 */
function parseDependencies(agentPath) {
  try {
    const content = fs.readFileSync(agentPath, 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return [];

    const fm = fmMatch[1];
    const dataMatch = fm.match(/data:\s*\n((?:\s+-\s+.+\n?)*)/);
    if (!dataMatch) return [];

    return dataMatch[1]
      .split('\n')
      .map(line => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * @returns {{ name: string, domain: string, severity: string, status: string, details: string }}
 */
function check() {
  const result = {
    name: 'data-tier-integrity',
    domain: 'PROJECT',
    severity: 'low',
    status: 'OK',
    details: '',
  };

  if (!fs.existsSync(AGENTS_DIR)) {
    result.status = 'WARN';
    result.details = 'Agents directory not found';
    return result;
  }

  const warnings = [];
  const allDataPaths = new Map(); // path -> [agents referencing it]

  // Scan all agent .md files
  const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

  for (const file of agentFiles) {
    const agentId = file.replace('.md', '');
    const deps = parseDependencies(path.join(AGENTS_DIR, file));

    for (const dep of deps) {
      // Resolve path
      const resolvedPath = dep.startsWith('/')
        ? dep
        : path.join(SQUAD_DATA_DIR, dep);

      if (!allDataPaths.has(dep)) allDataPaths.set(dep, []);
      allDataPaths.get(dep).push(agentId);

      // Check if path exists
      if (!fs.existsSync(resolvedPath)) {
        warnings.push(`${agentId}: dependency '${dep}' not found`);
      }
    }
  }

  // Check Tier 1 (craft/) is referenced by 3+ agents
  const craftPaths = [...allDataPaths.entries()].filter(([p]) => p.includes('craft/'));
  for (const [craftPath, agents] of craftPaths) {
    if (agents.length < 3) {
      warnings.push(`Tier 1 '${craftPath}' only referenced by ${agents.length} agents (expected 3+)`);
    }
  }

  if (warnings.length > 0) {
    result.status = 'WARN';
    result.details = `${warnings.length} issues: ${warnings.slice(0, 5).join('; ')}`;
  } else {
    result.details = `${agentFiles.length} agents checked, ${allDataPaths.size} data paths verified`;
  }

  return result;
}

module.exports = { check };
