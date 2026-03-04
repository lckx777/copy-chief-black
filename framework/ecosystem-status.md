# Ecosystem Status - Copywriting Pipeline v5.5

**Última atualização:** 2026-03-04 17:28 (via sync-tracking.py)
**Versão:** v5.5 (Pattern-Based Knowledge Discovery)
**Último checkup:** ✅ PASSED

---

## Resumo Executivo

| Componente | Status | Contagem | Notas |
|------------|--------|----------|-------|
| Skills | ✅ | 10/10 | Todas instaladas e funcionais |
| Commands | ✅ | 9/9 | Todos funcionais |
| Agents | ✅ | 7/7 | Inclui novos voc-processor e competitor-analyzer |
| Templates | ✅ | 4/4 | Todos atualizados |
| Hooks | ✅ | 5/5 | session-start, user-prompt, pre-tool-use-gate, post-tool-use, curation |
| MCPs | ✅ | 7/7 | Apify, Firecrawl, Playwright, Zen, fb_ad_library, context7, claude-mem |
| Swipe Files | ✅ | 178 | 24 nichos, concursos expandido (10 arquivos) |
| Gold Standards | ✅ | 2 | relacionamento/quimica + concursos/hacker |
| Scripts | ✅ | 6/6 | +sync-offer-state.py (FASE 5) |
| **Copy Fundamentals** | ✅ | **13/13** | **NOVO** - Metodologias universais (3.586 linhas) |

**Status Geral:** 🟢 OPERACIONAL

---

## Ofertas Ativas

| Oferta | Tipo | Status | Score | Diretório |
|--------|------|--------|-------|-----------|
| Hacker Do Concurso | VSL | 🟢 Production | 95% | `concursos/hacker/` |
| CONCURSA-AI | SaaS | 🟢 Production | 93% | `concursos/concursa-ai/` |
| Gabaritando Lei Seca | TSL | 🟢 Production | 80% | `concursos/gabaritando-lei-seca/` |
| Gpt Dos Aprovados | TSL | 🟢 Production | 70% | `concursos/gpt-dos-aprovados/` |

---

## Skills

| Skill | Status | Triggers |
|-------|--------|----------|
| audience-research-agent | ✅ | VOC, audience, pesquisa, avatar |
| voc-research-agent | ✅ | extrair, Apify, quotes, viral |
| helix-system-agent | ✅ | helix, briefing, fases, MUP, MUS |
| criativos-agent | ✅ | criativo, hook, anúncio, ads |
| landing-page-agent | ✅ | LP, landing, página de vendas |
| copy-critic | ✅ | validar, testar, criticar, STAND |
| fragment-agent | ✅ | fragmentar, dividir, RAG |
| ai-setup-architect | ✅ | prompt, setup, agente |
| implementation-guide | ✅ | implementação, fase, verificar |
| offer-workflow-agent | ✅ | workflow, orquestração |

---

## Agents (Subagents)

| Agent | Status | Função |
|-------|--------|--------|
| researcher | ✅ | Pesquisa paralela isolada |
| copywriter | ✅ | Produção de copy |
| reviewer | ✅ | Validação e QA |
| synthesizer | ✅ | Merge de outputs paralelos |
| copy-validator | ✅ | Validação metodológica |
| voc-processor | ✅ | Processamento de VOC raw → processed |
| competitor-analyzer | ✅ | Análise de ads-library → spy report |

---

## Hooks (Gates Automáticos)

| Hook | Tipo | Função |
|------|------|--------|
| session-start.ts | SessionStart | Inicialização, primer de contexto |
| user-prompt.ts | UserPromptSubmit | Copy Chief Enforcement, Skill Auto-Invoke, Research Gate |
| pre-tool-use-gate.ts | PreToolUse | Sequential Thinking Gate, Reasoning Depth Gate |
| post-tool-use.ts | PostToolUse | Tracking + Token Validation (summaries ≤500t) |
| curation.ts | Compact | Preservação de memórias no /compact |

---

## MCPs (Model Context Protocol Servers)

| MCP | Status | Função | Prioridade |
|-----|--------|--------|------------|
| apify | ✅ | YouTube, Instagram, TikTok, Reclame Aqui | 1º (preferencial) |
| fb_ad_library | ✅ | Meta Ads Library extraction | 1º (ads) |
| firecrawl | ✅ | Web scraping, landing pages | 2º (fallback) |
| playwright | ✅ | Browser automation, login sites | 3º (último resort) |
| zen | ✅ | Multi-model validation (Gemini, GPT) | Situacional |

**Tool Priority:** Apify → Firecrawl → Playwright (para plataformas sociais)

---

## Slash Commands

| Command | Função | Categoria |
|---------|--------|-----------|
| /helix-parallel | Fan-out 4 pesquisas (sequencial) | Discovery |
| /squad-research | VOC paralelo via tmux | Discovery |
| /create-offer | Setup novo projeto | Execution |
| /produce-offer | Fan-out 4 produções | Execution |
| /review-all | Review multi-modelo | Execution |
| /plan-execution | Planning estruturado | Execution |
| /sync-project | Sync com Claude.ai | Admin |
| /sync-ecosystem | Sincronizar ofertas | Admin |
| /update-ecosystem | Atualizar installer | Admin |

