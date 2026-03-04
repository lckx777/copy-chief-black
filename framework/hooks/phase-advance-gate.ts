#!/usr/bin/env bun
// ~/.claude/hooks/phase-advance-gate.ts
// Hook PreToolUse para Write em briefings/phases/
// v8.0 - Thin wrapper (checklist logic in copy-chief/workflow/phase-checklist.ts)

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  detectOfferFromPath,
  detectPhaseFromPath,
  canWriteHelixPhase,
  getOfferState,
  TOOL_DISPLAY_NAMES,
} from '../.aios-core/copy-chief/state/offer-state';
import { isPhaseUnlocked } from '../.aios-core/copy-chief/workflow/helix-phases';
import { validateYAML } from '../.aios-core/copy-chief/utils/yaml-validator';
import { generatePhaseReviewChecklist } from '../.aios-core/copy-chief/workflow/phase-checklist';

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

function allow(): void {
  const output: PreToolUseOutput = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}

function block(reason: string, offerPath: string, phase: number, missingTools?: string[]): void {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;
  const phaseState = state.helix_phases[phaseKey];

  const toolsUsed = phaseState?.tools_used || [];
  const toolsRequired = phaseState?.tools_required || [];

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `BLOQUEADO - FASE HELIX ${phase}

${reason}

**Estado da Oferta:** ${offerPath}
**Fase:** ${phase}
**Ferramentas Obrigatorias:** ${toolsRequired.map(t => TOOL_DISPLAY_NAMES[t] || t).join(', ')}
**Ferramentas Usadas:** ${toolsUsed.length > 0 ? toolsUsed.map(t => TOOL_DISPLAY_NAMES[t] || t).join(', ') : '(nenhuma)'}
**Ferramentas Faltando:** ${(missingTools || []).map(t => TOOL_DISPLAY_NAMES[t] || t).join(', ')}

**ACAO OBRIGATORIA:**
Execute as ferramentas faltantes ANTES de criar o arquivo da fase.

**Por que isso existe (v8.0):**
O sistema usa estado POR OFERTA (persistente entre sessoes).
Isso garante que as ferramentas corretas foram usadas,
mesmo se voce fechou e reabriu o Claude Code.
Alem disso, um checklist de 3 camadas e gerado automaticamente
ao avancar fase (reviews/phase-XX-review.md).

Ver: ~/.claude/reference/tool-usage-matrix.md
Estado: ${offerPath}/helix-state.yaml`,
  };

  console.error(`[PHASE-ADVANCE-GATE] Blocked: Phase ${phase} - missing tools: ${(missingTools || []).join(', ')}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    // Only process Write
    if (input.tool_name !== 'Write') {
      allow();
      return;
    }

    const filePath = input.tool_input?.file_path as string;
    if (!filePath) {
      allow();
      return;
    }

    // Only check HELIX phase files
    if (!filePath.includes('briefings/phases/') && !filePath.includes('briefings\\phases\\')) {
      allow();
      return;
    }

    // Detect offer from path
    const offerPath = detectOfferFromPath(filePath);
    if (!offerPath) {
      console.error(`[PHASE-ADVANCE-GATE] Warning: Could not detect offer from path: ${filePath}`);
      allow();
      return;
    }

    // Detect phase from file name
    const phase = detectPhaseFromPath(filePath);
    if (!phase) {
      console.error(`[PHASE-ADVANCE-GATE] Warning: Could not detect phase from file: ${filePath}`);
      allow();
      return;
    }

    // Validate helix-state.yaml before allowing phase advance
    const helixStatePath = join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');
    if (existsSync(helixStatePath)) {
      const helixContent = readFileSync(helixStatePath, 'utf-8');
      const yamlValidation = await validateYAML(helixContent, 'helix-state');
      if (!yamlValidation.valid) {
        const output: PreToolUseOutput = {
          decision: 'block',
          reason: `BLOQUEADO - helix-state.yaml invalido\n\nErro: ${yamlValidation.error}\n\nCorrija o arquivo antes de avancar a fase.\n${offerPath}/helix-state.yaml`,
        };
        console.error(`[PHASE-ADVANCE-GATE] helix-state.yaml validation failed: ${yamlValidation.error}`);
        console.log(JSON.stringify(output));
        process.exit(0);
        return;
      }
    }

    // Check if this phase can be written (using OFFER state)
    const check = canWriteHelixPhase(offerPath, phase);
    if (!check.allowed) {
      block(check.reason || 'Ferramentas obrigatorias nao usadas', offerPath, phase, check.missingTools);
      return;
    }

    // Additional check: verify phase prerequisites via helix-phases
    const offerFullPath = join(ECOSYSTEM_ROOT, offerPath);
    const prereqCheck = isPhaseUnlocked(phase, offerFullPath);
    if (!prereqCheck.unlocked) {
      console.error(`[PHASE-ADVANCE-GATE] Phase ${phase} prerequisites not met: ${prereqCheck.missingNames.join(', ')}`);
      // Warn but don't block (tool-based gate is primary)
    }

    // All checks passed — delegate checklist generation to module
    generatePhaseReviewChecklist(offerPath, phase);

    console.error(`[PHASE-ADVANCE-GATE] Phase ${phase} can be written - required tools used`);
    allow();

  } catch (error) {
    console.error(`[PHASE-ADVANCE-GATE] Error: ${error}`);
    allow(); // Fail-open on error
  }
}

main().catch(err => {
  console.error(`[PHASE-ADVANCE-GATE] Fatal error: ${err}`);
  process.exit(0); // Fail-open
});
