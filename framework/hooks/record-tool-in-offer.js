#!/usr/bin/env node
var import_fs = require("fs");
var import_offer_state = require("../.aios-core/copy-chief/state/offer-state");
var import_state_machine = require("../.aios-core/copy-chief/state/state-machine");
var import_offer_detector = require("../.aios-core/copy-chief/state/offer-detector");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const { tool_name: toolName, tool_input: toolInput } = input;
    if (!import_offer_detector.TRACKABLE_TOOLS.includes(toolName)) {
      console.log(JSON.stringify({}));
      process.exit(0);
    }
    const offerPath = (0, import_offer_detector.detectOfferForTool)(toolInput);
    if (!offerPath) {
      console.error(`[RECORD-TOOL] No offer detected for: ${toolName}`);
      console.error(`[RECORD-TOOL] Debug: offer_path=${toolInput?.offer_path}, filesRead and activeOffer checked`);
      console.log(JSON.stringify({}));
      process.exit(0);
    }
    const phase = (0, import_offer_detector.detectPhaseFromToolInput)(toolName, toolInput) ?? (0, import_offer_detector.resolvePhaseForOffer)(offerPath);
    if (!phase) {
      console.error(`[RECORD-TOOL] Cannot determine phase for: ${toolName} / ${offerPath}`);
      console.log(JSON.stringify({}));
      process.exit(0);
    }
    const normalizedTool = (0, import_offer_state.normalizeToolName)(toolName);
    (0, import_offer_state.recordToolUseInPhase)(offerPath, phase, normalizedTool);
    try {
      const machine = (0, import_state_machine.loadMachine)(offerPath);
      (0, import_state_machine.recordTool)(machine, toolName);
    } catch (e) {
      console.error(`[RECORD-TOOL] State machine record failed: ${e}`);
    }
    console.error(`[RECORD-TOOL] Recorded: ${normalizedTool} @ phase ${phase} for ${offerPath}`);
    console.log(JSON.stringify({}));
    process.exit(0);
  } catch (error) {
    console.error(`[RECORD-TOOL] Error: ${error}`);
    console.log(JSON.stringify({}));
    process.exit(0);
  }
}
main();
