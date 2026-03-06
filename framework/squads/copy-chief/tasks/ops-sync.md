---

## Execution Modes

**Choose your execution mode:**

### 1. YOLO Mode - Fast, Autonomous (0-1 prompts)
- Auto-commit, auto-sync, minimal output
- No confirmation before git operations
- **Best for:** Routine end-of-session sync, single-offer updates

### 2. Interactive Mode - Balanced, Educational (5-10 prompts) **[DEFAULT]**
- Show diff summary before commit
- Confirm sync scope before executing
- **Best for:** Multi-offer sync, first sync after major production

### 3. Pre-Flight Planning - Comprehensive Upfront Planning
- Audit all changes across ecosystem before any git operations
- Plan commit strategy (atomic vs. batch)
- **Best for:** Major milestones, cross-offer sync, pre-delivery

**Parameter:** `mode` (optional, default: `interactive`)

---

## Task Definition (AIOX Task Format V1.0)

```yaml
task: opsSync()
responsavel: Ops (@ops)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: scope
  tipo: string
  origem: User Input
  obrigatorio: true
  validacao: One of [offer:{niche}/{offer}, ecosystem, branch:{name}]

- campo: commit_message
  tipo: string
  origem: User Input
  obrigatorio: false
  validacao: Conventional commit format. Auto-generated if not provided.

- campo: push
  tipo: boolean
  origem: User Input
  obrigatorio: false
  validacao: Default false. EXCLUSIVE to @ops.

**Saida:**
- campo: sync_report
  tipo: object
  destino: Return value (YAML summary)
  persistido: false

- campo: state_files_updated
  tipo: array
  destino: Various state files across offers
  persistido: true

- campo: commit_hash
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
  - [ ] Git repository is clean or changes are trackable
    tipo: pre-condition
    blocker: false
    validacao: |
      Run git status, identify all modified/untracked files
    error_message: "Warning: Untracked files detected. Review before sync."

  - [ ] Agent is @ops (exclusive git push authority)
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify active agent is @ops for any push operations
    error_message: "Only @ops can execute git push. Delegate to @ops."

  - [ ] No conflicting branches or merge issues
    tipo: pre-condition
    blocker: true
    validacao: |
      Verify current branch has no unresolved merge conflicts
    error_message: "Merge conflicts detected. Resolve before sync."
```

---

## Post-Conditions

**Purpose:** Validate execution success AFTER task completes

**Checklist:**

```yaml
post-conditions:
  - [ ] All targeted files committed (if changes exist)
    tipo: post-condition
    blocker: true
    validacao: |
      git status shows no uncommitted changes for scoped files
    error_message: "Not all changes committed."

  - [ ] State files consistent across offers (if ecosystem scope)
    tipo: post-condition
    blocker: false
    validacao: |
      helix-state.yaml files reflect actual directory state
    error_message: "Warning: State file inconsistency detected."

  - [ ] Sync report returned with file list and commit hash
    tipo: post-condition
    blocker: true
    validacao: |
      Report contains: files_changed, commit_hash, branch, scope
    error_message: "Sync report incomplete."
```

---

## Acceptance Criteria

**Purpose:** Definitive pass/fail criteria for task completion

**Checklist:**

```yaml
acceptance-criteria:
  - [ ] Changes committed with conventional commit message
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      Commit message follows format: type(scope): description
    error_message: "Commit message does not follow conventional format."

  - [ ] No destructive operations without explicit confirmation
    tipo: acceptance-criterion
    blocker: true
    validacao: |
      No force push, no reset --hard, no destructive git operations without @ops confirmation
    error_message: "Destructive git operation attempted."

  - [ ] Dual-repo awareness (ecosystem + ~/.claude)
    tipo: acceptance-criterion
    blocker: false
    validacao: |
      If changes span both repos, both are synced
    error_message: "Warning: Changes in ~/.claude not synced."
```

---

## Tools

**External/shared resources used by this task:**

- **Tool:** git (via Bash)
  - **Purpose:** Version control operations (add, commit, status, push, branch)
  - **Source:** System git

---

## Scripts

**Agent-specific code for this task:**

- **Script:** N/A (agent-driven git operations via Bash)

---

## Purpose

Synchronize the copywriting ecosystem state: commit changes, update state files, and optionally push to remote. Ops is the ONLY agent authorized for git push and destructive git operations. This task handles both single-offer sync (scoped) and full ecosystem sync (all offers).

## Prerequisites

