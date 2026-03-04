# Workflow Canônico v6.3

> Fonte: pesquisas-profundas/00.md + AUDITORIA-INTEGRACAO.md
> Versão: 6.3 | Data: 2026-02-01
> **v6.3:** Checkpoints bloqueantes + MCP enforcement

---

## Princípio Central

> **Copy Thinker Model:** IA executa pesquisa e estrutura. HUMANO decide Big Ideas.
> LLMs são estruturalmente incapazes de criatividade transformacional.
> Você seleciona MUP/MUS final — IA propõe opções.

---

## Visão Geral

```
PESQUISA → SÍNTESE → BRIEFING → PRODUÇÃO → VALIDAÇÃO
   ↓          ↓         ↓          ↓           ↓
 Sonnet     Opus      Opus      Sonnet      Opus

Entry Points:
audience-research → helix-system → production → copy-critic
      agent            agent          agent
```

---

## Decisões HUMANO vs IA

| Etapa | Quem Decide | Quem Executa |
|-------|-------------|--------------|
| Direção estratégica da oferta | **HUMANO** | - |
| Pesquisa VOC | - | IA |
| Seleção de MUP final | **HUMANO** | IA propõe opções |
| Seleção de MUS final | **HUMANO** | IA propõe opções |
| Big Idea/Ângulo | **HUMANO** | IA sugere |
| Execução de copy | - | IA |
| Julgamento final "funciona?" | **HUMANO** | - |

---

## FASE 1: PESQUISA

**Skill:** `audience-research-agent` (ÚNICO entry point)
**Modelo:** Sonnet (paralelo, custo-eficiente)
**Extended Thinking:** ON (10-16K budget)

### Invocação

```
Use audience-research-agent skill:
"Pesquisa completa para [oferta] no nicho [nicho]"
```

### Delegação Interna

O audience-research-agent orquestra automaticamente:
- `voc-research-agent` → Extração VOC técnica
- MCPs: Apify, Firecrawl, Playwright

### Gate de Saída

| Critério | Threshold | Bloqueante |
|----------|-----------|------------|
| synthesis.md existe | Sim | ✅ |
| Confidence | ≥70% | ✅ |
| 4 summaries existem | Sim | ✅ |
| Quotes verbatim | ≥50 | ✅ |

**Validação:**
```bash
python3 ~/copywriting-ecosystem/scripts/validate-gate.py RESEARCH path/to/offer
```

---

## FASE 2: AVATAR/CONSCIÊNCIA

**Skill:** `helix-system-agent` (Fases 1-4)
**Modelo:** Opus
**Extended Thinking:** ON (10-16K budget)

### Invocação

```
Use helix-system-agent skill:
"Iniciar HELIX Fases 1-4 para [oferta].
Carregar research/synthesis.md primeiro."
```

### Templates a Carregar

- `references/fundamentos/primeiros-principios-copy-chief.md` (OBRIGATÓRIO)
- `references/fundamentos/principios_fundamentais.md`
- `references/fundamentos/psicologia_engenheiro.md`

### Outputs

- `briefings/{offer}/phases/fase01-identificacao.md`
- `briefings/{offer}/phases/fase02-pesquisa.md`
- `briefings/{offer}/phases/fase03-avatar.md`
- `briefings/{offer}/phases/fase04-consciencia.md`

---

## FASE 3: MUP/MUS (Mecanismos)

**Skill:** `helix-system-agent` (Fases 5-6)
**Modelo:** Opus
**Extended Thinking:** ON → OFF (Bifásico)

### Workflow Divergente-Convergente

```
Fase 5A (Divergente, ET: OFF)
   → Gerar 15+ MUPs
   ↓
Fase 5B (Convergente, ET: ON 16K)
   → Avaliar e selecionar TOP 3
   ↓
Fase 6A (Divergente, ET: OFF)
   → Gerar 12 MUSs por MUP (36 total)
   ↓
Fase 6B (Convergente, ET: ON 16K)
   → Selecionar 3 pares MUP-MUS finais
```

### Template OBRIGATÓRIO

Carregar `~/.claude/templates/mup-mus-discovery.md` ANTES de iniciar Fase 5.

### Invocação

```
Use helix-system-agent skill:
"Executar Fases 5-6 (MUP/MUS) para [oferta].
USAR workflow divergente-convergente do mup-mus-discovery.md.
Carregar fases anteriores como contexto."
```

### Checkpoint OBRIGATÓRIO: Validação Pós-Fase 5

```
Use copy-critic skill:
"Valide o MUP desenvolvido:
- MUP Statement: [inserir]
- Avatar: [contexto]

Verificar: RMBC, especificidade, paradigm shift, vilão externo."
```

