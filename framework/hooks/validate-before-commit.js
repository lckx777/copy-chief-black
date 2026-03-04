#!/usr/bin/env node
var import_commit_validator = require("../.aios-core/copy-chief/gates/commit-validator");
async function main() {
  const chunks = [];
  const buf = Buffer.alloc(4096);
  let rawInput = "";
  try {
    const fd = 0;
    while (true) {
      const bytesRead = require("fs").readSync(fd, buf, 0, buf.length, null);
      if (bytesRead === 0) break;
      chunks.push(buf.subarray(0, bytesRead));
    }
    rawInput = Buffer.concat(chunks).toString("utf-8").trim();
  } catch {
  }
  if (!rawInput) {
    process.exit(0);
  }
  let input;
  try {
    input = JSON.parse(rawInput);
  } catch {
    process.exit(0);
    return;
  }
  try {
    const decision = await (0, import_commit_validator.processHookEvent)(input);
    if (!decision.allow) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "block",
          reason: [
            "COMMIT BLOCKED \u2014 Production files require passing validations:",
            "",
            ...decision.errors.map((e) => `  ${e}`),
            ...decision.warnings.length > 0 ? ["", "Warnings:", ...decision.warnings.map((w) => `  ${w}`)] : [],
            "",
            "Fix the issues above before committing production/ files."
          ].join("\n")
        }
      };
      console.log(JSON.stringify(output));
      process.exit(0);
    }
    if (decision.warnings.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          reason: ["COMMIT ALLOWED with warnings:", ...decision.warnings.map((w) => `  ${w}`)].join("\n")
        }
      };
      console.log(JSON.stringify(output));
    }
  } catch {
  }
  process.exit(0);
}
main();
