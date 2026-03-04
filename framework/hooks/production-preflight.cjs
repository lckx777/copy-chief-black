#!/usr/bin/env node
// production-preflight.cjs — Cross-platform rewrite of production-preflight.sh
// Blocks production if research/briefings don't exist
'use strict';

const fs = require('fs');
const path = require('path');

const CWD = process.argv[2] || process.cwd();

function findFiles(dir, namePattern, maxDepth = 3) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function walk(d, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory() && depth < maxDepth) walk(full, depth + 1);
      else if (e.isFile() && namePattern.test(e.name)) results.push(full);
    }
  }
  walk(dir, 0);
  return results;
}

try {
  const hasResearch = fs.existsSync(path.join(CWD, 'research'));
  const hasBriefings = fs.existsSync(path.join(CWD, 'briefings'));

  if (!hasResearch && !hasBriefings) process.exit(0);

  const summaries = findFiles(path.join(CWD, 'research'), /^summary\.md$/i);
  const briefings = findFiles(path.join(CWD, 'briefings', 'phases'), /\.md$/i).filter(f => !f.endsWith('CLAUDE.md'));

  if (summaries.length === 0 && briefings.length === 0) {
    process.stdout.write(`BLOCKED: Oferta detectada mas sem research ou briefings.\nDiretorio: ${CWD}\n`);
    process.exit(2);
  }

  if (summaries.length < 2) {
    process.stdout.write(`WARNING: Research incompleto (${summaries.length} summaries encontrados)\n`);
  }

  process.stdout.write(`Research disponivel (${summaries.length} summaries):\n`);
  for (const f of summaries) {
    const cat = path.basename(path.dirname(f));
    process.stdout.write(`  - ${cat}/summary.md\n`);
  }

  if (briefings.length > 0) {
    process.stdout.write(`\nBriefings disponiveis (${briefings.length} fases):\n`);
    for (const f of briefings) process.stdout.write(`  - ${path.basename(f, '.md')}\n`);
  }
} catch (e) {
  process.stderr.write(`[production-preflight] Error: ${e.message}\n`);
}
