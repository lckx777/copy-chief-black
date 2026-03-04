#!/usr/bin/env bun
// ~/.claude/hooks/ids-register.ts
// IDS Auto-Registration — PostToolUse hook that wires IDS into the production workflow
// Part of P3: IDS Wiring (AIOS Gap Closure)
// Created: 2026-02-24

import { readFileSync } from 'fs';
import { registerDecision, type DecisionType } from '../.aios-core/copy-chief/copy/ids';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
}

function detectOffer(): string {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : 'unknown';
}

function getFilePath(input: Record<string, unknown>): string | null {
  return (input.file_path as string) || (input.path as string) || null;
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);

    // Skip errors
    if (input.is_error) {
      process.exit(0);
    }

    const tool = input.tool_name;
    const filePath = getFilePath(input.tool_input);

    // --- Case 1: Write/Edit to production/ ---
    if ((tool === 'Write' || tool === 'Edit') && filePath && filePath.includes('/production/')) {
      const offer = detectOffer();
      registerDecision(
        `Copy write to ${filePath.split('/').slice(-2).join('/')} [${offer}]`,
        'COPY_WRITE' as DecisionType,
        [filePath]
      );
      process.exit(0);
    }

    // --- Case 2: validate_gate success (phase advance) ---
    if (tool === 'mcp__copywriting__validate_gate') {
      const output = input.tool_output || '';
      if (output.includes('PASSED')) {
        const offer = detectOffer();
        const gateType = (input.tool_input.gate_type as string) || 'unknown';
        registerDecision(
          `Phase gate PASSED: ${gateType} [${offer}]`,
          'PHASE_ADVANCE' as DecisionType,
          []
        );
      }
      process.exit(0);
    }

    // --- Case 3: Mecanismo update ---
    if (tool === 'Write' || tool === 'Edit') {
      if (filePath && filePath.includes('mecanismo-unico')) {
        const offer = detectOffer();
        registerDecision(
          `Mecanismo update: ${filePath.split('/').pop()} [${offer}]`,
          'MECANISMO_UPDATE' as DecisionType,
          [filePath]
        );
      }
      process.exit(0);
    }

    // --- Case 4: black_validation result ---
    if (tool === 'mcp__copywriting__black_validation') {
      const output = input.tool_output || '';
      const offer = detectOffer();
      const passed = output.includes('PASS');
      registerDecision(
        `black_validation ${passed ? 'PASSED' : 'FAILED'} [${offer}]`,
        'CONFIG_UPDATE' as DecisionType,
        []
      );
      process.exit(0);
    }

    process.exit(0);
  } catch (error) {
    // Non-blocking: log and continue
    console.error(`[IDS-REGISTER] Error: ${error}`);
    process.exit(0);
  }
}

main();
