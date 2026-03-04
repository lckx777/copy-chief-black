#!/usr/bin/env node
var import_fs = require("fs");
var import_recovery_handler = require("../.aios-core/copy-chief/recovery/recovery-handler");
function detectOffer() {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^\/]+\/[^\/]+)/);
  return match ? match[1] : "unknown";
}
function detectPhase() {
  const tool = process.env._LAST_TOOL || "";
  if (/firecrawl|playwright|voc_search/.test(tool)) return "RESEARCH";
  if (/get_phase_context|consensus/.test(tool)) return "BRIEFING";
  if (/write_chapter|blind_critic|emotional_stress_test/.test(tool)) return "PRODUCTION";
  if (/black_validation/.test(tool)) return "REVIEW";
  return "UNKNOWN";
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (!input.is_error) {
      process.exit(0);
    }
    const errorMsg = input.tool_output || "Unknown error";
    if (!(0, import_recovery_handler.isAutoRecoverable)(errorMsg)) {
      const errorClass = (0, import_recovery_handler.classifyError)(errorMsg);
      console.error(`[RECOVERY] PERMANENT error in ${input.tool_name}: ${errorMsg.slice(0, 100)}`);
      console.error(`[RECOVERY] Classification: ${errorClass}. Manual intervention may be needed.`);
      process.exit(0);
    }
    const ctx = {
      error: errorMsg,
      tool: input.tool_name,
      offer_path: detectOffer(),
      phase: detectPhase(),
      attempt_history: []
    };
    const result = (0, import_recovery_handler.executeRecovery)(ctx);
    if (result.resolved) {
      console.error(`[RECOVERY] Resolved via ${result.strategy_used} (${result.attempts} attempts): ${result.action_taken}`);
    } else {
      console.error(`[RECOVERY] Unresolved via ${result.strategy_used}: ${result.action_taken}`);
    }
    process.exit(0);
  } catch (error) {
    console.error(`[ERROR-HANDLER] Error: ${error}`);
    process.exit(0);
  }
}
main();
