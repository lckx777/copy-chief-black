#!/usr/bin/env node
var import_fs = require("fs");
var import_processing_registry = require("../.aios-core/copy-chief/utils/processing-registry.js");
function main() {
  const timeout = setTimeout(() => process.exit(0), 2e3);
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (!raw) {
      clearTimeout(timeout);
      process.exit(0);
    }
    const input = JSON.parse(raw);
    const warnings = (0, import_processing_registry.checkForDuplicates)(input);
    if (warnings.length > 0) {
      process.stderr.write((0, import_processing_registry.formatWarnings)(warnings));
    }
  } catch {
  }
  clearTimeout(timeout);
  process.exit(0);
}
main();
