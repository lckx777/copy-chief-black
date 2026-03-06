# Creative Production Task

## Purpose

Produce scroll-stopping ad creatives for Meta, YouTube, and TikTok. Uses divergent hook exploration to generate high volume, then convergent selection to pick winners. Each creative is decomposed into FORMAT (visual structure) and ANGLE (emotional/strategic approach). Batch production with multiple angles per creative set ensures testing breadth.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Auto-selects platforms based on offer funnel
- Generates full batch without pause
- Validates with blind_critic autonomously
- **Best for:** Scaling existing creative library, adding new angles

### 2. Interactive Mode - Balanced, Educational (5-8 prompts) **[DEFAULT]**
- Reviews hook candidates before selection
- Confirms platform/format priorities
- Presents creative batch for approval before finalizing
- **Best for:** First creative set for an offer, new platforms

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Maps all angles before hook generation
- Defines format/platform matrix upfront
- Plans batch structure and testing priorities
- **Best for:** Large media budgets, multi-platform launches

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*produce-creatives {offer-path}                # Interactive mode (default)
*produce-creatives {offer-path} yolo           # YOLO mode
*produce-creatives {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: productionCreatives()
responsavel: Scout (@creative)
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

- campo: avatar_profile
  tipo: embedded
  origem: "{offer}/research/synthesis.md -> Avatar Profile"
  obrigatorio: true
  validacao: DRE, demographics, and language patterns defined

- campo: craft_data
  tipo: directory
  origem: "data/craft/"
  obrigatorio: true
  validacao: Writing principles and psychology files

- campo: creative_data
  tipo: directory
  origem: "data/creative/"
  obrigatorio: true
  validacao: Angles, breakdown methodology, NUUPPECC criteria

- campo: swipes
  tipo: directory
  origem: "{offer}/swipes/criativos/"
  obrigatorio: false
  validacao: Reference creative swipes if available

- campo: competitor_ads
  tipo: directory
  origem: "{offer}/research/ad-swipes/"
  obrigatorio: false
  validacao: Competitor ad references for differentiation

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: creatives
  tipo: directory
  destino: "{offer}/production/creatives/"
  persistido: true

- campo: creative_matrix
  tipo: file
  destino: "{offer}/production/creatives/creative-matrix.yaml"
  persistido: true

- campo: hooks_library
  tipo: file
  destino: "{offer}/production/creatives/hooks-library.md"
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

  - [ ] creative/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/creative/ directory contains angles, breakdown methodology, NUUPPECC
    error_message: "Creative data not found. Production requires creative methodology."

  - [ ] craft/ data loaded
    tipo: file-existence
    blocker: true
    validacao: |
      data/craft/ directory contains writing principles
    error_message: "Craft data not found. Production requires writing principles."

  - [ ] Minimum 3 swipe files read (if available)
    tipo: data-preparation
    blocker: false
    validacao: |
      Read at least 3 swipe files from {offer}/swipes/criativos/ for reference
    error_message: "Swipe files recommended but not required."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Minimum 5 creatives per target platform
    tipo: quantity-check
    blocker: true
    validacao: |
      At least 5 creative files per platform (Meta, YouTube, TikTok as applicable)
    error_message: "Insufficient creatives. Need minimum 5 per platform."

  - [ ] blind_critic score >= 8 per creative
    tipo: quality-threshold
    blocker: true
    validacao: |
      Each individual creative scores >= 8 on blind_critic
    error_message: "One or more creatives below blind_critic threshold."

  - [ ] emotional_stress_test score >= 8 per batch
    tipo: quality-threshold
    blocker: true
    validacao: |
      Each platform batch scores >= 8 on emotional_stress_test
    error_message: "Creative batch failed emotional stress test."

  - [ ] black_validation score >= 8
    tipo: quality-threshold
    blocker: true
    validacao: |
      Final black_validation on complete creative set >= 8
    error_message: "Creative set failed black_validation."

  - [ ] NUUPPECC score >= 4/8 per selected hook
    tipo: quality-threshold
    blocker: true
    validacao: |
      Each hook scores at least 4 out of 8 on NUUPPECC framework
    error_message: "Hooks below NUUPPECC minimum threshold."

  - [ ] FORMAT and ANGLE documented separately per creative
    tipo: data-completeness
    blocker: true
    validacao: |
      creative-matrix.yaml documents FORMAT and ANGLE for each creative
    error_message: "FORMAT and ANGLE must be documented separately."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] 3Ms defined before production (Mystery, Mechanism, Market)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Mystery (curiosity driver), Mechanism (MUP/MUS angle),
      Market (audience segment) defined for creative direction
    error_message: "3Ms must be defined before creative production."

  - [ ] 10+ hooks generated in divergent phase
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      At least 10 hook candidates generated before selection
    error_message: "Divergent phase must generate 10+ hooks for selection."

  - [ ] NUUPPECC evaluation on all hooks
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      New, Unexpected, Ultra-specific, Personal, Provocative,
      Emotional, Curiosity-driven, Contrarian -- scored per hook
    error_message: "All hooks must be evaluated on NUUPPECC criteria."

  - [ ] Each creative has Hook (0-3s) + Body (3-30s) + CTA
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Three-part structure with time markers for each section
    error_message: "Creatives must follow Hook + Body + CTA structure."

  - [ ] Multiple angles represented across creative set
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      At least 3 different angles across the creative batch
    error_message: "Creative set too narrow. Need multiple angles for testing."

  - [ ] UGC briefs included where applicable
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      UGC-style scripts include performer direction and talking points
    error_message: "UGC briefs recommended for authenticity."

  - [ ] All claims traceable to research or briefing
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No invented claims in creatives. All trace to HELIX, research, or mechanism
    error_message: "Claims must trace to data. No invention (Article IV)."

  - [ ] Copy written to FILE (never terminal output)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      All creative output written to files in {offer}/production/creatives/
    error_message: "Copy must be written to files, not displayed in terminal."
