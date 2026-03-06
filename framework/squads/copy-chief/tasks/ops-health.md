---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Run all health checks, output report, no interaction
- Auto-fix trivial issues (missing directories, stale timestamps)
- **Best for:** Scheduled health checks, CI-like validation

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Report each issue category and suggest fixes
- Confirm before auto-fixing anything
- **Best for:** First health audit, investigating specific issues

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Full audit plan before any checks
- Map all expected files per offer per phase
- **Best for:** Ecosystem-wide audit, onboarding new offers

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: opsHealth()
responsavel: Ops (@ops)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: scope
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [offer:{niche}/{offer}, all]

- campo: fix
  tipo: boolean
  origem: User Input
  obrigatorio: false
  validacao: Default false. If true, auto-fix trivial issues.

- campo: verbose
  tipo: boolean
  origem: User Input
  obrigatorio: false
  validacao: Default false. If true, include file-level details.

**Saida:**
- campo: health_report
  tipo: object
  destino: Return value (YAML summary)
  persistido: false

- campo: doc_rot_report
  tipo: file
  destino: "{offer}/doc-rot-report.yaml"
  persistido: true

- campo: issues_fixed
  tipo: integer
  destino: Return value
  persistido: false
```

---

## Pre-Conditions

**Purpose:** Validate prerequisites BEFORE task execution (blocking)

**Checklist:**

```yaml
pre-conditions:
  - [ ] Target offer directory or ecosystem root exists
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify {offer}/ directory exists (single offer) or ecosystem root exists (all)
    error_message: "Offer directory not found."

  - [ ] Agent is @ops (exclusive infrastructure authority)
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify active agent is @ops
    error_message: "Health checks should be run by @ops."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] Health report generated with all check categories
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains: structure, state, gates, doc-rot, orphans sections
    error_message: "Health report incomplete."

  - [ ] doc-rot-report.yaml written per offer in scope
    tipo: post-condition
    blocker: true
    validacao: |
      File exists at {offer}/doc-rot-report.yaml for each offer checked
    error_message: "Doc-rot report not written."

  - [ ] If fix=true: trivial issues resolved and logged
    tipo: post-condition
    blocker: false
    validacao: |
      Fixed issues logged in report with before/after state
    error_message: "Warning: Auto-fix requested but no fixes applied."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Directory structure validated against expected layout
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Each offer has: CONTEXT.md, helix-state.yaml, mecanismo-unico.yaml at minimum
    error_message: "Offer directory structure incomplete."

  - [ ] Gate consistency verified (no impossible states)
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No offer has production gate PASSED without briefing gate PASSED
    error_message: "Gate state inconsistency detected."

  - [ ] Orphaned files identified (files with no state reference)
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      Files in production/ without corresponding review or state entry flagged
    error_message: "Orphaned files detected."

  - [ ] Doc-rot detection completed (stale documentation)
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      CONTEXT.md, README, and other docs checked for staleness
    error_message: "Doc-rot detection not completed."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** doc-rot-scanner
  - **Purpose:** Detect stale documentation files
  - **Source:** copy-chief/health/doc-rot-scanner module

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven health checks via file reads)

---

## Purpose

Validate the structural and state health of the copywriting ecosystem. Detect broken structures, stale files, gate inconsistencies, and orphaned content. Produces a doc-rot report per offer and an overall health summary. Optionally auto-fixes trivial issues (missing directories, stale timestamps).

## Prerequisites

- @ops agent must be active
- Access to offer directory structure
- Access to helix-state.yaml and mecanismo-unico.yaml files

## Steps

### Step 1: Inventory Offers

1. If scope is `all`: scan ecosystem root for all `{niche}/{offer}/` directories
2. If scope is `offer:{niche}/{offer}`: validate single offer
3. Build list of offers to check

### Step 2: Directory Structure Validation

For each offer, verify expected structure exists:

```
{niche}/{offer}/
  CONTEXT.md                    # REQUIRED — offer context
  helix-state.yaml              # REQUIRED — pipeline state
  mecanismo-unico.yaml          # REQUIRED — mechanism definition
  project_state.yaml            # RECOMMENDED — project metadata
  research/                     # Expected after research phase
    avatar-profile.md
    synthesis.md
    competitors/
  briefings/                    # Expected after briefing phase
    helix-complete.md
    phases/
  production/                   # Expected after production phase
    vsl/
    landing-page/
    creatives/
    emails/
  reviews/                      # Expected after review phase
    blind-critic-*.md
    full-validation-*.md
  swipes/                       # Reference material
  doc-rot-report.yaml           # Health check output
```

Flag missing REQUIRED files as errors. Flag missing RECOMMENDED files as warnings.

### Step 3: State Consistency Check

