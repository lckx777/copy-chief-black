#!/usr/bin/env node
var import_fs = require("fs");
var import_session_handoff = require("../.aios-core/copy-chief/lifecycle/session-handoff");
const HOME = process.env.HOME || "/tmp";
async function main() {
  try {
    let input = {};
    try {
      const stdin = (0, import_fs.readFileSync)(0, "utf8");
      input = JSON.parse(stdin || "{}");
    } catch {
    }
    if (input.stop_hook_active) {
      process.stdout.write(JSON.stringify({ continue: true }));
      process.exit(0);
    }
    const result = await (0, import_session_handoff.processHookEvent)(input);
    process.stderr.write(`[HANDOFF] Session saved \u2192 ${result.handoffFile}
`);
    process.stderr.write(`[HANDOFF] Offer: ${result.offer} | Phase: ${result.phase} | Pending: ${result.pendingCount} tasks
`);
    process.exit(0);
  } catch (err) {
    try {
      const logDir = `${HOME}/.claude/logs`;
      try {
        (0, import_fs.mkdirSync)(logDir, { recursive: true });
      } catch {
      }
      (0, import_fs.appendFileSync)(
        `${logDir}/hook-errors.log`,
        `[${(/* @__PURE__ */ new Date()).toISOString()}] session-handoff: ${err}
`
      );
    } catch {
    }
    process.exit(0);
  }
}
main();
