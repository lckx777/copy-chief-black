#!/usr/bin/env node
var import_fs = require("fs");
var import_path = require("path");
var import_config_loader = require("../.aios-core/copy-chief/config/config-loader");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
function getToolsFromOfferState(offerPath, gate) {
  if (!offerPath) return [];
  try {
    const helixStatePath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "helix-state.yaml");
    if (!(0, import_fs.existsSync)(helixStatePath)) return [];
    const content = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    const toolsByPhaseMatch = content.match(
      new RegExp(`tools_by_phase:[\\s\\S]*?${gate}:\\s*\\n((?:\\s+-\\s+.+\\n)*)`, "m")
    );
    if (!toolsByPhaseMatch) return [];
    const tools = [];
    const toolRegex = /^\s+-\s+(.+)$/gm;
    let match;
    while ((match = toolRegex.exec(toolsByPhaseMatch[1])) !== null) {
      const toolName = match[1].trim();
      tools.push((0, import_config_loader.resolveToolName)(toolName));
    }
    return tools;
  } catch {
    return [];
  }
}
function getToolsFromSessionState(gate) {
  try {
    const sessionPath = (0, import_path.join)(process.env.HOME, ".claude", "session-state", "current-session.json");
    if (!(0, import_fs.existsSync)(sessionPath)) return [];
    const content = (0, import_fs.readFileSync)(sessionPath, "utf-8");
    const session = JSON.parse(content);
    return session.toolsUsedByPhase?.[gate] || [];
  } catch {
    return [];
  }
}
function detectOffer(input) {
  const offerPath = input.offer_path;
  if (offerPath) return offerPath;
  try {
    const sessionPath = (0, import_path.join)(process.env.HOME, ".claude", "session-state", "current-session.json");
    if ((0, import_fs.existsSync)(sessionPath)) {
      const content = (0, import_fs.readFileSync)(sessionPath, "utf-8");
      const session = JSON.parse(content);
      return session.activeOffer || null;
    }
  } catch {
  }
  return null;
}
function getMergedTools(offerPath, gate) {
  const offerTools = getToolsFromOfferState(offerPath, gate);
  const sessionTools = getToolsFromSessionState(gate);
  return [.../* @__PURE__ */ new Set([...offerTools, ...sessionTools])];
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (input.tool_name !== "mcp__copywriting__validate_gate") {
      allow();
      return;
    }
    const gateType = input.tool_input?.gate_type;
    if (!gateType) {
      allow();
      return;
    }
    const validGates = ["research", "briefing", "production", "delivery"];
    if (!validGates.includes(gateType)) {
      allow();
      return;
    }
    const offerPath = detectOffer(input.tool_input);
    const requiredGroups = (0, import_config_loader.getRequiredToolGroups)(gateType);
    const toolsUsed = getMergedTools(offerPath, gateType);
    const missingGroups = [];
    for (const group of requiredGroups) {
      const hasAny = group.some((tool) => toolsUsed.includes(tool));
      if (!hasAny) {
        missingGroups.push(group);
      }
    }
    if (missingGroups.length > 0) {
      block(gateType, offerPath, toolsUsed, missingGroups);
      return;
    }
    const recommended = (0, import_config_loader.getRecommendedTools)(gateType);
    const missingRecommended = recommended.filter((t) => !toolsUsed.includes(t));
    if (missingRecommended.length > 0) {
      console.error(`[TOOL-MATRIX] Warning: Recommended tools not used: ${missingRecommended.map(import_config_loader.formatToolName).join(", ")}`);
    }
    console.error(`[TOOL-MATRIX] OK: All required tools used for ${gateType}`);
    allow();
  } catch (error) {
    console.error(`[TOOL-MATRIX] Error: ${error}`);
    allow();
  }
}
function allow() {
  console.log(JSON.stringify({}));
  process.exit(0);
}
function block(gate, offer, toolsUsed, missingGroups) {
  const missingMsg = missingGroups.map((group, i) => {
    if (group.length === 1) {
      return `  ${i + 1}. ${(0, import_config_loader.formatToolName)(group[0])}`;
    }
    return `  ${i + 1}. Uma das seguintes:
${group.map((t) => `     - ${(0, import_config_loader.formatToolName)(t)}`).join("\n")}`;
  }).join("\n");
  const usedMsg = toolsUsed.length > 0 ? toolsUsed.map((t) => `  + ${(0, import_config_loader.formatToolName)(t)}`).join("\n") : "  (nenhuma)";
  const output = {
    decision: "block",
    reason: `BLOQUEADO \u2014 Ferramentas obrigatorias nao usadas

**validate_gate("${gate}")** requer:
${missingMsg}

**Ja usadas:**
${usedMsg}

**Oferta:** ${offer || "nao detectada"}
**Fonte:** core-config.yaml quality.gates.${gate}

Execute as ferramentas faltantes antes de chamar validate_gate.`
  };
  console.error(`[TOOL-MATRIX] BLOCKED: ${missingGroups.length} group(s) missing for ${gate}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
main();
