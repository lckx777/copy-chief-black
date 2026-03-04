# Story: WIRE-005 — Verificacao End-to-End

> **Status:** PENDING
> **Prioridade:** P1
> **Estimativa:** ~30 min de testes manuais

---

## Contexto

Testar o fluxo completo: user message → persona-router → Agent launch →
subagent-context → agent writes → handoff-detector → next agent.

---

## Acceptance Criteria

- [ ] "pesquisar VOC da florayla" → persona-router sugere Vox → Agent lanca Vox
- [ ] Vox escreve synthesis.md → handoff-detector sugere Atlas
- [ ] "produzir landing page da florayla" → persona-router sugere Forge
- [ ] Forge escreve bloco LP → handoff-detector sugere Hawk
- [ ] "status" → persona-router sugere Helix direto (sem agent)
- [ ] Mensagem sem keywords → NAO sugere routing (silencioso)
- [ ] Todos os hooks executam em < 5s

---

## NAO FAZER

- NAO produzir copy real — apenas testar o routing
- NAO modificar hooks que passaram nos testes
