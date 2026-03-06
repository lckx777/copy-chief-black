---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Full validation in single pass, output verdict
- No intermediate checkpoints
- **Best for:** Re-validation after fixes, quick re-check

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Checkpoint after each validation phase
- Explain DRE consistency and mechanism alignment findings
- **Best for:** First validation, complex deliverables, contested blind-critic scores

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Map all validation dimensions against brief before scoring
- Identify expected quality profile from HELIX phases
- **Best for:** VSL full validation, launch-critical deliverables

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: reviewFullValidation()
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
  validacao: One of [vsl, landing-page, creative, email, email-sequence]

- campo: offer_path
  tipo: string
  origem: Offer context
  obrigatorio: true
  validacao: Must be valid {niche}/{offer}/ directory with full briefing context

- campo: blind_critic_report
  tipo: file
  origem: "{offer}/reviews/blind-critic-{deliverable_slug}.md"
  obrigatorio: true
  validacao: blind_critic must have been run first (PASS or NEEDS_REVISION)

**Saida:**
- campo: full_validation_report
  tipo: file
  destino: "{offer}/reviews/full-validation-{deliverable_slug}.md"
  persistido: true

- campo: verdict
  tipo: string
  destino: Return value
  persistido: false

- campo: fix_recommendations
  tipo: array
  destino: Return value (if FAIL)
  persistido: false
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] blind_critic review completed for this deliverable
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/reviews/blind-critic-{deliverable_slug}.md exists
    error_message: "Blind critic review not found. Run review-blind-critic first."

  - [ ] HELIX briefing complete and accessible
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/briefings/helix-complete.md exists
    error_message: "HELIX briefing not found. Cannot validate against brief."

  - [ ] Mecanismo Unico accessible
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/mecanismo-unico.yaml exists with MUP and MUS defined
    error_message: "Mecanismo file not found or incomplete."

  - [ ] Avatar profile with DRE accessible
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/research/avatar-profile.md or synthesis.md exists
    error_message: "Avatar/research profile not found."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Report written to {offer}/reviews/full-validation-{deliverable_slug}.md
    tipo: post-condition
    blocker: true
    validacao: |
      File exists with all validation phases and final verdict
    error_message: "Full validation report not written."

  - [ ] emotional_stress_test executed and scored
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains emotional_stress_test results with score
    error_message: "emotional_stress_test not executed."

  - [ ] Compliance check completed
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains compliance section (claims, disclaimers, legal)
    error_message: "Compliance check missing from report."

  - [ ] Verdict is PASS, NEEDS_REVISION, or FAIL with specific rationale
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains unambiguous verdict with supporting evidence
    error_message: "Verdict missing or ambiguous."

  - [ ] If FAIL or NEEDS_REVISION: actionable fix list with priority
    tipo: post-condition
    blocker: true
    validacao: |
      Fix recommendations include: what to fix, where, why, priority
    error_message: "Fix recommendations missing for non-PASS verdict."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] DRE escalation validated against HELIX emotional arc
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Copy DRE progression matches HELIX phase emotional design
    error_message: "DRE escalation does not match HELIX emotional arc."

  - [ ] Mechanism consistency verified (MUP/MUS language matches brief)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      All mechanism references use approved MUP/MUS terminology from mecanismo-unico.yaml
    error_message: "Mechanism language inconsistent with approved mecanismo."

  - [ ] Proof quality validated (specific, verifiable, stacked)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Proof elements are specific (not generic), verifiable, and properly stacked
    error_message: "Proof quality insufficient."

  - [ ] emotional_stress_test score >= 8
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      emotional_stress_test returns score >= 8
    error_message: "Failed emotional_stress_test (score < 8)."

  - [ ] Compliance: no prohibited claims, proper disclaimers
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No health claims violating compliance rules, disclaimers present where required
    error_message: "Compliance violation detected."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** emotional_stress_test
  - **Purpose:** Validate DRE consistency, genericidade, emotional resonance
  - **Source:** MCP tool (post-production gate)

- **Tool:** black_validation
  - **Purpose:** Final comprehensive validation gate
  - **Source:** MCP tool (final delivery gate)

- **Tool:** blind_critic
  - **Purpose:** Reference existing blind scores for comparison
  - **Source:** MCP tool (read-only reference in this task)

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven validation, no automation scripts)

---

## Purpose

Conduct a comprehensive validation of copy deliverables WITH full context: HELIX briefing, mecanismo, avatar profile, DRE design. This is the second review layer (after blind critic) that validates the copy against its intended design. Where blind critic asks "does this copy work on its own?", full validation asks "does this copy execute the brief correctly?"

## Prerequisites

- Read `squads/copy-chief/data/critic/` for methodology and validation checklist
- Read `{offer}/briefings/helix-complete.md` for full HELIX context
- Read `{offer}/mecanismo-unico.yaml` for mechanism consistency checking
- Read `{offer}/research/avatar-profile.md` or `{offer}/research/synthesis.md` for avatar/DRE
- Read `{offer}/reviews/blind-critic-{deliverable_slug}.md` for existing blind scores

## Steps

