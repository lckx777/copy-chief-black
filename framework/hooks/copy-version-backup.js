#!/usr/bin/env node
var import_fs = require("fs");
var import_copy_versioning = require("../.aios-core/copy-chief/copy/copy-versioning");
let input = "";
try {
  input = (0, import_fs.readFileSync)(0, "utf8");
} catch {
  process.exit(0);
}
let hookData;
try {
  hookData = JSON.parse(input);
} catch {
  process.exit(0);
}
const toolName = hookData?.tool_name || "";
const toolInput = hookData?.tool_input || {};
if (toolName !== "Write") process.exit(0);
const filePath = toolInput?.file_path || "";
if (!filePath.includes("/production/")) process.exit(0);
if (filePath.includes("/.versions/")) process.exit(0);
const versionPath = (0, import_copy_versioning.backupVersion)(filePath);
if (versionPath) {
  console.error(`\u{1F4E6} Version backup: ${versionPath.split("/").slice(-2).join("/")}`);
}
console.log("{}");
