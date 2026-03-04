var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var gate_prereq_exports = {};
__export(gate_prereq_exports, {
  RECOMMENDED_TOOLS_BY_GATE: () => RECOMMENDED_TOOLS_BY_GATE,
  REQUIRED_TOOLS_BY_GATE: () => REQUIRED_TOOLS_BY_GATE,
  evaluateGatePrereq: () => evaluateGatePrereq,
  formatBlockReason: () => formatBlockReason,
  formatToolName: () => formatToolName,
  getActionExamples: () => getActionExamples,
  getToolsFromPersistentState: () => getToolsFromPersistentState
});
module.exports = __toCommonJS(gate_prereq_exports);
var import_fs = require("fs");
var import_path = require("path");
const TOOL_SHORT_TO_MCP = {
  voc_search: "mcp__copywriting__voc_search",
  firecrawl_agent: "mcp__firecrawl__firecrawl_agent",
  firecrawl_scrape: "mcp__firecrawl__firecrawl_scrape",
  firecrawl_search: "mcp__firecrawl__firecrawl_search",
  browser_navigate: "mcp__playwright__browser_navigate",
  get_phase_context: "mcp__copywriting__get_phase_context",
  blind_critic: "mcp__copywriting__blind_critic",
  emotional_stress_test: "mcp__copywriting__emotional_stress_test",
  get_meta_ads: "mcp__fb_ad_library__get_meta_ads",
  get_meta_platform_id: "mcp__fb_ad_library__get_meta_platform_id",
  analyze_ad_video: "mcp__fb_ad_library__analyze_ad_video",
  consensus: "mcp__zen__consensus",
  thinkdeep: "mcp__zen__thinkdeep",
  layered_review: "mcp__copywriting__layered_review",
  write_chapter: "mcp__copywriting__write_chapter",
  black_validation: "mcp__copywriting__black_validation"
};
const REQUIRED_TOOLS_BY_GATE = {
  research: [
    // Grupo 1: Coleta de dados (pelo menos uma)
    [
      "mcp__firecrawl__firecrawl_agent",
      "mcp__firecrawl__firecrawl_scrape",
      "mcp__firecrawl__firecrawl_search",
      "mcp__playwright__browser_navigate"
    ],
    // Grupo 2: VOC Search
    [
      "mcp__copywriting__voc_search"
    ]
  ],
  briefing: [
    // Grupo 1: Phase Context
    [
      "mcp__copywriting__get_phase_context"
    ]
  ],
  production: [
    // Grupo 1: Blind Critic
    [
      "mcp__copywriting__blind_critic"
    ],
    // Grupo 2: Emotional Stress Test
    [
      "mcp__copywriting__emotional_stress_test"
    ]
  ]
};
const RECOMMENDED_TOOLS_BY_GATE = {
  research: [
    "mcp__fb_ad_library__get_meta_ads",
    "mcp__fb_ad_library__get_meta_platform_id",
    "mcp__fb_ad_library__analyze_ad_video"
  ],
  briefing: [
    "mcp__zen__consensus",
    "mcp__zen__thinkdeep"
  ],
  production: [
    "mcp__copywriting__layered_review",
    "mcp__copywriting__write_chapter"
  ]
};
function getToolsFromPersistentState(offerPath, gateType) {
  if (!offerPath) return [];
  try {
    const ecosystemRoot = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
    const helixStatePath = (0, import_path.join)(ecosystemRoot, offerPath, "helix-state.yaml");
    if (!(0, import_fs.existsSync)(helixStatePath)) return [];
    const content = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
    const phaseKey = gateType;
    const toolsByPhaseMatch = content.match(
      new RegExp(`tools_by_phase:[\\s\\S]*?${phaseKey}:\\s*\\n((?:\\s+-\\s+.+\\n)*)`, "m")
    );
    if (!toolsByPhaseMatch) return [];
    const toolLines = toolsByPhaseMatch[1];
    const tools = [];
    const toolRegex = /^\s+-\s+(.+)$/gm;
    let match;
    while ((match = toolRegex.exec(toolLines)) !== null) {
      const toolName = match[1].trim();
      if (toolName.startsWith("mcp__")) {
        tools.push(toolName);
      } else if (TOOL_SHORT_TO_MCP[toolName]) {
        tools.push(TOOL_SHORT_TO_MCP[toolName]);
      } else {
        tools.push(toolName);
      }
    }
    return tools;
  } catch (error) {
    console.error(`[GATE-PREREQ] Warning: Could not read persistent state: ${error}`);
    return [];
  }
}
function evaluateGatePrereq(gateType, toolsUsed) {
  const requiredGroups = REQUIRED_TOOLS_BY_GATE[gateType];
  const recommended = RECOMMENDED_TOOLS_BY_GATE[gateType];
  const missingGroups = [];
  for (const group of requiredGroups) {
    const hasAnyFromGroup = group.some((tool) => toolsUsed.includes(tool));
    if (!hasAnyFromGroup) {
      missingGroups.push(group);
    }
  }
  const missingRecommended = recommended.filter((tool) => !toolsUsed.includes(tool));
  return {
    passed: missingGroups.length === 0,
    missingGroups,
    missingRecommended,
    toolsUsed
  };
}
function formatToolName(tool) {
  return tool.replace(/^mcp__/, "").replace(/__/g, ".").replace(/_/g, " ");
}
function formatBlockReason(gateType, toolsUsed, missingGroups, offer, phase) {
  const missingMessage = missingGroups.map((group, i) => {
    if (group.length === 1) {
      return `  ${i + 1}. ${formatToolName(group[0])}`;
    }
    return `  ${i + 1}. Uma das seguintes:
${group.map((t) => `     - ${formatToolName(t)}`).join("\n")}`;
  }).join("\n");
  const usedMessage = toolsUsed.length > 0 ? toolsUsed.map((t) => `  \u2713 ${formatToolName(t)}`).join("\n") : "  (nenhuma ferramenta registrada)";
  return `\u{1F6AB} BLOQUEADO - FERRAMENTAS OBRIGAT\xD3RIAS N\xC3O USADAS

**validate_gate("${gateType}")** n\xE3o pode ser executado ainda.

**Ferramentas FALTANDO:**
${missingMessage}

**Ferramentas J\xC1 USADAS nesta fase:**
${usedMessage}

**Estado Atual:**
- Oferta: ${offer || "n\xE3o definida"}
- Fase: ${phase}

**A\xC7\xC3O OBRIGAT\xD3RIA:**
Execute as ferramentas faltantes ANTES de chamar validate_gate.
${getActionExamples(gateType, missingGroups)}

**Por que isso existe:**
O sistema v7.1 garante que as ferramentas corretas foram usadas
antes de aprovar a transi\xE7\xE3o de fase.
Ver: ~/.claude/rules/tool-usage-matrix.md`;
}
function getActionExamples(gateType, missingGroups) {
  const examples = [];
  for (const group of missingGroups) {
    const tool = group[0];
    switch (tool) {
      case "mcp__firecrawl__firecrawl_agent":
        examples.push(`
\`\`\`
Use firecrawl_agent para coletar dados de pesquisa:
mcp__firecrawl__firecrawl_agent(...)
\`\`\``);
        break;
      case "mcp__copywriting__voc_search":
        examples.push(`
\`\`\`
Use voc_search para buscar quotes do p\xFAblico:
mcp__copywriting__voc_search(query="[emo\xE7\xE3o ou tema]", offer_path="[oferta]")
\`\`\``);
        break;
      case "mcp__copywriting__get_phase_context":
        examples.push(`
\`\`\`
Use get_phase_context para carregar contexto da fase:
mcp__copywriting__get_phase_context(phase_number=1, offer_path="[oferta]")
\`\`\``);
        break;
      case "mcp__copywriting__blind_critic":
        examples.push(`
\`\`\`
Use blind_critic para avaliar a copy:
mcp__copywriting__blind_critic(copy="[sua copy]", copy_type="vsl|lp|creative")
\`\`\``);
        break;
      case "mcp__copywriting__emotional_stress_test":
        examples.push(`
\`\`\`
Use emotional_stress_test para validar impacto emocional:
mcp__copywriting__emotional_stress_test(copy="[sua copy]")
\`\`\``);
        break;
      default:
        examples.push(`Execute: ${formatToolName(tool)}`);
    }
  }
  return examples.join("\n");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RECOMMENDED_TOOLS_BY_GATE,
  REQUIRED_TOOLS_BY_GATE,
  evaluateGatePrereq,
  formatBlockReason,
  formatToolName,
  getActionExamples,
  getToolsFromPersistentState
});
