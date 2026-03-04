'use strict';

const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const KNOWN_NICHES = ['saude', 'relacionamento', 'concursos', 'financeiro', 'educacao'];

const DEFAULTS = {
  staleSessionDays: 30,
  staleSnapshotDays: 90,
  staleProductionDays: 60,
  staleLockMinutes: 30,
};

class CopyDataLifecycle {
  constructor(ecosystemRoot, options = {}) {
    if (!ecosystemRoot || typeof ecosystemRoot !== 'string') {
      throw new Error('ecosystemRoot is required');
    }

    this.ecosystemRoot = ecosystemRoot;
    this.options = {
      debug: false,
      ...DEFAULTS,
      ...options,
    };
  }

  async runStartupCleanup() {
    const result = {
      timestamp: new Date().toISOString(),
      offersScanned: 0,
      sessionsArchived: 0,
      locksRemoved: 0,
      productionArchived: 0,
      aiosCleanedUp: 0,
      errors: [],
    };

    const offers = this._findOffers();
    result.offersScanned = offers.length;

    for (const offerPath of offers) {
      try {
        const sessionResult = await this.cleanupStaleSessions(offerPath);
        result.sessionsArchived += sessionResult;
      } catch (e) {
        result.errors.push(`Session cleanup ${offerPath}: ${e.message}`);
      }

      try {
        const lockResult = await this.cleanupOrphanLocks(offerPath);
        result.locksRemoved += lockResult;
      } catch (e) {
        result.errors.push(`Lock cleanup ${offerPath}: ${e.message}`);
      }

      try {
        const prodResult = await this.archiveOldProduction(offerPath);
        result.productionArchived += prodResult;
      } catch (e) {
        result.errors.push(`Production cleanup ${offerPath}: ${e.message}`);
      }

      try {
        const aiosResult = await this.cleanupAiosDir(offerPath);
        result.aiosCleanedUp += aiosResult;
      } catch (e) {
        result.errors.push(`AIOS cleanup ${offerPath}: ${e.message}`);
      }
    }

    this._logSummary(result);
    return result;
  }

