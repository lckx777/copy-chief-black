---
template_name: "context-hierarchy-template"
template_version: "1.0.0"
template_type: "methodology"
description: "Template para hierarquia de contexto 3-Tier (HOT/WARM/COLD) por sessao"
phase: "any"
output_format: "markdown"
---

# Context Hierarchy Template v6.0

> Template para gerenciamento de contexto em sessões de produção.
> Baseado em Pesquisa 9 (Context Management).

---

## QUANDO USAR

Usar este template:
- [ ] Ao iniciar sessão de produção longa
- [ ] Quando contexto passar de 50%
- [ ] Antes de tarefas que exigem múltiplos arquivos
- [ ] Para planejar carregamento progressivo

---

## 3-TIER MEMORY ARCHITECTURE

### Definição dos Tiers

| Tier | Conteúdo | Regra | Tokens |
|------|----------|-------|--------|
| **HOT** | CONTEXT.md, synthesis.md, briefing atual | Sempre carregado | ~5K |
| **WARM** | references/, swipes/, fases HELIX | Sob demanda | ~20K |
| **COLD** | raw/, dados brutos, histórico | NUNCA no contexto | N/A |

### Mapeamento da Oferta

**Oferta:** [nome]

#### Tier HOT (Sempre Carregado)

| Arquivo | Tokens (~) | Status |
|---------|------------|--------|
| `CONTEXT.md` | ~500 | [ ] Carregado |
| `research/synthesis.md` | ~2K | [ ] Carregado |
| `briefings/phases/fase[X].md` (atual) | ~2K | [ ] Carregado |

**Total HOT:** ~5K tokens

#### Tier WARM (Carregar Quando Necessário)

| Arquivo | Tokens (~) | Quando Carregar |
|---------|------------|-----------------|
| `briefings/phases/fase05-mup.md` | ~2K | Produzindo VSL/LP |
| `briefings/phases/fase06-mus.md` | ~2K | Produzindo VSL/LP |
| `briefings/phases/fase09-nuuppecc.md` | ~1.5K | Produzindo criativos |
| `research/voc/summary.md` | ~1K | Validando linguagem |
| `research/competitors/ads-library-spy.md` | ~3K | Pesquisando padrões |
| `swipes/[nicho]/*.md` | ~2K cada | Produzindo copy |

**Total WARM disponível:** ~15-25K tokens

#### Tier COLD (Nunca Carregar)

| Arquivo/Pasta | Por quê não carregar |
|---------------|---------------------|
| `research/voc/raw/` | Dados brutos, já sintetizados |
| `research/competitors/raw/` | Dados brutos, já sintetizados |
| Histórico de versões | Não relevante para produção |
| Screenshots/imagens | Alto custo, baixo valor textual |

---

## PROGRESSIVE LOADING SEQUENCE

### Ordem de Carregamento

```
1. CONTEXT.md (visão geral)
   ↓ ~500 tokens
2. synthesis.md (decisões-chave)
   ↓ ~2K tokens
3. Fase específica sendo trabalhada
   ↓ ~2K tokens
4. Swipes/references APENAS quando produzindo
   ↓ sob demanda
```

### Por Tipo de Tarefa

#### Produzindo VSL

| Ordem | Arquivo | Tokens |
|-------|---------|--------|
| 1 | CONTEXT.md | ~500 |
| 2 | synthesis.md | ~2K |
| 3 | fase05-mup.md | ~2K |
| 4 | fase06-mus.md | ~2K |
| 5 | fase07-one-belief.md | ~1K |
| 6 | vsl-template.md | ~2K |
| **TOTAL** | | ~10K |

#### Produzindo Criativos

| Ordem | Arquivo | Tokens |
|-------|---------|--------|
| 1 | CONTEXT.md | ~500 |
| 2 | synthesis.md | ~2K |
| 3 | fase09-nuuppecc.md | ~1.5K |
| 4 | ads-library-spy.md | ~3K |
| 5 | criativos-template.md | ~1.5K |
| 6 | swipes/[nicho]/[1-2 relevantes] | ~2K |
| **TOTAL** | | ~11K |

#### Validando Copy (CRITIC)

| Ordem | Arquivo | Tokens |
|-------|---------|--------|
| 1 | copy-validation-checklist.md | ~3K |
| 2 | CONTEXT.md | ~500 |
| 3 | fase05-mup.md | ~2K |
| 4 | fase06-mus.md | ~2K |
| 5 | voc/summary.md | ~1K |
| **TOTAL** | | ~9K |

---

## REGRA DOS 75%

### Limites de Contexto

| Capacidade | Tokens (~) | Ação |
|------------|------------|------|
| 0-50% | 0-100K | Operação normal |
| 50-60% | 100-120K | Considerar `/compact` |
| 60-75% | 120-150K | **Executar `/compact`** |
| >75% | >150K | ⚠️ Qualidade degradada |

### Sinais de Contexto Cheio

Observar estes sinais para executar `/compact`:

