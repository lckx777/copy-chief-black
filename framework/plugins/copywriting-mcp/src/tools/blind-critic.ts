/**
 * Blind Critic Tool
 *
 * Implementa Blind Peer Review (Pesquisa 03.md - Artificial Hivemind).
 *
 * Problema: 79% similaridade intra-modelo
 * Solução: Crítico avalia artefato SEM contexto de geração
 *
 * O crítico NÃO vê:
 * - Briefing original
 * - Conversa de geração
 * - Iterações anteriores
 *
 * Avalia APENAS:
 * - Impacto emocional
 * - Especificidade
 * - Autenticidade
 */

import { z } from "zod";
import { insertValidation } from "../db/sqlite.js";

// Tool definition
export const blindCriticTool = {
  name: "blind_critic",
  description: `Avaliação CEGA de copy sem contexto de geração.

Problema: Artificial Hivemind (79% similaridade)
Solução: Crítico avalia APENAS o artefato final

Critérios:
1. Impacto Emocional (1-10) - Faz SENTIR ou apenas entender?
2. Especificidade (1-10) - Números, nomes, exemplos concretos?
3. Autenticidade (1-10) - Parece humano ou IA genérica?

Thresholds:
- Média ≥8: APROVADO
- Média 6-7: REVISAR
- Média <6: REFAZER`,
  inputSchema: {
    type: "object" as const,
    properties: {
      copy: {
        type: "string",
        description: "A copy a ser avaliada (texto completo)",
      },
      copy_type: {
        type: "string",
        enum: ["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta"],
        description: "Tipo de copy sendo avaliada",
      },
      offer_id: {
        type: "string",
        description: "ID da oferta para registro histórico",
      },
    },
    required: ["copy", "copy_type"],
  },
};

// Input validation
const InputSchema = z.object({
  copy: z.string().min(10, "Copy muito curta para avaliar"),
  copy_type: z.enum(["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta"]),
  offer_id: z.string().optional(),
});

// Evaluation criteria
interface CriteriaScore {
  score: number;
  observacao: string;
  exemplos?: string[];
}

interface ShameGuiltScore {
  score: number;
  vergonha_presente: boolean;
  culpa_presente: boolean;
  observacao: string;
  exemplos: string[];
}

interface BlindCriticResult {
  impacto_emocional: CriteriaScore;
  especificidade: CriteriaScore;
  autenticidade: CriteriaScore;
  vergonha_culpa: ShameGuiltScore;
  media: number;
  veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  melhorias: string[];
  pontos_fortes: string[];
}

// Analysis functions
function analyzeEmotionalImpact(copy: string): CriteriaScore {
  const emotionalTriggers = [
    // Physical reactions
    { pattern: /arrepi|frio na barriga|coração apert|lágrima|tremeu/gi, weight: 2 },
    { pattern: /medo|terror|pânico|desespero/gi, weight: 1.5 },
    { pattern: /raiva|ódio|revolta|indignação/gi, weight: 1.5 },
    { pattern: /vergonha|humilhação|constrangimento/gi, weight: 1.5 },
    { pattern: /alegria|felicidade|êxtase|euforia/gi, weight: 1.2 },
    { pattern: /esperança|alívio|paz|tranquilidade/gi, weight: 1 },

    // Visceral language
    { pattern: /estômago|coração|peito|garganta/gi, weight: 1.5 },
    { pattern: /acordar.*noite|não consegui dormir|pesadelo/gi, weight: 1.3 },
    { pattern: /chorar|gritar|tremer|suar/gi, weight: 1.3 },

    // Negative patterns (reduce score)
    { pattern: /imagine|pense|considere|reflita/gi, weight: -0.5 },
    { pattern: /importante|fundamental|essencial/gi, weight: -0.3 },
  ];

  let score = 5; // Base score
  const foundPatterns: string[] = [];

  for (const trigger of emotionalTriggers) {
    const matches = copy.match(trigger.pattern);
    if (matches) {
      score += matches.length * trigger.weight;
      if (trigger.weight > 0) {
        foundPatterns.push(matches[0]);
      }
    }
  }

  // Normalize to 1-10
  score = Math.min(10, Math.max(1, score));

  let observacao = "";
  if (score >= 8) {
    observacao = "Copy visceral - gera reação física/emocional imediata";
  } else if (score >= 6) {
    observacao = "Copy emocional moderada - alguns momentos de impacto";
  } else {
    observacao = "Copy cerebral - informa mais do que emociona";
  }

  return {
    score: Math.round(score * 10) / 10,
    observacao,
    exemplos: foundPatterns.slice(0, 3),
  };
}

