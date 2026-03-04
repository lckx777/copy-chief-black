# HELIX System - Workflow das 10 Fases

> Fluxo operacional e calibração de raciocínio por fase.
> Extraído de SKILL.md v6.0 para progressive disclosure.

---

## As 10 Fases

```
SESSÃO 1 — Fundação:  Fases 1-4 (Identificação, Pesquisa, Avatar, Consciência)
SESSÃO 2 — Mecanismos: Fases 5-7 (MUP, MUS, Big Offer)
SESSÃO 3 — Execução:  Fases 8-10 (Fechamento, Leads, Progressão Emocional)
```

Templates: `references/templates/briefing_fase[01-10]_*.md`

---

## Calibração de Raciocínio por Fase

### Fundamentos a Carregar

| Fase | Tipo | Fundamento |
|------|------|------------|
| 1-2 | Análise | `primeiros-principios-copy-chief.md` |
| 3-4 | Psicologia profunda | `principios_fundamentais.md` + `psicologia_engenheiro.md` |
| 5-7 | Criação conceitual | `puzzle_pieces.md` + SWIPEs + `DRE.md` + `RMBC.md` |
| 8-10 | Execução | Templates + SWIPEs |

### Tipo de Raciocínio

| Fase | Raciocínio | Uso |
|------|------------|-----|
| 1 (Identificação) | Extended thinking | Estratégia geral |
| 2 (Mineração) | Reflection após tool calls | Chains de extração |
| 3-4 (Avatar/Consciência) | Extended thinking | Análise psicológica |
| 5-7 (MUP/MUS/Offer) | Extended thinking | Desenvolvimento criativo |
| 8-10 (Execução) | Execução direta | Estrutura definida |

---

## Fluxo Operacional

```
1. Usuário despeja materiais brutos
         ↓
2. HELIX organiza por fase e identifica gaps
         ↓
3. Cruza com fundamentos e SWIPEs
         ↓
4. Itera fase por fase preenchendo template 1:1
         ↓
5. Pergunta apenas gaps críticos
         ↓
6. Entrega .md pronto e salva checkpoint
```

---

## Fluxo com Checkpoints

```
Fase 1-4 (Fundação)
      ↓
Fase 5 (MUP)
      ↓
[copy-critic MUP]──REVISE──→ Iterar MUP
      │STAND
      ↓
Fase 6 (MUS)
      ↓
[copy-critic MUS]──REVISE──→ Iterar MUS
      │STAND
      ↓
Fase 7-10 (Execução)
      ↓
[Gate Briefing]──FAIL──→ Corrigir items
      │PASS
      ↓
✅ Liberado para produção
```

---

## Referências — Ordem de Carregamento

### 1. OBRIGATÓRIO (Toda sessão)
- `references/fundamentos/primeiros-principios-copy-chief.md`

### 2. Core (Sempre)
- `references/core/metodologias.md`
- `references/core/formulas_e_criterios.md`
- `references/core/DRE.md`
- `references/core/RMBC.md`

### 3. Por Fase

**Fases 1-4:**
- `references/fundamentos/principios_fundamentais.md`
- `references/fundamentos/psicologia_engenheiro.md`

**Fases 5-7:**
- `references/fundamentos/puzzle_pieces.md`

**Fases 8-10:**
- Templates da fase específica
- SWIPEs do nicho correspondente

### 4. SWIPEs
- `references/swipes/swipes_index.md`
- ED: `references/swipes/ed/`
- EMAG: `references/swipes/emag/`

### 5. Auxiliares
- `references/fundamentos/comunicacao_pedreiro_resumo.md`
- `references/fundamentos/gatilhos_reptilianos.md`
- `references/playbooks/fase02_mineracao_playbook.md`
- `references/playbooks/fase02_deep_dive_copy.md`
- `references/core/output_format.md`
- `references/core/session_management.md`

---

## Output Location

| Tipo | Path |
|------|------|
| Phase outputs | `briefings/{offer}/phases/phase-{N}-{name}.md` |
| Checkpoints | `briefings/{offer}/checkpoints/checkpoint-{date}.yaml` |
| Complete briefing | `briefings/{offer}/helix-complete.md` |
| Validations | `briefings/{offer}/validations/{type}-{date}.md` |

**Limites:**
- helix-complete.md ≤ 10,000 tokens
- Salvar checkpoint após cada fase

---

## Gestão de Sessões

Para briefings completos, dividir em 3 sessões:
1. **Sessão 1:** Fases 1-4 (Fundação)
2. **Sessão 2:** Fases 5-7 (Mecanismos) + validações
3. **Sessão 3:** Fases 8-10 (Execução)

Ver: `references/core/session_management.md`

---

*Extraído de SKILL.md v6.0 - HELIX System Agent*
