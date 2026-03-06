# Mecanismo Unico Definition Task

## Purpose

Define and validate the Unique Mechanism (Mecanismo Unico) for the offer. This is the most critical strategic artifact in the pipeline -- it determines the core positioning of the product. Composed of MUP (Mecanismo Unico do Problema: why the problem exists) and MUS (Mecanismo Unico da Solucao: why the solution works). Requires multi-model consensus validation and human approval.

---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - NOT RECOMMENDED
- This task involves critical strategic decisions
- YOLO mode will still require human approval at the end
- **Best for:** Never. Use Interactive or Pre-Flight.

### 2. Interactive Mode - Balanced, Educational (5-8 prompts) **[DEFAULT]**
- Presents MUP candidates for discussion
- Iterates on Gimmick Name with user
- Reviews MUS formulation before validation
- **Best for:** Most scenarios (recommended)

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Analyzes all HELIX phases 01-04 for mechanism clues
- Maps competitor mechanisms for differentiation
- Defines evaluation criteria upfront
- **Best for:** Saturated niches where differentiation is critical

**Parameter:** `mode` (optional, default: `interactive`)

**Usage:**
```
*briefing-mecanismo {offer-path}                # Interactive mode (default)
*briefing-mecanismo {offer-path} preflight      # Pre-flight planning mode
```

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: briefingMecanismo()
responsavel: Atlas (@briefer)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: helix_phases_01_04
  tipo: files
  origem: "{offer}/briefings/phases/fase01.md through fase04.md"
  obrigatorio: true
  validacao: All 4 files must exist and be completed

- campo: research_synthesis
  tipo: file
  origem: "{offer}/research/synthesis.md"
  obrigatorio: true
  validacao: Must contain DRE Map and Avatar Profile

- campo: competitors_report
  tipo: file
  origem: "{offer}/research/competitors.md"
  obrigatorio: false
  validacao: Provides competitor mechanism landscape for differentiation

- campo: offer_context
  tipo: file
  origem: "{offer}/CONTEXT.md"
  obrigatorio: true
  validacao: Must contain existing MUP/MUS hypotheses if any

- campo: mode
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: interactive|preflight

