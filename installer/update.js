/**
 * Copy Chief BLACK — Update
 * Merges new framework version preserving customizations
 */
'use strict';

const fs = require('fs');
const path = require('path');
const platform = require('../lib/platform');
const settingsBuilder = require('../lib/settings-builder');

async function update(opts = {}) {
  console.log('Copy Chief BLACK — Update\n');

  const claudeHome = platform.claudeHome();
  if (!fs.existsSync(claudeHome)) {
    console.error('❌ No installation found. Run: copy-chief-black install');
    process.exit(1);
  }

  // Backup before update
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = `${claudeHome}-pre-update-${timestamp}`;
  fs.cpSync(claudeHome, backupDir, { recursive: true });
  console.log(`  Backup: ${backupDir}`);

  // Update framework files
  const frameworkDir = path.join(__dirname, '..', 'framework');
  if (fs.existsSync(frameworkDir)) {
    const items = ['.aios-core', 'hooks', 'agents', 'plugins', 'schemas'];
    for (const item of items) {
      const src = path.join(frameworkDir, item);
      const dest = path.join(claudeHome, item);
      if (!fs.existsSync(src)) continue;
      fs.cpSync(src, dest, { recursive: true, force: opts.force || false });
      console.log(`  Updated: ${item}/`);
    }
  }

  // Regenerate settings.json (merge mode)
  settingsBuilder.writeSettings({ force: false });
  console.log('  Merged: settings.json');

  // Reinstall deps
  const aiosCore = platform.aiosCoreDir();
  const { execSync } = require('child_process');
  try {
    execSync('npm install --production', { cwd: aiosCore, stdio: 'pipe' });
    console.log('  Dependencies updated ✓');
  } catch (e) {
    console.error(`  ⚠️  npm install: ${e.message}`);
  }

  console.log('\n✅ Update complete.');
}

module.exports = { update };
