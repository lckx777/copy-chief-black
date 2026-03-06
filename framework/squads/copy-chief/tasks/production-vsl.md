# VSL Production Task

## Purpose

Produce a complete Video Sales Letter (VSL) script in chapters. The VSL is the primary conversion asset in the funnel. Uses DRE-first emotional architecture with escalation levels 1-5. Every chapter is a persuasion unit with mapped emotional entry/exit points. The Lead chapter sells desire to keep watching -- not the product.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Writes all chapters sequentially without pause
- Validates each with blind_critic autonomously
- **Best for:** Experienced offers with proven HELIX, adapting existing VSL to new market

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Presents Lead chapter for approval before continuing
- Shows emotional architecture map before production
- Reviews DRE escalation per chapter
- **Best for:** First VSL for an offer, high-ticket products

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Maps full chapter outline before writing
- Defines emotional entry/exit per chapter upfront
- Plans proof placement and objection timing
- **Best for:** Complex mechanisms, offers with compliance constraints

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*produce-vsl {offer-path}                # Interactive mode (default)
*produce-vsl {offer-path} yolo           # YOLO mode
*produce-vsl {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: productionVsl()
responsavel: Echo (@vsl)
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

- campo: leads_data
  tipo: directory
  origem: "data/leads/"
  obrigatorio: true
  validacao: Lead structure templates and examples

- campo: swipes
  tipo: directory
  origem: "{offer}/swipes/vsl/"
  obrigatorio: false
  validacao: Reference VSL swipes if available

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: vsl_chapters
  tipo: directory
  destino: "{offer}/production/vsl/"
  persistido: true

- campo: vsl_emotional_map
  tipo: file
  destino: "{offer}/production/vsl/emotional-map.yaml"
  persistido: true

- campo: vsl_complete
  tipo: file
  destino: "{offer}/production/vsl/vsl-complete.md"
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

  - [ ] craft/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/craft/ directory contains writing principles and psychology files
    error_message: "Craft data not found. Production requires writing principles."

  - [ ] leads/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/leads/ directory contains lead structure templates
    error_message: "Leads data not found. VSL lead production requires lead templates."

  - [ ] Production directory writable
    tipo: directory-access
    blocker: true
    validacao: |
      {offer}/production/vsl/ can be created/written
    error_message: "Cannot write to production directory."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] All chapter files created in {offer}/production/vsl/
    tipo: directory-content
    blocker: true
    validacao: |
      Chapter files exist: lead.md, body-*.md, close.md (minimum 3 chapters)
    error_message: "VSL chapter files incomplete."

  - [ ] blind_critic score >= 8 per chapter
    tipo: quality-threshold
    blocker: true
    validacao: |
      Each chapter individually scores >= 8 on blind_critic
    error_message: "One or more chapters below blind_critic threshold."

  - [ ] emotional_stress_test score >= 8 on complete VSL
    tipo: quality-threshold
    blocker: true
    validacao: |
      Complete VSL (all chapters concatenated) scores >= 8
    error_message: "Complete VSL failed emotional stress test."

  - [ ] DRE escalation mapped per chapter
    tipo: data-completeness
    blocker: true
    validacao: |
      emotional-map.yaml shows emotional entry/exit levels per chapter
    error_message: "Emotional map not created for VSL chapters."

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
      Final black_validation on complete VSL >= 8
    error_message: "VSL failed black_validation. Revise before delivery."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Lead chapter sells desire to keep watching (not the product)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Lead chapter focuses on curiosity, pattern interrupt, emotional hook
      Product is NOT mentioned or revealed in the Lead
    error_message: "Lead must sell the video, not the product."

  - [ ] DRE-first emotional escalation through all chapters
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Emotional intensity escalates from Level 1 (surface) to Level 5 (identity)
      across the VSL arc
    error_message: "Emotional escalation not properly structured."

  - [ ] VOC language patterns used throughout
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Exact phrases from synthesis.md Language Patterns section appear in copy
    error_message: "Copy sounds academic, not like the audience. Use VOC language."

  - [ ] Mechanism reveal creates paradigm shift moment
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      MUP reveal section creates clear "aha moment" with paradigm shift
    error_message: "Mechanism reveal lacks impact. Must create paradigm shift."

  - [ ] Retention-per-second architecture maintained
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Each section has a reason to keep watching -- no dead zones
    error_message: "VSL has attention dead zones. Every section must earn next second."

  - [ ] All claims traceable to research or briefing
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No invented claims. Every statement traces to HELIX, research, or mechanism
    error_message: "Claims must trace to data. No invention (Article IV)."

  - [ ] Copy written to FILE (never terminal output)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      All copy output written to files in {offer}/production/vsl/
    error_message: "Copy must be written to files, not displayed in terminal."
