---
description: Process any source through the 7-stage Content Ingestion Pipeline (S34)
argument-hint: "<path-or-url> (e.g., ~/Downloads/book.pdf, ~/swipes/competitor.md, https://example.com/article)"
---

# /ingest — Content Ingestion Pipeline

**Input:** $ARGUMENTS

Processes any source through the 7-stage Content Ingestion Pipeline (S34).

## What it Does

Routes the input through these 7 stages in sequence:

| Stage | Name | What Happens |
|-------|------|--------------|
| 1 | Route | Detect source type (URL, PDF, folder, markdown) and select extractor |
| 2 | Chunk | Smart semantic chunking with 10% overlap to preserve boundaries |
| 3 | Canonicalize | Entity dedup via Jaccard similarity + fuzzy matching |
| 4 | Extract | Pull insights: frameworks, claims, VOC quotes, metrics |
| 5 | Synthesize | Append to dossier (append-only, never rewrites existing content) |
| 6 | Cross-Reference | Link against existing knowledge in `~/.claude/knowledge/` |
| 7 | Enrich | Suggest additions to expert profiles in `~/.claude/copy-squad/` |

## Instructions

When this command is invoked with `$ARGUMENTS`:

### Step 1: Parse Input

Extract the source path or URL from `$ARGUMENTS`.

If `$ARGUMENTS` is empty, respond:
```
Usage: /ingest <path-or-url>

Examples:
  /ingest ~/Downloads/copywriting-book.pdf
  /ingest ~/copywriting-ecosystem/swipes/vsl-competitor.md
  /ingest https://example.com/article
```

### Step 2: Validate Source

Check if the source exists:
- For file paths: verify the file exists with `ls <path>`
- For URLs: proceed (validation happens in the pipeline)

If the file does not exist, report the error and stop.

### Step 3: Check for Duplicate Processing

```bash
bun run ~/copywriting-ecosystem/scripts/processing-registry.ts check "$ARGUMENTS" 2>/dev/null
```

If already processed, show when it was processed and ask:
```
This source was already ingested on [date].
Re-ingest? (Will append new insights only — no duplication via Jaccard dedup)
```

### Step 4: Run the Ingestion Pipeline

```bash
bun run ~/copywriting-ecosystem/scripts/content-ingestion/pipeline.ts "$ARGUMENTS"
```

Display live progress for each stage as it completes.

### Step 5: Report Output

After pipeline completes, report:

```
INGESTION COMPLETE: [source name]

Stages completed: 7/7
Output location: ~/.claude/knowledge/

Insights extracted:
  - Frameworks: [N]
  - VOC quotes: [N]
  - Claims: [N]
  - Metrics: [N]

Cross-references found: [N] existing entities matched

Enrichment suggestions:
  - [expert name]: [what was suggested]
  - (or "None" if no enrichments)

Next steps:
  - /dossier show to inspect extracted knowledge
  - /classify to redistribute content by offer/niche/universal
  - /clone-expert [path] to extract full DNA from this source
```

## Output Locations

| Content Type | Destination |
|-------------|-------------|
| Universal principles | `~/.claude/knowledge/universal/` |
| Expert insights | `~/.claude/knowledge/experts/` |
| VOC quotes | `~/.claude/knowledge/voc/` |
| Entity registry | `~/.claude/knowledge/entity-registry.yaml` |

## Error Handling

If the pipeline fails at any stage:
1. Report which stage failed with the error message
2. Show what was completed before the failure
3. Suggest: "Run with `--verbose` flag for detailed logging"

## Related

- `/classify` — Manually classify extracted content by offer/niche/universal
- `/clone-expert` — Deep DNA extraction from an expert's body of work
- `/dossier` — Manage the knowledge dossiers that ingestion populates
- `/inbox` — Scan a drop folder and batch-ingest new files
- `/registry` — Check processing history and avoid re-ingesting duplicates

---

*Sprint: S34 (Content Ingestion Pipeline) + S39 (Pipeline Commands)*
*Script: `~/copywriting-ecosystem/scripts/content-ingestion/pipeline.ts`*