**Saida:**
- campo: mecanismo_unico
  tipo: file
  destino: "{offer}/mecanismo-unico.yaml"
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
  - [ ] HELIX phases 01-04 completed
    tipo: sequential-dependency
    blocker: true
    validacao: |
      fase01.md through fase04.md must exist at {offer}/briefings/phases/
      helix-state.yaml must show phases 01-04 as COMPLETED
    error_message: "HELIX phases 01-04 must be completed before mechanism definition."

  - [ ] Research synthesis available
    tipo: file-existence
    blocker: true
    validacao: |
      synthesis.md exists with Avatar Profile and DRE Map
    error_message: "Research synthesis required for mechanism grounding."

  - [ ] No existing APPROVED mechanism
    tipo: state-check
    blocker: true
    validacao: |
      mecanismo-unico.yaml status != APPROVED
      (prevents accidental overwrite of approved mechanism)
    error_message: "Mechanism already APPROVED. Use --force to override."

  - [ ] consensus MCP available
    tipo: mcp-availability
    blocker: true
    validacao: |
      consensus validation tool must be accessible
    error_message: "consensus MCP required for mechanism validation. Cannot proceed without it."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] mecanismo-unico.yaml created with all 4 Puzzle Pieces
    tipo: file-content
    blocker: true
    validacao: |
      File contains: sexy_cause, gimmick_name, origin_story, authority_hook
    error_message: "mecanismo-unico.yaml missing Puzzle Pieces."

  - [ ] MUP statement defined with evidence
    tipo: data-quality
    blocker: true
    validacao: |
      MUP has: statement, evidence_sources, paradigm_shift, DRE_connection
    error_message: "MUP statement incomplete."

  - [ ] MUS statement defined with ingredients/components
    tipo: data-quality
    blocker: true
    validacao: |
      MUS has: statement, components, gimmick_name, delivery_mechanism
    error_message: "MUS statement incomplete."

  - [ ] consensus validation PASSED
    tipo: quality-gate
    blocker: true
    validacao: |
      consensus result == VALIDATED
    error_message: "Mechanism did not pass consensus validation."

  - [ ] blind_critic score >= 8 for both MUP and MUS
    tipo: quality-threshold
    blocker: true
    validacao: |
      blind_critic(MUP) >= 8 AND blind_critic(MUS) >= 8
    error_message: "blind_critic scores below threshold."

  - [ ] emotional_stress_test score >= 8 for MUP+MUS combination
    tipo: quality-threshold
    blocker: true
    validacao: |
      emotional_stress_test(MUP+MUS) >= 8
    error_message: "Emotional stress test failed for mechanism combination."

  - [ ] Human approval obtained (status == APPROVED)
    tipo: human-approval
    blocker: true
    validacao: |
      mecanismo-unico.yaml status == APPROVED (set by human)
    error_message: "Human approval required. Mechanism is VALIDATED but not APPROVED."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] 4 Puzzle Pieces defined
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      1. Sexy Cause (MUP in colloquial terms)
      2. Gimmick Name (memorable name for the solution)
      3. Origin Story (how the solution was discovered)
      4. Authority Hook (why credible - expert, study, institution)
    error_message: "All 4 Puzzle Pieces must be defined."

  - [ ] Paradigm Shift articulated
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Clear "It's NOT X, it's Y" statement that reframes the problem
    error_message: "Paradigm shift statement missing."

  - [ ] MUP is digestible, unique, probable, and connected (RMBC)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      RMBC criteria scores >= 7 for all: Digerivel, Unico, Provavel, Conectado
    error_message: "RMBC criteria not met for MUP."

  - [ ] MUS connects logically to MUP
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      MUS directly addresses the cause defined in MUP
    error_message: "MUS does not logically address MUP cause."

  - [ ] Mechanism differentiates from competitor mechanisms
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Mechanism is unique vs. competitors documented in competitors.md
    error_message: "Mechanism too similar to existing competitor mechanisms."

  - [ ] Multi-model consensus validates mechanism
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      consensus tool returns VALIDATED status
    error_message: "Consensus validation failed."
```

---

## Steps

### Step 1: Analyze HELIX Foundation
- Read HELIX phases 01-04 for mechanism clues
- Extract problem landscape (fase02), solution landscape (fase03), competitive intel (fase04)
- Identify the strongest "why the problem exists" angle from research

### Step 2: Generate MUP Candidates (3 minimum)
- Create 3+ MUP candidate statements
- Each candidate must have:
  - A "sexy cause" (colloquial, memorable name for the problem cause)
  - Evidence from research data
  - A paradigm shift statement ("It's NOT X, it's Y")
  - Clear DRE connection

### Step 3: Evaluate MUP Candidates
- Score each on RMBC criteria (Digerivel, Unico, Provavel, Conectado)
- Check differentiation vs. competitor mechanisms
- Run consensus validation on TOP 3 candidates
- Run `blind_critic` on each candidate (must score >= 8)

### Step 4: Select and Refine MUP
- In interactive mode, present candidates with scores to human
- Select winning MUP based on consensus + scores + human input
- Refine language for maximum impact and memorability

### Step 5: Define MUS
- Build solution mechanism that directly addresses MUP cause
- Define:
  - Solution components (ingredients, steps, elements)
  - Gimmick Name (memorable, ownable name)
  - Delivery mechanism (how the solution reaches the user)
  - Origin Story (discovery narrative)
  - Authority Hook (expert, institution, study)

### Step 6: Validate MUS
- Run `blind_critic` on MUS statement (must score >= 8)
- Run `emotional_stress_test` on MUP+MUS combination (must score >= 8)
- Verify MUS logically connects to MUP

### Step 7: Write mecanismo-unico.yaml
- Write complete mechanism file with all fields:
  ```yaml
  mup:
    statement: "..."
    sexy_cause: "..."
    paradigm_shift: "..."
    evidence: [...]
    dre_connection: "..."
  mus:
    statement: "..."
    gimmick_name: "..."
    components: [...]
    origin_story: "..."
    authority_hook: "..."
    delivery: "..."
  puzzle_pieces:
    sexy_cause: "..."
    gimmick_name: "..."
    origin_story: "..."
    authority_hook: "..."
  validation:
    consensus: VALIDATED
    blind_critic_mup: {score}
    blind_critic_mus: {score}
    emotional_stress_test: {score}
    rmbc_scores: {digerivel, unico, provavel, conectado}
  status: VALIDATED  # APPROVED after human approval
  ```

### Step 8: Request Human Approval
- Present complete mechanism to human
- Wait for explicit approval
- Update status to APPROVED upon human confirmation
- Update helix-state.yaml with mechanism gate status

---

## Validation

```yaml
validation:
  automated:
    - mecanismo-unico.yaml exists with all required fields
    - consensus == VALIDATED
    - blind_critic >= 8 for MUP and MUS
    - emotional_stress_test >= 8

  manual:
    - Mechanism feels unique and believable
    - Paradigm shift is genuinely surprising
    - Gimmick Name is memorable
    - Human approval (APPROVED status)

  gate:
    name: mecanismo
    requires: [briefing-mecanismo]
    validator: validate_gate
    threshold: APPROVED
    note: "This gate BLOCKS all production tasks"
