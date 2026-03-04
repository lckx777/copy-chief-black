---
description: Validate all units of a deliverable in parallel (VSL chapters, LP blocks, etc.)
argument-hint: "<type> [--offer <name>] [--format yaml|json|md]"
---

# /validate-batch — Batch Validation Command

Validates all units of a deliverable (VSL chapters, LP blocks, creatives, emails) in parallel
using subagents, then aggregates results with outlier detection.

> **S32 Integration:** After collecting MCP scores, each unit is also scored with
> `quality-score.ts` to produce a unified Quality Score (0-10) with per-deliverable
> weights. The batch summary includes mean Quality Score and flags units below 7.0.

## Usage

```
/validate-batch <type> [--offer <name>] [--format yaml|json|md]
```

## Types

| Type | Units | Validation |
|------|-------|------------|
| `vsl` | All VSL chapters | blind_critic + emotional_stress_test |
| `lp` | All LP blocks (14) | blind_critic |
| `creatives` | All creatives | blind_critic + emotional_stress_test |
| `emails` | All emails in sequence | blind_critic |

## Process

### Step 1: Detect Offer

```bash
# Resolve offer from $ARGUMENTS or current context
ARGS="$ARGUMENTS"

# Extract --offer flag if present
if echo "$ARGS" | grep -q "\-\-offer"; then
  OFFER=$(echo "$ARGS" | grep -oP '\-\-offer\s+\K\S+')
else
  # Detect from current-offer.json
  OFFER=$(cat ~/.claude/session-state/current-offer.json 2>/dev/null | grep -oP '"offer":\s*"\K[^"]+')
fi

TYPE=$(echo "$ARGS" | awk '{print $1}')

echo "Offer: $OFFER | Type: $TYPE"
```

If offer cannot be detected, stop and ask the user.

### Step 2: Scan for Deliverable Files

```bash
# Determine scan path by type
case "$TYPE" in
  vsl)       SCAN_PATH="*/production/vsl/" ;;
  lp)        SCAN_PATH="*/production/landing-page/blocks/" ;;
  creatives) SCAN_PATH="*/production/creatives/" ;;
  emails)    SCAN_PATH="*/production/emails/" ;;
  *)         echo "Unknown type: $TYPE"; exit 1 ;;
esac

find ~/copywriting-ecosystem -path "*/$OFFER/$SCAN_PATH*.md" -type f | sort
```

If no files are found, report clearly and stop.

### Step 3: Dispatch Parallel Subagents

For each file found, dispatch a `general-purpose` subagent to run the appropriate validation
MCPs. Run all subagents in parallel (max 6 concurrent — see `~/.claude/config/batch-validation.yaml`).

Each subagent receives:

```
TASK: Validate deliverable unit
FILE: {absolute_path_to_file}
TYPE: {vsl|lp|creatives|emails}
OFFER: {offer_name}

INSTRUCTIONS:
1. Read the file completely using the Read tool.
2. Run blind_critic MCP on the full content.
   - copy_type: map type to appropriate value (vsl->chapter, lp->block, creatives->creative, emails->email)
3. For types vsl/creatives: also run emotional_stress_test MCP.
4. Return results as YAML:

   name: "{file_basename}"
   blind_critic: {score}
   emotional_stress_test: {score_or_null}
   timestamp: "{ISO_timestamp}"
   notes: "{any_specific_feedback}"
```

### Step 4: Collect Results

Wait for all subagents to complete (timeout: 120s per item per config).

Assemble a batch results YAML file:

```yaml
batch_id: "batch-{YYYY-MM-DD}"
offer: "{offer}"
type: "{type}"
items:
  - name: "{unit_name}"
    blind_critic: {score}
    emotional_stress_test: {score_or_null}
    timestamp: "{ISO}"
  # ... one entry per file
```

Write to: `/tmp/batch-{offer}-{type}-{date}.yaml`

### Step 5: Aggregate and Report

```bash
bun run ~/copywriting-ecosystem/scripts/batch-validator.ts report /tmp/batch-{offer}-{type}-{date}.yaml
```

