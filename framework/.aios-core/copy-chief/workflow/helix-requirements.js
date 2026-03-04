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
var helix_requirements_exports = {};
__export(helix_requirements_exports, {
  HELIX_PHASE_NAMES: () => HELIX_PHASE_NAMES,
  HELIX_PHASE_OUTPUTS: () => HELIX_PHASE_OUTPUTS,
  HELIX_PHASE_RECOMMENDED: () => HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_REQUIREMENTS: () => HELIX_PHASE_REQUIREMENTS,
  detectHelixPhaseFromPath: () => detectHelixPhaseFromPath,
  formatToolName: () => formatToolName,
  generateMissingToolsMessage: () => generateMissingToolsMessage,
  getMissingRecommendedTools: () => getMissingRecommendedTools,
  getMissingRequiredTools: () => getMissingRequiredTools,
  getRecommendedTools: () => getRecommendedTools,
  getRequiredTools: () => getRequiredTools
});
module.exports = __toCommonJS(helix_requirements_exports);
const HELIX_PHASE_REQUIREMENTS = {
  // Fase 1: Identificação - precisa carregar contexto
  1: ["mcp__copywriting__get_phase_context"],
  // Fase 2: Pesquisa Mercado - precisa carregar contexto + validar com VOC
  2: ["mcp__copywriting__get_phase_context"],
  // Fase 3: Avatar/Psicologia - precisa carregar contexto + validar emoções
  3: ["mcp__copywriting__get_phase_context"],
  // Fase 4: Níveis de Consciência - precisa carregar contexto
  4: ["mcp__copywriting__get_phase_context"],
  // Fase 5: MUP - CRÍTICA - precisa consensus para validar
  5: ["mcp__copywriting__get_phase_context", "mcp__zen__consensus"],
  // Fase 6: MUS - precisa carregar contexto + validar com VOC
  6: ["mcp__copywriting__get_phase_context", "mcp__copywriting__voc_search"],
  // Fase 7: Big Offer - precisa carregar contexto
  7: ["mcp__copywriting__get_phase_context"],
  // Fase 8: Fechamento/Pitch - precisa carregar contexto
  8: ["mcp__copywriting__get_phase_context"],
  // Fase 9: Leads/Ganchos - precisa carregar contexto + validar com VOC
  9: ["mcp__copywriting__get_phase_context", "mcp__copywriting__voc_search"],
  // Fase 10: Progressão Emocional - precisa validar gate
  10: ["mcp__copywriting__get_phase_context"]
};
const HELIX_PHASE_RECOMMENDED = {
  1: [],
  2: ["mcp__copywriting__voc_search"],
  3: ["mcp__copywriting__voc_search"],
  4: [],
  5: ["mcp__zen__thinkdeep"],
  6: ["mcp__zen__consensus"],
  7: ["mcp__copywriting__voc_search"],
  8: [],
  9: [],
  10: ["mcp__copywriting__validate_gate"]
};
const HELIX_PHASE_NAMES = {
  1: "Identifica\xE7\xE3o e Posicionamento",
  2: "Pesquisa de Mercado",
  3: "Avatar e Psicologia",
  4: "N\xEDveis de Consci\xEAncia",
  5: "Problema, Vil\xE3o e MUP",
  6: "Solu\xE7\xE3o e MUS",
  7: "Big Offer",
  8: "Fechamento e Pitch",
  9: "Leads e Ganchos",
  10: "Progress\xE3o Emocional"
};
const HELIX_PHASE_OUTPUTS = {
  1: "phase-01-identificacao.md",
  2: "phase-02-pesquisa-mercado.md",
  3: "phase-03-avatar-psicologia.md",
  4: "phase-04-niveis-consciencia.md",
  5: "phase-05-problema-vilao-mup.md",
  6: "phase-06-solucao-mus.md",
  7: "phase-07-big-offer.md",
  8: "phase-08-fechamento-pitch.md",
  9: "phase-09-leads-ganchos.md",
  10: "phase-10-progressao-emocional.md"
};
function detectHelixPhaseFromPath(filePath) {
  const phaseMatch = filePath.match(/phase-(\d{2})/);
  if (phaseMatch) {
    return parseInt(phaseMatch[1], 10);
  }
  return null;
}
function getRequiredTools(phase) {
  return HELIX_PHASE_REQUIREMENTS[phase] || [];
}
function getRecommendedTools(phase) {
  return HELIX_PHASE_RECOMMENDED[phase] || [];
}
function getMissingRequiredTools(phase, usedTools) {
  const required = getRequiredTools(phase);
  return required.filter((tool) => !usedTools.includes(tool));
}
function getMissingRecommendedTools(phase, usedTools) {
  const recommended = getRecommendedTools(phase);
  return recommended.filter((tool) => !usedTools.includes(tool));
}
function formatToolName(tool) {
  return tool.replace("mcp__", "").replace("__", ".");
}
function generateMissingToolsMessage(phase, missing) {
  const phaseName = HELIX_PHASE_NAMES[phase] || `Fase ${phase}`;
  const formattedTools = missing.map(formatToolName).join("\n  - ");
  return `\u{1F6AB} BLOQUEADO - FERRAMENTAS OBRIGAT\xD3RIAS N\xC3O USADAS

Fase ${phase} (${phaseName}) requer as seguintes ferramentas:

Ferramentas FALTANDO:
  - ${formattedTools}

A\xC7\xC3O OBRIGAT\xD3RIA:
Execute as ferramentas faltantes ANTES de criar o arquivo da fase.

Exemplo:
  mcp__copywriting__get_phase_context(phase=${phase}, offer_path="...")
${missing.includes("mcp__copywriting__voc_search") ? '  mcp__copywriting__voc_search(query="...", emotion="...")' : ""}
${missing.includes("mcp__zen__consensus") ? '  mcp__zen__consensus(question="Qual MUP \xE9 mais forte?", ...)' : ""}

Ver: ~/.claude/rules/tool-usage-matrix.md`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HELIX_PHASE_NAMES,
  HELIX_PHASE_OUTPUTS,
  HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_REQUIREMENTS,
  detectHelixPhaseFromPath,
  formatToolName,
  generateMissingToolsMessage,
  getMissingRecommendedTools,
  getMissingRequiredTools,
  getRecommendedTools,
  getRequiredTools
});
