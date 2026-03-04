---
template_name: "research-deliverables-checklist"
template_version: "1.0.0"
template_type: "checklist"
description: "Checklist de deliverables obrigatorios para Research Gate (7 itens bloqueantes)"
phase: "research"
output_format: "markdown"
---

# Research Deliverables Checklist v2.0

> **OBRIGATÓRIO:** Usar este checklist antes de declarar Research Gate PASSED.
> **Validação:** `python scripts/validate-gate.py RESEARCH /path/to/offer`

---

## Deliverables Obrigatórios

### CORE (Bloqueante)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/synthesis.md` | Synthesis consolidada | Existe + Confidence >= 70% |

### VOC (Bloqueante)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/voc/summary.md` | Summary executivo | Existe + <= 500 tokens |
| ⬜ | `research/voc/trends-analysis.md` | FORMATO + ÂNGULO | Existe (OBRIGATÓRIO v4.9.6) |
| ⬜ | `research/voc/raw/*.md` | Extrações brutas | >= 3 plataformas |

### VOC Processado (Recomendado)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/voc/processed/pain-points.md` | Dores classificadas | Por intensidade |
| ⬜ | `research/voc/processed/desires.md` | Desejos organizados | Declarado/Implícito/Secreto |
| ⬜ | `research/voc/processed/objections.md` | Objeções mapeadas | Com counters |
| ⬜ | `research/voc/processed/language-patterns.md` | Linguagem VOC | Expressões verbatim |

### COMPETITORS (Bloqueante)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/competitors/summary.md` | Summary executivo | Existe |
| ⬜ | `research/competitors/processed/ads-library-spy.md` | Análise de ads | Scale Scores calculados |

### MECHANISM (Bloqueante summary)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/mechanism/summary.md` | Summary executivo | Existe |
| ⬜ | `research/mechanism/processed/mechanism-research.md` | MUP/MUS Research | Recomendado |

### AVATAR (Bloqueante summary)
| Status | Arquivo | Descrição | Critério |
|--------|---------|-----------|----------|
| ⬜ | `research/avatar/summary.md` | Summary executivo | Existe |
| ⬜ | `research/avatar/processed/avatar-profile.md` | Perfil + DRE | Recomendado |

---

## Métricas Mínimas

| Métrica | Mínimo | Recomendado | Strict |
|---------|--------|-------------|--------|
| VOC Quotes | 50 | 200 | 300+ |
| Confidence | 70% | 80% | 90%+ |
| Plataformas | 3 | 4 | 5+ |
| Triangulação | 2x | 3x | 4x+ |

---

## Validação Automática

```bash
# Modo normal (recomendado para começar)
python scripts/validate-gate.py RESEARCH /path/to/offer

# Modo strict (todos deliverables)
python scripts/validate-gate.py RESEARCH /path/to/offer --strict

# Output JSON (para scripts)
python scripts/validate-gate.py RESEARCH /path/to/offer --json
```

---

## Fluxo Correto

```
1. Invocar audience-research-agent
   ↓
2. Skill executa workflow de 4 fases
   ↓
3. Deliverables gerados automaticamente
   ↓
4. validate-gate.py RESEARCH (verificação)
   ↓
5. Gate PASSED (ou corrigir issues)
```

---

## Erros Comuns

| Erro | Causa | Correção |
|------|-------|----------|
| "trends-analysis.md não existe" | Skill não invocada | Executar audience-research-agent |
| "synthesis.md não encontrado" | Pesquisa incompleta | Completar Fase 3 do workflow |
| "Confidence < 70%" | Pouca evidência | Expandir pesquisa VOC |
| "summary.md não existe" | Módulo pulado | Gerar summary para cada tipo |

---

## NUNCA Fazer

- ❌ Declarar "Research Gate PASSED" manualmente sem validação
- ❌ Pular trends-analysis.md (obrigatório v4.9.6)
- ❌ Fazer pesquisa "manual" sem invocar skill
- ❌ Criar synthesis.md sem gerar summaries individuais
- ❌ Usar task_plan.md ad-hoc sem seguir template

---

---

*Last updated: 2026-01-26*
*Template version: v2.0*
*Ecosystem: v4.9.6*
*Compatível com validate-gate.py v2.0*