- [ ] Respostas mais genéricas que o normal
- [ ] Esquecimento de instruções anteriores
- [ ] Repetição de perguntas já respondidas
- [ ] Inconsistências com decisões anteriores
- [ ] Demora maior nas respostas

---

## SESSION MANAGEMENT

### Início de Sessão

```
1. [ ] Verificar qual oferta está ativa
2. [ ] Carregar CONTEXT.md da oferta
3. [ ] Verificar estado no synthesis.md
4. [ ] Identificar próxima ação no task_plan.md
5. [ ] Estimar tokens necessários para a tarefa
```

### Durante a Sessão

```
1. [ ] Monitorar uso de contexto (aproximado)
2. [ ] Executar `/compact` se >60%
3. [ ] Salvar outputs em arquivo (não só no contexto)
4. [ ] Atualizar findings.md com descobertas
```

### Fim de Sessão

```
1. [ ] Salvar estado em project_state.yaml
2. [ ] Documentar próxima ação clara
3. [ ] Commitar alterações se relevante
4. [ ] Não deixar trabalho "no ar"
```

---

## SUBAGENT PATTERNS

### Quando Usar Subagents

| Situação | Usar Subagent? | Motivo |
|----------|----------------|--------|
| Contexto >60% | ✅ | Reset com 200K fresh |
| Tarefa isolada | ✅ | Contexto focado |
| Produção em lote | ✅ | Paralelização |
| Continuação de trabalho | ❌ | Usar sessão atual |
| Decisão estratégica | ❌ | Manter contexto completo |

### Tipos de Subagent

| Type | Uso | Tools Disponíveis |
|------|-----|-------------------|
| `researcher` | VOC, competitors, mechanism, avatar | Read, WebSearch, MCPs |
| `copywriter` | VSL, LP, creatives, emails | Read, Write |
| `reviewer` | Validation, QA, quality gates | Read, Write |
| `synthesizer` | Merge parallel outputs | Read, Write, Grep |

### Exemplo de Chamada

```
Task tool com:
- subagent_type: "copywriter"
- prompt: "Produzir VSL para [oferta]. Ler CONTEXT.md e synthesis.md primeiro. Seguir vsl-template.md."
```

---

## CHUNKED PROCESSING (TTT Pattern)

### Princípio

> Dividir tarefa longa em chunks é mais eficiente que contexto monolítico.

### Speedup Esperado

| Abordagem | Performance |
|-----------|-------------|
| Contexto monolítico | 1x (baseline) |
| Chunked processing | 2.7x - 35x |

### Divisão por Deliverable

| Deliverable | Chunks Recomendados |
|-------------|---------------------|
| VSL | Hook → Problema → Vilão → Mecanismo → Prova → Oferta → CTA |
| Landing Page | Bloco a bloco (14 blocos) |
| Criativos | Um por vez com contexto focado |
| Email Sequence | Email por email |

### Exemplo Prático

**VSL em 7 chunks:**

| Chunk | Contexto Necessário | Output |
|-------|---------------------|--------|
| 1. Hook | fase09-nuuppecc.md | Hook + 3 variações |
| 2. Problema | fase03-avatar.md | Seção problema |
| 3. Vilão | fase05-mup.md | Seção vilão |
| 4. Mecanismo | fase05-mup.md | Seção mecanismo |
| 5. Prova | synthesis.md | Seção prova |
| 6. Oferta | fase08-cro.md | Stack + preço |
| 7. CTA | fase08-cro.md | Fechamento |

---

## PROMPT STRUCTURE

### Organização Ideal

```
[INÍCIO DO CONTEXTO - Dados extensos]
├── Briefing relevante
├── VOC/Exemplos necessários
├── References específicas
└── Contexto do projeto

[FIM DO CONTEXTO]

[INSTRUÇÃO ESPECÍFICA / QUERY]
```

> "Putting longform data at top, queries at end improves quality by 30%"

### Anti-Pattern

**ERRADO:**
```
"Leia todos os 10 briefings + toda a research + todos os swipes e depois produza o criativo"
```

**CERTO:**
```
"Leia CONTEXT.md primeiro.
Depois synthesis.md.
Depois fase09-nuuppecc.md que vamos usar.
Agora produza o criativo seguindo criativos-template.md."
```

---

## CHECKLIST PRÉ-TAREFA

### Higiene de Contexto

- [ ] CONTEXT.md carregado (não briefing completo)
- [ ] synthesis.md revisado
- [ ] Contexto <60%
- [ ] Próxima ação clara
- [ ] Swipes necessários identificados (não carregados ainda)
- [ ] Template relevante identificado

### Estimativa de Tokens

| Elemento | Tokens |
|----------|--------|
| Tier HOT | ~5K |
| Arquivos WARM necessários | ~[X]K |
| Template | ~2K |
| Margem para output | ~10K |
| **TOTAL ESTIMADO** | ~[X]K |

**Cabe no contexto?** [ ] Sim [ ] Não → usar subagent

---

*Template v6.0 - Baseado em Context Management (Pesquisa 9)*
*Criado em 2026-01-30*
