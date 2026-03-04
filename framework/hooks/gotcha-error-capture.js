#!/usr/bin/env node
var import_fs = require("fs");
var import_gotchas_memory = require("../.aios-core/copy-chief/learning/gotchas-memory");
function main() {
  let input = {};
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }
  const tool = input.tool_name || "unknown";
  const errorText = input.error || input.tool_response || "unknown error";
  let context;
  if (input.tool_input) {
    try {
      const inp = input.tool_input;
      const snippet = inp.query ?? inp.url ?? inp.file_path ?? inp.command ?? JSON.stringify(inp);
      context = String(snippet).substring(0, 100);
    } catch {
    }
  }
  try {
    const promoted = (0, import_gotchas_memory.recordError)(tool, String(errorText), context);
    if (promoted) {
      process.stderr.write(
        `[gotcha-error-capture] Promoted to ${promoted.id}: ${promoted.title}
`
      );
    }
  } catch (e) {
    process.stderr.write(`[gotcha-error-capture] ERROR: ${e}
`);
  }
  process.stdout.write(JSON.stringify({ continue: true }));
}
main();
