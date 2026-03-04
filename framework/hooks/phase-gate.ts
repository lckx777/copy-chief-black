#!/usr/bin/env bun
// ~/.claude/hooks/phase-gate.ts
// Hook PreToolUse para enforcement de gates por path
// v7.1 - Dual-Source Gate Resolver (2026-02-03)
//
// Bloqueia Write em briefings/ se research gate não passou
// Bloqueia Write em production/ se briefing gate não passou
//
// BSSF Solution #5: Usa fallback chain (offer-state → session-state → heurística)

import { readFileSync } from 'fs';
import {
  resolveCanWriteToPath,
  syncSessionFromOffer,
} from '../.aios-core/copy-chief/gates/gate-resolver';
import {
  getSessionState,
  getActiveOffer,
  getGatesStatus,
  getCurrentPhase,
} from '../.aios-core/copy-chief/state/session-state';

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Só processar Write e Edit
    if (!['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(toolName)) {
      allow();
      return;
    }

    // Extrair path do arquivo
    const filePath = extractFilePath(input.tool_input);

    if (!filePath) {
      allow();
      return;
    }

    // v7.1: Usar gate-resolver com fallback chain
    // 1. Tenta offer-state (helix-state.yaml persistente)
    // 2. Fallback para session-state (volátil)
    // 3. Fallback para heurística (arquivos existem?)
    const check = resolveCanWriteToPath(filePath);

    // Debug log (removível em produção)
    if (check.debug) {
      console.error(`[PHASE-GATE] Resolução para ${filePath}:`);
      console.error(`  - Oferta: ${check.offerPath || 'não detectada'}`);
      console.error(`  - Fonte: ${check.source}`);
      console.error(`  - offer-state: ${check.debug.offerStateChecked ? (check.debug.offerGatePassed ? 'PASSED' : 'NOT PASSED') : 'não verificado'}`);
      console.error(`  - session-state: ${check.debug.sessionStateChecked ? (check.debug.sessionGatePassed ? 'PASSED' : 'NOT PASSED') : 'não verificado'}`);
      console.error(`  - heurística: ${check.debug.heuristicChecked ? (check.debug.heuristicPassed ? 'PASSED' : 'NOT PASSED') : 'não verificado'}`);
    }

    if (!check.allowed) {
      block(check.reason || 'Gate não passou', check.requiredGate, check.source);
      return;
    }

    // Se passou por heurística ou offer-state, sincronizar session-state
    if (check.offerPath && (check.source === 'offer-state' || check.source === 'heuristic')) {
      syncSessionFromOffer(check.offerPath);
    }

    allow();

  } catch (error) {
    console.error(`[PHASE-GATE] Erro: ${error}`);
    allow(); // Em caso de erro, permitir (fail-open)
  }
}

function extractFilePath(toolInput: Record<string, unknown>): string | null {
  // Diferentes ferramentas usam diferentes campos
  const possibleFields = ['file_path', 'path', 'notebook_path', 'filePath'];

  for (const field of possibleFields) {
    if (typeof toolInput[field] === 'string') {
      return toolInput[field] as string;
    }
  }

  return null;
}

function allow(): void {
  const output: PreToolUseOutput = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}

function block(reason: string, requiredGate?: string, source?: string): void {
  const state = getSessionState();
  const gates = getGatesStatus();
  const phase = getCurrentPhase();
  const offer = getActiveOffer();

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `🚫 BLOQUEADO - GATE NÃO PASSOU

${reason}

**Estado Atual (v7.1 Dual-Source):**
- Oferta: ${offer || 'não definida'}
- Fase: ${phase}
- Gates (session): research=${gates.research}, briefing=${gates.briefing}, production=${gates.production}
- Fonte da verificação: ${source || 'session-state'}

**AÇÃO OBRIGATÓRIA:**
${requiredGate ? getActionForGate(requiredGate, offer) : 'Execute o gate necessário antes de continuar.'}

**Por que isso existe:**
O sistema v7.1 usa fallback chain para resolver gates:
1. offer-state (helix-state.yaml) - PERSISTENTE
2. session-state - VOLÁTIL (2h)
3. heurística (arquivos existem) - ÚLTIMO RECURSO

RESEARCH → validate_gate("research") → BRIEFING
BRIEFING → validate_gate("briefing") → PRODUCTION
PRODUCTION → black_validation(score≥8) → DELIVERED

Ver: ~/.claude/reference/tool-usage-matrix.md`,
  };

  console.error(`[PHASE-GATE] Bloqueado (fonte: ${source || 'session-state'}): ${reason}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

function getActionForGate(gate: string, offer: string | null): string {
  const offerPath = offer || '[caminho-da-oferta]';

  switch (gate) {
    case 'research':
      return `Execute validate_gate para research:
\`\`\`
mcp__copywriting__validate_gate(gate_type="research", offer_path="${offerPath}")
\`\`\`

Isso verifica se todos os deliverables de research existem:
- research/voc/summary.md
- research/competitors/summary.md
- research/mechanism/summary.md
- research/avatar/summary.md
- research/synthesis.md`;

    case 'briefing':
      return `Execute validate_gate para briefing:
\`\`\`
mcp__copywriting__validate_gate(gate_type="briefing", offer_path="${offerPath}")
\`\`\`

Isso verifica se todas as 10 fases HELIX estão completas.`;

    case 'production':
      return `Execute black_validation na copy final:
\`\`\`
mcp__copywriting__black_validation(copy="[sua copy]", copy_type="vsl|lp|creative")
\`\`\`

Score ≥8 é necessário para passar.`;

    default:
      return 'Execute o gate apropriado antes de continuar.';
  }
}

main();
