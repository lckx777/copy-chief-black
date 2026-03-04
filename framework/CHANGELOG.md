# Changelog - Copywriting Ecosystem

Registro de todas as mudanças, correções e atualizações do ecossistema.

---

## [v5.6] - 2026-01-29

### Adicionado (helix-system-agent)
- **`primeiros-principios-copy-chief.md`** (16KB):
  - Framework mental completo do Copy Chief
  - Consolidação de princípios Khayat + Max Peters + Vitor Mound
  - Big Idea, MUP, MUS, DRE, One Belief, Crenças, Jornada Emocional
  - Referenciado no SKILL.md como "CARREGAR PRIMEIRO"

- **Princípio da Inversão de Crença:**
  - Substitui "4 Pilares de Big Ideas" (hardcoded de análise de swipes)
  - First principle: "identificar qual crença o mercado aceita como verdade e inverter de forma crível"

### Corrigido
- Encoding UTF-8 em 5 arquivos de fundamentos:
  - `puzzle_pieces.md`, `principios_fundamentais.md`
  - `comunicacao_pedreiro_resumo.md`, `gatilhos_reptilianos.md`, `psicologia_engenheiro.md`

### Melhorado
- SKILL.md reorganizado com referências em 5 níveis de prioridade
- Tabela "Calibração de Raciocínio por Fase" com fundamentos a carregar
- DRE.md e RMBC.md mantidos (não existiam na versão source)

### Arquivos Criados
- `~/.claude/skills/helix-system-agent/references/fundamentos/primeiros-principios-copy-chief.md`

### Arquivos Modificados
- `~/.claude/skills/helix-system-agent/SKILL.md`
- `~/.claude/skills/helix-system-agent/references/fundamentos/*.md` (5 arquivos encoding fix)

---

## [v5.5] - 2026-01-28

### Adicionado
- **Pattern-Based Knowledge Discovery (7 TIERs):**
  - TIER 0: Contexto Canônico (`CONTEXT.md`, `project_state.yaml`)
  - TIER 4: Knowledge Files (`*Mapeamento*`, `AUDITORIA*`, `*-complete.md`, `*depoimentos*`)
  - TIER 5: Production Assets (VSL, LP, Criativos, Emails)
  - TIER 6: Referências (`_materiais_originais/`, `swipes-adapta-org/`)

### Melhorado
- Hook v5.5 descobre arquivos por **padrões semânticos**, não nomes hardcoded
- Novos arquivos que seguem convenções são auto-descobertos
- Summaries expandidos: `*-summary.md` e `*-synthesis.md` (nomenclaturas alternativas)

### Corrigido
- Duplicatas no TIER 4 removidas com `sort -u`

---

## [v5.4] - 2026-01-28

### Adicionado
- **Path-Specific Rules para Ofertas:**
  - `.claude/rules/offers/concursa-ai.md`: MUP 94%, MUS 98%, DNA 5 componentes
  - `.claude/rules/offers/hacker.md`: MUP Ovelha Negra, expert Marcos
  - `.claude/rules/offers/gabaritando-lei-seca.md`: TSL lei seca context
  - `.claude/rules/offers/gpt-dos-aprovados.md`: MUP Desalinhamento, MUS 3 Etapas

- **Hook discover-offer-context.sh v5.4:**
  - Dual-mode: auto-discovery da raiz OU TIERs específicos por oferta
  - Modo Raiz: `find` auto-descobre TODAS ofertas (MACRO)
  - Modo Oferta: mostra Synthesis, Summaries, Briefings
  - Não depende de lista hardcoded

- **Concursa.AI Completa:**
  - 10 fases HELIX briefings
  - Research completa (VOC, competitors, mechanism, avatar)
  - Production structure setup
  - Export packages para Claude.ai

### Documentado
- **Bugs conhecidos do Claude Code:**
  - #16299: `paths:` frontmatter é NO-OP (carrega globalmente)
  - #18098: Subdirectory CLAUDE.md lazy loading não implementado
  - #10373: SessionStart hooks não injetam para sessões novas
  - Custo aceito: ~1.8K tokens (1% contexto)

