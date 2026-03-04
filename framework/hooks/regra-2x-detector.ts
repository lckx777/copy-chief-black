#!/usr/bin/env bun
/**
 * regra-2x-detector.ts — UserPromptSubmit Hook (thin wrapper)
 * Part of AIOS: Automated Intelligence Operating System
 *
 * Detects repeated instructions ("Regra 2x") — warns via stderr, never blocks.
 *
 * Business logic: ~/.claude/.aios-core/copy-chief/utils/repetition-detector.ts
 * Created: 2026-02-26 | Refactored: 2026-03-02
 */

import { readFileSync } from 'fs';
import {
  detectRepetition,
  appendPrompt,
  readPreviousPrompts,
  formatWarningMessage,
} from '../.aios-core/copy-chief/utils/repetition-detector';

function main(): void {
  try {
    let currentPrompt = '';
    try {
      currentPrompt = readFileSync(0, 'utf8').trim();
    } catch {
      process.exit(0);
      return;
    }

    // Skip empty or very short prompts (commands, single words)
    if (!currentPrompt || currentPrompt.length < 15) {
      if (currentPrompt) appendPrompt(currentPrompt, readPreviousPrompts());
      process.exit(0);
      return;
    }

    const result = detectRepetition(currentPrompt);

    if (result.detected) {
      process.stderr.write(formatWarningMessage(result));
    }

    // Never block
    process.exit(0);
  } catch (error) {
    try {
      process.stderr.write(`[REGRA-2x] Error: ${error}\n`);
    } catch {}
    process.exit(0);
  }
}

main();
