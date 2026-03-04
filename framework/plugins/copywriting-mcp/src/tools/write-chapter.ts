/**
 * Write Chapter Tool
 *
 * Implementa escrita por CAPÍTULOS (metodologia Puzzle Pieces / H&W Publishing).
 *
 * Princípio: "IA não consegue escrever bloco inteiro bem"
 * Solução: Cada capítulo = um prompt + refinamento iterativo
 *
 * Estrutura VSL em 6 capítulos:
 * 1. Lead (~2 páginas)
 * 2. Background Story
 * 3. Tese de Mercado
 * 4. Product Buildup
 * 5. Oferta
 * 6. Close
 */

import { z } from "zod";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { updateHelixProgress } from "../db/sqlite.js";

// Tool definition
export const writeChapterTool = {
  name: "write_chapter",
  description: `Escreve um capítulo específico de VSL usando metodologia Puzzle Pieces.

"IA não consegue escrever bloco inteiro bem" - Diogo Ramalho (H&W)

Capítulos:
1. LEAD - Hook + promessa + transição
2. BACKGROUND - História do protagonista
3. TESE - Por que métodos antigos falham
4. BUILDUP - Mecanismo + provas
5. OFERTA - Proposta irresistível
6. CLOSE - Dualidade + urgência + CTA

Retorna prompt estruturado + checklist anti-vícios IA.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      chapter: {
        type: "number",
        minimum: 1,
        maximum: 6,
        description: "Número do capítulo (1-6)",
      },
      offer_path: {
        type: "string",
        description: "Caminho da oferta",
      },
      draft_mode: {
        type: "boolean",
        default: true,
        description: "Se true, salva em draft/. Se false, salva em final/",
      },
      previous_feedback: {
        type: "string",
        description: "Feedback do capítulo anterior para manter consistência",
      },
    },
    required: ["chapter", "offer_path"],
  },
};

// Chapter configuration
const CHAPTERS: Record<number, {
  name: string;
  objetivo: string;
  elementos: string[];
  paginas: string;
  dependencias: string[];
  checklist: string[];
}> = {
  1: {
    name: "LEAD",
    objetivo: "Capturar atenção, estabelecer promessa, criar curiosidade",
    elementos: [
      "Hook (primeiros 3 segundos)",
      "Promessa principal (MUP)",
      "Curiosidade / Loop aberto",
      "Transição para história",
    ],
    paginas: "~2 páginas",
    dependencias: ["fase-05.md (MUP)", "fase-06.md (DRE)"],
    checklist: [
      "Hook surpreende nos primeiros 3 segundos?",
      "Promessa é específica (não genérica)?",
      "Há loop aberto que prende?",
      "Transição é natural?",
    ],
  },
  2: {
    name: "BACKGROUND STORY",
    objetivo: "Criar conexão, estabelecer credibilidade do protagonista",
    elementos: [
      "Apresentação do protagonista",
      "Contexto (quem era antes)",
      "Sinais do problema chegando",
      "Momentos de normalidade (contraste)",
    ],
    paginas: "Variável",
    dependencias: ["fase-07.md (Narrative)", "VOC para linguagem"],
    checklist: [
      "Protagonista é relatável?",
      "Detalhes específicos (não genéricos)?",
      "Linguagem do público (não formal)?",
      "Progressão emocional clara?",
    ],
  },
  3: {
    name: "TESE DE MERCADO",
    objetivo: "Invalidar soluções antigas, criar receptividade para nova solução",
    elementos: [
      "Por que métodos tradicionais falham",
      "Nova descoberta/perspectiva",
      "Validação científica/autoridade",
      "Transição para solução",
      "MECANISMO PROPRIETÁRIO (BLACK)", // Added
    ],
    paginas: "Variável",
    dependencias: ["fase-04.md (Mechanism)", "research/mechanism/"],
    checklist: [
      "Invalida soluções anteriores sem atacar o prospect?",
      "Nova perspectiva é crível?",
      "Há autoridade/ciência?",
      "Cria desejo de conhecer a solução?",
      "Mecanismo tem NOME PROPRIETÁRIO (não genérico)?", // BLACK
      "Mecanismo usa termos reais distorcidos?", // BLACK
    ],
  },
  4: {
    name: "PRODUCT BUILDUP",
    objetivo: "Apresentar solução com desejo crescente",
    elementos: [
      "Mecanismo único (4 camadas)",
      "Prova social intercalada",
      "Benefícios tangíveis",
      "Visualização de resultados",
    ],
    paginas: "Mais longo capítulo",
    dependencias: ["fase-05.md (MUS)", "fase-08.md (Elements)"],
    checklist: [
      "Mecanismo é claro e único?",
      "Provas são específicas (nomes, números)?",
      "Benefícios são tangíveis?",
      "Leitor consegue VISUALIZAR resultado?",
    ],
  },
  5: {
    name: "OFERTA",
    objetivo: "Apresentar proposta irresistível",
    elementos: [
      "Proposta única de valor",
      "Ancoragem de preço",
      "Bônus (universo próprio)",
      "Garantia NOMEADA",
      "Personalização (quiz + dosagem)",
    ],
    paginas: "~2 páginas",
    dependencias: ["fase-06.md (Oferta)", "fase-08.md (Elements)"],
    checklist: [
      "Valor percebido > preço?",
      "Ancoragem é crível?",
      "Bônus agregam (não diluem)?",
      "Garantia tem NOME específico?",
    ],
  },
  6: {
    name: "CLOSE",
    objetivo: "Converter decisão em ação",
    elementos: [
      "Dualidade (duas vidas)",
      "Urgência genuína",
      "Objeções finais",
      "CTA claro e repetido",
      "FEAR HIERARCHY níveis 4-5 (BLACK)", // Added
    ],
    paginas: "~1-2 páginas",
    dependencias: ["fase-06.md (Close)", "fase-08.md"],
    checklist: [
      "Dualidade é visceral (não lógica)?",
      "Urgência é genuína (não fake)?",
      "Principais objeções são tratadas?",
      "CTA é claro e repetido?",
      "Take rate target: 70%+ no 6 potes?",
      "Vida A ativa Fear Hierarchy níveis 4-5?", // BLACK
      "Prospect sente medo NO CORPO, não só na mente?", // BLACK
    ],
  },
};

// Anti-vices checklist (H&W methodology)
const ANTI_VICES_CHECKLIST = [
  "Conversa > leiturabilidade (PRINCIPAL VÍCIO IA)",
  "Frases simples e poderosas",
  "Sem palavras genéricas (elevate, seamless, unlock)",
  "Sem 'In today's [adjetivo] world'",
  "Fluidez - desce redondo?",
  "Sem excesso de vírgulas",
  "Parágrafos curtos (1-3 linhas)",
  "Sem repetição de estruturas",
];

// BLACK Framework templates
const BLACK_TEMPLATES = {
  mechanism: `
## Template de Mecanismo BLACK

**Fórmula:** [ÓRGÃO/SISTEMA] + [PROCESSO CIENTÍFICO] + [CAUSA OCULTA]

**Exemplos por Nicho:**
| Nicho | Mecanismo |
|-------|-----------|
| Emagrecimento | "Bloqueio da Leptina causado pelo Cortisol Crônico" |
| ED | "Obstrução do Óxido Nítrico por Calcificação Arterial" |
| Concursos | "Fragmentação do Hipocampo por Estudo Ineficiente" |
| Diabetes | "Resposta Pancreática Invertida por Resistência Insulínica" |

**Checklist Mecanismo BLACK:**
- [ ] Nome PROPRIETÁRIO (não genérico)
- [ ] Termos REAIS distorcidos (parece científico)
- [ ] EXPLICA por que outras soluções falharam
- [ ] Cria URGÊNCIA (se não tratar, piora)
`,

  fearFirst: `
## Fear-First Writing (BLACK Framework)

**Ordem obrigatória:**
1. MEDO (prospect "sua") - Fear Hierarchy níveis 4-5
2. AMPLIFICADORES (vergonha, culpa)
3. ESPERANÇA (solução existe)
4. URGÊNCIA (agir agora)

**Fear Hierarchy - 5 Níveis:**
| Nível | Tipo | Exemplo |
|-------|------|---------|
| 1 | Curto prazo | "Vergonha na frente dos colegas" |
| 2 | Médio prazo | "Carreira estagnada por anos" |
| 3 | Longo prazo | "Nunca conseguir estabilidade" |
| 4 | Relacional | "Decepcionar sua família" |
| 5 | Identidade | "Se tornar um fracassado" |

**Copy BLACK deve ativar níveis 4 ou 5.**

**Dualidade no Close:**
Vida A (continuar como está) → MEDO VISCERAL
Vida B (após a solução) → ESPERANÇA ESPECÍFICA

> "Copy confortável = Copy que FALHOU"
`,

  specificityChecklist: `
## Checklist de Especificidade BLACK (8 itens)

| # | Critério | Genérico (❌) | Específico (✅) |
|---|----------|---------------|-----------------|
| 1 | Nome | "pessoas", "clientes" | "Dona Maria, de Goiânia" |
| 2 | Idade | "adultos", "mulheres" | "47 anos" |
| 3 | Localização | "todo Brasil" | "bairro Setor Bueno, Goiânia" |
| 4 | Profissão | "empresário" | "dona de salão de beleza" |
| 5 | Número | "90%", "milhares" | "87.3%", "2.847 pessoas" |
| 6 | Data | "recentemente" | "14 de março de 2024" |
| 7 | Resultado | "melhorou" | "pressão foi de 180/120 para 124/81" |
| 8 | Sensorial | Ausente | "acordou às 3AM suando frio" |

**Score = Total de ✅. Threshold: ≥6 para aprovar.**
`,
};

// Input validation
const InputSchema = z.object({
  chapter: z.number().min(1).max(6),
  offer_path: z.string(),
  draft_mode: z.boolean().default(true),
  previous_feedback: z.string().optional(),
});

// Load briefing context
function loadChapterContext(basePath: string, chapter: number): string {
  const config = CHAPTERS[chapter];
  let context = "";

  for (const dep of config.dependencias) {
    let filePath: string;

    if (dep.includes("/")) {
      // Directory path
      filePath = path.join(basePath, dep.split("/")[0], dep.split("/")[1] || "summary.md");
    } else {
      // File in briefings/phases/
      filePath = path.join(basePath, "briefings/phases", dep);
    }

    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, "utf-8");
        context += `\n\n## ${dep}\n\n${content.substring(0, 3000)}`;
      } catch {
        // Ignore errors
      }
    }
  }

  return context;
}

