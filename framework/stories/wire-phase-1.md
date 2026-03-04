# Story: WIRE-001 — Context Cleanup

> **Status:** COMPLETED
> **Prioridade:** P0 (bloqueia todas as outras phases)
> **Estimativa:** ~30 comandos mv + 1 verificacao

---

## Contexto

36 rules files carregam ~30K tokens em TODA sessao.
Apenas 3 sao RUNTIME (hooks referenciam). O resto e prosa aspiracional.
Mover 27 files libera ~28K tokens/sessao e desbloqueia Phases 2-5.

---

## Acceptance Criteria

- [x] `~/.claude/archive/ceremony/` existe com 9 files
- [x] `~/.claude/reference/` existe com 18 files (15 originais + 3 adicionais)
- [x] `~/.claude/rules/` tem APENAS: tool-usage-matrix.md, anti-homogeneization.md, mecanismo-unico.md, offers/, CLAUDE.md
- [x] Nenhum hook referencia arquivo movido sem fallback (grep nos hooks)
- [x] `bun run ~/.claude/hooks/workflow-navigator.ts` executa sem erro

---

## Files to Move

### CEREMONY → `~/.claude/archive/ceremony/`

```
agent-personas.md
agent-fluidity.md
copy-squad-constitution.md
conclave.md
voc-squad.md
session-orchestration.md
aios-principles.md
atomic-design-copy.md
persuasion-chunking.md
```

### REFERENCE → `~/.claude/reference/`

```
anti-sycophancy.md
bssf-decision.md
ceremony-detection.md
constraint-progressivo.md
context-management.md
copy-fidelity.md
debugging-hypothesis.md
dual-doc-taxonomy.md
ecosystem.md
epistemic-protocol.md
micro-unidades.md
signal-translation.md
structured-exploration.md
synthesis-flow.md
voc-research.md
briefings-helix.md
copy-chief.md
copy-production.md
```

### MANTER em `~/.claude/rules/`

```
tool-usage-matrix.md    (RUNTIME — hooks referenciam)
anti-homogeneization.md (RUNTIME — hooks referenciam)
mecanismo-unico.md      (RUNTIME — hooks referenciam)
offers/                 (offer context — auto-loaded por oferta)
CLAUDE.md               (claude-mem context)
```

---

## Comandos de Execucao

```bash
# 1. Criar diretorios
mkdir -p ~/.claude/archive/ceremony
mkdir -p ~/.claude/reference

# 2. Mover CEREMONY (9 files)
cd ~/.claude/rules
for f in agent-personas.md agent-fluidity.md copy-squad-constitution.md conclave.md voc-squad.md session-orchestration.md aios-principles.md atomic-design-copy.md persuasion-chunking.md; do
  mv "$f" ~/.claude/archive/ceremony/ 2>/dev/null
done

# 3. Mover REFERENCE (18 files)
for f in anti-sycophancy.md bssf-decision.md ceremony-detection.md constraint-progressivo.md context-management.md copy-fidelity.md debugging-hypothesis.md dual-doc-taxonomy.md ecosystem.md epistemic-protocol.md micro-unidades.md signal-translation.md structured-exploration.md synthesis-flow.md voc-research.md briefings-helix.md copy-chief.md copy-production.md; do
  mv "$f" ~/.claude/reference/ 2>/dev/null
done

# 4. Verificar
echo "=== rules/ (deve ter ~3 .md + offers/ + CLAUDE.md) ==="
ls ~/.claude/rules/
echo "=== archive/ceremony/ (deve ter 9) ==="
ls ~/.claude/archive/ceremony/ | wc -l
echo "=== reference/ (deve ter 15) ==="
ls ~/.claude/reference/ | wc -l

# 5. Verificar hooks nao quebram
bun run ~/.claude/hooks/workflow-navigator.ts 2>&1 | head -5
```

---

## Quality Gate

Apos execucao, verificar:
1. `ls ~/.claude/rules/*.md | wc -l` = 3
2. `ls ~/.claude/archive/ceremony/ | wc -l` = 9
3. `ls ~/.claude/reference/ | wc -l` = 15
4. Hooks SessionStart executam sem erro

---

## NAO FAZER (No Invention Rule)

- NAO reescrever nenhum arquivo movido
- NAO criar novos rules
- NAO modificar orchestrator.md
- NAO produzir copy
- NAO auditar o ecossistema
- Apenas MOVER files e VERIFICAR
