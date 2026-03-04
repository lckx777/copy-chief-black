# Story: WIRE-002 — persona-router.ts

> **Status:** DONE
> **Prioridade:** P0
> **Estimativa:** ~120 linhas TypeScript

---

## Contexto

UserPromptSubmit hook que detecta keywords na mensagem do usuario
e sugere qual persona deve executar a task.
Equivalente ao agent activation do AIOS Core (@dev, @analyst).

---

## Acceptance Criteria

- [x] `~/.claude/hooks/persona-router.ts` existe e compila
- [x] Hook registrado em settings.json como UserPromptSubmit
- [x] Detecta keywords: pesquisa→Vox, concorrente→Cipher, briefing→Atlas, produzir→Blade, validar→Hawk
- [ ] Le oferta ativa de helix-state.yaml
- [x] Output: system-reminder com routing suggestion (max 100 tokens)
- [x] NAO bloqueia — apenas sugere (Helix pode overridar)
- [ ] Teste: "pesquisar VOC da florayla" → sugere Vox

---

## NAO FAZER

- NAO modificar orchestrator.md
- NAO criar novos rules
- NAO produzir copy
- NAO reescrever hooks existentes
