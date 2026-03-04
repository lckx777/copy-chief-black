#!/usr/bin/env node
var import_fs = require("fs");
var import_etl_helpers = require("../.aios-core/copy-chief/etl/etl-helpers");
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const vocTools = [
      "mcp__copywriting__voc_search",
      "mcp__apify__call-actor",
      "mcp__apify__get-dataset-items"
    ];
    if (!vocTools.includes(input.tool_name)) {
      process.exit(0);
    }
    if (input.is_error || !input.tool_output) {
      process.exit(0);
    }
    try {
      const output = input.tool_output;
      const quoteMatches = output.match(/"[^"]{20,300}"/g) || [];
      if (quoteMatches.length < 3) {
        process.exit(0);
      }
      const quotes = quoteMatches.map((q) => ({
        text: q.replace(/^"|"$/g, ""),
        platform: input.tool_name.includes("apify") ? "apify" : "mcp",
        username: "unknown",
        engagement: 0,
        intensity: 0
      }));
      const security = (0, import_etl_helpers.validateSecurity)(quotes);
      const quality = (0, import_etl_helpers.validateQuality)(quotes);
      const deduplicated = (0, import_etl_helpers.deduplicateQuotes)(quotes);
      const duplicateCount = quotes.length - deduplicated.length;
      console.error(`[ETL-VOC] ${quotes.length} quotes extracted | ${duplicateCount} duplicates removed`);
      if (!security.passed) {
        console.error(`[ETL-VOC] \u26A0\uFE0F Security: ${security.issues.join("; ")}`);
      }
      if (!quality.passed) {
        console.error(`[ETL-VOC] \u26A0\uFE0F Quality: ${quality.issues.join("; ")}`);
      }
    } catch {
    }
    process.exit(0);
  } catch (error) {
    console.error(`[ETL-VOC] Error: ${error}`);
    process.exit(0);
  }
}
main();
