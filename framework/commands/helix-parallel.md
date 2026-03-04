---
description: Execute Helix System research phases in parallel (4 subagents)
argument-hint: "<offer-name>"
---

# Helix Parallel Research

> ⚠️ **DEPRECADO (v6.2):** Este command é mantido para compatibilidade.
> **USE:** `audience-research-agent` como entry point único para pesquisa.
> Ver `~/.claude/WORKFLOW-CANONICO.md` para o fluxo recomendado.
>
> **Quando usar este command:**
> - Casos específicos onde você precisa controle granular sobre os 4 tasks
> - Debugging de módulos individuais
> - Para todos os outros casos, use `audience-research-agent`

Execute parallel research for offer: **$ARGUMENTS**

> **IMPORTANTE (v4.3):** Todos os tasks usam `subagent_type: general-purpose` para garantir acesso aos MCPs (Apify, Firecrawl, Playwright). Custom types como `researcher` NÃO herdam MCPs.

## Extended Thinking Bifásica (v6.1) ⚠️ NOVO

> Fonte: `~/.claude/rules/briefings-helix.md` v6.1

| Fase Research | Extended Thinking | Budget |
|---------------|-------------------|--------|
| VOC Research | ON | 10-16K |
| Competitor Analysis | ON | 10-16K |
| Mechanism Research | ON | 10-16K |
| Avatar Profiling | ON | 10-16K |
| Synthesis | ON | 10-16K |

**Todos os tasks de research usam Extended Thinking ON para análise profunda.**

### Templates Disponíveis (v6.1)

Para fases posteriores (HELIX briefing), usar:
- `~/.claude/templates/mup-mus-discovery.md` → Fases 5-6 (MUP/MUS)
- `~/.claude/templates/rmbc-ii-workflow.md` → Fases 7-10 (VSL structure)

## Pre-Flight Check

Before starting, verify:

```bash
# 1. Check offer directory exists
ls ~/copywriting-ecosystem/*/$ARGUMENTS/ 2>/dev/null || echo "CREATE DIRECTORY FIRST"

# 2. Check task_plan.md exists
cat ~/copywriting-ecosystem/*/$ARGUMENTS/task_plan.md 2>/dev/null || echo "RUN /plan FIRST"
```

If directory doesn't exist, create it:
```bash
~/copywriting-ecosystem/create-offer.sh "[nicho]" "$ARGUMENTS"
```

## Create Research Subdirectories

```bash
mkdir -p research/$ARGUMENTS/{voc,competitors,mechanism,avatar}/{raw,processed}
```

## Parallel Execution (Fan-out)

Launch **4 research tasks SIMULTANEOUSLY**:

---

### Task 1: VOC Research
```
Use Task tool with subagent_type: general-purpose

PROMPT:
"Você é um specialist em VOC extraction para copywriting de Direct Response.

OFFER: $ARGUMENTS

FERRAMENTAS DISPONÍVEIS (USAR OBRIGATORIAMENTE):
- mcp__apify (YouTube, Instagram, TikTok comments)
- mcp__firecrawl (landing pages, reviews)
- mcp__playwright (Meta Ads Library, sites com login)

VOC QUALITY PROTOCOL:
1. Apify Actor específico PRIMEIRO
2. Playwright se Apify falha
3. Firecrawl se Playwright falha
4. WebSearch APENAS como ÚLTIMO RESORT

TAREFA: Extrair VOC autêntico de YouTube, Instagram, TikTok, Reclame Aqui, Mercado Livre
OUTPUT: research/$ARGUMENTS/voc/
FOCO: Pain points (viscerais), desires, objections, language patterns verbatim
LIMITE: 100 quotes por plataforma
ESTRUTURA:
- raw/ → dados brutos por fonte
- processed/ → pain-points.md, desires.md, objections.md, language-patterns.md
- summary.md → ≤500 tokens com key findings
"
```

---

