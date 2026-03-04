#!/usr/bin/env bun
// ~/.claude/hooks/tool-enforcement-gate.ts
// Hook Stop para verificação final de gates
// v7.0 - Tool Enforcement System (2026-02-02)
//
// SIMPLIFICADO: Usa estado determinístico, NÃO regex
// Verifica se gates passaram antes de permitir saída

import { readFileSync, existsSync } from 'fs';
import {
  getSessionState,
  getGatesStatus,
  getCurrentPhase,
  getActiveOffer,
  hasPassedProductionValidation,
  hasPassedFullValidation,
} from '../.aios-core/copy-chief/state/session-state';

interface StopInput {
  session_id: string;
  transcript_path: string;
  stop_hook_active: boolean;
  cwd: string;
}

interface StopOutput {
  decision?: 'block';
  reason?: string;
}

function main(): void {
  try {
    let stdin = '';
    try {
      stdin = readFileSync(0, 'utf8');
    } catch {
      allow();
      return;
    }

    let input: StopInput;
    try {
      input = JSON.parse(stdin || '{}');
    } catch {
      allow();
      return;
    }

    // Evita loop infinito
    if (input.stop_hook_active) {
      allow();
      return;
    }

    const state = getSessionState();
    const gates = getGatesStatus();
    const phase = getCurrentPhase();

    // Se está em production e tem arquivos escritos em production/, verificar validações
    if (phase === 'production') {
      const hasProductionWrites = (state.filesWritten || []).some(f => /production\//i.test(f));

      if (hasProductionWrites) {
        if (!hasPassedProductionValidation()) {
          blockMissingValidation();
          return;
        }

        if (!hasPassedFullValidation()) {
          console.error('[TOOL-GATE] ⚠️ AVISO: Copy em production/ sem black_validation final');
        }
      }
    }

    allow();

  } catch (error) {
    // FAIL-OPEN: Any uncaught error = allow (never show error to user)
    try {
      const logDir = `${process.env.HOME}/.claude/logs`;
      const { mkdirSync: mkdir, appendFileSync } = require('fs');
      try { mkdir(logDir, { recursive: true }); } catch {}
      appendFileSync(`${logDir}/hook-errors.log`,
        `[${new Date().toISOString()}] tool-enforcement-gate: ${error}\n`);
    } catch {}
    allow();
  }
}

function allow(): void {
  const output: StopOutput = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}

function blockMissingValidation(): void {
  const state = getSessionState();
  const validations = state.validationsPassed;
  const missing: string[] = [];

  if (!validations.blind_critic) {
    missing.push('blind_critic');
  }
  if (!validations.emotional_stress_test) {
    missing.push('emotional_stress_test');
  }

  const output: StopOutput = {
    decision: 'block',
    reason: `🚫 BLOQUEADO - VALIDAÇÃO MCP INCOMPLETA

Copy em production/ detectada sem validação obrigatória.

**Ferramentas faltando:** ${missing.join(', ')}

**AÇÃO OBRIGATÓRIA:**
${missing.includes('blind_critic') ? `
1. Executar blind_critic:
\`\`\`
mcp__copywriting__blind_critic(copy="[sua copy]", copy_type="hook|lead|vsl|lp|creative")
\`\`\`
` : ''}
${missing.includes('emotional_stress_test') ? `
2. Executar emotional_stress_test:
\`\`\`
mcp__copywriting__emotional_stress_test(copy="[sua copy]", copy_type="hook|lead|vsl|lp|creative")
\`\`\`
` : ''}

**Por que isso existe (v7.0):**
- blind_critic: Avaliação cega da copy (sem viés de criação)
- emotional_stress_test: 4 testes de impacto visceral

O sistema v7.0 usa estado determinístico, não regex.
Gates são fonte de verdade para transições de fase.

**Após executar as validações, a sessão pode continuar.**

Ver: ~/.claude/reference/tool-usage-matrix.md`,
  };

  console.error(`[TOOL-GATE] ⚠️ Bloqueado: Validações faltando: ${missing.join(', ')}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

main();
