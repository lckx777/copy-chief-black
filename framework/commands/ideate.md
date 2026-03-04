# /ideate — Copy Ideation Analysis

Analyze a copy deliverable across 5 dimensions using the Ideation Engine.

## Usage
```
/ideate <file>              # analyze a specific file
/ideate --offer <name>      # analyze all production/ files for an offer
```

## Steps

1. Parse arguments:
   - If `$ARGUMENTS` contains a file path → analyze that file
   - If `$ARGUMENTS` contains `--offer <name>` → find offer dir and scan production/
   - If empty → check active offer from session state

2. Run the Ideation Engine:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/ideation-engine.ts $ARGUMENTS
   ```

3. Display results with the 5 dimensions:
   - **Performance** — Historical scores (BC, EST, BV) from YAML frontmatter
   - **VOC Alignment** — Token overlap with research/voc/summary.md
   - **Structure** — RMBC compliance check
   - **DRE Intensity** — Emotional escalation level (1-5)
   - **Specificity** — Face 1 (data) + Face 2 (narrative)

4. If any dimension scores < 6, suggest specific fixes:
   - Low Performance → "Run blind_critic and emotional_stress_test"
   - Low VOC → "Load research/voc/summary.md and integrate quotes"
   - Low Structure → "Check RMBC sections — missing: [list]"
   - Low DRE → "Escalate DRE to level 4-5 with relational/identity language"
   - Low Specificity → "Add Face 1 (names, numbers) + Face 2 (vivid scenes)"

Sprint: S26 — Ideation Engine
