# HELIX Briefing Phase Task

## Purpose

Execute a single HELIX briefing phase (01-10). Each phase produces a specific strategic deliverable that feeds downstream production. The HELIX system is the bridge between raw research and production-ready copy direction. This task is invoked once per phase, sequentially.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Fills phase template autonomously from research data
- No human review between phases
- **Best for:** Phases 01-04 (data-driven, low ambiguity)

### 2. Interactive Mode - Balanced, Educational (3-5 prompts) **[DEFAULT]**
- Presents phase deliverable for review before finalizing
- Asks for input on strategic decisions
- **Best for:** Phases 05-06 (MUP/MUS definition), phases 07-10 (production direction)

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Analyzes all required inputs before starting
- Maps data gaps and requests missing information upfront
- **Best for:** First time running HELIX for a new offer

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*briefing-helix {offer-path} --phase={NN}              # Interactive mode (default)
*briefing-helix {offer-path} --phase={NN} yolo          # YOLO mode
*briefing-helix {offer-path} --phase={NN} preflight     # Pre-flight planning mode
*briefing-helix {offer-path} --phase=all                # Run all 10 phases sequentially
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: briefingHelixPhase()
responsavel: Atlas (@briefer)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: phase_number
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: "01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|"10"|"all"

- campo: research_synthesis
  tipo: file
  origem: "{offer}/research/synthesis.md"
  obrigatorio: true
  validacao: File must exist with DRE Map and Avatar Profile

- campo: offer_context
  tipo: file
  origem: "{offer}/CONTEXT.md"
  obrigatorio: true
  validacao: File must exist with Produto and Mecanismo sections

- campo: previous_phases
  tipo: directory
  origem: "{offer}/briefings/phases/"
  obrigatorio: false
  validacao: Previous phase files must exist for phases > 01

- campo: helix_reference
  tipo: directory
  origem: "data/helix-ref/"
  obrigatorio: true
  validacao: Phase requirement files must exist

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: yolo|interactive|preflight

**Saida:**
- campo: phase_file
  tipo: file
  destino: "{offer}/briefings/phases/fase{NN}.md"
  persistido: true

- campo: helix_state
  tipo: file
  destino: "{offer}/helix-state.yaml"
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Research gate PASSED
    tipo: gate-check
    blocker: true
    validacao: |
      helix-state.yaml research_gate == PASSED
      Both synthesis.md and competitors.md must exist
    error_message: "Research gate not passed. Complete research-voc + research-competitors first."

  - [ ] Previous phases completed (for phases > 01)
    tipo: sequential-dependency
    blocker: true
    validacao: |
      For phase NN > 01: fase{NN-1}.md must exist
      Exception: phase 01 has no dependency
    error_message: "Previous phase not completed. HELIX phases must run sequentially."

  - [ ] Phase reference data available
    tipo: file-existence
    blocker: true
    validacao: |
      data/helix-ref/ contains phase requirement definitions
    error_message: "HELIX reference data not found. Check data/helix-ref/ directory."

  - [ ] synthesis.md has minimum confidence 70%
    tipo: quality-threshold
    blocker: true
    validacao: |
      Research synthesis confidence_score >= 0.70
    error_message: "Research confidence too low. Re-run research-voc for more data."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Phase file created at {offer}/briefings/phases/fase{NN}.md
    tipo: file-existence
    blocker: true
    validacao: |
      File exists and is non-empty
    error_message: "Phase file not created."

  - [ ] All phase sections populated (no placeholders)
    tipo: file-content
    blocker: true
    validacao: |
      No TODO, TBD, or placeholder markers in the phase file
    error_message: "Phase file contains unfilled placeholders."

  - [ ] helix-state.yaml updated with phase completion
    tipo: state-update
    blocker: true
    validacao: |
      helix-state.yaml shows phase {NN} as COMPLETED
    error_message: "helix-state.yaml not updated with phase completion."

  - [ ] All claims trace to research data
    tipo: data-integrity
    blocker: true
    validacao: |
      Every claim in the phase file references synthesis.md or competitors.md data
    error_message: "Claims must trace to research. No invention allowed (Article IV)."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Phase template fully populated with offer-specific content
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Phase deliverable matches requirements from data/helix-ref/
    error_message: "Phase content does not match HELIX requirements."

  - [ ] Content grounded in research data (not invented)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Constitutional Gate Article IV: No Invention
    error_message: "Content must trace to research. No invention."

  - [ ] Phase builds coherently on previous phases
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No contradictions with previous phase content
    error_message: "Phase contradicts previous phase content."

  - [ ] For phases 05-06: consensus + blind_critic validation
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Phases 05 (MUP) and 06 (MUS) require consensus validation
      and blind_critic score >= 8
    error_message: "MUP/MUS phases require consensus + blind_critic >= 8."

  - [ ] For phases 05-06: human approval obtained
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Phases 05-06 require explicit human approval before advancing
    error_message: "Human approval required for MUP/MUS phases."
