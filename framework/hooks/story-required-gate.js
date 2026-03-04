#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
const STORY_REQUIRED_PATTERNS = [
  /production\//i
];
const EXEMPT_PATTERNS = [
  /\.claude\//i,
  /scripts\//i,
  /hooks\//i,
  /templates\//i,
  /\.synapse\//i,
  /squads\//i,
  /research\//i,
  /briefings?\//i,
  /swipes\//i,
  /reviews?\//i,
  /\.json$/i,
  /\.yaml$/i,
  /\.yml$/i,
  /\.ts$/i,
  /\.js$/i,
  /\.sh$/i,
  /CONTEXT\.md$/i,
  /CLAUDE\.md$/i,
  /README/i,
  /helix-state/i,
  /mecanismo-unico/i,
  /project_state/i,
  /task_plan/i,
  /progress\.md/i,
  /findings\.md/i
];
function resolveOfferPath(filePath) {
  const ecosystemRoot = (0, import_path.join)(process.env.HOME || "/root", "copywriting-ecosystem");
  let dir = filePath;
  if (!dir.endsWith("/")) {
    dir = (0, import_path.join)(dir, "..");
  }
  for (let i = 0; i < 6; i++) {
    if (dir === "/" || dir === ecosystemRoot || dir === process.env.HOME) break;
    const aiosDir = (0, import_path.join)(dir, ".aios");
    const helixState = (0, import_path.join)(dir, "helix-state.yaml");
    if ((0, import_fs.existsSync)(aiosDir) || (0, import_fs.existsSync)(helixState)) {
      return dir;
    }
    dir = (0, import_path.join)(dir, "..");
  }
  return null;
}
function hasActiveStory(filePath) {
  try {
    const offerPath = resolveOfferPath(filePath);
    if (offerPath) {
      const storyFile = (0, import_path.join)(offerPath, ".aios", "story.yaml");
      if ((0, import_fs.existsSync)(storyFile)) {
        const content = (0, import_fs.readFileSync)(storyFile, "utf-8");
        const statusMatch = content.match(/^status:\s*['"]?(\w+)['"]?/m);
        const status = statusMatch ? statusMatch[1] : null;
        if (status === "open") {
          const phaseMatch = content.match(/^phase:\s*['"]?([^\s'"]+)['"]?/m);
          const phase = phaseMatch ? phaseMatch[1] : "unknown";
          return { active: true, storyName: `${offerPath.split("/").slice(-2).join("/")}:${phase}`, offerPath };
        }
        return { active: false, offerPath };
      }
      return { active: false, offerPath };
    }
    const ecosystemRoot = (0, import_path.join)(process.env.HOME || "/root", "copywriting-ecosystem");
    if (!(0, import_fs.existsSync)(ecosystemRoot)) return { active: false };
    const niches = (0, import_fs.readdirSync)(ecosystemRoot).filter((n) => {
      if (n.startsWith(".") || n === "squads" || n === "scripts" || n === "site") return false;
      try {
        return (0, import_fs.readdirSync)((0, import_path.join)(ecosystemRoot, n)).length > 0;
      } catch {
        return false;
      }
    });
    for (const niche of niches) {
      try {
        const offers = (0, import_fs.readdirSync)((0, import_path.join)(ecosystemRoot, niche));
        for (const offer of offers) {
          const storyFile = (0, import_path.join)(ecosystemRoot, niche, offer, ".aios", "story.yaml");
          if (!(0, import_fs.existsSync)(storyFile)) continue;
          const content = (0, import_fs.readFileSync)(storyFile, "utf-8");
          const statusMatch = content.match(/^status:\s*['"]?(\w+)['"]?/m);
          if (statusMatch && statusMatch[1] === "open") {
            return { active: true, storyName: `${niche}/${offer}` };
          }
        }
      } catch {
      }
    }
    return { active: false };
  } catch {
    return { active: true };
  }
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (!["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(toolName)) {
      allow();
      return;
    }
    const filePath = input.tool_input?.file_path || input.tool_input?.path || input.tool_input?.notebook_path || "";
    if (!filePath) {
      allow();
      return;
    }
    if (EXEMPT_PATTERNS.some((p) => p.test(filePath))) {
      allow();
      return;
    }
    const requiresStory = STORY_REQUIRED_PATTERNS.some((p) => p.test(filePath));
    if (!requiresStory) {
      allow();
      return;
    }
    const { active, storyName } = hasActiveStory(filePath);
    if (active) {
      console.error(`[STORY-GATE] OK: Active story "${storyName}" \u2014 write allowed to ${filePath}`);
      allow();
      return;
    }
    block(filePath);
  } catch (error) {
    console.error(`[STORY-GATE] Error: ${error}`);
    allow();
  }
}
function allow() {
  console.log(JSON.stringify({}));
  process.exit(0);
}
function block(filePath) {
  const offerHint = resolveOfferPath(filePath);
  const storyLocation = offerHint ? `${offerHint}/.aios/story.yaml` : "{offer}/.aios/story.yaml";
  const output = {
    decision: "block",
    reason: `BLOQUEADO \u2014 Nenhuma story aberta para esta oferta

**Arquivo:** ${filePath}
**Principio:** "Nenhum codigo/copy e produzido sem story ativa"
**Fonte:** U-23 Story-Driven Production

Writes em production/ requerem uma story com status: open em:
  ${storyLocation}

**ACAO:**
1. Crie a story com StoryManager.createStory(offerPath, phase, workflowDef)
   Ou manualmente: escreva ${storyLocation} com status: open
2. A story define os acceptance_criteria do que deve ser entregue
3. Ao concluir, feche com StoryManager.closeStory(offerPath)

Exemplo de story.yaml:
\`\`\`yaml
status: open
phase: production
created_at: "${(/* @__PURE__ */ new Date()).toISOString()}"
acceptance_criteria:
  - id: vsl-draft
    description: "echo produces production/vsl/vsl-draft.md"
    expected_outputs: ["production/vsl/vsl-draft.md"]
completed_criteria: []
\`\`\``
  };
  console.error(`[STORY-GATE] BLOCKED: No active story for production write to ${filePath}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
main();
