#!/usr/bin/env node
var import_fs = require("fs");
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
var import_state_machine = require("../.aios-core/copy-chief/state/state-machine");
var import_gate_result_parser = require("../.aios-core/copy-chief/gates/gate-result-parser");
function resolveOfferPath(input) {
  if (input.tool_input?.offer_path) {
    return input.tool_input.offer_path;
  }
  try {
    const session = (0, import_session_state.getSessionState)();
    if (session.activeOffer) return session.activeOffer;
    if (session.filesRead) {
      for (const file of session.filesRead) {
        const offer = (0, import_state_machine.detectOffer)(file);
        if (offer) return offer;
      }
    }
  } catch {
  }
  console.error("[GATE-TRACKER] \u26A0\uFE0F Sem oferta detectada para state-machine");
  return null;
}
function smRecordGateInMachine(gateType, result, input, details) {
  try {
    const offerPath = resolveOfferPath(input);
    if (!offerPath) return;
    const machine = (0, import_state_machine.loadMachine)(offerPath);
    if (result === "PASSED") {
      (0, import_state_machine.recordGatePassed)(machine, gateType, details);
    } else {
      (0, import_state_machine.recordGateBlocked)(machine, gateType, details);
    }
  } catch (e) {
    console.error(`[GATE-TRACKER] \u26A0\uFE0F State machine gate record falhou: ${e}`);
  }
}
function smRecordBlackValidationInMachine(score, input) {
  try {
    const offerPath = resolveOfferPath(input);
    if (!offerPath) return;
    const machine = (0, import_state_machine.loadMachine)(offerPath);
    machine.gates.production.score = score;
    if (score >= 8) {
      (0, import_state_machine.recordGatePassed)(machine, "production", `black_validation score ${score}/10`);
    } else {
      (0, import_state_machine.recordGateBlocked)(machine, "production", `black_validation score ${score}/10 (precisa \u22658)`);
    }
  } catch (e) {
    console.error(`[GATE-TRACKER] \u26A0\uFE0F State machine black_validation record falhou: ${e}`);
  }
}
function handleValidateGate(input) {
  const gateType = input.tool_input?.gate_type;
  const output = input.tool_output;
  if (!gateType || !output) {
    console.error("[GATE-TRACKER] validate_gate sem tipo ou output");
    return;
  }
  const validGateTypes = ["research", "briefing", "production"];
  if (!validGateTypes.includes(gateType)) {
    console.error(`[GATE-TRACKER] Gate type inv\xE1lido: ${gateType}`);
    return;
  }
  const parsed = (0, import_gate_result_parser.parseValidateGateOutput)(output);
  if (parsed.outcome === "PASSED") {
    (0, import_session_state.recordGatePassed)(gateType, "validate_gate retornou PASSED");
    smRecordGateInMachine(gateType, "PASSED", input);
    console.error(`[GATE-TRACKER] \u2705 Gate ${gateType} PASSED - State machine atualizada`);
  } else if (parsed.outcome === "BLOCKED") {
    const reasons = parsed.reasons || "sem raz\xF5es";
    (0, import_session_state.recordGateBlocked)(gateType, `BLOCKED: ${reasons}`);
    smRecordGateInMachine(gateType, "BLOCKED", input, reasons);
    console.error(`[GATE-TRACKER] \u274C Gate ${gateType} BLOCKED - ${reasons}`);
  }
}
function handleBlackValidation(input) {
  const output = input.tool_output;
  if (!output) {
    console.error("[GATE-TRACKER] black_validation sem output");
    return;
  }
  const parsed = (0, import_gate_result_parser.parseBlackValidationOutput)(output);
  if (parsed.score !== null) {
    (0, import_session_state.recordBlackValidationScore)(parsed.score);
    smRecordBlackValidationInMachine(parsed.score, input);
    if (parsed.passed) {
      console.error(`[GATE-TRACKER] \u2705 black_validation score ${parsed.score}/10 - Production gate PASSED`);
    } else {
      console.error(`[GATE-TRACKER] \u26A0\uFE0F black_validation score ${parsed.score}/10 - Precisa \u22658 para passar`);
    }
  }
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (toolName.startsWith("mcp__")) {
      (0, import_session_state.recordMcpToolUse)(toolName);
    }
    if (toolName === "mcp__copywriting__validate_gate") {
      handleValidateGate(input);
    }
    if (toolName === "mcp__copywriting__black_validation") {
      handleBlackValidation(input);
    }
    console.log(JSON.stringify({}));
    process.exit(0);
  } catch (error) {
    console.error(`[GATE-TRACKER] Erro: ${error}`);
    process.exit(0);
  }
}
main();
