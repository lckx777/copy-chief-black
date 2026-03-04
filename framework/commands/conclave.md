# /conclave — Multi-Persona Deliberation

Convoke a Conclave of Copy Squad personas to deliberate on a strategic decision.

## Usage
```
/conclave "MUP Selection" --members atlas,hawk,vox --context "3 MUP candidates for florayla"
/conclave --check-stuck <offer>     # detect if stuck and recommend Conclave
/conclave --history                 # show past Conclave decisions
```

## Steps

1. Parse arguments:
   - Topic: first quoted string or first argument
   - Members: --members comma-separated list (atlas, hawk, vox, blade, scout, forge, echo, cipher, helix)
   - Context: --context string with relevant data
   - If `--check-stuck`: detect production stuck loops

2. If `--check-stuck`:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/conclave.ts --check-stuck $ARGUMENTS
   ```
   - Scan production/ files for scores below threshold
   - If 2+ failures → recommend Conclave with topic and members

3. If `--history`:
   ```bash
   bun run ~/copywriting-ecosystem/scripts/conclave.ts --history
   ```

4. Normal Conclave flow:
   a. Validate required members per decision type (ref: ~/.claude/rules/conclave.md)
   b. Generate structured Conclave prompt:
      - Topic + Context
      - Each member's perspective (loaded from ~/.claude/agents/{persona}/)
      - Position statement template (200 tokens max each)
   c. Execute Conclave protocol:
      - Phase 1: Present topic to all members
      - Phase 2: Each persona states position independently
      - Phase 3: Cross-examination (max 2 rounds)
      - Phase 4: Vote (AGREE/DISAGREE/ABSTAIN)
      - Phase 5: Record decision
   d. If unanimous → activate Devil's Advocate (S35.6)
   e. Record to .conclave-history.yaml
   f. If appropriate, follow up with MCP zen consensus for external validation

5. Display result:
   - Decision summary
   - Vote breakdown
   - Dissenting opinions preserved
   - Next action recommendation

Ref: ~/.claude/rules/conclave.md for full protocol
Sprint: S35 — Conclave Architecture
