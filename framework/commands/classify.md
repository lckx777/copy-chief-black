# /classify — Content Classification

Classify text content into 3 specificity levels for auto-distribution
in the copywriting ecosystem. No LLM required — pure signal-based detection.

## Usage

```bash
# Classify a file
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts <file>

# Classify inline text
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts --text "some text"

# Classify + distribute to target path
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts <file> --distribute

# Dry run (show target without writing)
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts <file> --dry-run

# JSON output (for piping/scripting)
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts <file> --json

# Combine flags
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts <file> --distribute --dry-run
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts --text "content" --distribute --json
```

## Classification Levels

### OFFER_SPECIFIC
Content that belongs to a specific offer. Detected by:
- Offer names (florayla, neuvelys, quimica-amarracao, etc.)
- Product/ingredient names (Psyllium Husk, CoQ10, Cristais de Otolitos)
- Expert names tied to an offer (Dr. Klaus Richter, Rafael Mendes)
- Gimmick names / Sexy Causes specific to an offer
- File paths containing `{niche}/{offer}/`

**Destination:** `~/copywriting-ecosystem/{niche}/{offer}/knowledge/ingested.md`

### NICHE_GENERIC
Content relevant to an entire niche, not a specific offer. Detected by:
- Niche terms (constipação, tinnitus, concurseiro, amarração, etc.)
- Generic avatar patterns (mulheres 45+, concurseiro intermediário)
- Niche names (saude, relacionamento, concursos)
- Generic niche problems without product names

**Destination:** `~/copywriting-ecosystem/{niche}/biblioteca_nicho_{niche}_CONSOLIDADA.md`

### UNIVERSAL
Copy principles, frameworks, and expert insights applicable across all niches. Detected by:
- Copy terms (DRE, MUP, MUS, headline, hook, CTA, VSL)
- Framework names (RMBC, HELIX, AIDA, PAS, Logo Test)
- Persuasion principles (specificity, social proof, scarcity, authority)
- Expert names (Schwartz, Halbert, Ogilvy, Makepeace, Sugarman, Kennedy, etc.)

**Destination:** `~/.claude/knowledge/universal/{topic}.md`
- `persuasion-principles.md` — social proof, scarcity, authority, specificity
- `copy-frameworks.md` — RMBC, AIDA, PAS, etc.
- `expert-insights.md` — attributed to specific experts
- `general.md` — catchall

## Scoring Logic

```
OFFER_SPECIFIC signals: +3 each
  → offer name, product name, expert name, gimmick name, path pattern

NICHE_GENERIC signals: +2 each
  → niche term, avatar pattern, niche name, generic problem

UNIVERSAL signals: +1 each
  → copy term, framework name, persuasion principle, expert name

Classification:
  IF offer_score >= 3  → OFFER_SPECIFIC
  ELIF niche_score >= 4 → NICHE_GENERIC
  ELSE                  → UNIVERSAL
```

## Examples

```bash
# Offer-specific text
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts \
  --text "Florayla usa Psyllium Husk dos Pireneus" \
  --dry-run
# → OFFER_SPECIFIC (florayla / saude)

# Niche-generic text
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts \
  --text "Mulheres acima de 45 anos com constipação crônica buscam alternativas naturais" \
  --dry-run
# → NICHE_GENERIC (saude)

# Universal text
bun run ~/copywriting-ecosystem/scripts/bifurcation.ts \
  --text "Specificity equals credibility. Use non-round numbers like 87.3% instead of 90%." \
  --dry-run
# → UNIVERSAL (persuasion-principles)
```

## Notes

- `--dry-run` always takes precedence over `--distribute` (no writes happen)
- Ingested content is always formatted with date, source, and classification metadata
- Universal KB files are auto-created if they do not exist
- Offer `knowledge/` directories are created on first ingestion
