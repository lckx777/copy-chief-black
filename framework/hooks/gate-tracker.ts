#!/usr/bin/env bun
// ~/.claude/hooks/gate-tracker.ts
// Hook PostToolUse para rastrear validate_gate e black_validation
// v7.0 - Thin wrapper (parsing logic in copy-chief/gates/gate-result-parser.ts)

import { readFileSync } from 'fs';
import {
  recordGatePassed,
  recordGateBlocked,
  recordBlackValidationScore,
  recordMcpToolUse,
  GateType,
  getSessionState,
} from '../.aios-core/copy-chief/state/session-state';
import {
  loadMachine,
  recordGatePassed as smRecordGatePassed,
  recordGateBlocked as smRecordGateBlocked,
  detectOffer,
} from '../.aios-core/copy-chief/state/state-machine';
import {
  parseValidateGateOutput,
  parseBlackValidationOutput,
} from '../.aios-core/copy-chief/gates/gate-result-parser';

interface PostToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
}

// ─── State machine helpers ────────────────────────────────────────────────────

function resolveOfferPath(input: PostToolUseInput): string | null {
  if (input.tool_input?.offer_path) {
    return input.tool_input.offer_path as string;
  }
  try {
    const session = getSessionState();
    if (session.activeOffer) return session.activeOffer;
    if (session.filesRead) {
      for (const file of session.filesRead) {
        const offer = detectOffer(file);
        if (offer) return offer;
      }
    }
  } catch {}
  console.error('[GATE-TRACKER] ⚠️ Sem oferta detectada para state-machine');
  return null;
}

function smRecordGateInMachine(
  gateType: GateType,
  result: 'PASSED' | 'BLOCKED',
  input: PostToolUseInput,
  details?: string,
): void {
  try {
    const offerPath = resolveOfferPath(input);
    if (!offerPath) return;
    const machine = loadMachine(offerPath);
    if (result === 'PASSED') {
      smRecordGatePassed(machine, gateType, details);
    } else {
      smRecordGateBlocked(machine, gateType, details);
    }
  } catch (e) {
    console.error(`[GATE-TRACKER] ⚠️ State machine gate record falhou: ${e}`);
  }
}

function smRecordBlackValidationInMachine(score: number, input: PostToolUseInput): void {
  try {
    const offerPath = resolveOfferPath(input);
    if (!offerPath) return;
    const machine = loadMachine(offerPath);
    machine.gates.production.score = score;
    if (score >= 8) {
      smRecordGatePassed(machine, 'production', `black_validation score ${score}/10`);
    } else {
      smRecordGateBlocked(machine, 'production', `black_validation score ${score}/10 (precisa ≥8)`);
    }
  } catch (e) {
    console.error(`[GATE-TRACKER] ⚠️ State machine black_validation record falhou: ${e}`);
  }
}

// ─── Tool handlers (routing only — parsing delegated to module) ───────────────

function handleValidateGate(input: PostToolUseInput): void {
  const gateType = input.tool_input?.gate_type as string;
  const output = input.tool_output;

  if (!gateType || !output) {
    console.error('[GATE-TRACKER] validate_gate sem tipo ou output');
    return;
  }

  const validGateTypes: GateType[] = ['research', 'briefing', 'production'];
  if (!validGateTypes.includes(gateType as GateType)) {
    console.error(`[GATE-TRACKER] Gate type inválido: ${gateType}`);
    return;
  }

  const parsed = parseValidateGateOutput(output);

  if (parsed.outcome === 'PASSED') {
    recordGatePassed(gateType as GateType, 'validate_gate retornou PASSED');
    smRecordGateInMachine(gateType as GateType, 'PASSED', input);
    console.error(`[GATE-TRACKER] ✅ Gate ${gateType} PASSED - State machine atualizada`);
  } else if (parsed.outcome === 'BLOCKED') {
    const reasons = parsed.reasons || 'sem razões';
    recordGateBlocked(gateType as GateType, `BLOCKED: ${reasons}`);
    smRecordGateInMachine(gateType as GateType, 'BLOCKED', input, reasons);
    console.error(`[GATE-TRACKER] ❌ Gate ${gateType} BLOCKED - ${reasons}`);
  }
  // 'UNKNOWN' outcome: nothing to record
}

function handleBlackValidation(input: PostToolUseInput): void {
  const output = input.tool_output;

  if (!output) {
    console.error('[GATE-TRACKER] black_validation sem output');
    return;
  }

  const parsed = parseBlackValidationOutput(output);

  if (parsed.score !== null) {
    recordBlackValidationScore(parsed.score);
    smRecordBlackValidationInMachine(parsed.score, input);

    if (parsed.passed) {
      console.error(`[GATE-TRACKER] ✅ black_validation score ${parsed.score}/10 - Production gate PASSED`);
    } else {
      console.error(`[GATE-TRACKER] ⚠️ black_validation score ${parsed.score}/10 - Precisa ≥8 para passar`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PostToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Registrar uso do MCP
    if (toolName.startsWith('mcp__')) {
      recordMcpToolUse(toolName);
    }

    if (toolName === 'mcp__copywriting__validate_gate') {
      handleValidateGate(input);
    }

    if (toolName === 'mcp__copywriting__black_validation') {
      handleBlackValidation(input);
    }

    // PostToolUse hooks cannot block
    console.log(JSON.stringify({}));
    process.exit(0);

  } catch (error) {
    console.error(`[GATE-TRACKER] Erro: ${error}`);
    process.exit(0);
  }
}

main();
