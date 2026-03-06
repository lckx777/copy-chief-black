---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Check all prerequisites, output PASS/FAIL immediately
- No intermediate explanations
- **Best for:** Routine gate checks, automated pipeline advancement

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Explain each prerequisite check and its status
- Checkpoint before advancing helix-state.yaml
- **Best for:** First-time phase transitions, debugging failed gates

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Audit all gate prerequisites before checking
- Map dependency chain for target phase
- **Best for:** Complex multi-gate transitions, pipeline debugging

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: gateCheck()
responsavel: Sentinel (@gatekeeper)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: target_phase
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [research, briefing, production, review, delivery]

- campo: offer_path
  tipo: string
  origem: Offer context
  obrigatorio: true
  validacao: Must be valid {niche}/{offer}/ directory with helix-state.yaml

- campo: force
  tipo: boolean
  origem: User Input
  obrigatorio: false
  validacao: Default false. If true, advance even with warnings (NOT errors).

**Saida:**
- campo: gate_verdict
  tipo: string
  destino: Return value
  persistido: false

- campo: gate_report
  tipo: object
  destino: Return value (YAML summary)
  persistido: false

- campo: helix_state_updated
  tipo: boolean
  destino: "{offer}/helix-state.yaml"
  persistido: true
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] helix-state.yaml exists for this offer
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/helix-state.yaml exists and is valid YAML
    error_message: "helix-state.yaml not found. Initialize offer state first."

  - [ ] Current phase is the phase BEFORE target_phase
    tipo: pre-condition
    blocker: true
    validacao: |
      Read helix-state.yaml, verify current phase precedes target_phase in pipeline order
    error_message: "Cannot skip phases. Current phase must precede target phase."

  - [ ] CONTEXT.md exists for this offer
    tipo: pre-condition
    blocker: false
    validacao: |
      Verify {offer}/CONTEXT.md exists
    error_message: "Warning: CONTEXT.md not found. Gate check proceeding without offer context."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Gate verdict returned (PASS or FAIL)
    tipo: post-condition
    blocker: true
    validacao: |
      Verdict is unambiguously PASS or FAIL
    error_message: "Gate verdict not determined."

  - [ ] If PASS: helix-state.yaml updated with new phase status
    tipo: post-condition
    blocker: true
    validacao: |
      helix-state.yaml reflects advanced phase with timestamp
    error_message: "helix-state.yaml not updated after PASS verdict."

  - [ ] If FAIL: specific blockers listed with resolution paths
    tipo: post-condition
    blocker: true
    validacao: |
      Each blocker has: what is missing, where to find it, which task to run
    error_message: "FAIL verdict without specific blockers."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] All mandatory prerequisites for target phase verified
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Every prerequisite in the gate matrix checked with evidence
    error_message: "Not all prerequisites verified."

  - [ ] No phase skipping allowed (sequential advancement only)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Pipeline order enforced: research -> briefing -> production -> review -> delivery
    error_message: "Phase skip attempted."

  - [ ] helix-state.yaml is single source of truth for phase status
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Phase status read from and written to helix-state.yaml exclusively
    error_message: "Phase status not synchronized with helix-state.yaml."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** validate_gate
  - **Purpose:** MCP tool for formal gate validation
  - **Source:** MCP tool (phase transition checkpoint)

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven gate check, no automation scripts)

---

## Purpose

Enforce phase transitions in the Copy Chief pipeline. Each offer progresses through 5 phases: Research, Briefing, Production, Review, Delivery. No phase can be skipped. Each transition requires specific prerequisites. Sentinel reads `helix-state.yaml`, checks all prerequisites for the target phase, and returns PASS (advance) or FAIL (block with specific missing items).

## Prerequisites

- Read `{offer}/helix-state.yaml` for current phase status
- Read `{offer}/CONTEXT.md` for offer context
- Access to offer directory structure for file existence checks

## Steps

### Step 1: Read Current State

1. Read `{offer}/helix-state.yaml`
2. Extract current phase and all gate statuses
3. Verify target_phase is the NEXT phase (no skipping)
4. If target_phase is not next: FAIL immediately

### Step 2: Check Gate Prerequisites

Apply the gate matrix for the target phase:

#### Gate: Research -> Briefing

| Prerequisite | Check | Required |
|-------------|-------|----------|
| VOC research completed | `{offer}/research/` has synthesis or VOC files | Yes |
| Avatar profile defined | `{offer}/research/avatar-profile.md` exists | Yes |
| DRE identified | Avatar profile contains DRE section | Yes |
| Competitor analysis | `{offer}/research/competitors/` exists | No (warning) |
| Research confidence >= 70% | helix-state.yaml research_confidence | Yes |

#### Gate: Briefing -> Production

