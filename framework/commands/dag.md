# /dag — DAG Pipeline Visualization & Validation

> Sprint S40.8 — DAG Pipeline Engine
> Visualize and inspect any pipeline as a Directed Acyclic Graph.
> State persists across sessions alongside each DAG file.

## Usage

```
/dag <subcommand> [options]
```

## Subcommands

### /dag validate <pipeline>

Validate a DAG pipeline for structural integrity.

Checks: no cycles, all edge references valid, gate nodes have thresholds, no orphan nodes.

```
/dag validate helix
/dag validate production
/dag validate research
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --validate
```

---

### /dag status <pipeline>

Show current status of all nodes in a pipeline.

Displays nodes in topological order with status icons:
- ✅ completed
- 🔄 in_progress
- ⬜ pending
- 🔴 blocked (shows which deps are blocking)
- ⏭️ skipped

Also shows: summary counts, critical path.

```
/dag status helix
/dag status production
/dag status research
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --status
```

---

### /dag next <pipeline>

Show next executable nodes — nodes whose all dependencies are satisfied and that are ready to start.

```
/dag next helix
/dag next production
/dag next research
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --next
```

---

### /dag critical-path <pipeline>

Show the critical path through the pipeline — the longest chain of sequential dependencies.

Useful for understanding the minimum time to complete the pipeline and which nodes can't be parallelized.

```
/dag critical-path helix
/dag critical-path production
/dag critical-path research
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --critical-path
```

---

### /dag complete <pipeline> <node-id>

Mark a node as completed and persist the state.

Use this after completing a phase/task to unlock downstream nodes.

```
/dag complete helix research-gate
/dag complete helix fase-01
/dag complete helix fase-02
/dag complete helix mup-gate
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --complete <node-id>
```

---

### /dag reset <pipeline> <node-id>

Reset a node back to pending status. Useful when re-doing a phase.

```
/dag reset helix fase-05
/dag reset helix mup-gate
```

**Implementation:**
```bash
bun run ~/copywriting-ecosystem/scripts/dag-executor.ts ~/.claude/workflows/<pipeline>-dag.yaml --reset <node-id>
```

---

## Pipeline Names

| Name | DAG File | Description |
|------|----------|-------------|
| `helix` | `~/.claude/workflows/helix-dag.yaml` | HELIX 10-phase briefing pipeline |
| `production` | `~/.claude/workflows/production-dag.yaml` | Copy production (VSL, LP, Criativos, Emails) |
| `research` | `~/.claude/workflows/research-dag.yaml` | VOC Squad + competitor + mechanism research |

## Common Node IDs

### HELIX Pipeline
- `research-gate` — entry gate (must be PASSED first)
- `fase-01` through `fase-10` — HELIX phases
- `mup-gate` — MUP validation (after fase-05)
- `mecanismo-gate` — Mecanismo Único validation (after fase-06)
- `briefing-gate` — exit gate

### Research Pipeline
- `context-load` — load niche library + CONTEXT.md
- `voc-squad` — parallel group (5 analysts)
- `voc-youtube`, `voc-instagram`, `voc-tiktok`, `voc-reddit`, `voc-amazon` — individual analysts
- `competitor-spy` — ads library spy
- `mechanism-research` — scientific backing
- `avatar-synthesis` — avatar profile
- `research-synthesis` — consolidated synthesis
- `research-gate` — exit gate

### Production Pipeline
- `production-gate` — entry gate
- `vsl-track`, `lp-track`, `creatives-track`, `emails-track` — parallel tracks
- `vsl-chapter-1` through `vsl-chapter-6` — VSL chapters
- `vsl-black-validation`, `lp-black-validation`, `creatives-black-validation`, `emails-black-validation` — final gates
- `delivery-gate` — exit gate

## State Persistence

Node states are saved alongside each DAG file:
- `~/.claude/workflows/helix-dag.state.json`
- `~/.claude/workflows/production-dag.state.json`
- `~/.claude/workflows/research-dag.state.json`

State persists across sessions. Use `--reset` to undo a `--complete`.

## Integration with Session Start

At the beginning of each session, run `/dag status helix` to see where you are in the pipeline. This replaces manual inspection of `helix-state.yaml` for quick orientation.

## Typical Workflow

```bash
# 1. Check pipeline state at session start
/dag status helix

# 2. See what to do next
/dag next helix

# 3. Complete a phase after finishing it
/dag complete helix fase-01

# 4. Validate DAG structure (when debugging)
/dag validate helix

# 5. See critical path for planning
/dag critical-path helix
```
