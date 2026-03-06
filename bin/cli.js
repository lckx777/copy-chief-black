#!/usr/bin/env node
/**
 * Copy Chief BLACK — CLI Entry Point
 * Usage: npx @lucapimenta/copy-chief-black <command>
 */
'use strict';

const { Command } = require('commander');
const pkg = require('../package.json');

const program = new Command();

program
  .name('copy-chief-black')
  .description('Copy Chief BLACK — Direct Response Copywriting Framework for Claude Code')
  .version(pkg.version);

program
  .command('install')
  .description('Install Copy Chief BLACK framework into ~/.claude/')
  .option('--force', 'Overwrite existing installation')
  .option('--no-backup', 'Skip backup of existing ~/.claude/')
  .option('--ecosystem <path>', 'Custom ecosystem root path')
  .action(async (opts) => {
    const { install } = require('../installer/install');
    await install(opts);
  });

program
  .command('update')
  .description('Update framework preserving customizations')
  .option('--check', 'Only check if update is available (exit code 1 = update available)')
  .option('--dry-run', 'Preview what would be updated without applying')
  .option('--force', 'Force update even if versions match')
  .option('--verbose', 'Show detailed update log')
  .option('--ecosystem <path>', 'Custom ecosystem root path')
  .option('--init-tracking', 'Initialize version tracking for existing installation')
  .action(async (opts) => {
    // --init-tracking: generate version.json for existing install
    if (opts.initTracking) {
      const { CopyChiefUpdater } = require('../installer/updater');
      const updater = new CopyChiefUpdater({ verbose: true, ecosystemRoot: opts.ecosystem });
      const installed = await updater.getInstalledVersion();
      const version = installed?.version || pkg.version;
      const info = updater.writeVersionInfo(version);
      console.log(`Version tracking initialized: v${version}`);
      console.log(`  File hashes: ${Object.keys(info.fileHashes).length} files tracked`);
      return;
    }

    const { update } = require('../installer/update');
    await update(opts);
  });

program
  .command('verify')
  .description('Verify installation integrity')
  .option('--fix', 'Attempt to fix issues found')
  .action(async (opts) => {
    const { verify } = require('../installer/verify');
    await verify(opts);
  });

program
  .command('doctor')
  .description('Diagnose environment and configuration issues')
  .action(async () => {
    const { doctor } = require('../installer/doctor');
    await doctor();
  });

program
  .command('new-offer <niche> <name>')
  .description('Scaffold a new offer project')
  .option('--template <type>', 'Offer template (vsl, quiz, webinar)', 'vsl')
  .action(async (niche, name, opts) => {
    const { newOffer } = require('../installer/new-offer');
    await newOffer(niche, name, opts);
  });

program
  .command('install-all')
  .description('Install everything: core + MCP server + dashboard')
  .option('--force', 'Overwrite existing installation')
  .option('--no-backup', 'Skip backup')
  .option('--ecosystem <path>', 'Custom ecosystem root path')
  .option('--skip-dashboard', 'Skip dashboard installation')
  .action(async (opts) => {
    const { install } = require('../installer/install');
    await install(opts);

    // MCP Server
    console.log('\n--- Installing Copywriting MCP Server ---\n');
    const { execSync } = require('child_process');
    try {
      execSync('npx @lucapimenta/copywriting-mcp install', { stdio: 'inherit' });
    } catch {
      console.log('⚠️  MCP install failed. Run separately: npx @lucapimenta/copywriting-mcp install');
    }

    // Dashboard (optional)
    if (!opts.skipDashboard) {
      console.log('\n--- Installing Copy Chief Dashboard ---\n');
      try {
        execSync('npx @lucapimenta/copy-chief-dashboard install', { stdio: 'inherit' });
      } catch {
        console.log('⚠️  Dashboard install failed. Run separately: npx @lucapimenta/copy-chief-dashboard install');
      }
    }

    console.log('\n✅ Full installation complete!');
  });

program.parse();
