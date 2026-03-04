---
description: Run comprehensive review with multi-model validation
argument-hint: "<offer-name>"
---

# Comprehensive Review

Review all copy for offer: **$ARGUMENTS**

## Pre-Flight Check

```bash
# Verify production exists
ls production/$ARGUMENTS/{vsl,landing-page,creatives,emails}/ 2>/dev/null || echo "PRODUCTION NOT COMPLETE"
```

**Do NOT proceed if production is incomplete.**

## Review Sequence

### Step 1: Internal Review (reviewer agent)

Run full review across all deliverables:

```
/agent reviewer "
TASK: Comprehensive review of all production
PATH: production/$ARGUMENTS/

REVIEW EACH:
1. VSL Script
   - Hook: 6-Question Test
   - Body: 5-Point Review
   - Consistency: 5-Point Review
   
2. Landing Page
   - Each of 14 blocks
   - Overall flow
   - CTA clarity
   
3. Ad Creatives
   - Hook effectiveness per platform
   - Format appropriateness
   - Message consistency
   
4. Email Sequence
   - Individual emails
   - Sequence flow
   - CTA progression

OUTPUT: production/$ARGUMENTS/reviews/internal-review.md
"
```

---

### Step 2: copy-critic Validation

Use copy-critic skill to validate strategic elements:

```
Use copy-critic to validate:

1. MUP Consistency
   "Validate that MUP is consistently applied across:
   - VSL hook and body
   - Landing page headline and ruminação
   - Ad creatives
   - Email sequence"

2. MUS Clarity
   "Validate that MUS is clearly explained and proof is sufficient in:
   - VSL body
   - Landing page passo-a-passo
   - Email sequence (solution email)"

3. One Belief Reinforcement
   "Check that One Belief is reinforced throughout:
   - All major copy pieces
   - Without contradiction"

4. CTA Alignment
   "Verify CTAs match the promise made in:
   - VSL close
   - Landing page CTA blocks
   - Email closes"

OUTPUT: production/$ARGUMENTS/reviews/copy-critic-verdicts.md
```

### Step 2.5: Cognitive-Affective Gap Validation (v6.1) ⚠️ NOVO

> Fonte: `~/.claude/rules/copy-chief.md` v6.1 (Pesquisa Externa 06.md)

**5 Stress-Test Prompts (OBRIGATÓRIO):**

```
Para CADA deliverable principal (VSL, LP, Criativos principais):

1. "Se eu mostrasse isso para a pessoa mais cética que conheço no nicho,
    qual seria a primeira objeção?"

2. "Qual frase específica faria alguém rolar os olhos e fechar a página?"

3. "Se eu tirasse toda promessa e deixasse só a prova, ainda seria
    convincente?"

4. "Lendo só as headlines, consigo entender a transformação completa?"

5. "Tem algum ponto onde parece que estou tentando vender em vez de ajudar?"
```

**4 Testes Emocionais (complementar):**

| Teste | Aplicar Em |
|-------|------------|
| Dissonância Cognitiva | VSL body, LP ruminação |
| Fadiga de Prova | VSL proof section, LP depoimentos |
| Promessa vs Realidade | Headlines, CTAs |
| Gatilho de Desconfiança | Todo copy |

OUTPUT: production/$ARGUMENTS/reviews/cognitive-affective-validation.md

---

### Step 3: Multi-Model Validation (Zen MCP) - CONSOLIDAÇÃO (v4.6)

⚠️ **ESTE STEP É OBRIGATÓRIO. NÃO APROVAR SEM VALIDAÇÃO ZEN MCP.**

**MUDANÇA v4.6:** A partir de v4.6, Zen MCP é executado POR DELIVERABLE via copy-critic Fase 5.
Este step agora CONSOLIDA scores existentes ao invés de re-executar.

#### SE deliverables JÁ TÊM zen_scores nas validações individuais:

```
1. VERIFICAR validações existentes:
   - briefings/$ARGUMENTS/validations/creative-*-validation.md
   - briefings/$ARGUMENTS/validations/vsl-validation.md
   - briefings/$ARGUMENTS/validations/lp-validation.md
   - briefings/$ARGUMENTS/validations/email-validation.md

2. EXTRAIR zen_scores de cada arquivo:
   - emotional: X/10
   - logical: X/10
   - credibility: X/10
   - zen_verdict: PASS/NEEDS_WORK/FAIL

3. CONSOLIDAR em agregado:
   | Deliverable | Emotional | Logical | Credibility | Zen Verdict |
   |-------------|-----------|---------|-------------|-------------|
   | [cada um]   | X/10      | X/10    | X/10        | PASS/FAIL   |
   | **MÉDIA**   | X/10      | X/10    | X/10        | FINAL       |

4. NÃO re-executar Zen MCP se todos já têm zen_scores válidos
```

#### SE deliverables NÃO TÊM zen_scores (workflow legado):

