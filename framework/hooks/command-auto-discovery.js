#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
const HOME = (0, import_os.homedir)();
const COMMANDS_DIR = (0, import_path.join)(HOME, ".claude", "commands");
const SKILLS_DIR = (0, import_path.join)(HOME, ".claude", "skills");
const CACHE_PATH = (0, import_path.join)(HOME, ".claude", ".command-cache.json");
function scanCommands() {
  try {
    return (0, import_fs.readdirSync)(COMMANDS_DIR).filter((f) => (0, import_path.extname)(f) === ".md").map((f) => (0, import_path.basename)(f, ".md")).sort();
  } catch {
    return [];
  }
}
function scanSkills() {
  try {
    return (0, import_fs.readdirSync)(SKILLS_DIR).filter((d) => {
      const skillPath = (0, import_path.join)(SKILLS_DIR, d, "SKILL.md");
      return (0, import_fs.existsSync)(skillPath);
    }).sort();
  } catch {
    return [];
  }
}
function loadCache() {
  try {
    if (!(0, import_fs.existsSync)(CACHE_PATH)) return null;
    return JSON.parse((0, import_fs.readFileSync)(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}
function saveCache(data) {
  (0, import_fs.writeFileSync)(CACHE_PATH, JSON.stringify(data, null, 2));
}
const currentCommands = scanCommands();
const currentSkills = scanSkills();
const cache = loadCache();
const newCommands = cache ? currentCommands.filter((c) => !cache.commands.includes(c)) : [];
const newSkills = cache ? currentSkills.filter((s) => !cache.skills.includes(s)) : [];
saveCache({
  commands: currentCommands,
  skills: currentSkills,
  lastChecked: (/* @__PURE__ */ new Date()).toISOString()
});
if (newCommands.length > 0 || newSkills.length > 0) {
  const parts = [];
  if (newCommands.length > 0) {
    parts.push(`New commands: ${newCommands.map((c) => "/" + c).join(", ")}`);
  }
  if (newSkills.length > 0) {
    parts.push(`New skills: ${newSkills.join(", ")}`);
  }
  console.log(parts.join(" | "));
} else {
  console.log(`${currentCommands.length} commands, ${currentSkills.length} skills registered`);
}
