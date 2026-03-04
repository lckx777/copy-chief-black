#!/usr/bin/env node
// pre-compact-save.cjs - Display warning before context compaction
// v8.0 - AIOS-native memory (claude-mem + RLM removed)

'use strict';

process.stderr.write('\n');
process.stderr.write('╔═══════════════════════════════════════════════════════════╗\n');
process.stderr.write('║  ⚠  CONTEXTO COMPACTANDO                                  ║\n');
process.stderr.write('╠═══════════════════════════════════════════════════════════╣\n');
process.stderr.write('║                                                           ║\n');
process.stderr.write('║  Planning files persistem em disco:                       ║\n');
process.stderr.write('║    • task_plan.md — plano e specs                         ║\n');
process.stderr.write('║    • progress.md — estado exato                           ║\n');
process.stderr.write('║    • findings.md — discovery data                         ║\n');
process.stderr.write('║                                                           ║\n');
process.stderr.write('║  Nova sessao: \'continue o plano\' ou                       ║\n');
process.stderr.write('║  /planning-with-files:status                              ║\n');
process.stderr.write('║                                                           ║\n');
process.stderr.write('╚═══════════════════════════════════════════════════════════╝\n');
process.stderr.write('\n');

process.exit(0);
