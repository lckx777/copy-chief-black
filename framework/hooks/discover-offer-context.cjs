#!/usr/bin/env node
// discover-offer-context.cjs — Cross-platform rewrite of discover-offer-context.sh (v6.1)
// Dynamic context discovery for offers — pattern-based auto-discovery + session recovery
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const HOME = os.homedir();
const CWD = process.argv[2] || process.cwd();
const ECOSYSTEM_ROOT = process.env.ECOSYSTEM_ROOT || path.join(HOME, 'copywriting-ecosystem');
const RECOVERY_DIR = path.join(HOME, '.claude', 'session-state', 'recovery');
const RECOVERY_LATEST = path.join(RECOVERY_DIR, 'latest');

function display(msg) { process.stderr.write(msg + '\n'); }

function countLines(filePath) {
  try { return fs.readFileSync(filePath, 'utf8').split('\n').length; }
  catch { return 0; }
}

function findFiles(baseDir, pattern, maxDepth = 2) {
  const results = [];
  if (!fs.existsSync(baseDir)) return results;
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && depth < maxDepth) {
        walk(full, depth + 1);
      } else if (entry.isFile()) {
        if (typeof pattern === 'function' ? pattern(entry.name) : new RegExp(pattern, 'i').test(entry.name)) {
          results.push(full);
        }
      }
    }
  }
  walk(baseDir, 0);
  return results;
}

function countFilesByPattern(baseDir, pattern, maxDepth = 3) {
  return findFiles(baseDir, pattern, maxDepth).length;
}

// === RECOVERY CHECK ===
function checkRecovery() {
  const metaPath = path.join(RECOVERY_LATEST, 'recovery-metadata.json');
  if (!fs.existsSync(metaPath)) return false;

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const recoveryTs = new Date(meta.timestamp || 0).getTime();
    const now = Date.now();
    const hoursAgo = Math.floor((now - recoveryTs) / 3600000);

    if (hoursAgo >= 24) return false;

    display('');
    display('╔════════════════════════════════════════════════════════════════╗');
    display('║  RECOVERY DISPONIVEL - Sessao anterior interrompida          ║');
    display('╠════════════════════════════════════════════════════════════════╣');
    display(`║  Trigger: ${(meta.trigger || 'desconhecido').padEnd(48)}║`);
    display(`║  Source: ${(meta.sourceDir || 'desconhecido').slice(-48).padEnd(49)}║`);
    display(`║  Summary: ${(meta.summary || 'Sem resumo').slice(0, 47).padEnd(48)}║`);
    display('║                                                                ║');
    display('║  Arquivos salvos:                                              ║');

    if (fs.existsSync(RECOVERY_LATEST)) {
      const files = fs.readdirSync(RECOVERY_LATEST).filter(f => f.endsWith('.md') || f.endsWith('.json'));
      for (const f of files) display(`║    - ${f.padEnd(57)}║`);
    }

    display('║                                                                ║');
    display(`║  PARA RESTAURAR: Read ${RECOVERY_LATEST}/task_plan.md         ║`);
    display('╚════════════════════════════════════════════════════════════════╝');
    display('');
    return true;
  } catch { return false; }
}

