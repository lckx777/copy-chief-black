---
description: Resume work — loads state for an offer, agent, or previous session
argument-hint: "[offer|agent:name|session] — e.g., florayla, agent:hawk, session"
---

# /resume — Resume Work

**Input:** $ARGUMENTS

Loads state and restores context so work can continue from where it left off.
Supports three modes: **offer** (default), **agent**, and **session**.

## Mode Detection

Parse `$ARGUMENTS` to determine mode:

| Input Pattern | Mode | Example |
|---------------|------|---------|
| `agent:{name}` | Agent | `agent:hawk`, `agent:echo` |
| `session` (no args, or literal "session") | Session | `/resume session`, `/resume` with no offers |
| anything else | Offer | `florayla`, `neuvelys` |
| empty | Auto-detect | Show selection menu with all modes |

## Instructions

### Step 0: Auto-detect Mode (if $ARGUMENTS empty)

Scan all sources and present unified menu:

```bash
# Discover active offers
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null

# Discover agents with memory
ls ~/.claude/agent-memory/ 2>/dev/null

# Check for session memory
ls ~/.claude/memory/episodic/ ~/.claude/memory/gotchas.json ~/.claude/memory/user-decisions.json 2>/dev/null
```

Display:

```
Resume what?

OFFERS:
  1. florayla (saude) — Phase: Production
  2. neuvelys (saude) — Phase: Research PENDING
  3. quimica-amarracao (relacionamento) — Phase: Research

AGENTS (with memory):
  4. agent:forge — 1 episodic entry
  5. agent:hawk — techniques available

SESSION (cross-cutting):
  6. session — Global gotchas, decisions, cross-offer patterns

Enter name or number:
```

Only show agents that have at least one non-empty memory file (episodic.yaml, technique-register.yaml, or execution-log.yaml).

---

## Mode: Offer (default)

### Step 1: Locate the Offer

Search for the offer by name (case-insensitive):

```bash
find ~/copywriting-ecosystem -name "CONTEXT.md" -path "*$ARGUMENTS*" 2>/dev/null | head -5
find ~/copywriting-ecosystem -name "helix-state.yaml" -path "*$ARGUMENTS*" 2>/dev/null
```

If not found:
```
Offer "$ARGUMENTS" not found.
Run /status to see all active offers, or /create-offer to start a new one.
```

### Step 2: Load Core State Files

Read each of these files if they exist:

1. `{offer_path}/project_state.yaml` — Phase tracking and gate statuses
2. `{offer_path}/CONTEXT.md` — Offer context (product, avatar, mechanism)
3. `{offer_path}/helix-state.yaml` — HELIX progress
4. `{offer_path}/mecanismo-unico.yaml` — Mechanism state
5. `{offer_path}/research/synthesis.md` — Research intelligence (if Research gate passed)
6. `{offer_path}/briefings/helix-complete.md` — Full briefing (if Briefing gate passed)

For each file, report whether it was found or is missing.

### Step 3: Load Offer Memory (AIOS Tier)

Read episodic and narrative memory for this offer:

```bash
# Offer-level episodic
cat ~/.claude/memory/episodic/{offer_name}.yaml 2>/dev/null

# Narrative insights
cat ~/.claude/memory/narrative/{offer_name}.yaml 2>/dev/null

# Procedural memory (per-agent-per-offer)
ls ~/.claude/memory/procedural/*{offer_name}* 2>/dev/null

# Fusion cache (production state)
ls ~/.claude/memory/.fusion-cache/*{offer_name}* 2>/dev/null
```

### Step 4: Load Agent Memory Related to Offer

For each agent in `~/.claude/agent-memory/*/`, check episodic.yaml for entries with `offer: "{offer_name}"`:

```
For each agent dir, read episodic.yaml, filter entries where offer matches.
```

### Step 5: Semantic Memory Query

If the semantic memory database exists (`~/.claude/plugins/copywriting-mcp/data/copywriting.db`), use it:

```
Call mcp__copywriting__semantic_memory_search with:
  query: "[offer_name] production lessons patterns"
  offer: "{offer_name}"
  limit: 5
```

This retrieves the top 5 most relevant memories across all sources for this offer.

### Step 6: Display Offer Resume Report

