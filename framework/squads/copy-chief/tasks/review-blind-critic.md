---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Review all deliverables in batch, output scores
- No intermediate checkpoints
- **Best for:** Single deliverable review, quick score check

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Review each deliverable with dimension-by-dimension breakdown
- Explain scoring rationale per dimension
- **Best for:** First review cycle, contested scores, learning

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Analyze deliverable type and select scoring weights
- Map expected quality profile before scoring
- **Best for:** High-stakes deliverables (VSL, launch sequences)

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: reviewBlindCritic()
responsavel: Hawk (@critic)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: deliverable_path
  tipo: string
  origem: Production output
  obrigatorio: true
  validacao: Must be valid file or directory in {offer}/production/

- campo: deliverable_type
  tipo: string
  origem: User Input or auto-detected
  obrigatorio: true
  validacao: One of [vsl, vsl-chapter, landing-page, creative, email, email-sequence]

- campo: offer_path
  tipo: string
  origem: Offer context
  obrigatorio: true
  validacao: Must be valid {niche}/{offer}/ directory

**Saida:**
- campo: blind_critic_report
  tipo: file
  destino: "{offer}/reviews/blind-critic-{deliverable_slug}.md"
  persistido: true

- campo: scores
  tipo: object
  destino: Return value (YAML summary)
  persistido: false

- campo: verdict
  tipo: string
  destino: Return value
  persistido: false
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Deliverable file(s) exist at specified path
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify deliverable_path exists and contains copy content
    error_message: "Deliverable not found at specified path."

  - [ ] Reviewer has NO access to brief or author context
    tipo: pre-condition
    blocker: true
    validacao: |
      Hawk receives ONLY the copy text. No HELIX, no mecanismo, no author info.
    error_message: "Blind review contaminated with context. Reset and retry."

  - [ ] critic/ methodology data accessible
    tipo: pre-condition
    blocker: false
    validacao: |
      Verify squads/copy-chief/data/critic/ directory accessible
    error_message: "Warning: critic/ data not found. Using default methodology."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Report written to {offer}/reviews/blind-critic-{deliverable_slug}.md
    tipo: post-condition
    blocker: true
    validacao: |
      File exists with all 9 dimension scores and overall verdict
    error_message: "Blind critic report not written."

  - [ ] All 9 dimensions scored (1-10 scale)
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains numeric scores for all 9 dimensions
    error_message: "Incomplete scoring — missing dimensions."

  - [ ] Specific fix recommendations for any dimension < 8
    tipo: post-condition
    blocker: true
    validacao: |
      Every dimension scoring < 8 has at least one specific, actionable fix
    error_message: "Fix recommendations missing for low-scoring dimensions."

  - [ ] Overall score calculated as weighted average
    tipo: post-condition
    blocker: true
    validacao: |
      Overall score is weighted average, not simple mean
    error_message: "Overall score not calculated correctly."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Review conducted WITHOUT knowledge of brief, author, or context
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No references to HELIX phases, mecanismo details, or agent names in review
    error_message: "Blind review integrity compromised."

  - [ ] Each dimension scored with specific evidence from the copy
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Scores cite exact lines/sections from the deliverable
    error_message: "Scores lack evidence citations."

  - [ ] Verdict is binary: PASS (overall >= 8) or NEEDS_REVISION (overall < 8)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Verdict clearly stated as PASS or NEEDS_REVISION
    error_message: "Verdict ambiguous or missing."

  - [ ] Anti-patterns from critic/anti-patterns.md checked
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      Report includes anti-pattern scan results
    error_message: "Anti-pattern check not performed."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** blind_critic
  - **Purpose:** MCP tool for structured blind scoring on 9 dimensions
  - **Source:** MCP tool (post-production mandatory gate)

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven review, no automation scripts)

---

## Purpose

Conduct a blind review of copy deliverables WITHOUT any knowledge of the brief, author, mechanism, or offer context. The reviewer sees ONLY the raw copy text and scores it on 9 dimensions. This forces the copy to stand on its own — if it cannot persuade without the reviewer knowing the context, it cannot persuade a cold prospect.

## Prerequisites

- Read `squads/copy-chief/data/critic/metodologia-stand.md` for scoring methodology
- Read `squads/copy-chief/data/critic/anti-patterns.md` for known failure patterns
- Read `squads/copy-chief/data/critic/exemplos-aprovados.md` for calibration (PASS examples)
- Read `squads/copy-chief/data/critic/exemplos-reprovados.md` for calibration (FAIL examples)
- Do NOT read any briefing, HELIX, mecanismo, or research files for this offer

## Steps

### Step 0: Pre-Flight — Load Critic Methodology