### Arquivos Criados
- `.claude/rules/offers/concursa-ai.md`
- `.claude/rules/offers/hacker.md`
- `.claude/rules/offers/gabaritando-lei-seca.md`
- `.claude/rules/offers/gpt-dos-aprovados.md`
- `.claude/plans/path-specific-rules-implementation.md`
- `concursos/concursa-ai/briefings/phases/*.md` (10 fases)
- `export/concursa-ai/*` (knowledge-base package)

### Arquivos Modificados
- `~/.claude/hooks/discover-offer-context.sh` (reescrito v5.4)
- `~/.claude/.version` (5.3 → 5.4)

---

## [v5.3] - 2026-01-28

### Adicionado
- Perfect Scenario Implementation (docs oficiais 2026)
- ENABLE_TOOL_SEARCH=auto:5 (token optimization)
- CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=80
- filter-bash-output.sh, mcp-query-validator.sh hooks
- SubagentStart/Stop hooks
- Path-specific rules (production, briefings)

### Corrigido
- CLAUDE.md reduzido 51% (177→87 linhas)
- Status line com context% colorido
- Sandbox excludedCommands
- Skill schema (allowed-tools, context:fork)

---

## [v5.2] - 2026-01-28

### Corrigido
- MAX_THINKING_TOKENS: 31999 (limite API)
- context:fork removido (isolamento automático)
- claude-mem otimizado (50 → 15 obs)
- Redundância rules/CLAUDE.md removida

---

## [v5.1] - 2026-01-28

### Adicionado
- Command-based hooks
- ENABLE_TOOL_SEARCH

---

## [v5.0] - 2026-01-27

### Adicionado
- Dynamic discovery architecture

---

## [v4.9.8] - 2026-01-22

### Adicionado
- Modular rules extraction

---

## [v4.9.6] - 2026-01-26

### Adicionado
- **Quality Gate System (Hooks):**
  - `hooks/lib/session-state.ts`: Gerenciador de estado de sessão com tracking de reasoning depth
  - `hooks/post-tool-use.ts`: Rastreamento automático de leituras de arquivos
  - `hooks/pre-tool-use-gate.ts`: Gate de bloqueio para escrita de copy sem metodologia (mínimo 60% depth)
  - Padrões MACRO de detecção: arquivos de sistema auto-excluídos do gate

- **Skill copywriting-methodology:**
  - Auto-trigger em tasks de copy (headline, lead, vsl, criativo, script)
  - Workflow obrigatório: LER → EXTRAIR → PLANEJAR → PRODUZIR

- **Agent copy-validator:**
  - Validação de copy contra metodologias (RMBC, Puzzle Pieces, DRE)
  - Output estruturado com scores e correções sugeridas

### Corrigido
- **settings.json:**
  - Modelo: `claude-3-5-opus-20260125` → `opus` (alias válido)
  - Removido `defaultEffort` (parâmetro inexistente)
  - `thinkingBudget` → `env.MAX_THINKING_TOKENS: 32000`
  - Matcher: `Replace` → `NotebookEdit` (ferramenta correta)

- **Format de hooks:**
  - Output agora usa `hookSpecificOutput` (formato Jan/2026)

### Arquivos Criados
- `~/.claude/hooks/lib/session-state.ts`
- `~/.claude/hooks/post-tool-use.ts`
- `~/.claude/hooks/pre-tool-use-gate.ts`
- `~/.claude/skills/copywriting-methodology/SKILL.md`
- `~/.claude/agents/copy-validator.md`

### Arquivos Modificados
- `~/.claude/settings.json`
- `~/.claude/.version`
- `~/.claude/CHANGELOG.md`

### Component Counts
- SKILLS: 10 → 11 (+copywriting-methodology)
- AGENTS: 4 → 5 (+copy-validator)
- HOOKS: 3 → 5 (+post-tool-use, +pre-tool-use-gate)

---

## [v4.9.5] - 2026-01-24