```

---

## Steps

### Step 0: Pre-Flight Read
- Read `data/craft/` for writing principles
- Read `data/creative/` for angles, NUUPPECC, breakdown methodology
- Read `{offer}/swipes/criativos/` (minimum 3 swipe files if available)
- Read `{offer}/research/ad-swipes/` for competitor reference

### Step 1: Define 3Ms (Mystery, Mechanism, Market)
- **Mystery:** What curiosity driver will stop the scroll?
- **Mechanism:** Which MUP/MUS angle to lead with?
- **Market:** Which avatar segment to target?
- Document 3Ms for each planned creative angle

### Step 2: Divergent Hook Generation (10+ hooks)
- Generate at least 10 hook candidates
- Vary across formats: question, statistic, story, shock, authority, contrarian
- Each hook must be completeable in 0-3 seconds (text) or 0-5 seconds (video)
- Draw from different 3M combinations

### Step 3: NUUPPECC Evaluation
- Score each hook on 8 criteria (1 = no, 0 = maybe, -1 = anti):
  - **N**ew: Is this fresh?
  - **U**nexpected: Does it break pattern?
  - **U**ltra-specific: Does it use concrete details?
  - **P**ersonal: Does it feel like "me"?
  - **P**rovocative: Does it challenge beliefs?
  - **E**motional: Does it trigger DRE?
  - **C**uriosity: Does it create an open loop?
  - **C**ontrarian: Does it go against conventional wisdom?
- Select TOP 5+ hooks (score >= 4/8)

### Step 4: Build Creative Scripts
- For each selected hook, build full creative:
  - **Hook (0-3s):** Scroll-stopping opener
  - **Body (3-30s):** Problem/mechanism/solution in compressed form
  - **CTA (last 3-5s):** Clear action with emotional bridge
- Document FORMAT (visual/structural) and ANGLE (emotional/strategic) separately
- Create platform-specific versions where needed (aspect ratio, length, style)

### Step 5: Create UGC Briefs (where applicable)
- For UGC-style creatives, write performer briefs:
  - Talking points (not word-for-word scripts)
  - Emotional direction (tone, energy, authenticity cues)
  - Visual direction (setting, wardrobe, props)
  - B-roll suggestions

### Step 6: Build Creative Matrix
- Write `{offer}/production/creatives/creative-matrix.yaml`
- Map each creative to: platform, format, angle, hook, target segment
- Tag with testing priority (A/B test groupings)

### Step 7: Validate Creative Batch
- Run `blind_critic` on each individual creative (must score >= 8)
- Run `emotional_stress_test` on each platform batch (must score >= 8)
- Run `black_validation` on complete creative set (must score >= 8)
- Save all creatives to `{offer}/production/creatives/`
- Save hooks library to `{offer}/production/creatives/hooks-library.md`

---

## Validation

```yaml
validation:
  automated:
    - Minimum 5 creative files per platform
    - blind_critic >= 8 per creative
    - emotional_stress_test >= 8 per batch
    - black_validation >= 8
    - NUUPPECC >= 4/8 per hook

  manual:
    - Hooks genuinely stop the scroll
    - Creatives feel native to each platform
    - Angles provide genuine testing variety
    - Language matches audience (not "copywriter voice")

  gate:
    name: production
    requires: [production-creatives]
    validator: black_validation
    threshold: 8
