/**
 * Emotional Stress Test Tool
 *
 * Implementa os 4 testes de validação emocional (Pesquisa 03.md).
 *
 * 1. GENERICIDADE - Poderia ser usado por concorrente?
 * 2. VISCERAL vs CEREBRAL - Faz SENTIR ou apenas entender?
 * 3. SCROLL-STOP - Em feed infinito, para o dedo?
 * 4. PROVA SOCIAL IMPLÍCITA - "Pessoas como eu" usam isso?
 *
 * Threshold 2026: Genericidade ≥8/10 para aprovação
 */

import { z } from "zod";
import { insertValidation } from "../db/sqlite.js";

// Tool definition
export const emotionalStressTestTool = {
  name: "emotional_stress_test",
  description: `Aplica os 4 testes de estresse emocional na copy.

Testes:
1. GENERICIDADE (40% peso) - Score <8 = REFAZER
2. VISCERAL (25% peso) - Qual parte do corpo reage?
3. SCROLL-STOP (20% peso) - Para o dedo no feed?
4. PROVA SOCIAL (15% peso) - Pertencimento tribal?

Threshold 2026: Genericidade ≥8 para aprovação.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      copy: {
        type: "string",
        description: "A copy a ser testada",
      },
      copy_type: {
        type: "string",
        enum: ["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta"],
        description: "Tipo de copy",
      },
      nicho: {
        type: "string",
        description: "Nicho da oferta para avaliar genericidade",
      },
      offer_id: {
        type: "string",
        description: "ID da oferta para histórico",
      },
    },
    required: ["copy", "copy_type"],
  },
};

// Input validation
const InputSchema = z.object({
  copy: z.string().min(10),
  copy_type: z.enum(["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta"]),
  nicho: z.string().optional(),
  offer_id: z.string().optional(),
});

interface TestResult {
  score: number;
  justificativa: string;
  detalhes?: Record<string, any>;
}

interface FearHierarchyResult {
  score: number;
  niveis_ativados: number[];
  nivel_maximo: number;
  justificativa: string;
}

interface EmotionalStressResult {
  genericidade: TestResult;
  visceral: TestResult & { parte_corpo: string };
  scroll_stop: TestResult;
  prova_social: TestResult;
  fear_hierarchy: FearHierarchyResult;
  media_ponderada: number;
  veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  acoes_prioritarias: string[];
}

// Test 1: Genericidade
function testGenericidade(copy: string, nicho?: string): TestResult {
  // Generic patterns that could be used by anyone
  const genericPatterns = [
    // Universal claims
    { pattern: /a solução definitiva|o método comprovado|o segredo revelado/gi, weight: -2 },
    { pattern: /finalmente|descoberta revolucionária|nunca antes visto/gi, weight: -1.5 },
    { pattern: /milhares de pessoas|todo mundo|qualquer pessoa pode/gi, weight: -1 },

    // Vague benefits
    { pattern: /transformar sua vida|mudar tudo|resultados incríveis/gi, weight: -1.5 },
    { pattern: /sucesso garantido|sem esforço|fácil e rápido/gi, weight: -1.5 },

    // Generic urgency
    { pattern: /vagas limitadas|última chance|não perca/gi, weight: -0.5 },
    { pattern: /por tempo limitado|oferta especial|exclusivo/gi, weight: -0.5 },

    // AI typical
    { pattern: /elevate|seamless|unlock|leverage|empower/gi, weight: -2 },
    { pattern: /game-?changer|cutting-?edge|world-?class/gi, weight: -1.5 },
  ];

  // Specific patterns (increase score)
  const specificPatterns = [
    // Unique mechanisms
    { pattern: /[A-Z][a-z]+\s(Method|Protocol|System|Technique)/g, weight: 1 },
    { pattern: /truque\s+d[aeo]\s+\w+|técnica\s+d[aeo]\s+\w+/gi, weight: 1.5 },

    // Specific numbers
    { pattern: /\d{2,}%|\d+\s*(dias|horas|kg|reais)/gi, weight: 0.5 },

    // Named entities
    { pattern: /Dr\.\s+[A-Z][a-z]+|Prof\.\s+[A-Z][a-z]+/g, weight: 1 },
    { pattern: /Harvard|Stanford|MIT|USP|UNICAMP/gi, weight: 0.8 },

    // Niche-specific language
    { pattern: /edital|gabaritar|lei seca|vade mecum/gi, weight: 1.5 }, // concursos
    { pattern: /GLP-?1|semaglutida|ozempic|monjaro/gi, weight: 1.5 }, // saude/emagrecer
    { pattern: /libido|testosterona|disfunção/gi, weight: 1.5 }, // masculino
  ];

  let score = 5; // Base

  for (const pattern of genericPatterns) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      score += matches.length * pattern.weight * 0.3;
    }
  }

  for (const pattern of specificPatterns) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      score += matches.length * pattern.weight * 0.5;
    }
  }

  // Length bonus (longer copy = more opportunity for uniqueness)
  if (copy.length > 1000) score += 0.5;
  if (copy.length > 3000) score += 0.5;

  // Normalize
  score = Math.min(10, Math.max(1, score));

  let justificativa = "";
  if (score >= 8) {
    justificativa = "Copy distintiva - elementos únicos que concorrentes não podem copiar";
  } else if (score >= 5) {
    justificativa = "Copy parcialmente genérica - alguns elementos únicos, mas base comum";
  } else {
    justificativa = "Copy altamente genérica - poderia ser usada por qualquer concorrente";
  }

  return {
    score: Math.round(score * 10) / 10,
    justificativa,
    detalhes: { nicho },
  };
}

// Test 2: Visceral vs Cerebral
function testVisceral(copy: string): TestResult & { parte_corpo: string } {
  const bodyReactions = {
    estomago: {
      patterns: [
        /frio na barriga|embrulhou|enjoo|nó no estômago/gi,
        /medo|terror|pânico|ansiedade|nervoso/gi,
        /fome|saciedade|empanturrado/gi,
      ],
      weight: 1.5,
    },
    coracao: {
      patterns: [
        /coração apert|coração dispar|coração acelera/gi,
        /amor|paixão|saudade|conexão|pertencimento/gi,
        /alegria|felicidade|emoção|lágrima/gi,
      ],
      weight: 1.3,
    },
    mente: {
      patterns: [
        /curioso|intrigado|confuso|surpreso/gi,
        /entendi|percebi|descobri|aprendi/gi,
        /lógica|razão|faz sentido|claro/gi,
      ],
      weight: 0.8,
    },
  };

  let dominantBody = "mente"; // default
  let maxScore = 0;
  const scores: Record<string, number> = {};

  for (const [body, config] of Object.entries(bodyReactions)) {
    let bodyScore = 0;
    for (const pattern of config.patterns) {
      const matches = copy.match(pattern);
      if (matches) {
        bodyScore += matches.length * config.weight;
      }
    }
    scores[body] = bodyScore;

    if (bodyScore > maxScore) {
      maxScore = bodyScore;
      dominantBody = body;
    }
  }

  // Calculate visceral score (higher for stomach/heart, lower for mind)
  let score = 3; // Base
  score += scores.estomago * 0.4;
  score += scores.coracao * 0.3;
  score -= scores.mente * 0.1; // Cerebral content reduces visceral score

  // Normalize to 1-5
  score = Math.min(5, Math.max(1, score));

  let justificativa = "";
  if (score >= 4) {
    justificativa = `Altamente visceral - reação no ${dominantBody}`;
  } else if (score >= 3) {
    justificativa = `Misto - algum impacto no ${dominantBody}, mas também cerebral`;
  } else {
    justificativa = "Predominantemente cerebral - informa mais do que faz sentir";
  }

  return {
    score: Math.round(score * 10) / 10,
    parte_corpo: dominantBody,
    justificativa,
    detalhes: scores,
  };
}

// Test 3: Scroll-Stop
function testScrollStop(copy: string, copyType: string): TestResult {
  // First 50 characters are most critical for hooks
  const opening = copy.substring(0, 100).toLowerCase();

  const scrollStopPatterns = [
    // Pattern interrupts
    { pattern: /parei?|espera|calma|atenção|olha isso/gi, weight: 1.5 },
    { pattern: /você não vai acreditar|isso é real|não é clickbait/gi, weight: 1 },

    // Curiosity gaps
    { pattern: /\?/g, weight: 0.3 }, // Questions
    { pattern: /por que|como|quando|onde|quem/gi, weight: 0.5 },
    { pattern: /o segredo|a verdade|ninguém fala/gi, weight: 0.8 },

    // Controversy/Surprise
    { pattern: /polêmic|controvérs|chocante|absurdo/gi, weight: 1.2 },
    { pattern: /proibid|censurad|escondid|segredo/gi, weight: 1 },

    // Numbers (specific = stopping)
    { pattern: /\d{2,}%|\$\d+|\d+\s*mil/gi, weight: 0.8 },

    // Negative patterns (reduce scroll-stop)
    { pattern: /olá|oi|bem-?vindo/gi, weight: -1 },
    { pattern: /neste vídeo|hoje vamos|vou te ensinar/gi, weight: -0.8 },
    { pattern: /introdução|começando|primeiro/gi, weight: -0.5 },
  ];

  let score = 2.5; // Base

  for (const pattern of scrollStopPatterns) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      // Weight more heavily if in opening
      const openingMatches = opening.match(pattern.pattern);
      const openingMultiplier = openingMatches ? 1.5 : 1;
      score += matches.length * pattern.weight * 0.3 * openingMultiplier;
    }
  }

  // Type-specific adjustments
  if (copyType === "hook" || copyType === "headline") {
    // Hooks MUST have high scroll-stop
    score *= 1.2;
  }

  // Normalize to 1-5
  score = Math.min(5, Math.max(1, score));

  let justificativa = "";
  if (score >= 4) {
    justificativa = "Alto poder de parada - interrompe scroll instantaneamente";
  } else if (score >= 3) {
    justificativa = "Poder moderado - pode parar alguns, mas não todos";
  } else {
    justificativa = "Baixo poder - passa batido no feed";
  }

  return {
    score: Math.round(score * 10) / 10,
    justificativa,
  };
}

// Test 5: Fear Hierarchy (BLACK Framework)
function testFearHierarchy(copy: string): FearHierarchyResult {
  /**
   * Fear Hierarchy - 5 níveis de medo (framework BLACK)
   *
   * Copy BLACK deve ativar níveis 4 ou 5 para máximo impacto.
   * Níveis mais altos = medo mais visceral = maior conversão.
   */
  const FEAR_LEVELS: Record<number, { name: string; patterns: RegExp[]; weight: number }> = {
    1: {
      name: "Curto prazo (constrangimento imediato)",
      patterns: [
        /vergonha|constrangimento|ridículo|humilhação/gi,
        /hoje|agora|amanhã|semana/gi,
        /olhares|risos|piada|mico/gi,
      ],
      weight: 1,
    },
    2: {
      name: "Médio prazo (consequência em meses)",
      patterns: [
        /meses|próximo ano|daqui a pouco/gi,
        /piorar|agravar|progredir|avançar/gi,
        /acumular|crescer|aumentar/gi,
      ],
      weight: 1.5,
    },
    3: {
      name: "Longo prazo (consequência permanente)",
      patterns: [
        /sempre|nunca mais|para sempre|resto da vida/gi,
        /irreversível|permanente|definitivo/gi,
        /perder tudo|acabar|destruir/gi,
      ],
      weight: 2,
    },
    4: {
      name: "Relacional (decepcionar quem ama)",
      patterns: [
        /família|filhos?|esposa?|marido|pais|mãe|pai/gi,
        /decepcionar|abandonar|deixar|perder/gi,
        /olhar nos olhos|encarar|explicar/gi,
        /dependem de (mim|você)|contam com/gi,
      ],
      weight: 2.5,
    },
    5: {
      name: "Identidade (quem você se torna)",
      patterns: [
        /fracassado|perdedor|incapaz|impotente|fraco/gi,
        /quem você é|tipo de pessoa|se tornar|virar/gi,
        /história|legado|memória|lembrar/gi,
        /morrer sem|viver sem|nunca conseguir/gi,
      ],
      weight: 3,
    },
  };

  const niveisAtivados: number[] = [];
  let totalScore = 0;
  let nivelMaximo = 0;

  for (const [nivel, config] of Object.entries(FEAR_LEVELS)) {
    const nivelNum = parseInt(nivel);
    let nivelAtivado = false;

    for (const pattern of config.patterns) {
      const matches = copy.match(pattern);
      if (matches && matches.length > 0) {
        nivelAtivado = true;
        totalScore += matches.length * config.weight;
      }
    }

    if (nivelAtivado) {
      niveisAtivados.push(nivelNum);
      if (nivelNum > nivelMaximo) {
        nivelMaximo = nivelNum;
      }
    }
  }

  // Normalize score to 1-10
  const normalizedScore = Math.min(10, Math.max(1, totalScore * 0.5 + niveisAtivados.length * 1.5));

  // Generate justificativa
  let justificativa = "";
  if (nivelMaximo >= 4) {
    justificativa = `Medo VISCERAL ativado - Nível ${nivelMaximo} (${FEAR_LEVELS[nivelMaximo].name})`;
  } else if (nivelMaximo >= 2) {
    justificativa = `Medo moderado - Nível ${nivelMaximo}. Precisa ativar níveis 4-5 para copy BLACK.`;
  } else if (nivelMaximo === 1) {
    justificativa = `Medo superficial - Apenas constrangimento imediato. Copy não é BLACK.`;
  } else {
    justificativa = `Nenhum medo detectado - Copy cerebral, não visceral. REFAZER com Fear Hierarchy.`;
  }

  return {
    score: Math.round(normalizedScore * 10) / 10,
    niveis_ativados: niveisAtivados,
    nivel_maximo: nivelMaximo,
    justificativa,
  };
}

// Test 4: Prova Social Implícita
function testProvaSocial(copy: string): TestResult {
  const tribalPatterns = [
    // In-group language
    { pattern: /nós|a gente|nosso|nossa comunidade/gi, weight: 1 },
    { pattern: /você que|se você|para quem/gi, weight: 0.5 },
    { pattern: /assim como você|pessoas como você/gi, weight: 1.5 },

    // Exclusivity
    { pattern: /exclusiv|seleto|poucos|elite|vip/gi, weight: 0.8 },
    { pattern: /apenas para|não é para qualquer/gi, weight: 1 },

    // Tribal identity
    { pattern: /concurseiro|empreendedor|mãe|pai/gi, weight: 1.2 },
    { pattern: /guerreiro|vencedor|determinado/gi, weight: 0.8 },

    // Social proof
    { pattern: /milhares|centenas|dezenas de pessoas/gi, weight: 0.5 },
    { pattern: /depoimento|história|caso real/gi, weight: 0.8 },
    { pattern: /aprovad[oa]|conseguiu|realizou/gi, weight: 0.6 },

    // Belonging cues
    { pattern: /família|grupo|tribo|movimento/gi, weight: 1 },
    { pattern: /juntos|unidos|compartilh/gi, weight: 0.5 },
  ];

  let score = 2.5; // Base

  for (const pattern of tribalPatterns) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      score += matches.length * pattern.weight * 0.3;
    }
  }

  // Normalize to 1-5
  score = Math.min(5, Math.max(1, score));

  let justificativa = "";
  if (score >= 4) {
    justificativa = '"Isso é para mim" - forte identificação tribal e pertencimento';
  } else if (score >= 3) {
    justificativa = "Identificação parcial - alguns elementos de pertencimento";
  } else {
    justificativa = "Sem identificação tribal - copy genérica sem pertencimento";
  }

  return {
    score: Math.round(score * 10) / 10,
    justificativa,
  };
}

function generateActions(result: EmotionalStressResult): string[] {
  const actions: string[] = [];

  // Genericidade is critical
  if (result.genericidade.score < 8) {
    actions.push("🔴 CRÍTICO: Aumentar distintividade - adicionar mecanismo único, nome próprio, elementos exclusivos");
    actions.push("Perguntar: 'Um concorrente poderia usar esta mesma copy?'");
  }

  // Fear Hierarchy is critical for BLACK
  if (result.fear_hierarchy.nivel_maximo < 4) {
    actions.push("🔴 CRÍTICO BLACK: Ativar Fear Hierarchy níveis 4-5 (Relacional/Identidade)");
    actions.push("Adicionar: medo de decepcionar família OU medo de quem você se torna");
    actions.push("Prospect deve SUAR ao ler - medo visceral, não intelectual");
  }

  if (result.visceral.score < 3) {
    actions.push("Adicionar linguagem visceral - descrever reações físicas/emocionais");
    actions.push(`Focar no ${result.visceral.parte_corpo} - usar palavras que ativem essa reação`);
  }

  if (result.scroll_stop.score < 3) {
    actions.push("Reescrever abertura - primeiros 3 segundos devem SURPREENDER");
    actions.push("Usar pattern interrupt ou curiosity gap no início");
  }

  if (result.prova_social.score < 3) {
    actions.push("Adicionar elementos tribais - linguagem de grupo, identidade compartilhada");
    actions.push("Incluir 'pessoas como você' ou identificadores do público");
  }

  return actions;
}

// Main handler
export async function emotionalStressTestHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { copy, copy_type, nicho, offer_id } = input;

  // Run all tests
  const genericidade = testGenericidade(copy, nicho);
  const visceral = testVisceral(copy);
  const scroll_stop = testScrollStop(copy, copy_type);
  const prova_social = testProvaSocial(copy);
  const fear_hierarchy = testFearHierarchy(copy);

  // Calculate weighted average (2026 weights with BLACK)
  // Genericidade: 35%, Fear Hierarchy: 25%, Visceral: 20%, Scroll-Stop: 12%, Prova Social: 8%
  const media_ponderada =
    genericidade.score * 0.35 +
    fear_hierarchy.score * 0.25 +
    (visceral.score * 2) * 0.20 + // Normalize 1-5 to match 1-10 scale
    (scroll_stop.score * 2) * 0.12 +
    (prova_social.score * 2) * 0.08;

  // Verdict - genericidade AND fear_hierarchy are hard gates for BLACK
  let veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  if (genericidade.score < 8) {
    veredicto = "REFAZER"; // Hard fail on genericidade
  } else if (fear_hierarchy.nivel_maximo < 4) {
    veredicto = "REVISAR"; // Need Fear Hierarchy levels 4-5 for BLACK
  } else if (media_ponderada >= 8) {
    veredicto = "APROVADO";
  } else if (media_ponderada >= 6) {
    veredicto = "REVISAR";
  } else {
    veredicto = "REFAZER";
  }

  const result: EmotionalStressResult = {
    genericidade,
    visceral,
    scroll_stop,
    prova_social,
    fear_hierarchy,
    media_ponderada: Math.round(media_ponderada * 10) / 10,
    veredicto,
    acoes_prioritarias: [],
  };

  result.acoes_prioritarias = generateActions(result);

  // Record if offer_id provided
  if (offer_id) {
    insertValidation({
      offer_id,
      copy_type,
      genericidade_score: genericidade.score,
      visceral_score: visceral.score,
      scroll_stop_score: scroll_stop.score,
      prova_social_score: prova_social.score,
      verdict: veredicto,
      improvements: result.acoes_prioritarias,
    });
  }

  // Format output
  let output = `# Emotional Stress Test - 5 Testes (BLACK Framework)

**Tipo:** ${copy_type}
${nicho ? `**Nicho:** ${nicho}` : ""}
${offer_id ? `**Oferta:** ${offer_id}` : ""}

---

## Resultados

### 1. GENERICIDADE (35% peso) ${genericidade.score >= 8 ? "✅" : "❌"}

| Score | Threshold | Status |
|-------|-----------|--------|
| **${genericidade.score}/10** | ≥8 | ${genericidade.score >= 8 ? "PASSED" : "FAILED"} |

${genericidade.justificativa}

---

### 2. FEAR HIERARCHY - BLACK (25% peso) ${fear_hierarchy.nivel_maximo >= 4 ? "✅" : "❌"}

| Score | Nível Máximo | Níveis Ativados | Status |
|-------|--------------|-----------------|--------|
| **${fear_hierarchy.score}/10** | ${fear_hierarchy.nivel_maximo}/5 | ${fear_hierarchy.niveis_ativados.join(", ") || "Nenhum"} | ${fear_hierarchy.nivel_maximo >= 4 ? "BLACK" : "REVISAR"} |

${fear_hierarchy.justificativa}

**Fear Hierarchy (5 níveis):**
| Nível | Tipo | Ativado? |
|-------|------|----------|
| 1 | Curto prazo (constrangimento) | ${fear_hierarchy.niveis_ativados.includes(1) ? "✅" : "❌"} |
| 2 | Médio prazo (meses) | ${fear_hierarchy.niveis_ativados.includes(2) ? "✅" : "❌"} |
| 3 | Longo prazo (permanente) | ${fear_hierarchy.niveis_ativados.includes(3) ? "✅" : "❌"} |
| 4 | Relacional (família) | ${fear_hierarchy.niveis_ativados.includes(4) ? "✅" : "❌"} |
| 5 | Identidade (quem você é) | ${fear_hierarchy.niveis_ativados.includes(5) ? "✅" : "❌"} |

> **BLACK requires:** Níveis 4 ou 5 ativados para copy visceral.

---

### 3. VISCERAL vs CEREBRAL (20% peso)

| Score | Parte do Corpo |
|-------|----------------|
| **${visceral.score}/5** | ${visceral.parte_corpo.toUpperCase()} |

${visceral.justificativa}

---

### 4. SCROLL-STOP (12% peso)

| Score | Power |
|-------|-------|
| **${scroll_stop.score}/5** | ${scroll_stop.score >= 4 ? "ALTO" : scroll_stop.score >= 3 ? "MÉDIO" : "BAIXO"} |

${scroll_stop.justificativa}

---

### 5. PROVA SOCIAL IMPLÍCITA (8% peso)

| Score | Identificação |
|-------|---------------|
| **${prova_social.score}/5** | ${prova_social.score >= 4 ? "FORTE" : prova_social.score >= 3 ? "PARCIAL" : "FRACA"} |

${prova_social.justificativa}

---

## Veredicto: ${veredicto === "APROVADO" ? "✅" : veredicto === "REVISAR" ? "⚠️" : "❌"} ${veredicto}

**Média Ponderada:** ${result.media_ponderada}/10

`;

  if (result.acoes_prioritarias.length > 0) {
    output += `### Ações Prioritárias

${result.acoes_prioritarias.map((a) => `- ${a}`).join("\n")}

`;
  }

  output += `---

### Ponderação BLACK 2026

| Teste | Peso | Motivo |
|-------|------|--------|
| Genericidade | 35% | AI detection + commodity copy |
| Fear Hierarchy | 25% | Medo visceral = conversão BLACK |
| Visceral | 20% | Ressonância física |
| Scroll-Stop | 12% | Competição por atenção |
| Prova Social | 8% | Pertencimento tribal |

**GATES CRÍTICOS:**
- Genericidade <8 = auto-REFAZER
- Fear Hierarchy <4 = REVISAR (precisa níveis 4-5 para BLACK)

> **"Copy confortável = Copy que FALHOU"** - BLACK Framework
`;

  return output;
}
