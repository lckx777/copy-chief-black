/**
 * Copy Chief BLACK — Doctor
 * Diagnoses environment and configuration issues
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
  let gitVer = null;
  try {
    gitVer = execSync('git --version', { stdio: 'pipe' }).toString().trim();
    check('Git available', true, gitVer);
  } catch {
    check('Git available', false, 'Not found in PATH');
  }

  // 3. Claude Code
  const claude = platform.findExecutable('claude');
  check('Claude Code CLI', !!claude, claude || 'Not found — install: npm i -g @anthropic-ai/claude-code');

  // 4. Bun (optional)
  const bun = platform.findExecutable('bun');
  check('Bun runtime (optional)', !!bun, bun || 'Not found — only needed for TS hooks without transpilation');

  // 5. settings.json
  const settingsPath = path.join(platform.claudeHome(), 'settings.json');
  check('settings.json exists', fs.existsSync(settingsPath));

  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      // Check for bun references
      const content = fs.readFileSync(settingsPath, 'utf8');
      const bunRefs = (content.match(/bun run/g) || []).length;
      check('No bun references in settings', bunRefs === 0, bunRefs > 0 ? `${bunRefs} hooks still use "bun run"` : '');

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
      check(`Hooks registered (${hookCount})`, hookCount > 0);

    } catch (e) {
      check('settings.json valid JSON', false, e.message);
    }
  }

  // 6. AIOS Core
  const aiosCore = platform.aiosCoreDir();
  check('.aios-core directory', fs.existsSync(aiosCore));
  check('.aios-core/node_modules', fs.existsSync(path.join(aiosCore, 'node_modules')));

  // 7. js-yaml
  try {
    platform.getYaml();
    check('js-yaml loadable', true);
  } catch {
    check('js-yaml loadable', false, 'Run: cd ~/.claude/.aios-core && npm install');
  }

  // 8. Hooks directory
  const hooksDir = platform.hooksDir();
  if (fs.existsSync(hooksDir)) {
    const files = fs.readdirSync(hooksDir);
    const cjs = files.filter(f => f.endsWith('.cjs')).length;
    const ts = files.filter(f => f.endsWith('.ts')).length;
    const js = files.filter(f => f.endsWith('.js')).length;
    const sh = files.filter(f => f.endsWith('.sh')).length;
    console.log(`\n  Hooks breakdown: ${cjs} .cjs, ${js} .js, ${ts} .ts, ${sh} .sh`);

    if (sh > 0 && platform.isWindows()) {
      console.log(`  ⚠️  ${sh} shell scripts found — these won't work on Windows without bash`);
    }
    if (ts > 0 && !bun) {
      console.log(`  ⚠️  ${ts} TypeScript hooks found — need transpilation (no bun available)`);
    }

    // Check for /dev/stdin usage
    let stdinCount = 0;
    for (const f of files) {
      if (f.endsWith('.sh') || f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.lock')) continue;
      try {
        const content = fs.readFileSync(path.join(hooksDir, f), 'utf8');
        if (content.includes('/dev/stdin')) stdinCount++;
      } catch {}
    }
    if (stdinCount > 0) {
      console.log(`  ⚠️  ${stdinCount} hooks use /dev/stdin (Windows incompatible)`);
    }
  }

  // 9. Ecosystem
  const eco = platform.ecosystemRoot();
  check('Ecosystem directory', fs.existsSync(eco), eco);
  check('.synapse/ exists', fs.existsSync(path.join(eco, '.synapse')));

  console.log('\nDone.');
}

function check(label, ok, detail) {
  const icon = ok ? '✓' : '✗';
  const msg = detail ? ` (${detail})` : '';
  console.log(`  ${icon} ${label}${msg}`);
}

module.exports = { doctor };