### Task 2: Competitor Analysis
```
Use Task tool with subagent_type: general-purpose

PROMPT:
"Você é um analyst de competidores para copywriting de Direct Response.

OFFER: $ARGUMENTS

FERRAMENTAS DISPONÍVEIS:
- mcp__firecrawl__firecrawl_scrape (landing pages, VSLs)
- mcp__firecrawl__firecrawl_extract (dados estruturados)
- mcp__playwright (Meta Ads Library)

TAREFA: Analisar top 5 competidores
OUTPUT: research/$ARGUMENTS/competitors/
FOCO: Landing pages, VSLs, ad angles, pricing, mechanisms
EXTRAIR: Headlines, hooks, MUPs, offers, GAPS (o que NÃO fazem)
ESTRUTURA:
- raw/ → scrapes completos
- processed/ → landing-pages.md, ad-angles.md, pricing.md, gaps.md
- summary.md → ≤500 tokens
"
```

---

### Task 3: Mechanism Research
```
Use Task tool with subagent_type: general-purpose

PROMPT:
"Você é um researcher de mecanismos únicos para copywriting de Direct Response.

OFFER: $ARGUMENTS

FERRAMENTAS DISPONÍVEIS:
- WebSearch (pesquisa científica, estudos)
- mcp__firecrawl (artigos, papers)

TAREFA: Pesquisar opções de mecanismo único (MUS)
OUTPUT: research/$ARGUMENTS/mechanism/
FOCO: Scientific backing, ângulos de diferenciação, fontes de prova
ENCONTRAR: 5 candidatos de mecanismo com evidência
ESTRUTURA:
- raw/ → fontes completas
- processed/ → candidates.md, scientific-backing.md, differentiation.md
- summary.md → ≤500 tokens com top 3 recomendados
"
```

---

### Task 4: Avatar Profiling
```
Use Task tool with subagent_type: general-purpose

PROMPT:
"Você é um specialist em avatar profiling para copywriting de Direct Response.

OFFER: $ARGUMENTS

FERRAMENTAS DISPONÍVEIS:
- WebSearch (pesquisa de mercado)
- Read (carregar VOC existente)

TAREFA: Construir perfil detalhado do avatar
OUTPUT: research/$ARGUMENTS/avatar/
FOCO: Demographics, psychographics, buying triggers, objections
INCLUIR: JTBD analysis, 6 Human Needs mapping, day-in-life
ESTRUTURA:
- raw/ → dados de pesquisa
- processed/ → demographics.md, psychographics.md, decision-journey.md, day-in-life.md
- summary.md → ≤500 tokens com perfil executivo
"
```

---

## Aggregation (Fan-in)

**After ALL 4 agents complete**, run synthesis:

```
Use Task tool with subagent_type: general-purpose

PROMPT:
"Você é um synthesizer specialist. Seu contexto está FRESH (200k tokens disponíveis).

OFFER: $ARGUMENTS

TAREFA: Consolidar todas as pesquisas em briefing unificado
INPUTS (carregar com Read):
  - research/$ARGUMENTS/voc/summary.md
  - research/$ARGUMENTS/competitors/summary.md
  - research/$ARGUMENTS/mechanism/summary.md
  - research/$ARGUMENTS/avatar/summary.md
OUTPUT: research/$ARGUMENTS/synthesis.md
LIMITE: ≤15,000 tokens

FORMATO DO SYNTHESIS:
1. Executive Summary (500 tokens)
2. VOC Insights consolidados
3. Competitive Landscape
4. Mechanism Recommendations (top 3)
5. Avatar Profile unificado
6. Strategic Recommendations (MUP/MUS direction)
7. Quality Score e Confidence %
"
```

## Post-Execution

1. **Update task_plan.md:**
   ```markdown
   ### PHASE 1: Parallel Research ⭐
   - [x] VOC Research → `research/$ARGUMENTS/voc/`
   - [x] Competitor Analysis → `research/$ARGUMENTS/competitors/`
   - [x] Mechanism Research → `research/$ARGUMENTS/mechanism/`
   - [x] Avatar Profiling → `research/$ARGUMENTS/avatar/`
   - [x] Synthesis → `research/$ARGUMENTS/synthesis.md`
   - **Status:** COMPLETE
   ```

