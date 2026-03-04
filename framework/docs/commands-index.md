# Commands Index - Ecossistema v4.9.6

> Índice completo de slash commands disponíveis.
> **Atualizado:** 2026-01-26

---

## Visão Geral

| Categoria | Commands | Função |
|-----------|----------|--------|
| **DISCOVERY** | 2 | Pesquisa e análise |
| **EXECUTION** | 3 | Produção de copy |
| **ADMIN** | 4 | Manutenção e sync |
| **Total** | **9** | |

---

## DISCOVERY (Pesquisa/Análise)

### /helix-parallel

**Uso:** `/helix-parallel {offer-name}`

**Descrição:** Executa 4 research subagents em paralelo para coleta completa de dados.

**Subagents:**
1. **VOC** - Voice of Customer (YouTube, Instagram, TikTok, BR sources)
2. **Competitors** - Análise de concorrentes via Ads Library
3. **Mechanism** - Pesquisa de mecanismos científicos
4. **Avatar** - Perfil psicográfico do público

**Output:**
```
research/{offer}/
├── voc/
│   ├── raw/*.md
│   ├── processed/*.md
│   └── summary.md
├── competitors/
│   ├── raw/*.md
│   ├── processed/ads-library-spy.md
│   └── summary.md
├── mechanism/
│   ├── raw/*.md
│   ├── processed/*.md
│   └── summary.md
├── avatar/
│   ├── raw/*.md
│   ├── processed/*.md
│   └── summary.md
└── synthesis.md
```

**Duração:** 90-180 minutos (sequencial)

**Quando usar:**
- Início de nova oferta
- Pesquisa completa necessária
- Sem pressa de deadline

---

### /squad-research

**Uso:** `/squad-research {offer-name}`

**Descrição:** Paralelização TRUE via claude-squad - 4 módulos VOC rodando SIMULTANEAMENTE.

**Pré-requisitos:**
```bash
brew install tmux
brew install gh && gh auth login
brew install claude-squad
```

**Módulos paralelos:**
1. YouTube comments
2. Instagram comments
3. TikTok comments
4. BR Sources (Reclame Aqui, Reddit BR)

**Duração:** 30-60 minutos (2-3x mais rápido)

**Quando usar:**
- Deadline apertado
- Múltiplas ofertas simultâneas
- Token budget disponível (4×200k = 800k tokens)

**Quando NÃO usar:**
- Aprendendo o workflow
- Budget limitado
- Única oferta sem pressa

---

## EXECUTION (Produção)

### /create-offer

**Uso:** `/create-offer {nicho} {oferta}`

**Descrição:** Cria estrutura completa de projeto para nova oferta.

**Estrutura criada:**
```
{nicho}/{oferta}/
├── CLAUDE.md           # Instruções específicas da oferta
├── task_plan.md        # Plano de execução
├── findings.md         # Descobertas durante pesquisa
├── progress.md         # Progresso do trabalho
├── project_state.yaml  # Estado da oferta
├── research/
│   ├── voc/
│   │   ├── raw/
│   │   └── processed/
│   ├── competitors/
│   │   ├── raw/
│   │   └── processed/
│   ├── mechanism/
│   │   ├── raw/
│   │   └── processed/
│   └── avatar/
│       ├── raw/
│       └── processed/
├── briefings/
│   ├── phases/
│   └── validations/
└── production/
    ├── vsl/
    ├── landing-page/
    ├── creatives/
    └── emails/
```

**Quando usar:**
- Nova oferta do zero
- Estrutura padronizada necessária

---

### /produce-offer

**Uso:** `/produce-offer {offer-name}`

**Descrição:** Executa 4 production subagents com quality gates obrigatórios.

**Pré-requisitos:**
- Research Gate: PASSED
- Briefing Gate: PASSED (HELIX completo + MUP/MUS STAND)

**Subagents:**
1. **VSL** - Script completo com hook variations
2. **Landing Page** - Copy em 14 blocos
3. **Creatives** - Hooks para Meta/YouTube/TikTok
4. **Emails** - Sequência de 7 emails

**Output:**
```
production/{offer}/
├── vsl/
│   ├── drafts/v1-{date}.md
│   ├── variations/
│   └── final/
├── landing-page/
│   ├── blocks/
│   └── lp-complete.md
├── creatives/
│   ├── meta/
│   ├── youtube/
│   └── tiktok/
└── emails/
    ├── 01-welcome.md
    ├── 02-story.md
    └── ...
```

**Quality Gates:**
- Internal review ≥12/16 para PASS
- Cada peça precisa 3+ variations

