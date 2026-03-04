# Story: WIRE-004 — subagent-context-inject.ts

> **Status:** DONE
> **Prioridade:** P1
> **Estimativa:** ~80 linhas TypeScript

---

## Contexto

SubagentStart hook que detecta qual persona esta sendo lancada
(pelo description do Agent tool) e imprime os context files
recomendados para aquela persona ler.
Equivalente ao context-engineering do AIOS Core.

---

## Acceptance Criteria

- [x] `~/.claude/hooks/subagent-context-inject.ts` existe e compila
- [x] Hook registrado em settings.json como SubagentStart
- [x] Detecta persona pelo description (Vox, Atlas, Blade, Hawk, Scout, Forge, Echo, Cipher)
- [x] Imprime context files recomendados por persona
- [x] Inclui offer path quando detectado

---

## NAO FAZER

- NAO modificar orchestrator.md
- NAO criar novos rules
- NAO produzir copy