2. **Update findings.md:** Add key discoveries from synthesis

3. **Report to user:** Summary + paths

## Expected Output

```yaml
command: helix-parallel
offer: $ARGUMENTS
parallel_tasks: 4
status: success|partial|error
tasks:
  voc:
    status: success
    summary: "research/$ARGUMENTS/voc/summary.md"
    items: [N]
  competitors:
    status: success
    summary: "research/$ARGUMENTS/competitors/summary.md"
    items: [N]
  mechanism:
    status: success
    summary: "research/$ARGUMENTS/mechanism/summary.md"
    candidates: [N]
  avatar:
    status: success
    summary: "research/$ARGUMENTS/avatar/summary.md"
synthesis:
  status: success
  path: "research/$ARGUMENTS/synthesis.md"
  confidence: [X]%
ready_for_helix: true|false
next_step: "Begin HELIX Phase 1 (Identification)"
```

## Error Handling

If any task fails:
1. Report which task failed
2. Continue with other tasks
3. Mark synthesis as partial
4. Suggest re-running failed task

## Post-Synthesis Gate (OBRIGATÓRIO)

⚠️ **ESTE GATE É OBRIGATÓRIO ANTES DE MARCAR PESQUISA COMO COMPLETA**

Após gerar synthesis.md, VALIDAR automaticamente:

```bash
# 1. Verificar synthesis.md existe
if [ ! -f "research/$ARGUMENTS/synthesis.md" ]; then
    echo "❌ SYNTHESIS FAILED: Arquivo não foi criado"
    exit 1
fi

# 2. Extrair confidence score
CONFIDENCE=$(grep -oP 'confidence[:\s]+\K\d+' research/$ARGUMENTS/synthesis.md | head -1)
if [ -z "$CONFIDENCE" ]; then
    echo "❌ SYNTHESIS FAILED: Confidence score não encontrado"
    echo "→ Verificar formato do synthesis.md"
    exit 1
fi

# 3. Validar threshold
if [ "$CONFIDENCE" -lt 70 ]; then
    echo "❌ GATE 1 FAILED: Confidence $CONFIDENCE% < 70%"
    echo ""
    echo "📋 GAPS IDENTIFICADOS:"
    grep -A5 "gaps\|missing\|incomplete" research/$ARGUMENTS/synthesis.md || echo "Verificar synthesis.md manualmente"
    echo ""
    echo "→ AÇÕES NECESSÁRIAS:"
    echo "  1. Identificar módulos com gaps"
    echo "  2. Re-executar módulos específicos"
    echo "  3. Regenerar synthesis.md"
    echo "  4. NÃO prosseguir para HELIX briefing"
    exit 1
fi

echo "✅ GATE 1 (Research): PASSED"
echo "   Confidence: $CONFIDENCE%"
echo "   Status: Liberado para HELIX briefing"
```

### Decisão Pós-Síntese

| Confidence | Status | Ação |
|------------|--------|------|
| ≥80% | 🟢 EXCELLENT | Prosseguir para HELIX |
| 70-79% | 🟡 ACCEPTABLE | Prosseguir, notar gaps |
| 60-69% | 🟠 BORDERLINE | Re-executar 1-2 módulos |
| <60% | 🔴 INSUFFICIENT | Re-executar pesquisa |

**SE CONFIDENCE <70%:**
1. NÃO marcar pesquisa como completa
2. NÃO iniciar HELIX briefing
3. IDENTIFICAR gaps específicos do synthesis
4. SUGERIR módulos para re-executar
5. AGUARDAR nova síntese

## Quality Gate Summary

Before marking complete:
- [ ] All 4 summary.md files exist
- [ ] synthesis.md exists
- [ ] synthesis.md ≤15,000 tokens
- [ ] **Confidence ≥70% (BLOQUEANTE)**
- [ ] Post-Synthesis Gate PASSED
