---
description: Produce all copy deliverables in parallel (4 subagents)
argument-hint: "<offer-name>"
---

# Parallel Production

Produce copy for offer: **$ARGUMENTS**

## Pre-Flight Check (BLOQUEANTE)

⚠️ **ESTE CHECK É OBRIGATÓRIO. NÃO PROSSEGUIR SE QUALQUER ITEM FALHAR.**

### Rules Carregados Automaticamente (v6.1) ⚠️ NOVO

> Fonte: `~/.claude/rules/copy-production.md` v6.1

Este comando carrega automaticamente:
- **Cyborg-Centaur Model:** Modo de colaboração humano-IA
- **Regra 70/30:** IA 70% draft, humano 30% polish
- **Context Rot 60%:** Manter contexto abaixo de 60%

**Anti-Pattern:** Self-Automator (produzir sem revisão humana)

### Gate 1: Research Readiness
```bash
# Verificar synthesis.md existe
if [ ! -f "research/$ARGUMENTS/synthesis.md" ]; then
    echo "❌ GATE 1 FAILED: synthesis.md não existe"
    echo "→ Ação: Rodar /helix-parallel $ARGUMENTS primeiro"
    exit 1
fi

# Verificar confidence ≥70%
CONFIDENCE=$(grep -oP 'confidence[:\s]+\K\d+' research/$ARGUMENTS/synthesis.md | head -1)
if [ "$CONFIDENCE" -lt 70 ]; then
    echo "❌ GATE 1 FAILED: Confidence $CONFIDENCE% < 70%"
    echo "→ Ação: Re-executar módulos de pesquisa com gaps"
    exit 1
fi
echo "✅ Gate 1 (Research): PASSED - Confidence $CONFIDENCE%"
```

### Gate 2: Briefing Readiness
```bash
# Verificar helix-complete.md existe
if [ ! -f "briefings/$ARGUMENTS/helix-complete.md" ]; then
    echo "❌ GATE 2a FAILED: helix-complete.md não existe"
    echo "→ Ação: Consolidar 10 fases HELIX em helix-complete.md"
    exit 1
fi
echo "✅ Gate 2a (helix-complete): Existe"

# Verificar MUP validation = STAND
if [ ! -f "briefings/$ARGUMENTS/validations/mup-validation.md" ]; then
    echo "❌ GATE 2b FAILED: MUP nunca foi validado"
    echo "→ Ação: Rodar copy-critic no MUP antes de produção"
    exit 1
fi
if ! grep -q "verdict: STAND" briefings/$ARGUMENTS/validations/mup-validation.md; then
    echo "❌ GATE 2b FAILED: MUP verdict não é STAND"
    echo "→ Ação: Iterar MUP até obter STAND do copy-critic"
    exit 1
fi
echo "✅ Gate 2b (MUP): STAND"

# Verificar MUS validation = STAND
if [ ! -f "briefings/$ARGUMENTS/validations/mus-validation.md" ]; then
    echo "❌ GATE 2c FAILED: MUS nunca foi validado"
    echo "→ Ação: Rodar copy-critic no MUS antes de produção"
    exit 1
fi
if ! grep -q "verdict: STAND" briefings/$ARGUMENTS/validations/mus-validation.md; then
    echo "❌ GATE 2c FAILED: MUS verdict não é STAND"
    echo "→ Ação: Iterar MUS até obter STAND do copy-critic"
    exit 1
fi
echo "✅ Gate 2c (MUS): STAND"

echo ""
echo "🎯 TODOS OS GATES PASSARAM - Produção liberada"
```

### Gate 3: Offer Type Detection (v4.6) ⚠️ NOVO

