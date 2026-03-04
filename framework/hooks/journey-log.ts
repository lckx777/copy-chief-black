#!/usr/bin/env bun
// ~/.claude/hooks/journey-log.ts — PostToolUse Hook (thin wrapper)
// Records production iterations with scores and failure reasons.
//
// Business logic: ~/.claude/.aios-core/copy-chief/learning/journey-tracker.ts
// Created: 2026-02-23 | Refactored: 2026-03-02

import { readFileSync } from 'fs';
import {
  processJourneyIteration,
  HookInput,
} from '../.aios-core/copy-chief/learning/journey-tracker';

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);

    const { handled } = processJourneyIteration(input);

    if (!handled) {
      process.exit(0);
    }

    process.exit(0);
  } catch (error) {
    console.error(`[JOURNEY-LOG] Error: ${error}`);
    process.exit(0);
  }
}

main();