function analyzeSpecificity(copy: string): CriteriaScore {
  const specificityIndicators = [
    // Numbers
    { pattern: /\d+%|\d+\s*(dias|horas|minutos|kg|pounds|reais|dólares|anos)/gi, weight: 1.5 },
    { pattern: /\d{1,3}(,\d{3})*(\.\d+)?/g, weight: 0.5 },

    // Names and places
    { pattern: /Dr\.|Dra\.|Prof\.|PhD|Harvard|Stanford|MIT/gi, weight: 1 },
    { pattern: /[A-Z][a-z]+\s[A-Z][a-z]+/g, weight: 0.3 }, // Proper names

    // Specific details
    { pattern: /3AM|5 da manhã|meia-noite/gi, weight: 1.2 },
    { pattern: /segunda|terça|quarta|quinta|sexta|janeiro|fevereiro/gi, weight: 0.5 },

    // Concrete examples
    { pattern: /por exemplo|como quando|tipo|igual/gi, weight: 0.8 },
    { pattern: /"[^"]{10,}"/g, weight: 1 }, // Quoted speech

    // Negative patterns (vague language)
    { pattern: /muito|bastante|vários|alguns|diversos/gi, weight: -0.3 },
    { pattern: /talvez|provavelmente|possivelmente/gi, weight: -0.5 },
    { pattern: /sempre|nunca|todo mundo|ninguém/gi, weight: -0.4 },
  ];

  let score = 5;
  const foundExamples: string[] = [];

  for (const indicator of specificityIndicators) {
    const matches = copy.match(indicator.pattern);
    if (matches) {
      score += matches.length * indicator.weight * 0.5;
      if (indicator.weight > 0 && foundExamples.length < 5) {
        foundExamples.push(matches[0]);
      }
    }
  }

  // Normalize
  score = Math.min(10, Math.max(1, score));

  let observacao = "";
  if (score >= 8) {
    observacao = "Alta especificidade - números, nomes, detalhes concretos";
  } else if (score >= 6) {
    observacao = "Especificidade moderada - alguns detalhes, mas pode melhorar";
  } else {
    observacao = "Copy vaga - falta números, exemplos concretos, nomes";
  }

  return {
    score: Math.round(score * 10) / 10,
    observacao,
    exemplos: foundExamples,
  };
}

