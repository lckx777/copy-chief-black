# /dossier — Knowledge Dossier Management

Create, update, search, and merge knowledge dossiers.
Dossiers are append-only knowledge bases organized by entity type.

## Subcommands

### /dossier create <type> <name>
Create a new dossier. Types: person, company, niche, mechanism, concept.

Examples:
```
/dossier create person "Dr. Klaus Richter"
/dossier create mechanism "Cristais de Otolitos"
/dossier create niche saude
```

### /dossier add <type> <id> "fact text" [--source <source>] [--confidence high|medium|low] [--tags tag1,tag2]
Add a fact to an existing dossier.

Examples:
```
/dossier add person dr-klaus-richter "Gastroenterologista na Charité Berlin" --source "florayla/CONTEXT.md" --confidence high --tags role,affiliation
/dossier add mechanism cristais-de-otolitos "MUP da oferta Neuvelys — causa real do tinnitus" --source "neuvelys/CONTEXT.md" --confidence high --tags mup
```

### /dossier search <query>
Search across all dossiers (name, aliases, facts, relationships).

Examples:
```
/dossier search "Richter"
/dossier search "tinnitus"
/dossier search "Charité"
```

### /dossier show <type> <id>
Display a dossier's full contents in readable format.

Examples:
```
/dossier show person dr-klaus-richter
/dossier show mechanism cristais-de-otolitos
```

### /dossier merge <type> <source-id> <target-id>
Merge two dossiers of same type. Source is archived after merge.
Facts are deduplicated (Jaccard > 0.8). Contradictions are flagged (never auto-resolved).

Examples:
```
/dossier merge person dr-richter dr-klaus-richter
```

### /dossier list [type]
List all dossiers, optionally filtered by type.

Examples:
```
/dossier list
/dossier list person
/dossier list mechanism
```

### /dossier link <type> <id> <target-id> <relationship-type> [--note "context"]
Add a relationship between two dossiers.

Relationship types: works_at, uses, part_of, competes_with, created_by, related_to

Examples:
```
/dossier link person dr-klaus-richter florayla uses --note "Expert principal da oferta"
/dossier link person dr-klaus-richter charite-berlin works_at --note "Gastroenterologista"
```

## Implementation
Run: `bun run ~/copywriting-ecosystem/scripts/dossier-cli.ts <subcommand> [args]`

## Dossier Types

| Type | Examples | Use For |
|------|---------|---------|
| person | Dr. Klaus Richter, Rafael Mendes | Real individuals (experts, researchers) |
| company | Ursao Digital, Charité Berlin | Organizations and institutions |
| niche | saude, concursos, relacionamento | Market verticals |
| mechanism | Cristais de Otolitos, Morte das Celulas | MUPs, MUSes, named mechanisms |
| concept | DRE, Sexy Cause, Gimmick Name | Copywriting frameworks, psychological constructs |

## Confidence Levels

| Level | When to Use |
|-------|------------|
| high | Directly stated in official source (CONTEXT.md, research, published study) |
| medium | Inferred from context or single source |
| low | Hypothesis / unclear sourcing |

## Cross-Niche Dossiers

For patterns that span multiple niches, use the cross-niche dossier type.
Stored in `~/.claude/dossiers/cross-niche/`.

```
/dossier create concept "Shame as DRE" --niches saude,relacionamento
```

## Notes

- Facts are APPEND-ONLY. Never deleted.
- Contradictions are flagged for human review, never auto-resolved.
- Merge archives the source dossier (never deletes).
- Schema: `~/.claude/schemas/dossier.schema.yaml`
- Storage: `~/.claude/dossiers/{type}/{id}.yaml`
