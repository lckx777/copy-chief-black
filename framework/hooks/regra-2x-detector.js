#!/usr/bin/env node
var import_fs = require("fs");
var import_repetition_detector = require("../.aios-core/copy-chief/utils/repetition-detector");
function main() {
  try {
    let currentPrompt = "";
    try {
      currentPrompt = (0, import_fs.readFileSync)(0, "utf8").trim();
    } catch {
      process.exit(0);
      return;
    }
    if (!currentPrompt || currentPrompt.length < 15) {
      if (currentPrompt) (0, import_repetition_detector.appendPrompt)(currentPrompt, (0, import_repetition_detector.readPreviousPrompts)());
      process.exit(0);
      return;
    }
    const result = (0, import_repetition_detector.detectRepetition)(currentPrompt);
    if (result.detected) {
      process.stderr.write((0, import_repetition_detector.formatWarningMessage)(result));
    }
    process.exit(0);
  } catch (error) {
    try {
      process.stderr.write(`[REGRA-2x] Error: ${error}
`);
    } catch {
    }
    process.exit(0);
  }
}
main();
