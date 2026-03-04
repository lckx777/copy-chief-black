#!/usr/bin/env node
var import_fs = require("fs");
var import_gate_resolver = require("../.aios-core/copy-chief/gates/gate-resolver");
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (!["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
      allow();
      return;
    }
    const filePath = extractFilePath(input.tool_input);
    if (!filePath) {
      allow();
      return;
    }
    const check = (0, import_gate_resolver.resolveCanWriteToPath)(filePath);
    if (check.debug) {
      console.error(`[PHASE-GATE] Resolu\xE7\xE3o para ${filePath}:`);
      console.error(`  - Oferta: ${check.offerPath || "n\xE3o detectada"}`);
      console.error(`  - Fonte: ${check.source}`);
      console.error(`  - offer-state: ${check.debug.offerStateChecked ? check.debug.offerGatePassed ? "PASSED" : "NOT PASSED" : "n\xE3o verificado"}`);
      console.error(`  - session-state: ${check.debug.sessionStateChecked ? check.debug.sessionGatePassed ? "PASSED" : "NOT PASSED" : "n\xE3o verificado"}`);
      console.error(`  - heur\xEDstica: ${check.debug.heuristicChecked ? check.debug.heuristicPassed ? "PASSED" : "NOT PASSED" : "n\xE3o verificado"}`);
    }
    if (!check.allowed) {
      block(check.reason || "Gate n\xE3o passou", check.requiredGate, check.source);
      return;
    }
    if (check.offerPath && (check.source === "offer-state" || check.source === "heuristic")) {
      (0, import_gate_resolver.syncSessionFromOffer)(check.offerPath);
    }
    allow();
  } catch (error) {
    console.error(`[PHASE-GATE] Erro: ${error}`);
    allow();
  }
}
function extractFilePath(toolInput) {
  const possibleFields = ["file_path", "path", "notebook_path", "filePath"];
  for (const field of possibleFields) {
    if (typeof toolInput[field] === "string") {
      return toolInput[field];
    }
  }
  return null;
}
function allow() {
  const output = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}
function block(reason, requiredGate, source) {
  const state = (0, import_session_state.getSessionState)();
  const gates = (0, import_session_state.getGatesStatus)();
  const phase = (0, import_session_state.getCurrentPhase)();
  const offer = (0, import_session_state.getActiveOffer)();
  const output = {
    decision: "block",
    reason: `\u{1F6AB} BLOQUEADO - GATE N\xC3O PASSOU

${reason}

**Estado Atual (v7.1 Dual-Source):**
- Oferta: ${offer || "n\xE3o definida"}
- Fase: ${phase}
- Gates (session): research=${gates.research}, briefing=${gates.briefing}, production=${gates.production}
- Fonte da verifica\xE7\xE3o: ${source || "session-state"}

**A\xC7\xC3O OBRIGAT\xD3RIA:**
${requiredGate ? getActionForGate(requiredGate, offer) : "Execute o gate necess\xE1rio antes de continuar."}

**Por que isso existe:**
O sistema v7.1 usa fallback chain para resolver gates:
1. offer-state (helix-state.yaml) - PERSISTENTE
2. session-state - VOL\xC1TIL (2h)
3. heur\xEDstica (arquivos existem) - \xDALTIMO RECURSO

RESEARCH \u2192 validate_gate("research") \u2192 BRIEFING
BRIEFING \u2192 validate_gate("briefing") \u2192 PRODUCTION
PRODUCTION \u2192 black_validation(score\u22658) \u2192 DELIVERED

Ver: ~/.claude/reference/tool-usage-matrix.md`
  };
  console.error(`[PHASE-GATE] Bloqueado (fonte: ${source || "session-state"}): ${reason}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
function getActionForGate(gate, offer) {
  const offerPath = offer || "[caminho-da-oferta]";
  switch (gate) {
    case "research":
      return `Execute validate_gate para research:
\`\`\`
mcp__copywriting__validate_gate(gate_type="research", offer_path="${offerPath}")
\`\`\`

Isso verifica se todos os deliverables de research existem:
- research/voc/summary.md
- research/competitors/summary.md
- research/mechanism/summary.md
- research/avatar/summary.md
- research/synthesis.md`;
    case "briefing":
      return `Execute validate_gate para briefing:
\`\`\`
mcp__copywriting__validate_gate(gate_type="briefing", offer_path="${offerPath}")
\`\`\`

Isso verifica se todas as 10 fases HELIX est\xE3o completas.`;
    case "production":
      return `Execute black_validation na copy final:
\`\`\`
mcp__copywriting__black_validation(copy="[sua copy]", copy_type="vsl|lp|creative")
\`\`\`

Score \u22658 \xE9 necess\xE1rio para passar.`;
    default:
      return "Execute o gate apropriado antes de continuar.";
  }
}
main();
