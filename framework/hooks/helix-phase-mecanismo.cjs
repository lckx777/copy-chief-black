#!/usr/bin/env node
// helix-phase-mecanismo.cjs — Cross-platform rewrite of helix-phase-mecanismo.sh
// Detects Phase 5/6 HELIX work, ensures mecanismo-unico.yaml exists
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const filePath = (input.tool_input || {}).file_path || '';

  if (!filePath || !filePath.includes('briefings')) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  const isPhase5 = /fase.?0?5|fase5|_mup|problema.*vilao/i.test(filePath);
  const isPhase6 = /fase.?0?6|fase6|_mus|solucao/i.test(filePath);

  if (!isPhase5 && !isPhase6) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  // Find offer root
  let offerRoot = null;
  let dir = path.dirname(filePath);
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'CONTEXT.md')) || fs.existsSync(path.join(dir, 'mecanismo-unico.yaml'))) {
      offerRoot = dir;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  if (!offerRoot) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  const mecFile = path.join(offerRoot, 'mecanismo-unico.yaml');
  const offerName = path.basename(offerRoot);
  const nicho = path.basename(path.dirname(offerRoot));

  // Create mecanismo-unico.yaml if missing
  if (!fs.existsSync(mecFile)) {
    const date = new Date().toISOString().slice(0, 10);
    const template = `# Mecanismo Unico: ${offerName}
# Version: 2.0.0
# Status: DRAFT (auto-created)

unique_mechanism:
  mup:
    new_cause: ""
    sexy_cause:
      name: ""
      candidates: []
    core_problem: ""
    root_cause: ""
  mus:
    new_opportunity: ""
    hero_ingredient:
      name: ""
      nicho: "${nicho}"
    gimmick_name:
      name: ""
      candidates: []
    origin_story:
      description: ""
    authority_hook:
      name: ""
      type: ""
  indutor:
    system_name:
      name: ""
    components: []
    activation: ""
  validation:
    rmbc_scores: { digestible: 0, unique: 0, believable: 0, connected: 0 }
    rmbc_average: 0
    rmbc_passed: false
    mcp_validation: { all_passed: false }
    human_approved: false
    state: "DRAFT"
  metadata:
    offer_name: "${offerName}"
    nicho: "${nicho}"
    created_at: "${date}"
    updated_at: "${date}"
    version: "2.0.0"
`;
    fs.writeFileSync(mecFile, template);
    process.stderr.write(`[helix-phase-mecanismo] Created mecanismo-unico.yaml for ${offerName}\n`);
  }

  let phaseMsg = '';
  let mcpReminder = '';

  if (isPhase5) {
    phaseMsg = 'Fase 5 (MUP) detectada';
    mcpReminder = 'APOS preencher MUP: ATUALIZE mecanismo-unico.yaml e execute consensus + blind_critic';
  }
  if (isPhase6) {
    phaseMsg = 'Fase 6 (MUS) detectada';
    mcpReminder = 'APOS preencher MUS: ATUALIZE mecanismo-unico.yaml e execute blind_critic + emotional_stress_test';
  }

  process.stdout.write(JSON.stringify({
    decision: 'allow',
    message: `MECANISMO UNICO - ${phaseMsg}\nArquivo canonico: ${mecFile}\n${mcpReminder}`,
  }));
} catch (e) {
  process.stderr.write(`[helix-phase-mecanismo] Error: ${e.message}\n`);
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
}