### Adicionado
- **Enforcement Automático de Tracking:**
  - `scripts/sync-tracking.py`: Sincroniza automaticamente project_state.yaml → task_plan.md, progress.md, ecosystem-status.md
  - Hook `SessionEnd` roda sync-tracking.py automaticamente ao fechar sessão
  - `validate-research.sh` v1.1 roda sync após validação
  - Campo `phase.score` no project_state.yaml para score explícito
  - Regra de enforcement documentada no CLAUDE.md global

- **Auditorias CONCURSA.AI:**
  - `AUDITORIA-COPY-CHIEF.md`: Validação 93% production-ready vs referência Química
  - `AUDITORIA-SISTEMICA-OPERACIONAL.md`: 5 gaps identificados e corrigidos
  - Gap Corrections 1-7: CHURN→avatar, Demonstração Visual, Proof Arsenal, Future Pacing

- **Documentação de Instalação:**
  - `GUIA-INSTALACAO.md`: Instalação completa Mac + Windows WSL
  - `TUTORIAL-COMO-USAR.md` v4.9.5: Atualizado com sync-tracking

### Corrigido
- **Tracking desatualizado:** ecosystem-status.md, task_plan.md, progress.md não refletiam estado real
  - Causa raiz: dependência de memória (violava Regra Cardinal)
  - Solução: sync-tracking.py como enforcement automático

- **CONCURSA.AI status errado:** 25% Scaffolding → 93% Production
  - task_plan.md: Phase 2 → Phase 4
  - ecosystem-status.md: Tabela corrigida

### Atualizado
- `~/.claude/settings.json`: Hook SessionEnd com sync-tracking.py
- `scripts/validate-research.sh`: v1.0 → v1.1 com sync após validação
- `~/.claude/CLAUDE.md`: Seção "Enforcement Automático de Tracking" adicionada
- `concursos/concursa-ai/project_state.yaml`: score: 93 adicionado

### Arquivos Criados
- `scripts/sync-tracking.py`
- `concursos/concursa-ai/briefings/AUDITORIA-COPY-CHIEF.md`
- `concursos/concursa-ai/briefings/AUDITORIA-SISTEMICA-OPERACIONAL.md`
- `~/.claude/GUIA-INSTALACAO.md`

### Arquivos Modificados
- `~/.claude/CHANGELOG.md`
- `~/.claude/CLAUDE.md`
- `~/.claude/ecosystem-status.md`
- `~/.claude/settings.json`
- `scripts/validate-research.sh`
- `concursos/concursa-ai/task_plan.md`
- `concursos/concursa-ai/progress.md`
- `concursos/concursa-ai/project_state.yaml`
- `TUTORIAL-COMO-USAR.md`

### Princípio Aplicado
> "Todo update deve ser sistêmico, nunca depender de memórias."

Antes: Atualizar tracking dependia de lembrar → ficava desatualizado
Agora: sync-tracking.py roda automaticamente → sempre sincronizado

---

## [v4.9.4] - 2026-01-23

### REGRA CARDINAL ADICIONADA
- **Design Sistêmico (INVIOLÁVEL):**
  - "Todo update deve ser sistêmico, nunca depender de memórias"
  - Padrão MACRO obrigatório: auto-descoberta via find/glob
  - Padrão MICRO proibido: listas hardcoded de componentes
  - Single Sources of Truth definidas para versão, skills, commands, ofertas
  - Verificação Anti-MICRO obrigatória antes de qualquer mudança
  - Adicionada em `~/.claude/CLAUDE.md` como primeira regra após Identity

### Auditoria MICRO → MACRO (COMPLETA ✅)

**Plano de correção:** `~/.claude/plans/micro-to-macro-correction-plan.md`

**Fase 1 - Infraestrutura:**
- `~/.claude/.version` expandido com RESEARCH_TYPES, VOC_PLATFORMS, HELIX_PHASES, OFFER_TYPES
- `~/.claude/scripts/discover-components.sh` criado - auto-descoberta de componentes

**Fase 2 - Scripts Críticos:**
- `diagnose.sh` v2.0 - arrays hardcoded removidos, usa auto-descoberta
- `validate.sh` v2.0 - arrays hardcoded removidos, usa auto-descoberta
- `install.sh` - VERSION lido de .version, não hardcoded