```bash
# Detectar tipo de oferta do CLAUDE.md do projeto
OFFER_TYPE=$(grep -oP 'Funil:\s*\K[^(]+' */$ARGUMENTS/CLAUDE.md 2>/dev/null | head -1 | xargs)

# Fallback: detectar de helix-complete.md
if [ -z "$OFFER_TYPE" ]; then
    OFFER_TYPE=$(grep -oP 'offer_type:\s*\K\w+' briefings/$ARGUMENTS/helix-complete.md 2>/dev/null | head -1)
fi

# Default para VSL se não encontrado
if [ -z "$OFFER_TYPE" ]; then
    OFFER_TYPE="VSL"
    echo "⚠️ Tipo não detectado, assumindo VSL (default)"
fi

echo "📋 Tipo de Oferta Detectado: $OFFER_TYPE"
```

### Routing por Tipo de Oferta

| Tipo | VSL Script | Landing Page | Creatives | Email Sequence |
|------|------------|--------------|-----------|----------------|
| **VSL** | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório |
| **TSL** | ❌ Não gerar | ✅ Obrigatório | ✅ Obrigatório | ⚠️ Opcional |
| **Quiz** | ❌ Não gerar | ✅ + Quiz | ✅ Obrigatório | ✅ Obrigatório |
| **Hibrido** | ⚠️ Mini-VSL | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório |

**Notas:**
- **TSL (Text Sales Letter):** LP é o deliverable principal. Sem VSL script.
- **Low-ticket (≤R$97):** Email sequence opcional (1-3 emails vs 7)
- **Quiz Funnel:** LP deve incluir quiz flow + resultado

### Decisão de Bloqueio

| Gate | Condição | Se Falhar |
|------|----------|-----------|
| 1 | synthesis.md ≥70% confidence | **ABORTAR** - Voltar para pesquisa |
| 2a | helix-complete.md existe | **ABORTAR** - Consolidar HELIX |
| 2b | MUP validation = STAND | **ABORTAR** - Rodar copy-critic no MUP |
| 2c | MUS validation = STAND | **ABORTAR** - Rodar copy-critic no MUS |

**SE QUALQUER GATE FALHAR:**
1. NÃO criar diretórios de produção
2. NÃO lançar tasks de produção
3. REPORTAR qual gate falhou e ação necessária
4. AGUARDAR correção antes de re-tentar

## Create Production Directories

```bash
mkdir -p production/$ARGUMENTS/{vsl,landing-page/blocks,creatives/{meta,youtube,tiktok},emails}/{drafts,variations,final}
mkdir -p production/$ARGUMENTS/reviews
```

## Parallel Production (Fan-out)

Launch **4 production tasks SIMULTANEOUSLY**:

---

### Task 1: VSL Script (Condicional)

**⚠️ PULAR SE:** `OFFER_TYPE = TSL` ou `OFFER_TYPE = Quiz`

```
# Verificar se deve gerar VSL
if [[ "$OFFER_TYPE" == "TSL" ]] || [[ "$OFFER_TYPE" == "Quiz" ]]; then
    echo "⏭️ Task 1 (VSL): PULANDO - Oferta tipo $OFFER_TYPE não requer VSL"
else
    /agent copywriter "
    OFFER: $ARGUMENTS
    TASK: Write complete VSL script
    INPUT: briefings/$ARGUMENTS/helix-complete.md
    OUTPUT: production/$ARGUMENTS/vsl/
    STRUCTURE: Hook → Lead → Body → Close → Upsells
    VARIATIONS: 3 hook variations minimum
    LENGTH: Target 15-20 min read time (ou 5-7 min para Hibrido)
    "
fi
```

---

### Task 2: Landing Page
```
/agent copywriter "
OFFER: $ARGUMENTS
TASK: Write landing page copy (14 blocks)
INPUT: briefings/$ARGUMENTS/helix-complete.md
OUTPUT: production/$ARGUMENTS/landing-page/
STRUCTURE: 
  - Each block in blocks/ folder
  - Complete LP in lp-complete.md
  - Canva mapping in canva-mapping.md
"
```

---

