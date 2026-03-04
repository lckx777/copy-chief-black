---
phases: [ON_DEMAND]
priority: LOW
tokens: ~1100
---

# Context & Memory Management Rules (v7.1)

> Regras de gerenciamento de contexto e memoria para sessoes longas.
> Consolidado de context-management.md + memory-protocol.md.
> **v7.0:** Merged memory-protocol.md (dual-system workflow, checklists)
> **v7.1:** Thresholds movidos para `~/.claude/framework-config.yaml` (S20.2)
>
> **Config Source:** `~/.claude/framework-config.yaml` → `context:` section

---

## Arquitetura de 3 Tiers

### Hierarquia de Memória

| Tier | Conteúdo | Regra de Carregamento |
|------|----------|----------------------|
| **HOT** | CONTEXT.md, synthesis.md, briefing atual | Sempre no contexto |
| **WARM** | references/, swipes/, fases HELIX | Sob demanda |
| **COLD** | raw/, dados brutos, histórico | NUNCA no contexto |

**Decisao:** AGORA=HOT, TALVEZ=WARM, NAO=COLD.

---

## Context Rot (Pesquisa Externa 09)

> Performance em U: inicio e fim OK, **meio degrada 30%+**. Efeitos posicionais a partir de ~4K tokens; quedas acentuadas a ~32K.

**Posicionamento:** INICIO = instrucoes core (primacy). FIM = trabalho atual (recency). MEIO = historico compressivel.

---

## Regra 60% → 50% (AIOS §3.4)

> `/compact` a **50%** (~100K tokens). 50-60% = zona de alerta. >60% = NOVA SESSÃO.

**Threshold AIOS:** 100K tokens (~50%) é mais conservador que o original de 60% (~120K).
Monitorar via `/context` durante sessão. Se aproximando de 100K → `/compact` ou nova sessão.

**Sinais de contexto cheio:** Respostas genericas, esquecimento de instrucoes, repeticao, inconsistencias, clustering de ideias.

---

## Token Economy Practices (AIOS §3.4)

> **Princípio:** Cada token custa dinheiro e contexto. Otimizar formato e modelo.

| Prática | Economia | Exemplo |
|---------|----------|---------|
| YAML em vez de JSON | ~15-20% | helix-state.yaml, mecanismo-unico.yaml |
| Opções numeradas (1/2/3) | ~30% | "Escolha: 1. X, 2. Y, 3. Z" em vez de parágrafos |
| .md em vez de .docx/.pdf | ~40-60% | Inputs sempre em markdown |
| Haiku para tasks repetitivas | ~5-10x custo | Checklists, formatting, cleanup |
| Opus reservado para arquitetura | Custo focado | Decisões estratégicas, briefing HELIX |
| Sonnet para produção | Equilíbrio | Copy writing, validações |

### Model Routing por Task

| Task Type | Modelo | Justificativa |
|-----------|--------|---------------|
| Research/Extraction | sonnet | Volume alto, precision média suficiente |
| Briefing/Strategy | opus | Decisões complexas, arquitetura de persuasão |
| Production copy | opus ou sonnet | Criatividade máxima para leads, sonnet para body |
| Validation/Review | sonnet | Checklist checking, threshold comparisons |
| Formatting/Cleanup | haiku | Repetitivo, baixa complexidade |
| VOC Processing | haiku | ETL de dados, extração de quotes |

### Comando de Monitoramento

```bash
# Verificar contexto atual
/context

# Se > 100K tokens (50%)
/compact  # ou nova sessão se > 60%
```

---

## Progressive Loading

**Sequencia:** CONTEXT.md → synthesis.md → Fase especifica → Swipes (so quando produzindo). **NUNCA** carregar tudo de uma vez.

**Prompt ideal:** Dados extensos no INICIO, query/instrucao no FIM (melhora qualidade em 30%).

---

## Session Management

**Inicio:** Verificar oferta ativa → CONTEXT.md → synthesis.md → proxima acao.
**Durante:** `/compact` a 60%. Atualizar findings.md.
**Fim:** Salvar estado em project_state.yaml. Documentar proxima acao clara.

---

## Subagent Patterns

**Usar subagent quando:** Contexto >60% (reset 200K), tarefa isolada, producao em lote.
**NAO usar quando:** Continuacao de trabalho, decisao estrategica (manter contexto).

> Ref: tool-usage-matrix.md § Subagent Tool Access para tipos e acesso a MCPs.
> **REGRA:** Custom types NAO herdam MCPs. Para MCPs → `general-purpose`.

---

## Chunked Processing (TTT Pattern)

> Dividir em chunks = 2.7x-35x mais eficiente que contexto monolitico.

**Chunks por deliverable:** VSL (Hook/Problema/Solucao/Oferta/CTA), LP (bloco a bloco), Criativos (um por vez), Emails (email por email).

---

## Checklist de Higiene

**Pre-tarefa:** CONTEXT.md carregado, synthesis.md revisado, contexto <60%, swipes identificados (nao carregados).
**Durante:** `/compact` se >60%, apenas arquivos necessarios, outputs em arquivo.

---

## Memory Protocol (Dual-System)

> **Regra:** SEMPRE consultar E salvar em AMBOS sistemas de memoria.
> **Sistemas:** claude-mem (automatico) + RLM Server (manual)

### Workflow por Momento da Sessao

| Momento | claude-mem | RLM |
|---------|------------|-----|
| **Inicio de sessao** | `search(query="[contexto]")` | `rlm_list_chunks(limit=5)` + `rlm_peek` |
| **Durante sessao** | Automatico (nao precisa fazer nada) | `rlm_chunk` para contexto CRITICO |
| **Antes de /compact** | Verificar com `search` | **OBRIGATORIO:** `rlm_chunk` |
| **Fim de sessao** | Hook automatico salva | Verificar preservacao |

### Quando Usar Cada Sistema

| Situacao | claude-mem | RLM |
|----------|------------|-----|
| Observacoes automaticas | Automatico | -- |
| Descobertas importantes | Automatico | Manual (chunk) |
| Decisoes BSSF | Automatico | Manual (chunk) |
| Antes de /clear ou /compact | Verificar | **Obrigatorio** |
| Inicio de sessao | search | list_chunks + peek |

### Ferramentas

**claude-mem:** `search`, `timeline`, `get_observations`, `__IMPORTANT`
**RLM Server (TOP 5):** `rlm_chunk`, `rlm_list_chunks`, `rlm_peek`, `rlm_grep`, `rlm_recall`

### Hooks Ativos

| Hook | Evento | Acao |
|------|--------|------|
| `discover-offer-context.sh` | SessionStart | Mostra contexto disponivel |
| `pre-compact-save.sh` | PreCompact | Lembra de salvar RLM |
| `auto_chunk_check.py` | Stop | Verifica se chunk foi salvo |

### Checklist Pre-/clear

- [ ] Salvei contexto importante no RLM? (`rlm_chunk`)
- [ ] claude-mem registrou as decisoes? (`search` para verificar)
- [ ] task_plan.md esta atualizado?
- [ ] progress.md esta atualizado?
- [ ] findings.md esta atualizado?

---

*v7.0 - Merged memory-protocol.md (dual-system workflow)*
*Atualizado: 2026-02-23*
