# Landing Page Production Task

## Purpose

Produce a complete Landing Page (LP) copy as a sequence of 14 persuasive micro-conversion blocks. Each block has a specific emotional function and drives the reader toward the next block. The LP is a standalone conversion asset that can work with or without a VSL. Emotional continuity between adjacent blocks is as important as the content within each block.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Writes all 14 blocks sequentially without pause
- Validates each with blind_critic autonomously
- **Best for:** Offers with proven HELIX and existing VSL as reference

### 2. Interactive Mode - Balanced, Educational (5-8 prompts) **[DEFAULT]**
- Presents block map before production
- Shows first 3 blocks for tone/style approval
- Reviews objection placement strategy with user
- **Best for:** First LP for an offer, complex funnels

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Maps all 14 blocks with emotional function before writing
- Plans proof and objection placement upfront
- Defines CTA strategy per block
- **Best for:** High-traffic LPs, offers with compliance constraints

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*produce-lp {offer-path}                # Interactive mode (default)
*produce-lp {offer-path} yolo           # YOLO mode
*produce-lp {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: productionLp()
responsavel: Forge (@lp)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: helix_complete
  tipo: file
  origem: "{offer}/briefings/helix-complete.md"
  obrigatorio: true
  validacao: All 10 HELIX phases must be completed

- campo: mecanismo_unico
  tipo: file
  origem: "{offer}/mecanismo-unico.yaml"
  obrigatorio: true
  validacao: Status must be APPROVED

- campo: research_synthesis
  tipo: file
  origem: "{offer}/research/synthesis.md"
  obrigatorio: true
  validacao: Must contain Language Patterns for authentic voice

- campo: craft_data
  tipo: directory
  origem: "data/craft/"
  obrigatorio: true
  validacao: Writing principles, psychology, checklist files

- campo: lp_data
  tipo: directory
  origem: "data/lp/"
  obrigatorio: true
  validacao: Block templates, patterns, and LP structure reference

- campo: vsl_reference
  tipo: directory
  origem: "{offer}/production/vsl/"
  obrigatorio: false
  validacao: VSL chapters for tone and content alignment

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: lp_blocks
  tipo: directory
  destino: "{offer}/production/landing-page/"
  persistido: true

- campo: lp_block_map
  tipo: file
  destino: "{offer}/production/landing-page/block-map.yaml"
  persistido: true

- campo: lp_complete
  tipo: file
  destino: "{offer}/production/landing-page/lp-complete.md"
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Briefing gate PASSED
    tipo: gate-check
    blocker: true
    validacao: |
      helix-state.yaml briefing_gate == PASSED
      helix-complete.md must exist with all 10 phases
    error_message: "Briefing gate not passed. Complete all HELIX phases first."

  - [ ] Mecanismo Unico APPROVED
    tipo: gate-check
    blocker: true
    validacao: |
      mecanismo-unico.yaml status == APPROVED
    error_message: "Mechanism not approved. Run briefing-mecanismo first."

  - [ ] lp/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/lp/ directory contains block templates and LP structure reference
    error_message: "LP data not found. Production requires block templates."

  - [ ] craft/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/craft/ directory contains writing principles
    error_message: "Craft data not found. Production requires writing principles."

  - [ ] Production directory writable
    tipo: directory-access
    blocker: true
    validacao: |
      {offer}/production/landing-page/ can be created/written
    error_message: "Cannot write to production directory."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] All 14 block files created in {offer}/production/landing-page/
    tipo: directory-content
    blocker: true
    validacao: |
      14 block files exist: block-01.md through block-14.md
    error_message: "LP block files incomplete. All 14 blocks required."

  - [ ] blind_critic score >= 8 per block
    tipo: quality-threshold
    blocker: true
    validacao: |
      Each block individually scores >= 8 on blind_critic
    error_message: "One or more blocks below blind_critic threshold."

  - [ ] Emotional continuity between adjacent blocks
    tipo: quality-check
    blocker: true
    validacao: |
      Exit emotion of block N matches entry emotion of block N+1
    error_message: "Emotional continuity broken between blocks."

  - [ ] emotional_stress_test score >= 8 on complete LP
    tipo: quality-threshold
    blocker: true
    validacao: |
      Complete LP (all blocks concatenated) scores >= 8
    error_message: "Complete LP failed emotional stress test."

  - [ ] layered_review completed (3 layers)
    tipo: quality-gate
    blocker: true
    validacao: |
      3-layer review: structure, emotion, persuasion
    error_message: "Layered review not completed."

  - [ ] black_validation score >= 8
    tipo: quality-threshold
    blocker: true
    validacao: |
      Final black_validation on complete LP >= 8
    error_message: "LP failed black_validation. Revise before delivery."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] 14 blocks produced in correct sequence
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      All 14 blocks present with correct emotional function per block
    error_message: "All 14 LP blocks must be produced."

  - [ ] Each block is a micro-conversion unit
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Each block drives one specific micro-conversion (read next block, click CTA, etc.)
    error_message: "Blocks must function as micro-conversion units."

  - [ ] Objection timing is strategic (not reactive)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Objections handled at the moment they arise in the reader's mind
    error_message: "Objection placement needs strategic timing."

  - [ ] DRE escalation through the page
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Emotional intensity escalates through the 14-block structure
    error_message: "DRE escalation not properly structured across blocks."

  - [ ] VOC language patterns used throughout
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Exact phrases from synthesis.md Language Patterns appear in copy
    error_message: "Copy sounds generic. Use VOC language patterns."

  - [ ] All claims traceable to research or briefing
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No invented claims. All trace to HELIX, research, or mechanism
    error_message: "Claims must trace to data. No invention (Article IV)."

  - [ ] Copy written to FILE (never terminal output)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      All copy output written to files in {offer}/production/landing-page/
    error_message: "Copy must be written to files, not displayed in terminal."
