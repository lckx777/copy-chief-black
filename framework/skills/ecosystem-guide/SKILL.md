---
name: ecosystem-guide
description: |
  Orquestrador unificado do ecossistema. Ativa quando:
  - "nova oferta", "criar oferta", "iniciar projeto"
  - "continuar implementação", "retomar oferta", "onde parei"
  - "qual fase", "próximo passo", "estado do ecossistema"
  - "verificar fase", "o que falta fazer", "troubleshooting"
metadata:
  version: 1.0.0
  merged_from: offer-workflow-agent, implementation-guide
  updated: 2026-01-27
---

# Ecosystem Guide

Orquestrador unificado para workflow de ofertas e estado do ecossistema.

## Quick State Check

```bash
# Verificar estado atual
ls ~/.claude/skills/ | wc -l    # Skills
ls ~/.claude/commands/*.md | wc -l    # Commands

# MCPs conectados
claude mcp list | grep "Connected" | wc -l

# Versão do ecossistema
grep "VERSION=" ~/.claude/.version
```

---

## Workflow Principal

```
PESQUISA → HELIX → PRODUÇÃO → ENTREGA
   ↓         ↓         ↓         ↓
audience-research → helix-system → production-agent → copy-critic
```

### Criar Nova Oferta
Usar skill `create-offer` ou manualmente:
```bash
cd ~/copywriting-ecosystem/{nicho}
mkdir -p {oferta}/{research,briefings/phases,production}
```

---

## 4 Fases do Pipeline

### FASE 1: PESQUISA (1-2 dias)

**Skill:** `audience-research-agent`

**O que acontece:**
- Orquestra 4 módulos de pesquisa (VOC, Competitors, Mechanism, Avatar)
- Cada módulo gera `summary.md` (≤500 tokens)
- Synthesizer consolida em `research/synthesis.md`

**Quality Gate:**
- [ ] synthesis.md existe
- [ ] Confidence score ≥70%
- [ ] 4 summaries presentes

**Validação:** `python3 ~/copywriting-ecosystem/scripts/validate-gate.py RESEARCH {path}`

---

### FASE 2: HELIX BRIEFING (2-3 dias)

**Comando:** Invocar `helix-system-agent`

**10 Fases HELIX:**
1. MUP (Mecanismo Único de Persuasão)
2. MUS (Mecanismo Único de Solução)
3. DRE (Dominant Resident Emotion)
4. One Belief
5. Inimigo Comum
6. Nova Oportunidade
7. Prova/Autoridade
8. Oferta Irresistível
9. Stack de Valor
10. Urgência/Escassez

**Quality Gate:**
- [ ] 10/10 fases preenchidas
- [ ] MUP validado com copy-critic (STAND)
- [ ] MUS validado com copy-critic (STAND)

---

### FASE 3: PRODUÇÃO (3-5 dias)

**Skill:** `production-agent`

**Deliverables:**
- VSL draft completo
- LP 14 blocos
- ≥3 criativos por plataforma
- Sequência de emails

**Quality Gate:**
- [ ] Review score ≥12/16

---

### FASE 4: REVIEW & ENTREGA

**Skill:** `copy-critic` (validação final)

**Entrega:** Usar skill `sync-project` para sincronizar com Claude.ai Project

---

## Skills Rápidos

| Situação | Skill |
|----------|-------|
| Iniciar pesquisa | `audience-research-agent` |
| Gerar briefing | `helix-system-agent` |
| Validar decisão | `copy-critic` |
| Produzir copy | `production-agent` |
| Criar criativos | `criativos-agent` |
| Criar LP | `landing-page-agent` |
| Sync Claude.ai | `sync-project` |
| Ver status | Ler `project_state.yaml` |
| Compactar | `/compact` |

---

## Orquestração de Sessões (AIOS Pattern)

> **Princípio:** Cada sessão tem foco único. Sessão que tenta fazer tudo = nenhuma bem feita.

### Padrão Recomendado por Oferta

| Sessão | Foco | Duração | Contexto Necessário |
|--------|------|---------|---------------------|
| **S1: Research** | VOC + Competitors + Mechanism | 1-2h | Templates + biblioteca nicho |
| **S2: HELIX 1-4** | One Belief → Avatar → DRE → Escalada | 1-2h | synthesis.md + VOC summary |
| **S3: HELIX 5-6** | MUP → MUS (Mecanismo) | 1-2h | Fases 1-4 + mecanismo-unico.yaml |
| **S4: HELIX 7-10** | Oferta → Prova → Leads → Horror | 1h | Fases 1-6 |
| **S5: Produção** | LP + Criativos + VSL | 2-3h | briefings completos + swipes |
| **S6: Review** | Validação adversarial | 1h | Deliverables prontos |