  async cleanupStaleSessions(offerPath) {
    const aiosDir = path.join(offerPath, '.aios');
    if (!fs.existsSync(aiosDir)) return 0;

    let archived = 0;
    const now = Date.now();
    const threshold = this.options.staleSessionDays * 24 * 60 * 60 * 1000;

    // Look for session state files
    const sessionFiles = ['session-state.yaml', 'session-context.json'];
    for (const file of sessionFiles) {
      const filePath = path.join(aiosDir, file);
      if (!fs.existsSync(filePath)) continue;

      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > threshold) {
          const archiveDir = path.join(aiosDir, '.archive', 'sessions');
          await fsp.mkdir(archiveDir, { recursive: true });

          const timestamp = new Date(stats.mtimeMs).toISOString().split('T')[0];
          const archiveName = `${path.basename(file, path.extname(file))}-${timestamp}${path.extname(file)}`;
          await fsp.rename(filePath, path.join(archiveDir, archiveName));

          archived++;
          this._log(`Archived stale session: ${filePath}`);
        }
      } catch (e) {
        this._log(`Failed to check session: ${filePath} — ${e.message}`);
      }
    }

    return archived;
  }

  async cleanupOrphanLocks(offerPath) {
    const locksDir = path.join(offerPath, '.aios', 'locks');
    if (!fs.existsSync(locksDir)) return 0;

    let removed = 0;
    const now = Date.now();
    const threshold = this.options.staleLockMinutes * 60 * 1000;

    try {
      const files = await fsp.readdir(locksDir);
      for (const file of files) {
        if (!file.endsWith('.lock')) continue;

        const lockPath = path.join(locksDir, file);
        try {
          const stats = fs.statSync(lockPath);

          // Remove locks older than threshold
          if (now - stats.mtimeMs > threshold) {
            await fsp.unlink(lockPath);
            removed++;
            this._log(`Removed orphan lock: ${lockPath}`);
          }
        } catch (e) {
          this._log(`Failed to check lock: ${lockPath} — ${e.message}`);
        }
      }
    } catch (e) {
      this._log(`Failed to read locks dir: ${locksDir} — ${e.message}`);
    }

    return removed;
  }

  async archiveOldProduction(offerPath) {
    const prodDir = path.join(offerPath, 'production');
    if (!fs.existsSync(prodDir)) return 0;

    let archived = 0;
    const now = Date.now();
    const threshold = this.options.staleProductionDays * 24 * 60 * 60 * 1000;

    // Look for backup files in production
    const backupPattern = /\.backup\.|\.bak$|\.old$/;

    try {
      const entries = await this._walkDir(prodDir, 2); // Max 2 levels deep
      for (const entry of entries) {
        if (!backupPattern.test(entry)) continue;

        try {
          const stats = fs.statSync(entry);
          if (now - stats.mtimeMs > threshold) {
            const archiveDir = path.join(offerPath, '.archive', 'production');
            await fsp.mkdir(archiveDir, { recursive: true });

            const archiveName = `${path.basename(entry)}-${new Date(stats.mtimeMs).toISOString().split('T')[0]}`;
            await fsp.rename(entry, path.join(archiveDir, archiveName));

            archived++;
            this._log(`Archived old production backup: ${entry}`);
          }
        } catch (e) {
          this._log(`Failed to archive: ${entry} — ${e.message}`);
        }
      }
    } catch (e) {
      this._log(`Failed to walk production dir: ${e.message}`);
    }

    return archived;
  }

  async cleanupAiosDir(offerPath) {
    const aiosDir = path.join(offerPath, '.aios');
    if (!fs.existsSync(aiosDir)) return 0;

    let cleaned = 0;
    const now = Date.now();
    const threshold = this.options.staleSnapshotDays * 24 * 60 * 60 * 1000;

    // Clean old execution status files
    const statusFiles = ['execution-status.json'];
    for (const file of statusFiles) {
      const filePath = path.join(aiosDir, file);
      if (!fs.existsSync(filePath)) continue;

      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > threshold) {
          await fsp.unlink(filePath);
          cleaned++;
          this._log(`Removed stale AIOS file: ${filePath}`);
        }
      } catch (e) {
        this._log(`Failed to clean AIOS file: ${filePath} — ${e.message}`);
      }
    }

    // Clean old handoff files
    const handoffsDir = path.join(aiosDir, 'handoffs');
    if (fs.existsSync(handoffsDir)) {
      try {
        const files = await fsp.readdir(handoffsDir);
        for (const file of files) {
          const filePath = path.join(handoffsDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > threshold) {
              await fsp.unlink(filePath);
              cleaned++;
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    return cleaned;
  }

  async cleanupAll() {
    return this.runStartupCleanup();
  }

  _findOffers() {
    const offers = [];

    for (const niche of KNOWN_NICHES) {
      const nichePath = path.join(this.ecosystemRoot, niche);
      if (!fs.existsSync(nichePath)) continue;

      try {
        const entries = fs.readdirSync(nichePath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const offerPath = path.join(nichePath, entry.name);
          // Only process directories that look like offers
          if (fs.existsSync(path.join(offerPath, 'helix-state.yaml')) ||
              fs.existsSync(path.join(offerPath, 'CONTEXT.md'))) {
            offers.push(offerPath);
          }
        }
      } catch { /* skip */ }
    }

    return offers;
  }

  async _walkDir(dir, maxDepth, currentDepth = 0) {
    const entries = [];
    if (currentDepth >= maxDepth) return entries;

    try {
      const items = await fsp.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isFile()) {
          entries.push(fullPath);
        } else if (item.isDirectory() && !item.name.startsWith('.')) {
          const subEntries = await this._walkDir(fullPath, maxDepth, currentDepth + 1);
          entries.push(...subEntries);
        }
      }
    } catch { /* skip */ }

    return entries;
  }

  _logSummary(result) {
    const hasWork = result.sessionsArchived > 0 || result.locksRemoved > 0 ||
                    result.productionArchived > 0 || result.aiosCleanedUp > 0;

    if (hasWork || this.options.debug) {
      console.log(`🧹 Copy Cleanup: ${result.offersScanned} offers | ` +
        `${result.sessionsArchived} sessions archived | ` +
        `${result.locksRemoved} locks removed | ` +
        `${result.productionArchived} production archived | ` +
        `${result.aiosCleanedUp} AIOS cleaned`);
    }

    if (result.errors.length > 0) {
      console.log(`⚠️ Cleanup errors: ${result.errors.length}`);
    }
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[CopyDataLifecycle] ${message}`);
    }
  }
}

module.exports = { CopyDataLifecycle, DEFAULTS, KNOWN_NICHES };
