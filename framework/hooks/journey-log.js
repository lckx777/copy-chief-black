#!/usr/bin/env node
var import_fs = require("fs");
var import_journey_tracker = require("../.aios-core/copy-chief/learning/journey-tracker");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const { handled } = (0, import_journey_tracker.processJourneyIteration)(input);
    if (!handled) {
      process.exit(0);
    }
    process.exit(0);
  } catch (error) {
    console.error(`[JOURNEY-LOG] Error: ${error}`);
    process.exit(0);
  }
}
main();
