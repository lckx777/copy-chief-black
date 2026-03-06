/**
 * Copy Chief BLACK — Doctor
 * Diagnoses environment and configuration issues (v2.0 — squad-native)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const platform = require('../lib/platform');

async function doctor() {
  console.log('Copy Chief BLACK — Doctor\n');
  console.log('Platform:', process.platform, process.arch);
  console.log('Node:', process.versions.node);
  console.log('Home:', platform.homeDir());
  console.log('Claude Home:', platform.claudeHome());
  console.log('');

  // 1. Node.js version
  const nodeVer = parseInt(process.versions.node.split('.')[0], 10);
  check('Node.js >= 18', nodeVer >= 18, `Found v${process.versions.node}`);

  // 2. Git
  try {
    const gitVer = execSync('git --version', { stdio: 'pipe' }).toString().trim();
    check('Git available', true, gitVer);
  } catch {
    check('Git available', false, 'Not found in PATH');
  }

  // 3. Claude Code
  const claude = platform.findExecutable('claude');
  check('Claude Code CLI', !!claude, claude || 'Not found — install: npm i -g @anthropic-ai/claude-code');

  // 4. settings.json
  const settingsPath = path.join(platform.claudeHome(), 'settings.json');
  check('settings.json exists', fs.existsSync(settingsPath));

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const content = fs.readFileSync(settingsPath, 'utf8');

      // Check for hardcoded paths
      const hardcoded = (content.match(/\/Users\//g) || []).length;
      check('No hardcoded user paths', hardcoded === 0, hardcoded > 0 ? `${hardcoded} hardcoded /Users/ paths` : '');

      // Check PATH
      if (settings.env && settings.env.PATH) {
        const pathNode = settings.env.PATH.split(path.delimiter).some(p => {
          try { return fs.existsSync(path.join(p, platform.isWindows() ? 'node.exe' : 'node')); }
          catch { return false; }
        });
        check('PATH contains node', pathNode);
      }

      // Check hooks count
      let hookCount = 0;
      if (settings.hooks) {
        for (const matchers of Object.values(settings.hooks)) {
          if (!Array.isArray(matchers)) continue;
          for (const m of matchers) {
            if (m.hooks) hookCount += m.hooks.length;
          }
        }
      }
      check(`Hooks registered (${hookCount})`, hookCount > 0, hookCount === 0 ? 'At least Synapse engine hook expected' : '');

      // v2.0: check for legacy hook bloat
      if (hookCount > 5) {
        console.log(`  ⚠️  ${hookCount} hooks registered — v2.0 should only have Synapse engine (1 hook)`);
        console.log('     Consider running: copy-chief-black install --force');
      }

    } catch (e) {
      check('settings.json valid JSON', false, e.message);
    }
  }

  // 5. AIOS Core
  const aiosCore = platform.aiosCoreDir();
  check('.aios-core directory', fs.existsSync(aiosCore));
  check('.aios-core/node_modules', fs.existsSync(path.join(aiosCore, 'node_modules')));

  // 6. js-yaml
  try {
    platform.getYaml();
    check('js-yaml loadable', true);
  } catch {
    check('js-yaml loadable', false, 'Run: cd ~/.claude/.aios-core && npm install');
  }

  // 7. Synapse engine hook (only required hook in v2.0)
  const hooksDir = platform.hooksDir();
  if (fs.existsSync(hooksDir)) {
    const synapseHook = path.join(hooksDir, 'synapse-engine.cjs');
    check('Synapse engine hook', fs.existsSync(synapseHook));

    const files = fs.readdirSync(hooksDir);
    const hookFiles = files.filter(f => f.endsWith('.cjs') || f.endsWith('.js') || f.endsWith('.ts'));
    console.log(`\n  Hooks directory: ${hookFiles.length} file(s)`);

    if (hookFiles.length > 3) {
      console.log(`  ⚠️  ${hookFiles.length} hooks found — v2.0 squad-native only needs synapse-engine.cjs`);
      const extra = hookFiles.filter(f => f !== 'synapse-engine.cjs');
      console.log(`     Extra hooks: ${extra.join(', ')}`);
    }
  }

  // 8. Copy Chief Squad (v2.0 — key check)
  const eco = platform.ecosystemRoot();
  const squadDir = path.join(eco, 'squads', 'copy-chief');
  check('Ecosystem directory', fs.existsSync(eco), eco);
  check('.synapse/ exists', fs.existsSync(path.join(eco, '.synapse')));
  check('Copy Chief Squad', fs.existsSync(squadDir), squadDir);

  if (fs.existsSync(squadDir)) {
    check('squad.yaml', fs.existsSync(path.join(squadDir, 'squad.yaml')));

    const agentsDir = path.join(squadDir, 'agents');
    if (fs.existsSync(agentsDir)) {
      const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      console.log(`  ✓ Squad agents: ${agents.length} (${agents.map(f => f.replace('.md', '')).join(', ')})`);
    }

    const tasksDir = path.join(squadDir, 'tasks');
    if (fs.existsSync(tasksDir)) {
      const tasks = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md') || f.endsWith('.yaml'));
      console.log(`  ✓ Squad tasks: ${tasks.length}`);
    }

    const workflowsDir = path.join(squadDir, 'workflows');
    if (fs.existsSync(workflowsDir)) {
      const workflows = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yaml'));
      console.log(`  ✓ Squad workflows: ${workflows.length}`);
    }
  }

  // 9. Version tracking
  const versionFile = path.join(platform.claudeHome(), '.copy-chief-version.json');
  if (fs.existsSync(versionFile)) {
    try {
      const info = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      check('Version tracking', true, `v${info.version}`);
      const hashCount = info.fileHashes ? Object.keys(info.fileHashes).length : 0;
      if (hashCount > 0) {
        console.log(`  ✓ File hashes tracked: ${hashCount} files`);
      } else {
        console.log('  ⚠️  No file hashes — customization detection disabled');
      }
    } catch {
      check('Version tracking', false, 'File corrupt');
    }
  } else {
    console.log('\n  - Version tracking not initialized');
    console.log('    Run: copy-chief-black update --init-tracking');
  }

  console.log('\nDone.');
}

function check(label, ok, detail) {
  const icon = ok ? '✓' : '✗';
  const msg = detail ? ` (${detail})` : '';
  console.log(`  ${icon} ${label}${msg}`);
}

module.exports = { doctor };