```
RESUMING: [Offer Name] ([niche]/[offer]/)

PHASE: [current phase]
  Research Gate:  [PASSED / BLOCKED / PENDING]  ([confidence]%)
  Briefing Gate:  [PASSED / BLOCKED / NOT_STARTED]  ([X]/10 HELIX phases)
  Mechanism:      [UNDEFINED / DRAFT / PENDING_VALIDATION / VALIDATED / APPROVED]
  Production:     [NOT_STARTED / IN_PROGRESS / COMPLETE]

MECHANISM
  MUP: [mup value or "Not defined"]
  MUS: [mus value or "Not defined"]
  State: [state]

AVATAR
  Profile: [avatar description or "Not defined"]
  DRE: [dominant emotion or "Not identified"]

MEMORY (AIOS)
  Episodic entries: [N] (last: [date])
  Narrative insights: [N]
  Agent learnings: [list agents with entries for this offer]
  Semantic matches: [N results from semantic_memory_search]

  Key learnings:
    - [top 3 episodic learnings, sorted by score]

NEXT ACTION: [recommended action based on current state]
  Recommended command: [/command-name]

FILES LOADED
  [check/cross] CONTEXT.md
  [check/cross] project_state.yaml
  [check/cross] helix-state.yaml
  [check/cross] mecanismo-unico.yaml
  [check/cross] research/synthesis.md
  [check/cross] episodic memory (AIOS)
  [check/cross] narrative memory (AIOS)
```

### Step 7: Offer Decision Table

| Condition | Next Action | Command |
|-----------|-------------|---------|
| Research gate = PENDING (no data) | Start research | `/audience-research-agent` |
| Research gate = BLOCKED (missing deliverables) | Fix research gaps | `/validate` then check missing files |
| Research gate = PASSED, Briefing NOT_STARTED | Start HELIX briefing | `/helix-system-agent` |
| Briefing IN_PROGRESS (< 10 phases) | Continue HELIX | `/helix-system-agent` |
| Briefing done, Mechanism NOT VALIDATED | Validate mechanism | `/helix-system-agent` (Fases 5-6) |
| All gates PASSED, Production NOT_STARTED | Start production | `/produce-offer [name]` |
| Production IN_PROGRESS | Continue production | `/production-agent` |
| Production COMPLETE, no review | Run review | `/review-all [name]` |
| Blocked human gate | Present gate details | Display gate requirements |

### Step 8: Offer to Start

Ask: `Continue with [recommended action]? (y/n)`

If yes, invoke the appropriate command.
If no: "Session context loaded. What would you like to work on?"

---

## Mode: Agent (`agent:{name}`)

Parse agent name from `$ARGUMENTS` (strip `agent:` prefix).

### Step 1: Validate Agent

Check if agent exists:
```bash
ls ~/.claude/agents/{name}.md 2>/dev/null
ls ~/.claude/agent-memory/{name}/ 2>/dev/null
```

Valid agents: atlas, blade, cipher, echo, forge, hawk, scout, sentinel, vox.

If not found: `Agent "{name}" not found. Valid agents: atlas, blade, cipher, echo, forge, hawk, scout, sentinel, vox`

### Step 2: Load Agent Memory

Read all three memory files:

1. `~/.claude/agent-memory/{name}/episodic.yaml` — Task learnings
2. `~/.claude/agent-memory/{name}/execution-log.yaml` — Run history
3. `~/.claude/agent-memory/{name}/technique-register.yaml` — Proven patterns

### Step 3: Load Cross-Offer Agent Data

Scan offer-level episodic for this agent's entries:

```bash
# All offer episodics that mention this agent
grep -l "{name}" ~/.claude/memory/episodic/*.yaml 2>/dev/null
```

Also check procedural and fusion cache:
```bash
ls ~/.claude/memory/procedural/{name}-* 2>/dev/null
ls ~/.claude/memory/.fusion-cache/{name}-* 2>/dev/null
```

### Step 4: Semantic Memory Query

```
Call mcp__copywriting__semantic_memory_search with:
  query: "{name} agent techniques learnings patterns"
  agent_id: "{name}"
  limit: 10
```

### Step 5: Display Agent Resume Report

```
RESUMING: Agent @{name}

ROLE: [from agent persona file frontmatter]

MEMORY STATUS
  Episodic: [N] entries (last: [date])
  Execution log: [N] entries (last: [date])
  Techniques: [N] registered

OFFERS WORKED ON: [list of unique offers from episodic entries]

TOP TECHNIQUES
  1. [technique name] — score: [X] — hits: [N]
  2. [technique name] — score: [X] — hits: [N]
  ...

RECENT LEARNINGS (last 5)
  - [date] [offer]: [learning summary]
  - [date] [offer]: [learning summary]
  ...

RECENT RUNS (last 5)
  - [timestamp] [offer] → [result]
  ...

SEMANTIC MATCHES
  [Top 5 results from semantic_memory_search, if available]

CROSS-OFFER PATTERNS
  [Any episodic entries that appear across multiple offers for this agent]
```

