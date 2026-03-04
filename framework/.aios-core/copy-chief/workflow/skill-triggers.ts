// ~/.claude/hooks/lib/skill-triggers.ts
// Mapeamento de triggers para skills obrigatórias
// Gate #1: Skill Auto-Invoke Enforcement
// v2.0 (2026-01-27): Reordenado para priorizar PRODUÇÃO sobre PESQUISA
//                    Refinados triggers de audience-research para evitar falsos positivos

export interface SkillMapping {
  skill: string;
  triggers: RegExp[];
  description: string;
}

/**
 * Detecta se o prompt contém indicadores de CONTEÚDO de copy
 * (não solicitação de skill, mas ENTREGA de copy)
 * Se sim, NÃO dispara skills de pesquisa
 */
export function hasCopyContentIndicators(prompt: string): boolean {
  const contentPatterns = [
    /\[?hook\]?\s*:/i,           // [HOOK]: ou HOOK:
    /\[?corpo\]?\s*:/i,          // [CORPO]: ou CORPO:
    /\[?cta\]?\s*:/i,            // [CTA]: ou CTA:
    /gancho\s*\d+\s*:/i,         // GANCHO 1:
    /\bh[123]\s*:/i,             // H1: H2: H3:
    /instrução.*ator/i,          // Instrução ator/atriz
    /avatar\/ator/i,             // Avatar/Ator:
    /formato.*ugc/i,             // Formato: UGC
    /duração.*segundo/i,         // Duração: X segundos
  ];
  return contentPatterns.some(p => p.test(prompt));
}

// ORDEM IMPORTA: Primeiro match ganha
// PRODUÇÃO primeiro (mais específico) → PESQUISA por último (mais genérico)
export const SKILL_MAPPINGS: SkillMapping[] = [
  // ============================================
  // PRODUÇÃO (mais específico - prioridade alta)
  // ============================================
  {
    skill: 'criativos-agent',
    triggers: [
      /criativo/i,
      /criar.*(?:hook|anúncio)/i,
      /anúncio.*(?:meta|facebook|youtube)/i,
      /\bads\b/i,
      /creative/i,
      /produzir.*(?:hook|gancho)/i,
      /escrever.*(?:criativo|anúncio)/i,
    ],
    description: 'Criação de criativos DR'
  },
  {
    skill: 'landing-page-agent',
    triggers: [/landing.*page/i, /\blp\b/i, /página.*vendas/i, /copy.*(?:lp|landing)/i],
    description: 'Copy de landing page'
  },
  {
    skill: 'copy-critic',
    triggers: [/validar.*copy/i, /criticar/i, /stress.*test/i, /\bstand\b/i, /revisar.*(?:mup|mus|headline)/i],
    description: 'Validação adversarial de copy'
  },

  // ============================================
  // HELIX (meio - produção estratégica)
  // ============================================
  {
    skill: 'helix-system-agent',
    triggers: [/helix/i, /briefing.*(?:vsl|fases)/i, /fases.*helix/i, /\bmup\b/i, /\bmus\b/i, /fase\s*[0-9]+/i],
    description: 'Briefing HELIX System'
  },

  // ============================================
  // PESQUISA (mais genérico - prioridade baixa)
  // ============================================
  {
    skill: 'audience-research-agent',
    triggers: [
      /pesquisa.*(?:público|voc|avatar)/i,   // OK: contexto de pesquisa
      /(?:definir|mapear|extrair).*avatar/i, // NOVO: verbo de pesquisa + avatar
      /(?:análise|perfil).*avatar/i,         // NOVO: contexto analítico
      /\bvoc\b.*(?:extraction|research|pesquisa)/i, // NOVO: VOC com contexto
      /público.*alvo.*(?:quem|qual|definir)/i,      // NOVO: contexto de definição
      // REMOVIDO: /avatar/i (muito amplo - dispara em "Avatar/Ator:")
      // REMOVIDO: /dores.*avatar/i (muito amplo)
    ],
    description: 'Pesquisa de público e VOC'
  },
  {
    skill: 'voc-research-agent',
    triggers: [/extrair.*comentários/i, /apify.*extract/i, /quotes.*(?:youtube|tiktok|instagram)/i, /viral.*extraction/i],
    description: 'Extração técnica de VOC'
  },

  // ============================================
  // INFRAESTRUTURA (última prioridade)
  // ============================================
  {
    skill: 'fragment-agent',
    triggers: [/fragmentar/i, /dividir.*arquivo/i, /\brag\b.*(?:otimizar|preparar)/i, /arquivo.*grande/i],
    description: 'Fragmentação para RAG'
  },
  {
    skill: 'ai-setup-architect',
    triggers: [/criar.*(?:prompt|agente)/i, /setup.*ia/i, /arquitetar.*sistema/i, /montar.*projeto.*claude/i],
    description: 'Arquitetura de prompts/agentes'
  }
];

/**
 * Detecta se o prompt requer uma skill específica
 * v2.0: Ignora skills de pesquisa se prompt contém CONTEÚDO de copy
 */
export function detectRequiredSkill(prompt: string): SkillMapping | null {
  const isCopyContent = hasCopyContentIndicators(prompt);

  for (const mapping of SKILL_MAPPINGS) {
    // Se é conteúdo de copy, pular skills de pesquisa
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

/**
 * Verifica se a skill é de pesquisa (não deve disparar em conteúdo de copy)
 */
function isResearchSkill(skill: string): boolean {
  return ['audience-research-agent', 'voc-research-agent'].includes(skill);
}

/**
 * Exceções - quando NÃO exigir skill mesmo com trigger
 */
export const SKILL_EXCEPTIONS = [
  /não use skill/i,
  /faça manualmente/i,
  /sem skill/i,
  /ignore.*skill/i,
  /manual/i,
  /bypass/i
];

export function hasSkillException(prompt: string): boolean {
  return SKILL_EXCEPTIONS.some(pattern => pattern.test(prompt));
}

/**
 * Detecta triggers de briefing que exigem research completo
 */
export function isBriefingTrigger(prompt: string): boolean {
  return /helix|briefing|fase\s*[4-9]|fase\s*10/i.test(prompt);
}

/**
 * Extrai nome da oferta do prompt
 */
export function extractOfferFromPrompt(prompt: string): string | null {
  const offerPatterns: Record<string, string> = {
    'concursa': 'concursos/concursa-ai',
    'hacker': 'concursos/hacker',
    'gabaritando': 'concursos/gabaritando-lei-seca',
    'gpt': 'concursos/gpt-dos-aprovados'
  };

  const match = prompt.match(/concursa|hacker|gabaritando|gpt.*aprovados/i);
  if (!match) return null;

  const key = match[0].toLowerCase().replace(/[^a-z]/g, '');
  const entry = Object.entries(offerPatterns).find(([k]) => key.includes(k));

  return entry ? entry[1] : null;
}
