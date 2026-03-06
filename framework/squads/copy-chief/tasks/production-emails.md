---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Autonomous decision making with logging
- Produces all sequences without checkpoints
- **Best for:** Single-sequence production, familiar avatar/offer

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Checkpoint after each sequence type
- DRE validation at each stage
- **Best for:** New offers, complex funnels, multi-sequence production

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Full sequence architecture mapped before writing
- Subject line bank generated and scored first
- **Best for:** Launch sequences, high-ticket offers

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: productionEmails()
responsavel: Blade (@producer)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: offer_path
  tipo: string
  origem: Offer context
  obrigatorio: true
  validacao: Must be valid {niche}/{offer}/ directory with CONTEXT.md

- campo: sequence_type
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [follow-up, abandoned-cart, nurture, launch, reengagement, flash-sale]

- campo: helix_briefing
  tipo: file
  origem: "{offer}/briefings/helix-complete.md"
  obrigatorio: true
  validacao: Briefing gate must be PASSED

- campo: mecanismo
  tipo: file
  origem: "{offer}/mecanismo-unico.yaml"
  obrigatorio: true
  validacao: Mecanismo state must be APPROVED or VALIDATED

- campo: avatar_profile
  tipo: file
  origem: "{offer}/research/avatar-profile.md"
  obrigatorio: true
  validacao: Must contain DRE, awareness level, language patterns

- campo: num_emails
  tipo: integer
  origem: User Input
  obrigatorio: false
  validacao: Default per type (follow-up=7, abandoned-cart=5, nurture=10, launch=12)

**Saida:**
- campo: email_sequence_files
  tipo: directory
  destino: "{offer}/production/emails/{sequence_type}/"
  persistido: true

- campo: subject_line_bank
  tipo: file
  destino: "{offer}/production/emails/{sequence_type}/subject-lines.md"
  persistido: true

- campo: sequence_map
  tipo: file
  destino: "{offer}/production/emails/{sequence_type}/sequence-map.yaml"
  persistido: true

- campo: validation_summary
  tipo: object
  destino: Return value
  persistido: false
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Briefing gate PASSED for this offer
    tipo: pre-condition
    blocker: true
    validacao: |
      Read helix-state.yaml and verify briefing_gate.status == "PASSED"
    error_message: "Briefing gate not passed. Run gate-check first."

  - [ ] Mecanismo Unico is APPROVED or VALIDATED
    tipo: pre-condition
    blocker: true
    validacao: |
      Read mecanismo-unico.yaml and verify state in [APPROVED, VALIDATED]
    error_message: "Mecanismo not validated. Run validate-mecanismo first."

  - [ ] HELIX briefing complete (all 10 phases)
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/briefings/helix-complete.md exists and all phases present
    error_message: "HELIX briefing incomplete. Complete all 10 phases first."

  - [ ] Avatar profile with DRE and VOC language patterns exists
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/research/avatar-profile.md exists with DRE section
    error_message: "Avatar profile missing. Run audience research first."

  - [ ] craft/ data accessible for copy patterns
    tipo: pre-condition
    blocker: false
    validacao: |
      Verify squads/copy-chief/data/craft/ directory exists
    error_message: "Warning: craft/ data not found. Proceeding without pattern library."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] All emails written to {offer}/production/emails/{sequence_type}/
    tipo: post-condition
    blocker: true
    validacao: |
      Directory exists and contains email-{N}.md files matching num_emails
    error_message: "Email files not found in production directory."

  - [ ] Subject line bank generated with 3+ alternatives per email
    tipo: post-condition
    blocker: true
    validacao: |
      subject-lines.md exists with at least 3 subject line options per email
    error_message: "Subject line bank incomplete."

  - [ ] Sequence map YAML with timing and DRE progression
    tipo: post-condition
    blocker: true
    validacao: |
      sequence-map.yaml exists with send_timing and dre_arc per email
    error_message: "Sequence map missing or incomplete."

  - [ ] blind_critic score >= 8 per email
    tipo: post-condition
    blocker: true
    validacao: |
      Each email file contains blind_critic validation score >= 8
    error_message: "One or more emails failed blind_critic (score < 8)."

  - [ ] emotional_stress_test >= 8 on full sequence
    tipo: post-condition
    blocker: true
    validacao: |
      Run emotional_stress_test on concatenated sequence, score >= 8
    error_message: "Sequence failed emotional_stress_test."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Every subject line activates DRE (not clever, not generic)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Subject lines contain specific emotional triggers aligned with avatar DRE
    error_message: "Subject lines lack DRE activation."

  - [ ] Email body escalates emotion and drives to single CTA
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Each email has clear emotional arc and single call-to-action
    error_message: "Emails lack emotional escalation or have multiple CTAs."

  - [ ] VOC language patterns used (not marketer language)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Copy uses avatar's own words from VOC research, not copywriter jargon
    error_message: "Copy uses marketer language instead of VOC patterns."

  - [ ] Sequence has coherent DRE arc across all emails
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      DRE intensity follows planned arc in sequence-map.yaml
    error_message: "DRE arc inconsistent across sequence."

  - [ ] black_validation >= 8 on complete sequence
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Final black_validation score >= 8
    error_message: "Sequence failed black_validation."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** blind_critic
  - **Purpose:** Score each email independently on 9 dimensions
  - **Source:** MCP tool (post-production gate)

