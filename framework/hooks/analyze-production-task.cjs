#!/usr/bin/env node
// analyze-production-task.cjs - Analisa task de produção
// Hook: UserPromptSubmit
// Exit 0 = permite (pode imprimir reminder)

'use strict';
const fs = require('fs');
const path = require('path');

let input = '{}';
try {
  input = fs.readFileSync(0, 'utf8');
} catch (e) {
  input = '{}';
}

let parsed = {};
try {
  parsed = JSON.parse(input);
} catch (e) {
  parsed = {};
}

// Extrair o prompt do JSON
let prompt = parsed.prompt || '';

// Se não conseguiu extrair, tentar direto
if (!prompt) {
  prompt = input;
}

const cwd = process.cwd();

// Detectar se é task de produção
const isProduction = /criativo|copy|VSL|LP|landing|email sequence|produzir|produção/i.test(prompt);

if (isProduction) {
  const hasResearch = fs.existsSync(path.join(cwd, 'research'));
  const hasBriefings = fs.existsSync(path.join(cwd, 'briefings'));

  if (hasResearch || hasBriefings) {
    // Contar research disponível
    let researchCount = 0;
    try {
      const findFiles = (dir, name) => {
        const results = [];
        if (!fs.existsSync(dir)) return results;
        const walk = (d) => {
          for (const f of fs.readdirSync(d)) {
            const full = path.join(d, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) walk(full);
            else if (f === name) results.push(full);
          }
        };
        walk(dir);
        return results;
      };
      researchCount = findFiles(path.join(cwd, 'research'), 'summary.md').length;
    } catch (e) {
      researchCount = 0;
    }

    let briefingCount = 0;
    try {
      const phasesDir = path.join(cwd, 'briefings', 'phases');
      if (fs.existsSync(phasesDir)) {
        briefingCount = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md')).length;
      }
    } catch (e) {
      briefingCount = 0;
    }

    if (researchCount === 0 && briefingCount === 0) {
      process.stdout.write('REMINDER: Produção detectada em oferta sem research.\n');
      process.stdout.write('Considere rodar audience-research-agent ou helix-system-agent primeiro.\n');
    } else if (researchCount < 2) {
      process.stdout.write(`REMINDER: Research incompleto (${researchCount} summaries).\n`);
      process.stdout.write('Lembre de carregar o contexto da oferta antes de produzir.\n');
    }
  }
}

// Sempre permite (exit 0), apenas mostra reminders
process.exit(0);
