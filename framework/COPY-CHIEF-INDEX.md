# Copy Chief Index - Ecossistema v4.9.6

> Índice master de todos os componentes do ecossistema de copywriting.
> **Atualizado:** 2026-01-26

---

## Quick Navigation

| Componente | Quantidade | Documentação |
|------------|------------|--------------|
| [Skills](#skills) | 10 | Agentes especializados |
| [Commands](#commands) | 9 | Slash commands |
| [MCPs](#mcps) | 7 | Model Context Protocol servers |
| [Hooks](#hooks) | 7 | Automações de sessão |
| [Agents](#agents) | 7 | Subagents para Task tool |
| [Templates](#templates) | 4 | Templates de produção |
| [Swipe Files](#swipe-files) | 169 | 24 nichos |
| [Scripts](#scripts) | 5 | Automação bash/python |

---

## Skills

> Agentes especializados invocados automaticamente via triggers.
> Documentação completa: `~/.claude/skills/{skill}/SKILL.md`

| Trigger | Skill | Quando Usar | Arquivos Chave |
|---------|-------|-------------|----------------|
| pesquisa, VOC, público, avatar, dores | **audience-research-agent** | Início de oferta, pesquisa de público | `SKILL.md`, `references/` |
| extrair, Apify, quotes, viral | **voc-research-agent** | Extração técnica de comentários | `SKILL.md` |
| helix, briefing, fases, MUP, MUS | **helix-system-agent** | Criar briefing VSL completo | `SKILL.md`, `references/core/`, `templates/` |
| criativo, hook, anúncio, ads | **criativos-agent** | Criar/analisar criativos DR | `SKILL.md`, `references/swipe-files/` |
| LP, landing page, página de vendas | **landing-page-agent** | Produzir copy de LP em 14 blocos | `SKILL.md` |
| validar, testar, criticar, STAND | **copy-critic** | Stress-test de decisões estratégicas | `SKILL.md` |
| fragmentar, dividir, arquivo grande, RAG | **fragment-agent** | Otimizar arquivos para Claude Projects | `SKILL.md` |
| criar prompt, fazer agente, setup IA | **ai-setup-architect** | Arquitetar sistemas Claude/IA | `SKILL.md` |
| implementação, verificar fase, troubleshooting | **implementation-guide** | Checkpoint tracking, workflow guidance | `SKILL.md` |
| nova oferta, workflow, qual fase | **offer-workflow-agent** | Orquestrar 4 fases de produção | `SKILL.md` |

### Detalhamento por Skill

#### audience-research-agent
- **Função:** Orquestrador de pesquisa profunda em 4 fases
- **Output:** Score ≥70/100 para passar para HELIX
- **Fases:** Análise → Extração VOC → Síntese Psicográfica → Output RAG

#### voc-research-agent
- **Função:** Extração técnica via Apify actors
- **Tool Priority:** Apify → Playwright → Firecrawl → WebSearch
- **Output:** `*-viral-extraction.md` com quotes + engagement

#### helix-system-agent
- **Função:** Copy Chief 8D - Sistema 10 fases para VSL
- **Output:** `helix-complete.md` com MUP, MUS, One Belief
- **Referências:** RMBC.md, DRE.md, puzzle-pieces.md

#### criativos-agent
- **Função:** Gerador de criativos Direct Response
- **Metodologia:** 3Ms + NUUPPECC + 4 Fortalecedores
- **Output:** Hooks, scripts de vídeo, variações

#### landing-page-agent
- **Função:** Produção de LP em 14 blocos persuasivos
- **Output:** `lp_[produto].md` pronto para Canva
- **Mapeamento:** Cada bloco ↔ fase HELIX

#### copy-critic
- **Função:** Crítico adversarial 5 fases
- **Fases:** DECOMPOSE → VERIFY → CHALLENGE → SYNTHESIZE → Zen MCP
- **Output:** STAND (aprovado) ou KILL (reprovar)

#### fragment-agent
- **Função:** Divide arquivos grandes para RAG
- **Chunk:** 100-200 linhas por fragmento
- **Output:** ZIP com nomenclatura padrão

#### ai-setup-architect
- **Função:** Meta-agente para criar setups Claude
- **Processo:** Escutar → Red Flags → Perguntas → Construir
- **Output:** CLAUDE.md, skills, hooks configurados

#### implementation-guide
- **Função:** Guia de implementação v4.3
- **Checkpoints:** Anti-hallucination, phase verification
- **Workflow:** Claude Code ↔ Claude.ai híbrido

#### offer-workflow-agent
- **Função:** Orquestrador de 4 fases
- **Fases:** PESQUISA → HELIX → PRODUÇÃO → ENTREGA
- **Gerencia:** project_state.yaml, quality gates

---

## Commands

> Slash commands para execução rápida.
> Documentação: `~/.claude/commands/{command}.md`

### Por Categoria

#### DISCOVERY (Pesquisa/Análise)

| Command | Argumento | Descrição |
|---------|-----------|-----------|
| `/helix-parallel` | `{offer-name}` | Executa 4 research subagents em paralelo (VOC, Competitors, Mechanism, Avatar) |
| `/squad-research` | `{offer-name}` | Paralelização TRUE via claude-squad: 90-180min → 30-60min |

#### EXECUTION (Produção)

| Command | Argumento | Descrição |
|---------|-----------|-----------|
| `/create-offer` | `{nicho} {oferta}` | Cria estrutura projeto: research/, briefings/, production/ |
| `/produce-offer` | `{offer-name}` | Executa 4 production subagents com quality gates |
| `/review-all` | `{offer-name}` | Multi-model validation + Zen MCP. Score 0-16 |

#### ADMIN (Manutenção)

| Command | Argumento | Descrição |
|---------|-----------|-----------|
| `/sync-ecosystem` | (sem args) | Sincroniza todas ofertas com v4.9. Auto-descobre componentes |
| `/sync-project` | `{offer} {project}` | Prepara arquivos para upload em Claude.ai Project |
| `/update-ecosystem` | (sem args) | Gera ZIP com auto-discovery. Versiona ecossistema |
| `/plan-execution` | `{offer-name}` | Cria task_plan.md, findings.md, progress.md |

---

## MCPs

> Model Context Protocol servers para funcionalidades externas.
> Guia completo: `~/.claude/docs/mcp-usage-guide.md`

| MCP | Função | Quando Usar | Comando Exemplo |
|-----|--------|-------------|-----------------|
| **apify** | VOC via Actors (YT, IG, TT, ReclameAqui) | Extração de comentários | `call-actor` |
| **fb_ad_library** | Mineração Meta Ads Library | Pesquisa de ads escalados | `get_meta_ads`, `get_meta_platform_id` |
| **firecrawl** | Web scraping + agent discovery | Scraping de landing pages | `firecrawl_scrape`, `firecrawl_search` |
| **playwright** | Browser automation (último resort) | Sites dinâmicos, login required | `browser_navigate`, `browser_snapshot` |
| **zen** | Multi-model validation | copy-critic Fase 5, consensus | `consensus`, `thinkdeep`, `chat` |
| **claude-mem** | Memory persistence | Contexto entre sessões | `search`, `timeline`, `get_observations` |
| **context7** | Documentation lookup | Buscar docs de bibliotecas | `resolve-library-id`, `query-docs` |

### Tool Priority (OBRIGATÓRIO)

Para extração de plataformas sociais:
```
1. Apify Actor específico (preferencial)
2. Playwright direto (se Apify falha)
3. Firecrawl search (se Playwright falha)
4. WebSearch (ÚLTIMO RESORT)
```

**NUNCA pular direto para WebSearch sem tentar Apify primeiro.**

---

## Hooks

> Automações que executam em eventos de sessão.
> Guia completo: `~/.claude/docs/hooks-guide.md`

| Hook | Trigger | Função | Timeout |
|------|---------|--------|---------|
| **session-start.ts** | SessionStart | Injeta session primer com contexto temporal | 10s |
| **user-prompt.ts** | UserPromptSubmit | Auto-detecta triggers de skills | 10s |
| **curation.ts** | PreCompact, SessionEnd | Cura contexto antes de compactar | 120s |
| **post-tool-use.ts** | PostToolUse | Registra uso de ferramentas para auditoria | 5000ms |
| **pre-tool-use-gate.ts** | PreToolUse | Gate de segurança: valida permissões | 10000ms |
| **skill-triggers.ts** | Custom | Detecta skill triggers implícitos | Custom |
| **session-state.ts** | Custom | Persiste state entre sessões | Custom |

### Fluxo de Execução

```
SessionStart
    ↓
session-start.ts (primer de contexto)
    ↓
UserPromptSubmit
    ↓
user-prompt.ts (detecta triggers)
    ↓
PreToolUse
    ↓
pre-tool-use-gate.ts (valida permissões)
    ↓
[Tool executa]
    ↓
PostToolUse
    ↓
post-tool-use.ts (registra uso)
    ↓
PreCompact / SessionEnd
    ↓
curation.ts (preserva memórias)
```

---

## Agents

> Subagents para uso com Task tool.
> Documentação: `~/.claude/agents/{agent}.md`

| Agent | Função | Tools |
|-------|--------|-------|
| **researcher** | Pesquisa paralela isolada | Read, Write, WebSearch, MCPs |
| **copywriter** | Produção de copy | Read, Write |
| **reviewer** | Validação e QA | Read, Write |
| **synthesizer** | Merge de outputs paralelos | Read, Write, Grep |
| **copy-validator** | Validação metodológica | Read, Grep, Glob |
| **voc-processor** | Processamento raw → processed | Read, Write, Grep |
| **competitor-analyzer** | Análise ads-library → spy report | Read, Write, Grep |

---

## Templates

> Templates de produção para deliverables padronizados.
> Localização: `~/.claude/templates/`

| Template | Propósito | Last Updated |
|----------|-----------|--------------|
| `ads-library-spy-template.md` | Análise de ads escalados | 2026-01-26 |
| `research-deliverables-checklist.md` | Validação de research gate | 2026-01-26 |
| `trends-analysis-template.md` | FORMATO + ÂNGULO + TENDÊNCIA | 2026-01-26 |
| `voc-viral-extraction-template.md` | Extração VOC com métricas | 2026-01-26 |

---

## Swipe Files

> Biblioteca de referências por nicho.
> Índice completo: `~/.claude/docs/swipe-files-index.md`
> Localização: `~/.claude/skills/criativos-agent/references/swipe-files/`

### Resumo por Nicho (169 arquivos, 24 nichos)

| Nicho | Arquivos | Nichos Relacionados |
|-------|----------|---------------------|
| emagrecimento | 12 | diabetes, menopausa, exercícios |
| ed | 12 | prostata, aumento-peniano, relacionamento |
| diabetes | 12 | emagrecimento, pressão-alta |
| renda-extra | 10 | concursos, escrita |
| relacionamento | 10 | sexualidade, lei-da-atração |
| lei-da-atração | 10 | relacionamento, saúde-mental |
| escrita | 8 | renda-extra, infantil-maternidade |
| sexualidade | 6 | relacionamento, ED |
| rejuvenescimento | 6 | emagrecimento, menopausa |
| exercicios | 6 | emagrecimento, diabetes |
| prostata | 5 | ED, pressão-alta |
| pack | 5 | Vários |
| infantil-maternidade | 5 | escrita, relacionamento |
| visao | 4 | Saúde geral |
| saude-mental | 4 | lei-da-atração, relacionamento |
| prisao-de-ventre | 4 | diabetes, digestão |
| moda | 4 | Lifestyle |
| menopausa | 4 | emagrecimento, rejuvenescimento |
| aumento-peniano | 4 | ED, sexualidade |
| pressao-alta | 3 | diabetes, prostata |
| pet | 3 | Lifestyle |
| alzheimer | 3 | Saúde cognitiva |
| varizes | 2 | Circulação |
| **concursos** | 1 | renda-extra |

**Nota:** Nicho concursos precisa expansão (FASE 4).

---

## Scripts

> Scripts de automação bash/python.
> Localização: `~/.claude/scripts/`

| Script | Função | Versão |
|--------|--------|--------|
| `discover-components.sh` | Auto-discovery de componentes | v1.0 |
| `generate-offers-table.sh` | Gera tabela de ofertas | v1.0 |
| `sync-version.sh` | Sincroniza versão em arquivos | v2.1 |
| `validate-gate.py` | Validação de quality gates | v2.0 |
| `validate-gates.sh` | Wrapper shell para validação | v1.0 |

---

## Plugins

> Plugins habilitados no ecossistema.

| Plugin | Função | Status |
|--------|--------|--------|
| `claude-mem@thedotmack` | Memory persistence across sessions | ✅ Ativo |
| `planning-with-files@planning-with-files` | Task tracking (task_plan.md, progress.md) | ✅ Ativo |

---

## Ofertas Ativas

| Oferta | Tipo | Status | Score | Diretório |
|--------|------|--------|-------|-----------|
| CONCURSA.AI | SaaS | 🟢 Production | 93% | `concursos/concursa-ai/` |
| Hacker | VSL | 🟢 Production | 88% | `concursos/hacker/` |
| Gpt Dos Aprovados | TSL | 🟢 Production | 70% | `concursos/gpt-dos-aprovados/` |
| Gabaritando Lei Seca | TSL | 🟢 Production | 65% | `concursos/gabaritando-lei-seca/` |

---

## Documentação de Referência

| Arquivo | Propósito | Carregamento |
|---------|-----------|--------------|
| `CLAUDE.md` | Instruções autoritativas | ✅ Automático |
| `COPY-CHIEF-INDEX.md` | Este índice | On-demand |
| `GUIA-ECOSSISTEMA.md` | Guia completo detalhado | On-demand |
| `GUIA-USO-ECOSSISTEMA.md` | Regras de uso (higiene) | On-demand |
| `RUNBOOK.md` | Troubleshooting | On-demand |
| `CHANGELOG.md` | Histórico de versões | On-demand |
| `ecosystem-status.md` | Status dos componentes | On-demand |

### Docs Específicos (FASE 2)

| Arquivo | Propósito |
|---------|-----------|
| `docs/mcp-usage-guide.md` | Guia de uso de MCPs |
| `docs/commands-index.md` | Índice de commands |
| `docs/swipe-files-index.md` | Índice de swipe files |
| `docs/hooks-guide.md` | Guia de hooks |

---

*Last updated: 2026-01-26 | Ecosystem v4.9.6*
