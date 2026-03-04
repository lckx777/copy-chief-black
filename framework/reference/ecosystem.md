---
phases: [ON_DEMAND]
priority: LOW
tokens: ~1800
---

# Ecosystem Rules (v6.5)

> Regras de design sistêmico, higiene e estrutura do ecossistema.
> Extraído de CLAUDE.md para modularização.
> **v6.5:** MCP Enforcement + Template Enforcement + Anti-Bypass

---

## 🔧 Contexto de Uso (v6.4)

> **Este ecossistema opera via Subscription (Claude Max 20x), NAO via API.**
> CLI (producao primaria) + Web (colaboracao + RAG). Workflow: CLI -> /sync-project -> Web -> Download -> CLI.

---

## REGRA CARDINAL: Design Sistêmico

> **"Todo update deve ser sistêmico, nunca depender de memórias. Todo o ecossistema deve ser sistêmico."**

### Princípios MACRO (OBRIGATÓRIO)

| Padrão | MACRO (CORRETO) | MICRO (PROIBIDO) |
|--------|-----------------|------------------|
| **Componentes** | Auto-descoberta via `find`/`glob` | Listas hardcoded de nomes |
| **Versão** | Single source: `~/.claude/.version` | VERSION em múltiplos arquivos |
| **Ofertas** | Detectar por estrutura (`task_plan.md`) | Lista fixa de ofertas esperadas |
| **Configuração** | Ler de arquivo central | Valores inline no código |
| **Exclusões** | Padrões (`.git/`, `__pycache__/`) | Nomes específicos de arquivos |

### Regra de Ouro: Self-Discovery

```bash
# MACRO - Descobre automaticamente
SKILLS=$(find ~/.claude/skills -maxdepth 1 -type d | wc -l)
OFFERS=$(find ~/copywriting-ecosystem -name "task_plan.md" -type f | wc -l)

# MICRO - Depende de memória/lista (PROIBIDO)
SKILLS=("skill1" "skill2" "skill3")
EXPECTED_OFFERS=("hacker" "gabaritando")
```

### Por que isso importa?

1. **Zero Manutenção**: Novo componente = funciona automaticamente
2. **Zero Drift**: Não há como ficar desatualizado
3. **Zero Memória**: Sistema é auto-descritivo
4. **Escalabilidade**: 10 ou 100 componentes = mesmo código

**Verificacao Anti-MICRO:** Se mudanca quebra com novo componente, exige editar multiplos arquivos, ou tem listas hardcoded -> REFATORAR para MACRO primeiro.

### Single Sources of Truth

| Dado | Fonte Autoritativa |
|------|-------------------|
| Versão do ecossistema | `~/.claude/.version` |
| Skills existentes | `~/.claude/skills/*/` (auto-discover) |
| Commands existentes | `~/.claude/commands/*.md` (auto-discover) |
| Ofertas ativas | `*/task_plan.md` exists (auto-discover) |
| Tipos de research | `~/.claude/.version` → `RESEARCH_TYPES=` |
| Fases HELIX | `~/.claude/.version` → `HELIX_PHASES=` |
| **Estado da oferta** | `project_state.yaml` → sincroniza outros |

### Enforcement Automatico de Tracking

`project_state.yaml` (fonte de verdade) -> `python scripts/sync-tracking.py` -> atualiza task_plan.md, progress.md, ecosystem-status.md.

**NUNCA** atualizar tracking manualmente. Atualizar `project_state.yaml` e rodar sync.

---

## Ecosystem Hygiene

| Regra | Descricao |
|-------|-----------|
| #1 Diretorio | SEMPRE `cd ~/copywriting-ecosystem && claude`. Nunca abrir de subdiretorio. |
| #2 ZIP | Extrair fora do ecossistema (`~/Desktop`). NUNCA dentro. |
| #3 Installer | Manter apenas 1 versao no Desktop. |
| #4 Hierarquia | `~/.claude/CLAUDE.md` (global) > `~/copywriting-ecosystem/CLAUDE.md` (projeto). Nunca CLAUDE.md por oferta. |

**Checklist Semanal:** Sem duplicados aninhados, git commit, task_plan.md atualizado.
**Guia Completo:** `~/.claude/GUIA-USO-ECOSSISTEMA.md`

---

## Estrutura de Diretórios

### Hierarquia Niche-First
```
~/copywriting-ecosystem/{nicho}/{oferta}/
```

