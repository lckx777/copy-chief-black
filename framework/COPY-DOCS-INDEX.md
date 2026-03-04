# Copy Docs Index

> Índice de documentação do ecossistema Copy Chief BLACK.
> Para uso humano — localizar rapidamente qualquer arquivo importante.
> Atualizado: 2026-03-01

---

## Arquivos Essenciais (Ler Primeiro)

| Arquivo | O que é | Quando consultar |
|---------|---------|-----------------|
| `~/copywriting-ecosystem/GUIA-LUCA.md` | Guia operacional completo | Sempre que não souber o próximo passo |
| `~/.claude/constitution.md` | Princípios imutáveis do sistema | Referência de identidade |
| `~/.claude/CLAUDE.md` | Config operacional do Claude | Configuração de skills e MCPs |

---

## Por Oferta

Cada oferta segue a estrutura `{nicho}/{oferta}/`:

| Arquivo | Função |
|---------|--------|
| `CONTEXT.md` | Fonte de verdade: avatar, DRE, mecanismo, estado |
| `mecanismo-unico.yaml` | MUP, MUS, estado de validação |
| `helix-state.yaml` | Tracking de ferramentas por fase |
| `project_state.yaml` | Estado do pipeline |
| `research/synthesis.md` | Inteligência consolidada da pesquisa |
| `briefings/helix-complete.md` | Briefing HELIX consolidado |
| `production/` | Copy produzida (VSL, LP, criativos, emails) |

---

## Rules (Agent Docs)

| Arquivo | Tópico | Tokens (~) |
|---------|--------|-----------|
| `rules/tool-usage-matrix.md` | Ferramentas obrigatórias por fase | ~4000 |
| `rules/agent-personas.md` | 10 personas + 24 experts do Copy Squad | ~5000 |
| `rules/anti-homogeneization.md` | Clichés proibidos, Logo Test, Specificity | ~3000 |
| `rules/mecanismo-unico.md` | Framework Ramalho: MUP/MUS/Indutor | ~2500 |
| `rules/voc-research.md` | Protocolo VOC, Ads Library Spy | ~3500 |
| `rules/debugging-hypothesis.md` | 3 hipóteses antes de corrigir | ~3000 |
| `rules/atomic-design-copy.md` | 6 níveis: Token→Átomo→Molécula→Organismo→Template→Página | ~4000 |
| `rules/constraint-progressivo.md` | 4 iterações progressivas de produção | ~3000 |
| `rules/persuasion-chunking.md` | Unidades persuasivas com entrada/saída emocional | ~2500 |
| `rules/structured-exploration.md` | 3 passadas: Topologia, Contratos, Fragilidades | ~2500 |
| `rules/signal-translation.md` | 20 sinais do usuário → ações corretas | ~3000 |
| `rules/context-management.md` | 3-Tier, Regra 60%, Memory Protocol | ~2500 |
| `rules/ecosystem.md` | Design sistêmico, higiene, estrutura de diretórios | ~3000 |
| `rules/copy-squad-constitution.md` | Handoffs, gates, hierarquia do Squad | ~3000 |
| `rules/epistemic-protocol.md` | FATO vs REC, confiança, citação de fontes | ~2000 |
| `rules/session-orchestration.md` | 5 sessões por oferta, handoff protocol | ~3000 |
| `rules/aios-principles.md` | 26 princípios adaptados do AIOS Framework | ~4000 |
| `rules/dual-doc-taxonomy.md` | AGENT-DOC vs HUMAN-DOC vs SHARED-DOC | ~800 |

---

## Agents (3-File Architecture)

| Persona | Dir | SOUL.md | AGENT.md | MEMORY.md |
|---------|-----|---------|----------|-----------|
| Blade (@producer) | `agents/blade/` | Identidade | Operações | Padrões |
| Hawk (@critic) | `agents/hawk/` | Identidade | Operações | Padrões |
| Vox (@researcher) | `agents/vox/` | Identidade | Operações | Padrões |
| Atlas (@briefer) | `agents/atlas/` | Identidade | Operações | Padrões |
| Scout (@creative) | `agents/scout/` | Identidade | Operações | Padrões |
| Forge (@lp) | `agents/forge/` | Identidade | Operações | Padrões |
| Echo (@vsl) | `agents/echo/` | Identidade | Operações | Padrões |
| Cipher (@miner) | `agents/cipher/` | Identidade | Operações | Padrões |
| Sentinel (@gatekeeper) | `agents/sentinel/` | Identidade | Operações | Padrões |
| Helix (@chief) | `agents/helix/` | Identidade | Operações | Padrões |
| Reflection | `agents/reflection/` | — | Operações | — |

---

## Templates

| Template | Uso |
|----------|-----|
| `templates/landing-page-template.md` | Estrutura 14 blocos LP |
| `templates/rmbc-ii-workflow.md` | Estrutura VSL 8 capítulos |
| `templates/criativos-template.md` | Estrutura de criativos |
| `templates/ads-library-spy-template.md` | Output do Ads Library Spy |
| `templates/voc-viral-extraction-template.md` | Extração VOC viral |
| `templates/trends-analysis-template.md` | Análise de tendências |
| `templates/mecanismo-unico-template.md` | Mecanismo Único novo |
| `templates/agents/` | Templates 3-file agent |

---

## Scripts

| Script | Função |
|--------|--------|
| `scripts/validate-gate.py` | Validar gates (Research, Briefing) |
| `scripts/validate-mecanismo.sh` | Validar mecanismo-unico.yaml |
| `scripts/reflection-engine.ts` | Loop/Drift detection engine |
| `scripts/processing-registry.ts` | Registry de processamento |
| `scripts/batch-validator.ts` | Validação em lote |
| `scripts/ceremony-audit.ts` | Auditoria de cerimônias |

---

## Skills (Slash Commands)

| Skill | Trigger |
|-------|---------|
| `/produce-offer [offer]` | Produzir 4 deliverables em paralelo |
| `/review-all [offer]` | Review multi-modelo completo |
| `/validate` | Validar gate da fase atual |
| `/status` | Dashboard do sistema |
| `/next-action` | Próxima ação prioritária |
| `/create-offer` | Criar nova oferta |
| `/checklist` | Checklist do deliverable atual |

---

*Atualizado: 2026-03-01*