**Resultado esperado:** `STAND` antes de prosseguir para Fase 6.

### Checkpoint OBRIGATÓRIO: Validação Pós-Fase 6

```
Use copy-critic skill:
"Valide o MUS desenvolvido:
- MUS Statement: [inserir]
- MUP que resolve: [inserir]

Verificar: Espelhamento MUP-MUS, 4 camadas, prova."
```

**Resultado esperado:** `STAND` antes de prosseguir para Fase 7.

---

## FASE 4: EXECUÇÃO (Fases 7-10)

**Skill:** `helix-system-agent` (Fases 7-10)
**Modelo:** Sonnet
**Extended Thinking:** OFF

### Template OBRIGATÓRIO

Carregar `~/.claude/templates/rmbc-ii-workflow.md` para estrutura VSL.

### Invocação

```
Use helix-system-agent skill:
"Executar Fases 7-10 para [oferta].
USAR estrutura 7-seções do rmbc-ii-workflow.md.
Carregar briefing completo (fases 1-6) como contexto."
```

### Outputs

- `briefings/{offer}/phases/fase07-big-offer.md`
- `briefings/{offer}/phases/fase08-fechamento.md`
- `briefings/{offer}/phases/fase09-leads-ganchos.md`
- `briefings/{offer}/phases/fase10-progressao.md`
- `briefings/{offer}/helix-complete.md` (consolidado ≤10K tokens)

---

## FASE 5: PRODUÇÃO

**Skill:** `production-agent` (ÚNICO entry point)
**Modelo:** Sonnet
**Extended Thinking:** OFF

### Pre-Flight Check

Antes de produzir, verificar:
- [ ] MUP validation = STAND
- [ ] MUS validation = STAND
- [ ] helix-complete.md existe
- [ ] 10 fases completas

### Invocação

```
Use production-agent skill:
"Produzir deliverables para [oferta].
Tipos: [criativos|vsl|landing-page|emails]"
```

### Delegação Interna

O production-agent orquestra:
- `criativos-agent` → Hooks, ads, UGC
- `landing-page-agent` → LP 14 blocos
- VSL scripts → Via helix-system-agent

---

## FASE 6: VALIDAÇÃO

**Skill:** `copy-critic` (ÚNICO entry point)
**Modelo:** Opus (diferente do gerador)
**Extended Thinking:** ON (para análise)

### Workflow de Validação

```
1. copy-critic Fases 1-4 (CRITIC Framework)
      ↓
2. Fase 4.5 (Cognitive-Affective Gap)
   - 5 perguntas stress-test
   - 4 testes validação emocional
      ↓
3. Fase 5 (Zen MCP Validation)
   - Emotional: X/10
   - Logical: X/10
   - Credibility: X/10
      ↓
4. Blind Critique (opcional)
   - Avaliar sem contexto
   - Identificar gaps de clareza
```

### Invocação

```
Use copy-critic skill:
"Validar [tipo: criativo|vsl|lp|email] para [oferta].
Executar todas as 5 fases incluindo Zen MCP.
Mode: blind (se validação final)"
```

### Critérios de Aprovação

| Critério | Threshold |
|----------|-----------|
| copy-critic verdict | STAND |
| Zen MCP média | ≥7/10 |
| Cognitive-Affective Gap | 5/5 perguntas OK |

---

## Resumo de Entry Points

| Tipo de Tarefa | Skill ÚNICO | Alternativas Deprecadas |
|----------------|-------------|-------------------------|
| Pesquisa | `audience-research-agent` | helix-parallel, squad-research |
| Briefing | `helix-system-agent` | - |
| Produção | `production-agent` | produce-offer (alias) |
| Validação | `copy-critic` | review-all (complementar) |

---

## Modelos por Fase

| Fase | Modelo | Extended Thinking | Justificativa |
|------|--------|-------------------|---------------|
| Pesquisa | Sonnet | ON 10-16K | Custo-eficiente, paralelo |
| Avatar/Consciência | Opus | ON 10-16K | Psicologia profunda |
| MUP/MUS | Opus | Bifásico | Criação conceitual |
| Execução (7-10) | Sonnet | OFF | Produção criativa |
| Produção | Sonnet | OFF | Volume, velocidade |
| Validação | Opus | ON | Análise crítica |

---

## Anti-Patterns

