#!/usr/bin/env bun
// ~/.claude/hooks/validate-gate-prereq.ts
// Hook PreToolUse para mcp__copywriting__validate_gate
// v7.6 - Thin wrapper (business logic in copy-chief/gates/gate-prereq.ts)

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  getToolsUsedInPhase,
  getActiveOffer,
  getCurrentPhase,
  GateType,
} from '../.aios-core/copy-chief/state/session-state';
import {
  getToolsFromPersistentState,
  evaluateGatePrereq,
  formatBlockReason,
  RECOMMENDED_TOOLS_BY_GATE,
} from '../.aios-core/copy-chief/gates/gate-prereq';
import { evaluateResearchGate, evaluateProductionGate } from '../.aios-core/copy-chief/gates/weighted-gates';
import { QualityGateManager, type GatePhase, type GateResult } from '../.aios-core/copy-chief/gates/quality-gate-manager';

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

// ─── QGM Helper Functions (local — read offer files) ─────────────────────────

function collectQualityScores(offerPath: string): Record<string, number> {
  const scores: Record<string, number> = {};
  try {
    const ecosystemRoot = join(process.env.HOME!, 'copywriting-ecosystem');
    const helixStatePath = join(ecosystemRoot, offerPath, 'helix-state.yaml');
    if (!existsSync(helixStatePath)) return scores;
    const content = readFileSync(helixStatePath, 'utf-8');
    const scorePatterns: Record<string, RegExp> = {
      blind_critic: /blind_critic[:\s]+(\d+(?:\.\d+)?)/,
      emotional_stress_test: /emotional_stress_test[:\s]+(\d+(?:\.\d+)?)/,
      black_validation: /black_validation[:\s]+(\d+(?:\.\d+)?)/,
      logo_test: /logo_test[:\s]+(\d+(?:\.\d+)?)/,
      specificity: /specificity[:\s]+(\d+(?:\.\d+)?)/,
    };
    for (const [key, pattern] of Object.entries(scorePatterns)) {
      const match = content.match(pattern);
      if (match) scores[key] = parseFloat(match[1]);
    }
  } catch { /* scores are optional */ }
  return scores;
}

function getMecanismoState(offerPath: string): string | undefined {
  try {
    const ecosystemRoot = join(process.env.HOME!, 'copywriting-ecosystem');
    const mecPath = join(ecosystemRoot, offerPath, 'mecanismo-unico.yaml');
    if (!existsSync(mecPath)) return undefined;
    const content = readFileSync(mecPath, 'utf-8');
    const stateMatch = content.match(/state:\s*(\w+)/);
    return stateMatch ? stateMatch[1] : undefined;
  } catch { return undefined; }
}

// ─── Routing helpers ──────────────────────────────────────────────────────────

function allow(): void {
  const output: PreToolUseOutput = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}

function block(gateType: GateType, toolsUsed: string[], missingGroups: string[][]): void {
  const offer = getActiveOffer();
  const phase = getCurrentPhase();
  const output: PreToolUseOutput = {
    decision: 'block',
    reason: formatBlockReason(gateType, toolsUsed, missingGroups, offer, phase),
  };
  console.error(`[VALIDATE-GATE-PREREQ] ❌ Bloqueado: ${missingGroups.length} grupo(s) de ferramentas faltando`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    // Só processar validate_gate
    if (input.tool_name !== 'mcp__copywriting__validate_gate') {
      allow();
      return;
    }

    const gateType = input.tool_input?.gate_type as GateType;
    if (!gateType) { allow(); return; }

    const validGateTypes: GateType[] = ['research', 'briefing', 'production'];
    if (!validGateTypes.includes(gateType)) { allow(); return; }

    // Merge session + persistent helix-state.yaml tools
    const sessionTools = getToolsUsedInPhase(gateType);
    const persistentTools = getToolsFromPersistentState(getActiveOffer(), gateType);
    const toolsUsed = [...new Set([...sessionTools, ...persistentTools])];

    // Evaluate prereqs (logic delegated to gate-prereq module)
    const prereq = evaluateGatePrereq(gateType, toolsUsed);

    if (!prereq.passed) {
      block(gateType, toolsUsed, prereq.missingGroups);
      return;
    }

    // Warning for missing recommended tools
    if (prereq.missingRecommended.length > 0) {
      console.error(`[VALIDATE-GATE-PREREQ] ⚠️ Ferramentas recomendadas não usadas: ${prereq.missingRecommended.join(', ')}`);
    }

    console.error(`[VALIDATE-GATE-PREREQ] ✅ Todas ferramentas obrigatórias usadas para ${gateType}`);

    // QGM 3-Layer Pipeline (non-blocking)
    try {
      const offerPath = getActiveOffer();
      if (offerPath) {
        const qgm = new QualityGateManager(gateType as GatePhase, offerPath);
        const result: GateResult = qgm.orchestrate({
          toolsUsed,
          scores: collectQualityScores(offerPath),
          mecanismoState: getMecanismoState(offerPath),
        });
        console.error(`[QGM] ${gateType}: ${result.status} (${result.duration}ms)`);
        for (const layer of result.layers) {
          const icon = layer.pass ? '✅' : '❌';
          console.error(`[QGM]   ${icon} ${layer.layer}: ${layer.status}`);
          for (const check of layer.results.filter(r => !r.pass && !r.skipped)) {
            console.error(`[QGM]     ⚠ ${check.message}`);
          }
        }
        if (!result.pass && result.status === 'failed') {
          console.error(`[QGM] ⚠️ Quality gate ${result.stoppedAt} failed. Non-blocking warning.`);
        }
        qgm.saveStatus();
      }
    } catch (err) {
      console.error(`[QGM] Warning: ${err}`);
    }

    // Weighted Gate scoring (non-blocking)
    try {
      const offerPath = getActiveOffer();
      if (offerPath) {
        const gateScore = gateType === 'research'
          ? evaluateResearchGate(offerPath)
          : gateType === 'production'
            ? evaluateProductionGate(offerPath)
            : undefined;
        if (gateScore) {
          console.error(`[WEIGHTED-GATE] ${gateScore.gate}: ${gateScore.total_weighted}/100 (${gateScore.verdict})`);
          if (gateScore.verdict === 'NEEDS_REVIEW') {
            console.error(`[WEIGHTED-GATE] ⚠️ Score below 85. Review recommended.`);
          }
        }
      }
    } catch { /* weighted gates are non-blocking */ }

    allow();

  } catch (error) {
    console.error(`[VALIDATE-GATE-PREREQ] Erro: ${error}`);
    allow(); // Fail-open
  }
}

main();
