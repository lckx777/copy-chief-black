#!/usr/bin/env node
/**
 * Copywriting MCP Server
 *
 * Plugin especializado para Direct Response Copywriting.
 * Integra com HELIX System e implementa patterns das pesquisas profundas.
 *
 * Stack: 100% local, custo zero
 * - SQLite + sqlite-vec (vector storage)
 * - FastEmbed (local embeddings)
 * - FSRS-6 memory decay (Vestige pattern)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { initDatabase, getDb } from "./db/sqlite.js";
import { vocSearchTool, vocSearchHandler } from "./tools/voc-search.js";
import { phaseContextTool, phaseContextHandler } from "./tools/phase-context.js";
import { validateGateTool, validateGateHandler } from "./tools/validate-gate.js";
import { blindCriticTool, blindCriticHandler } from "./tools/blind-critic.js";
import { emotionalStressTestTool, emotionalStressTestHandler } from "./tools/emotional-stress-test.js";
import { writeChapterTool, writeChapterHandler } from "./tools/write-chapter.js";
import { layeredReviewTool, layeredReviewHandler } from "./tools/layered-review.js";
import { blackValidationTool, blackValidationHandler } from "./tools/black-validation.js";
import { mecanismoUnicoTools, mecanismoUnicoHandlers } from "./tools/mecanismo-unico.js";
import { semanticMemorySearchTool, semanticMemorySearchHandler } from "./tools/semantic-memory-search.js";

const VERSION = "2.1.0";
const SERVER_NAME = "copywriting-mcp";

// Tool registry
const TOOLS = [
  vocSearchTool,
  phaseContextTool,
  validateGateTool,
  blindCriticTool,
  emotionalStressTestTool,
  writeChapterTool,
  layeredReviewTool,
  blackValidationTool,
  ...mecanismoUnicoTools,
  semanticMemorySearchTool,
];

// Tool handlers map
const TOOL_HANDLERS: Record<string, (args: any) => Promise<any>> = {
  voc_search: vocSearchHandler,
  get_phase_context: phaseContextHandler,
  validate_gate: validateGateHandler,
  blind_critic: blindCriticHandler,
  emotional_stress_test: emotionalStressTestHandler,
  write_chapter: writeChapterHandler,
  layered_review: layeredReviewHandler,
  black_validation: blackValidationHandler,
  ...mecanismoUnicoHandlers,
  semantic_memory_search: semanticMemorySearchHandler,
};

async function main() {
  // Initialize database
  await initDatabase();

  const server = new Server(
    {
      name: SERVER_NAME,
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const handler = TOOL_HANDLERS[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      const result = await handler(args);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // List resources (briefings, templates, etc.)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: "copywriting://templates/puzzle-pieces",
          name: "Puzzle Pieces Template",
          description: "Template dos 20+ elementos do briefing (metodologia H&W)",
          mimeType: "text/markdown",
        },
        {
          uri: "copywriting://templates/vsl-chapters",
          name: "VSL Chapters Template",
          description: "Estrutura de 6 capítulos para VSL",
          mimeType: "text/markdown",
        },
        {
          uri: "copywriting://prompts/blind-critic",
          name: "Blind Critic Prompt",
          description: "Prompt para avaliação cega de copy",
          mimeType: "text/markdown",
        },
        {
          uri: "copywriting://prompts/emotional-stress",
          name: "Emotional Stress Test Prompt",
          description: "Prompt dos 4 testes emocionais",
          mimeType: "text/markdown",
        },
        {
          uri: "copywriting://prompts/anti-hivemind",
          name: "Anti-Hivemind Constraints",
          description: "Restrições para evitar copy genérica",
          mimeType: "text/markdown",
        },
      ],
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    const resourceHandlers: Record<string, () => string> = {
      "copywriting://templates/puzzle-pieces": () => getPuzzlePiecesTemplate(),
      "copywriting://templates/vsl-chapters": () => getVslChaptersTemplate(),
      "copywriting://prompts/blind-critic": () => getBlindCriticPrompt(),
      "copywriting://prompts/emotional-stress": () => getEmotionalStressPrompt(),
      "copywriting://prompts/anti-hivemind": () => getAntiHivemindConstraints(),
    };

    const handler = resourceHandlers[uri];
    if (!handler) {
      throw new Error(`Unknown resource: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: handler(),
        },
      ],
    };
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`${SERVER_NAME} v${VERSION} started`);
}

// Template functions (inline for MVP, will be moved to files later)
function getPuzzlePiecesTemplate(): string {
  return `# Puzzle Pieces Template (H&W Publishing)

> Documento de 50-90 páginas com 20+ elementos mapeados.
> "8020" = tudo que precisa saber para escrever.

---

## BLOCO 1: Psicologia do Nicho

### Lifetime Eight (Cash Advertising)
| Força | Presente no Público? | Como se manifesta? |
|-------|---------------------|-------------------|
| Survive | | |
| Approval | | |
| Comfort | | |
| Safety | | |
| Pleasure | | |
| Love | | |
| Growth | | |
| Fear | | |

### Motivação Primária
> A força DOMINANTE que move este público:

### Desejos que essa motivação causa
1.
2.
3.

### Problemas Tangíveis
> Como afeta o dia a dia CONCRETAMENTE:
1.
2.
3.

### Estado Emocional
> Como se SENTEM (frustração, vergonha, culpa, medo):

---

## BLOCO 2: Formato, Tom, Personagens

### FORMATO
| Formato | Usar? | Justificativa |
|---------|-------|---------------|
| One Person (câmera direta) | | |
| One Person + Guru | | |
| Docrama (encenação) | | |
| Podcast / Entrevista | | |
| Programa de TV | | |
| Documentário Netflix | | |

### TOM
- [ ] Conspiracional (medo, urgência)
- [ ] Descoberta (solução, esperança)
- [ ] Pessoal/Íntimo (conexão)

### PERSONAGENS
| Personagem | Nome | Background | Credenciais | Motivação |
|------------|------|------------|-------------|-----------|
| Principal | | | | |
| Guru/Expert | | | | |
| Depoimentos | | | | |

---

## BLOCO 3: Storytelling (Jornada do Herói)

### Gatilho
> O que INICIOU o problema:

### Progressão
> Como o problema PIOROU ao longo do tempo:

### Problemas Tangíveis (link Bloco 1)
> Manifestações CONCRETAS no dia a dia:

### Tentativas Falhas
1.
2.
3.

### Estado Emocional no Fundo
> Frustração, vergonha, culpa (usar palavras do VOC):

### CLÍMAX / Fundo do Poço
> Momento de maior dor (ativa neurônios-espelho):

### Aftermath
> Consequências do clímax:

### Ponto de Virada
- [ ] Emocional (promessa, oração)
- [ ] Acidental (descoberta inesperada)

> Descrição do momento:

---

## BLOCO 4: CORAÇÃO (CRÍTICO)

### NOVA CAUSA (Mecanismo do Problema)
| Elemento | Conteúdo |
|----------|----------|
| O que causa o problema | |
| Sexy Cause Name | |
| Problema Fundamental | |
| Causa Raiz | |

### NOVA OPORTUNIDADE (Solução)
| Elemento | Conteúdo |
|----------|----------|
| Inverso da nova causa | |
| Nova Oportunidade Expandida | |
| Foco (Nova Causa ou Nova Oportunidade) | |

### MECANISMO ÚNICO (4 camadas)
| Camada | Conteúdo |
|--------|----------|
| Ingredient Hero | |
| Gimmick Name | |
| Origin Story | |
| Authority Hook | |

---

## BLOCO 5: One Belief

### Fórmula Evaldo
\`\`\`
"[Nova Oportunidade] é a chave para [Desejo Principal].
Isso só é possível através do [Gimmick Name ou Authority Hook]
presente exclusivamente em [Produto]."
\`\`\`

### One Belief desta oferta:
>

---

## BLOCO 6: Oferta + Close

### OFERTA
| Elemento | Conteúdo |
|----------|----------|
| Proposta Única de Valor | |
| Entregáveis | |
| Quebra de Objeções | |
| Picture (visualização futuro) | |
| Argumento 6 potes + Ancoragem | |
| PERSONALIZAÇÃO (quiz + dosagem) | |
| Pit | |

### CLOSE
| Elemento | Conteúdo |
|----------|----------|
| Bônus | |
| Garantia (NOMEADA) | |
| Dualidade (duas vidas) | |
| Take Rate target | 70%+ no 6 potes |

---

*Template baseado na metodologia H&W Publishing (R$ 2B/ano)*
`;
}

function getVslChaptersTemplate(): string {
  return `# VSL Chapters Template

> Escrever por CAPÍTULOS, nunca bloco inteiro.
> IA aprende o estilo conforme avança.

---

## Estrutura de 6 Capítulos

### CAPÍTULO 1: LEAD (~2 páginas)
\`\`\`
Objetivo: Capturar atenção, estabelecer promessa
Elementos:
- Hook (primeiros 3 segundos)
- Promessa principal
- Curiosidade / Loop aberto
- Transição para história
\`\`\`

### CAPÍTULO 2: BACKGROUND STORY
\`\`\`
Objetivo: Criar conexão, estabelecer credibilidade
Elementos:
- Apresentação do protagonista
- Contexto (quem era antes)
- Sinais do problema chegando
- Momentos de normalidade (contraste)
\`\`\`

### CAPÍTULO 3: TESE DE MERCADO
\`\`\`
Objetivo: Invalidar soluções antigas, criar receptividade
Elementos:
- Por que métodos tradicionais falham
- Nova descoberta/perspectiva
- Validação científica/autoridade
- Transição para solução
\`\`\`

### CAPÍTULO 4: PRODUCT BUILDUP
\`\`\`
Objetivo: Apresentar solução com desejo crescente
Elementos:
- Mecanismo único (4 camadas)
- Prova social intercalada
- Benefícios tangíveis
- Visualização de resultados
\`\`\`

### CAPÍTULO 5: OFERTA
\`\`\`
Objetivo: Apresentar proposta irresistível
Elementos:
- Proposta única de valor
- Ancoragem de preço
- Bônus (universo próprio)
- Garantia NOMEADA
- Personalização
\`\`\`

### CAPÍTULO 6: CLOSE
\`\`\`
Objetivo: Converter decisão em ação
Elementos:
- Dualidade (duas vidas)
- Urgência genuína
- Objeções finais
- CTA claro e repetido
- Take Rate target: 70%+
\`\`\`

---

## Processo de Escrita

### Por capítulo:
1. Carregar contexto do puzzle pieces
2. Prompt específico do capítulo
3. Primeira versão
4. Refinamento iterativo
5. Aprovação antes do próximo

### Anti-vícios IA (Checklist):
- [ ] Conversa > leiturabilidade
- [ ] Frases simples e poderosas
- [ ] Sem palavras genéricas (elevate, seamless, unlock)
- [ ] Sem "In today's [adjetivo] world"
- [ ] Fluidez (desce redondo?)

---

*Baseado na metodologia H&W Publishing*
`;
}

function getBlindCriticPrompt(): string {
  return `# Blind Critic Prompt

> Avaliação SEM contexto de geração.
> Problema: Artificial Hivemind (79% similaridade intra-modelo)
> Solução: Crítico avalia APENAS o artefato final

---

## Instruções

Você é um crítico de copy de Direct Response.
Você NÃO tem acesso ao briefing, conversa de geração, ou iterações anteriores.
Você vê APENAS o artefato final.

Avalie a copy abaixo usando EXCLUSIVAMENTE estes critérios:

## Critérios de Avaliação

### 1. Impacto Emocional (1-10)
- A copy faz SENTIR ou apenas ENTENDER?
- Qual parte do corpo reagiria? (estômago, coração, mente)
- Há momentos de surpresa genuína?

### 2. Especificidade (1-10)
- Há números, nomes, exemplos concretos?
- As promessas são genéricas ou específicas?
- O leitor consegue VISUALIZAR a transformação?

### 3. Autenticidade (1-10)
- Parece escrito por humano ou IA?
- Tem personalidade/voz única?
- Evita clichês de copy?

## Output Esperado

\`\`\`json
{
  "impacto_emocional": {
    "score": X,
    "observacao": "..."
  },
  "especificidade": {
    "score": X,
    "observacao": "..."
  },
  "autenticidade": {
    "score": X,
    "observacao": "..."
  },
  "media": X,
  "veredicto": "APROVADO | REVISAR | REFAZER",
  "melhorias": ["...", "..."]
}
\`\`\`

## Thresholds

- Média ≥ 8: APROVADO
- Média 6-7: REVISAR (melhorias específicas)
- Média < 6: REFAZER (não vale revisar)

---

## Copy para Avaliar

[INSERIR COPY AQUI]
`;
}

function getEmotionalStressPrompt(): string {
  return `# Emotional Stress Test - 4 Testes

> Fonte: Pesquisa 03.md - Artificial Hivemind
> Valida ressonância emocional, não apenas lógica

---

## Teste 1: GENERICIDADE

**Pergunta:** Esta copy poderia ser usada por um concorrente SEM alteração?

| Score | Significado |
|-------|-------------|
| 1-3 | Altamente genérica - qualquer um usaria |
| 4-5 | Parcialmente genérica - precisa adaptar |
| 6-7 | Relativamente única - reconhecível |
| 8-10 | Distintiva - impossível copiar |

**Threshold 2026:** Score < 8 = REFAZER

---

## Teste 2: VISCERAL vs CEREBRAL

**Pergunta:** O leitor SENTE ou apenas ENTENDE?

Qual parte do corpo reagiria?
- **Estômago:** Medo, ansiedade, fome
- **Coração:** Amor, conexão, pertencimento
- **Mente:** Curiosidade, lógica, análise

| Score | Significado |
|-------|-------------|
| 1-2 | Puramente cerebral - só informação |
| 3-4 | Misto - alguma emoção |
| 5 | Visceral - reação física imediata |

---

## Teste 3: SCROLL-STOP

**Pergunta:** Em feed infinito (Instagram/TikTok), isso PARA o dedo?

| Score | Significado |
|-------|-------------|
| 1-2 | Passa batido - previsível |
| 3-4 | Talvez pare - interessante |
| 5 | Para imediatamente - surpreendente |

**Avaliar:**
- Hook surpreendente ou esperado?
- Pattern interrupt presente?
- Curiosidade genuína?

---

## Teste 4: PROVA SOCIAL IMPLÍCITA

**Pergunta:** "Pessoas como eu" usam isso?

| Score | Significado |
|-------|-------------|
| 1-2 | Sem identificação tribal |
| 3-4 | Identificação parcial |
| 5 | "Isso é para mim" - pertencimento claro |

**Elementos:**
- Linguagem do grupo
- Referências culturais
- Exclusividade/pertencimento

---

## Output Esperado

\`\`\`json
{
  "genericidade": {
    "score": X,
    "justificativa": "..."
  },
  "visceral": {
    "score": X,
    "parte_corpo": "estomago|coracao|mente",
    "justificativa": "..."
  },
  "scroll_stop": {
    "score": X,
    "justificativa": "..."
  },
  "prova_social": {
    "score": X,
    "justificativa": "..."
  },
  "media_ponderada": X,
  "veredicto": "APROVADO | REVISAR | REFAZER",
  "acoes_prioritarias": ["...", "..."]
}
\`\`\`

## Ponderação

- Genericidade: 40% (mais importante em 2026)
- Visceral: 25%
- Scroll-stop: 20%
- Prova social: 15%

---

## Copy para Testar

[INSERIR COPY AQUI]
`;
}

function getAntiHivemindConstraints(): string {
  return `# Anti-Hivemind Constraints

> Fonte: Pesquisa 05.md
> Problema: 79% similaridade intra-modelo, 71-82% cross-modelo
> Causa: Treinamento em dados comuns, RLHF convergente

---

## OBRIGATÓRIO: Escrever SEM usar

### Palavras Banidas
- elevate
- seamless
- unlock
- dive (into)
- leverage
- journey
- empower
- revolutionize
- game-changer
- cutting-edge

### Estruturas Banidas
- "X meets Y"
- "In today's [adjetivo] world"
- "Introducing..."
- "Imagine..."
- "What if I told you..."
- "The secret to..."
- "Finally, a solution that..."

### Metáforas Banidas
- Jornadas (journey)
- Rios (flow, stream)
- Luz (illuminate, shine)
- Transformação genérica

### Aberturas Banidas
- "Have you ever..."
- "Are you tired of..."
- "What if there was..."
- "Picture this..."

---

## SUBSTITUIÇÕES RECOMENDADAS

| Genérico | Específico |
|----------|------------|
| "elevate your life" | "[ação específica] para [resultado mensurável]" |
| "seamless experience" | "[processo] sem [fricção específica]" |
| "unlock your potential" | "[habilidade] para conseguir [resultado]" |
| "transformative journey" | "[período] de [mudança específica]" |

---

## Teste de Genericidade

Antes de aprovar, perguntar:
1. "Um concorrente poderia usar esta copy sem alterar?"
2. "Há números, nomes, exemplos ÚNICOS?"
3. "A voz é reconhecível ou intercambiável?"

Se SIM para #1 → REFAZER
Se NÃO para #2 e #3 → REVISAR

---

## Prompt de Geração com Constraints

\`\`\`
Escreva [tipo de copy] para [contexto].

RESTRIÇÕES OBRIGATÓRIAS:
- NÃO use: elevate, seamless, unlock, dive, leverage
- NÃO use estrutura "X meets Y"
- NÃO abra com "In today's [adjetivo] world"
- NÃO use metáforas de jornadas, rios ou luz
- USE números específicos, nomes reais, exemplos concretos
- ESCREVA como conversa, não como texto polido

O resultado deve ser impossível de confundir com copy de concorrente.
\`\`\`

---

*Baseado em pesquisa Artificial Hivemind (NeurIPS 2025)*
`;
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
