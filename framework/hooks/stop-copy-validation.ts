#!/usr/bin/env bun
// ~/.claude/hooks/stop-copy-validation.ts — Stop Hook (thin wrapper)
// Blocks copy in terminal + validates methodology was consulted.
//
// Business logic: ~/.claude/.aios-core/copy-chief/gates/copy-output-validator.ts
// v2.0 (2026-02-01) | Refactored: 2026-03-02

import { readFileSync, mkdirSync, appendFileSync } from 'fs';
import {
  validateCopyOutput,
  buildTerminalCopyMessage,
  buildMissingMethodologyMessage,
} from '../.aios-core/copy-chief/gates/copy-output-validator';

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

function allow(): void {
  console.log(JSON.stringify({}));
  process.exit(0);
}

function block(reason: string, logLabel: string): void {
  const output: StopOutput = { decision: 'block', reason };
  console.error(`[STOP-GATE] ${logLabel}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

function main(): void {
  try {
    let stdin = '';
    try { stdin = readFileSync(0, 'utf8'); } catch { allow(); return; }

    let input: StopInput;
    try { input = JSON.parse(stdin || '{}'); } catch { allow(); return; }

    if (input.stop_hook_active) { allow(); return; }

    const result = validateCopyOutput(input.transcript_path);

    if (result.ok) { allow(); return; }

    if (result.reason === 'terminal_copy') {
      block(
        buildTerminalCopyMessage(result.filesWritten),
        `Bloqueado: Copy no terminal. Arquivos escritos: ${result.filesWritten.length}`
      );
      return;
    }

    if (result.reason === 'missing_methodology') {
      block(
        buildMissingMethodologyMessage(result.vitalsCount, result.methodologyCount, result.totalFiles),
        `Bloqueado: Copy sem metodologia. Vitais: ${result.vitalsCount}, Metodologia: ${result.methodologyCount}`
      );
      return;
    }

    allow();
  } catch (error) {
    // FAIL-OPEN: never show error to user
    try {
      const logDir = `${process.env.HOME}/.claude/logs`;
      try { mkdirSync(logDir, { recursive: true }); } catch {}
      appendFileSync(`${logDir}/hook-errors.log`,
        `[${new Date().toISOString()}] stop-copy-validation: ${error}\n`);
    } catch {}
    allow();
  }
}

main();