| Prerequisite | Check | Required |
|-------------|-------|----------|
| HELIX complete (10 phases) | `{offer}/briefings/helix-complete.md` exists | Yes |
| Mecanismo APPROVED or VALIDATED | mecanismo-unico.yaml state field | Yes |
| MUP defined | mecanismo-unico.yaml MUP section | Yes |
| MUS defined | mecanismo-unico.yaml MUS section | Yes |
| Gimmick Name defined | mecanismo-unico.yaml gimmick_name | No (warning) |
| briefing_gate.status == PASSED | helix-state.yaml | Yes |

#### Gate: Production -> Review

| Prerequisite | Check | Required |
|-------------|-------|----------|
| At least 1 deliverable produced | `{offer}/production/` has content | Yes |
| All planned deliverables present | Cross-ref production plan vs. files | Yes |
| Self-validation scores >= 7 | Production files have validation marks | No (warning) |

#### Gate: Review -> Delivery

| Prerequisite | Check | Required |
|-------------|-------|----------|
| blind_critic PASS on all deliverables | `{offer}/reviews/blind-critic-*.md` all PASS | Yes |
| full_validation PASS on all deliverables | `{offer}/reviews/full-validation-*.md` all PASS | Yes |
| emotional_stress_test >= 8 | Review reports contain EST scores >= 8 | Yes |
| black_validation >= 8 | Final validation gate passed | Yes |
| Compliance check clean | No compliance violations in reviews | Yes |

### Step 3: Determine Verdict

1. If ALL required prerequisites are met: **PASS**
2. If ANY required prerequisite fails: **FAIL**
3. If only non-required (warning) items fail: **PASS with warnings**
4. If `force=true` and only warnings: advance despite warnings

### Step 4: Update State (if PASS)

1. Update `{offer}/helix-state.yaml`:
   - Set `{target_phase}_gate.status: PASSED`
   - Set `{target_phase}_gate.timestamp: {ISO-8601}`
   - Advance `current_phase` to target_phase
2. Run `validate_gate` MCP tool for formal validation record

### Step 5: Return Report

Return YAML summary:

```yaml
gate_check:
  offer: "{niche}/{offer}"
  target_phase: "{target_phase}"
  verdict: "PASS|FAIL"
  timestamp: "{ISO-8601}"
  prerequisites:
    passed: [list of passed checks]
    failed: [list of failed checks with resolution]
    warnings: [list of non-blocking warnings]
  state_updated: true|false
```

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| Phase order | Manual | Sequential | Yes |
| Prerequisites | Per gate matrix | All required met | Yes |
| State file valid | YAML parser | Valid YAML | Yes |
| MCP formal gate | validate_gate | PASS | Yes |

---

## Error Handling

**Strategy:** abort

**Common Errors:**

1. **Error:** helix-state.yaml missing or corrupted
   - **Cause:** Offer not properly initialized
   - **Resolution:** Initialize offer with default helix-state.yaml
   - **Recovery:** Create default state file, set all gates to NOT_STARTED

2. **Error:** Phase skip attempted
   - **Cause:** User or agent tries to jump phases
   - **Resolution:** HARD BLOCK. Cannot skip. Pipeline is sequential.
   - **Recovery:** Report current phase and next valid target

3. **Error:** Prerequisite file missing but gate expected to pass
   - **Cause:** Production or research step completed without writing to expected location
   - **Resolution:** List exact expected file paths
   - **Recovery:** Return to appropriate agent to produce missing files

4. **Error:** mecanismo-unico.yaml state inconsistency
   - **Cause:** Mecanismo state out of sync with helix-state.yaml
   - **Resolution:** Reconcile states — mecanismo-unico.yaml is source of truth for mechanism state
   - **Recovery:** Update helix-state.yaml to reflect mecanismo state

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 2-5 min
cost_estimated: $0.005-0.015 (sonnet model)
token_usage: ~3,000-10,000 tokens
```

**Optimization Notes:**
- Gate checks are fast — mostly file existence and YAML reads
- Cache helix-state.yaml read for multiple checks in same session
- validate_gate MCP call is the slowest step

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies: []
tags:
  - gate
  - enforcement
  - pipeline
  - sentinel
updated_at: 2026-03-06
```

---

## Handoff
next_agent: varies
next_command: "Depends on target phase"
condition: Gate PASS
alternatives:
  - phase: briefing, next: atlas, command: "*helix {offer}"
  - phase: production, next: echo|forge|scout|blade, command: "*produce {offer}"
  - phase: review, next: hawk, command: "*review blind-critic {offer}"
  - phase: delivery, next: ops, command: "*sync {offer}"
  - verdict: FAIL, next: previous_phase_agent, command: "Complete missing prerequisites"