// Generate chapter prompt
function generateChapterPrompt(chapter: number, context: string, previousFeedback?: string): string {
  const config = CHAPTERS[chapter];

  // Add BLACK templates for specific chapters
  let blackSection = "";
  if (chapter === 3) {
    blackSection = `
---

${BLACK_TEMPLATES.mechanism}
${BLACK_TEMPLATES.specificityChecklist}
`;
  } else if (chapter === 6) {
    blackSection = `
---

${BLACK_TEMPLATES.fearFirst}
`;
  }

  let prompt = `# Escreva o Capítulo ${chapter}: ${config.name}

## Objetivo
${config.objetivo}

## Elementos Obrigatórios
${config.elementos.map((e) => `- ${e}`).join("\n")}

## Tamanho
${config.paginas}

## Contexto do Briefing
${context || "*Contexto não carregado - verificar dependências*"}

---

## ANTI-VÍCIOS IA (CRÍTICO)

Você DEVE escrever como CONVERSA, não como texto polido para leitura.

### Proibido:
- Palavras: elevate, seamless, unlock, leverage, journey, game-changer
- Estruturas: "In today's [adjetivo] world", "What if I told you"
- Metáforas: jornadas, rios, luz
- Aberturas: "Imagine...", "Picture this...", "Have you ever..."

### Obrigatório:
- Frases curtas e poderosas
- Linguagem coloquial (como fala, não como escreve)
- Números específicos (não "vários", "muitos")
- Nomes próprios quando possível
- Imperfeições naturais da fala

---

## CHECKLIST DE QUALIDADE

Antes de entregar, verificar:

${config.checklist.map((c) => `- [ ] ${c}`).join("\n")}

---

`;

  if (previousFeedback) {
    prompt += `## Feedback do Capítulo Anterior

${previousFeedback}

Manter consistência de tom e estilo com capítulo anterior.

---

`;
  }

  prompt += `${blackSection}

## Output Esperado

Escreva o capítulo completo abaixo. Após escrever, auto-avalie usando o checklist.

### Capítulo ${chapter}: ${config.name}

[Seu texto aqui]

---

### Auto-avaliação

| Critério | Status |
|----------|--------|
${config.checklist.map((c) => `| ${c} | [ ] |`).join("\n")}

### Anti-vícios

| Vício | Encontrado? |
|-------|-------------|
${ANTI_VICES_CHECKLIST.map((v) => `| ${v} | [ ] |`).join("\n")}
`;

  return prompt;
}

