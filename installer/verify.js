/**
 * Copy Chief BLACK — Verification
 * Checks installation integrity
 */
'use strict';

const fs = require('fs');
const path = require('path');
const platform = require('../lib/platform');
const settingsBuilder = require('../lib/settings-builder');

async function verify(opts = {}) {
  const quiet = opts.quiet || false;
  const fix = opts.fix || false;
  let issues = 0;
  let fixed = 0;

  if (!quiet) console.log('Copy Chief BLACK — Verification\n');

  // 1. Check directories exist
  const requiredDirs = [
    { path: platform.claudeHome(), label: 'Claude Home' },
    { path: platform.aiosCoreDir(), label: 'AIOS Core' },
    { path: platform.copyChiefDir(), label: 'Copy Chief modules' },
    { path: platform.hooksDir(), label: 'Hooks directory' },
  ];

  for (const dir of requiredDirs) {
    if (fs.existsSync(dir.path)) {
      if (!quiet) console.log(`  ✓ ${dir.label}: ${dir.path}`);
    } else {
      issues++;
      if (!quiet) console.log(`  ✗ ${dir.label} MISSING: ${dir.path}`);
      if (fix) {
        fs.mkdirSync(dir.path, { recursive: true });
        fixed++;
      }
    }
  }

  // 2. Check settings.json
  const settingsPath = path.join(platform.claudeHome(), 'settings.json');
  const settingsIssues = settingsBuilder.validateSettings(settingsPath);
  if (settingsIssues.length === 0) {
    if (!quiet) console.log('  ✓ settings.json valid');
  } else {
    issues += settingsIssues.length;
    for (const issue of settingsIssues) {
      if (!quiet) console.log(`  ✗ settings.json: ${issue}`);
    }
  }

  // 3. Check js-yaml available
  try {
    platform.getYaml();
    if (!quiet) console.log('  ✓ js-yaml available');
  } catch {
    issues++;
    if (!quiet) console.log('  ✗ js-yaml NOT available');
  }

  // 4. Check core modules
  const coreModules = [
    'index.js',
    'orchestration/helix-orchestrator.js',
    'execution/copy-workflow-executor.js',
    'gates/quality-gate-manager.ts',
    'state/session-state.ts',
  ];

  const ccDir = platform.copyChiefDir();
  let moduleOk = 0;
  for (const mod of coreModules) {
    if (fs.existsSync(path.join(ccDir, mod))) {
      moduleOk++;
    } else {
      issues++;
      if (!quiet) console.log(`  ✗ Missing module: copy-chief/${mod}`);
    }
  }
  if (!quiet && moduleOk === coreModules.length) {
    console.log(`  ✓ Core modules: ${moduleOk}/${coreModules.length}`);
  }

  // 5. Check hooks exist (sample check)
  const criticalHooks = [
    'synapse-engine.cjs',
    'helix-orchestrator-boot.cjs',
    'agent-activation-hook.cjs',
    'pipeline-intent-detector.cjs',
    'handoff-validator-hook.cjs',
  ];

  const hDir = platform.hooksDir();
  let hookOk = 0;
  for (const hook of criticalHooks) {
    if (fs.existsSync(path.join(hDir, hook))) {
      hookOk++;
    } else {
      issues++;
      if (!quiet) console.log(`  ✗ Missing critical hook: ${hook}`);
    }
  }
  if (!quiet && hookOk === criticalHooks.length) {
    console.log(`  ✓ Critical hooks: ${hookOk}/${criticalHooks.length}`);
  }

  // 6. Count total hooks
  if (fs.existsSync(hDir)) {
    const allHooks = fs.readdirSync(hDir).filter(f =>
      f.endsWith('.cjs') || f.endsWith('.js') || f.endsWith('.ts')
    );
    if (!quiet) console.log(`  ✓ Total hooks: ${allHooks.length}`);
  }

  // Summary
  if (!quiet) {
    console.log(`\n${issues === 0 ? '✅' : '⚠️ '} ${issues} issue(s) found${fix ? `, ${fixed} fixed` : ''}`);
  }

  return issues === 0;
}

module.exports = { verify };
