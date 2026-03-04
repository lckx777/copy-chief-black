/**
 * Layered Review Tool
 *
 * Implementa revisão em 3 camadas (metodologia Puzzle Pieces / H&W Publishing).
 *
 * Camadas:
 * 1. CUT THE CRAP - Remover o que está atrapalhando
 * 2. VISCERALIDADE - Aumentar impacto emocional
 * 3. REVISÃO FINAL - Como leitor, ler em voz alta
 *
 * "5-10% de corte típico para escritores experientes" - Diogo Ramalho
 */

import { z } from "zod";
import { insertValidation } from "../db/sqlite.js";

// Tool definition
export const layeredReviewTool = {
  name: "layered_review",
  description: `Aplica revisão em 3 camadas na copy (metodologia H&W Publishing).

Camadas:
1. CUT THE CRAP - Remover excesso, deixar só essencial
2. VISCERALIDADE - Frases simples e poderosas, impacto emocional
3. REVISÃO FINAL - Ler como leitor, verificar fluidez

Target: 5-10% de corte para copy madura.
Retorna copy revisada + relatório de mudanças.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      copy: {
        type: "string",
        description: "A copy a ser revisada",
      },
      layer: {
        type: "number",
        minimum: 1,
        maximum: 3,
        description: "Camada de revisão (1=cut_the_crap, 2=visceral, 3=final)",
      },
      copy_type: {
        type: "string",
        enum: ["vsl", "lp", "creative", "email", "hook", "chapter"],
        description: "Tipo de copy",
      },
      offer_id: {
        type: "string",
        description: "ID da oferta para histórico",
      },
    },
    required: ["copy", "layer", "copy_type"],
  },
};

// Input validation
const InputSchema = z.object({
  copy: z.string().min(50, "Copy muito curta para revisar"),
  layer: z.number().min(1).max(3),
  copy_type: z.enum(["vsl", "lp", "creative", "email", "hook", "chapter"]),
  offer_id: z.string().optional(),
});

// Layer configurations
const LAYERS: Record<number, {
  name: string;
  objetivo: string;
  perguntas: string[];
  acoes: string[];
}> = {
  1: {
    name: "CUT THE CRAP",
    objetivo: "Remover o que está atrapalhando, deixar só a base essencial",
    perguntas: [
      "Esta frase adiciona valor ou só ocupa espaço?",
      "Posso dizer a mesma coisa com menos palavras?",
      "Este parágrafo é necessário para a argumentação?",
      "Há repetição que não reforça, só cansa?",
      "Alguma explicação está excessiva?",
    ],
    acoes: [
      "Cortar frases/parágrafos que não agregam",
      "Reduzir explicações longas",
      "Eliminar repetições desnecessárias",
      "Remover palavras vazias (muito, bastante, realmente)",
      "Simplificar estruturas complexas",
    ],
  },
  2: {
    name: "VISCERALIDADE",
    objetivo: "Aumentar impacto emocional com frases simples e poderosas",
    perguntas: [
      "Esta frase IMPACTA ou só informa?",
      "Foi a melhor forma de dizer isso?",
      "Posso trocar por algo mais visceral?",
      "O leitor VAI SENTIR ou só vai entender?",
      "Há momento de surpresa ou só previsibilidade?",
    ],
    acoes: [
      "Trocar verbos fracos por verbos de ação",
      "Adicionar detalhes sensoriais (ver, ouvir, sentir)",
      "Substituir abstrações por exemplos concretos",
      "Quebrar frases longas em curtas e impactantes",
      "Adicionar pausas dramáticas (...)  ",
    ],
  },
  3: {
    name: "REVISÃO FINAL",
    objetivo: "Ler como leitor, verificar fluidez e ajustes finais",
    perguntas: [
      "Desce redondo quando leio em voz alta?",
      "Há algum tropeço na leitura?",
      "O ritmo está adequado (nem monótono, nem frenético)?",
      "Consigo ler sem parar para re-ler?",
      "Como leitor, continuaria até o fim?",
    ],
    acoes: [
      "Ler em voz alta (ou usar IA para ler)",
      "Ajustar pontuação para ritmo natural",
      "Verificar transições entre parágrafos",
      "Checar consistência de tom",
      "Último polish de gramática",
    ],
  },
};

// Analysis patterns for each layer
const CRAP_PATTERNS = [
  // Empty words
  { pattern: /\b(muito|bastante|realmente|absolutamente|totalmente|completamente)\b/gi, type: "empty_word" },
  { pattern: /\b(na verdade|de fato|sinceramente|honestamente)\b/gi, type: "filler" },
  { pattern: /\b(basicamente|literalmente|praticamente)\b/gi, type: "filler" },

  // Redundancy
  { pattern: /\b(cada um|cada uma) d[oa]s\b/gi, type: "verbose" },
  { pattern: /\b(todos os tipos de|todo tipo de)\b/gi, type: "verbose" },
  { pattern: /\b(o fato de que|o fato é que)\b/gi, type: "verbose" },

  // Weak openings
  { pattern: /^(é importante|é fundamental|é essencial)/gim, type: "weak_opening" },
  { pattern: /^(como você sabe|como sabemos|é sabido que)/gim, type: "weak_opening" },

  // Passive voice (Portuguese)
  { pattern: /\b(foi feito|foi realizado|foi criado|foi desenvolvido)\b/gi, type: "passive" },
];

const VISCERAL_IMPROVEMENTS = [
  // Weak verbs → Strong verbs
  { weak: /\bé\b/g, strong: "REPRESENTA/SIGNIFICA/SE TORNA", type: "verb" },
  { weak: /\btem\b/g, strong: "CARREGA/GUARDA/ESCONDE", type: "verb" },
  { weak: /\bfaz\b/g, strong: "EXECUTA/REALIZA/CRIA", type: "verb" },

  // Abstract → Concrete suggestions
  { weak: /\b(problema|dificuldade)\b/gi, suggestion: "Especificar: QUAL problema? Descrever concretamente.", type: "abstract" },
  { weak: /\b(resultado|benefício)\b/gi, suggestion: "Especificar: QUAL resultado? Número, tempo, impacto tangível.", type: "abstract" },
  { weak: /\b(melhora|melhoria)\b/gi, suggestion: "Especificar: de X para Y. Quanto? Como se manifesta?", type: "abstract" },
];

interface LayerAnalysis {
  issues: { text: string; type: string; suggestion: string }[];
  stats: {
    word_count_original: number;
    potential_cuts: number;
    cut_percentage: number;
  };
}

function analyzeLayer1(copy: string): LayerAnalysis {
  const issues: { text: string; type: string; suggestion: string }[] = [];
  let potentialCuts = 0;

  for (const pattern of CRAP_PATTERNS) {
    const matches = copy.match(pattern.pattern);
    if (matches) {
      for (const match of matches) {
        potentialCuts++;
        issues.push({
          text: match,
          type: pattern.type,
          suggestion: getSuggestionForType(pattern.type),
        });
      }
    }
  }

  const wordCount = copy.split(/\s+/).length;

  return {
    issues: issues.slice(0, 20), // Limit to top 20
    stats: {
      word_count_original: wordCount,
      potential_cuts: potentialCuts,
      cut_percentage: Math.round((potentialCuts / wordCount) * 100),
    },
  };
}

function getSuggestionForType(type: string): string {
  const suggestions: Record<string, string> = {
    empty_word: "Remover ou substituir por especificidade",
    filler: "Cortar - não adiciona valor",
    verbose: "Simplificar para forma direta",
    weak_opening: "Abrir com impacto, não com preparação",
    passive: "Trocar para voz ativa",
  };
  return suggestions[type] || "Revisar necessidade";
}

function analyzeLayer2(copy: string): LayerAnalysis {
  const issues: { text: string; type: string; suggestion: string }[] = [];

  for (const pattern of VISCERAL_IMPROVEMENTS) {
    const matches = copy.match(pattern.weak);
    if (matches && matches.length > 2) { // Only flag if multiple occurrences
      issues.push({
        text: matches[0],
        type: pattern.type,
        suggestion: pattern.type === "verb" ? `Considerar: ${pattern.strong}` : pattern.suggestion || "",
      });
    }
  }

  // Check for long sentences (potential for breaking)
  const sentences = copy.split(/[.!?]+/);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 25);

  for (const sentence of longSentences.slice(0, 5)) {
    issues.push({
      text: sentence.substring(0, 50) + "...",
      type: "long_sentence",
      suggestion: "Quebrar em frases menores para maior impacto",
    });
  }

  const wordCount = copy.split(/\s+/).length;

  return {
    issues,
    stats: {
      word_count_original: wordCount,
      potential_cuts: issues.length,
      cut_percentage: 0, // Layer 2 is about improvement, not cuts
    },
  };
}

function analyzeLayer3(copy: string): LayerAnalysis {
  const issues: { text: string; type: string; suggestion: string }[] = [];

  // Check for rhythm issues
  const sentences = copy.split(/[.!?]+/).filter((s) => s.trim());

  // Check for monotonous sentence length
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.abs(b - avgLength), 0) / lengths.length;

  if (variance < 3) {
    issues.push({
      text: "Ritmo monótono",
      type: "rhythm",
      suggestion: "Variar tamanho das frases: curtas para impacto, longas para explicação",
    });
  }

  // Check for transition words
  const transitionWords = /\b(então|portanto|assim|logo|porém|contudo|entretanto|além disso|por isso)\b/gi;
  const transitionCount = (copy.match(transitionWords) || []).length;

  if (transitionCount < sentences.length * 0.1) {
    issues.push({
      text: "Poucas transições",
      type: "flow",
      suggestion: "Adicionar conectivos para melhor fluidez entre ideias",
    });
  }

  // Check for paragraph balance
  const paragraphs = copy.split(/\n\n+/);
  const longParagraphs = paragraphs.filter((p) => p.split(/\s+/).length > 100);

  for (const para of longParagraphs.slice(0, 3)) {
    issues.push({
      text: para.substring(0, 50) + "...",
      type: "long_paragraph",
      suggestion: "Quebrar parágrafo para melhor respiração visual",
    });
  }

  const wordCount = copy.split(/\s+/).length;

  return {
    issues,
    stats: {
      word_count_original: wordCount,
      potential_cuts: 0,
      cut_percentage: 0,
    },
  };
}

// Main handler
export async function layeredReviewHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { copy, layer, copy_type, offer_id } = input;

  const layerConfig = LAYERS[layer];
  if (!layerConfig) {
    return `Camada ${layer} inválida. Use 1-3.`;
  }

  // Analyze based on layer
  let analysis: LayerAnalysis;
  switch (layer) {
    case 1:
      analysis = analyzeLayer1(copy);
      break;
    case 2:
      analysis = analyzeLayer2(copy);
      break;
    case 3:
      analysis = analyzeLayer3(copy);
      break;
    default:
      analysis = analyzeLayer1(copy);
  }

  // Record validation if offer_id provided
  if (offer_id) {
    insertValidation({
      offer_id,
      copy_type: `${copy_type}_layer${layer}`,
      verdict: analysis.issues.length < 5 ? "APROVADO" : "REVISAR",
      improvements: analysis.issues.map((i) => `${i.type}: ${i.suggestion}`),
    });
  }

  // Format output
  let output = `# Layered Review - Camada ${layer}: ${layerConfig.name}

**Tipo:** ${copy_type}
${offer_id ? `**Oferta:** ${offer_id}` : ""}

---

## Objetivo

${layerConfig.objetivo}

---

## Análise

### Estatísticas

| Métrica | Valor |
|---------|-------|
| Palavras | ${analysis.stats.word_count_original} |
| Issues encontrados | ${analysis.issues.length} |
${layer === 1 ? `| Potencial de corte | ${analysis.stats.cut_percentage}% |` : ""}

### Issues Detectados

`;

  if (analysis.issues.length === 0) {
    output += `✅ Nenhum issue significativo encontrado para esta camada.

`;
  } else {
    output += `| # | Texto | Tipo | Sugestão |
|---|-------|------|----------|
`;
    for (let i = 0; i < analysis.issues.length; i++) {
      const issue = analysis.issues[i];
      const truncatedText = issue.text.length > 30 ? issue.text.substring(0, 27) + "..." : issue.text;
      output += `| ${i + 1} | "${truncatedText}" | ${issue.type} | ${issue.suggestion} |\n`;
    }

    output += `
`;
  }

  // Add layer-specific questions
  output += `---

## Perguntas para Auto-avaliação

${layerConfig.perguntas.map((p) => `- [ ] ${p}`).join("\n")}

---

## Ações Recomendadas

${layerConfig.acoes.map((a) => `- [ ] ${a}`).join("\n")}

---

## Próximo Passo

`;

  if (layer < 3) {
    output += `Após completar esta camada, avance para:

\`\`\`
layered_review com layer=${layer + 1}
\`\`\`

**Camada ${layer + 1}: ${LAYERS[layer + 1].name}**
${LAYERS[layer + 1].objetivo}
`;
  } else {
    output += `Esta é a última camada de revisão.

Após completar:
1. ✅ Verificar se todas as 3 camadas foram aplicadas
2. 🎯 Usar \`blind_critic\` para avaliação cega
3. 💪 Usar \`emotional_stress_test\` para validação emocional
4. ✨ Finalizar e salvar em \`production/vsl/final/\`

### Target de Corte

| Escritor | Corte esperado |
|----------|----------------|
| Iniciante | 15-25% |
| Intermediário | 10-15% |
| Experiente | 5-10% |

*"Se não cortar nada, provavelmente não revisou de verdade"* - Diogo Ramalho
`;
  }

  // Summary of 3 layers
  output += `
---

## Resumo das 3 Camadas

| Camada | Nome | Foco |
|--------|------|------|
| 1 | CUT THE CRAP | Remover excesso |
| 2 | VISCERALIDADE | Aumentar impacto |
| 3 | REVISÃO FINAL | Fluidez e polish |

**Metodologia:** H&W Publishing (R$ 2B/ano)
`;

  return output;
}
