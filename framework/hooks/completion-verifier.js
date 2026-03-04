#!/usr/bin/env node
var import_path = require("path");
const HOME = process.env.HOME || "/tmp";
const input = JSON.parse(process.argv[2] || "{}");
const toolName = input.tool_name;
const filePath = input.tool_input?.file_path || "";
const content = input.tool_input?.content || "";
if (toolName !== "Write" && toolName !== "Edit") {
  process.exit(0);
}
const MEMORY_PATHS = [
  "memory/MEMORY.md",
  "memory/",
  "MEMORY.md"
];
const COMPLETION_CLAIMS = [
  /ALL\s+\d+\s+WIRED/i,
  /ALL\s+(?:DONE|COMPLETE|WIRED|IMPLEMENTED|VERIFIED)/i,
  /\d+\/\d+\s+(?:DONE|COMPLETE|WIRED)/i,
  /STATUS:\s*(?:IMPLEMENTED|COMPLETE|WIRED|DONE)/i,
  /\b(?:FULLY\s+)?IMPLEMENTED\b/i
];
const isMemoryWrite = MEMORY_PATHS.some((p) => filePath.includes(p));
const hasClaim = COMPLETION_CLAIMS.some((p) => p.test(content));
if (isMemoryWrite && hasClaim) {
  const claims = [];
  for (const pattern of COMPLETION_CLAIMS) {
    const match = content.match(pattern);
    if (match) claims.push(match[0]);
  }
  console.error(`
[COMPLETION-VERIFIER] \u26A0\uFE0F  Completion claim detected in memory write:`);
  console.error(`  Claims: ${claims.join(", ")}`);
  console.error(`  File: ${filePath}`);
  console.error(`  `);
  console.error(`  LAW OF IRON: No completion claim without fresh verification evidence.`);
  console.error(`  Before writing "${claims[0]}", verify your claims with actual evidence.`);
  console.error(`  Run: grep -r "import.*from" ~/.claude/hooks/ to check wiring.`);
  console.error(``);
}
const WATCHED_DIRS = [
  (0, import_path.join)(HOME, ".claude", "hooks"),
  (0, import_path.join)(HOME, ".claude", "hooks", "lib")
];
const isWatchedFile = filePath.endsWith(".ts") && WATCHED_DIRS.some((d) => filePath.startsWith(d));
process.exit(0);
