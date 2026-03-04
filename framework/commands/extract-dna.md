---
description: Extract 5-layer DNA from any content using the System Cloning pipeline (S37)
argument-hint: "<path-to-content> (e.g., ~/Downloads/expert-book.pdf, ~/swipes/vsl-competitor.md)"
---

# /extract-dna — Extract DNA from Content

**Input:** $ARGUMENTS

Runs the 5-layer DNA extraction from the System Cloning pipeline (S37) on any content file.
Produces structured knowledge: frameworks, principles, methodologies, heuristics, and dilemmas.

## What It Extracts

| Layer | What it Captures | Examples |
|-------|-----------------|---------|
| **Philosophy** | Core principles and beliefs | "Copy confortavel = copy que falhou" |
| **Frameworks** | Named structural models | RMBC, HELIX, 5 Lentes de Validacao |
| **Heuristics** | Decision shortcuts and rules of thumb | "If DRE < level 3, escalate to level 4" |
| **Methodologies** | Step-by-step processes and workflows | Constraint Progressivo 4 iterations |
| **Dilemmas** | Trade-offs, edge cases, tensions | "Specificity vs broad appeal for cold traffic" |

## Instructions

When this command is invoked with `$ARGUMENTS`:

### Step 1: Validate Input

If `$ARGUMENTS` is empty:
```
Usage: /extract-dna <path-to-content>

Examples:
  /extract-dna ~/Downloads/scientific-advertising.pdf
  /extract-dna ~/copywriting-ecosystem/swipes/competitor-vsl.md
  /extract-dna ~/copywriting-ecosystem/saude/florayla/research/synthesis.md

For expert web-based cloning, use /clone-expert instead.
```

Verify the file exists:
```bash
ls "$ARGUMENTS" 2>/dev/null
```

If not found, report error and stop.

### Step 2: Check Quality Threshold

Before running full extraction, estimate content size:

```bash
bun run ~/copywriting-ecosystem/scripts/system-cloning/quality-threshold.ts status 2>/dev/null
```

Also estimate reading time from file size (rough: 1KB ≈ 1 min reading at 200wpm):
```bash
wc -w "$ARGUMENTS" 2>/dev/null
```

Display the quality assessment:

```
QUALITY GATE CHECK

File: [filename]
Size: [X] words / ~[Y] min reading time
Cumulative ingested: [Z] hours total

Status: [SUFFICIENT_DATA ≥ 100h | INSUFFICIENT_DATA < 100h]
```

If INSUFFICIENT_DATA, warn:
```
⚠️  WARNING: Total ingested content < 100h reading time.
DNA extraction will be marked as SPECULATIVE.
Results are useful but may be incomplete or biased by limited training data.

Continue anyway? (y/n)
```

### Step 3: Run DNA Extraction Pipeline

```bash
bun run ~/copywriting-ecosystem/scripts/system-cloning/index.ts "$ARGUMENTS" --verbose
```

Display stage progress as each completes:
```
[1/6] DNA Extraction...        ✓ (Philosophy: 8, Frameworks: 7, Heuristics: 6, Methodologies: 9, Dilemmas: 5)
[2/6] Framework Conversion...  ✓ (3 high-confidence skills generated)
[3/6] Role Detection...        ✓ (2 roles mapped to Copy Squad personas)
[4/6] Playbook Generation...   ✓ (12 triggers, 8 constraints)
[5/6] Expert Enrichment...     ✓ (4 suggestions for existing profiles)
[6/6] Quality Assessment...    ✓ (RELIABLE — score 7.8/10)
```

### Step 4: Display DNA Layer Scores

Show the 5-layer breakdown:

```
DNA EXTRACTION RESULTS

Layer            Score  Status      Key Extractions
Philosophy       8/10   RICH        [count] principles extracted
Frameworks       7/10   MODERATE    [count] named frameworks found
Heuristics       6/10   MODERATE    [count] decision rules extracted
Methodologies    9/10   RICH        [count] step-by-step processes
Dilemmas         5/10   SPARSE      [count] trade-offs documented

Overall Score: [X]/10
Status: [RELIABLE | SPECULATIVE]
```

DNA Layer Score Guide:
- 1-3: Minimal — content barely touches this layer
- 4-5: Sparse — some relevant content
- 6-7: Moderate — useful but not rich
- 8-9: Rich — strong layer for this content
- 10: Saturated — dominant layer

### Step 5: Display Output Files

```
OUTPUT SAVED TO: ~/.claude/knowledge/cloned/[slug]/

Files generated:
  dna-report.yaml            — Full 5-layer extraction with scores
  playbook.md                — Operational playbook (triggers, steps, constraints)
  roles-detected.md          — Persona mapping suggestions for Copy Squad
  enrichment-suggestions.md  — Append-only additions to existing expert profiles
  skill-drafts/              — [N] high-confidence skills (if frameworks scored >= 7)
    skill-[name].md          — Individual skill draft files
```

### Step 6: Present Recommended Actions

Based on which layers scored highest, suggest next steps:

```
RECOMMENDED ACTIONS (by layer strength)

[If Frameworks >= 7]:
  Review skill-drafts/ — [N] skills may be promoted to ~/.claude/skills/
  Command: ls ~/.claude/knowledge/cloned/[slug]/skill-drafts/

[If Philosophy >= 7]:
  Review playbook.md — incorporate principles into existing rules/
  Strongest principles: [list top 3]

[If Roles detected]:
  Review roles-detected.md — [N] unmapped roles may suggest new personas
  Detected: [role names]

[Always]:
  Review enrichment-suggestions.md before applying to expert profiles
  All outputs are DRAFT — human review required before promotion
```

### Step 7: Ask About Next Step

```
What would you like to do with these results?
  1. Review dna-report.yaml
  2. Promote skill drafts to ~/.claude/skills/
  3. Apply enrichment suggestions to expert profiles
  4. Run /clone-expert to create full expert profile from this content
  5. Done
```

## Output Locations

| File | Contents | Action Needed |
|------|----------|--------------|
| `dna-report.yaml` | Full 5-layer extraction with confidence scores | Review and use as reference |
| `playbook.md` | Triggers, steps, constraints, validation rules | Integrate into rules/ if valuable |
| `roles-detected.md` | Personas mapped to Copy Squad handles | Consider new persona if unmapped |
| `enrichment-suggestions.md` | Append-only expert profile additions | Apply to `~/.claude/copy-squad/` |
| `skill-drafts/*.md` | Individual skill structures | Promote to `~/.claude/skills/` |

## Related

- `/clone-expert <name>` — Full expert cloning with web research (for named experts)
- `/clone-expert <path>` — Same pipeline but includes expert profile generation
- `/ingest <path>` — Full 7-stage content ingestion (includes cross-referencing)
- `/dossier` — Query extracted knowledge after ingestion

---

*Sprint: S37 (System Cloning Pipeline) + S39 (Pipeline Commands)*
*Script: `~/copywriting-ecosystem/scripts/system-cloning/index.ts`*
*Quality threshold: 100h cumulative reading time for RELIABLE status*
