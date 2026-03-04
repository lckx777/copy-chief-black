---
template_name: "rmbc-ii-workflow"
template_version: "1.0.0"
template_type: "methodology"
description: "Metodologia RMBC II de Stefan Georgi para VSLs de resposta direta"
phase: "production"
required_inputs: ["synthesis.md", "mecanismo-unico.yaml", "helix-complete.md"]
output_format: "markdown"
deliverable_type: "vsl"
validation_tools: ["blind_critic", "emotional_stress_test", "black_validation"]
---

# Template: RMBC II Workflow (Stefan Georgi)

> Metodologia $1B+ em vendas para VSLs de resposta direta
> Fonte: Pesquisa Externa 04.md - Stefan Georgi RMBC II
> **Attribution:** Ref `~/.claude/templates/partials/attribution-header.md` — inserir como YAML frontmatter no deliverable final

---

## As 4 Fases RMBC

```
RESEARCH → MECHANISM → BRIEF → COPY
```

### Fase 1: Research (Pesquisa)

**7 Perguntas Essenciais:**

1. Quem é seu cliente? (demografia + psicografia)
2. Quais são seus pontos de dor? (específicos E amplos)
3. Que resultado desejam? (transformação ideal)
4. O que o mercado já usa? (soluções existentes)
5. O que gostam das soluções existentes?
6. O que desgostam das soluções existentes?
7. Histórias de horror sobre alternativas?

**Output:** Documento de pesquisa unificado para alimentar LLMs

---

### Fase 2: Mechanism (Mecanismo Único)

**UMP (Unique Mechanism of Problem):**
> Explica a VERDADEIRA razão pela qual o prospecto nunca resolveu seu problema antes.
> Cria "mudança de paradigma" - "Não era culpa sua, era [mecanismo]"

**UMS (Unique Mechanism of Solution):**
> Mostra por que vão ter sucesso DESTA vez com sua solução.
> Conecta diretamente com o UMP.

**Critério de qualidade:**
- [ ] UMP é proprietário e nomeável
- [ ] UMP cria reframe do problema
- [ ] UMS resolve diretamente o UMP
- [ ] UMS é defensável com evidência

---

### Fase 3: Brief (Pré-escrita)

> **Regra crítica:** Escrever respostas como se fossem entrar DIRETAMENTE no copy, não como notas.

**Elementos do Brief 2.0:**
- MUP definido com nome proprietário
- MUS definido com nome proprietário
- Promessa central (headline candidate)
- Prova principal (estudo, case, dado)
- Oferta estruturada

**Resultado esperado:** "Quando chega na parte do Brief, tem tanta clareza que a carta de vendas praticamente se escreve sozinha."

---

### Fase 4: Copy (7 Seções VSL)

## Estrutura de 7 Seções para VSL

### I. Lead (Intro)

**Checklist obrigatório:**
- [ ] Call Out Problem (identificar a luta)
- [ ] Promise Solution + Save Time/Money
- [ ] Tease Emotional Discovery Story
- [ ] Tease Unique Mechanism
- [ ] Tease Contrarian Nature ("Isso vai contra tudo que você já ouviu")
- [ ] Work in Fascinations
- [ ] Briefly Address Skepticism
- [ ] Mention Credibility Builders
- [ ] Qualifiers – Who This Works For

> **Regra Georgi:** Escrever o Lead POR ÚLTIMO em 90% dos casos.

---

### II. Background Story

**Elementos:**
- Quem é o spokesperson
- Por que são credíveis
- Eventos que levaram à descoberta do mecanismo único

---

### III. Unique Mechanism of the Problem (UMP)

> A causa REAL por trás do ponto de dor do mercado.

**Estrutura:**
1. Setup do problema comum
2. Revelação do mecanismo oculto
3. Explicação de por que outras soluções falham
4. Mudança de paradigma ("Não era culpa sua")

---

### IV. Unique Mechanism of the Solution (UMS)

> A solução REAL para esse ponto de dor.

**Estrutura:**
1. Transição do problema para solução
2. Revelação do mecanismo de solução
3. Explicação de como funciona
4. Por que funciona quando outros falham

---

### V. Product Build-Up and Reveal

