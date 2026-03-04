# Story: WIRE-003 — handoff-detector.ts

> **Status:** DONE
> **Prioridade:** P0
> **Estimativa:** ~100 linhas TypeScript

---

## Contexto

PostToolUse hook que detecta quando um agente escreve um arquivo
significativo e sugere qual persona deve assumir em seguida.
Equivalente ao story-driven handoff do AIOS Core.

---

## Acceptance Criteria

- [x] `~/.claude/hooks/handoff-detector.ts` existe e compila
- [x] Hook registrado em settings.json como PostToolUse (Write|Edit)
- [x] Mapeia paths: synthesis.md→Atlas, helix-complete.md→Blade, production/drafts/*→Hawk, production/reviews/*→Helix
- [x] Output: system-reminder com handoff suggestion (max 100 tokens)
- [x] NAO dispara para writes irrelevantes (task_plan.md, progress.md, etc)

---

## NAO FAZER

- NAO modificar orchestrator.md
- NAO criar novos rules
- NAO produzir copy