Read all files in `squads/copy-chief/data/critic/`:
- `metodologia-stand.md` — scoring methodology and dimension definitions
- `anti-patterns.md` — known failure patterns to scan for
- `exemplos-aprovados.md` — calibration: what PASS looks like
- `exemplos-reprovados.md` — calibration: what FAIL looks like
- `checklist-validacao.md` — validation checklist

### Step 1: Receive Deliverable (Blind)

1. Read ONLY the deliverable file(s) at `deliverable_path`
2. Identify deliverable type if not provided
3. Do NOT read any other files from the offer directory
4. Note: Hawk must operate in isolation from brief context

### Step 2: Score on 9 Dimensions

Score each dimension 1-10 with specific evidence:

| # | Dimension | Weight | What to Evaluate |
|---|-----------|--------|------------------|
| 1 | **Clarity** | 12% | Can a 12-year-old understand the core message? |
| 2 | **DRE Activation** | 15% | Does it trigger a dominant residual emotion in the first 10 seconds? |
| 3 | **Believability** | 12% | Are claims grounded and plausible without external proof? |
| 4 | **Flow** | 10% | Does each line compel reading the next? No dead spots? |
| 5 | **Specificity** | 12% | Concrete details vs. vague generalities? |
| 6 | **Urgency** | 10% | Is there a reason to act NOW vs. later? |
| 7 | **Uniqueness** | 10% | Could this be for any product, or is it irreplaceable? |
| 8 | **Proof** | 10% | Evidence stacking: testimonials, data, authority, demonstration? |
| 9 | **CTA** | 9% | Is the call-to-action clear, single, and emotionally loaded? |

For each dimension:
- Score (1-10)
- Evidence (quote exact lines from copy)
- If < 8: specific fix recommendation

### Step 3: Anti-Pattern Scan

Check deliverable against known anti-patterns:
- Marketer language (instead of VOC)
- Generic claims ("best", "amazing", "revolutionary")
- Multiple CTAs competing
- DRE missing from opening
- Mechanism explanation without emotional bridge
- Proof without story context

### Step 4: Calculate Overall Score and Verdict

1. Calculate weighted average using dimension weights
2. Determine verdict:
   - **PASS:** Overall >= 8.0
   - **NEEDS_REVISION:** Overall < 8.0
3. If NEEDS_REVISION: prioritize fixes by impact (highest-weight dimensions first)

### Step 5: Write Report

Write to `{offer}/reviews/blind-critic-{deliverable_slug}.md`:

```markdown
# Blind Critic Report: {deliverable_name}

**Deliverable:** {path}
**Type:** {type}
**Date:** {ISO-8601}
**Verdict:** {PASS|NEEDS_REVISION}
**Overall Score:** {weighted_average}/10

## Dimension Scores

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| ... | ... | ... | ... |

## Detailed Analysis

### 1. Clarity ({score}/10)
**Evidence:** ...
**Fix (if < 8):** ...

[... repeat for all 9 dimensions ...]

## Anti-Pattern Scan
- [x] or [ ] per pattern

## Priority Fixes (if NEEDS_REVISION)
1. ...
2. ...
3. ...
```

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| 9 dimensions scored | Manual | All present | Yes |
| Evidence cited | Manual | Per dimension | Yes |
| Weighted average calculated | Manual | Correct math | Yes |
| Anti-patterns scanned | Manual | All checked | No |

---

## Error Handling

**Strategy:** abort

**Common Errors:**

1. **Error:** Context contamination (reviewer saw the brief)
   - **Cause:** Deliverable path includes briefing files, or agent loaded HELIX context
   - **Resolution:** Restart review with fresh agent instance, deliver ONLY copy text
   - **Recovery:** Flag review as contaminated, re-run with isolation

2. **Error:** Deliverable is empty or malformed
   - **Cause:** Production step failed silently
   - **Resolution:** Return to production agent for regeneration
   - **Recovery:** Log error, notify @chief

3. **Error:** Scoring calibration drift
   - **Cause:** Reviewer consistently scores too high or too low vs. exemplos
   - **Resolution:** Re-read calibration exemplos before scoring
   - **Recovery:** Compare against exemplos-aprovados/reprovados baselines

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 10-20 min per deliverable
cost_estimated: $0.02-0.05 (sonnet model)
token_usage: ~15,000-30,000 tokens
```

**Optimization Notes:**
- Batch multiple deliverables of same type for calibration consistency
- Score all dimensions before writing evidence (prevents anchoring bias)
- Read calibration exemplos once per session, not per deliverable

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - production-vsl OR production-lp OR production-creatives OR production-emails
tags:
  - review
  - quality
  - blind-critic
  - hawk
updated_at: 2026-03-06
```

---

## Handoff
next_agent: hawk
next_command: "*review full-validation {offer} {deliverable}"
condition: blind_critic verdict is PASS
alternatives:
  - agent: blade|echo|forge|scout, command: "*revise {deliverable}", condition: blind_critic verdict is NEEDS_REVISION (return to producing agent)
