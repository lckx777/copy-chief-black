#!/usr/bin/env node
// sync-repos-on-stop.cjs - Auto-sync repos when session ends
// Hook: Stop
// Sincroniza 5 repos: 2 source + 3 distribution

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const HOME = os.homedir();
const CLAUDE_HOME = path.join(HOME, '.claude');
const ECO_ROOT = path.join(HOME, 'copywriting-ecosystem');
const PACKAGES = path.join(ECO_ROOT, 'packages');
const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const LOG_FILE = path.join(os.tmpdir(), `claude-sync-${dateStr}.log`);

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  fs.appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
}

// ── rsync-like copy (only changed files) ──────────────────────────
function syncDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    // skip git, node_modules, runtime data
    if (['.git', 'node_modules', '.DS_Store', 'session-state', 'session-env',
         'session-digests', 'agent-memory', 'logs', 'debug', 'cache',
         'paste-cache', 'shell-snapshots', 'production-logs', 'production-loops',
         'file-history', 'memory', 'artifacts', 'projects', 'plans',
         'telemetry', 'todos', 'tasks', 'history.jsonl', 'mcp-needs-auth-cache.json',
         'stats-cache.json', 'archive'].includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += syncDir(srcPath, destPath);
    } else {
      // Only copy if source is newer or dest doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath);
        count++;
      } else {
        const srcStat = fs.statSync(srcPath);
        const destStat = fs.statSync(destPath);
        if (srcStat.mtimeMs > destStat.mtimeMs) {
          fs.copyFileSync(srcPath, destPath);
          count++;
        }
      }
    }
  }
  return count;
}

// ── Distribution sync: source → package repo ──────────────────────
function syncDistribution() {
  log('--- Distribution sync ---');

  // 1. copy-chief-black: ~/.claude/ → packages/copy-chief-black/framework/
  const coreFramework = path.join(PACKAGES, 'copy-chief-black', 'framework');
  const coreDirs = [
    '.aios-core', 'hooks', 'scripts', 'agents', 'copy-squad',
    'plugins', 'schemas', 'skills', 'commands',
    'knowledge', 'reference', 'references', 'dossiers', 'experts',
    'config', 'checklists', 'rules', 'data',
    'templates', 'workflows',
    'stories', 'gotchas', 'learned-patterns', 'ids',
    'docs', 'tests'
  ];
  let coreCount = 0;
  for (const dir of coreDirs) {
    const src = path.join(CLAUDE_HOME, dir);
    if (fs.existsSync(src)) {
      coreCount += syncDir(src, path.join(coreFramework, dir));
    }
  }
  // Root config files
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
    const src = path.join(CLAUDE_HOME, file);
    const dest = path.join(coreFramework, file);
    if (fs.existsSync(src)) {
      const srcStat = fs.statSync(src);
      if (!fs.existsSync(dest) || srcStat.mtimeMs > fs.statSync(dest).mtimeMs) {
        fs.copyFileSync(src, dest);
        coreCount++;
      }
    }
  }
  log(`  copy-chief-black: ${coreCount} files synced`);

  // 2. copy-chief-dashboard: ~/.claude/dashboard-v2/ → packages/copy-chief-dashboard/dashboard/
  const dashSrc = path.join(CLAUDE_HOME, 'dashboard-v2');
  const dashDest = path.join(PACKAGES, 'copy-chief-dashboard', 'dashboard');
  let dashCount = 0;
  if (fs.existsSync(dashSrc)) {
    dashCount = syncDir(dashSrc, dashDest);
  }
  log(`  copy-chief-dashboard: ${dashCount} files synced`);

  // 3. copywriting-mcp: ~/.claude/plugins/copywriting-mcp/ → packages/copywriting-mcp/server/
  const mcpSrc = path.join(CLAUDE_HOME, 'plugins', 'copywriting-mcp');
  const mcpDest = path.join(PACKAGES, 'copywriting-mcp', 'server');
  let mcpCount = 0;
  if (fs.existsSync(mcpSrc)) {
    mcpCount = syncDir(mcpSrc, mcpDest);
  }
  log(`  copywriting-mcp: ${mcpCount} files synced`);

  return { coreCount, dashCount, mcpCount };
}

// ── Git commit + push ─────────────────────────────────────────────
function syncRepo(repoPath, repoName) {
  const gitDir = path.join(repoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    log(`SKIP: ${repoName} — not a git repo`);
    return;
  }

  let hasDiff = false;
  try {
    execSync('git diff --quiet', { cwd: repoPath });
    execSync('git diff --cached --quiet', { cwd: repoPath });
  } catch (e) {
    hasDiff = true;
  }

  if (!hasDiff) {
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
      log(`OK: ${repoName} — nothing to commit`);
      return;
    }
  }

  try {
    execSync('git add -A', { cwd: repoPath });
  } catch (e) { /* ignore */ }

  const dateTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const msg = `chore: Auto-sync on session end (${dateTime})`;

  try {
    execSync(`git commit -m "${msg}"`, { cwd: repoPath });
    log(`COMMIT: ${repoName}`);
    try {
      execSync('git push', { cwd: repoPath, timeout: 30000 });
      log(`PUSH: ${repoName} OK`);
    } catch (e) {
      log(`PUSH: ${repoName} FAILED — ${e.message}`);
    }
  } catch (e) {
    log(`SKIP: ${repoName} — nothing staged`);
  }
}

// ══ Main ══════════════════════════════════════════════════════════
log('=== Sync iniciado ===');

// Phase 1: Sync source repos (as before)
syncRepo(path.join(HOME, '.claude'), 'claude-ecosystem');
syncRepo(path.join(HOME, 'copywriting-ecosystem'), 'copywriting-ecosystem');

// Phase 2: Copy source → distribution packages
syncDistribution();

// Phase 3: Commit + push distribution repos
syncRepo(path.join(PACKAGES, 'copy-chief-black'), 'copy-chief-black');
syncRepo(path.join(PACKAGES, 'copy-chief-dashboard'), 'copy-chief-dashboard');
syncRepo(path.join(PACKAGES, 'copywriting-mcp'), 'copywriting-mcp');

log('=== Sync finalizado (5 repos) ===');

process.exit(0);
