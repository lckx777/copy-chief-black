#!/usr/bin/env node
// sync-repos-on-stop.cjs - Auto-sync repos when session ends
// Hook: Stop
// Sincroniza ~/.claude e ~/copywriting-ecosystem automaticamente

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const HOME = os.homedir();
const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const LOG_FILE = path.join(os.tmpdir(), `claude-sync-${dateStr}.log`);

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
}

function syncRepo(repoPath, repoName) {
  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    log(`SKIP: ${repoName} não é git repo`);
    return;
  }

  // Verificar se há mudanças
  let hasDiff = false;
  try {
    execSync('git diff --quiet', { cwd: repoPath });
    execSync('git diff --cached --quiet', { cwd: repoPath });
  } catch (e) {
    hasDiff = true;
  }

  if (!hasDiff) {
    // Verificar untracked files importantes
    let untrackedCount = 0;
    try {
      const porcelain = execSync('git status --porcelain', { cwd: repoPath, encoding: 'utf8' });
      const lines = porcelain.split('\n').filter(Boolean);
      untrackedCount = lines.filter(l =>
        l.startsWith('??') &&
        !l.includes('plans/') &&
        !l.includes('stats-cache') &&
        !l.includes('history.jsonl')
      ).length;
    } catch (e) {
      untrackedCount = 0;
    }

    if (untrackedCount === 0) {
      log(`OK: ${repoName} - nada para commitar`);
      return;
    }
  }

  // Commit automático
  try {
    execSync('git add -A', { cwd: repoPath });
  } catch (e) {
    // ignore
  }

  const dateTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const msg = `chore: Auto-sync on session end (${dateTime})`;

  try {
    execSync(`git commit -m "${msg}"`, { cwd: repoPath });
    log(`COMMIT: ${repoName}`);

    try {
      execSync('git push', { cwd: repoPath });
      log(`PUSH: ${repoName} OK`);
    } catch (e) {
      log(`PUSH: ${repoName} FAILED`);
    }
  } catch (e) {
    log(`SKIP: ${repoName} - commit falhou ou nada staged`);
  }
}

// Main
log('=== Sync iniciado ===');

// 1. Sync ~/.claude
syncRepo(path.join(HOME, '.claude'), 'claude-ecosystem');

// 2. Sync ~/copywriting-ecosystem
syncRepo(path.join(HOME, 'copywriting-ecosystem'), 'copywriting-ecosystem');

// 3. Vercel deploy se necessário (já tratado pelo git hook post-commit)

log('=== Sync finalizado ===');

process.exit(0);
