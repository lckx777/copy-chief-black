---
description: Offer health report showing phase, gates, and production readiness for all offers
argument-hint: "[offer-name] — omit for all offers, or specify one (e.g., florayla)"
---

# /production-brief — Offer Health Report

**Input:** $ARGUMENTS

Two modes:
- **No argument** — Dashboard showing all offers with phase and gate status
- **With offer name** — Detailed health report + generate consolidated production brief for that offer

---

## MODE A: All Offers Dashboard (no argument)

When `$ARGUMENTS` is empty, scan all offers and display a summary table.

### Step 1: Discover All Offers

```bash
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null
```

### Step 2: For Each Offer, Read State Files

- `helix-state.yaml` — current phase, gates, HELIX phases completed
- `mecanismo-unico.yaml` — mechanism state
- `project_state.yaml` — last activity, next action

### Step 3: Display Summary Table

```
OFFERS HEALTH REPORT — [date]

| Offer              | Niche       | Phase      | Research | Briefing | Mechanism  | Production    |
|--------------------|-------------|------------|----------|----------|------------|---------------|
| florayla           | saude       | Prod Ready | PASSED   | PASSED   | APPROVED   | NOT_STARTED   |
| neuvelys           | saude       | Research   | PENDING  | —        | UNDEFINED  | —             |
| quimica-amarracao  | relacion.   | Production | PASSED   | PASSED   | VALIDATED  | IN_PROGRESS   |

Active: 3 | Standby: 6

BLOCKED OFFERS:
  ⚠️  neuvelys — Research PENDING (no data collected yet)

READY TO PRODUCE:
  ✓  florayla — All gates passed. Run /produce-offer florayla
```

---

## MODE B: Single Offer Detailed Report (with offer name)

When `$ARGUMENTS` contains an offer name, display detailed report and optionally generate production brief.

### Step 1: Locate the Offer

```bash
find ~/copywriting-ecosystem -name "CONTEXT.md" -path "*$ARGUMENTS*" 2>/dev/null | head -3
```

### Step 2: Read All State Files

Read and display from:
1. `CONTEXT.md` — product type, niche, avatar, mechanism
2. `helix-state.yaml` — all HELIX phase statuses
3. `mecanismo-unico.yaml` — MUP, MUS, Gimmick Name, state
4. `project_state.yaml` — current phase, next action
5. `research/synthesis.md` — confidence level (if exists)

### Step 3: Display Detailed Report

```
OFFER HEALTH: [Offer Name]
Path: [niche]/[offer]/

PHASE: [current phase]

GATES
  Research:    [PASSED / BLOCKED / PENDING]  (confidence: [X]%)
  Briefing:    [PASSED / BLOCKED / NOT_STARTED]  ([X]/10 HELIX phases complete)
  Mechanism:   [UNDEFINED / DRAFT / PENDING_VALIDATION / VALIDATED / APPROVED]
  Production:  [NOT_STARTED / IN_PROGRESS / COMPLETE]

HELIX PHASES (if Briefing started)
  Fase 01 (Avatar)           [✓ / ✗ / ⬜]
  Fase 02 (Consciencia)      [✓ / ✗ / ⬜]
  Fase 03 (Linguagem)        [✓ / ✗ / ⬜]
  Fase 04 (Paradigma)        [✓ / ✗ / ⬜]
  Fase 05 (MUP)              [✓ / ✗ / ⬜]
  Fase 06 (MUS)              [✓ / ✗ / ⬜]
  Fase 07 (Oferta)           [✓ / ✗ / ⬜]
  Fase 08 (One Belief)       [✓ / ✗ / ⬜]
  Fase 09 (Leads/Angulos)    [✓ / ✗ / ⬜]
  Fase 10 (Criativos)        [✓ / ✗ / ⬜]

MECHANISM
  MUP:          [value or "Not defined"]
  MUS:          [value or "Not defined"]
  Gimmick:      [value or "Not defined"]
  State:        [state]

AVATAR
  Profile:      [1-line description or "Not defined"]
  DRE:          [emotion or "Not identified"]
  Awareness:    [level or "Not defined"]

PRODUCTION DELIVERABLES (if Production started)
  VSL:          [NOT_STARTED / DRAFT / IN_REVIEW / APPROVED]
  Landing Page: [NOT_STARTED / DRAFT / IN_REVIEW / APPROVED]
  Criativos:    [NOT_STARTED / X drafts / IN_REVIEW / APPROVED]
  Emails:       [NOT_STARTED / DRAFT / IN_REVIEW / APPROVED]

LAST ACTIVITY: [date from project_state.yaml]
NEXT ACTION:   [recommended action]
```

### Step 4: Option to Generate Production Brief Document

After displaying the report, ask:
```
Generate consolidated production brief document?
This consolidates synthesis.md + helix-complete.md + mecanismo-unico.yaml into one source of truth for @producer. (y/n)
```

If yes:
```bash
bun run ~/.claude/scripts/generate-production-brief.ts <offer_path> --dry-run
```

Show preview, then if confirmed:
```bash
bun run ~/.claude/scripts/generate-production-brief.ts <offer_path>
```

Output saved to: `<offer_path>/briefings/production-brief.md`

---

## Data Sources

| Data | Source File |
|------|-------------|
| Phase tracking | `project_state.yaml` |
| HELIX progress | `helix-state.yaml` |
| Mechanism state | `mecanismo-unico.yaml` |
| Research confidence | `research/synthesis.md` |
| Deliverable counts | Filesystem scan of `production/` |
| Last activity | `project_state.yaml` → `last_updated` |

## Related

- `/resume [offer]` — Load offer context and continue working
- `/status` — Broader system dashboard
- `/next-action` — Highest-priority action across all offers
- `/dag status helix` — Visual HELIX pipeline status
- `/health` — Technical ecosystem health (hooks, MCPs, templates)

---

*Sprint: S39 (Pipeline Commands) — v2.0 (merged with original production-brief)*
*Original: consolidates synthesis + helix-complete + mecanismo into production-brief.md*
*New: all-offers dashboard + detailed per-offer health report*
