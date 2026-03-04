# /pipeline — Pipeline Executor Command

Execute the autonomous HELIX pipeline for an offer.

## Usage

```
/pipeline [offer] [--dry-run] [--overnight] [--status] [--resume]
```

## Examples

```
/pipeline concursos/decifra-lei-seca           # Execute next step
/pipeline concursos/decifra-lei-seca --dry-run  # Show plan without executing
/pipeline concursos/decifra-lei-seca --overnight # Run in overnight mode
/pipeline --status                               # Show all pipeline states
/pipeline --resume                               # Find and resume interrupted
```

## Instructions

When this command is invoked:

1. Run the pipeline executor script:
   ```bash
   bun run ~/.claude/scripts/pipeline-executor.ts [args]
   ```

2. If the executor outputs a dispatch payload (`~/.claude/last-dispatch.json`), read it and execute the specified skill for the specified offer.

3. After the skill completes:
   - Update pipeline-state.json marking the step as completed
   - Check if the next step is a human gate
   - If not a human gate, proceed to the next step automatically
   - If a human gate, pause and inform the user

4. For `--overnight` mode:
   - Execute all auto-executable steps sequentially
   - Pause at human gates
   - Log progress to `{offer}/pipeline-log.md`
   - Resume automatically after validation passes

5. For `--status`:
   - Show all active pipelines across all offers
   - Highlight interrupted/crashed pipelines

## Pipeline Steps

The pipeline follows the HELIX lifecycle:

### Research (6 steps)
1. VOC Extraction → 2. Competitors → 3. Mechanism → 4. Avatar → 5. Synthesis → 6. Gate

### Briefing (11 steps)
7-16. HELIX Phases 1-10 → 17. Briefing Gate
- Phase 5 (MUP) and Phase 6 (MUS) are HUMAN GATES

### Production (5 steps)
18. Landing Page → 19. Criativos → 20. VSL → 21. Emails → 22. Final Validation (HUMAN GATE)

## Recovery

If a step fails:
- Transient errors: retry with exponential backoff (max 3)
- Permanent errors: skip + escalate to human
- Uses recovery-handler.ts 5-strategy escalation
