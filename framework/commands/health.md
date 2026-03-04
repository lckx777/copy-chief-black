---
description: Quick ecosystem health check — hooks, gates, offers, templates, MCPs
argument-hint: "[--verbose] — show detailed breakdown for each check"
---

# /health — Quick Ecosystem Health Check

**Input:** $ARGUMENTS

Fast diagnostic of ecosystem components. Runs in under 5 seconds and reports the health of all major subsystems.

## Instructions

When this command is invoked:

Parse flags from `$ARGUMENTS`:
- `--verbose` — show detailed breakdown for each check category
- No flags — compact summary output (default)

### Check 1: Hook Health

Scan all hooks registered in `~/.claude/settings.json`:

```bash
# Read hooks from settings.json
cat ~/.claude/settings.json 2>/dev/null | grep -o '"command": "[^"]*"' | sort -u
```

For each hook command found, verify the referenced file exists:
```bash
ls <hook_file_path> 2>/dev/null
```

Report format:
```
HOOKS: [N]/[Total] OK
```

If `--verbose`, list each hook with its status:
```
  ✓ ~/.claude/hooks/validate-gate-prereq.ts
  ✓ ~/.claude/hooks/gate-tracker.ts
  ✗ ~/.claude/hooks/missing-hook.ts  ← FILE NOT FOUND
  ✓ ~/.claude/hooks/phase-gate.ts
```

### Check 2: Gate Status (All Offers)

Discover all offers and read their current gate status:

```bash
find ~/copywriting-ecosystem -name "helix-state.yaml" -type f 2>/dev/null
```

For each `helix-state.yaml` found, read:
- `gates.research`
- `gates.briefing`
- `gates.production`
- `mecanismo_state`
- `current_phase`

Report format:
```
GATES: [summary of active offers]
  florayla   R✓ B✓ M(APPROVED) P⬜
  neuvelys   R⬜ B⬜ M(UNDEFINED) P⬜
  quimica    R✓ B✓ M(VALIDATED) P(IN_PROGRESS)
```

Gate symbols:
- `✓` = PASSED
- `⬜` = NOT_STARTED
- `✗` = BLOCKED
- `🔄` = IN_PROGRESS
- `R` = Research, `B` = Briefing, `M(state)` = Mechanism, `P` = Production

Flag BLOCKED offers:
```
  ⚠️  [offer] — BLOCKED at Research Gate
```

### Check 3: Offer File Completeness

For each active offer (not STANDBY), verify required files exist:

```bash
find ~/copywriting-ecosystem -name "CONTEXT.md" -not -path "*/node_modules/*" 2>/dev/null
```

Required files per offer:
- `CONTEXT.md`
- `helix-state.yaml`
- `mecanismo-unico.yaml`
- `project_state.yaml`

Report format:
```
OFFERS: [N] active, [M] standby, [K] with missing required files
```

If `--verbose`, show per-offer file completeness:
```
  florayla (saude)
    ✓ CONTEXT.md
    ✓ helix-state.yaml
    ✓ mecanismo-unico.yaml
    ✓ project_state.yaml

  neuvelys (saude)
    ✓ CONTEXT.md
    ✓ helix-state.yaml
    ✗ mecanismo-unico.yaml  ← MISSING
    ✓ project_state.yaml
```

### Check 4: Template Health

Scan all templates referenced in rules files and verify they exist:

```bash
find ~/.claude/templates -name "*.md" -type f 2>/dev/null | wc -l
```

Also check if key templates exist:
- `~/.claude/templates/ads-library-spy-template.md`
- `~/.claude/templates/helix-state-template.yaml`
- `~/.claude/templates/mecanismo-unico-template.md`
- `~/.claude/templates/voc-viral-extraction-template.md`
- `~/.claude/templates/trends-analysis-template.md`

Report format:
```
TEMPLATES: [N] found
```

If `--verbose`, show missing templates:
```
  ✓ ads-library-spy-template.md
  ✗ voc-squad-consolidation.md  ← MISSING
```

### Check 5: MCP Connectivity

Attempt lightweight connectivity checks for key MCP tools. Use each tool with a minimal valid call to test if the connection is live.

Test in this order (fail fast — stop after first result per MCP):

```
copywriting MCP:  mcp__copywriting__get_phase_context (phase=1)
zen MCP:          mcp__zen__listmodels
apify MCP:        mcp__apify__search-actors (query="test")
firecrawl MCP:    mcp__firecrawl__firecrawl_scrape (url="https://example.com")
playwright MCP:   mcp__playwright__browser_snapshot
```

For each, mark as:
- `✓` — responded within timeout
- `⚠️` — timeout or partial response
- `✗` — error or not configured

Report format:
```
MCPs: copywriting ✓  zen ✓  apify ✓  firecrawl ⚠️  playwright ✓
```

### Check 6: Rule Health

Verify key rules files exist and are non-empty:

```bash
ls ~/.claude/rules/*.md 2>/dev/null | wc -l
```

Check specifically for:
- `~/.claude/rules/tool-usage-matrix.md`
- `~/.claude/rules/agent-personas.md`
- `~/.claude/rules/mecanismo-unico.md`
- `~/.claude/rules/voc-research.md`
- `~/.claude/rules/anti-homogeneization.md`

Report format:
```
RULES: [N] files OK
```

### Final Output

Display compact summary (default) or verbose report:

**Compact:**
```
ECOSYSTEM HEALTH CHECK

HOOKS:      [N]/[Total] OK
GATES:      florayla (R✓ B✓ M✓ P⬜), neuvelys (R⬜ B⬜ M⬜ P⬜)
OFFERS:     [N] active, [M] standby, [K] issues
TEMPLATES:  [N]/[Expected] OK
MCPs:       copywriting ✓  zen ✓  apify ✓  firecrawl ⚠️  playwright ✓
RULES:      [N] files OK

Status: [HEALTHY | WARNINGS | CRITICAL]
Time:   [X.Xs]
```

**Status determination:**
- `HEALTHY` — All checks pass, no warnings
- `WARNINGS` — Non-critical issues (missing optional files, MCP timeouts)
- `CRITICAL` — Hooks missing, required offer files absent, core rules missing

If any issues found, list them at the bottom:

```
ISSUES FOUND:
  [CRITICAL] Hook file missing: ~/.claude/hooks/validate-gate-prereq.ts
  [WARNING]  MCP firecrawl timeout — scraping tasks may fail
  [WARNING]  neuvelys missing mecanismo-unico.yaml

Run /health --verbose for full details.
```

### Execution Note

Because some checks (especially MCP connectivity) may be slow, run them in parallel where possible. Report approximate total time at the end.

If `interface-audit.ts` is available, use it for the hooks/templates check:
```bash
bun run ~/copywriting-ecosystem/scripts/interface-audit.ts 2>/dev/null
```

## Related

- `/status` — Full system dashboard (slower, more information)
- `/production-brief` — Per-offer production health
- `/validate` — Run quality gate for current phase
- `/dag status <pipeline>` — Pipeline-specific status

---

*Sprint: S39 (Pipeline Commands)*
*Ref: `ceremony-detection.md` — periodic health audits*
*Ref: `tool-usage-matrix.md` — required tools per phase*
*Script (partial): `~/copywriting-ecosystem/scripts/interface-audit.ts`*
