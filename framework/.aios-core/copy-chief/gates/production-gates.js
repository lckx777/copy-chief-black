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
var production_gates_exports = {};
__export(production_gates_exports, {
  BANNED_WORDS: () => BANNED_WORDS,
  CLICHES_BY_NICHE: () => CLICHES_BY_NICHE,
  checkAntiHomogenization: () => checkAntiHomogenization,
  checkBriefingGate: () => checkBriefingGate,
  checkBriefingGateWeighted: () => checkBriefingGateWeighted,
  checkProductionGates: () => checkProductionGates,
  checkResearchGate: () => checkResearchGate,
  formatGateBlockMessage: () => formatGateBlockMessage,
  getOfferContext: () => getOfferContext,
  isProductionFile: () => isProductionFile
});
module.exports = __toCommonJS(production_gates_exports);
var import_fs = require("fs");
var import_path = require("path");
var import_weighted_gates = require("./weighted-gates");
const RESEARCH_DELIVERABLES = {
  core: [
    { path: "research/synthesis.md", name: "Synthesis" }
  ],
  voc: [
    { path: "research/voc/summary.md", name: "VOC Summary" },
    { path: "research/voc/trends-analysis.md", name: "VOC Trends" }
  ],
  competitors: [
    { path: "research/competitors/summary.md", name: "Competitors Summary" },
    { path: "research/competitors/processed/ads-library-spy.md", name: "Ads Library Spy" }
  ],
  mechanism: [
    { path: "research/mechanism/summary.md", name: "Mechanism Summary" }
  ],
  avatar: [
    { path: "research/avatar/summary.md", name: "Avatar Summary" }
  ]
};
const MIN_HELIX_PHASES = 6;
const TOTAL_HELIX_PHASES = 10;
const PRODUCTION_PATTERNS = [
  /\/production\//i,
  /\/vsl\//i,
  /\/landing-page\//i,
  /\/creatives\//i,
  /\/emails\//i,
  /criativo.*\.md$/i,
  /headline.*\.md$/i,
  /script.*\.md$/i,
  /vsl.*\.md$/i
];
const CLICHES_BY_NICHE = {
  concursos: [
    "m\xE9todo infal\xEDvel",
    "passe em menos tempo",
    "decoreba n\xE3o funciona",
    "estudar de forma inteligente",
    "concurseiro aprovado",
    "m\xE9todo dos aprovados",
    "segredo dos aprovados",
    "f\xF3rmula da aprova\xE7\xE3o",
    "estudar menos e aprender mais"
  ],
  saude: [
    "emagre\xE7a sem dieta",
    "queimar gordura",
    "metabolismo acelerado",
    "segredo dos magros",
    "corpo dos sonhos",
    "transforma\xE7\xE3o",
    "revolucion\xE1rio",
    "milagroso",
    "m\xE9todo natural"
  ],
  relacionamento: [
    "recuperar casamento",
    "comunica\xE7\xE3o eficaz",
    "conex\xE3o profunda",
    "segredo das mulheres",
    "atra\xE7\xE3o irresist\xEDvel",
    "conquistar qualquer pessoa"
  ],
  riqueza: [
    "renda extra",
    "liberdade financeira",
    "m\xE9todo comprovado",
    "trabalhar de casa",
    "sem experi\xEAncia",
    "dinheiro f\xE1cil"
  ]
};
const BANNED_WORDS = [
  "revolucion\xE1rio",
  "inovador",
  "incr\xEDvel",
  "inacredit\xE1vel",
  "empoderar",
  "potencializar",
  "alavancar",
  "desbloquear",
  "jornada",
  "caminho",
  "segredo",
  "milagre"
];
function isProductionFile(filePath) {
  return PRODUCTION_PATTERNS.some((pattern) => pattern.test(filePath));
}
function getOfferContext(filePath) {
  const match = filePath.match(/copywriting-ecosystem\/([^\/]+)\/([^\/]+)\//);
  if (!match) return null;
  const [, nicheName, offerName] = match;
  const ecosystemRoot = filePath.match(/(.*?copywriting-ecosystem)/)?.[1];
  if (!ecosystemRoot) return null;
  const offerPath = (0, import_path.join)(ecosystemRoot, nicheName, offerName);
  const hasResearch = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research"));
  const hasBriefing = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "briefings"));
  const hasProduction = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "production"));
  const deliverables = collectDeliverableStatus(offerPath);
  return {
    offerPath,
    offerName,
    nicheName,
    hasResearch,
    hasBriefing,
    hasProduction,
    deliverables
  };
}
function collectDeliverableStatus(offerPath) {
  const status = {
    synthesisExists: false,
    synthesisConfidence: 0,
    vocSummary: false,
    vocTrends: false,
    competitorsSummary: false,
    adsLibrarySpy: false,
    mechanismSummary: false,
    avatarSummary: false,
    phasesComplete: 0,
    totalPhases: TOTAL_HELIX_PHASES,
    mupDefined: false,
    musDefined: false
  };
  const synthesisPath = (0, import_path.join)(offerPath, "research/synthesis.md");
  if ((0, import_fs.existsSync)(synthesisPath)) {
    status.synthesisExists = true;
    status.synthesisConfidence = extractConfidence(synthesisPath);
  }
  status.vocSummary = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/voc/summary.md"));
  status.vocTrends = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/voc/trends-analysis.md"));
  status.competitorsSummary = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/competitors/summary.md"));
  status.adsLibrarySpy = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/competitors/processed/ads-library-spy.md"));
  status.mechanismSummary = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/mechanism/summary.md"));
  status.avatarSummary = (0, import_fs.existsSync)((0, import_path.join)(offerPath, "research/avatar/summary.md"));
  const phasesDir = (0, import_path.join)(offerPath, "briefings/phases");
  if ((0, import_fs.existsSync)(phasesDir)) {
    try {
      const phases = (0, import_fs.readdirSync)(phasesDir).filter(
        (f) => /^(fase|phase)-?0?\d+.*\.md$/i.test(f) && (0, import_fs.statSync)((0, import_path.join)(phasesDir, f)).isFile()
      );
      status.phasesComplete = phases.length;
      status.mupDefined = phases.some((p) => /(fase|phase)-?0?5/i.test(p));
      status.musDefined = phases.some((p) => /(fase|phase)-?0?6/i.test(p));
    } catch {
    }
  }
  return status;
}
function extractConfidence(synthesisPath) {
  try {
    const content = (0, import_fs.readFileSync)(synthesisPath, "utf-8");
    const pattern1 = content.match(/\*\*Confidence[^*]*\*\*[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern1) {
      const value = parseFloat(pattern1[1]);
      return value > 1 ? value : value * 100;
    }
    const pattern2 = content.match(/confidence[^:]*[:\s]+(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern2) {
      const value = parseFloat(pattern2[1]);
      return value > 1 ? value : value * 100;
    }
    const pattern3 = content.match(/m[ée]dia[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern3) {
      const value = parseFloat(pattern3[1]);
      return value > 1 ? value : value * 100;
    }
  } catch {
  }
  return 0;
}
function checkResearchGate(context) {
  const issues = [];
  const suggestions = [];
  const d = context.deliverables;
  if (!d.synthesisExists) {
    issues.push("synthesis.md n\xE3o existe");
    suggestions.push("Rode audience-research-agent para criar research completa");
  } else if (d.synthesisConfidence < 70) {
    issues.push(`synthesis.md com confidence ${d.synthesisConfidence}% (m\xEDnimo: 70%)`);
    suggestions.push("Complete m\xF3dulos de research faltantes para aumentar confidence");
  }
  if (!d.vocSummary) {
    issues.push("VOC summary.md n\xE3o existe");
    suggestions.push("Execute voc-research-agent para extra\xE7\xE3o de VOC");
  }
  if (!d.vocTrends) {
    issues.push("VOC trends-analysis.md n\xE3o existe");
    suggestions.push("Gere an\xE1lise de tend\xEAncias ap\xF3s extra\xE7\xE3o VOC");
  }
  if (!d.competitorsSummary) {
    issues.push("Competitors summary.md n\xE3o existe");
  }
  if (!d.adsLibrarySpy) {
    issues.push("ads-library-spy.md n\xE3o existe");
    suggestions.push("Use fb_ad_library MCP para an\xE1lise de concorrentes");
  }
  if (!d.mechanismSummary) {
    issues.push("Mechanism summary.md n\xE3o existe");
    suggestions.push("Pesquise mecanismo cient\xEDfico para a oferta");
  }
  if (!d.avatarSummary) {
    issues.push("Avatar summary.md n\xE3o existe");
    suggestions.push("Defina avatar com base na VOC extra\xEDda");
  }
  return {
    passed: issues.length === 0,
    gate: "RESEARCH",
    issues,
    suggestions,
    confidence: d.synthesisConfidence
  };
}
function checkBriefingGate(context) {
  const issues = [];
  const suggestions = [];
  const helixStatePath = (0, import_path.join)(context.offerPath, "helix-state.yaml");
  if ((0, import_fs.existsSync)(helixStatePath)) {
    try {
      const helixContent = (0, import_fs.readFileSync)(helixStatePath, "utf-8");
      const gatesSection = helixContent.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || helixContent.substring(helixContent.indexOf("gates:") + 6);
      const gateLines = gatesSection.split("\n");
      let currentGate = "";
      let briefingPassed = false;
      for (const line of gateLines) {
        const gateNameMatch = line.match(/^\s{2}(briefing)\s*:/);
        if (gateNameMatch) {
          currentGate = "briefing";
          continue;
        }
        const passedMatch = line.match(/^\s+passed\s*:\s*(true|false)/);
        if (passedMatch && currentGate === "briefing") {
          briefingPassed = passedMatch[1] === "true";
          break;
        }
      }
      if (briefingPassed) {
        return { passed: true, gate: "BRIEFING", issues: [], suggestions: [] };
      }
      const phasesMatch = helixContent.match(/phases_completed\s*:\s*(\d+)/);
      let helixPhases = phasesMatch ? parseInt(phasesMatch[1], 10) : 0;
      if (helixPhases === 0) {
        const completedMatches = helixContent.match(/status:\s*completed/g);
        helixPhases = completedMatches ? completedMatches.length : 0;
      }
      if (helixPhases < MIN_HELIX_PHASES) {
        issues.push(`Apenas ${helixPhases}/${TOTAL_HELIX_PHASES} fases HELIX (m\xEDnimo: ${MIN_HELIX_PHASES})`);
        suggestions.push("Complete fases HELIX via helix-system-agent. Use evaluateBriefingGate() para score detalhado.");
      }
      const mecPath = (0, import_path.join)(context.offerPath, "mecanismo-unico.yaml");
      if ((0, import_fs.existsSync)(mecPath)) {
        const mecContent = (0, import_fs.readFileSync)(mecPath, "utf-8");
        const hasMup = /new_cause\s*:/.test(mecContent) && mecContent.match(/new_cause\s*:\s*.{5,}/)?.[0] !== void 0;
        const hasMus = /hero_ingredient\s*:|gimmick_name\s*:/.test(mecContent);
        if (!hasMup) {
          issues.push("MUP (new_cause) n\xE3o definido no mecanismo-unico.yaml");
          suggestions.push("Defina MUP via HELIX Fase 05 e rode evaluateBriefingGate() para score completo");
        }
        if (!hasMus) {
          issues.push("MUS (hero_ingredient/gimmick_name) n\xE3o definido no mecanismo-unico.yaml");
          suggestions.push("Complete MUS via HELIX Fase 06");
        }
      } else {
        const d2 = context.deliverables;
        if (!d2.mupDefined) {
          issues.push("MUP (Fase 05) n\xE3o definida");
          suggestions.push("Fase 05 \xE9 CR\xCDTICA - define a promessa principal");
        }
        if (!d2.musDefined) {
          issues.push("MUS (Fase 06) n\xE3o definida");
          suggestions.push("Fase 06 completa o par MUP/MUS");
        }
      }
      return { passed: issues.length === 0, gate: "BRIEFING", issues, suggestions };
    } catch {
    }
  }
  const d = context.deliverables;
  if (d.phasesComplete < MIN_HELIX_PHASES) {
    issues.push(`Apenas ${d.phasesComplete}/${TOTAL_HELIX_PHASES} fases HELIX (m\xEDnimo: ${MIN_HELIX_PHASES})`);
    suggestions.push("Complete fases HELIX via helix-system-agent");
  }
  if (!d.mupDefined) {
    issues.push("MUP (Fase 05) n\xE3o definida");
    suggestions.push("Fase 05 \xE9 CR\xCDTICA - define a promessa principal");
  }
  if (!d.musDefined) {
    issues.push("MUS (Fase 06) n\xE3o definida");
    suggestions.push("Fase 06 completa o par MUP/MUS");
  }
  return { passed: issues.length === 0, gate: "BRIEFING", issues, suggestions };
}
async function checkBriefingGateWeighted(offerPath) {
  const result = await (0, import_weighted_gates.evaluateBriefingGate)(offerPath);
  const issues = [];
  const suggestions = [];
  for (const criterion of result.criteria) {
    if (criterion.raw_score < criterion.weight * 0.5) {
      issues.push(`${criterion.name}: ${criterion.raw_score.toFixed(1)}/10 (${criterion.details})`);
      if (criterion.name === "HELIX Completeness") {
        suggestions.push("Complete todas as 10 fases HELIX via atlas (@briefer)");
      } else if (criterion.name === "MUP Quality") {
        suggestions.push("Valide MUP com blind_critic + emotional_stress_test");
      } else if (criterion.name === "MUS Quality") {
        suggestions.push("Defina gimmick_name e hero_ingredient no mecanismo-unico.yaml");
      } else if (criterion.name === "VOC Alignment") {
        suggestions.push("Execute research completa \u2014 vox (@researcher) para synthesis.md");
      } else if (criterion.name === "Mecanismo State") {
        suggestions.push("Avance mecanismo de DRAFT para VALIDATED/APPROVED via consensus MCP");
      }
    }
  }
  return {
    passed: result.verdict === "PASSED",
    gate: "BRIEFING",
    score: result.total_weighted,
    verdict: result.verdict,
    issues,
    suggestions
  };
}
function checkAntiHomogenization(content, nicheName) {
  const issues = [];
  const suggestions = [];
  const lowerContent = content.toLowerCase();
  const nicheCliches = CLICHES_BY_NICHE[nicheName] || [];
  const foundCliches = nicheCliches.filter((c) => lowerContent.includes(c.toLowerCase()));
  if (foundCliches.length > 0) {
    issues.push(`Clich\xEAs detectados: ${foundCliches.join(", ")}`);
    suggestions.push("Substitua por elementos \xDANICOS da oferta");
  }
  const foundBanned = BANNED_WORDS.filter((w) => lowerContent.includes(w.toLowerCase()));
  if (foundBanned.length > 0) {
    issues.push(`Palavras banidas: ${foundBanned.join(", ")}`);
    suggestions.push("Use linguagem espec\xEDfica da VOC em vez de adjetivos gen\xE9ricos");
  }
  const hasProprietaryName = /método\s+[A-Z][a-zA-Z]+|sistema\s+[A-Z][a-zA-Z]+|protocolo\s+[A-Z][a-zA-Z]+/i.test(content);
  const hasSpecificNumbers = /\d{2,}%|\d{2,}\s*(dias|horas|minutos|pessoas|alunos)/i.test(content);
  if (!hasProprietaryName) {
    issues.push("Sem nome propriet\xE1rio para m\xE9todo/sistema");
    suggestions.push("Crie um nome \xFAnico para o mecanismo (ex: M\xE9todo HELIX)");
  }
  if (!hasSpecificNumbers) {
    issues.push("Sem n\xFAmeros espec\xEDficos");
    suggestions.push("Adicione dados concretos: tempo, porcentagens, quantidade de alunos");
  }
  const genericityScore = calculateGenericityScore(content, issues.length);
  const passed = genericityScore >= 8;
  if (!passed) {
    issues.unshift(`Genericidade Score: ${genericityScore}/10 (m\xEDnimo: 8)`);
    suggestions.unshift("Copy gen\xE9rica demais - concorrente poderia usar sem altera\xE7\xE3o");
  }
  return {
    passed,
    gate: "ANTI_HOMOG",
    issues,
    suggestions,
    confidence: genericityScore * 10
    // 0-100
  };
}
function calculateGenericityScore(content, issueCount) {
  let score = 10;
  score -= Math.min(5, issueCount * 1.5);
  const hasQuotes = /"[^"]{20,}"/g.test(content);
  const hasSpecificProof = /\d{1,3}[,.]?\d{0,3}\s*(pessoas|alunos|clientes)/i.test(content);
  const hasUniqueStory = /minha história|meu caso|quando eu/i.test(content);
  if (hasQuotes) score += 0.5;
  if (hasSpecificProof) score += 0.5;
  if (hasUniqueStory) score += 0.5;
  return Math.max(0, Math.min(10, Math.round(score)));
}
function checkProductionGates(filePath, content) {
  if (!isProductionFile(filePath)) {
    return {
      passed: true,
      gate: "NONE",
      issues: [],
      suggestions: []
    };
  }
  const context = getOfferContext(filePath);
  if (!context) {
    return {
      passed: true,
      // Permitir se não conseguir determinar contexto
      gate: "NONE",
      issues: ["N\xE3o foi poss\xEDvel determinar contexto da oferta"],
      suggestions: []
    };
  }
  const researchResult = checkResearchGate(context);
  if (!researchResult.passed) {
    return researchResult;
  }
  const briefingResult = checkBriefingGate(context);
  if (!briefingResult.passed) {
    return briefingResult;
  }
  if (content) {
    const homogResult = checkAntiHomogenization(content, context.nicheName);
    if (!homogResult.passed) {
      return homogResult;
    }
  }
  return {
    passed: true,
    gate: "NONE",
    issues: [],
    suggestions: []
  };
}
function formatGateBlockMessage(result, context) {
  if (result.passed) return "";
  const gateNames = {
    "RESEARCH": "\u{1F4CA} RESEARCH GATE",
    "BRIEFING": "\u{1F4CB} BRIEFING GATE",
    "ANTI_HOMOG": "\u{1F3AF} ANTI-HOMOGENEIZA\xC7\xC3O GATE"
  };
  const gateName = gateNames[result.gate] || "GATE";
  const offerInfo = context ? `
**Oferta:** ${context.nicheName}/${context.offerName}` : "";
  const issuesList = result.issues.map((i) => `  \u274C ${i}`).join("\n");
  const suggestionsList = result.suggestions.map((s) => `  \u2192 ${s}`).join("\n");
  return `
\u{1F6AB} BLOQUEADO - ${gateName}
${offerInfo}
${result.confidence !== void 0 ? `
**Confidence:** ${result.confidence}%` : ""}

### ISSUES ENCONTRADAS
${issuesList}

### A\xC7\xD5ES NECESS\xC1RIAS
${suggestionsList}

---
**Para bypass de emerg\xEAncia:** Adicione \`--force-production\` no prompt.
`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BANNED_WORDS,
  CLICHES_BY_NICHE,
  checkAntiHomogenization,
  checkBriefingGate,
  checkBriefingGateWeighted,
  checkProductionGates,
  checkResearchGate,
  formatGateBlockMessage,
  getOfferContext,
  isProductionFile
});
