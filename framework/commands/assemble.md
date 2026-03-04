# /assemble — Assemble Deliverable from Components

Compose a complete deliverable from validated atomic components (chapters, blocks, creatives, emails).

## Usage
```
/assemble vsl --offer <name>        # assemble VSL from chapters
/assemble lp --offer <name>         # assemble LP from blocks
/assemble creative --offer <name>   # assemble creatives pack
/assemble email --offer <name>      # assemble email sequence
```

## Steps

1. Parse arguments to determine type and offer:
   - Type: vsl | lp | creative | email
   - Offer: name or path

2. Run the assembler:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/assemblers/index.ts $ARGUMENTS
   ```

3. Pre-assembly validation:
   - Check all components exist (warn if missing)
   - Check YAML frontmatter scores (warn if blind_critic < 8)
   - Check mecanismo-unico.yaml state (must be VALIDATED/APPROVED)

4. Assembly:
   - Concatenate components in order with section separators
   - Generate YAML frontmatter with assembly metadata
   - Write to {offer}/production/{type}/assembled-{type}.md

5. Post-assembly:
   - Display assembly stats (total words, components, avg scores)
   - Suggest: "Run /ideate on assembled file to verify overall quality"
   - Suggest: "Run blind_critic + emotional_stress_test on complete deliverable"

Sprint: S31 — Copy Intelligence
