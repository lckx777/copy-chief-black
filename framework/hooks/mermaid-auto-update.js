#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_child_process = require("child_process");
const SCRIPT_PATH = (0, import_path.resolve)(
  process.env.HOME ?? "~",
  "copywriting-ecosystem/scripts/yaml-to-mermaid.ts"
);
const TRIGGER_FILES = ["helix-state.yaml", "project_state.yaml"];
function main() {
  try {
    const raw = (0, import_fs.readFileSync)(0, "utf8").trim();
    if (!raw) return;
    const input = JSON.parse(raw);
    const filePath = input.tool_input?.file_path ?? "";
    if (!filePath) return;
    const fileName = (0, import_path.basename)(filePath);
    if (!TRIGGER_FILES.includes(fileName)) return;
    const offerDir = (0, import_path.dirname)(filePath);
    const helixStateFile = (0, import_path.join)(offerDir, "helix-state.yaml");
    if (!(0, import_fs.existsSync)(helixStateFile)) return;
    if (offerDir.includes("/scripts/") || offerDir.includes("/assemblers/") || offerDir.includes("/.claude/")) {
      return;
    }
    if (!(0, import_fs.existsSync)(SCRIPT_PATH)) {
      console.error(`[mermaid-auto-update] Script not found: ${SCRIPT_PATH}`);
      return;
    }
    const outputPath = (0, import_path.join)(offerDir, "pipeline-diagram.md");
    const result = (0, import_child_process.spawnSync)(
      "bun",
      ["run", SCRIPT_PATH, "--file", helixStateFile, "--format", "md", "--output", outputPath],
      {
        encoding: "utf-8",
        timeout: 1e4
      }
    );
    if (result.error) {
      console.error(`[mermaid-auto-update] Spawn error: ${result.error.message}`);
      return;
    }
    if (result.status !== 0) {
      const errOutput = result.stderr ?? "";
      if (errOutput.trim()) {
        console.error(`[mermaid-auto-update] Warning: ${errOutput.trim()}`);
      }
      return;
    }
    const offerName = (0, import_path.basename)(offerDir);
    console.error(`[mermaid-auto-update] Diagram updated: ${offerName}/pipeline-diagram.md`);
  } catch (err) {
    if (process.env.MERMAID_DEBUG) {
      console.error(`[mermaid-auto-update] Error: ${err}`);
    }
  }
}
main();