Display the consolidated report inline.

### Step 5b: Compute Unified Quality Score per Unit (S32)

For each item in the batch results, run `quality-score.ts` with the collected MCP scores
to produce a unified Quality Score:

```bash
# Map batch type to quality-score deliverable type
# vsl → vsl-chapter | lp → lp-block | creatives → creative | emails → email | mup-mus → mup-mus

bun run ~/copywriting-ecosystem/scripts/quality-score.ts \
  --type {mapped-type} \
  --bc {blind_critic} \
  --est {emotional_stress_test_or_omit} \
  --bv {black_validation_or_omit} \
  --json
```

Append the `quality_score` field to each item in the batch YAML:

```yaml
items:
  - name: "capitulo-1"
    blind_critic: 8.2
    emotional_stress_test: 8.0
    quality_score: 8.14          # ← added by Step 5b
    quality_verdict: "EXCELLENT" # ← added by Step 5b
```

Flag any unit with `quality_score < 7.0` as `quality_flag: true` for targeted review.

### Step 6: Write Scores to Frontmatter

For each file that has existing YAML frontmatter (starts with `---`), update the scores
section with the validated results so future `summary` commands can read them:

```yaml
# Add or update inside the existing frontmatter's scores: block
scores:
  blind_critic: {score}
  emotional_stress_test: {score_or_null}
```

If the file has no frontmatter, skip this step and note it in the output.

### Step 7: Final Assessment

Present a summary verdict:

| Condition | Verdict | Next Action |
|-----------|---------|-------------|
| All pass (BC ≥8, EST ≥8) | BATCH PASSED | Advance to black_validation or delivery |
| Any below threshold | BATCH NEEDS_REVISION | List failing units with targeted fix |
| Outliers detected | REVIEW OUTLIERS | Investigate outlier units specifically |

## Expected Output

```yaml
command: validate-batch
offer: "{offer}"
type: "{type}"
batch_id: "batch-{date}"
results_file: "/tmp/batch-{offer}-{type}-{date}.yaml"
stats:
  total: {N}
  passed: {N}
  failed: {N}
  outliers: {N}
  mean_bc: {X.X}
  mean_est: {X.X}
verdict: "BATCH PASSED|BATCH NEEDS_REVISION|REVIEW OUTLIERS"
next_step: "{action}"
```

## Error Handling

- If a subagent times out (>120s): mark item as `timeout: true`, continue with others
- If blind_critic MCP fails: retry once, then mark as `error: true`
- If fewer than 3 items found: warn that batch mode may not be necessary (min_items_to_trigger: 3)
- Always produce a partial report if at least 1 item was validated

## Config Reference

Config file: `~/.claude/config/batch-validation.yaml`
Script reference: `~/copywriting-ecosystem/scripts/batch-validator.ts`

```bash
# Manual aggregation commands
bun run ~/copywriting-ecosystem/scripts/batch-validator.ts report <file>
bun run ~/copywriting-ecosystem/scripts/batch-validator.ts summary <offer> <type>
bun run ~/copywriting-ecosystem/scripts/batch-validator.ts outliers <offer> <type>

# Quality Score per unit (S32)
bun run ~/copywriting-ecosystem/scripts/quality-score.ts --type vsl-chapter --bc 8.2 --est 8.0
bun run ~/copywriting-ecosystem/scripts/quality-score.ts --weights vsl-chapter
bun run ~/copywriting-ecosystem/scripts/quality-score.ts --type creative --bc 8.5 --est 7.0 --logo pass --json
```

## Quality Gates

Before marking batch validation complete:

- [ ] All units validated (or documented why any were skipped)
- [ ] No items with BC < 8.0 remaining unaddressed
- [ ] No items with EST < 8.0 (for vsl/creatives) remaining unaddressed
- [ ] Outlier units reviewed and action decided
- [ ] Results file written to /tmp/batch-{offer}-{type}-{date}.yaml
- [ ] Scores written back to frontmatter where applicable