**Sequência:**
1. Spokesperson percebe que ninguém oferece essa solução
2. Cria/encontra a única empresa que oferece
3. Finalmente revela o produto

---

### VI. Close

**Elementos:**
- Features e benefits
- Picture emocional da vida com o produto
- Comparação de valor com alternativas
- Reveal de preço
- Call to action explícito

---

### VII. FAQs

> Podem aumentar conversões em 10-15%

**Incluir:**
- Objeções mais comuns respondidas
- Dúvidas técnicas/logísticas
- Garantia e suporte

---

## Fluxo Emocional por Seção

> Ref: `~/.claude/rules/persuasion-chunking.md` para framework completo de unidades persuasivas.
> Regra Cardinal: "Saída emocional da seção N = entrada emocional da seção N+1"

| Seção | Unidade Persuasiva | Entrada Emocional | Saída Emocional | DRE Level |
|-------|--------------------|-------------------|-----------------|-----------|
| I. Lead | Identificação + Agitação | Curiosidade | Reconhecimento + Medo | 1-2 |
| II. Background | Escalada + Credibilidade | Reconhecimento + Medo | Confiança + Medo Amplificado | 2-3 |
| III. UMP | Revelação do Problema Real | Medo Amplificado | Raiva/Indignação + Esperança | 3-4 |
| IV. UMS | Revelação da Solução Real | Esperança + Curiosidade | Crença + Desejo | 3-4 |
| V. Product Build-Up | Apresentação + Stack | Crença + Desejo | Desejo Ampliado + Urgência | 4 |
| VI. Close | Oferta + CTA | Desejo Ampliado + Urgência | Decisão + Ação | 4-5 |
| VII. FAQs | Resolução de Objeções | Dúvidas Residuais | Segurança + Ação | 1-2 |

**Nota sobre continuidade:**
- A saída de cada seção alimenta naturalmente a entrada da próxima
- DRE escala progressivamente de 1-2 (Lead) até 4-5 (Close)
- FAQs "resetam" para DRE 1-2 propositalmente (resolver dúvidas = reduzir ansiedade → converter)
- O hook `persuasion-flow-check.ts` valida essa continuidade automaticamente

---

## Regra 3-7-18 para VSLs Modernos

| Duração | Uso |
|---------|-----|
| **3 minutos** | Formato curto, social ads |
| **7 minutos** | Formato médio, maioria dos casos |
| **18 minutos** | Formato longo, ofertas complexas |

> VSLs de 40+ minutos estão "falhando" segundo Georgi.

---

## Divisão Humano vs IA (Copy Thinker Mode)

### Humano Faz:

| Tarefa | Por quê |
|--------|---------|
| Pensamento estratégico | Big idea, proposta de valor |
| Direção de pesquisa | Saber que perguntas fazer |
| Seleção de framework | Estrutura certa para contexto |
| Julgamento de qualidade | "Isso não faz sentido" |
| Orientação de refinamento | Dirigir melhorias |
| Aprovação final | Quando copy está pronto |

### IA Faz:

| Tarefa | Métrica |
|--------|---------|
| Compilação de pesquisa | Deep research em 15-20 min |
| Geração de variantes | 100+ hooks em 30 min |
| Primeiros rascunhos | Headlines, leads, ads, emails |
| Execução de templates | Seguir 7 seções |
| Iteração | Reescrever sob direção |

---

## Checklist de Headlines (7 Elementos)

Todo headline vencedor deve conter vários destes:

1. **Curiosidade** - Algo inesperado
2. **Call Out Pain Point** - Luta específica
3. **Promise Solution** - Resultado prometido
4. **Especificidade** - Números, prazos
5. **Simplicidade** - Fácil de entender
6. **Credibilidade** - Por que acreditar
7. **Time Frame** - Quando vão alcançar

---

## Métricas de Velocidade (Benchmark Georgi)

| Deliverable | Tempo com RMBC II |
|-------------|-------------------|
| VSL (primeiro rascunho) | 2 horas |
| 100+ hooks | 30 minutos |
| Sequência de emails | 10 minutos |
| 10-20 advertorials | 1 dia |
| Flow de upsell completo | <1 hora |

---

*Baseado em Stefan Georgi RMBC II (2025)*
*$1B+ em vendas documentadas*