```

---

## Steps

### Step 0: Pre-Flight Read
- Read `data/craft/` for writing principles, psychology, common errors
- Read `data/lp/` for block templates, patterns, and LP structure
- Read `{offer}/production/vsl/` if available (alignment reference)

### Step 1: Map Block Architecture
- Design the 14-block emotional journey
- Define emotional function per block (from `data/lp/` reference)
- Map entry/exit emotions for continuity
- Plan objection placement timing
- Plan CTA placement (primary and secondary)
- Write `{offer}/production/landing-page/block-map.yaml`

### Step 2: Write Blocks 01-03 (Above the Fold)
- **Block 01: Headline + Sub-headline** -- Pattern interrupt, problem/promise
- **Block 02: Problem Amplification** -- DRE activation, "I know how you feel"
- **Block 03: Mechanism Tease** -- Why nothing has worked (bridge to MUP)
- Validate each with `blind_critic` (must score >= 8)
- In interactive mode, pause for tone/style approval after Block 03

### Step 3: Write Blocks 04-07 (Problem + Mechanism)
- **Block 04: MUP Reveal** -- Paradigm shift moment
- **Block 05: Evidence Stack** -- Studies, data, authority for MUP
- **Block 06: MUS Introduction** -- Gimmick Name, solution mechanism
- **Block 07: How It Works** -- Components, ingredients, process
- Validate each with `blind_critic` (must score >= 8)

### Step 4: Write Blocks 08-11 (Proof + Objections)
- **Block 08: Social Proof** -- Testimonials, case studies
- **Block 09: Expert Authority** -- Expert credibility, institutional backing
- **Block 10: Objection Handling** -- Top 3-5 objections addressed
- **Block 11: Comparison** -- Why this is different from alternatives
- Validate each with `blind_critic` (must score >= 8)

### Step 5: Write Blocks 12-14 (Close)
- **Block 12: Offer Presentation** -- Pricing, packages, value stack
- **Block 13: Guarantee + Risk Reversal** -- Remove remaining friction
- **Block 14: Final CTA + Urgency** -- Identity-level DRE, last push
- Validate each with `blind_critic` (must score >= 8)

### Step 6: Compile and Test Complete LP
- Concatenate all blocks into `lp-complete.md`
- Run `emotional_stress_test` on complete LP (must score >= 8)
- Run `layered_review` (3 layers: structure, emotion, persuasion)
- Verify emotional continuity between all adjacent blocks

### Step 7: Final Validation
- Run `black_validation` on complete LP (must score >= 8)
- Verify all claims trace to HELIX, research, or mechanism
- Confirm VOC language patterns present throughout
- Check micro-conversion logic (each block drives to next action)

---

## 14-Block Reference

| Block | Emotional Function | DRE Level |
|-------|-------------------|-----------|
| 01 | Pattern interrupt, hook | 1 (surface) |
| 02 | Problem recognition, empathy | 2 (emotional) |
| 03 | Failed solutions, frustration | 2-3 |
| 04 | Paradigm shift (MUP reveal) | 3 (cognitive) |
| 05 | Evidence, credibility | 3 |
| 06 | Hope activation (MUS) | 3-4 |
| 07 | Understanding, clarity | 3 |
| 08 | Social validation | 4 (relational) |
| 09 | Authority trust | 4 |
| 10 | Objection resolution | 3-4 |
| 11 | Differentiation, confidence | 4 |
| 12 | Value perception, desire | 4-5 |
| 13 | Risk removal, safety | 4 |
| 14 | Identity transformation | 5 (identity) |

---

## Validation

```yaml
validation:
  automated:
    - All 14 block files exist in {offer}/production/landing-page/
    - blind_critic >= 8 per block
    - emotional_stress_test >= 8 on complete LP
    - black_validation >= 8

  manual:
    - LP reads as cohesive persuasion journey
    - Each block earns the next scroll
    - Objections addressed at natural timing points
    - Language sounds authentic (not copywriter-ese)

  gate:
    name: production
    requires: [production-lp]
    validator: black_validation
    threshold: 8
