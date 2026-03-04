#!/usr/bin/env node
var import_fs = require("fs");
function main() {
  const timeout = setTimeout(() => process.exit(0), 2e3);
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (!raw) {
      clearTimeout(timeout);
      process.exit(0);
    }
    const input = JSON.parse(raw);
    if (input.tool_name !== "Write") {
      clearTimeout(timeout);
      process.exit(0);
    }
    const filePath = input.tool_input.file_path || "";
    const content = input.tool_input.content || "";
    if (!filePath.match(/research.*voc/i)) {
      clearTimeout(timeout);
      process.exit(0);
    }
    const fileName = filePath.split("/").pop() || "";
    if (fileName.includes("-apify") && !content.includes("extraction_method: apify")) {
      const json = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: `File named "${fileName}" claims Apify extraction but content lacks "extraction_method: apify" in YAML header. Rename file to match actual method (e.g., *-websearch.md, *-firecrawl.md) or add correct extraction_method header.`
        }
      });
      process.stdout.write(json);
      clearTimeout(timeout);
      process.exit(0);
    }
    if (fileName.endsWith(".md") && !content.includes("extraction_method:")) {
      process.stderr.write(
        `[VOC-NAMING] Warning: ${fileName} in voc/ path is missing "extraction_method:" YAML header. Add extraction_method: apify|firecrawl|playwright|websearch to the YAML frontmatter.
`
      );
    }
  } catch {
  }
  clearTimeout(timeout);
  process.exit(0);
}
main();