For each offer:
1. Read `helix-state.yaml`
2. Verify gate progression is consistent:
   - If `briefing_gate: PASSED` then `research_gate: PASSED` must be true
   - If `production_gate: PASSED` then `briefing_gate: PASSED` must be true
   - If `review_gate: PASSED` then `production_gate: PASSED` must be true
3. Verify current_phase matches latest passed gate
4. Cross-check mecanismo-unico.yaml state with helix-state.yaml

### Step 4: Orphaned File Detection

1. Scan `production/` for files not referenced in any review
2. Scan `reviews/` for reviews of non-existent deliverables
3. Scan `briefings/` for phase files beyond what helix-state records
4. Scan `research/` for data files not referenced in synthesis

### Step 5: Doc-Rot Detection

For each documentation file:
1. Check last modified date vs. related content files
2. If CONTEXT.md is older than production files: flag as stale
3. If mecanismo-unico.yaml has not been updated since production started: flag
4. Check for broken internal references (files referenced but not existing)
5. Write `{offer}/doc-rot-report.yaml`:

```yaml
doc_rot_report:
  offer: "{niche}/{offer}"
  scan_date: "{ISO-8601}"
  stale_files:
    - file: "CONTEXT.md"
      last_modified: "{date}"
      stale_reason: "Older than production files"
      severity: warning
  broken_references:
    - source: "briefings/helix-complete.md"
      references: "research/avatar-profile.md"
      status: missing
      severity: error
  orphaned_files:
    - file: "production/emails/draft-v1.md"
      reason: "No review or state reference"
      severity: warning
  overall_health: "HEALTHY|DEGRADED|CRITICAL"
```

### Step 6: Auto-Fix (Optional)

If `fix=true`, automatically resolve trivial issues:
- Create missing directories (empty structure)
- Update stale timestamps in state files
- Remove obvious temp/scratch files
- DO NOT delete any content files
- DO NOT modify gate statuses
- Log all fixes applied

### Step 7: Generate Health Summary

Return comprehensive health report:

```yaml
health_report:
  scope: "{scope}"
  timestamp: "{ISO-8601}"
  offers_checked: {count}
  overall_health: "HEALTHY|DEGRADED|CRITICAL"
  summary:
    errors: {count}
    warnings: {count}
    info: {count}
  per_offer:
    - offer: "{niche}/{offer}"
      health: "HEALTHY|DEGRADED|CRITICAL"
      current_phase: "{phase}"
      structure_ok: true|false
      gates_consistent: true|false
      orphaned_files: {count}
      doc_rot_items: {count}
  fixes_applied: {count} (if fix=true)
```

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| Directory structure | File existence | REQUIRED files present | Yes |
| Gate consistency | YAML read | No impossible states | Yes |
| Doc-rot report written | File existence | Per offer | Yes |
| Orphan detection | Directory scan | Scan complete | No |

---

## Error Handling

**Strategy:** continue (report all issues, do not abort on first)

**Common Errors:**

1. **Error:** helix-state.yaml corrupted
   - **Cause:** Manual edit or failed write
   - **Resolution:** Attempt YAML parse, report parse errors
   - **Recovery:** If fix=true, regenerate from directory state; else report

2. **Error:** Offer directory missing CONTEXT.md
   - **Cause:** Offer not properly initialized
   - **Resolution:** Flag as CRITICAL — offer needs initialization
   - **Recovery:** If fix=true, create minimal CONTEXT.md template

3. **Error:** Gate inconsistency (e.g., production PASSED without briefing)
   - **Cause:** Manual state manipulation or hook failure
   - **Resolution:** Report inconsistency with exact state values
   - **Recovery:** Do NOT auto-fix gate states. Report to @chief for manual resolution.

4. **Error:** Permission denied on file operations
   - **Cause:** File ownership or permission issues
   - **Resolution:** Log error, continue with other checks
   - **Recovery:** Report affected files for manual permission fix

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 3-15 min (depends on scope)
cost_estimated: $0.01-0.04 (sonnet model)
token_usage: ~5,000-20,000 tokens
offers_per_minute: ~4-6 (single offer ~3 min, ecosystem ~15 min for 10 offers)
```

**Optimization Notes:**
- Batch file existence checks per offer (reduce I/O)
- Skip orphan detection in YOLO mode for speed
- Cache YAML reads within same offer

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies: []
tags:
  - ops
  - health
  - doc-rot
  - infrastructure
  - maintenance
updated_at: 2026-03-06
```

---

## Handoff
next_agent: ops
next_command: "*sync {scope}"
condition: Health check complete, fixes applied (if any)
alternatives:
  - agent: chief, command: "*escalate health-critical {offer}", condition: CRITICAL health status detected
  - agent: sentinel, command: "*gate-check {phase} {offer}", condition: Gate inconsistency needs resolution
