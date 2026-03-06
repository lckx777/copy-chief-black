/**
 * Copy Chief BLACK — Updater
 * Intelligent update system modeled after AIOX Core updater
 *
 * Features:
 * - npm registry version check
 * - File hash-based customization detection
 * - Backup/rollback safety net
 * - Post-update validation
 * - Dry-run support
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');
const platform = require('../lib/platform');

const NPM_PACKAGE = '@lucapimenta/copy-chief-black';
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${encodeURIComponent(NPM_PACKAGE)}/latest`;

const UpdateStatus = {
  UP_TO_DATE: 'up_to_date',
  UPDATE_AVAILABLE: 'update_available',
  UPDATE_REQUIRED: 'update_required',
  CHECK_FAILED: 'check_failed',
};

const FileAction = {
  NEW: 'new',
  UPDATED: 'updated',
  PRESERVED: 'preserved',
  UNCHANGED: 'unchanged',
};

// ─── File Hashing ───────────────────────────────────────────────

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function hashesMatch(h1, h2) {
  const normalize = (h) => h.replace(/^sha256:/, '');
  return normalize(h1) === normalize(h2);
}

// ─── CopyChiefUpdater Class ─────────────────────────────────────

class CopyChiefUpdater {
  constructor(options = {}) {
    this.claudeHome = platform.claudeHome();
    this.ecosystemRoot = options.ecosystemRoot || platform.ecosystemRoot();

    this.options = {
      verbose: options.verbose === true,
      force: options.force === true,
      timeout: options.timeout || 15000,
    };

    this.installedVersion = null;
    this.latestVersion = null;
    this.versionInfo = null;
    this.backupDir = null;
  }

  // ── Version Detection ──────────────────────────────────────────

  async getInstalledVersion() {
    // Try version.json first (v2.0+ format)
    const versionJsonPath = path.join(this.claudeHome, '.copy-chief-version.json');
    if (fs.existsSync(versionJsonPath)) {
      try {
        const info = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
        this.versionInfo = info;
        return info;
      } catch (e) {
        this.log(`Could not read version.json: ${e.message}`);
      }
    }

    // Fallback: try to find version from package.json in npm global
    try {
      const result = execSync(`npm list -g ${NPM_PACKAGE} --json 2>/dev/null`, { stdio: 'pipe' });
      const data = JSON.parse(result.toString());
      const deps = data.dependencies || {};
      const pkg = deps[NPM_PACKAGE];
      if (pkg && pkg.version) {
        return { version: pkg.version, installedAt: null, mode: 'global-npm' };
      }
    } catch { /* not installed globally */ }

    // Fallback: check local node_modules
    try {
      const localPkg = path.join(process.cwd(), 'node_modules', NPM_PACKAGE.split('/')[1], 'package.json');
      if (fs.existsSync(localPkg)) {
        const pkg = JSON.parse(fs.readFileSync(localPkg, 'utf8'));
        return { version: pkg.version, installedAt: null, mode: 'local-npm' };
      }
    } catch { /* not found */ }

    return null;
  }

  async getLatestVersion() {
    return new Promise((resolve) => {
      const request = https.get(
        NPM_REGISTRY_URL,
        { timeout: this.options.timeout },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.version || null);
            } catch { resolve(null); }
          });
        },
      );
      request.on('error', () => resolve(null));
      request.on('timeout', () => { request.destroy(); resolve(null); });
    });
  }

  async checkConnectivity() {
    return new Promise((resolve) => {
      const request = https.get(
        'https://registry.npmjs.org/',
        { timeout: 5000 },
        (res) => resolve(res.statusCode === 200),
      );
      request.on('error', () => resolve(false));
      request.on('timeout', () => { request.destroy(); resolve(false); });
    });
  }

  compareVersions(v1, v2) {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number);
    const parts2 = v2.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  isBreakingUpdate(installed, latest) {
    const installedMajor = parseInt(installed.replace(/^v/, '').split('.')[0], 10);
    const latestMajor = parseInt(latest.replace(/^v/, '').split('.')[0], 10);
    return latestMajor > installedMajor;
  }

  // ── Check for Updates ──────────────────────────────────────────

  async checkForUpdates() {
    const result = {
      status: UpdateStatus.CHECK_FAILED,
      installed: null,
      latest: null,
      installedAt: null,
      hasUpdate: false,
      isBreaking: false,
      error: null,
    };

    try {
      this.installedVersion = await this.getInstalledVersion();
      result.installed = this.installedVersion?.version || null;
      result.installedAt = this.installedVersion?.installedAt || null;

      if (!result.installed) {
        result.error = 'Copy Chief BLACK not installed or version info not found';
        return result;
      }

      this.latestVersion = await this.getLatestVersion();
      result.latest = this.latestVersion;

      if (!result.latest) {
        const isOnline = await this.checkConnectivity();
        result.error = isOnline
          ? `Package ${NPM_PACKAGE} not found on npm registry.`
          : 'You appear to be offline. Please check your internet connection.';
        return result;
      }

      const comparison = this.compareVersions(result.installed, result.latest);
      if (comparison >= 0 && !this.options.force) {
        result.status = UpdateStatus.UP_TO_DATE;
        result.hasUpdate = false;
      } else {
        result.hasUpdate = true;
        result.isBreaking = this.isBreakingUpdate(result.installed, result.latest);
        result.status = result.isBreaking
          ? UpdateStatus.UPDATE_REQUIRED
          : UpdateStatus.UPDATE_AVAILABLE;
      }

      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  // ── Customization Detection ────────────────────────────────────

  async detectCustomizations() {
    const result = { customized: [], unchanged: [], missing: [], error: null };

    if (!this.versionInfo?.fileHashes) {
      const versionJsonPath = path.join(this.claudeHome, '.copy-chief-version.json');
      if (fs.existsSync(versionJsonPath)) {
        try {
          this.versionInfo = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
        } catch (e) {
          result.error = `Could not read version.json: ${e.message}`;
          return result;
        }
      } else {
        result.error = 'No version tracking file — cannot detect customizations (first install?)';
        return result;
      }
    }

    if (!this.versionInfo.fileHashes) {
      result.error = 'No file hashes stored — cannot detect customizations';
      return result;
    }

    for (const [relativePath, originalHash] of Object.entries(this.versionInfo.fileHashes)) {
      const absolutePath = path.join(this.claudeHome, relativePath);
      if (!fs.existsSync(absolutePath)) {
        result.missing.push(relativePath);
        continue;
      }
      try {
        const currentHash = `sha256:${hashFile(absolutePath)}`;
        if (hashesMatch(currentHash, originalHash)) {
          result.unchanged.push(relativePath);
        } else {
          result.customized.push(relativePath);
        }
      } catch {
        result.missing.push(relativePath);
      }
    }

    return result;
  }

  // ── Backup / Rollback ──────────────────────────────────────────

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.backupDir = `${this.claudeHome}-pre-update-${timestamp}`;

    // Only backup the framework-managed files, not the entire ~/.claude/
    const criticalDirs = ['.aios-core', 'config', 'rules', 'schemas', 'templates', 'workflows', 'squads'];
    const criticalFiles = ['CLAUDE.md', 'settings.json', '.copy-chief-version.json'];

    fs.mkdirSync(this.backupDir, { recursive: true });

    for (const dir of criticalDirs) {
      const src = path.join(this.claudeHome, dir);
      if (fs.existsSync(src)) {
        fs.cpSync(src, path.join(this.backupDir, dir), { recursive: true });
      }
    }
    for (const file of criticalFiles) {
      const src = path.join(this.claudeHome, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(this.backupDir, file));
      }
    }

    // Backup squad from ecosystem
    const squadSrc = path.join(this.ecosystemRoot, 'squads', 'copy-chief');
    if (fs.existsSync(squadSrc)) {
      const squadBackup = path.join(this.backupDir, '_ecosystem-squad');
      fs.cpSync(squadSrc, squadBackup, { recursive: true });
    }

    this.log(`Backup created: ${this.backupDir}`);
    return this.backupDir;
  }

  async rollback() {
    if (!this.backupDir || !fs.existsSync(this.backupDir)) {
      throw new Error('No backup available for rollback');
    }

    const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '_ecosystem-squad') continue; // Handle separately
      const src = path.join(this.backupDir, entry.name);
      const dest = path.join(this.claudeHome, entry.name);
      if (entry.isDirectory()) {
        fs.cpSync(src, dest, { recursive: true, force: true });
      } else {
        fs.copyFileSync(src, dest);
      }
    }

    // Restore ecosystem squad
    const squadBackup = path.join(this.backupDir, '_ecosystem-squad');
    if (fs.existsSync(squadBackup)) {
      const squadDest = path.join(this.ecosystemRoot, 'squads', 'copy-chief');
      fs.cpSync(squadBackup, squadDest, { recursive: true, force: true });
    }

    console.log('  Rollback completed successfully');
  }

  cleanupBackup() {
    if (this.backupDir && fs.existsSync(this.backupDir)) {
      fs.rmSync(this.backupDir, { recursive: true, force: true });
      this.backupDir = null;
    }
  }

  // ── Apply Update ───────────────────────────────────────────────

  async applyUpdate(targetVersion, customizedFiles = []) {
    const result = { success: false, filesUpdated: 0, error: null };

    try {
      // Download the new version to a temp directory
      const tmpDir = path.join(require('os').tmpdir(), `ccb-update-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      this.log(`Downloading ${NPM_PACKAGE}@${targetVersion}...`);
      execSync(`npm pack ${NPM_PACKAGE}@${targetVersion} --pack-destination "${tmpDir}"`, {
        stdio: 'pipe',
        timeout: 120000,
      });

      // Find and extract the tarball
      const tarballs = fs.readdirSync(tmpDir).filter(f => f.endsWith('.tgz'));
      if (tarballs.length === 0) {
        result.error = 'Failed to download package';
        return result;
      }

      const extractDir = path.join(tmpDir, 'extracted');
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`tar -xzf "${path.join(tmpDir, tarballs[0])}" -C "${extractDir}"`, {
        stdio: 'pipe',
        timeout: 30000,
      });

      const packageDir = path.join(extractDir, 'package');
      const frameworkDir = path.join(packageDir, 'framework');

      if (!fs.existsSync(frameworkDir)) {
        result.error = 'Package does not contain framework directory';
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return result;
      }

      // Copy framework files, preserving customizations
      const customSet = new Set(customizedFiles);

      const copyRecursive = (src, dest, basePath = '') => {
        let count = 0;
        if (!fs.existsSync(src)) return count;
        fs.mkdirSync(dest, { recursive: true });

        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

          if (entry.isDirectory()) {
            count += copyRecursive(srcPath, destPath, relPath);
          } else {
            if (customSet.has(relPath)) {
              this.log(`  Preserved (customized): ${relPath}`);
              continue;
            }
            fs.copyFileSync(srcPath, destPath);
            count++;
          }
        }
        return count;
      };

      result.filesUpdated = copyRecursive(frameworkDir, this.claudeHome);

      // Update squad in ecosystem
      const squadSrc = path.join(frameworkDir, 'squads', 'copy-chief');
      if (fs.existsSync(squadSrc)) {
        const squadDest = path.join(this.ecosystemRoot, 'squads', 'copy-chief');
        result.filesUpdated += copyRecursive(squadSrc, squadDest);
        this.log('  Squad updated in ecosystem');
      }

      // Update settings.json (merge mode)
      const settingsBuilder = require('../lib/settings-builder');
      settingsBuilder.writeSettings({ ecosystemRoot: this.ecosystemRoot, force: false });
      this.log('  Merged settings.json');

      // Reinstall deps
      const aiosCore = platform.aiosCoreDir();
      if (fs.existsSync(path.join(aiosCore, 'package.json'))) {
        try {
          execSync('npm install --production', { cwd: aiosCore, stdio: 'pipe' });
          this.log('  Dependencies updated');
        } catch (e) {
          this.log(`  Dependencies warning: ${e.message}`);
        }
      }

      // Cleanup temp
      fs.rmSync(tmpDir, { recursive: true, force: true });

      result.success = true;
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }

  // ── Version Tracking ───────────────────────────────────────────

  generateFileHashes() {
    const hashes = {};
    const dirsToHash = ['.aios-core', 'config', 'rules', 'schemas', 'templates', 'workflows'];

    for (const dir of dirsToHash) {
      const fullDir = path.join(this.claudeHome, dir);
      if (!fs.existsSync(fullDir)) continue;
      this._hashDir(fullDir, dir, hashes);
    }

    // Hash root files
    const rootFiles = ['CLAUDE.md', 'settings.json'];
    for (const file of rootFiles) {
      const fullPath = path.join(this.claudeHome, file);
      if (fs.existsSync(fullPath)) {
        try {
          hashes[file] = `sha256:${hashFile(fullPath)}`;
        } catch { /* skip */ }
      }
    }

    return hashes;
  }

  _hashDir(dirPath, relativeTo, hashes) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = `${relativeTo}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        this._hashDir(fullPath, relPath, hashes);
      } else {
        try {
          hashes[relPath] = `sha256:${hashFile(fullPath)}`;
        } catch { /* skip */ }
      }
    }
  }

  writeVersionInfo(version) {
    const versionInfo = {
      version,
      installedAt: this.versionInfo?.installedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileHashes: this.generateFileHashes(),
    };

    const versionPath = path.join(this.claudeHome, '.copy-chief-version.json');
    fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2) + '\n', 'utf8');
    this.log(`Version info written: v${version}`);
    return versionInfo;
  }

  // ── Full Update Flow ───────────────────────────────────────────

  async update(options = {}) {
    const dryRun = options.dryRun === true;
    const onProgress = options.onProgress || (() => {});

    const result = {
      success: false,
      dryRun,
      previousVersion: null,
      newVersion: null,
      filesUpdated: 0,
      filesPreserved: 0,
      error: null,
      rollbackAvailable: false,
    };

    try {
      // 1. Check for updates
      onProgress('checking', 'Checking for updates...');
      const checkResult = await this.checkForUpdates();

      if (!checkResult.hasUpdate && !this.options.force) {
        result.success = true;
        result.previousVersion = checkResult.installed;
        result.newVersion = checkResult.installed;
        result.error = 'Already up to date';
        return result;
      }

      result.previousVersion = checkResult.installed;
      result.newVersion = checkResult.latest;

      // 2. Dry-run: just preview
      if (dryRun) {
        const customizations = await this.detectCustomizations();
        return {
          ...result,
          success: true,
          dryRun: true,
          customizations: customizations.customized,
          isBreaking: checkResult.isBreaking,
        };
      }

      // 3. Backup
      onProgress('backup', 'Creating backup...');
      await this.createBackup();
      result.rollbackAvailable = true;

      // 4. Detect customizations
      onProgress('detecting', 'Detecting customizations...');
      const customizations = await this.detectCustomizations();
      result.filesPreserved = customizations.customized.length;

      // 5. Apply update
      onProgress('updating', `Updating to v${checkResult.latest}...`);
      const applyResult = await this.applyUpdate(checkResult.latest, customizations.customized);

      if (!applyResult.success) {
        onProgress('rollback', 'Update failed, rolling back...');
        await this.rollback();
        result.error = applyResult.error;
        return result;
      }

      result.filesUpdated = applyResult.filesUpdated;

      // 6. Write version tracking
      onProgress('finalizing', 'Writing version info...');
      this.writeVersionInfo(checkResult.latest);

      // 7. Validate
      onProgress('validating', 'Validating installation...');
      const { verify } = require('./verify');
      const valid = await verify({ quiet: true });

      if (!valid) {
        console.log('  ⚠️  Post-update validation found issues. Run: copy-chief-black doctor');
      }

      // 8. Cleanup backup on success
      this.cleanupBackup();
      result.rollbackAvailable = false;
      result.success = true;

      onProgress('complete', 'Update complete!');
      return result;
    } catch (error) {
      result.error = error.message;
      if (result.rollbackAvailable) {
        try {
          await this.rollback();
          result.error += ' (rolled back successfully)';
        } catch (rbErr) {
          result.error += ` (rollback failed: ${rbErr.message})`;
        }
      }
      return result;
    }
  }

  log(message) {
    if (this.options.verbose) {
      console.log(`  [updater] ${message}`);
    }
  }
}

