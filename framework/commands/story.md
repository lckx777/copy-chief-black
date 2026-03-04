# /story — Show Active Story Context

Display the full context of the current deliverable being produced, similar to AIOS's story tracking.

1. Read `~/.claude/session-state/active-story.json` (if exists)
2. Read the offer's helix-state.yaml for phase and gate status
3. Read the offer's mecanismo-unico.yaml for MUP/MUS context
4. If in PRODUCTION, read the story template for the active deliverable:
   - LP → `~/.claude/templates/story-lp-bloco.md`
   - VSL → `~/.claude/templates/story-vsl-capitulo.md`
   - Criativos → `~/.claude/templates/story-criativo.md`
   - Emails → `~/.claude/templates/story-email.md`

Display:
```
[STORY] {offer} — {deliverable}
Phase: {phase} | Gate: {gate_status}
MUP: {mup_name} | MUS: {mus_name} | DRE: {dre}

Progress: {blocks_done}/{blocks_total}
Last updated: {timestamp}

Key Context:
- One Belief: {one_belief}
- Avatar: {avatar_summary}
- Sexy Cause: {sexy_cause}

Next Action: {next_step}
```

If no active story, suggest starting one with `/produce-offer` or `/next-action`.

Arguments:
- $ARGUMENTS can specify offer: `/story saude/florayla`
