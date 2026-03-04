#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_gate_auto_advance = require("../.aios-core/copy-chief/workflow/gate-auto-advance.js");
const HOME = require("os").homedir();
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (!(0, import_gate_auto_advance.isGateTool)(input.tool_name)) {
      process.exit(0);
      return;
    }
    const r = (0, import_gate_auto_advance.handleGateAutoAdvance)(input);
    if (r.blocked) console.error(`[AUTO-ADVANCE] Blocked \u2192 production: ${r.blocked}`);
    else if (r.error) console.error(`[AUTO-ADVANCE] ${r.error}`);
    else if (r.advanced) {
      console.error(`[AUTO-ADVANCE] ${r.offerPath}: ${r.fromPhase} \u2192 ${r.toPhase}`);
      const q = (0, import_path.join)(HOME, ".claude/kernel/queue.json");
      if ((0, import_fs.existsSync)(q)) console.error(`[AUTO-ADVANCE] Kernel: bun run ~/.claude/kernel/main.ts --offer ${r.offerPath} --phase ${r.toPhase}`);
    }
  } catch (error) {
    console.error(`[AUTO-ADVANCE] Error: ${error}`);
  }
  process.exit(0);
}
main();
