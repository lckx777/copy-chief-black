# /architecture — Generate Architecture Document

Generate a formal architecture document of the Copy Chief BLACK ecosystem.

## Usage

```
/architecture [--mermaid] [--json] [--output <path>]
```

## What It Does

Auto-discovers all ecosystem components (skills, commands, hooks, MCPs, rules, agents, scripts, offers) and generates a formal architecture document with:

- Component inventory with counts
- Offers table with phase/status
- Hook system breakdown by event
- Data flow diagram
- Quality gate chain
- Optional Mermaid diagram

## Steps

1. Run: `bun run ~/.claude/scripts/generate-architecture.ts --mermaid`
2. Display the generated document
3. Optionally save with `--output <path>`

## JSON Mode

For programmatic consumption:
```
bun run ~/.claude/scripts/generate-architecture.ts --json
```

## Output

Default: stdout (markdown). Use `--output <path>` to save to file.
