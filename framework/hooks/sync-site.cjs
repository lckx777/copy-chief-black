#!/usr/bin/env node
// sync-site.cjs - Auto-regenera site do ecossistema
// v1.0 - Chamado pelo SessionEnd hook

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const HOME = os.homedir();
const SITE_DIR = path.join(HOME, 'copywriting-ecosystem', 'site');
const GENERATOR = path.join(SITE_DIR, 'generate.py');
const OUTPUT = path.join(HOME, 'copywriting-ecosystem', 'index.html');
const ECOSYSTEM_DIR = path.join(HOME, 'copywriting-ecosystem');

// Verificar se gerador existe
if (!fs.existsSync(GENERATOR)) {
  process.stderr.write(`[SYNC-SITE] Gerador não encontrado: ${GENERATOR}\n`);
  process.exit(0);
}

// Gerar site
process.stderr.write('[SYNC-SITE] Regenerando site...\n');
try {
  const result = execSync(`python3 "${GENERATOR}"`, { cwd: ECOSYSTEM_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const lines = (result || '').split('\n').filter(Boolean);
  for (const line of lines) {
    process.stderr.write(`[SYNC-SITE] ${line}\n`);
  }
} catch (e) {
  const errLines = ((e.stdout || '') + (e.stderr || '')).split('\n').filter(Boolean);
  for (const line of errLines) {
    process.stderr.write(`[SYNC-SITE] ${line}\n`);
  }
}

// Verificar se houve mudanças
try {
  execSync(`git diff --quiet "${OUTPUT}"`, { cwd: ECOSYSTEM_DIR });
  process.stderr.write('[SYNC-SITE] Site sem alterações\n');
} catch (e) {
  // git diff --quiet exits non-zero when there ARE changes
  process.stderr.write('[SYNC-SITE] Site atualizado - commit automático\n');
  try {
    execSync(`git add "${OUTPUT}"`, { cwd: ECOSYSTEM_DIR });
    const dateStr = new Date().toISOString().slice(0, 10);
    execSync(`git commit -m "site: auto-update ${dateStr}"`, { cwd: ECOSYSTEM_DIR });
  } catch (commitErr) {
    // Ignore commit errors (e.g. nothing staged)
  }
}

process.exit(0);
