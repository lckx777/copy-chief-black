/**
 * BLACK Validation Tool
 *
 * Valida copy contra o framework BLACK (v6.4).
 *
 * 6 Gates de Validação:
 * 1. Especificidade - Nomes, idades, números específicos
 * 2. Mecanismo Proprietário - Nome único para o mecanismo
 * 3. Medo Visceral - Fear Hierarchy níveis 4-5
 * 4. Narrativa Coerente - História consistente
 * 5. Zero Hesitação - Linguagem absoluta
 * 6. Exclusividade Tribal - Pertencimento a grupo seleto
 *
 * Threshold: Score ≥8 para aprovação BLACK
 */

import { z } from "zod";
import { insertValidation } from "../db/sqlite.js";

// Tool definition
export const blackValidationTool = {
  name: "black_validation",
  description: `Valida copy contra o framework BLACK (6 gates).

Gates:
1. ESPECIFICIDADE - Nomes, idades, cidades, números com decimais
2. MECANISMO - Nome proprietário (não genérico)
3. MEDO VISCERAL - Fear Hierarchy níveis 4-5 (relacional/identidade)
4. NARRATIVA - História coerente consigo mesma
5. ZERO HESITAÇÃO - Linguagem absoluta, sem "talvez"
6. EXCLUSIVIDADE - Pertencimento tribal, grupo seleto

Threshold: Score ≥8 para aprovação BLACK.
Gates 1-3 são BLOCKING (falha = auto-REFAZER).`,
  inputSchema: {
    type: "object" as const,
    properties: {
      copy: {
        type: "string",
        description: "A copy a ser validada",
      },
      copy_type: {
        type: "string",
        enum: ["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta", "chapter"],
        description: "Tipo de copy",
      },
      nicho: {
        type: "string",
        description: "Nicho da oferta para contexto",
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
  copy: z.string().min(50, "Copy muito curta para validar BLACK"),
  copy_type: z.enum(["hook", "lead", "vsl", "lp", "creative", "email", "headline", "cta", "chapter"]),
  nicho: z.string().optional(),
  offer_id: z.string().optional(),
});

// Gate configuration
interface GateConfig {
  name: string;
  description: string;
  blocking: boolean;
  checklistItems: string[];
  patterns: { pattern: RegExp; weight: number; type: "positive" | "negative" }[];
}

const BLACK_GATES: GateConfig[] = [
  {
    name: "Especificidade",
    description: "Nomes, idades, cidades, números específicos com decimais",
    blocking: true,
    checklistItems: [
      "Tem NOME próprio (não 'pessoas', 'clientes')",
      "Tem IDADE específica",
      "Tem CIDADE menor (não 'todo Brasil')",
      "Tem PROFISSÃO específica (não 'empresário')",
      "Tem NÚMERO não-redondo (87.3%, não 90%)",
      "Tem DATA específica (14 de março, não 'recentemente')",
      "Tem RESULTADO com métrica (pressão 124/81, não 'melhorou')",
      "Tem DETALHE SENSORIAL (o que sentiu/viu/ouviu)",
    ],
    patterns: [
      { pattern: /\d{1,2}\s*(anos|meses|dias)/gi, weight: 1, type: "positive" },
      { pattern: /[A-Z][a-záéíóú]+\s[A-Z][a-záéíóú]+/g, weight: 0.5, type: "positive" }, // Names
      { pattern: /\d+,\d+%|\d+\.\d+/g, weight: 1.5, type: "positive" }, // Precise decimals
      { pattern: /Dr\.|Dra\.|Prof\./gi, weight: 1, type: "positive" },
      { pattern: /Goiânia|Fortaleza|Salvador|Curitiba|Porto Alegre/gi, weight: 1, type: "positive" }, // Cities
      { pattern: /janeiro|fevereiro|março|abril|maio|junho/gi, weight: 0.5, type: "positive" },
      { pattern: /\d{1,2}\s*de\s*(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/gi, weight: 1.5, type: "positive" },
      { pattern: /pessoas|clientes|usuários/gi, weight: -0.5, type: "negative" }, // Generic
      { pattern: /vários|muitos|alguns|diversos/gi, weight: -0.5, type: "negative" },
    ],
  },
  {
    name: "Mecanismo Proprietário",
    description: "Nome único que parece científico mas é inventado",
    blocking: true,
    checklistItems: [
      "Mecanismo tem NOME PROPRIETÁRIO",
      "Usa TERMOS REAIS distorcidos (pâncreas, cortisol, hipocampo)",
      "EXPLICA o problema de forma plausível",
      "Cria URGÊNCIA (se não tratar, piora)",
      "JUSTIFICA por que outras soluções falharam",
    ],
    patterns: [
      { pattern: /[A-Z][a-záéíóú]+\s(Method|Protocol|System|Technique|Método|Protocolo|Sistema|Técnica)/g, weight: 2, type: "positive" },
      { pattern: /truque\s+d[aeo]\s+\w+/gi, weight: 2, type: "positive" },
      { pattern: /resposta\s+\w+|bloqueio\s+\w+|ativação\s+\w+/gi, weight: 1.5, type: "positive" },
      { pattern: /cortisol|insulina|hormônio|enzima|receptor|neurônio/gi, weight: 1, type: "positive" },
      { pattern: /pâncreas|hipocampo|hipotálamo|tireoide|adrenal/gi, weight: 1, type: "positive" },
      { pattern: /método comprovado|sistema simples|técnica fácil/gi, weight: -1, type: "negative" }, // Generic
    ],
  },
  {
    name: "Medo Visceral (Fear Hierarchy)",
    description: "Ativa níveis 4-5: medo relacional ou de identidade",
    blocking: true,
    checklistItems: [
      "Ativa medo de CURTO PRAZO (constrangimento imediato)",
      "Ativa medo de LONGO PRAZO (consequência permanente)",
      "Ativa medo de IDENTIDADE (quem você se torna)",
      "Prospect consegue SE VER na situação",
      "Copy deixa prospect 'suado' (desconforto físico)",
    ],
    patterns: [
      // Level 4: Relational
      { pattern: /família|filhos?|esposa?|marido|pais|mãe|pai/gi, weight: 2, type: "positive" },
      { pattern: /decepcionar|abandonar|deixar na mão/gi, weight: 2, type: "positive" },
      { pattern: /olhar nos olhos|encarar|explicar para/gi, weight: 1.5, type: "positive" },
      { pattern: /dependem de (mim|você)|contam com/gi, weight: 2, type: "positive" },
      // Level 5: Identity
      { pattern: /fracassado|perdedor|incapaz|impotente|fraco/gi, weight: 2.5, type: "positive" },
      { pattern: /quem você é|tipo de pessoa|se tornar|virar/gi, weight: 2.5, type: "positive" },
      { pattern: /história|legado|memória|lembrar/gi, weight: 1.5, type: "positive" },
      { pattern: /morrer sem|viver sem|nunca conseguir/gi, weight: 2, type: "positive" },
      // Physical reactions
      { pattern: /suor|tremor|frio na barriga|coração apert/gi, weight: 1.5, type: "positive" },
      { pattern: /acordar.*noite|3AM|madrugada/gi, weight: 1.5, type: "positive" },
    ],
  },
  {
    name: "Narrativa Coerente",
    description: "História consistente consigo mesma, não com realidade",
    blocking: false,
    checklistItems: [
      "Todos os claims servem ao MESMO mecanismo",
      "Não há CONTRADIÇÕES internas",
      "Cadeia lógica: Problema → Mecanismo → Solução → Urgência",
      "Narrativa é recontada múltiplas vezes com variações",
    ],
    patterns: [
      { pattern: /primeiro|depois|então|quando|até que|finalmente/gi, weight: 0.5, type: "positive" },
      { pattern: /por isso|por causa|devido a|graças a/gi, weight: 0.5, type: "positive" },
      { pattern: /descobri|percebi|entendi|aprendi/gi, weight: 0.5, type: "positive" },
      { pattern: /mas|porém|contudo|entretanto/gi, weight: 0.3, type: "positive" }, // Transitions
    ],
  },
  {
    name: "Zero Hesitação",
    description: "Linguagem absoluta, zero 'pode ser', 'talvez'",
    blocking: false,
    checklistItems: [
      "ZERO 'pode ser', 'talvez', 'sob certas condições'",
      "ZERO marketing speak ('inovador', 'revolucionário')",
      "Linguagem ABSOLUTA ('você vai', 'é garantido')",
      "Expert SABE, não 'acha' ou 'acredita'",
    ],
    patterns: [
      // Negative (hesitation)
      { pattern: /pode ser|talvez|provavelmente|possivelmente/gi, weight: -2, type: "negative" },
      { pattern: /sob certas condições|em alguns casos|às vezes/gi, weight: -2, type: "negative" },
      { pattern: /acho que|acredito que|penso que/gi, weight: -1.5, type: "negative" },
      { pattern: /inovador|revolucionário|único|exclusivo/gi, weight: -1, type: "negative" }, // Marketing speak
      // Positive (absolute)
      { pattern: /vai|é|funciona|garante|sempre|nunca/gi, weight: 0.5, type: "positive" },
      { pattern: /comprovado|testado|verificado/gi, weight: 0.3, type: "positive" },
    ],
  },
  {
    name: "Exclusividade Tribal",
    description: "Pertencimento a grupo seleto que 'descobriu'",
    blocking: false,
    checklistItems: [
      "Posiciona prospect como parte de grupo SELETO",
      "'A maioria não sabe, mas você...'",
      "Senso de DESCOBERTA SECRETA",
      "Inimigo externo identificado (indústria, médicos, sistema)",
    ],
    patterns: [
      { pattern: /pessoas como você|você que|para quem/gi, weight: 1.5, type: "positive" },
      { pattern: /seleto|exclusiv|poucos|elite|vip/gi, weight: 1, type: "positive" },
      { pattern: /a maioria não sabe|segredo|descobriram/gi, weight: 1.5, type: "positive" },
      { pattern: /eles não querem|indústria|Big Pharma|sistema/gi, weight: 1.5, type: "positive" },
      { pattern: /escondido|censurado|proibido|não falam/gi, weight: 1, type: "positive" },
      { pattern: /nós|nosso|comunidade|grupo|tribo/gi, weight: 0.5, type: "positive" },
    ],
  },
];

interface GateResult {
  name: string;
  score: number;
  passed: boolean;
  blocking: boolean;
  checklist: { item: string; status: "✅" | "❌" | "⚠️" }[];
  feedback: string;
}

interface BlackValidationResult {
  gates: GateResult[];
  total_score: number;
  gates_passed: number;
  blocking_failed: boolean;
  veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  acoes_prioritarias: string[];
}

function evaluateGate(copy: string, gate: GateConfig): GateResult {
  let score = 5; // Base score

  for (const { pattern, weight, type } of gate.patterns) {
    const matches = copy.match(pattern);
    if (matches) {
      if (type === "positive") {
        score += matches.length * weight * 0.3;
      } else {
        score += matches.length * weight * 0.5; // Negative patterns have more impact
      }
    }
  }

  // Normalize to 1-10
  score = Math.min(10, Math.max(1, score));
  const passed = score >= 7;

  // Evaluate checklist (simplified - based on patterns found)
  const checklist = gate.checklistItems.map((item) => {
    // Simple heuristic: if score is high, most items pass
    const status = score >= 8 ? "✅" : score >= 6 ? "⚠️" : "❌";
    return { item, status: status as "✅" | "❌" | "⚠️" };
  });

  let feedback = "";
  if (passed) {
    feedback = `Gate aprovado: ${gate.description}`;
  } else if (gate.blocking) {
    feedback = `🔴 BLOCKING: ${gate.description} - OBRIGATÓRIO para copy BLACK`;
  } else {
    feedback = `⚠️ Pode melhorar: ${gate.description}`;
  }

  return {
    name: gate.name,
    score: Math.round(score * 10) / 10,
    passed,
    blocking: gate.blocking,
    checklist,
    feedback,
  };
}

function generatePriorityActions(result: BlackValidationResult): string[] {
  const actions: string[] = [];

  // Blocking gates first
  for (const gate of result.gates.filter((g) => g.blocking && !g.passed)) {
    switch (gate.name) {
      case "Especificidade":
        actions.push("🔴 CRÍTICO: Adicionar nomes próprios, idades, cidades, números com decimais");
        actions.push("Trocar 'pessoas' por 'Maria, 47 anos, de Goiânia'");
        actions.push("Trocar '90%' por '87.3%'");
        break;
      case "Mecanismo Proprietário":
        actions.push("🔴 CRÍTICO: Criar nome proprietário para o mecanismo");
        actions.push("Usar fórmula: [Órgão] + [Processo] + [Causa]");
        actions.push("Exemplo: 'Bloqueio do Hipocampo causado pelo Cortisol Crônico'");
        break;
      case "Medo Visceral (Fear Hierarchy)":
        actions.push("🔴 CRÍTICO: Ativar Fear Hierarchy níveis 4-5");
        actions.push("Adicionar medo de decepcionar família (nível 4)");
        actions.push("Adicionar medo de quem você se torna (nível 5)");
        actions.push("Prospect deve SUAR ao ler");
        break;
    }
  }

  // Non-blocking gates
  for (const gate of result.gates.filter((g) => !g.blocking && !g.passed)) {
    switch (gate.name) {
      case "Narrativa Coerente":
        actions.push("Verificar se todos os claims servem ao mesmo mecanismo");
        actions.push("Adicionar transições (por isso, devido a, graças a)");
        break;
      case "Zero Hesitação":
        actions.push("Remover 'pode ser', 'talvez', 'provavelmente'");
        actions.push("Usar linguagem absoluta: 'vai', 'é', 'garante'");
        break;
      case "Exclusividade Tribal":
        actions.push("Adicionar 'pessoas como você'");
        actions.push("Identificar inimigo externo (indústria, sistema)");
        break;
    }
  }

  return actions;
}

// Main handler
export async function blackValidationHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { copy, copy_type, nicho, offer_id } = input;

  // Evaluate all gates
  const gateResults = BLACK_GATES.map((gate) => evaluateGate(copy, gate));

  // Calculate totals
  const totalScore = gateResults.reduce((sum, g) => sum + g.score, 0) / gateResults.length;
  const gatesPassed = gateResults.filter((g) => g.passed).length;
  const blockingFailed = gateResults.some((g) => g.blocking && !g.passed);

  // Determine verdict
  let veredicto: "APROVADO" | "REVISAR" | "REFAZER";
  if (blockingFailed) {
    veredicto = "REFAZER";
  } else if (totalScore >= 8 && gatesPassed >= 5) {
    veredicto = "APROVADO";
  } else if (totalScore >= 6) {
    veredicto = "REVISAR";
  } else {
    veredicto = "REFAZER";
  }

  const result: BlackValidationResult = {
    gates: gateResults,
    total_score: Math.round(totalScore * 10) / 10,
    gates_passed: gatesPassed,
    blocking_failed: blockingFailed,
    veredicto,
    acoes_prioritarias: [],
  };

  result.acoes_prioritarias = generatePriorityActions(result);

  // Record validation if offer_id provided
  if (offer_id) {
    insertValidation({
      offer_id,
      copy_type: `${copy_type}_black`,
      verdict: veredicto,
      genericidade_score: gateResults.find((g) => g.name === "Especificidade")?.score,
      visceral_score: gateResults.find((g) => g.name === "Medo Visceral (Fear Hierarchy)")?.score,
      improvements: result.acoes_prioritarias,
    });
  }

  // Format output
  let output = `# BLACK Validation - Framework v6.4

**Tipo:** ${copy_type}
${nicho ? `**Nicho:** ${nicho}` : ""}
${offer_id ? `**Oferta:** ${offer_id}` : ""}

---

## Resultado Geral

| Métrica | Valor |
|---------|-------|
| **Score Total** | ${result.total_score}/10 |
| **Gates Aprovados** | ${result.gates_passed}/6 |
| **Blocking Failed** | ${result.blocking_failed ? "❌ SIM" : "✅ NÃO"} |

## Veredicto: ${veredicto === "APROVADO" ? "✅" : veredicto === "REVISAR" ? "⚠️" : "❌"} ${veredicto}

${veredicto === "REFAZER" ? "> **Copy confortável = Copy que FALHOU.**" : ""}

---

## 6 Gates BLACK

`;

  for (const gate of result.gates) {
    const emoji = gate.passed ? "✅" : gate.blocking ? "❌" : "⚠️";
    const status = gate.passed ? "PASSED" : gate.blocking ? "BLOCKED" : "REVISAR";

    output += `### ${emoji} Gate ${result.gates.indexOf(gate) + 1}: ${gate.name} ${gate.blocking ? "(BLOCKING)" : ""}

| Score | Status |
|-------|--------|
| **${gate.score}/10** | ${status} |

${gate.feedback}

**Checklist:**
${gate.checklist.map((c) => `- ${c.status} ${c.item}`).join("\n")}

---

`;
  }

  // Priority actions
  if (result.acoes_prioritarias.length > 0) {
    output += `## Ações Prioritárias

${result.acoes_prioritarias.map((a) => `- ${a}`).join("\n")}

---

`;
  }

  // Framework reference
  output += `## Framework BLACK

| Princípio | Descrição |
|-----------|-----------|
| **Fear-First** | Medo é o driver primário. Esperança vem DEPOIS. |
| **Visceral > Lógico** | Copy deve fazer o corpo reagir, não só a mente entender. |
| **Específico = Credível** | Detalhes inventados com precisão > verdades genéricas. |
| **Zero Hesitação** | Nada de "pode ser", "talvez". Linguagem ABSOLUTA. |
| **Exclusividade Tribal** | Prospect é parte de grupo seleto que "descobriu". |

---

### Pergunta Final (Antes de Aprovar)

> "Se eu mostrar esta copy para o avatar mais cético do nicho,
> ele vai sentir o medo no corpo ou vai rolar os olhos?"
>
> Rolar os olhos = REFAZER

---

*BLACK Framework v6.4 - Copywriting Ecosystem*
`;

  return output;
}
