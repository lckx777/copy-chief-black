---
description: Scan a drop folder for new content and auto-organize by type, offer, and niche
argument-hint: "[folder-path] — defaults to ~/copywriting-ecosystem/inbox/"
---

# /inbox — Scan and Organize Drop Folder

**Input:** $ARGUMENTS

Scans a drop folder for new content and auto-organizes by type, offer, and niche using bifurcation intelligence (S38).

## Instructions

When this command is invoked:

### Step 1: Determine Target Folder

If `$ARGUMENTS` is provided, use that path as the folder.
If `$ARGUMENTS` is empty, use the default: `~/copywriting-ecosystem/inbox/`

```bash
FOLDER="${ARGUMENTS:-~/copywriting-ecosystem/inbox/}"
```

### Step 2: Verify Folder Exists

```bash
ls "$FOLDER" 2>/dev/null
```

If the folder does not exist, offer to create it:
```
Folder ~/copywriting-ecosystem/inbox/ does not exist.
Create it? This will be your drop folder for new content.
```

If user confirms, create with:
```bash
mkdir -p ~/copywriting-ecosystem/inbox/
```

### Step 3: Scan for New Files

```bash
find "$FOLDER" -maxdepth 1 -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.txt" -o -name "*.yaml" -o -name "*.png" -o -name "*.jpg" \) 2>/dev/null
```

If no files found:
```
Inbox is empty. Drop files into ~/copywriting-ecosystem/inbox/ and run /inbox again.

Supported file types: .md, .pdf, .txt, .yaml, .png, .jpg
```

### Step 4: Classify Each File

For each discovered file, run classification:

```bash
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts "<file>" --dry-run --json 2>/dev/null
```

Build a classification plan table:

```
INBOX SCAN: ~/copywriting-ecosystem/inbox/
Found 4 files to process.

FILE                          CLASSIFICATION     DESTINATION
competitor-vsl.md             OFFER_SPECIFIC     saude/florayla/swipes/vsl/
tinnitus-voc-quotes.md        NICHE_GENERIC      saude/biblioteca_nicho_saude_CONSOLIDADA.md
copywriting-framework.md      UNIVERSAL          ~/.claude/knowledge/universal/copy-frameworks.md
neuvelys-research.pdf         OFFER_SPECIFIC     saude/neuvelys/research/
```

For files where classification is AMBIGUOUS (no clear signals), flag them:
```
⚠️  ambiguous-file.md — Low confidence classification. Manual review needed.
```

### Step 5: Request Approval

Display the plan and ask:
```
Proceed with these moves? (y/n/edit)
  y = execute all moves
  n = cancel
  edit = specify custom destination for each file
```

### Step 6: Execute Moves

For each approved file:

**Text files (.md, .txt):** Classify and distribute, then optionally ingest:
```bash
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts "<file>" --distribute
```

Ask once before processing: "Run content ingestion on text files after moving? (y/n)"
If yes, for each text file after moving:
```bash
bun run ~/copywriting-ecosystem/scripts/content-ingestion/pipeline.ts "<destination>"
```

**PDF files:** Move to detected destination, flag for manual ingestion:
```
PDF files moved. Run /ingest <path> on each to extract insights.
```

**Image files (.png, .jpg):** Move to `{offer}/swipes/images/` or `~/.claude/knowledge/images/`.

**YAML files:** Move to appropriate offer or config location based on filename patterns.

### Step 7: Report Summary

```
INBOX PROCESSED

Moved:   4 files
Ingested: 2 files (text files only)
Skipped: 0 files
Errors:  0

Details:
  competitor-vsl.md         → saude/florayla/swipes/vsl/ ✓
  tinnitus-voc-quotes.md    → saude/biblioteca_nicho_saude_CONSOLIDADA.md (appended) ✓
  copywriting-framework.md  → ~/.claude/knowledge/universal/copy-frameworks.md (appended) ✓
  neuvelys-research.pdf     → saude/neuvelys/research/ ✓ (run /ingest to extract insights)

Inbox is now empty.
```

## Supported File Types

| Type | Classification | Ingestion |
|------|---------------|-----------|
| `.md` | Auto via bifurcation | Yes (automatic) |
| `.txt` | Auto via bifurcation | Yes (automatic) |
| `.pdf` | Auto via bifurcation | Manual (`/ingest <path>`) |
| `.yaml` | Pattern-matched by filename | No |
| `.png`, `.jpg` | Detected as swipe/image | No |

## Classification Logic

The bifurcation script uses signal-based detection:

| Classification | Signals | Destination |
|---------------|---------|-------------|
| OFFER_SPECIFIC | Offer names, product names, expert names tied to offer | `{niche}/{offer}/research/` or `{niche}/{offer}/swipes/` |
| NICHE_GENERIC | Niche terms, generic avatar patterns, niche names | `{niche}/biblioteca_nicho_{niche}_CONSOLIDADA.md` |
| UNIVERSAL | Copy terms (DRE, MUP, MUS), framework names, expert principles | `~/.claude/knowledge/universal/` |

## Related

- `/ingest <path>` — Process a specific file through the 7-stage ingestion pipeline
- `/classify <file>` — Manual classification without moving
- `/dossier` — Inspect ingested knowledge in structured dossiers

---

*Sprint: S38 (Bifurcation Intelligence) + S39 (Pipeline Commands)*
*Script: `~/copywriting-ecosystem/scripts/bifurcation.ts`*
*Default folder: `~/copywriting-ecosystem/inbox/`*