### Step 0: Pre-Flight — Load Full Context

1. Read all critic methodology files from `squads/copy-chief/data/critic/`
2. Read HELIX briefing for this offer
3. Read mecanismo-unico.yaml for approved MUP/MUS language
4. Read avatar profile for DRE design and awareness level
5. Read existing blind critic report for comparison baseline

### Step 1: DRE Escalation Validation

1. Map the copy's emotional arc (entry emotion, escalation points, peak, resolution)
2. Compare against HELIX-designed emotional progression
3. Verify DRE type matches avatar's dominant residual emotion
4. Check escalation levels (1-5) hit the designed peaks
5. Flag any DRE gaps (sections without emotional charge)

### Step 2: Mechanism Consistency Check

1. Extract all mechanism references from the copy
2. Compare against `mecanismo-unico.yaml`:
   - MUP terminology matches approved language
   - MUS description consistent with formula
   - Gimmick Name used correctly
   - Authority Hook positioned correctly
   - Paradigm Shift articulated as designed
3. Flag any mechanism drift (language deviating from approved version)

### Step 3: Proof Quality Assessment

1. Inventory all proof elements in the copy:
   - Testimonials (specific vs. generic)
   - Data/statistics (sourced vs. unsourced)
   - Authority references (credentialed vs. vague)
   - Demonstration logic (clear vs. hand-wavy)
2. Validate proof stacking (proper sequence, escalating credibility)
3. Check proof-to-claim ratio (every major claim backed)

### Step 4: Emotional Stress Test

1. Run `emotional_stress_test` MCP tool on the deliverable
2. Score must be >= 8
3. Analyze genericidade score (lower is better — copy must be specific to this offer)
4. Analyze emotional resonance with target avatar

### Step 5: Compliance Check

1. Scan for prohibited health/income claims
2. Verify disclaimers present where required
3. Check guarantee language matches approved terms
4. Flag any regulatory risk areas (country-specific if multi-market)

### Step 6: Cross-Reference with Blind Critic

1. Compare full validation findings against blind critic scores
2. Identify any dimensions where context reveals issues blind critic missed
3. Identify any blind critic concerns resolved by understanding context
4. Note discrepancies for calibration learning

### Step 7: Final Verdict and Report

1. Determine verdict:
   - **PASS:** All checks pass, EST >= 8, compliance clean, DRE/mechanism aligned
   - **NEEDS_REVISION:** Minor issues fixable without restructuring
   - **FAIL:** Structural issues requiring significant rework
2. If not PASS: generate prioritized fix list with:
   - What to fix (specific section/line)
   - Why it fails (which check)
   - How to fix (specific recommendation)
   - Priority (1=highest impact)
3. Write report to `{offer}/reviews/full-validation-{deliverable_slug}.md`

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| DRE escalation | Manual vs. HELIX | Matches design | Yes |
| Mechanism consistency | Manual vs. mecanismo-unico.yaml | 100% alignment | Yes |
| Proof quality | Manual | Stacked, specific | Yes |
| Emotional stress test | emotional_stress_test | >= 8 | Yes |
| Compliance | Manual | No violations | Yes |
| Final gate (if PASS) | black_validation | >= 8 | Yes |

---

## Error Handling

**Strategy:** retry

**Common Errors:**

1. **Error:** emotional_stress_test score < 8
   - **Cause:** Generic language, weak DRE, disconnected emotional arc
   - **Resolution:** Identify specific sections causing score drop, recommend targeted rewrites
   - **Recovery:** Return to producing agent with section-level fix instructions

2. **Error:** Mechanism drift detected
   - **Cause:** Producing agent deviated from approved MUP/MUS language
   - **Resolution:** Provide exact approved language from mecanismo-unico.yaml
   - **Recovery:** Replace drifted sections with approved terminology

3. **Error:** Compliance violation found
   - **Cause:** Prohibited claims or missing disclaimers
   - **Resolution:** Flag exact claims and provide compliant alternatives
   - **Recovery:** BLOCK delivery until compliance resolved

4. **Error:** Blind critic report not found
   - **Cause:** Blind review was skipped
   - **Resolution:** Cannot proceed — blind review is mandatory first step
   - **Recovery:** Queue review-blind-critic task before retrying

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 15-30 min per deliverable
cost_estimated: $0.03-0.08 (sonnet model)
token_usage: ~20,000-50,000 tokens
```

**Optimization Notes:**
- Load full context once, validate multiple deliverables in same session
- Run emotional_stress_test in parallel with manual analysis
- Reuse compliance checklist across deliverables for same offer

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - review-blind-critic
  - briefing-helix-phase
  - briefing-mecanismo
tags:
  - review
  - validation
  - quality
  - hawk
updated_at: 2026-03-06
```

---

## Handoff
next_agent: sentinel
next_command: "*gate-check review {offer}"
condition: full_validation verdict is PASS
alternatives:
  - agent: blade|echo|forge|scout, command: "*revise {deliverable}", condition: verdict is NEEDS_REVISION (return to producing agent with fix list)
  - agent: chief, command: "*escalate {offer} {deliverable}", condition: verdict is FAIL (structural rework needed)
