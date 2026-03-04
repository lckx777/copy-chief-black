---
description: "Overnight autonomous production loop for multi-deliverable copy generation"
allowed-tools: ["Bash", "Read", "Write", "Agent"]
---

# /overnight — Overnight Production Loop

Triggers and manages the autonomous overnight production engine (S30). Runs all
configured deliverables (VSL, LP, Creatives, Emails) sequentially with automatic
halt criteria, state persistence, and morning report generation.

## Subcommands

| Subcommand | Action |
|------------|--------|
| `/overnight start <offer>` | Start overnight loop for an offer |
| `/overnight status [offer]` | Check running or completed loop status |
| `/overnight stop <offer>` | Gracefully stop a running loop |
| `/overnight report <offer>` | Generate or view the morning report |
| `/overnight help` | Show this help |

---

## Usage

### `/overnight start <offer>`

Starts the overnight production loop for the specified offer. Reads configuration
from `~/.claude/config/overnight.yaml` and executes workflow loops for each
configured deliverable in priority order.

**What it does:**
1. Reads overnight config (deliverables, halt criteria, max wall time)
2. Creates state file at `{offer}/production/overnight-state/overnight-state.yaml`
3. Executes `workflow-loops/executor.ts` for each deliverable (in Claude context: dispatches to persona subagents)
4. Evaluates halt criteria after each iteration
5. Generates morning report on completion

**Halt criteria:**
- Score drops 2+ iterations in a row → HALT that deliverable
- 3 consecutive failures below threshold → HALT + flag for Conclave
- `.overnight-stop` sentinel file detected → graceful stop
- Max wall time (default 4h) reached → stop all
- All deliverables passed → DONE

**Examples:**
```bash
bun run scripts/auto-production-loop.ts start --offer florayla
bun run scripts/auto-production-loop.ts start --offer neuvelys --config ~/my-overnight.yaml
```

---

### `/overnight status [offer]`

Displays current state of the overnight loop for an offer.

**Shows:**
- Loop status (running / complete / halted / stopped)
- Per-deliverable status, final scores, iterations used, units passed
- Runtime so far vs maximum wall time
- Any halt reasons

**Example:**
```bash
bun run scripts/auto-production-loop.ts status --offer florayla
```

---

### `/overnight stop <offer>`

Sends a graceful stop signal by creating a `.overnight-stop` sentinel file in the
offer root. The loop halts at the next unit boundary (not mid-production).

**Example:**
```bash
bun run scripts/auto-production-loop.ts stop --offer florayla
```

The sentinel file is automatically removed when the loop exits.

---

### `/overnight report <offer>`

Generates or displays the morning report for the most recent overnight run.
If a report already exists for today, reads it. Otherwise generates from state file.

**Report includes:**
- Summary: deliverables attempted, passed, stuck, halted
- Per deliverable: chapters/blocks produced, final scores, iterations
- Stuck items: which need human attention + Conclave commands
- Recommendations: prioritized next actions
- Time stats: total runtime, per-deliverable timing

**Examples:**
```bash
bun run scripts/morning-report.ts --offer florayla
bun run scripts/morning-report.ts --offer florayla --format json
bun run scripts/morning-report.ts --offer florayla --date 2026-03-01
bun run scripts/morning-report.ts --offer florayla --print
```

---

## Configuration

Edit `~/.claude/config/overnight.yaml` to configure:
- Which deliverables to produce (vsl, lp, creative, email)
- Priority order (lower number = runs first)
- Min score threshold and max iterations per deliverable
- Halt criteria (score drop, failure count, wall time)
- Report output path

Per-loop stop criteria and per-unit overrides are in `~/.claude/config/workflow-loops.yaml`.

---

## State Files

| Path | Purpose |
|------|---------|
| `{offer}/production/overnight-state/overnight-state.yaml` | Loop state, scores, halt reasons |
| `{offer}/.overnight-stop` | Human stop sentinel (created by `stop` command) |
| `{offer}/production/overnight-reports/overnight-<date>.md` | Morning report (Markdown) |
| `{offer}/production/overnight-reports/overnight-<date>.json` | Morning report (JSON) |

---

## Stuck Items and Conclave

When a deliverable is stuck (score does not reach threshold after max iterations),
it is flagged as `conclave_needed` in the state file. The morning report shows
the Conclave command to run:

```bash
bun run scripts/conclave.ts \
  --topic "Stuck Loop: vsl" \
  --members blade,hawk,atlas \
  --offer florayla \
  --context "score_history: 6.5 → 7.0 → 6.8"
```

**IMPORTANT:** Conclave is NOT auto-run. Human decision required before running.

Ref: `~/.claude/rules/conclave.md § S35.7` (Process Correction / Stuck Loop Detection)

---

## Integration

| Component | Role |
|-----------|------|
| `scripts/auto-production-loop.ts` | Main engine (orchestrates all deliverables) |
| `scripts/morning-report.ts` | Report generator (reads state, writes Markdown/JSON) |
| `scripts/workflow-loops/executor.ts` | Loop engine per deliverable (S28.6) |
| `scripts/conclave.ts` | Escalation for stuck deliverables (S35) |
| `~/.claude/config/overnight.yaml` | Overnight configuration |
| `~/.claude/config/workflow-loops.yaml` | Per-loop stop criteria |

---

## Persona Routing

| Deliverable | Producer | Validator |
|-------------|----------|-----------|
| VSL | Echo (@vsl) | Hawk (@critic) |
| Landing Page | Forge (@lp) | Hawk (@critic) |
| Creatives | Scout (@creative) | Hawk (@critic) |
| Emails | Blade (@producer) | Hawk (@critic) |

Ref: `~/.claude/rules/agent-personas.md`

---

*S30 — Overnight Loop v2 | Copy Chief BLACK*
