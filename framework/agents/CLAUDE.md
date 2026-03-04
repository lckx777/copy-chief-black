---
name: agents-context
description: Context tracking for agent-related observations
---

## 3-File Agent Architecture (S43+S49)

Personas migrate to: `{handle}/AGENT.md + SOUL.md + MEMORY.md`
- **AGENT.md**: Operational instructions (what to do, tools, process, constraints, return format)
- **SOUL.md**: Cognitive identity (worldview, decision style, values, rejects, catchphrase, epistemic confidence, archetype)
- **MEMORY.md**: Learned patterns (updated after each session — patterns, failures, offer notes, scores)

### Migrated Personas (10/10 COMPLETE — S43)

| Persona | Handle | Directory | Migrated From |
|---------|--------|-----------|--------------|
| Blade | @producer | `blade/` | `copywriter.md` |
| Hawk | @critic | `hawk/` | `reviewer.md` |
| Vox | @researcher | `vox/` | `researcher.md` |
| Atlas | @briefer | `atlas/` | `synthesizer.md` |
| Scout | @creative | `scout/` | (new) |
| Forge | @lp | `forge/` | (new) |
| Echo | @vsl | `echo/` | (new) |
| Cipher | @miner | `cipher/` | `competitor-analyzer.md` |
| Sentinel | @gatekeeper | `sentinel/` | hooks/scripts |
| Helix | @chief | `helix/` | (new) |

### Additional Agents

| Agent | Directory | Purpose |
|-------|-----------|---------|
| Reflection | `reflection/` | Loop/drift detection (S48) |

### Legacy Merges (reference only)

| Source | Merged Into | Status |
|--------|-------------|--------|
| `copy-validator.md` | `hawk/` | Superseded |
| `voc-processor.md` | `vox/` | Superseded |

### Templates

All 3-file templates are in `~/.claude/templates/agents/`:
- `agent-template.md` — AGENT.md structure
- `soul-template.md` — SOUL.md structure
- `memory-template.md` — MEMORY.md structure

### Key Rules

1. **Runtime:** Always `subagent_type: general-purpose` — custom types do NOT inherit MCPs
2. **SOUL.md is read-only during execution** — it defines identity, not instructions
3. **MEMORY.md is updated after each session** — not during production
4. **Legacy flat files kept** for backward compatibility (copywriter.md, reviewer.md, researcher.md)