// ─── Formatting ─────────────────────────────────────────────────

function formatCheckResult(result) {
  const lines = [];
  lines.push('');
  lines.push('Copy Chief BLACK — Update Check\n');

  if (result.installed) {
    lines.push(`  Current:  v${result.installed}${result.installedAt ? ` (installed ${result.installedAt})` : ''}`);
  } else {
    lines.push('  Current:  Not installed');
  }

  if (result.latest) {
    lines.push(`  Latest:   v${result.latest}`);
  }

  lines.push('');

  switch (result.status) {
    case UpdateStatus.UP_TO_DATE:
      lines.push('  ✓ You\'re up to date!');
      break;
    case UpdateStatus.UPDATE_AVAILABLE:
      lines.push('  ⬆ Update available!');
      lines.push('  Run: copy-chief-black update');
      break;
    case UpdateStatus.UPDATE_REQUIRED:
      lines.push('  ⚠ Breaking update available!');
      lines.push('  Review changelog before updating.');
      lines.push('  Run: copy-chief-black update --force');
      break;
    case UpdateStatus.CHECK_FAILED:
      lines.push(`  ✗ Check failed: ${result.error}`);
      break;
  }

  lines.push('');
  return lines.join('\n');
}

function formatUpdateResult(result) {
  const lines = [];
  lines.push('');

  if (result.success) {
    if (result.dryRun) {
      lines.push('Copy Chief BLACK — Update Preview (dry-run)\n');
      lines.push(`  From: v${result.previousVersion}`);
      lines.push(`  To:   v${result.newVersion}`);
      if (result.customizations && result.customizations.length > 0) {
        lines.push(`\n  Customizations preserved (${result.customizations.length}):`);
        for (const f of result.customizations) lines.push(`    - ${f}`);
      }
      lines.push('\n  Run without --dry-run to apply.');
    } else if (result.error === 'Already up to date') {
      lines.push(`  ✓ Already up to date (v${result.previousVersion})`);
    } else {
      lines.push(`  ✅ Updated to v${result.newVersion}\n`);
      lines.push(`  Previous: v${result.previousVersion}`);
      if (result.filesUpdated > 0) lines.push(`  Files:    ${result.filesUpdated} updated`);
      if (result.filesPreserved > 0) lines.push(`  Preserved: ${result.filesPreserved} customizations`);
      lines.push('\n  Run: copy-chief-black verify');
    }
  } else {
    lines.push(`  ✗ Update failed: ${result.error}`);
    if (result.rollbackAvailable) {
      lines.push('  Rolled back to previous version.');
    }
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  CopyChiefUpdater,
  UpdateStatus,
  FileAction,
  hashFile,
  hashesMatch,
  formatCheckResult,
  formatUpdateResult,
};