- @ops agent must be active (exclusive authority for push operations)
- Git repository in valid state (no unresolved conflicts)
- Understanding of dual-repo structure: `~/copywriting-ecosystem/` + `~/.claude/`

## Steps

### Step 1: Assess Scope

1. Determine sync scope from input:
   - `offer:{niche}/{offer}` — sync only files within that offer directory
   - `ecosystem` — sync all offers and shared files
   - `branch:{name}` — sync specific branch
2. Run `git status` to inventory all changes
3. Categorize changes: production files, state files, config files, other

### Step 2: State File Reconciliation

For each offer in scope:
1. Read `helix-state.yaml` — verify it reflects actual directory state
2. Read `project_state.yaml` — verify project metadata is current
3. Read `doc-rot-report.yaml` — check for stale documentation flags
4. If any state file is stale, update it before committing

### Step 3: Prepare Commit

1. Stage files based on scope:
   - Single offer: `git add {niche}/{offer}/`
   - Ecosystem: `git add .` (with careful review)
2. Generate or use provided commit message:
   - Auto-format: `chore({offer}): Auto-sync on session end`
   - Or: `feat({offer}): {description}` for meaningful changes
3. Review staged changes (Interactive mode: show summary)

### Step 4: Commit

1. Execute `git commit -m "{message}"`
2. Capture commit hash
3. Log: files changed, insertions, deletions

### Step 5: Push (Optional, @ops Exclusive)

1. Only execute if `push=true` AND agent is @ops
2. Execute `git push origin {current_branch}`
3. If dual-repo changes: also sync `~/.claude/` repo
4. Log: push result, remote URL, branch

### Step 6: Cross-Offer State Sync (Ecosystem Scope)

If scope is `ecosystem`:
1. Scan all offer directories for state consistency
2. Verify no orphaned production files (files without corresponding state entries)
3. Verify no stale gate statuses (gate PASSED but prerequisite files deleted)
4. Report any inconsistencies

### Step 7: Return Sync Report

```yaml
sync_report:
  scope: "{scope}"
  branch: "{branch_name}"
  commit_hash: "{hash}"
  timestamp: "{ISO-8601}"
  files_changed:
    production: [list]
    state: [list]
    config: [list]
    other: [list]
  offers_synced: [list of offer paths]
  warnings: [any inconsistencies found]
  push_status: "pushed|skipped|not_requested"
```

## Validation

| Check | Tool | Threshold | Blocking |
|-------|------|-----------|----------|
| Git status clean | git status | No uncommitted in scope | Yes |
| Commit format | Conventional commit regex | Matches pattern | Yes |
| State consistency | File existence checks | All states current | No |
| Push authority | Agent check | @ops only | Yes |

---

## Error Handling

**Strategy:** retry

**Common Errors:**

1. **Error:** Merge conflict on commit
   - **Cause:** Concurrent changes to same files
   - **Resolution:** Resolve conflicts manually, re-stage, re-commit
   - **Recovery:** Show conflict diff, suggest resolution

2. **Error:** Push rejected (remote ahead)
   - **Cause:** Remote has commits not in local
   - **Resolution:** `git pull --rebase` then retry push
   - **Recovery:** Pull, resolve any conflicts, push again

3. **Error:** Non-@ops agent attempting push
   - **Cause:** Authority violation
   - **Resolution:** HARD BLOCK. Only @ops can push.
   - **Recovery:** Commit locally, return to @chief for @ops delegation

4. **Error:** State file YAML parse error
   - **Cause:** Corrupted or malformed state file
   - **Resolution:** Validate YAML syntax, fix or regenerate
   - **Recovery:** Backup corrupted file, regenerate from directory state

---

## Performance

**Expected Metrics:**

```yaml
duration_expected: 2-10 min
cost_estimated: $0.005-0.02 (sonnet model)
token_usage: ~3,000-8,000 tokens
```

**Optimization Notes:**
- Git operations are fast; state reconciliation is the bottleneck for ecosystem scope
- Batch git add for single commits when possible
- Skip state reconciliation in YOLO mode for speed

---

## Metadata

```yaml
story: N/A
version: 1.0.0
dependencies: []
tags:
  - ops
  - git
  - sync
  - infrastructure
updated_at: 2026-03-06
```

---

## Handoff
next_agent: chief
next_command: "Pipeline continues based on current phase"
condition: Sync complete
alternatives:
  - agent: ops, command: "*health {scope}", condition: State inconsistencies detected during sync