// Analysis function for Shame/Guilt (BLACK amplifiers)
function analyzeShameGuilt(copy: string): ShameGuiltScore {
  /**
   * Vergonha e Culpa são AMPLIFICADORES de medo no framework BLACK.
   * Copy que usa esses amplificadores converte mais porque:
   * - Vergonha = medo social (o que os outros pensam)
   * - Culpa = medo interno (responsabilidade própria)
   */
  const shamePatterns = [
    { pattern: /vergonha|humilhação|constrangimento|ridículo/gi, weight: 2 },
    { pattern: /olhar.*outros|julgamento|o que.*pensam/gi, weight: 1.5 },
    { pattern: /esconder|disfarçar|camuflar|não contar/gi, weight: 1 },
    { pattern: /piada|risada|deboche|zombaria/gi, weight: 1.5 },
    { pattern: /fraqueza|incompetência|inadequado/gi, weight: 1.5 },
  ];

  const guiltPatterns = [
    { pattern: /culpa|responsabilidade|minha falha|meu erro/gi, weight: 2 },
    { pattern: /deveria ter|poderia ter|se eu tivesse/gi, weight: 1.5 },
    { pattern: /arrependimento|remorso|peso na consciência/gi, weight: 1.5 },
    { pattern: /família.*sofre|filhos.*pagam|esposa.*aguenta/gi, weight: 2 },
    { pattern: /escolhi errado|decisão errada|caminho errado/gi, weight: 1 },
  ];

  let shameScore = 0;
  let guiltScore = 0;
  const foundExamples: string[] = [];

  for (const { pattern, weight } of shamePatterns) {
    const matches = copy.match(pattern);
    if (matches) {
      shameScore += matches.length * weight;
      if (foundExamples.length < 3) {
        foundExamples.push(`Vergonha: "${matches[0]}"`);
      }
    }
  }

  for (const { pattern, weight } of guiltPatterns) {
    const matches = copy.match(pattern);
    if (matches) {
      guiltScore += matches.length * weight;
      if (foundExamples.length < 5) {
        foundExamples.push(`Culpa: "${matches[0]}"`);
      }
    }
  }

  const vergonhaPresente = shameScore >= 2;
  const culpaPresente = guiltScore >= 2;

  // Combined score (1-10)
  const combinedScore = Math.min(10, Math.max(1, (shameScore + guiltScore) * 0.8 + 3));

  let observacao = "";
  if (vergonhaPresente && culpaPresente) {
    observacao = "Amplificadores BLACK ativos - vergonha E culpa presentes";
  } else if (vergonhaPresente) {
    observacao = "Vergonha presente - adicionar culpa para amplificar medo";
  } else if (culpaPresente) {
    observacao = "Culpa presente - adicionar vergonha para amplificar medo";
  } else {
    observacao = "Amplificadores ausentes - copy não usa vergonha/culpa (menos BLACK)";
  }

  return {
    score: Math.round(combinedScore * 10) / 10,
    vergonha_presente: vergonhaPresente,
    culpa_presente: culpaPresente,
    observacao,
    exemplos: foundExamples,
  };
}

function analyzeAuthenticity(copy: string): CriteriaScore {
  const aiPatterns = [
    // Banned words (hivemind)
    { pattern: /elevate|seamless|unlock|leverage|empower|dive into|journey|game-?changer/gi, weight: -1.5 },
    { pattern: /revolucion|transform|cutting-?edge/gi, weight: -1 },

    // AI structures
    { pattern: /in today's.*world|what if I told you|imagine a world/gi, weight: -1.5 },
    { pattern: /introducing|finally.*solution|the secret to/gi, weight: -1 },
    { pattern: /X meets Y/gi, weight: -2 },

    // Overly polished
    { pattern: /\.\.\./g, weight: -0.3 }, // Too many ellipsis
    { pattern: /!{2,}/g, weight: -0.5 }, // Multiple exclamation

    // Human patterns (positive)
    { pattern: /cara|mano|velho|tipo assim|sabe\?|né\?/gi, weight: 1.5 },
    { pattern: /porra|merda|cacete|caramba/gi, weight: 1 }, // Colloquial
    { pattern: /haha|kkkk|rs|kkk/gi, weight: 0.8 },
    { pattern: /aí eu|daí|então|aí/gi, weight: 0.5 },

    // Conversational
    { pattern: /\?{1}[^?]/g, weight: 0.3 }, // Single questions
    { pattern: /você sabe|cê sabe|tu sabe/gi, weight: 0.5 },
  ];

  let score = 6; // Start slightly above neutral
  const aiIndicators: string[] = [];
  const humanIndicators: string[] = [];

  for (const pattern of aiPatterns) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      score += matches.length * pattern.weight * 0.5;
      if (pattern.weight < 0 && aiIndicators.length < 3) {
        aiIndicators.push(matches[0]);
      } else if (pattern.weight > 0 && humanIndicators.length < 3) {
        humanIndicators.push(matches[0]);
      }
    }
  }

  // Normalize
  score = Math.min(10, Math.max(1, score));

  let observacao = "";
  if (score >= 8) {
    observacao = "Voz autêntica - parece humano real, não IA polida";
  } else if (score >= 6) {
    observacao = "Autenticidade mista - alguns traços de IA, mas aceitável";
  } else {
    observacao = "Copy genérica - padrões típicos de IA, falta personalidade";
  }

  return {
    score: Math.round(score * 10) / 10,
    observacao,
    exemplos: aiIndicators.length > 0 ? [`AI: ${aiIndicators.join(", ")}`] : humanIndicators,
  };
}

