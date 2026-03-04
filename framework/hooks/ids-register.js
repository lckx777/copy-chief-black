#!/usr/bin/env node
var import_fs = require("fs");
var import_ids = require("../.aios-core/copy-chief/copy/ids");
function detectOffer() {
  const cwd = process.cwd();
  const match = cwd.match(/copywriting-ecosystem\/([^/]+\/[^/]+)/);
  return match ? match[1] : "unknown";
}
function getFilePath(input) {
  return input.file_path || input.path || null;
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (input.is_error) {
      process.exit(0);
    }
    const tool = input.tool_name;
    const filePath = getFilePath(input.tool_input);
    if ((tool === "Write" || tool === "Edit") && filePath && filePath.includes("/production/")) {
      const offer = detectOffer();
      (0, import_ids.registerDecision)(
        `Copy write to ${filePath.split("/").slice(-2).join("/")} [${offer}]`,
        "COPY_WRITE",
        [filePath]
      );
      process.exit(0);
    }
    if (tool === "mcp__copywriting__validate_gate") {
      const output = input.tool_output || "";
      if (output.includes("PASSED")) {
        const offer = detectOffer();
        const gateType = input.tool_input.gate_type || "unknown";
        (0, import_ids.registerDecision)(
          `Phase gate PASSED: ${gateType} [${offer}]`,
          "PHASE_ADVANCE",
          []
        );
      }
      process.exit(0);
    }
    if (tool === "Write" || tool === "Edit") {
      if (filePath && filePath.includes("mecanismo-unico")) {
        const offer = detectOffer();
        (0, import_ids.registerDecision)(
          `Mecanismo update: ${filePath.split("/").pop()} [${offer}]`,
          "MECANISMO_UPDATE",
          [filePath]
        );
      }
      process.exit(0);
    }
    if (tool === "mcp__copywriting__black_validation") {
      const output = input.tool_output || "";
      const offer = detectOffer();
      const passed = output.includes("PASS");
      (0, import_ids.registerDecision)(
        `black_validation ${passed ? "PASSED" : "FAILED"} [${offer}]`,
        "CONFIG_UPDATE",
        []
      );
      process.exit(0);
    }
    process.exit(0);
  } catch (error) {
    console.error(`[IDS-REGISTER] Error: ${error}`);
    process.exit(0);
  }
}
main();
