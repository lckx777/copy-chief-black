# /analyze — Structural Analysis of Copy

Analyze a copy deliverable for structural compliance (RMBC sections, proportions, completeness).

## Usage
```
/analyze <file>              # analyze a specific file
/analyze --offer <name>      # analyze all production/ files for an offer
```

## Steps

1. Parse arguments:
   - If `$ARGUMENTS` contains a file path → analyze that file
   - If `$ARGUMENTS` contains `--offer <name>` → scan production/ directory

2. Run the structure analyzer:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/copy-intelligence.ts analyze $ARGUMENTS
   ```

3. Auto-detect deliverable type from path:
   - `production/vsl/` → VSL (7 sections: Lead, Background, UMP, UMS, Build-Up, Close, FAQs)
   - `production/landing-page/` → LP (14 blocks)
   - `production/creatives/` → Creative (Hook, Body, CTA)
   - `production/emails/` → Email (Subject, Lead, Body, CTA per email)

4. Display structural analysis:
   - Sections found/missing
   - Proportions (actual vs expected %)
   - Structure score (1-10)
   - Specific recommendations for improvement

5. If structure score < 7:
   - List missing sections
   - Highlight proportion imbalances
   - Suggest rebalancing

Sprint: S31 — Copy Intelligence