```

---

## Steps

### Step 1: Load Phase Context
- Read phase requirements from `data/helix-ref/`
- Read `{offer}/research/synthesis.md` for research data
- Read `{offer}/CONTEXT.md` for offer parameters
- If phase > 01, read all previous phase files

### Step 2: Identify Required Data Points
- Map phase template fields to available research data
- Flag any data gaps that need addressing
- In interactive mode, confirm data mapping with user

### Step 3: Fill Phase Template
- Populate each section of the phase template with offer-specific content
- Ground every claim in research data (synthesis.md, competitors.md)
- Maintain consistency with previous phases
- Apply DRE-first lens to all strategic decisions

### Step 4: Validate Phase Content
- Check all sections populated (no placeholders)
- Verify data traceability (every claim links to source)
- Ensure coherence with previous phases

### Step 5: Special Validation for Phases 05-06
- **Phase 05 (MUP):** Run consensus validation on TOP 3 MUP candidates
  - Use `blind_critic` to score MUP statement (must score >= 8)
  - Present candidates to human for approval
- **Phase 06 (MUS):** Run consensus validation on MUS formulation
  - Use `blind_critic` to score MUS statement (must score >= 8)
  - Use `emotional_stress_test` to validate MUP+MUS combination (must score >= 8)
  - Present to human for approval

### Step 6: Write Phase File and Update State
- Write `{offer}/briefings/phases/fase{NN}.md`
- Update `{offer}/helix-state.yaml` with phase completion status
- If all 10 phases complete, compile `{offer}/briefings/helix-complete.md`

---

## HELIX Phase Reference

| Phase | Title | Key Deliverable |
|-------|-------|----------------|
| 01 | Audience Deep Dive | Refined avatar from research data |
| 02 | Problem Landscape | Problem hierarchy and urgency mapping |
| 03 | Solution Landscape | Existing solutions and their failures |
| 04 | Competitive Intel | Positioning matrix from competitor research |
| 05 | MUP Definition | Mecanismo Unico do Problema (requires consensus + human approval) |
| 06 | MUS Definition | Mecanismo Unico da Solucao (requires consensus + human approval) |
| 07 | Emotional Architecture | DRE escalation map for all copy assets |
| 08 | Proof Strategy | Social proof, authority, and evidence plan |
| 09 | Offer Architecture | Pricing, guarantee, bonus, urgency structure |
| 10 | Production Blueprint | Copy direction for VSL, LP, Creatives, Emails |

---

## Validation

```yaml
validation:
  automated:
    - Phase file exists at correct path
    - No placeholder markers in content
    - helix-state.yaml updated

  manual:
    - Phase content is strategically sound
    - Human approval for phases 05-06

  gate:
    name: briefing
    requires: All 10 phases completed
    validator: validate_gate
    threshold: PASSED
```

---

## Error Handling

**Strategy:** retry-with-input

**Common Errors:**

1. **Error:** Data Gap in Research
   - **Cause:** synthesis.md missing data needed for this phase
   - **Resolution:** Flag specific gap, suggest additional research queries
   - **Recovery:** Fill what's available, mark gaps with [DATA_GAP] for human input

2. **Error:** Consensus Validation Failed (Phases 05-06)
   - **Cause:** MUP/MUS candidates scored below threshold
   - **Resolution:** Revise candidates based on critique feedback
   - **Recovery:** Generate 3 new candidates, re-run consensus (max 3 iterations)

3. **Error:** blind_critic Score < 8 (Phases 05-06)
   - **Cause:** MUP/MUS statement not compelling or credible enough
   - **Resolution:** Strengthen evidence, refine language, add specificity
   - **Recovery:** Revise based on critic feedback, re-score (max 3 attempts)

4. **Error:** Phase Contradicts Previous Phase
   - **Cause:** Inconsistent strategic direction
   - **Resolution:** Review previous phases, identify contradiction source
   - **Recovery:** Resolve contradiction, update affected phase if needed

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 10-20 min per phase (phases 01-04, 07-10)
duration_expected_critical: 20-40 min per phase (phases 05-06, with consensus)
cost_estimated: $0.01-0.05 per phase
token_usage: ~8,000-20,000 tokens per phase
```

**Optimization Notes:**
- Phases 01-04 can run faster (data-driven, less strategic ambiguity)
- Phases 05-06 are bottleneck (consensus + human approval)
- Pre-load all research data once, reuse across phases

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - data/helix-ref/ (phase requirements)
  - research-voc (synthesis.md)
  - research-competitors (competitors.md)
  - consensus MCP (phases 05-06)
  - blind_critic MCP (phases 05-06)
  - emotional_stress_test MCP (phase 06)
tags:
  - briefing
  - helix
  - strategy
  - mup
  - mus
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@briefer"
next_command: "*briefing-helix {offer} --phase={NN+1}"
condition: Current phase completed and state updated
final_handoff:
  next_agent: "@chief"
  next_command: "*validate briefing"
  condition: All 10 phases completed, helix-complete.md generated
alternatives:
  - agent: "@briefer"
    command: "*briefing-mecanismo {offer}"
    condition: "Phases 01-04 complete, ready for MUP/MUS formal definition"
```