- **Tool:** emotional_stress_test
  - **Purpose:** Validate DRE consistency and genericidade across sequence
  - **Source:** MCP tool (post-production gate)

- **Tool:** black_validation
  - **Purpose:** Final validation gate for delivery readiness
  - **Source:** MCP tool (final delivery gate)

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven production, no automation scripts)

---

## Purpose

Produce email sequences that extend the VSL/LP narrative into follow-up touchpoints. Each email is a standalone persuasion unit that activates DRE in the subject line, escalates emotion in the body, and drives to a single CTA. The sequence as a whole follows a planned DRE arc that mirrors the buyer's emotional journey.

## Prerequisites

- Read `squads/copy-chief/data/craft/` for copy patterns and psychology
- Read `{offer}/briefings/helix-complete.md` for full HELIX context
- Read `{offer}/mecanismo-unico.yaml` for mechanism language
- Read `{offer}/research/avatar-profile.md` for DRE and VOC patterns
- If VSL exists: Read `{offer}/production/vsl/` for narrative continuity

## Steps

### Step 0: Pre-Flight — Read Craft Data

Read all files in `squads/copy-chief/data/craft/`:
- `psicologia.md` — psychological triggers and escalation patterns
- `escrita.md` — writing principles for direct response
- `checklist.md` — production quality checklist
- `erros-comuns.md` — common anti-patterns to avoid

### Step 1: Sequence Architecture

1. Define sequence type and email count
2. Map DRE arc across the sequence (entry DRE -> peak -> resolution)
3. Define send timing (delays between emails)
4. For each email, plan: DRE trigger, emotional entry/exit, CTA angle
5. Write `sequence-map.yaml`

### Step 2: Subject Line Bank

1. Generate 5+ subject lines per email
2. Each subject line MUST activate DRE (fear, shame, frustration, curiosity)
3. Score each on: specificity, DRE activation, open-rate prediction
4. Select top 3 per email, write to `subject-lines.md`
5. NO clever wordplay. NO puns. DRE-loaded or rejected.

### Step 3: Email Production

For each email in sequence:
1. Open with DRE hook (first 2 lines decide open-to-read)
2. Build emotional scene using VOC language
3. Connect to mechanism (MUP/MUS) naturally
4. Escalate to CTA — single, clear, urgent
5. Write to `{offer}/production/emails/{sequence_type}/email-{N}.md`

### Step 4: Validation Loop

1. Run `blind_critic` on each email individually (score >= 8 required)
2. Fix any email scoring < 8 before proceeding
3. Run `emotional_stress_test` on full concatenated sequence (score >= 8)
4. Run `black_validation` on complete deliverable

### Step 5: Delivery

1. Verify all files written to production directory
2. Update sequence-map.yaml with validation scores
3. Return YAML summary with file paths and scores

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| Per-email quality | blind_critic | >= 8 | Yes |
| DRE in subject lines | Manual check | DRE present | Yes |
| Sequence coherence | emotional_stress_test | >= 8 | Yes |
| Final gate | black_validation | >= 8 | Yes |

---

## Error Handling

**Strategy:** retry

**Common Errors:**

1. **Error:** blind_critic score < 8 on individual email
   - **Cause:** Weak DRE, generic language, unclear CTA
   - **Resolution:** Rewrite specific sections flagged by critic
   - **Recovery:** Max 3 rewrites per email before escalating to @chief

2. **Error:** emotional_stress_test fails on sequence
   - **Cause:** DRE arc inconsistent, genericidade detected
   - **Resolution:** Remap DRE arc, replace generic sections with VOC language
   - **Recovery:** Restructure sequence map and rewrite affected emails

3. **Error:** Briefing gate not PASSED
   - **Cause:** Prerequisite phase incomplete
   - **Resolution:** Cannot proceed — return to briefing pipeline
   - **Recovery:** Notify @chief, queue for briefing completion

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 30-60 min per sequence
cost_estimated: $0.05-0.15 (sonnet model)
token_usage: ~30,000-80,000 tokens
emails_per_sequence: 5-12 depending on type
```

**Optimization Notes:**
- Produce subject line bank in batch before email bodies
- Validate in batches of 3 emails to catch pattern issues early
- Reuse VSL narrative hooks where applicable

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies:
  - briefing-helix-phase
  - briefing-mecanismo
  - research-voc
tags:
  - production
  - emails
  - direct-response
  - blade
updated_at: 2026-03-06
```

---

## Handoff
next_agent: hawk
next_command: "*review blind-critic {offer}/production/emails/"
condition: All emails produced and self-validated
alternatives:
  - agent: sentinel, command: "*gate-check production {offer}", condition: All production deliverables complete