### Task 3: Ad Creatives
```
/agent copywriter "
OFFER: $ARGUMENTS
TASK: Create ad creatives for Meta, YouTube, TikTok
INPUT: briefings/$ARGUMENTS/helix-complete.md
OUTPUT: production/$ARGUMENTS/creatives/
PER PLATFORM: 5 variations minimum
FORMATS: UGC, talking head, text overlay
INCLUDE: Hook + Body + CTA for each
"
```

---

### Task 4: Email Sequence (Adaptável)

**⚠️ SE TSL + Low-Ticket:** Sequência reduzida (3 emails vs 7)

```
# Verificar tipo de oferta para adaptar sequência
if [[ "$OFFER_TYPE" == "TSL" ]]; then
    # TSL low-ticket: sequência curta
    /agent copywriter "
    OFFER: $ARGUMENTS
    TASK: Write 3-email mini sequence (TSL low-ticket)
    INPUT: briefings/$ARGUMENTS/helix-complete.md
    OUTPUT: production/$ARGUMENTS/emails/
    SEQUENCE:
      1. Welcome + Offer (direto ao ponto)
      2. Proof (testimonials + garantia)
      3. Close (urgência + escassez)
    NOTA: Sequência curta para low-ticket TSL
    "
else
    # VSL/Quiz/Hibrido: sequência completa
    /agent copywriter "
    OFFER: $ARGUMENTS
    TASK: Write 7-email nurture sequence
    INPUT: briefings/$ARGUMENTS/helix-complete.md
    OUTPUT: production/$ARGUMENTS/emails/
    SEQUENCE:
      1. Welcome (story hook)
      2. Story (background)
      3. Problem (agitation)
      4. Solution (mechanism)
      5. Proof (testimonials)
      6. Offer (pitch)
      7. Close (urgency)
    "
fi
```

---

## Review Phase

After ALL 4 complete, run review:

```
/agent reviewer "
TASK: Full review of all production
PATH: production/$ARGUMENTS/
REVIEW:
  - VSL: Hook (6-Question), Body, Consistency
  - Landing Page: All 14 blocks
  - Creatives: Hook effectiveness per platform
  - Emails: Sequence flow, CTA clarity
OUTPUT: production/$ARGUMENTS/reviews/
"
```

## Post-Execution

1. **Update task_plan.md:**
   ```markdown
   ### PHASE 3: Parallel Production ⭐
   - [x] VSL Script → `production/$ARGUMENTS/vsl/`
   - [x] Landing Page → `production/$ARGUMENTS/landing-page/`
   - [x] Ad Creatives → `production/$ARGUMENTS/creatives/`
   - [x] Email Sequence → `production/$ARGUMENTS/emails/`
   - **Status:** COMPLETE
   ```

2. **Update progress.md:** Log production session

3. **Report to user:** Deliverables + review status

## Expected Output

```yaml
command: produce-offer
offer: $ARGUMENTS
parallel_tasks: 4
status: success|partial|error
deliverables:
  vsl:
    status: success
    path: "production/$ARGUMENTS/vsl/drafts/v1.md"
    variations: [N]
    word_count: [N]
  landing_page:
    status: success
    path: "production/$ARGUMENTS/landing-page/lp-complete.md"
    blocks: 14
  creatives:
    status: success
    path: "production/$ARGUMENTS/creatives/"
    meta: [N] variations
    youtube: [N] variations
    tiktok: [N] variations
  emails:
    status: success
    path: "production/$ARGUMENTS/emails/"
    count: 7
review:
  status: pending|complete
  path: "production/$ARGUMENTS/reviews/"
ready_for_final_review: true|false
next_step: "Run /review-all $ARGUMENTS"
```

## Error Handling

If any task fails:
1. Report which task failed
2. Continue with other tasks
3. Suggest re-running failed task
4. Do NOT run review until all tasks complete

## Quality Gate

Before marking complete:
- [ ] VSL draft exists with 3+ hook variations
- [ ] Landing page has 14 blocks + lp-complete.md
- [ ] At least 5 creatives per platform
- [ ] All 7 emails written
- [ ] Initial review completed