function generateImprovements(result: BlindCriticResult, copyType: string): string[] {
  const improvements: string[] = [];

  if (result.impacto_emocional.score < 7) {
    improvements.push("Adicionar linguagem visceral (reações físicas, emoções intensas)");
    improvements.push("Identificar qual parte do corpo deve reagir (estômago, coração, mente)");
  }

  if (result.especificidade.score < 7) {
    improvements.push("Incluir números específicos (%, valores, tempo)");
    improvements.push("Adicionar nomes próprios, lugares, datas específicas");
    improvements.push("Substituir 'vários/muitos' por quantidades exatas");
  }

  if (result.autenticidade.score < 7) {
    improvements.push("Remover palavras AI-típicas (seamless, leverage, journey)");
    improvements.push("Adicionar coloquialismos e imperfeições naturais");
    improvements.push("Escrever como conversa, não como texto polido");
  }

  // BLACK: Shame/Guilt amplifiers
  if (!result.vergonha_culpa.vergonha_presente && !result.vergonha_culpa.culpa_presente) {
    improvements.push("Adicionar amplificadores BLACK: vergonha E culpa");
    improvements.push("Vergonha: o que os outros pensam, julgamento social");
    improvements.push("Culpa: responsabilidade própria, 'deveria ter feito'");
  } else if (!result.vergonha_culpa.vergonha_presente) {
    improvements.push("Adicionar vergonha para amplificar medo (julgamento social)");
  } else if (!result.vergonha_culpa.culpa_presente) {
    improvements.push("Adicionar culpa para amplificar medo (responsabilidade)");
  }

  // Type-specific improvements
  if (copyType === "hook" && result.media < 8) {
    improvements.push("Hook precisa de scroll-stop imediato - surpreender nos primeiros 3 segundos");
  }

  if (copyType === "cta" && result.impacto_emocional.score < 8) {
    improvements.push("CTA precisa de urgência visceral, não apenas lógica");
  }

  return improvements;
}

function identifyStrengths(result: BlindCriticResult): string[] {
  const strengths: string[] = [];

  if (result.impacto_emocional.score >= 8) {
    strengths.push("Forte impacto emocional - copy que faz sentir");
  }
  if (result.especificidade.score >= 8) {
    strengths.push("Alta especificidade - detalhes concretos e memoráveis");
  }
  if (result.autenticidade.score >= 8) {
    strengths.push("Voz autêntica - parece humano, não IA");
  }
  if (result.vergonha_culpa.vergonha_presente && result.vergonha_culpa.culpa_presente) {
    strengths.push("Amplificadores BLACK ativos - vergonha E culpa presentes");
  }

  if (result.impacto_emocional.exemplos?.length) {
    strengths.push(`Gatilhos emocionais presentes: ${result.impacto_emocional.exemplos.join(", ")}`);
  }
  if (result.especificidade.exemplos?.length) {
    strengths.push(`Detalhes específicos: ${result.especificidade.exemplos.slice(0, 2).join(", ")}`);
  }

  return strengths;
}