**Fase 3 - Commands:**
- `sync-ecosystem.md` - ofertas via discover-components.sh
- `update-ecosystem.md` - --no-offers via auto-descoberta

**Fase 4 - Scripts de Oferta:**
- `create-offer.sh` v2.0 - VERSION e RESEARCH_TYPES de .version
- `generate-helix-complete.sh` v2.0 - VERSION e HELIX_PHASES de .version
- `parallel-research.sh` v2.0 - VOC_PLATFORMS de .version

**Fase 5 - Documentação:**
- `generate-offers-table.sh` criado - geração automática de tabelas de ofertas
- `/sync-ecosystem` atualizado para usar geração automática
- Tabelas de ofertas agora são auto-geradas, não hardcoded

**Resultado:** 0% componentes hardcoded (antes: 65%)

### Reformulado
- **/update-ecosystem completamente redesenhado:**
  - **Filosofia:** Descoberta automática + Exclusão explícita (não mais listas hardcoded)
  - Versão lida automaticamente de `~/.claude/.version`
  - rsync com exclusões copia TUDO automaticamente
  - Novos componentes incluídos sem edição manual
  - Flags: `--check` (dry-run), `--no-offers` (só infraestrutura)
  - 9 fases: Versão → Sync → Build → Copy .claude → Copy ecosystem → Scripts → ZIP → Validação → CHANGELOG

### Arquitetura Macro
- **Antes (Micro):** Lista hardcoded de arquivos → esquece novos → quebra
- **Agora (Macro):** Incluir tudo, excluir apenas auto-gerados → funciona para sempre

### Exclusões Definidas
- `debug/`, `cache/`, `plans/`, `session-env/`, `shell-snapshots/`
- `file-history/`, `projects/`, `paste-cache/`, `todos/`
- `history.jsonl`, `.git/`, `worktrees/`, `statsig/`, `memory.db*`

### Manutenção Futura
- Única ação necessária: adicionar à lista de exclusões se criar novo tipo de auto-gerado
- Novos skills, commands, hooks, templates = automaticamente incluídos

---

## [v4.9.3] - 2026-01-23

### Adicionado
- **Version Sync Automation:**
  - `~/.claude/.version`: Single Source of Truth para versão do ecossistema
  - `~/.claude/scripts/sync-version.sh`: Propaga versão para todos os arquivos
  - `diagnose.sh`: Nova seção "Sincronização de Versão" verifica consistência
  - Flags: `--check` (verificar), `--bump` (incrementar patch)
  - Elimina dessincronização manual entre 7+ arquivos

- **Gate Enforcement Scripts:**
  - `scripts/validate-gate.py`: Valida gates RESEARCH/BRIEFING/PRODUCTION com exit codes
  - `scripts/update-state.py`: Auto-atualiza project_state.yaml, progress.md, task_plan.md
  - Scripts Python puros (sem dependências externas)

- **Scripts de Instalação e Diagnóstico:**
  - `scripts/install.sh`: Instalador cross-platform (macOS + WSL)
  - `scripts/diagnose.sh`: Diagnóstico completo do ecossistema
  - Suporte: `--check`, `--update`, `--quick`, `--fix`

- **Tutorial Prático:**
  - `TUTORIAL-COMO-USAR.md`: Guia mastigado passo-a-passo
  - Filosofia: "Você conduz, Claude executa, Você aprova"
  - 7 pontos de aprovação documentados
  - Fluxo visual completo do workflow

- **Checkpoint Persistence:**
  - `project_state.yaml` instanciado nas 4 ofertas existentes
  - States preenchidos com dados reais (phases, gates, confidence)

### Corrigido
- **Gap G1:** `create-offer.sh` agora auto-instancia `project_state.yaml`
- **Gap G3:** Gates agora bloqueiam (exit code 1) em vez de apenas informar
- **Gap G4:** Tracking files podem ser atualizados via script

### Atualizado
- `create-offer.sh`: v4.9.2 → v4.9.3 com instanciação automática
- 4 ofertas com `project_state.yaml` funcional:
  - Hacker: PRODUCTION (92% confidence)
  - GPT dos Aprovados: PRODUCTION (85% confidence)
  - Gabaritando: PRODUCTION (75% confidence)
  - CONCURSA.AI: RESEARCH (pending)