// Main handler
export async function writeChapterHandler(args: unknown): Promise<string> {
  const input = InputSchema.parse(args);
  const { chapter, offer_path, draft_mode, previous_feedback } = input;

  const config = CHAPTERS[chapter];
  if (!config) {
    return `Capítulo ${chapter} inválido. Use 1-6.`;
  }

  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerBase = path.join(ecosystemBase, offer_path);

  if (!existsSync(offerBase)) {
    return `Oferta não encontrada: ${offer_path}`;
  }

  // Load context from briefings
  const context = loadChapterContext(offerBase, chapter);

  // Generate the prompt
  const prompt = generateChapterPrompt(chapter, context, previous_feedback);

  // Create output directory
  const outputDir = path.join(offerBase, "production/vsl", draft_mode ? "draft" : "final");
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save the prompt as a reference
  const promptPath = path.join(outputDir, `cap${chapter}-prompt.md`);
  writeFileSync(promptPath, prompt);

  // Update HELIX progress
  updateHelixProgress({
    offer_id: offer_path,
    phase: 10,
    status: "in_progress",
    notes: `Escrevendo capítulo ${chapter}: ${config.name}`,
  });

  // Return the structured output
  let output = `# Write Chapter ${chapter}: ${config.name}

**Oferta:** ${offer_path}
**Modo:** ${draft_mode ? "Draft" : "Final"}
**Tamanho esperado:** ${config.paginas}

---

## Prompt Salvo

\`${promptPath}\`

---

## Workflow

### 1. Revisar Dependências

${config.dependencias.map((d) => {
  const exists = existsSync(path.join(offerBase, d.includes("/") ? d : `briefings/phases/${d}`));
  return `- ${exists ? "✅" : "❌"} \`${d}\``;
}).join("\n")}

### 2. Usar o Prompt

Copie o prompt abaixo e use para gerar o capítulo:

\`\`\`
${prompt.substring(0, 2000)}...
\`\`\`

### 3. Após Escrever

1. Verificar checklist de qualidade
2. Verificar anti-vícios IA
3. Salvar em: \`${outputDir}/cap${chapter}.md\`
4. Usar \`layered_review\` para revisão em 3 camadas

---

## Elementos Obrigatórios

${config.elementos.map((e) => `- [ ] ${e}`).join("\n")}

---

## Checklist de Qualidade

${config.checklist.map((c) => `- [ ] ${c}`).join("\n")}

---

## Anti-Vícios IA

${ANTI_VICES_CHECKLIST.map((v) => `- [ ] ${v}`).join("\n")}

---

## Próximo Capítulo

${chapter < 6
  ? `Após concluir, use:\n\`write_chapter\` com chapter=${chapter + 1}\n\nPassar feedback do capítulo atual para manter consistência.`
  : "Este é o último capítulo. Após concluir:\n1. `layered_review` para revisão em 3 camadas\n2. `blind_critic` para avaliação cega\n3. `emotional_stress_test` para validação emocional"
}
`;

  return output;
}
