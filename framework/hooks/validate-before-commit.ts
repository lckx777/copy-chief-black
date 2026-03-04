#!/usr/bin/env bun
/**
 * validate-before-commit.ts — Thin Hook Wrapper
 * PreToolUse (Bash matcher) hook — intercepts git commit on production/ files.
 *
 * Business logic lives in:
 *   ~/.claude/.aios-core/copy-chief/gates/commit-validator.ts
 *
 * Exit codes: 0 always (block/allow communicated via stdout JSON).
 */

import { readFileSync } from 'fs';
import { processHookEvent, HookInput } from '../.aios-core/copy-chief/gates/commit-validator';

interface HookOutput {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse';
    permissionDecision: 'allow' | 'block';
    reason?: string;
  };
}

async function main(): Promise<void> {
  // Read stdin
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(4096);
  let rawInput = '';
  try {
    const fd = 0;
    while (true) {
      const bytesRead = require('fs').readSync(fd, buf, 0, buf.length, null);
      if (bytesRead === 0) break;
      chunks.push(buf.subarray(0, bytesRead));
    }
    rawInput = Buffer.concat(chunks).toString('utf-8').trim();
  } catch { /* EOF */ }

  if (!rawInput) { process.exit(0); }

  let input: HookInput;
  try {
    input = JSON.parse(rawInput);
  } catch {
    process.exit(0);
    return;
  }

  try {
    const decision = await processHookEvent(input);

    if (!decision.allow) {
      const output: HookOutput = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'block',
          reason: [
            'COMMIT BLOCKED — Production files require passing validations:',
            '',
            ...decision.errors.map(e => `  ${e}`),
            ...(decision.warnings.length > 0 ? ['', 'Warnings:', ...decision.warnings.map(w => `  ${w}`)] : []),
            '',
            'Fix the issues above before committing production/ files.',
          ].join('\n'),
        },
      };
      console.log(JSON.stringify(output));
      process.exit(0);
    }

    if (decision.warnings.length > 0) {
      const output: HookOutput = {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          reason: ['COMMIT ALLOWED with warnings:', ...decision.warnings.map(w => `  ${w}`)].join('\n'),
        },
      };
      console.log(JSON.stringify(output));
    }
  } catch {
    // Fail-open: allow on any unexpected error
  }

  process.exit(0);
}

main();