---

### /review-all

**Uso:** `/review-all {offer-name}`

**Descrição:** Validação multi-modelo com consolidação via Zen MCP.

**Checklist de Review:**

| Checklist | Pontos | Mínimo para PASS |
|-----------|--------|------------------|
| Hook (6-Question) | /6 | 4/6 |
| Body (5-Point) | /5 | 4/5 |
| Consistency (5-Point) | /5 | 4/5 |
| **TOTAL** | **/16** | **12/16** |

**Vereditos:**
- **PASS** (≥14/16): Proceed to launch
- **PASS_WITH_CONCERNS** (≥12/16): Can publish, note improvements
- **NEEDS_REVISION** (<12/16): Must fix before proceeding

**Output:**
```
production/{offer}/reviews/
├── vsl-review-{date}.md
├── lp-review-{date}.md
└── creatives-review-{date}.md
```

---

## ADMIN (Manutenção)

### /sync-ecosystem

**Uso:** `/sync-ecosystem`

**Descrição:** Sincroniza todas as ofertas com padrões v4.9.6.

**Ações:**
1. Auto-descobre ofertas via `find -name "task_plan.md"`
2. Verifica estrutura de cada oferta
3. Atualiza project_state.yaml
4. Sincroniza com ecosystem-status.md

**Output:**
- Relatório de sincronização
- Lista de ofertas atualizadas
- Warnings de inconsistências

---

### /sync-project

**Uso:** `/sync-project {offer} {project-name}`

**Descrição:** Prepara arquivos para upload em Claude.ai Project.

**Ações:**
1. Identifica arquivos relevantes da oferta
2. Concatena em formato otimizado para RAG
3. Remove dados sensíveis
4. Gera ZIP pronto para upload

**Output:**
```
export/{offer}/
├── research-bundle.md    # VOC + Competitors + Avatar
├── briefing-bundle.md    # HELIX completo
├── production-bundle.md  # Copy gerada
└── {offer}-project.zip   # ZIP para upload
```

---

### /update-ecosystem

**Uso:** `/update-ecosystem`

**Descrição:** Gera ZIP do ecossistema com auto-discovery de componentes.

**Ações:**
1. Descobre componentes via `find`/`glob`
2. Atualiza versão se necessário
3. Gera ZIP estruturado
4. Documenta mudanças

**Output:**
```
~/Desktop/ecossistema-v{version}-installer.zip
```

**Conteúdo do ZIP:**
- Skills, commands, hooks, templates
- Scripts de automação
- Documentação atualizada

---

### /plan-execution

**Uso:** `/plan-execution {offer-name}`

**Descrição:** Cria arquivos de planejamento para tarefa complexa.

**Arquivos criados:**
```
{offer}/
├── task_plan.md   # Plano estruturado
├── findings.md    # Descobertas
└── progress.md    # 5-Question Reboot
```

**Estrutura task_plan.md:**
```markdown
# Task Plan: {offer}

## Current Phase
[RESEARCH | BRIEFING | PRODUCTION | REVIEW]

## Objectives
1. ...
2. ...

## Deliverables
- [ ] Deliverable 1
- [ ] Deliverable 2

## Dependencies
- Depends on: [list]
- Blocks: [list]

## Notes
...
```

---

## Fluxo Recomendado

```
1. /create-offer {nicho} {oferta}
   ↓
2. /helix-parallel {offer}  (ou /squad-research para speed)
   ↓
3. validate-gate.py RESEARCH {offer}
   ↓
4. [Criar HELIX briefing via helix-system-agent]
   ↓
5. validate-gate.py BRIEFING {offer}
   ↓
6. /produce-offer {offer}
   ↓
7. /review-all {offer}
   ↓
8. validate-gate.py PRODUCTION {offer}
   ↓
9. /sync-project {offer} {project}
```

---

## Troubleshooting

### Command não encontrado

```bash
# Verificar se comando existe
ls ~/.claude/commands/

# Verificar nome correto
cat ~/.claude/commands/*.md | grep -l "nome-do-comando"
```

### Gate bloqueando produção

```bash
# Verificar status do gate
python scripts/validate-gate.py RESEARCH path/to/offer --verbose

# Ver deliverables faltando
python scripts/validate-gate.py BRIEFING path/to/offer --verbose
```

### squad-research não funciona

```bash
# Verificar pré-requisitos
which tmux
which gh
which claude-squad

# Instalar faltantes
brew install tmux gh claude-squad
gh auth login
```

---

*Last updated: 2026-01-26 | Ecosystem v4.9.6*
