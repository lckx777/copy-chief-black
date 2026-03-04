#!/usr/bin/env bun
// ~/.claude/hooks/session-digest-save.ts — Thin Hook Wrapper
// PreCompact hook — saves a YAML digest before /compact for session continuity.
//
// Business logic lives in:
//   ~/.claude/.aios-core/copy-chief/lifecycle/session-digest.ts

import { processHookEvent } from '../.aios-core/copy-chief/lifecycle/session-digest';

async function main(): Promise<void> {
  try {
    const result = await processHookEvent({});

    if (!result) {
      console.log('[DIGEST] Nenhuma oferta encontrada ou ecosystem nao disponivel.');
      process.exit(0);
    }

    console.log('');
    console.log(`[DIGEST] Sessao salva: ${result.filename}`);
    console.log(`[DIGEST] Oferta: ${result.offer.name} | Fase: ${result.offer.phase}`);
    console.log(`[DIGEST] Gates: research ${result.offer.gates.research ? 'OK' : '--'} | briefing ${result.offer.gates.briefing ? 'OK' : '--'} | mecanismo ${result.offer.mecanismoState}`);
    console.log(`[DIGEST] Path: ${result.filepath}`);
    console.log('');
  } catch {
    // Fail-open: never block /compact
  }
  process.exit(0);
}

main();
