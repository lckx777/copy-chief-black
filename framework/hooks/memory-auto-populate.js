#!/usr/bin/env node
var import_fs = require("fs");
var import_memory_populator = require("../.aios-core/copy-chief/memory/memory-populator");
function ok() {
  process.stdout.write(JSON.stringify({ continue: true }) + "\n");
}
function main() {
  let input = {};
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    ok();
    return;
  }
  try {
    (0, import_memory_populator.runMemoryPopulate)(input);
  } catch {
  }
  ok();
}
main();
