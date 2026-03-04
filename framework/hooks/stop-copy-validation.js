#!/usr/bin/env node
var import_fs = require("fs");
var import_copy_output_validator = require("../.aios-core/copy-chief/gates/copy-output-validator");
function allow() {
  console.log(JSON.stringify({}));
  process.exit(0);
}
function block(reason, logLabel) {
  const output = { decision: "block", reason };
  console.error(`[STOP-GATE] ${logLabel}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
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
    const result = (0, import_copy_output_validator.validateCopyOutput)(input.transcript_path);
    if (result.ok) {
      allow();
      return;
    }
    if (result.reason === "terminal_copy") {
      block(
        (0, import_copy_output_validator.buildTerminalCopyMessage)(result.filesWritten),
        `Bloqueado: Copy no terminal. Arquivos escritos: ${result.filesWritten.length}`
      );
      return;
    }
    if (result.reason === "missing_methodology") {
      block(
        (0, import_copy_output_validator.buildMissingMethodologyMessage)(result.vitalsCount, result.methodologyCount, result.totalFiles),
        `Bloqueado: Copy sem metodologia. Vitais: ${result.vitalsCount}, Metodologia: ${result.methodologyCount}`
      );
      return;
    }
    allow();
  } catch (error) {
    try {
      const logDir = `${process.env.HOME}/.claude/logs`;
      try {
        (0, import_fs.mkdirSync)(logDir, { recursive: true });
      } catch {
      }
      (0, import_fs.appendFileSync)(
        `${logDir}/hook-errors.log`,
        `[${(/* @__PURE__ */ new Date()).toISOString()}] stop-copy-validation: ${error}
`
      );
    } catch {
    }
    allow();
  }
}
main();