### Regras de Sessão

1. **Uma sessão = uma fase.** Não misturar research com produção.
2. **Início:** Ler project_state.yaml → CONTEXT.md → synthesis.md (se existir).
3. **Handoff:** Ao terminar, atualizar project_state.yaml com próxima ação clara.
4. **/compact a 60%.** Contexto acima de 60% degrada output.
5. **Subagents para isolar.** Tarefas paralelas em subagents, não no contexto principal.

---

## Handoff Estruturado entre Fases (AIOS Pattern)

> **Princípio:** Cada fase produz outputs padronizados que a próxima fase consome.
> Handoff claro = zero perda de contexto entre sessões.

### Contratos de Handoff

| De → Para | Arquivo Handoff | Campos Obrigatórios |
|-----------|-----------------|---------------------|
| **Research → HELIX** | `research/synthesis.md` | DRE identificada, confidence score, top quotes, mecanismo hipotese |
| **HELIX → Production** | `briefings/helix-complete.md` + `mecanismo-unico.yaml` | 10 fases preenchidas, mecanismo VALIDATED, DRE + escalada, One Belief |
| **Production → Review** | Story file (`production/stories/`) | Copy produzida, scores MCP, dev notes, versões |
| **Review → Entrega** | `reviews/final-review.md` | black_validation ≥8, human approval, changelog |

### Campos Padronizados no Handoff

Todo handoff entre fases DEVE conter:

```yaml
handoff:
  from_phase: [RESEARCH|BRIEFING|PRODUCTION|REVIEW]
  to_phase: [BRIEFING|PRODUCTION|REVIEW|DELIVERY]
  date: [ISO date]
  gate_status: [PASSED|FAILED]
  key_decisions:
    - [decisão 1 + razão]
    - [decisão 2 + razão]
  open_questions:
    - [questão que a próxima fase precisa resolver]
  files_to_read:
    - [path relativo ao arquivo mais importante]
```

### Story File por Deliverable

Template: `~/.claude/templates/story-deliverable-generic.md`
Cada deliverable de production/ DEVE ter um story file com:
- Metadata (oferta, fase, expert, data)
- Acceptance Criteria (thresholds específicos)
- Production Notes (decisões tomadas + razões)
- QA Results (scores MCP, feedback, ações)
- Change Log (versões + mudanças)

> Ref: constitution.md → "Story file por deliverable"

---

## Troubleshooting

### "Não sei onde parei"
1. Ler `{oferta}/CLAUDE.md` ou `project_state.yaml`
2. Verificar último arquivo modificado: `ls -lt research/ briefings/ production/ | head -10`

### "Contexto estourando"
1. Executar `/compact`
2. Se persistir: nova sessão, ler synthesis.md primeiro

### "Quality gate falhou"
1. Identificar qual gate (Research, Briefing, Production)
2. Ver critério específico que falhou
3. Refazer apenas a parte necessária

### "MCP não funciona"
Verificar conexão: `claude mcp list`

---

## Subagents - IMPORTANTE

**Para tarefas que PRECISAM de MCPs (VOC, scraping):**
```
subagent_type: general-purpose
```

**Custom types (researcher, copywriter) NÃO herdam MCPs.**

---

## Output Structure

```
{oferta}/
├── research/
│   ├── voc/summary.md
│   ├── competitors/summary.md
│   ├── mechanism/summary.md
│   ├── avatar/summary.md
│   └── synthesis.md
├── briefings/
│   └── phases/fase-01.md ... fase-10.md
├── production/
│   ├── vsl/drafts/
│   ├── landing-page/drafts/
│   └── creatives/drafts/
└── project_state.yaml
```

---

## Checklist de Sessão

### Início
- [ ] Verificar qual oferta está ativa
- [ ] Ler CLAUDE.md ou project_state.yaml
- [ ] Identificar próxima ação

### Durante
- [ ] Atualizar findings.md com descobertas
- [ ] /compact se contexto > 60%

### Fim
- [ ] Atualizar status
- [ ] Documentar próxima ação clara

---

*v1.0.0 - Merged from offer-workflow-agent + implementation-guide*