### Arquivos Modificados
- `/copywriting-ecosystem/create-offer.sh`
- `/copywriting-ecosystem/scripts/validate-gate.py` (novo)
- `/copywriting-ecosystem/scripts/update-state.py` (novo)
- `/copywriting-ecosystem/scripts/install.sh` (novo)
- `/copywriting-ecosystem/scripts/diagnose.sh` (novo)
- `/copywriting-ecosystem/TUTORIAL-COMO-USAR.md` (novo)
- `/copywriting-ecosystem/concursos/*/project_state.yaml` (4 ofertas)

---

## [v4.9.1] - 2026-01-21

### Corrigido
- **Terminologia MUP/MUS em 3 templates:**
  - `templates/project_checklist.md`: "Única Promessa Matadora" → "Mecanismo Único do Problema"
  - `templates/project_checklist.md`: "Mecanismo Único Secreto" → "Mecanismo Único da Solução"
  - `templates/project_instructions_template.md`: "Main Unique Promise/Solution" → PT-BR correto
  - `templates/findings_template.md`: "Main Unique Promise/Solution" → PT-BR correto

- **Duplicado aninhado removido:** `copywriting-ecosystem/copywriting-ecosystem/`

### Atualizado
- Installer v4.9 → v4.9.1 com templates corrigidos
- `ecosystem-status.md` com timestamp de checkup
- `findings.md` com entrada de checkup
- `progress.md` com log de sessão

---

## [v4.9] - 2026-01-21

### Adicionado
- **Template ads-library-spy-template.md:** Novo template para benchmarking de ads pagos
  - Metodologia Discovery-First (buscar keywords → descobrir escalados)
  - Scale Score: `(ads_ativos × 2) + (variações_copy × 1.5)`
  - Classificação: 20+ altamente escalado, 10-19 escalando, 5-9 teste, <5 novo
  - Mapeamento obrigatório: link funil + tipo funil (VSL/TSL/LP)
  - Análise TOP 5 vídeos: formato + ângulo + hook (0-3s)
  - Localização: `~/.claude/templates/ads-library-spy-template.md`

- **Seção "Formatos Viralizados" no trends-analysis-template.md:**
  - 18 formatos de criativo DR mapeados (UGC, Talking Head, POV, Tela Dividida, etc.)
  - Tabela "Formatos Dominantes por Plataforma" com evidências
  - Nota crítica: FORMATO (visual) ≠ ÂNGULO (mensagem)

### Atualizado
- **Ads Library Spy Protocol v4.5 → v4.9:**
  - Metodologia Discovery-First obrigatória
  - Scale Score com fórmula documentada
  - Análise obrigatória de vídeos escalados
  - Distinção explícita FORMATO vs ÂNGULO
  - Referência ao novo template

### Arquivos Modificados
- `~/.claude/CLAUDE.md` (Ads Library Spy Protocol v4.9)
- `~/.claude/templates/trends-analysis-template.md` (seção Formatos Viralizados)

### Arquivos Criados
- `~/.claude/templates/ads-library-spy-template.md`

### Backups Criados
- `~/.claude/CLAUDE.md.backup-v48`
- `~/.claude/templates/trends-analysis-template.md.backup-v48`

---

## [v4.8.1] - 2026-01-21

### Adicionado
- **Ecosystem Hygiene Rules:** Seção crítica no CLAUDE.md global
  - Regra #1: Sempre abrir de `~/copywriting-ecosystem`
  - Regra #2: Nunca extrair ZIP dentro do ecossistema
  - Regra #3: Manter apenas 1 installer no Desktop
  - Regra #4: Hierarquia de contexto documentada
  - Checklist semanal de manutenção
  - Troubleshooting table

- **GUIA-USO-ECOSSISTEMA.md:** Guia permanente de uso
  - Localização: `~/.claude/GUIA-USO-ECOSSISTEMA.md`
  - 12 seções cobrindo workflow, troubleshooting, comandos

- **Nova Oferta Descoberta:** GPT dos Aprovados
  - Tipo: TSL (~R$32 low ticket)
  - Status: Scaffolding criado
  - Diretório: `concursos/gpt-dos-aprovados/`

