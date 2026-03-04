'use strict';

/**
 * Multi-IDE Sync (U-35)
 *
 * Converts canonical agent .md files to IDE-specific format.
 * Generates .cursor/rules/ and .gemini/rules/ from agents/*.md.
 * On-demand only — not wired to session hooks.
 *
 * Usage: node ~/.claude/scripts/sync-ide.js [cursor|gemini|all] [outputDir]
 *
 * @module sync-ide
 * @version 1.0.0
 * @atom U-35
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(process.env.HOME, '.claude', 'agents');
const DEFAULT_OUTPUT = path.join(process.env.HOME, 'copywriting-ecosystem');

/**
 * IDE adapter definitions.
 */
const ADAPTERS = {
  cursor: {
    dir: '.cursor/rules',
    ext: '.mdc',
    transform: cursorTransform,
  },
  gemini: {
    dir: '.gemini/rules',
    ext: '.md',
    transform: geminiTransform,
  },
};

/**
 * Sync agents to IDE format.
 *
 * @param {object} options
 * @param {string} [options.target='all'] - Target IDE: 'cursor', 'gemini', or 'all'
 * @param {string} [options.outputDir] - Output base directory
 * @returns {{ filesGenerated: number, targets: string[] }}
 */
function syncIDE(options = {}) {
  const target = options.target || 'all';
  const outputDir = options.outputDir || DEFAULT_OUTPUT;
  let filesGenerated = 0;
  const targets = [];

  // Load agent files
  const agentFiles = loadAgentFiles();

  const adaptersToRun = target === 'all'
    ? Object.keys(ADAPTERS)
    : [target];

  for (const adapterName of adaptersToRun) {
    const adapter = ADAPTERS[adapterName];
    if (!adapter) continue;

    const rulesDir = path.join(outputDir, adapter.dir);
    fs.mkdirSync(rulesDir, { recursive: true });

    for (const agent of agentFiles) {
      const content = adapter.transform(agent);
      const filePath = path.join(rulesDir, `${agent.id}${adapter.ext}`);
      fs.writeFileSync(filePath, content, 'utf8');
      filesGenerated++;
    }

    targets.push(adapterName);
  }

  return { filesGenerated, targets };
}

/**
 * Load all agent .md files.
 */
function loadAgentFiles() {
  const agents = [];

  try {
    const files = fs.readdirSync(AGENTS_DIR).filter(f =>
      f.endsWith('.md') && !f.startsWith('.')
    );

    for (const file of files) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
      const id = file.replace('.md', '');

      // Parse frontmatter
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      const body = fmMatch ? content.slice(fmMatch[0].length).trim() : content;

      agents.push({ id, file, content, body, frontmatter: fmMatch ? fmMatch[1] : '' });
    }
  } catch { /* empty */ }

  return agents;
}

/**
 * Transform agent to Cursor .mdc format.
 */
function cursorTransform(agent) {
  return [
    '---',
    `description: ${agent.id} agent rules`,
    'globs:',
    `alwaysApply: false`,
    '---',
    '',
    `# ${agent.id.charAt(0).toUpperCase() + agent.id.slice(1)} Agent`,
    '',
    agent.body,
  ].join('\n');
}

/**
 * Transform agent to Gemini .md format.
 */
function geminiTransform(agent) {
  return [
    `# ${agent.id.charAt(0).toUpperCase() + agent.id.slice(1)} Agent`,
    '',
    agent.body,
  ].join('\n');
}

// CLI entry point
if (require.main === module) {
  const target = process.argv[2] || 'all';
  const outputDir = process.argv[3] || DEFAULT_OUTPUT;
  const result = syncIDE({ target, outputDir });
  console.log(`Synced ${result.filesGenerated} files for: ${result.targets.join(', ')}`);
}

module.exports = { syncIDE, ADAPTERS };