```
Use mcp__zen__chat ou mcp__zen__codereview com Gemini:

1. Emotional Impact (1-10)
   - Does the copy create emotional response?
   - Are pain points sufficiently agitated?
   - Is the transformation compelling?

2. Logical Coherence (1-10)
   - Does the argument flow logically?
   - Are claims supported?
   - Are there logical gaps?

3. Credibility Assessment (1-10)
   - Are claims believable?
   - Is proof sufficient?
   - Does it sound authentic?

4. Improvement Suggestions
   - Top 3 areas to improve
   - Specific recommendations

⚠️ Marcar como "LATE_VALIDATION" - validações futuras devem usar workflow v4.6
```

OUTPUT: production/$ARGUMENTS/reviews/multi-model-validation.md

---

### Step 4: Consolidate Final Review

Merge all reviews into final assessment:

```markdown
# Final Review: $ARGUMENTS

## Review Summary

| Review Type | Score/Verdict | Status |
|-------------|---------------|--------|
| Internal (reviewer) | [X]/16 | PASS/FAIL |
| copy-critic MUP | STAND/REVISE | PASS/FAIL |
| copy-critic MUS | STAND/REVISE | PASS/FAIL |
| copy-critic One Belief | STAND/REVISE | PASS/FAIL |
| Zen Emotional | [X]/10 | PASS/FAIL |
| Zen Logical | [X]/10 | PASS/FAIL |
| Zen Credibility | [X]/10 | PASS/FAIL |

## Final Verdict

**APPROVED** | **NEEDS_REVISION**

## Issues to Address (if any)

### Critical
- [issue]

### Major
- [issue]

### Minor
- [issue]

## Strengths

- [strength 1]
- [strength 2]

## Next Steps

- [action 1]
- [action 2]
```

Write to: `production/$ARGUMENTS/reviews/final-review.md`

---

## Expected Output

```yaml
command: review-all
offer: $ARGUMENTS
status: success
reviews:
  internal:
    path: "production/$ARGUMENTS/reviews/internal-review.md"
    score: "[X]/16"
    verdict: "PASS|PASS_WITH_CONCERNS|NEEDS_REVISION"
  copy_critic:
    path: "production/$ARGUMENTS/reviews/copy-critic-verdicts.md"
    mup: "STAND|REVISE"
    mus: "STAND|REVISE"
    one_belief: "STAND|REVISE"
  multi_model:
    path: "production/$ARGUMENTS/reviews/multi-model-validation.md"
    emotional: "[X]/10"
    logical: "[X]/10"
    credibility: "[X]/10"
final:
  path: "production/$ARGUMENTS/reviews/final-review.md"
  verdict: "APPROVED|NEEDS_REVISION"
  issues:
    critical: [N]
    major: [N]
    minor: [N]
next_step: "[action based on verdict]"
```

## Decision Logic

| Condition | Final Verdict | Action |
|-----------|---------------|--------|
| Internal ≥14 AND all copy-critic STAND AND Zen avg ≥7 | **APPROVED** | Proceed to polish |
| Internal ≥12 AND all copy-critic STAND | **APPROVED** with concerns | Note improvements |
| Any copy-critic REVISE | **NEEDS_REVISION** | Fix strategic issues first |
| Internal <12 | **NEEDS_REVISION** | Revise copy |
| Any Zen score <5 | **NEEDS_REVISION** | Investigate specific issue |

## Error Handling

If Zen MCP fails:
1. **TENTAR NOVAMENTE** com modelo alternativo (gemini-2.5-flash se pro falhar)
2. Se persistir, verificar conectividade MCP
3. **NÃO PULAR** - Zen MCP é obrigatório para verdict final
4. Somente em caso de falha técnica irreversível: marcar como "TECHNICAL_FAILURE" e escalar para usuário

⚠️ **IMPORTANTE:** "SKIPPED" não é mais uma opção válida. Todos os 3 steps são obrigatórios.

## Quality Gate (BLOQUEANTE)

⚠️ **TODOS OS REQUISITOS SÃO OBRIGATÓRIOS PARA APROVAÇÃO**

Final approval requires:
- [ ] Internal review score ≥12/16
- [ ] All copy-critic verdicts = STAND
- [ ] **Zen MCP validation completa** (todos os 3 scores)
- [ ] Zen MCP scores ≥5/10 cada
- [ ] No critical issues
- [ ] final-review.md exists

### Gate 3: Production Quality

| Critério | Threshold | Status | Se Falhar |
|----------|-----------|--------|-----------|
| Internal Review | ≥12/16 | ✓/✗ | Revisar copy |
| copy-critic MUP | STAND | ✓/✗ | Corrigir MUP |
| copy-critic MUS | STAND | ✓/✗ | Corrigir MUS |
| Zen Emotional | ≥5/10 | ✓/✗ | Investigar |
| Zen Logical | ≥5/10 | ✓/✗ | Investigar |
| Zen Credibility | ≥5/10 | ✓/✗ | Investigar |

**SE QUALQUER CRITÉRIO FALHAR:**
1. NÃO apresentar ao usuário
2. IDENTIFICAR critério falhado
3. ITERAR internamente
4. RE-EXECUTAR /review-all após correção