```

---

## Error Handling

**Strategy:** revise-with-feedback

**Common Errors:**

1. **Error:** blind_critic Score < 8 on Block
   - **Cause:** Block lacks emotional function clarity or persuasion logic
   - **Resolution:** Read critic feedback, strengthen block's specific function
   - **Recovery:** Revise and re-score (max 3 attempts per block)

2. **Error:** Emotional Continuity Break Between Blocks
   - **Cause:** Exit emotion of block N does not match entry of block N+1
   - **Resolution:** Adjust transition language, smooth emotional bridge
   - **Recovery:** Rewrite transition sections of affected blocks

3. **Error:** emotional_stress_test Score < 8
   - **Cause:** Emotional arc has gaps, jumps, or flat zones
   - **Resolution:** Remap emotional journey, strengthen weak blocks
   - **Recovery:** Revise block map, rewrite affected blocks, re-test

4. **Error:** black_validation Score < 8
   - **Cause:** Overall LP quality below production standard
   - **Resolution:** Review all validation feedback, prioritize fixes
   - **Recovery:** Systematic revision pass, re-validate (max 2 attempts)

5. **Error:** Blocks Sound Disconnected from Each Other
   - **Cause:** Written as isolated units without continuity awareness
   - **Resolution:** Re-read previous block before writing next
   - **Recovery:** Rewrite transitions, add connective tissue between blocks

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 40-80 min (full LP production)
cost_estimated: $0.10-0.25 (blind_critic x14 + emotional_stress_test + black_validation)
token_usage: ~35,000-80,000 tokens
```

**Optimization Notes:**
- Write blocks sequentially (emotional continuity requires it)
- blind_critic per block catches issues early
- Pre-load all craft/ and lp/ data once at start
- If VSL exists, use as tonal reference (but never duplicate)

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - briefing-helix-phase (all 10 phases)
  - briefing-mecanismo (APPROVED)
  - research-voc (synthesis.md for language patterns)
  - data/craft/ (writing principles)
  - data/lp/ (block templates)
  - blind_critic MCP
  - emotional_stress_test MCP
  - black_validation MCP
tags:
  - production
  - landing-page
  - copy
  - blocks
  - micro-conversion
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@critic"
next_command: "*review lp {offer}"
condition: LP complete with black_validation >= 8
parallel_with: [production-vsl, production-creatives]
alternatives:
  - agent: "@lp"
    command: "*produce-lp {offer} --revise"
    condition: "black_validation < 8, needs revision"
  - agent: "@creative"
    command: "*produce-creatives {offer}"
    condition: "LP complete, ready for creative production"
```
