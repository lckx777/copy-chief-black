#!/usr/bin/env node
var import_fs = require("fs");
var import_decision_detector = require("../.aios-core/copy-chief/utils/decision-detector");
const CONTINUE = JSON.stringify({ continue: true });
function main() {
  let userPrompt = "";
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (!raw) {
      process.stdout.write(CONTINUE);
      return;
    }
    const parsed = JSON.parse(raw);
    userPrompt = parsed.user_prompt ?? parsed.prompt ?? "";
  } catch {
    process.stdout.write(CONTINUE);
    return;
  }
  try {
    const added = (0, import_decision_detector.recordNewDecisions)(userPrompt);
    if (added > 0) {
      console.error(`[DECISION-DETECTOR] Recorded ${added} new decision(s).`);
    }
  } catch {
  }
  process.stdout.write(CONTINUE);
}
main();