| Errado | Certo |
|--------|-------|
| Usar múltiplos commands para pesquisa | Usar audience-research-agent |
| Pular validação de MUP/MUS | SEMPRE rodar copy-critic pós-fase 5 e 6 |
| Produzir sem briefing STAND | Validar antes de produzir |
| Mesmo modelo gera e valida | Opus valida o que Sonnet gerou |
| Extended Thinking em produção | ET apenas em análise/síntese |
| Declarar fase completa sem validação | SEMPRE rodar validate_gate |
| Fazer pesquisa manual (sem skill) | SEMPRE usar audience-research-agent |
| Ignorar templates | SEMPRE carregar template antes de criar deliverable |

---

## 🚨 ENFORCEMENT (v6.3)

### Checkpoints BLOQUEANTES

> **REGRA:** Claude NÃO pode declarar fase completa sem passar no checkpoint.

| Transição | Checkpoint | Validação |
|-----------|------------|-----------|
| Research → Briefing | Research Gate | `validate-gate.py RESEARCH` = PASSED |
| Fase 4 → Fase 5 | Avatar completo | `avatar/summary.md` existe |
| Fase 5 → Fase 6 | MUP validado | `copy-critic` = STAND |
| Fase 6 → Fase 7 | MUS validado | `copy-critic` = STAND |
| Briefing → Production | HELIX completo | 10 fases + `helix-complete.md` |
| Production → Entrega | Copy validada | `black_validation` = PASSED |

### MCP Copywriting - Uso OBRIGATÓRIO

```
ANTES de declarar qualquer fase completa:
  → Chamar validate_gate (MCP copywriting)

SE validate_gate NÃO foi chamado:
  → Claude DEVE perguntar: "Posso validar o gate antes de prosseguir?"
  → NÃO avançar até validação

APÓS produzir copy:
  → Chamar blind_critic + emotional_stress_test

ANTES de entregar copy final:
  → Chamar black_validation (6 gates obrigatórios)
```

### Templates - Evidência Obrigatória

Todo deliverable DEVE ter no header:

```markdown
> **Template usado:** [nome-do-template.md]
> **Versão:** [data ou versão]
```

**SE header ausente → Deliverable incompleto → Refazer.**

### Biblioteca de Nicho - Carregamento Obrigatório

```
ANTES de iniciar Research:
  → Carregar biblioteca_nicho_{nicho}_CONSOLIDADA.md

SE biblioteca não carregada:
  → Research opera sem contexto de nicho
  → Qualidade comprometida
```

### Anti-Bypass de Skills

| Fase | Skill OBRIGATÓRIA | Bypass = ERRO |
|------|-------------------|---------------|
| Research | `audience-research-agent` | ❌ Manual = bypass |
| Briefing | `helix-system-agent` | ❌ Manual = bypass |
| Production | `production-agent` | ❌ Manual = bypass |
| Validation | `copy-critic` | ❌ Manual = bypass |

**Regra:** Se Claude detectar que está fazendo tarefa coberta por skill sem invocar skill → PARAR e perguntar ao usuário.

---

## Checklist de Compliance

Antes de declarar oferta pronta:

- [ ] Research Gate PASSED (validate-gate.py)
- [ ] MUP validation = STAND
- [ ] MUS validation = STAND
- [ ] helix-complete.md ≤10K tokens
- [ ] Production validation = STAND + Zen ≥7
- [ ] Blind critique (se crítico) sem gaps

---

## Templates Metodológicos

| Template | Quando Usar | Fases |
|----------|-------------|-------|
| `~/.claude/templates/mup-mus-discovery.md` | Geração divergente-convergente MUP/MUS | 5-6 |
| `~/.claude/templates/rmbc-ii-workflow.md` | Estrutura VSL 7-seções Stefan Georgi | 7-10 |
| `~/.claude/templates/swipe-analysis-specs.md` | RAG specs para swipe files | 2 |
| `~/.claude/templates/swipe-decomposition.md` | Extrair PRINCÍPIOS de swipes (não copiar) | 2, 5-6 |
| `~/.claude/templates/extended-thinking-protocol.md` | Protocolo ET bifásico | 1-7 |

---

## Troubleshooting

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| MUP genérico | Fase divergente pulada | 15+ candidatos antes de convergir |
| Copy sem alma | Falta Extended Thinking em 5-6 | Usar Opus com budget máximo |
| Outputs homogêneos | Mesmo modelo gera e critica | Blind critique com modelo diferente |
| Gate falha | Deliverables incompletos | Verificar checklist da fase |
| Confidence <70% | Research incompleto | Re-executar módulos com gaps |
| MUS não espelha MUP | Conexão fraca | Voltar para fase 5, ajustar MUP |

---

*v6.3 - Checkpoints bloqueantes + MCP enforcement + Anti-bypass*
*Ref: research-enforcement.md para regras detalhadas*
*Atualizado: 2026-02-01*