```

---

## Error Handling

**Strategy:** iterate-with-expansion

**Common Errors:**

1. **Error:** All Hooks Score < 4 on NUUPPECC
   - **Cause:** Hooks too generic, safe, or derivative
   - **Resolution:** Re-read swipes for inspiration, try contrarian angles
   - **Recovery:** Generate 10 more hooks with different 3M combinations

2. **Error:** blind_critic Score < 8 on Creative
   - **Cause:** Creative lacks emotional punch, specificity, or structure
   - **Resolution:** Strengthen the weakest section (usually Body)
   - **Recovery:** Revise based on critic feedback, re-score (max 3 attempts)

3. **Error:** Creatives Too Similar to Each Other
   - **Cause:** Insufficient angle diversity
   - **Resolution:** Force new 3M combinations, try different emotional entries
   - **Recovery:** Generate creatives from opposite angles (fear vs. aspiration)

4. **Error:** Creatives Too Similar to Competitor Ads
   - **Cause:** Over-reliance on ad-swipes/ for inspiration
   - **Resolution:** Reference swipes for structure only, create original angles
   - **Recovery:** Re-generate with anti-homogeneity lens active

5. **Error:** Platform-Specific Format Issues
   - **Cause:** Creative not adapted for platform norms
   - **Resolution:** Review platform-specific requirements (length, aspect, style)
   - **Recovery:** Rewrite for platform-native feel

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 30-60 min (full creative batch)
cost_estimated: $0.08-0.20 (blind_critic per creative + emotional_stress_test + black_validation)
token_usage: ~25,000-60,000 tokens
```

**Optimization Notes:**
- Hook generation is fast (divergent, many at once)
- NUUPPECC scoring can be done in batch
- Individual creative writing can be parallelized across angles
- Validate per creative to catch issues early

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - briefing-helix-phase (all 10 phases)
  - briefing-mecanismo (APPROVED)
  - research-voc (synthesis.md for avatar + language)
  - research-competitors (ad-swipes for differentiation)
  - data/craft/ (writing principles)
  - data/creative/ (angles, NUUPPECC, methodology)
  - blind_critic MCP
  - emotional_stress_test MCP
  - black_validation MCP
tags:
  - production
  - creatives
  - hooks
  - ads
  - meta
  - youtube
  - tiktok
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@critic"
next_command: "*review creatives {offer}"
condition: Creative set complete with black_validation >= 8
parallel_with: [production-vsl, production-lp]
alternatives:
  - agent: "@creative"
    command: "*produce-creatives {offer} --expand"
    condition: "Need more angles or platforms"
  - agent: "@creative"
    command: "*produce-creatives {offer} --revise"
    condition: "black_validation < 8, needs revision"
```
