#!/usr/bin/env node
var import_session_digest = require("../.aios-core/copy-chief/lifecycle/session-digest");
async function main() {
  try {
    const result = await (0, import_session_digest.processHookEvent)({});
    if (!result) {
      console.log("[DIGEST] Nenhuma oferta encontrada ou ecosystem nao disponivel.");
      process.exit(0);
    }
    console.log("");
    console.log(`[DIGEST] Sessao salva: ${result.filename}`);
    console.log(`[DIGEST] Oferta: ${result.offer.name} | Fase: ${result.offer.phase}`);
    console.log(`[DIGEST] Gates: research ${result.offer.gates.research ? "OK" : "--"} | briefing ${result.offer.gates.briefing ? "OK" : "--"} | mecanismo ${result.offer.mecanismoState}`);
    console.log(`[DIGEST] Path: ${result.filepath}`);
    console.log("");
  } catch {
  }
  process.exit(0);
}
main();
