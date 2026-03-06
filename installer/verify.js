/**
 * Copy Chief BLACK — Verification
 * Checks installation integrity (v2.0 — squad-native)
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

  // 1. Check core directories
  const requiredDirs = [
    { path: platform.claudeHome(), label: 'Claude Home' },
    { path: platform.aiosCoreDir(), label: 'AIOS Core' },
    { path: platform.copyChiefDir(), label: 'Copy Chief modules' },
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

  // 4. Check core modules (copy-chief OS layer)
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

  // 5. Check Synapse engine hook (only surviving hook in v2.0)
  const hooksDir = platform.hooksDir();
  const synapseHook = path.join(hooksDir, 'synapse-engine.cjs');
  if (fs.existsSync(synapseHook)) {
    if (!quiet) console.log('  ✓ Synapse engine hook present');
  } else {
    issues++;
    if (!quiet) console.log('  ✗ Missing: hooks/synapse-engine.cjs (only required hook)');
  }

  // 6. Check squad in ecosystem
  const ecoRoot = platform.ecosystemRoot();
  const squadDir = path.join(ecoRoot, 'squads', 'copy-chief');
  if (fs.existsSync(squadDir)) {
    const squadYaml = path.join(squadDir, 'squad.yaml');
    if (fs.existsSync(squadYaml)) {
      if (!quiet) console.log(`  ✓ Copy Chief Squad: ${squadDir}`);
    } else {
      issues++;
      if (!quiet) console.log(`  ✗ Squad directory exists but missing squad.yaml: ${squadDir}`);
    }

    // Count squad agents
    const agentsDir = path.join(squadDir, 'agents');
    if (fs.existsSync(agentsDir)) {
      const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      if (!quiet) console.log(`  ✓ Squad agents: ${agents.length}`);
    }
  } else {
    issues++;
    if (!quiet) console.log(`  ✗ Copy Chief Squad MISSING: ${squadDir}`);
  }

  // 7. Check ecosystem structure
  if (!quiet) {
    if (fs.existsSync(ecoRoot)) {
      console.log(`  ✓ Ecosystem: ${ecoRoot}`);
    } else {
      console.log(`  ✗ Ecosystem directory MISSING: ${ecoRoot}`);
      issues++;
    }

    if (fs.existsSync(path.join(ecoRoot, '.synapse'))) {
      console.log('  ✓ .synapse/ exists');
    } else {
      console.log('  ✗ .synapse/ MISSING');
      issues++;
    }
  }

  // 8. Check version tracking
  const versionFile = path.join(platform.claudeHome(), '.copy-chief-version.json');
  if (fs.existsSync(versionFile)) {
    try {
      const info = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      if (!quiet) console.log(`  ✓ Version tracking: v${info.version} (installed ${info.installedAt || 'unknown'})`);
    } catch {
      issues++;
      if (!quiet) console.log('  ✗ Version tracking file corrupt');
    }
  } else {
    if (!quiet) console.log('  - Version tracking not initialized (run: copy-chief-black update --init-tracking)');
  }

  // Summary
  if (!quiet) {
    console.log(`\n${issues === 0 ? '✅' : '⚠️ '} ${issues} issue(s) found${fix ? `, ${fixed} fixed` : ''}`);
  }

  return issues === 0;
}

module.exports = { verify };
