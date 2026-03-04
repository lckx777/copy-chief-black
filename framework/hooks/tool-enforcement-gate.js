#!/usr/bin/env node
var import_fs = require("fs");
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
function main() {
  try {
    let stdin = "";
    try {
      stdin = (0, import_fs.readFileSync)(0, "utf8");
    } catch {
      allow();
      return;
    }
    let input;
    try {
      input = JSON.parse(stdin || "{}");
    } catch {
      allow();
      return;
    }
    if (input.stop_hook_active) {
      allow();
      return;
    }
    const state = (0, import_session_state.getSessionState)();
    const gates = (0, import_session_state.getGatesStatus)();
    const phase = (0, import_session_state.getCurrentPhase)();
    if (phase === "production") {
      const hasProductionWrites = (state.filesWritten || []).some((f) => /production\//i.test(f));
      if (hasProductionWrites) {
        if (!(0, import_session_state.hasPassedProductionValidation)()) {
          blockMissingValidation();
          return;
        }
        if (!(0, import_session_state.hasPassedFullValidation)()) {
          console.error("[TOOL-GATE] \u26A0\uFE0F AVISO: Copy em production/ sem black_validation final");
        }
      }
    }
    allow();
  } catch (error) {
    try {
      const logDir = `${process.env.HOME}/.claude/logs`;
      const { mkdirSync: mkdir, appendFileSync } = require("fs");
      try {
        mkdir(logDir, { recursive: true });
      } catch {
      }
      appendFileSync(
        `${logDir}/hook-errors.log`,
        `[${(/* @__PURE__ */ new Date()).toISOString()}] tool-enforcement-gate: ${error}
`
      );
    } catch {
    }
    allow();
  }
}
function allow() {
  const output = {};
  console.log(JSON.stringify(output));
  process.exit(0);
}
function blockMissingValidation() {
  const state = (0, import_session_state.getSessionState)();
  const validations = state.validationsPassed;
  const missing = [];
  if (!validations.blind_critic) {
    missing.push("blind_critic");
  }
  if (!validations.emotional_stress_test) {
    missing.push("emotional_stress_test");
  }
  const output = {
    decision: "block",
    reason: `\u{1F6AB} BLOQUEADO - VALIDA\xC7\xC3O MCP INCOMPLETA

Copy em production/ detectada sem valida\xE7\xE3o obrigat\xF3ria.

**Ferramentas faltando:** ${missing.join(", ")}

**A\xC7\xC3O OBRIGAT\xD3RIA:**
${missing.includes("blind_critic") ? `
1. Executar blind_critic:
\`\`\`
mcp__copywriting__blind_critic(copy="[sua copy]", copy_type="hook|lead|vsl|lp|creative")
\`\`\`
` : ""}
${missing.includes("emotional_stress_test") ? `
2. Executar emotional_stress_test:
\`\`\`
mcp__copywriting__emotional_stress_test(copy="[sua copy]", copy_type="hook|lead|vsl|lp|creative")
\`\`\`
` : ""}

**Por que isso existe (v7.0):**
- blind_critic: Avalia\xE7\xE3o cega da copy (sem vi\xE9s de cria\xE7\xE3o)
- emotional_stress_test: 4 testes de impacto visceral

O sistema v7.0 usa estado determin\xEDstico, n\xE3o regex.
Gates s\xE3o fonte de verdade para transi\xE7\xF5es de fase.

**Ap\xF3s executar as valida\xE7\xF5es, a sess\xE3o pode continuar.**

Ver: ~/.claude/reference/tool-usage-matrix.md`
  };
  console.error(`[TOOL-GATE] \u26A0\uFE0F Bloqueado: Valida\xE7\xF5es faltando: ${missing.join(", ")}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
main();
