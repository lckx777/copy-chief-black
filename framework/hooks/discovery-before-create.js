#!/usr/bin/env node
var import_fs = require("fs");
var import_file_discovery = require("../.aios-core/copy-chief/utils/file-discovery.js");
function main() {
  const timeout = setTimeout(() => process.exit(0), import_file_discovery.MAX_EXECUTION_MS);
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const result = (0, import_file_discovery.discoverSimilarFiles)(input);
    if (result.shouldWarn) process.stderr.write((0, import_file_discovery.formatDiscoveryWarning)(result));
  } catch (error) {
    try {
      process.stderr.write(`[DISCOVERY] Error: ${error}
`);
    } catch {
    }
  }
  clearTimeout(timeout);
  process.exit(0);
}
main();