// === OFFER-SPECIFIC MODE ===
function discoverOfferMode(nicho, oferta) {
  const offerPath = path.join(ECOSYSTEM_ROOT, nicho, oferta);
  if (!fs.existsSync(offerPath)) return;

  display('## Modo: Oferta Especifica');
  display(`- Nicho: ${nicho}`);
  display(`- Oferta: ${oferta}`);
  display('');

  // TIER 0: Task Plan
  display('## TASK PLAN (AUTORITATIVO)');
  const taskPlan = path.join(offerPath, 'task_plan.md');
  if (fs.existsSync(taskPlan)) {
    const content = fs.readFileSync(taskPlan, 'utf8');
    const phaseMatch = content.match(/## Current Phase[\s\S]*?(?=\n## |\n$)/);
    if (phaseMatch) { display(phaseMatch[0].split('\n').slice(0, 6).join('\n')); display(''); }
    const foco = content.match(/\*\*Foco:\*\*.*/);
    if (foco) { display(foco[0]); display(''); }
    display('**ACAO:** Seguir instrucoes acima ANTES de executar qualquer tarefa.');
  } else {
    display('- [ ] task_plan.md nao encontrado');
  }
  display('');

  // TIER 1: Canonical Context
  display('## TIER 1: Contexto Canonico');
  let canonicalFound = false;
  for (const pat of [/^CONTEXT\.md$/i, /CONTEXT.*\.md$/i]) {
    const files = findFiles(offerPath, f => pat.test(f), 1);
    if (files.length) {
      for (const f of files) {
        const rel = path.relative(offerPath, f);
        display(`- [x] ${rel} (${countLines(f)} linhas)`);
      }
      canonicalFound = true;
      break;
    }
  }
  for (const pat of [/^project_state\.yaml$/i, /\.state\.yaml$/i]) {
    const files = findFiles(offerPath, f => pat.test(f), 1);
    if (files.length) {
      for (const f of files) display(`- [x] ${path.relative(offerPath, f)}`);
      canonicalFound = true;
      break;
    }
  }
  if (!canonicalFound) display('- [ ] Nenhum arquivo canonico encontrado');
  display('');

  // TIER 2: Synthesis
  display('## TIER 2: Sintese');
  const synthesis = path.join(offerPath, 'research', 'synthesis.md');
  if (fs.existsSync(synthesis)) {
    display(`- [x] research/synthesis.md (${countLines(synthesis)} linhas)`);
  } else {
    display('- [ ] research/synthesis.md (nao encontrado)');
  }
  display('');

  // TIER 3: Summaries
  display('## TIER 3: Summaries & Sinteses');
  const researchDir = path.join(offerPath, 'research');
  const summaries = findFiles(researchDir, f => /summary\.md$|synthesis\.md$/i.test(f), 3);
  if (summaries.length) {
    for (const f of summaries) {
      display(`- [x] ${path.relative(offerPath, f)} (${countLines(f)} linhas)`);
    }
  } else {
    display('- [ ] Nenhum summary encontrado');
  }
  display('');

  // TIER 4: Briefings HELIX
  display('## TIER 4: Briefings HELIX');
  const phasesDir = path.join(offerPath, 'briefings', 'phases');
  if (fs.existsSync(phasesDir)) {
    const phases = findFiles(phasesDir, f => f.endsWith('.md') && f !== 'CLAUDE.md', 0).sort();
    for (const f of phases) display(`- [x] briefings/phases/${path.basename(f, '.md')}.md`);
    if (!phases.length) display('- [ ] Nenhum briefing encontrado');
  } else {
    display('- [ ] Nenhum briefing encontrado');
  }
  display('');

  // TIER 5: Knowledge Files
  display('## TIER 5: Knowledge Files');
  const knowledgePatterns = f => /mapeamento|funcionalidades|features|auditoria|-complete\.md$/i.test(f);
  const knowledge = findFiles(offerPath, knowledgePatterns, 3);
  if (knowledge.length) {
    for (const f of knowledge) {
      const rel = path.relative(offerPath, f);
      const tag = /auditoria/i.test(f) ? 'AUDIT' : /complete/i.test(f) ? 'CONSOLIDATED' : 'FEATURES MAP';
      display(`- [x] ${rel} (${countLines(f)} linhas) [${tag}]`);
    }
  } else {
    display('- [ ] Nenhum knowledge file encontrado');
  }
  display('');

  // TIER 6: Production
  display('## TIER 6: Production');
  const prodDir = path.join(offerPath, 'production');
  if (fs.existsSync(prodDir)) {
    const countProd = (sub) => findFiles(path.join(prodDir), f => f.endsWith('.md') && f !== 'CLAUDE.md', 3)
      .filter(p => p.includes(sub)).length;
    const vsl = countProd('vsl');
    const lp = countProd('landing');
    const creative = countProd('creative');
    const email = countProd('email');
    const total = findFiles(prodDir, f => f.endsWith('.md') && f !== 'CLAUDE.md', 3).length;
    display(`- VSL: ${vsl} arquivos`);
    display(`- Landing Page: ${lp} arquivos`);
    display(`- Criativos: ${creative} arquivos`);
    display(`- Emails: ${email} arquivos`);
    display(`- **Total Production: ${total} arquivos**`);
  } else {
    display('- [ ] Diretorio production/ nao encontrado');
  }
  display('');

  display('## Recomendacao de Loading');
  display('0. **TIER 0: TASK PLAN - Ler Current Phase + Foco ANTES de qualquer acao**');
  display('1. TIER 1: Ler CONTEXT.md (fonte da verdade)');
  display('2. TIER 2: Ler synthesis.md (visao geral)');
  display('3. TIER 5: Ler knowledge files relevantes');
  display('4. TIER 3-4: Summaries e Briefings conforme necessario');
}

// === ECOSYSTEM MODE ===
function discoverEcosystemMode() {
  display('## Modo: Ecossistema (auto-discovery)');
  display('');

  let offerCount = 0, standbyCount = 0;
  const skipDirs = new Set(['.claude', '.git', 'node_modules', 'scripts', 'site', 'swipes', 'export', 'templates', 'tool-results', '.synapse', '.venv', '.vscode', '.vercel', '.zen-mcp-server', '.playwright-mcp', '.serena', 'docs', 'knowledge', 'metodologias-de-copy', 'pesquisas-setup', 'research', 'squad-prompts', 'packages']);

  let nichos;
  try { nichos = fs.readdirSync(ECOSYSTEM_ROOT, { withFileTypes: true }); }
  catch { nichos = []; }

  for (const nichoEntry of nichos) {
    if (!nichoEntry.isDirectory() || nichoEntry.name.startsWith('.') || skipDirs.has(nichoEntry.name)) continue;
    const nichoDir = path.join(ECOSYSTEM_ROOT, nichoEntry.name);
    let offers;
    try { offers = fs.readdirSync(nichoDir, { withFileTypes: true }); }
    catch { continue; }

    for (const offerEntry of offers) {
      if (!offerEntry.isDirectory() || offerEntry.name.startsWith('.')) continue;
      const offerPath = path.join(nichoDir, offerEntry.name);

      // Must have at least one offer marker
      const hasContext = fs.existsSync(path.join(offerPath, 'CONTEXT.md'));
      const hasHelix = fs.existsSync(path.join(offerPath, 'helix-state.yaml'));
      const hasClaude = fs.existsSync(path.join(offerPath, 'CLAUDE.md'));
      if (!hasContext && !hasHelix && !hasClaude) continue;

      // Check status
      let status = 'active';
      const statePath = path.join(offerPath, 'project_state.yaml');
      if (fs.existsSync(statePath)) {
        const stateContent = fs.readFileSync(statePath, 'utf8');
        if (/standby/i.test(stateContent)) { status = 'standby'; standbyCount++; }
        if (/archived/i.test(stateContent)) continue;
      }

      // Must have real content
      const hasResearch = fs.existsSync(path.join(offerPath, 'research'));
      const hasBriefings = fs.existsSync(path.join(offerPath, 'briefings'));
      const hasProduction = fs.existsSync(path.join(offerPath, 'production'));
      if (!hasResearch && !hasBriefings && !hasProduction) continue;

      offerCount++;
      const hasSynthesis = fs.existsSync(path.join(offerPath, 'research', 'synthesis.md'));
      const briefingCount = fs.existsSync(path.join(offerPath, 'briefings', 'phases'))
        ? findFiles(path.join(offerPath, 'briefings', 'phases'), f => f.endsWith('.md') && f !== 'CLAUDE.md', 0).length : 0;
      const prodCount = hasProduction
        ? findFiles(path.join(offerPath, 'production'), f => f.endsWith('.md') && f !== 'CLAUDE.md', 3).length : 0;

      let phase = '?';
      if (hasSynthesis) phase = 'Research DONE';
      if (briefingCount > 0) phase = `Briefing (${briefingCount} fases)`;
      if (prodCount > 0) phase = `Production (${prodCount} files)`;

      if (status === 'standby') {
        display(`### ${nichoEntry.name}/${offerEntry.name} [STANDBY]`);
        display(`- Fase: ${phase} (pausada)`);
      } else {
        display(`### ${nichoEntry.name}/${offerEntry.name}`);
        display(`- ${hasContext ? '[x]' : '[ ]'} Context | ${hasSynthesis ? '[x]' : '[ ]'} Synthesis | ${briefingCount > 0 ? '[x]' : '[ ]'} Briefing | ${prodCount > 0 ? '[x]' : '[ ]'} Production`);
        display(`- Briefings: ${briefingCount} | Production: ${prodCount}`);
        display(`- Fase: ${phase}`);
      }
      display('');
    }
  }

  if (offerCount === 0) display('Nenhuma oferta encontrada no ecossistema.\n');
  const activeCount = offerCount - standbyCount;
  display(`## Ofertas: ${activeCount} ativas, ${standbyCount} standby (total: ${offerCount})\n`);

  // Rules
  display('## Rules por Oferta');
  const rulesDir = path.join(ECOSYSTEM_ROOT, '.claude', 'rules', 'offers');
  if (fs.existsSync(rulesDir)) {
    const rules = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md') && f !== 'CLAUDE.md');
    for (const r of rules) display(`- ${path.basename(r, '.md')}`);
  }
  display('');

  display('## Recomendacao');
  display("Para trabalhar em uma oferta, diga: 'trabalhar na [nome-da-oferta]'");
}

// === MAIN ===
try {
  checkRecovery();

  display('# Contexto da Oferta - Descoberta Dinamica');
  display('');
  display(`Diretorio: ${CWD}`);
  display(`Data: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  display('');

  // Detect mode: inside offer or ecosystem root
  const relToEco = path.relative(ECOSYSTEM_ROOT, CWD);
  const parts = relToEco.split(path.sep).filter(Boolean);

  if (parts.length >= 2 && !parts[0].startsWith('.') && !relToEco.startsWith('..')) {
    discoverOfferMode(parts[0], parts[1]);
  } else {
    discoverEcosystemMode();
  }

  // JSON response to stdout
  process.stdout.write('{}');
} catch (e) {
  process.stderr.write(`[discover-offer-context] Error: ${e.message}\n`);
  process.stdout.write('{}');
}