### Step 6: Agent Next Action

| Agent Type | Suggestion |
|------------|------------|
| Production (echo, forge, scout, blade) | "Ready to produce. Use /production-agent or /produce-offer [offer]" |
| Research (vox, cipher) | "Ready to research. Use /audience-research-agent or /helix-parallel" |
| Briefing (atlas) | "Ready to brief. Use /helix-system-agent" |
| Validation (hawk) | "Ready to validate. Use /validate or /review-all [offer]" |

---

## Mode: Session (`session`)

Loads global cross-cutting state — not tied to any specific offer or agent.

### Step 1: Load Global Memory

Read all global memory sources:

1. `~/.claude/memory/gotchas.json` — Known pitfalls
2. `~/.claude/memory/user-decisions.json` — User preferences/decisions
3. `~/.claude/memory/error-tracking.json` — Error history
4. `~/.claude/memory/episodic/_index.yaml` — Cross-offer index

### Step 2: Scan All Agents for Activity

For each agent in `~/.claude/agent-memory/*/`:
- Count episodic entries, execution-log entries, techniques
- Find most recent timestamp

### Step 3: Scan All Offers for State

```bash
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null
```

For each: read phase and gate status (summary only).

### Step 4: Semantic Memory — Cross-Offer Intelligence

```
Call mcp__copywriting__semantic_memory_search with:
  query: "cross-offer patterns techniques that work"
  limit: 10
```

### Step 5: Display Session Resume Report

```
RESUMING: Session (full system state)

ECOSYSTEM STATUS
  Active offers: [N]
  [offer1] ([niche]) — Phase: [phase]
  [offer2] ([niche]) — Phase: [phase]
  ...

GLOBAL MEMORY
  Gotchas: [N] active ([N] resolved)
  User decisions: [N] recorded
  Errors tracked: [N]

AGENT ACTIVITY (sorted by recency)
  @forge — [N] episodic, [N] techniques — last active: [date]
  @hawk — [N] episodic, [N] techniques — last active: [date]
  ...

TOP GOTCHAS (active)
  1. [title] — [resolution or "unresolved"]
  2. [title] — [resolution or "unresolved"]

USER DECISIONS
  - [decision text] ([date])
  ...

CROSS-OFFER INSIGHTS (from semantic memory)
  [Top results that span multiple offers]

NEXT ACTION: [highest-priority action across all offers]
  Recommended: /next-action or /resume [specific-offer]
```

---

## State Indicators

| Symbol | Meaning |
|--------|---------|
| [check] | Passed / Complete |
| [cross] | Missing / Failed |
| [empty] | Not started |
| [arrow] | In progress |
| [warn] | Needs attention |

## Files Loaded into Context

### Offer Mode

| File | Always | If Research Done | If Briefing Done |
|------|--------|-----------------|-----------------|
| `CONTEXT.md` | yes | yes | yes |
| `project_state.yaml` | yes | yes | yes |
| `helix-state.yaml` | yes | yes | yes |
| `mecanismo-unico.yaml` | yes | yes | yes |
| `research/synthesis.md` | — | yes | yes |
| `briefings/helix-complete.md` | — | — | yes |
| Episodic memory (AIOS) | yes | yes | yes |
| Narrative memory (AIOS) | — | yes | yes |

### Agent Mode

| File | Loaded |
|------|--------|
| `~/.claude/agents/{name}.md` | Always (persona) |
| `agent-memory/{name}/episodic.yaml` | If exists |
| `agent-memory/{name}/execution-log.yaml` | If exists |
| `agent-memory/{name}/technique-register.yaml` | If exists |
| Semantic memory results | If DB exists |

### Session Mode

| File | Loaded |
|------|--------|
| `memory/gotchas.json` | If exists |
| `memory/user-decisions.json` | If exists |
| `memory/error-tracking.json` | If exists |
| `memory/episodic/_index.yaml` | If exists |
| All helix-state.yaml (summary) | Always |
| Semantic memory results | If DB exists |

## Related

- `/status` — System-wide dashboard for all offers
- `/production-brief` — Per-offer health report
- `/next-action` — Highest-priority action across all offers
- `/create-offer` — Start a new offer from scratch
- `semantic_memory_search` — MCP tool for deep cross-memory queries

---

*Expanded: v2.0 — Offer + Agent + Session modes with AIOS memory integration*
