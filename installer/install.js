/**
 * Copy Chief BLACK — Installer
 * Installs framework into ~/.claude/ with cross-platform support
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const platform = require('../lib/platform');
const settingsBuilder = require('../lib/settings-builder');

const REQUIRED_NODE_VERSION = 18;
const FRAMEWORK_DIR = path.join(__dirname, '..', 'framework');

async function install(opts = {}) {
  console.log('Copy Chief BLACK — Installer v1.0\n');

  // Step 1: Check prerequisites
  console.log('[1/9] Checking prerequisites...');
  checkPrerequisites();

  // Step 2: Backup existing installation
  const claudeHome = platform.claudeHome();
  if (fs.existsSync(claudeHome) && opts.backup !== false) {
    console.log('[2/9] Backing up existing ~/.claude/...');
    backup(claudeHome);
  } else {
    console.log('[2/9] No existing installation found (or --no-backup)');
  }

  // Step 3: Copy framework files
  console.log('[3/9] Copying framework files...');
  copyFramework(claudeHome, opts.force);

  // Step 4: Install Node dependencies
  console.log('[4/9] Installing dependencies...');
  installDeps(claudeHome);

  // Step 5: Transpile TypeScript hooks
  console.log('[5/9] Transpiling TypeScript hooks...');
  transpileHooks(claudeHome);

  // Step 6: Generate settings.json + mcp.json
  console.log('[6/10] Generating settings.json...');
  const ecoRoot = opts.ecosystem || platform.ecosystemRoot();
  settingsBuilder.writeSettings({ ecosystemRoot: ecoRoot, force: opts.force });
  console.log('[7/10] Generating mcp.json...');
  settingsBuilder.writeMcpJson({ ecosystemRoot: ecoRoot, apifyToken: opts.apifyToken, force: opts.force });

  // Step 8: Scaffold ecosystem
  console.log('[8/10] Scaffolding ecosystem...');
  scaffoldEcosystem(ecoRoot);

  // Step 9: Create runtime directories
  console.log('[9/10] Creating runtime directories...');
  createRuntimeDirs(claudeHome, ecoRoot);

  // Step 10: Verify
  console.log('[10/10] Verifying installation...');
  const { verify } = require('./verify');
  const ok = await verify({ quiet: true });

  if (ok) {
    console.log('\n✅ Copy Chief BLACK installed successfully!');
    console.log(`   Claude Home: ${claudeHome}`);
    console.log(`   Ecosystem:   ${ecoRoot}`);
    console.log('\n   Start Claude Code in your ecosystem directory to begin.');
  } else {
    console.log('\n⚠️  Installation completed with warnings. Run: copy-chief-black doctor');
  }
}

function checkPrerequisites() {
  // Node version
  const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeVersion < REQUIRED_NODE_VERSION) {
    console.error(`❌ Node.js ${REQUIRED_NODE_VERSION}+ required (found ${process.versions.node})`);
    process.exit(1);
  }
  console.log(`   Node.js ${process.versions.node} ✓`);

  // Git
  try {
    execSync('git --version', { stdio: 'pipe' });
    console.log('   Git ✓');
  } catch {
    console.error('❌ Git is required but not found in PATH');
    process.exit(1);
  }

  // Claude Code (optional)
  const claudeBin = platform.findExecutable('claude');
  if (claudeBin) {
    console.log('   Claude Code ✓');
  } else {
    console.log('   Claude Code not found (install separately: npm install -g @anthropic-ai/claude-code)');
  }
}

function backup(claudeHome) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = `${claudeHome}-backup-${timestamp}`;
  fs.cpSync(claudeHome, backupDir, { recursive: true });
  console.log(`   Backup created: ${backupDir}`);
}

function copyFramework(claudeHome, force) {
  if (!fs.existsSync(FRAMEWORK_DIR)) {
    console.log('   Framework directory not found — skipping (dev mode)');
    return;
  }

  // ALL framework directories — nothing missing
  const items = [
    // Core engine
    '.aios-core', 'hooks', 'scripts',
    // Agents & squad
    'agents', 'copy-squad',
    // Plugins & schemas
    'plugins', 'schemas',
    // Skills & commands
    'skills', 'commands',
    // Knowledge & reference
    'knowledge', 'reference', 'references', 'dossiers', 'experts',
    // Config
    'config', 'checklists', 'rules', 'data',
    // Templates & workflows
    'templates', 'workflows',
    // Runtime data (seeded, grows over time)
    'stories', 'gotchas', 'learned-patterns', 'ids',
    // Documentation
    'docs',
    // Tests
    'tests',
  ];

  for (const item of items) {
    const src = path.join(FRAMEWORK_DIR, item);
    const dest = path.join(claudeHome, item);

    if (!fs.existsSync(src)) continue;

    if (fs.existsSync(dest) && !force) {
      // Merge: copy new files, don't overwrite existing
      copyNewFiles(src, dest);
      console.log(`   Merged: ${item}/`);
    } else {
      fs.cpSync(src, dest, { recursive: true });
      console.log(`   Copied: ${item}/`);
    }
  }

  // Copy root config files
  const rootFiles = [
    'CLAUDE.md', 'constitution.md', 'core-config.yaml', 'manifest.yaml',
    'manifest.json', 'framework-config.yaml', 'synapse-manifest.yaml',
    'copy-surface-criteria.yaml', 'registry.yaml',
    'CHANGELOG.md', 'COPY-CHIEF-INDEX.md', 'COPY-DOCS-INDEX.md',
    'ecosystem-status.md', 'orchestrator.md', 'QUICK-REFERENCE.md',
    'RUNBOOK.md', 'WORKFLOW-CANONICO.md',
    'GUIA-ECOSSISTEMA.md', 'GUIA-INSTALACAO.md', 'GUIA-USO-ECOSSISTEMA.md',
  ];
  for (const file of rootFiles) {
    const src = path.join(FRAMEWORK_DIR, file);
    const dest = path.join(claudeHome, file);
    if (fs.existsSync(src) && (force || !fs.existsSync(dest))) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log(`   Root config files ✓`);
}

function copyNewFiles(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyNewFiles(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function installDeps(claudeHome) {
  const aiosCore = path.join(claudeHome, '.aios-core');
  const pkgJson = path.join(aiosCore, 'package.json');

  if (!fs.existsSync(pkgJson)) {
    // Create minimal package.json
    const pkg = { name: 'aios-core', version: '1.0.0', private: true, dependencies: { 'js-yaml': '^4.1.1' } };
    fs.mkdirSync(aiosCore, { recursive: true });
    fs.writeFileSync(pkgJson, JSON.stringify(pkg, null, 2));
  }

  try {
    execSync('npm install --production', { cwd: aiosCore, stdio: 'pipe' });
    console.log('   js-yaml installed ✓');
  } catch (e) {
    console.error(`   ⚠️  npm install failed: ${e.message}`);
  }
}

function transpileHooks(claudeHome) {
  const { transpileAll } = require('./transpile');
  return transpileAll({ force: false });
}

function scaffoldEcosystem(ecoRoot) {
  if (fs.existsSync(path.join(ecoRoot, '.synapse'))) {
    console.log('   Ecosystem already exists');
    return;
  }

  const scaffoldDir = path.join(__dirname, '..', 'templates', 'ecosystem');
  if (fs.existsSync(scaffoldDir)) {
    fs.cpSync(scaffoldDir, ecoRoot, { recursive: true });
    console.log(`   Scaffolded: ${ecoRoot}`);
  } else {
    // Create minimal structure
    const dirs = [
      '.synapse/manifest',
      '.synapse/constitution',
      '.claude/rules/offers',
      'squads/copy-chief/workflows',
      'squads/copy-chief/checklists',
      'squads/copy-chief/data/craft',
    ];
    for (const dir of dirs) {
      fs.mkdirSync(path.join(ecoRoot, dir), { recursive: true });
    }
    // Init git
    try {
      execSync('git init', { cwd: ecoRoot, stdio: 'pipe' });
    } catch { /* already a repo */ }
    console.log(`   Created minimal ecosystem at: ${ecoRoot}`);
  }
}

function createRuntimeDirs(claudeHome, ecoRoot) {
  const dirs = [
    path.join(claudeHome, 'logs'),
    path.join(claudeHome, 'session-state'),
    path.join(claudeHome, 'session-env'),
    path.join(claudeHome, 'session-digests'),
    path.join(claudeHome, 'agent-memory'),
    path.join(claudeHome, 'projects'),
    path.join(claudeHome, 'plans'),
    path.join(claudeHome, 'cache'),
    path.join(claudeHome, 'debug'),
    path.join(claudeHome, 'production-logs'),
    path.join(claudeHome, 'production-loops'),
    path.join(claudeHome, 'shell-snapshots'),
    path.join(claudeHome, 'paste-cache'),
    path.join(claudeHome, 'memory'),
    path.join(claudeHome, 'artifacts'),
    path.join(claudeHome, 'file-history'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   Created: ${path.relative(claudeHome, dir)}/`);
    }
  }
}

module.exports = { install };