### Corrigido
- **Cleanup de Estrutura:** Removidos 4 diretórios duplicados aninhados
  - `copywriting-ecosystem/copywriting-ecosystem/`
  - `gabaritando-lei-seca/copywriting-ecosystem/`
  - `hacker/copywriting-ecosystem/`
  - `hacker/_materiais_originais/copywriting-ecosystem/`

- **Estrutura Legacy Removida:** `clients/` (v4.7 pattern)

- **Installers Antigos Limpos:** 5 ZIPs removidos do Desktop
  - Mantido apenas: `ecossistema-v48-installer.zip`

### Atualizado
- Tabela de ofertas com Score e última atualização
- Status real: Hacker 85%, Gabaritando 75%, GPT 5%
- task_plan.md global com status auditado

### Arquivos Modificados
- `~/.claude/CLAUDE.md` (Ecosystem Hygiene + ofertas)
- `~/copywriting-ecosystem/task_plan.md`
- `~/copywriting-ecosystem/progress.md`

### Arquivos Criados
- `~/.claude/GUIA-USO-ECOSSISTEMA.md`

---

## [v4.8] - 2026-01-19

### Adicionado
- **Niche-First Architecture:** Estrutura `{nicho}/{oferta}/` sem `clients/`
- Installer package v4.8

---

## [v4.6] - 2026-01-19

### Adicionado
- **Zen MCP por Deliverable:** Integrado Fase 5 ao copy-critic
  - Zen MCP agora roda POR DELIVERABLE, não apenas no /review-all
  - Validação proativa ao invés de reativa
  - Elimina necessidade de ter todos deliverables prontos para validar

### Alterado
- `copy-critic/SKILL.md`: 4 fases → 5 fases (nova Fase 5: Zen MCP Validation)
- `validation-template.md`: Adicionado zen_scores ao frontmatter
- `review-all.md`: Step 3 agora consolida zen_scores existentes
- `gate-enforcement.md`: Gate 3 atualizado para validação por deliverable

### Arquivos Modificados
- `~/.claude/skills/copy-critic/SKILL.md`
- `~/copywriting-ecosystem/templates/validations/validation-template.md`
- `~/.claude/commands/review-all.md`
- `~/.claude/skills/guia-implementacao-v42/references/gate-enforcement.md`

### Output Novo
```yaml
zen_scores:
  emotional: X/10
  logical: X/10
  credibility: X/10
  zen_verdict: PASS | NEEDS_WORK | FAIL
```

---

## [v4.5.2] - 2026-01-19

### Corrigido
- **FORMATO vs ÂNGULO:** Clarificação conceitual
  - FORMATO = estrutura de produção (UGC, talking head, etc.)
  - ÂNGULO = abordagem estratégica (dor, curiosidade, etc.)
  - Documentação atualizada em criativos-agent

### Adicionado
- Biblioteca de formatos expandida nos swipe-files

---

## [v4.5.1] - 2026-01-18

### Corrigido
- **Quality Gate Enforcement:** Tornados obrigatórios (não mais sugestões)
  - Zen MCP agora OBRIGATÓRIO em /review-all
  - Scripts de validação criados

### Adicionado
- `~/.claude/scripts/validate-gates.sh`
- Gate enforcement documentation

---

## [v4.5] - 2026-01-18

### Adicionado
- **Swipe Files Library:** 1,092 criativos transcritos
  - Organizados em 24 nichos
  - Indexados por formato e ângulo
- Criativos-agent upgrade com frameworks 2026
- PRSA-DTC framework documentado

### Arquivos Criados
- `~/.claude/skills/criativos-agent/references/swipe-files/` (24 nichos)
- `~/.claude/skills/criativos-agent/references/frameworks/prsa-dtc.md`
- `~/.claude/skills/criativos-agent/references/principios-2026.md`

---

## [v4.4] - 2026-01-17

### Adicionado
- **Ads Library Spy Protocol:** Integração com fb_ad_library MCP
- Workflow de mineração de concorrentes documentado

---

## [v4.3] - 2026-01-17

