#!/usr/bin/env node
var import_fs = require("fs");
var import_self_critique = require("../.aios-core/copy-chief/quality/self-critique");
const MAX_EXECUTION_MS = 3e3;
const timeout = setTimeout(() => process.exit(0), MAX_EXECUTION_MS);
try {
  let stdin = "";
  try {
    stdin = (0, import_fs.readFileSync)(0, "utf8");
  } catch {
    clearTimeout(timeout);
    process.exit(0);
  }
  let input;
  try {
    input = JSON.parse(stdin);
  } catch {
    clearTimeout(timeout);
    process.exit(0);
  }
  const result = (0, import_self_critique.runSelfCritique)(input);
  if (result?.warningMessage) {
    process.stderr.write(result.warningMessage + "\n");
  }
} catch (err) {
  try {
    process.stderr.write(`[SELF-CRITIQUE] Error: ${err}
`);
  } catch {
  }
}
clearTimeout(timeout);
process.exit(0);
