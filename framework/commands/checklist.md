# /checklist — Show Deliverable Checklist

Load and display the appropriate deliverable checklist from ~/.claude/tasks/.

1. Detect current deliverable from:
   - `~/.claude/session-state/active-story.json`
   - Or $ARGUMENTS (e.g., `/checklist lp`, `/checklist vsl`)

2. Load the checklist file:
   - `lp` → `~/.claude/tasks/lp-checklist.md`
   - `vsl` → `~/.claude/tasks/vsl-checklist.md`
   - `criativos` → `~/.claude/tasks/criativos-checklist.md`
   - `emails` → `~/.claude/tasks/emails-checklist.md`

3. Read the offer's production/ directory to determine progress:
   - Which blocks/chapters exist
   - Which have been validated (check helix-state.yaml tools_used)
   - Which are pending

4. Display as a visual checklist:
```
[CHECKLIST] Landing Page — concursos/decifra-lei-seca

 [x] Bloco 01: Headline/Hook — Score 8.5/10
 [x] Bloco 02: Subheadline — Score 8.2/10
 [ ] Bloco 03: Video/VSL embed
 [ ] Bloco 04: Problema/Agitacao
 ... (all 14)

Progresso: 2/14 blocos (14%)
Proximo: Bloco 03 — Video/VSL embed
```

Arguments:
- $ARGUMENTS: `lp`, `vsl`, `criativos`, `emails`, or auto-detect
