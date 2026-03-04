#!/usr/bin/env node
var import_fs = require("fs");
var import_persuasion_flow = require("../.aios-core/copy-chief/quality/persuasion-flow");
const MAX_EXECUTION_MS = 3e3;
const timeout = setTimeout(() => {
  console.error("[FLOW-CHECK] \u23F0 Timeout \u2014 skipping");
  process.exit(0);
}, MAX_EXECUTION_MS);
try {
  const stdin = (0, import_fs.readFileSync)(0, "utf8");
  const input = JSON.parse(stdin);
  const result = (0, import_persuasion_flow.runPersuasionFlowCheck)(input);
  if (result?.warningMessage) {
    console.error(result.warningMessage);
  }
} catch (err) {
  console.error(`[FLOW-CHECK] Error: ${err}`);
}
clearTimeout(timeout);
process.exit(0);
