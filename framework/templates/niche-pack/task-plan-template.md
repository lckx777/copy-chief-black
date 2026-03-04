---
template_name: "niche-pack-task-plan"
template_version: "1.0.0"
template_type: "niche-pack"
description: "Template de task plan para novas ofertas criadas via niche pack"
phase: "any"
output_format: "markdown"
---

# Task Plan: {{OFFER_NAME}}

**Versao:** v1.0
**Data:** {{DATE}}
**Status:** IDLE - Aguardando Research

---

## Objetivo

Desenvolver copy completa para {{OFFER_NAME}} no nicho {{NICHE_DISPLAY}}.

---

## Entregaveis

| # | Fase | Entregavel | Status |
|---|------|------------|--------|
| 1 | Research | VOC Summary | NOT_STARTED |
| 2 | Research | VOC Trends | NOT_STARTED |
| 3 | Research | Competitors Summary | NOT_STARTED |
| 4 | Research | Ads Library Spy | NOT_STARTED |
| 5 | Research | Mechanism Summary | NOT_STARTED |
| 6 | Research | Avatar Summary | NOT_STARTED |
| 7 | Research | Synthesis | NOT_STARTED |
| 8 | Briefing | HELIX Fases 1-10 | NOT_STARTED |
| 9 | Briefing | Mecanismo Unico | NOT_STARTED |
| 10 | Production | VSL/TSL | NOT_STARTED |
| 11 | Production | Landing Page | NOT_STARTED |
| 12 | Production | Criativos | NOT_STARTED |
| 13 | Production | Emails | NOT_STARTED |

---

## Fases de Execucao

### FASE 1: Research
- [ ] Carregar biblioteca do nicho
- [ ] Invocar audience-research-agent
- [ ] VOC extraction (min 50 quotes/plataforma)
- [ ] Ads Library Spy (4 niveis)
- [ ] Mechanism research
- [ ] Avatar consolidation
- [ ] Synthesis (confidence >= 70%)
- [ ] validate_gate RESEARCH

### FASE 2: Briefing (HELIX)
- [ ] Fases 1-4 (Fundacao)
- [ ] Fases 5-6 (MUP/MUS)
- [ ] Fases 7-10 (Execucao)
- [ ] validate_gate BRIEFING
- [ ] Mecanismo Unico VALIDATED

### FASE 3: Production
- [ ] Produzir deliverables
- [ ] blind_critic por peca
- [ ] emotional_stress_test por peca
- [ ] layered_review
- [ ] black_validation (>= 8/10)

### FASE 4: Review
- [ ] copy-critic (STAND)
- [ ] black_validation final
- [ ] HUMANO aprova

---

## 5-Question Reboot

| Question | Answer |
|----------|--------|
| Where am I? | IDLE - Setup completo |
| Where am I going? | Research Phase |
| What's the goal? | Copy completa para {{OFFER_NAME}} |
| What have I learned? | Nada ainda - oferta nova |
| What have I done? | Setup de estrutura via create-niche-pack |

---

*Criado em {{DATE}} via create-niche-pack*
