#!/usr/bin/env node
var import_fs = require("fs");
var import_mecanismo_gate = require("../.aios-core/copy-chief/gates/mecanismo-gate");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const result = (0, import_mecanismo_gate.preToolUse)(input);
    if (result.decision === "block") {
      console.log(result.message || "Blocked by mecanismo-validation");
      process.exit(2);
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
}
main();
