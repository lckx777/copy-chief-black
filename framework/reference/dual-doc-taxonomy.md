# Dual Documentation Taxonomy (v1.0)

> Sprint: S8 — Dual Documentation
> Principio: Dois publicos, dois formatos. Agent docs ≠ Human docs.
> Criado: 2026-03-01

---

## REGRA CARDINAL

> **Docs para agentes (rules/) ≠ Docs para humanos (GUIA-LUCA.md).**
> Agentes precisam de precisao, thresholds, schemas.
> Humanos precisam de clareza, exemplos, "o que fazer agora".
> Misturar os dois = nenhum dos dois funciona bem.

---

## Taxonomia

| Tipo | Publico | Localizacao | Formato | Exemplos |
|------|---------|-------------|---------|----------|
| **AGENT-DOC** | Claude/Hooks/Scripts | `~/.claude/rules/`, `~/.claude/agents/` | Tecnico: YAML frontmatter, thresholds, schemas, decision trees | tool-usage-matrix.md, agent-personas.md, mecanismo-unico.md |
| **HUMAN-DOC** | Luca (operador humano) | `~/copywriting-ecosystem/GUIA-LUCA.md`, `~/.claude/COPY-DOCS-INDEX.md` | Operacional: passo-a-passo, exemplos concretos, "quando usar X" | GUIA-LUCA.md, COPY-DOCS-INDEX.md |
| **SHARED-DOC** | Ambos | `{offer}/CONTEXT.md`, `{offer}/mecanismo-unico.yaml` | Dados: fonte de verdade factual, sem instrucoes de processo | CONTEXT.md, synthesis.md, mecanismo-unico.yaml |

---

## Regras

### AGENT-DOC
- Contém: thresholds, schemas, decision trees, tool lists, constraints
- NÃO contém: explicações do "porquê", tutoriais, screenshots
- Formato: Markdown com YAML frontmatter, tabelas, code blocks
- Tamanho: O mínimo necessário para mudar comportamento do agente

### HUMAN-DOC
- Contém: passo-a-passo, exemplos concretos, troubleshooting, "quando usar X"
- NÃO contém: schemas internos, decision trees para hooks, thresholds detalhados
- Formato: Markdown conversacional, bullet points, exemplos reais
- Tamanho: O mínimo necessário para Luca operar sem dúvida

### SHARED-DOC
- Contém: dados factuais (avatar, MUP, MUS, VOC quotes, scores)
- NÃO contém: instruções de processo para nenhum dos dois públicos
- Formato: YAML (dados) ou Markdown (narrativo factual)
- Tamanho: Determinado pelo conteúdo, não por restrição artificial

---

## Anti-Patterns

| Anti-Pattern | Problema | Correto |
|--------------|----------|---------|
| Tutorial em rules/ | Agente não precisa de tutorial | Mover para GUIA-LUCA.md |
| Thresholds em GUIA-LUCA.md | Humano não precisa saber que BC >= 8 | Manter em tool-usage-matrix.md |
| CONTEXT.md com instrucoes | Mistura dados com processo | CONTEXT.md = dados. Process = rules/ |
| Duplicação entre doc types | Drift inevitável | Single source → referência cruzada |

---

*v1.0 — Sprint S8*
*Criado: 2026-03-01*