### Corrigido
- **Subagent MCP Access:** Resolvido problema de herança
  - Subagents custom não herdam MCPs
  - Solução: usar `subagent_type: general-purpose`

### Atualizado
- Slash commands atualizados para usar general-purpose
- helix-parallel com MCP access funcional

---

## [v4.3-draft] - 2026-01-17

### Identificado
- **Gap Crítico:** Subagents (Task tool) não herdam MCPs automaticamente
  - Evidência: ReclameAqui agent disse "não tenho acesso ao Playwright MCP"
  - Evidência: Social agent disse "não tenho acesso direto aos scrapers Apify"
  - Impacto: VOC extraction defaultou para WebSearch, retornando blogs ao invés de comentários reais
  - Sessão de referência: #633 (17 Jan 2026, 5:45 PM)

### Corrigido
- **Plugin GitHub re-habilitado**
  - Arquivo: `~/.claude.json`
  - Mudança: Removido `plugin:github:github` de `disabledMcpServers`
  - Sessão: 17 Jan 2026, 8:29 PM

### Verificado
- **MCPs globais já configurados**
  - Confirmado que apify, firecrawl, playwright, zen existem no root de `~/.claude.json`
  - O problema NÃO era configuração ausente, mas herança em subagents

### Resolvido (mesma sessão)
- **Causa raiz identificada:** Custom subagent_types (researcher, copywriter, etc.) não herdam MCPs
- **Solução encontrada:** Usar `subagent_type: general-purpose` com prompts específicos
- **Testado:**
  - `researcher` → ❌ Sem MCPs (apenas Read, Write, WebSearch)
  - `general-purpose` → ✅ Todos os MCPs (Apify, Firecrawl, Playwright, Zen)

### Pendente
- [ ] Atualizar slash commands para usar general-purpose
- [ ] Atualizar guia para v4.3
- [ ] Criar RUNBOOK com troubleshooting

---

## [v4.2] - 2026-01-16

### Adicionado
- Skill `guia-implementacao-v42` instalada globalmente
- Hooks de sessão (session-start.ts, user-prompt.ts, curation.ts)
- Plugin claude-mem para memória entre sessões

### Configurado
- MCPs globais: apify, firecrawl, playwright, zen
- Plugins: claude-mem, planning-with-files, github

---

## [v4.1] - 2026-01-14

### Adicionado
- VOC Quality Protocol no CLAUDE.md global
- Prioridade de ferramentas: Apify → Playwright → Firecrawl → WebSearch
- Viral-First Strategy para VOC

### Atualizado
- Guia de implementação v4.1 com seções de paralelização
- Output locations para todos os subagents

---

## [v4.0] - 2026-01-14

### Adicionado
- 4 subagentes para paralelização (researcher, copywriter, reviewer, synthesizer)
- 8 slash commands de orquestração
- Tiered output structure (raw → processed → summary)
- Fan-out/Fan-in workflow

### Arquivos Criados
- `~/.claude/agents/researcher.md`
- `~/.claude/agents/copywriter.md`
- `~/.claude/agents/reviewer.md`
- `~/.claude/agents/synthesizer.md`
- `~/.claude/commands/helix-parallel.md`
- `~/.claude/commands/produce-offer.md`
- `~/.claude/commands/review-all.md`
- `~/.claude/commands/sync-project.md`

---

## [v3.0] - Anterior

### Componentes
- Skills base (8 skills)
- MCPs iniciais (firecrawl, playwright)
- Plugins (claude-mem, planning-with-files)

---

## Convenções

### Formato de Entrada
```
## [vX.Y] - YYYY-MM-DD

### Adicionado
- Item novo

### Corrigido
- Bug fix

### Alterado
- Mudança em funcionalidade existente

### Removido
- Funcionalidade removida

### Identificado
- Gap ou problema encontrado

### Pendente
- [ ] Item para fazer
```

### Severidade de Issues
- **CRÍTICA:** Bloqueia funcionalidade principal
- **ALTA:** Impacto significativo mas tem workaround
- **MÉDIA:** Inconveniência, não bloqueia
- **BAIXA:** Melhoria futura