```

---

## Steps

### Step 0: Pre-Flight Read
- Read `data/craft/` for writing principles, psychology, common errors
- Read `data/leads/` for lead structure and templates
- Read `{offer}/swipes/vsl/` if available (reference only, never copy)

### Step 1: Map Emotional Architecture
- Design emotional arc across all chapters
- Define entry emotion and exit emotion per chapter
- Map DRE escalation levels (1 to 5) across the full VSL
- Write `{offer}/production/vsl/emotional-map.yaml`

### Step 2: Write Lead Chapter
- Apply lead structure from `data/leads/`
- Hook: Pattern interrupt or curiosity trigger (0-30 seconds)
- Build: Establish the problem's urgency and relevance
- Promise: What the viewer will discover (not the product)
- The Lead sells the VIDEO, not the product
- Validate with `blind_critic` (must score >= 8)

### Step 3: Write Body Chapters
- Each body chapter is a persuasion unit:
  - **Problem Amplification:** Deepen the problem using DRE
  - **Mechanism Reveal:** MUP paradigm shift moment
  - **Solution Introduction:** MUS with Gimmick Name
  - **Proof Stacking:** Social proof, authority, studies
  - **Objection Handling:** Address resistance at the right emotional moment
- Validate each chapter with `blind_critic` (must score >= 8)

### Step 4: Write Close Chapter
- Offer presentation (pricing, guarantee, bonuses)
- Final DRE escalation to Level 5 (identity)
- Urgency and scarcity (authentic, not manufactured)
- CTA with emotional bridge (not just "click here")
- Validate with `blind_critic` (must score >= 8)

### Step 5: Compile and Test Complete VSL
- Concatenate all chapters into `vsl-complete.md`
- Run `emotional_stress_test` on complete VSL (must score >= 8)
- Run `layered_review` (3 layers: structure, emotion, persuasion)
- Verify emotional continuity between chapters (no jarring transitions)

### Step 6: Final Validation
- Run `black_validation` on complete VSL (must score >= 8)
- Verify all claims trace to HELIX, research, or mechanism
- Confirm VOC language patterns are present throughout
- Check retention architecture (no dead zones)

---

## Validation

```yaml
validation:
  automated:
    - All chapter files exist in {offer}/production/vsl/
    - blind_critic >= 8 per chapter
    - emotional_stress_test >= 8 on complete VSL
    - black_validation >= 8

  manual:
    - VSL is compelling to read aloud
    - Emotional arc feels natural, not forced
    - Mechanism reveal creates genuine "aha moment"
    - Language sounds like the audience, not a copywriter

  gate:
    name: production
    requires: [production-vsl]
    validator: black_validation
    threshold: 8
```

---

## Error Handling

**Strategy:** revise-with-feedback

**Common Errors:**

1. **Error:** blind_critic Score < 8 on Chapter
   - **Cause:** Chapter lacks emotional depth, specificity, or persuasion logic
   - **Resolution:** Read critic feedback, revise weak sections
   - **Recovery:** Revise and re-score (max 3 attempts per chapter)

2. **Error:** emotional_stress_test Score < 8
   - **Cause:** Emotional arc has gaps or escalation is not smooth
   - **Resolution:** Remap emotional transitions, strengthen DRE connection
   - **Recovery:** Revise emotional map, rewrite affected sections, re-test

3. **Error:** black_validation Score < 8
   - **Cause:** Overall VSL quality below production standard
   - **Resolution:** Review all validation feedback, prioritize highest-impact fixes
   - **Recovery:** Systematic revision pass, re-validate (max 2 attempts)

4. **Error:** Copy Sounds Generic / Homogenized
   - **Cause:** Anti-homogeneity domain violation
   - **Resolution:** Inject more VOC language, add specific details, break patterns
   - **Recovery:** Re-read synthesis.md Language Patterns, revise with authentic voice

5. **Error:** Lead Reveals Product Too Early
   - **Cause:** Common copywriter mistake -- selling product in the Lead
   - **Resolution:** Rewrite Lead to sell curiosity and the video itself
   - **Recovery:** Remove all product mentions from Lead, rebuild on curiosity

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 45-90 min (full VSL production)
cost_estimated: $0.10-0.30 (blind_critic + emotional_stress_test + black_validation)
token_usage: ~40,000-100,000 tokens
```

**Optimization Notes:**
- Write chapters sequentially (emotional arc requires continuity)
- blind_critic per chapter prevents wasted work on downstream chapters
- Pre-load all craft/ and leads/ data once at start
- Write to files incrementally (not all at end)

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
  - data/leads/ (lead structures)
  - blind_critic MCP
  - emotional_stress_test MCP
  - black_validation MCP
tags:
  - production
  - vsl
  - copy
  - dre
  - emotional-architecture
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@critic"
next_command: "*review vsl {offer}"
condition: VSL complete with black_validation >= 8
alternatives:
  - agent: "@lp"
    command: "*produce-lp {offer}"
    condition: "VSL complete, ready for parallel LP production"
  - agent: "@creative"
    command: "*produce-creatives {offer}"
    condition: "VSL complete, ready for parallel creative production"
  - agent: "@vsl"
    command: "*produce-vsl {offer} --revise"
    condition: "black_validation < 8, needs revision"
```
