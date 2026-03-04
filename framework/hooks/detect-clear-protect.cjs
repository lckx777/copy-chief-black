#!/usr/bin/env node
// detect-clear-protect.cjs — Cross-platform rewrite of detect-clear-protect.sh
// Detects /clear and saves session state before it executes
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const prompt = input.prompt || '';

  if (!/^\/clear/i.test(prompt)) {
    process.stdout.write('{}');
    process.exit(0);
  }

  process.stderr.write('\n');
  process.stderr.write('╔════════════════════════════════════════════════════════════════╗\n');
  process.stderr.write('║  /clear DETECTADO - Salvando estado da sessao...              ║\n');
  process.stderr.write('╚════════════════════════════════════════════════════════════════╝\n');
  process.stderr.write('\n');

  const recoveryDir = path.join(HOME, '.claude', 'session-state', 'recovery');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + 'Z';
  const subdir = path.join(recoveryDir, timestamp);
  fs.mkdirSync(subdir, { recursive: true });

  // Copy planning files if they exist
  for (const file of ['task_plan.md', 'findings.md', 'progress.md']) {
    const src = path.join(process.cwd(), file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(subdir, file));
      process.stderr.write(`[DETECT-CLEAR] Copiado: ${file}\n`);
    }
  }

  // Copy session state
  const stateFile = path.join(HOME, '.claude', 'session-state', 'current-session.json');
  if (fs.existsSync(stateFile)) {
    fs.copyFileSync(stateFile, path.join(subdir, 'session-state.json'));
    process.stderr.write('[DETECT-CLEAR] Copiado: session-state.json\n');
  }

  // Create metadata
  const meta = {
    timestamp: new Date().toISOString(),
    sourceDir: process.cwd(),
    trigger: 'clear',
    summary: 'Recovery state saved before /clear',
  };
  fs.writeFileSync(path.join(subdir, 'recovery-metadata.json'), JSON.stringify(meta, null, 2));

  // Update latest symlink (skip on Windows — use file instead)
  const latestPath = path.join(recoveryDir, 'latest');
  try {
    if (fs.existsSync(latestPath)) fs.rmSync(latestPath, { recursive: true, force: true });
    if (process.platform === 'win32') {
      fs.writeFileSync(latestPath + '.txt', subdir);
    } else {
      fs.symlinkSync(subdir, latestPath);
    }
  } catch { /* symlink failure non-critical */ }

  process.stderr.write('\n');
  process.stderr.write('╔════════════════════════════════════════════════════════════════╗\n');
  process.stderr.write('║  ESTADO SALVO                                                 ║\n');
  process.stderr.write('║  Na proxima sessao, recovery sera oferecido automaticamente.  ║\n');
  process.stderr.write('╚════════════════════════════════════════════════════════════════╝\n');
  process.stderr.write('\n');

  process.stdout.write('{}');
} catch (e) {
  process.stderr.write(`[detect-clear-protect] Error: ${e.message}\n`);
  process.stdout.write('{}');
}
