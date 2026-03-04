#!/usr/bin/env node
var import_fs = require("fs");
var import_validation_feedback = require("../.aios-core/copy-chief/feedback/validation-feedback");
async function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8").trim();
    let hookData;
    try {
      hookData = JSON.parse(stdin);
    } catch {
      process.exit(0);
      return;
    }
    const result = await (0, import_validation_feedback.processHookEvent)(hookData);
    if (result.processed) {
      process.stderr.write(result.message + "\n");
      for (const constraint of result.constraints) {
        process.stderr.write(`[FEEDBACK-LOOP]   Constraint: ${constraint}
`);
      }
    }
  } catch (error) {
    process.stderr.write(`[FEEDBACK-LOOP] Error: ${error}
`);
  }
  process.exit(0);
}
main();
