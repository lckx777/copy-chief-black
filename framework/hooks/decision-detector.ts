#!/usr/bin/env bun
// ~/.claude/hooks/decision-detector.ts
// AIOS Core — UserPromptSubmit hook (thin wrapper)
// Business logic lives in copy-chief/utils/decision-detector.ts
// v2.0 (thin wrapper) — 2026-03-02
//
// Fail-open, non-blocking. Never returns stop or error to the runtime.

import { readFileSync } from 'fs';
import { recordNewDecisions } from '../.aios-core/copy-chief/utils/decision-detector';

const CONTINUE = JSON.stringify({ continue: true });

function main(): void {
  let userPrompt = '';

  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) { process.stdout.write(CONTINUE); return; }

    const parsed = JSON.parse(raw);
    userPrompt = (parsed.user_prompt ?? parsed.prompt ?? '') as string;
  } catch {
    process.stdout.write(CONTINUE);
    return;
  }

  try {
    const added = recordNewDecisions(userPrompt);
    if (added > 0) {
      console.error(`[DECISION-DETECTOR] Recorded ${added} new decision(s).`);
    }
  } catch {
    // Fail silently — never block the user prompt
  }

  process.stdout.write(CONTINUE);
}

main();
