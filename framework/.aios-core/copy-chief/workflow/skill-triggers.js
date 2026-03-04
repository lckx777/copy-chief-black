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
var skill_triggers_exports = {};
__export(skill_triggers_exports, {
  SKILL_EXCEPTIONS: () => SKILL_EXCEPTIONS,
  SKILL_MAPPINGS: () => SKILL_MAPPINGS,
  detectRequiredSkill: () => detectRequiredSkill,
  extractOfferFromPrompt: () => extractOfferFromPrompt,
  hasCopyContentIndicators: () => hasCopyContentIndicators,
  hasSkillException: () => hasSkillException,
  isBriefingTrigger: () => isBriefingTrigger
});
module.exports = __toCommonJS(skill_triggers_exports);
function hasCopyContentIndicators(prompt) {
  const contentPatterns = [
    /\[?hook\]?\s*:/i,
    // [HOOK]: ou HOOK:
    /\[?corpo\]?\s*:/i,
    // [CORPO]: ou CORPO:
    /\[?cta\]?\s*:/i,
    // [CTA]: ou CTA:
    /gancho\s*\d+\s*:/i,
    // GANCHO 1:
    /\bh[123]\s*:/i,
    // H1: H2: H3:
    /instrução.*ator/i,
    // Instrução ator/atriz
    /avatar\/ator/i,
    // Avatar/Ator:
    /formato.*ugc/i,
    // Formato: UGC
    /duração.*segundo/i
    // Duração: X segundos
  ];
  return contentPatterns.some((p) => p.test(prompt));
}
const SKILL_MAPPINGS = [
  // ============================================
  // PRODUÇÃO (mais específico - prioridade alta)
  // ============================================
  {
    skill: "criativos-agent",
    triggers: [
      /criativo/i,
      /criar.*(?:hook|anúncio)/i,
      /anúncio.*(?:meta|facebook|youtube)/i,
      /\bads\b/i,
      /creative/i,
      /produzir.*(?:hook|gancho)/i,
      /escrever.*(?:criativo|anúncio)/i
    ],
    description: "Cria\xE7\xE3o de criativos DR"
  },
  {
    skill: "landing-page-agent",
    triggers: [/landing.*page/i, /\blp\b/i, /página.*vendas/i, /copy.*(?:lp|landing)/i],
    description: "Copy de landing page"
  },
  {
    skill: "copy-critic",
    triggers: [/validar.*copy/i, /criticar/i, /stress.*test/i, /\bstand\b/i, /revisar.*(?:mup|mus|headline)/i],
    description: "Valida\xE7\xE3o adversarial de copy"
  },
  // ============================================
  // HELIX (meio - produção estratégica)
  // ============================================
  {
    skill: "helix-system-agent",
    triggers: [/helix/i, /briefing.*(?:vsl|fases)/i, /fases.*helix/i, /\bmup\b/i, /\bmus\b/i, /fase\s*[0-9]+/i],
    description: "Briefing HELIX System"
  },
  // ============================================
  // PESQUISA (mais genérico - prioridade baixa)
  // ============================================
  {
    skill: "audience-research-agent",
    triggers: [
      /pesquisa.*(?:público|voc|avatar)/i,
      // OK: contexto de pesquisa
      /(?:definir|mapear|extrair).*avatar/i,
      // NOVO: verbo de pesquisa + avatar
      /(?:análise|perfil).*avatar/i,
      // NOVO: contexto analítico
      /\bvoc\b.*(?:extraction|research|pesquisa)/i,
      // NOVO: VOC com contexto
      /público.*alvo.*(?:quem|qual|definir)/i
      // NOVO: contexto de definição
      // REMOVIDO: /avatar/i (muito amplo - dispara em "Avatar/Ator:")
      // REMOVIDO: /dores.*avatar/i (muito amplo)
    ],
    description: "Pesquisa de p\xFAblico e VOC"
  },
  {
    skill: "voc-research-agent",
    triggers: [/extrair.*comentários/i, /apify.*extract/i, /quotes.*(?:youtube|tiktok|instagram)/i, /viral.*extraction/i],
    description: "Extra\xE7\xE3o t\xE9cnica de VOC"
  },
  // ============================================
  // INFRAESTRUTURA (última prioridade)
  // ============================================
  {
    skill: "fragment-agent",
    triggers: [/fragmentar/i, /dividir.*arquivo/i, /\brag\b.*(?:otimizar|preparar)/i, /arquivo.*grande/i],
    description: "Fragmenta\xE7\xE3o para RAG"
  },
  {
    skill: "ai-setup-architect",
    triggers: [/criar.*(?:prompt|agente)/i, /setup.*ia/i, /arquitetar.*sistema/i, /montar.*projeto.*claude/i],
    description: "Arquitetura de prompts/agentes"
  }
];
function detectRequiredSkill(prompt) {
  const isCopyContent = hasCopyContentIndicators(prompt);
  for (const mapping of SKILL_MAPPINGS) {
    if (isCopyContent && isResearchSkill(mapping.skill)) {
      continue;
    }
    for (const trigger of mapping.triggers) {
      if (trigger.test(prompt)) {
        return mapping;
      }
    }
  }
  return null;
}
function isResearchSkill(skill) {
  return ["audience-research-agent", "voc-research-agent"].includes(skill);
}
const SKILL_EXCEPTIONS = [
  /não use skill/i,
  /faça manualmente/i,
  /sem skill/i,
  /ignore.*skill/i,
  /manual/i,
  /bypass/i
];
function hasSkillException(prompt) {
  return SKILL_EXCEPTIONS.some((pattern) => pattern.test(prompt));
}
function isBriefingTrigger(prompt) {
  return /helix|briefing|fase\s*[4-9]|fase\s*10/i.test(prompt);
}
function extractOfferFromPrompt(prompt) {
  const offerPatterns = {
    "concursa": "concursos/concursa-ai",
    "hacker": "concursos/hacker",
    "gabaritando": "concursos/gabaritando-lei-seca",
    "gpt": "concursos/gpt-dos-aprovados"
  };
  const match = prompt.match(/concursa|hacker|gabaritando|gpt.*aprovados/i);
  if (!match) return null;
  const key = match[0].toLowerCase().replace(/[^a-z]/g, "");
  const entry = Object.entries(offerPatterns).find(([k]) => key.includes(k));
  return entry ? entry[1] : null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SKILL_EXCEPTIONS,
  SKILL_MAPPINGS,
  detectRequiredSkill,
  extractOfferFromPrompt,
  hasCopyContentIndicators,
  hasSkillException,
  isBriefingTrigger
});
