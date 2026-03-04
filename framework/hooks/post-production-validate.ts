#!/usr/bin/env bun
// ~/.claude/hooks/post-production-validate.ts
// Hook que valida se MCPs obrigatórios foram usados antes de permitir entrega de copy
// v7.1 - Tool Enforcement System (2026-02-02)
// BSSF: Warnings para consensus e layered_review

import {
  getSessionState,
  hasPassedProductionValidation,
  hasPassedFullValidation,
  getValidationStatus,
  getMissingRequiredTools,
  recordMcpToolUse,
} from '../.aios-core/copy-chief/state/session-state';
import { getHandoffStatus, completeTaskWithEvent, getNextTask } from '../.aios-core/copy-chief/handoff/handoff-engine';
import { shouldSurface, type SurfaceResult } from '../.aios-core/copy-chief/surface/surface-checker';

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
}

interface PostToolUseOutput {
  // PostToolUse hooks cannot block, but can emit warnings
}

function main(): void {
  try {
    const stdin = require('fs').readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Record MCP tool usage
    if (toolName.startsWith('mcp__')) {
      recordMcpToolUse(toolName);
      console.error(`[TOOL-ENFORCE] MCP registrado: ${toolName}`);
    }

    // Check for specific validation tools and provide feedback
    if (toolName === 'mcp__copywriting__blind_critic') {
      console.error(`[TOOL-ENFORCE] ✅ blind_critic executado`);
    }

    if (toolName === 'mcp__copywriting__emotional_stress_test') {
      console.error(`[TOOL-ENFORCE] ✅ emotional_stress_test executado`);
    }

    if (toolName === 'mcp__copywriting__layered_review') {
      console.error(`[TOOL-ENFORCE] ✅ layered_review executado`);
    }

    if (toolName === 'mcp__copywriting__black_validation') {
      console.error(`[TOOL-ENFORCE] ✅ black_validation executado`);
    }

    if (toolName === 'mcp__copywriting__validate_gate') {
      console.error(`[TOOL-ENFORCE] ✅ validate_gate executado`);
    }

    if (toolName === 'mcp__zen__consensus') {
      console.error(`[TOOL-ENFORCE] ✅ consensus executado`);
    }

    // Check production validation status after Write to production directories
    if (['Write', 'Edit'].includes(toolName)) {
      const filePath =
        (input.tool_input?.file_path as string) ||
        (input.tool_input?.path as string) || '';

      const content = (input.tool_input?.content as string) || '';
      const state = getSessionState();
      const validations = getValidationStatus();

      const isProductionPath = /production\//i.test(filePath);
      const isBriefingPhase5 = /briefings?\/.*fase.?0?5/i.test(filePath);

      // v7.1 BSSF: Warning para consensus na fase 5 (MUP)
      if (isBriefingPhase5) {
        if (!validations.consensus) {
          console.error('');
          console.error('⚠️  [BSSF] RECOMENDAÇÃO: consensus para validar MUP');
          console.error('');
          console.error('Você está definindo MUP/MUS na fase 5.');
          console.error('Validar com múltiplos modelos aumenta confiança na escolha.');
          console.error('');
          console.error('AÇÃO SUGERIDA:');
          console.error('  mcp__zen__consensus(prompt="Valide estes MUPs: [lista]")');
          console.error('');
        }
      }

      // v7.1 BSSF: Warning para layered_review em copy longa
      if (isProductionPath && content) {
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount > 500 && !validations.layered_review) {
          console.error('');
          console.error('⚠️  [BSSF] RECOMENDAÇÃO: layered_review para copy longa');
          console.error('');
          console.error(`Copy detectada com ~${wordCount} palavras.`);
          console.error('Copy longa se beneficia de revisão em 3 camadas.');
          console.error('');
          console.error('AÇÃO SUGERIDA:');
          console.error('  mcp__copywriting__layered_review(copy="...", copy_type="vsl|lp")');
          console.error('');
        }

        // Warn if production file written without validations
        if (!validations.blind_critic) {
          console.error(`[TOOL-ENFORCE] ⚠️ AVISO: Copy escrita sem blind_critic`);
          console.error(`[TOOL-ENFORCE] Executar: blind_critic(copy="...", copy_type="...")`);
        }

        if (!validations.emotional_stress_test) {
          console.error(`[TOOL-ENFORCE] ⚠️ AVISO: Copy escrita sem emotional_stress_test`);
          console.error(`[TOOL-ENFORCE] Executar: emotional_stress_test(copy="...")`);
        }
      }

      // Log missing required tools
      if (isProductionPath) {
        const missing = getMissingRequiredTools();
        if (missing.length > 0) {
          console.error(`[TOOL-ENFORCE] ⚠️ Ferramentas faltando para fase ${state.currentPhase}:`);
          missing.forEach(tool => console.error(`   - ${tool}`));
        }
      }
    }

    // --- Surface Checker: Evaluate if human decision is needed ---
    try {
      const offer = detectOffer();
      if (offer !== 'unknown') {
        const toolName = input.tool_name;
        const toolOutput = input.tool_output || {};
        const score = typeof toolOutput === 'object' ? (toolOutput as any).score ?? (toolOutput as any).average_score : undefined;
        const surfaceCtx = {
          phase: getSessionState().currentPhase || 'PRODUCTION',
          offer_name: offer,
          offer_id: offer.replace(/\//g, '-'),
          deliverable_type: toolName.includes('blind_critic') ? 'copy_block' :
                            toolName.includes('black_validation') ? 'final_delivery' :
                            toolName.includes('emotional_stress_test') ? 'stress_test' : undefined,
          score: typeof score === 'number' ? score : undefined,
          black_validation_passed: toolName.includes('black_validation') && typeof score === 'number' && score >= 8,
        };
        const result: SurfaceResult = shouldSurface(surfaceCtx);
        if (result.should_surface) {
          console.error(`[SURFACE] 🔔 Human decision needed: ${result.message}`);
          if (result.queued_decision_id) {
            console.error(`[SURFACE] Decision queued: ${result.queued_decision_id}`);
          }
        }
      }
    } catch { /* surface checker is non-blocking */ }

    // --- Handoff: Auto-advance subtask pipeline ---
    try {
      const offer = detectOffer();
      if (offer !== 'unknown') {
        const offerFullPath = require('path').join(process.cwd().replace(/\/copywriting-ecosystem\/.*/, '/copywriting-ecosystem'), offer);
        const handoffDir = require('path').join(offerFullPath, 'handoff-state');
        if (require('fs').existsSync(handoffDir)) {
          const files = require('fs').readdirSync(handoffDir).filter((f: string) => f.endsWith('.yaml'));
          for (const file of files) {
            const deliverable = file.replace(/\.yaml$/, '');
            const handoffStatus = getHandoffStatus(offerFullPath, deliverable);
            if (handoffStatus && handoffStatus.status === 'IN_PROGRESS') {
              const nextTask = getNextTask(offerFullPath, deliverable);
              if (nextTask && nextTask.next_task) {
                console.error(`[HANDOFF] Next subtask: ${nextTask.next_task.type} (${nextTask.next_task.id})`);
              }
            }
          }
        }
      }
    } catch { /* handoff is non-blocking */ }

    // PostToolUse não pode bloquear, apenas emitir warnings
    const output: PostToolUseOutput = {};
    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    console.error(`[TOOL-ENFORCE] Erro: ${error}`);
    process.exit(0);
  }
}

function detectOffer(): string {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : 'unknown';
}

main();
