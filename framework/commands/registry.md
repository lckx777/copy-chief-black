# /registry — Processing Registry Management

Query and manage the processing registry for duplicate detection.

## Usage

- `/registry check [url]` — Check if a URL has been processed
- `/registry list [--offer name]` — List all processed URLs
- `/registry stats` — Show processing statistics per offer

## Implementation

Run the processing-registry.ts script:
```bash
bun run ~/copywriting-ecosystem/scripts/processing-registry.ts [command] [args]
```

## Context
- Registry files: `{offer}/processing-registry.yaml`
- Schema: `~/.claude/schemas/processing-registry.schema.yaml`
- Hook: `~/.claude/hooks/processing-check.ts` (auto-checks before scraping)
- Sprint: S44.5
