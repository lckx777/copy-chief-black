#!/usr/bin/env bun
/**
 * doc-rot-detector.ts — Thin Hook Wrapper
 * PostToolUse / SessionStart / manual CLI hook.
 *
 * Business logic lives in:
 *   ~/.claude/.aios-core/copy-chief/health/doc-rot-scanner.ts
 *
 * CLI usage still supported (pass offer-path or --all as argv).
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  processHookEvent,
  scanOffer,
  scanAllOffers,
  formatReport,
  saveReport,
  DEFAULT_ECOSYSTEM,
} from '../.aios-core/copy-chief/health/doc-rot-scanner';

// ─── CLI mode ────────────────────────────────────────────────────────────────

function runCli(): void {
  const args = process.argv.slice(2);
  let ecosystemPath = DEFAULT_ECOSYSTEM;
  let scanAll = false;
  let targetOffer: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      scanAll = true;
    } else if (args[i] === '--ecosystem-path' && args[i + 1]) {
      ecosystemPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-')) {
      targetOffer = args[i];
    }
  }

  if (scanAll) {
    const reports = scanAllOffers(ecosystemPath);
    for (const report of reports) {
      console.log(formatReport(report));
      saveReport(report);
    }
    const avg = reports.length > 0
      ? Math.round(reports.reduce((s, r) => s + r.health_score, 0) / reports.length)
      : 100;
    console.log(`ECOSYSTEM: ${reports.length} offers, avg health ${avg}/100`);
  } else if (targetOffer) {
    const { existsSync } = require('fs');
    let offerPath = targetOffer;
    if (!existsSync(offerPath)) offerPath = join(ecosystemPath, targetOffer);
    if (!existsSync(offerPath)) { console.error(`Not found: ${targetOffer}`); process.exit(1); }
    const report = scanOffer(offerPath);
    console.log(formatReport(report));
    saveReport(report);
  } else {
    console.log('Usage: bun run doc-rot-detector.ts [offer-path] | --all [--ecosystem-path /path]');
  }
}

// ─── Hook mode (stdin JSON) ──────────────────────────────────────────────────

async function runHook(): Promise<void> {
  try {
    const stdin = readFileSync(0, 'utf8').trim();
    const input = stdin ? JSON.parse(stdin) : {};
    const result = await processHookEvent(input);
    for (const w of result.warnings) {
      process.stderr.write(w + '\n');
    }
  } catch {
    // Fail-open: never block on hook errors
  }
  process.exit(0);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

if (process.argv.slice(2).length > 0) {
  runCli();
} else {
  runHook();
}
