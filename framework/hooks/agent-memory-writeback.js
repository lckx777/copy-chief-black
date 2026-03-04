#!/usr/bin/env node
var import_fs = require("fs");
var import_agent_memory_writeback = require("../.aios-core/copy-chief/memory/agent-memory-writeback.js");
const TIMEOUT_MS = 3e3;
function main() {
  const startMs = Date.now();
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (!raw) {
      process.stdout.write(JSON.stringify({ continue: true }));
      return;
    }
    const data = JSON.parse(raw);
    const result = (0, import_agent_memory_writeback.handleAgentMemoryWriteback)(data, startMs, TIMEOUT_MS);
    process.stdout.write(JSON.stringify(result));
  } catch (err) {
    process.stdout.write(JSON.stringify({
      continue: true,
      feedback: `[AMW] Error (fail-open): ${String(err?.message || err)}`
    }));
  }
}
main();