---

## Scripts

| Script | Função | Versão |
|--------|--------|--------|
| discover-components.sh | Auto-discovery de componentes | v1.0 |
| generate-offers-table.sh | Gera tabela de ofertas | v1.0 |
| sync-version.sh | Sincroniza versão em arquivos | v1.0 |
| validate-gate.py | Validação de gates de qualidade | v2.0 |
| validate-gates.sh | Wrapper shell para validação | v1.0 |

---

## Templates

| Template | Propósito | Last Updated |
|----------|-----------|--------------|
| ads-library-spy-template.md | Descoberta de anúncios escalando | 2026-01-26 |
| research-deliverables-checklist.md | Validação de pesquisa | 2026-01-26 |
| trends-analysis-template.md | Análise de formatos/ângulos | 2026-01-26 |
| voc-viral-extraction-template.md | Extração de VOC | 2026-01-26 |

---

## Copy Fundamentals (NOVO - FASE 4.2)

Biblioteca de metodologias universais extraída de `criativos-agent` para uso em **toda copy** (VSL, LP, Email, Social).

**Localização:** `~/.claude/docs/copy-fundamentals/`

| Arquivo | Conteúdo | Tier |
|---------|----------|------|
| `CLAUDE.md` | Índice + quando usar cada fundamento | Obrigatório |
| `01-psicologia-humana.md` | 10 Gatilhos + 6 Necessidades + Progressão | CORE |
| `02-consciencia-mercado.md` | 5 Níveis Consciência + 5 Sofisticação | CORE |
| `03-metodologia-3ms.md` | Mistério + Mecanismo + Mercado | CORE |
| `04-nuuppecc-hooks.md` | 8 Atributos + 4 Fortalecedores | CORE |
| `05-curiosity-gap.md` | Hand Test + Don't Bury the Lead | CORE |
| `06-storytelling.md` | Intention + Obstacle + Rhythm | IMPORTANT |
| `07-processo-escrita.md` | COPYWORK → DRAFT → INCUBATE → EDIT | IMPORTANT |
| `08-formato-vs-angulo.md` | Distinção + 15 Ângulos | CORE |
| `09-estrutura-blocos.md` | 12 Elementos do Body | CORE |
| `10-tecnicas-execucao.md` | Tom WhatsApp + Sinestesia + Future Pacing | CORE |
| `11-principios-2026.md` | 5 Princípios para mercado 2026 | IMPORTANT |
| `12-big-ideas.md` | 4 Pilares de Conceito | IMPORTANT |

**Total:** 13 arquivos, 3.586 linhas

---

## Documentação de Referência

| Arquivo | Propósito | Carregamento |
|---------|-----------|--------------|
| `CLAUDE.md` | Instruções autoritativas | ✅ Automático |
| `GUIA-ECOSSISTEMA.md` | Guia completo detalhado | On-demand |
| `GUIA-USO-ECOSSISTEMA.md` | Regras de uso (higiene) | On-demand |
| `RUNBOOK.md` | Troubleshooting | On-demand |
| `CHANGELOG.md` | Histórico de versões | On-demand |

---

## Verificação de Saúde

```bash
# MCPs conectados
claude mcp list

# Skills disponíveis
ls ~/.claude/skills/

# Agents disponíveis
ls ~/.claude/agents/

# Hooks ativos
ls ~/.claude/hooks/*.ts

# Verificar duplicados (deve retornar vazio)
find ~/copywriting-ecosystem -name "copywriting-ecosystem" -type d | grep -v "^/Users/.*/copywriting-ecosystem$"

# Validar research gate
python3 ~/.claude/scripts/validate-gate.py RESEARCH concursos/concursa-ai
```

---

## Histórico de Atualizações

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-01-28 | v5.5 | Hook v5.5: 7 TIERs, Pattern-Based Knowledge Discovery |
| 2026-01-28 | v5.5 | TIER 0 (CONTEXT.md), TIER 4 (Mapeamentos, Auditorias), TIER 5-6 (Production, Refs) |
| 2026-01-28 | v5.4 | Path-Specific Rules: 4 offer rules em .claude/rules/offers/ |
| 2026-01-28 | v5.4 | Hook v5.4: discover-offer-context.sh com dual-mode auto-discovery |
| 2026-01-28 | v5.3 | Perfect Scenario: docs oficiais 2026, token optimization |
| 2026-01-28 | v5.2 | MAX_THINKING_TOKENS fix, claude-mem otimizado |
| 2026-01-28 | v5.1 | Command-based hooks + ENABLE_TOOL_SEARCH |
| 2026-01-27 | v5.0 | Dynamic discovery architecture |
| 2026-01-26 | v4.9.6 | Hooks: Sequential Thinking Gate, Skill Auto-Invoke, Research Gate |
| 2026-01-26 | v4.9.6 | Agents: voc-processor, competitor-analyzer |

---

*Atualizado: 2026-01-28 14:05 | v5.5*