// Main handler
export async function blindCriticHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { copy, copy_type, offer_id } = input;

  // Analyze each criterion
  const impacto_emocional = analyzeEmotionalImpact(copy);
  const especificidade = analyzeSpecificity(copy);
  const autenticidade = analyzeAuthenticity(copy);
  const vergonha_culpa = analyzeShameGuilt(copy);

  // Calculate weighted average (2026 weights with BLACK)
  // Impacto: 30%, Especificidade: 25%, Autenticidade: 30%, Vergonha/Culpa: 15%
  const media = (
    impacto_emocional.score * 0.30 +
    especificidade.score * 0.25 +
    autenticidade.score * 0.30 +
    vergonha_culpa.score * 0.15
  );

  // Determine verdict
  let veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  if (media >= 8) {
    veredicto = "APROVADO";
  } else if (media >= 6) {
    veredicto = "REVISAR";
  } else {
    veredicto = "REFAZER";
  }

  const result: BlindCriticResult = {
    impacto_emocional,
    especificidade,
    autenticidade,
    vergonha_culpa,
    media: Math.round(media * 10) / 10,
    veredicto,
    melhorias: [],
    pontos_fortes: [],
  };

  result.melhorias = generateImprovements(result, copy_type);
  result.pontos_fortes = identifyStrengths(result);

  // Record validation if offer_id provided
  if (offer_id) {
    insertValidation({
      offer_id,
      copy_type,
      emotion_score: impacto_emocional.score,
      logic_score: especificidade.score,
      rmbc_score: autenticidade.score,
      verdict: veredicto,
      improvements: result.melhorias,
    });
  }

  // Format output
  let output = `# Blind Critic - Avaliação Cega (BLACK Framework)

**Tipo:** ${copy_type}
${offer_id ? `**Oferta:** ${offer_id}` : ""}

---

## Scores

| Critério | Score | Peso | Observação |
|----------|-------|------|------------|
| Impacto Emocional | ${impacto_emocional.score}/10 | 30% | ${impacto_emocional.observacao} |
| Especificidade | ${especificidade.score}/10 | 25% | ${especificidade.observacao} |
| Autenticidade | ${autenticidade.score}/10 | 30% | ${autenticidade.observacao} |
| Vergonha/Culpa (BLACK) | ${vergonha_culpa.score}/10 | 15% | ${vergonha_culpa.observacao} |
| **MÉDIA PONDERADA** | **${result.media}/10** | | |

---

## Amplificadores BLACK

| Amplificador | Status | Impacto |
|--------------|--------|---------|
| Vergonha | ${vergonha_culpa.vergonha_presente ? "✅ Presente" : "❌ Ausente"} | Medo social |
| Culpa | ${vergonha_culpa.culpa_presente ? "✅ Presente" : "❌ Ausente"} | Medo interno |

${vergonha_culpa.exemplos.length > 0 ? `**Exemplos encontrados:**\n${vergonha_culpa.exemplos.map((e) => `> ${e}`).join("\n")}\n` : ""}

---

## Veredicto: ${veredicto === "APROVADO" ? "✅" : veredicto === "REVISAR" ? "⚠️" : "❌"} ${veredicto}

`;

  if (result.pontos_fortes.length > 0) {
    output += `### Pontos Fortes

${result.pontos_fortes.map((p) => `- ${p}`).join("\n")}

`;
  }

  if (result.melhorias.length > 0) {
    output += `### Melhorias Necessárias

${result.melhorias.map((m) => `- ${m}`).join("\n")}

`;
  }

  // Add examples found
  if (impacto_emocional.exemplos?.length) {
    output += `### Gatilhos Emocionais Encontrados

${impacto_emocional.exemplos.map((e) => `> "${e}"`).join("\n")}

`;
  }

  // Threshold reminder
  output += `---

### Thresholds (2026)

| Score | Veredicto | Ação |
|-------|-----------|------|
| ≥8 | APROVADO | Pronto para produção |
| 6-7 | REVISAR | Implementar melhorias listadas |
| <6 | REFAZER | Não vale revisar - escrever do zero |

**Nota:** Avaliação CEGA - sem acesso ao briefing ou contexto de geração.
`;

  return output;
}
