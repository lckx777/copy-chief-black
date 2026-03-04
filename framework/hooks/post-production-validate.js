#!/usr/bin/env node
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
var import_handoff_engine = require("../.aios-core/copy-chief/handoff/handoff-engine");
var import_surface_checker = require("../.aios-core/copy-chief/surface/surface-checker");
function main() {
  try {
    const stdin = require("fs").readFileSync(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (toolName.startsWith("mcp__")) {
      (0, import_session_state.recordMcpToolUse)(toolName);
      console.error(`[TOOL-ENFORCE] MCP registrado: ${toolName}`);
    }
    if (toolName === "mcp__copywriting__blind_critic") {
      console.error(`[TOOL-ENFORCE] \u2705 blind_critic executado`);
    }
    if (toolName === "mcp__copywriting__emotional_stress_test") {
      console.error(`[TOOL-ENFORCE] \u2705 emotional_stress_test executado`);
    }
    if (toolName === "mcp__copywriting__layered_review") {
      console.error(`[TOOL-ENFORCE] \u2705 layered_review executado`);
    }
    if (toolName === "mcp__copywriting__black_validation") {
      console.error(`[TOOL-ENFORCE] \u2705 black_validation executado`);
    }
    if (toolName === "mcp__copywriting__validate_gate") {
      console.error(`[TOOL-ENFORCE] \u2705 validate_gate executado`);
    }
    if (toolName === "mcp__zen__consensus") {
      console.error(`[TOOL-ENFORCE] \u2705 consensus executado`);
    }
    if (["Write", "Edit"].includes(toolName)) {
      const filePath = input.tool_input?.file_path || input.tool_input?.path || "";
      const content = input.tool_input?.content || "";
      const state = (0, import_session_state.getSessionState)();
      const validations = (0, import_session_state.getValidationStatus)();
      const isProductionPath = /production\//i.test(filePath);
      const isBriefingPhase5 = /briefings?\/.*fase.?0?5/i.test(filePath);
      if (isBriefingPhase5) {
        if (!validations.consensus) {
          console.error("");
          console.error("\u26A0\uFE0F  [BSSF] RECOMENDA\xC7\xC3O: consensus para validar MUP");
          console.error("");
          console.error("Voc\xEA est\xE1 definindo MUP/MUS na fase 5.");
          console.error("Validar com m\xFAltiplos modelos aumenta confian\xE7a na escolha.");
          console.error("");
          console.error("A\xC7\xC3O SUGERIDA:");
          console.error('  mcp__zen__consensus(prompt="Valide estes MUPs: [lista]")');
          console.error("");
        }
      }
      if (isProductionPath && content) {
        const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
        if (wordCount > 500 && !validations.layered_review) {
          console.error("");
          console.error("\u26A0\uFE0F  [BSSF] RECOMENDA\xC7\xC3O: layered_review para copy longa");
          console.error("");
          console.error(`Copy detectada com ~${wordCount} palavras.`);
          console.error("Copy longa se beneficia de revis\xE3o em 3 camadas.");
          console.error("");
          console.error("A\xC7\xC3O SUGERIDA:");
          console.error('  mcp__copywriting__layered_review(copy="...", copy_type="vsl|lp")');
          console.error("");
        }
        if (!validations.blind_critic) {
          console.error(`[TOOL-ENFORCE] \u26A0\uFE0F AVISO: Copy escrita sem blind_critic`);
          console.error(`[TOOL-ENFORCE] Executar: blind_critic(copy="...", copy_type="...")`);
        }
        if (!validations.emotional_stress_test) {
          console.error(`[TOOL-ENFORCE] \u26A0\uFE0F AVISO: Copy escrita sem emotional_stress_test`);
          console.error(`[TOOL-ENFORCE] Executar: emotional_stress_test(copy="...")`);
        }
      }
      if (isProductionPath) {
        const missing = (0, import_session_state.getMissingRequiredTools)();
        if (missing.length > 0) {
          console.error(`[TOOL-ENFORCE] \u26A0\uFE0F Ferramentas faltando para fase ${state.currentPhase}:`);
          missing.forEach((tool) => console.error(`   - ${tool}`));
        }
      }
    }
    try {
      const offer = detectOffer();
      if (offer !== "unknown") {
        const toolName2 = input.tool_name;
        const toolOutput = input.tool_output || {};
        const score = typeof toolOutput === "object" ? toolOutput.score ?? toolOutput.average_score : void 0;
        const surfaceCtx = {
          phase: (0, import_session_state.getSessionState)().currentPhase || "PRODUCTION",
          offer_name: offer,
          offer_id: offer.replace(/\//g, "-"),
          deliverable_type: toolName2.includes("blind_critic") ? "copy_block" : toolName2.includes("black_validation") ? "final_delivery" : toolName2.includes("emotional_stress_test") ? "stress_test" : void 0,
          score: typeof score === "number" ? score : void 0,
          black_validation_passed: toolName2.includes("black_validation") && typeof score === "number" && score >= 8
        };
        const result = (0, import_surface_checker.shouldSurface)(surfaceCtx);
        if (result.should_surface) {
          console.error(`[SURFACE] \u{1F514} Human decision needed: ${result.message}`);
          if (result.queued_decision_id) {
            console.error(`[SURFACE] Decision queued: ${result.queued_decision_id}`);
          }
        }
      }
    } catch {
    }
    try {
      const offer = detectOffer();
      if (offer !== "unknown") {
        const offerFullPath = require("path").join(process.cwd().replace(/\/copywriting-ecosystem\/.*/, "/copywriting-ecosystem"), offer);
        const handoffDir = require("path").join(offerFullPath, "handoff-state");
        if (require("fs").existsSync(handoffDir)) {
          const files = require("fs").readdirSync(handoffDir).filter((f) => f.endsWith(".yaml"));
          for (const file of files) {
            const deliverable = file.replace(/\.yaml$/, "");
            const handoffStatus = (0, import_handoff_engine.getHandoffStatus)(offerFullPath, deliverable);
            if (handoffStatus && handoffStatus.status === "IN_PROGRESS") {
              const nextTask = (0, import_handoff_engine.getNextTask)(offerFullPath, deliverable);
              if (nextTask && nextTask.next_task) {
                console.error(`[HANDOFF] Next subtask: ${nextTask.next_task.type} (${nextTask.next_task.id})`);
              }
            }
          }
        }
      }
    } catch {
    }
    const output = {};
    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (error) {
    console.error(`[TOOL-ENFORCE] Erro: ${error}`);
    process.exit(0);
  }
}
function detectOffer() {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : "unknown";
}
main();