```

---

## Error Handling

**Strategy:** iterate-with-feedback

**Common Errors:**

1. **Error:** Consensus Validation Failed
   - **Cause:** Mechanism too similar to existing, or not credible enough
   - **Resolution:** Generate new candidates with different angles
   - **Recovery:** Max 3 consensus rounds. Escalate to human if all fail.

2. **Error:** blind_critic Score < 8
   - **Cause:** Statement lacks specificity, evidence, or emotional connection
   - **Resolution:** Strengthen with data points, refine language
   - **Recovery:** Revise based on critic feedback, re-score (max 3 attempts)

3. **Error:** emotional_stress_test Score < 8
   - **Cause:** MUP+MUS combination lacks emotional coherence
   - **Resolution:** Strengthen DRE connection, add emotional specificity
   - **Recovery:** Revise emotional framing, re-test (max 3 attempts)

4. **Error:** Human Rejects Mechanism
   - **Cause:** Business/market knowledge that data doesn't capture
   - **Resolution:** Collect human feedback, generate new candidates incorporating feedback
   - **Recovery:** Return to Step 2 with human input as additional constraint

5. **Error:** RMBC Scores < 7
   - **Cause:** Mechanism is too complex, generic, or implausible
   - **Resolution:** Simplify (Digerivel), differentiate (Unico), add evidence (Provavel), link to avatar (Conectado)
   - **Recovery:** Revise specific weak dimension, re-score

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 30-60 min (including consensus rounds)
cost_estimated: $0.05-0.20 (consensus + blind_critic + emotional_stress_test)
token_usage: ~20,000-50,000 tokens
```

**Optimization Notes:**
- This is intentionally the slowest task -- mechanism quality is non-negotiable
- Pre-load all research data once at start
- Run blind_critic on MUP candidates in parallel
- Human approval is the bottleneck -- prepare clear presentation

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - briefing-helix-phase (phases 01-04)
  - research-voc (synthesis.md)
  - research-competitors (competitors.md)
  - consensus MCP
  - blind_critic MCP
  - emotional_stress_test MCP
tags:
  - briefing
  - mecanismo
  - mup
  - mus
  - critical-gate
updated_at: 2026-03-06
```

---

## Handoff

```yaml
next_agent: "@briefer"
next_command: "*briefing-helix {offer} --phase=07"
condition: Mechanism APPROVED, ready to continue HELIX phases 07-10
alternatives:
  - agent: "@gatekeeper"
    command: "*validate mecanismo {offer}"
    condition: "Mechanism needs formal gate validation"
  - agent: "@chief"
    command: "*produce {offer}"
    condition: "All HELIX phases complete, mechanism APPROVED, ready for production"
```