### Exemplo
```
~/copywriting-ecosystem/
├── concursos/                           ← NICHO
│   ├── biblioteca_nicho_*.md            ← VOC consolidada do nicho
│   ├── gabaritando-lei-seca/            ← OFERTA
│   └── hacker/                          ← OFERTA
├── saude/                               ← NICHO (futuro)
└── relacionamento/                      ← NICHO (futuro)
```

### Dentro de Cada Oferta
- Research: `research/{type}/` (voc, competitors, mechanism, avatar)
- Briefing: `briefings/phases/`
- Production: `production/` (vsl, landing-page, creatives, emails)

### Biblioteca de Nicho
Arquivo `biblioteca_nicho_{nicho}_CONSOLIDADA.md` na raiz do nicho:
- VOC consolidada de todas ofertas do nicho
- Avatar unificado com variações
- Linguagem e compliance do nicho
- Ângulos validados cross-oferta

**Uso:** Carregar biblioteca do nicho ANTES de pesquisa específica.

---

## Output Rules

- Raw data → `raw/` (never load to context)
- Processed → `processed/` (load when needed)
- Summary → `summary.md` (always load first, ≤500 tokens)
- Synthesis → `synthesis.md` (≤15K tokens)

---

## Parallel Execution

> Ref: tool-usage-matrix.md § Subagent Tool Access para tipos de subagent e acesso a MCPs.

Use `general-purpose` subagents para tasks que precisam de MCPs. claude-squad para paralelizacao real (tmux + git worktrees).

**Parallel:** Time-critical, multiplas ofertas. **Sequential:** Sem pressa, budget concerns.

---

## Limites Tecnicos do Claude

| Limite | Valor |
|--------|-------|
| Leitura por ficheiro | 25.000 tokens (hardcoded) |
| Output MCP (warning) | 10.000 tokens |
| Context window | 200K tokens (partilhada) |
| RAG (Pro/Max/Team) | ~2M tokens (10x) |

> **Regra:** Markdown mais eficiente. Arquivos <100 paginas. `/compact` a 60%.

---

## Context Capacity Management

> Ref: context-management.md para regras completas (3-Tier, Regra 60%, Progressive Loading, Memory Protocol).

**Resumo:** `/compact` a 60%. HOT/WARM/COLD tiers. NUNCA carregar tudo de uma vez.

---

## 🚨 MCP Enforcement (v6.5)

> Ref: tool-usage-matrix.md para matriz completa de ferramentas por fase e enforcement automatico.

**Resumo:** `validate_gate` ANTES de declarar fase. `black_validation` ANTES de entregar. `blind_critic` + `emotional_stress_test` APOS produzir.

---

## 📋 Template Enforcement (v6.5)

> Templates em `~/.claude/templates/`. Todo deliverable DEVE usar o template correspondente.

**Evidencia Obrigatoria** — Todo deliverable DEVE ter no header:

```markdown
> **Template usado:** [nome-do-template.md]
> **Versao:** [data ou versao do template]
```

**SE header ausente -> Deliverable incompleto -> Refazer com template.**

| Deliverable | Template |
|-------------|----------|
| VOC Extraction | `voc-viral-extraction-template.md` |
| Trends Analysis | `trends-analysis-template.md` |
| Ads Library Spy | `ads-library-spy-template.md` |
| Research Checklist | `research-deliverables-checklist.md` |
| MUP/MUS Discovery | `mup-mus-discovery.md` |
| VSL Structure | `rmbc-ii-workflow.md` |
| Criativos | `criativos-template.md` |
| Landing Page | `landing-page-template.md` |

---

## TTT Speedup Pattern (Pesquisa 9)

Para tarefas longas, dividir é mais eficiente:

| Abordagem | Speedup |
|-----------|---------|
| Contexto monolítico | 1x (baseline) |
| Chunked processing | 2.7x - 35x |

**Aplicação para Copy:**
- VSL: Dividir em hook, problema, solução, CTA
- LP: Bloco a bloco, não página inteira
- Criativos: Um por vez com contexto focado

---

*v7.0 - Dedup: MCP Enforcement e Context Management replaced with refs*
*Ref: tool-usage-matrix.md para matriz completa de ferramentas por fase*
*Ref: voc-research.md para regras detalhadas de Research*
*Hooks: tool-enforcement-gate.ts, post-production-validate.ts, pre-compact-save.sh*
*Atualizado: 2026-02-23*
