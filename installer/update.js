/**
 * Copy Chief BLACK — Update Command
 * Uses CopyChiefUpdater for intelligent updates with rollback
 */
'use strict';

const { CopyChiefUpdater, formatCheckResult, formatUpdateResult } = require('./updater');

async function update(opts = {}) {
  console.log('Copy Chief BLACK — Update\n');

  const updater = new CopyChiefUpdater({
    verbose: opts.verbose || false,
    force: opts.force || false,
    ecosystemRoot: opts.ecosystem,
  });

  // --check mode: just check, don't update
  if (opts.check) {
    const checkResult = await updater.checkForUpdates();
    console.log(formatCheckResult(checkResult));
    // Exit with code 1 if update available (useful for CI)
    if (checkResult.hasUpdate) process.exit(1);
    return;
  }

  // Full update flow
  const result = await updater.update({
    dryRun: opts.dryRun || false,
    onProgress: (phase, message) => {
      if (!opts.quiet) console.log(`  [${phase}] ${message}`);
    },
  });

  console.log(formatUpdateResult(result));

  if (!result.success && result.error !== 'Already up to date') {
    process.exit(1);
  }
}

module.exports = { update };
