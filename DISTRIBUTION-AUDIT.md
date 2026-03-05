# Distribution Audit — @lucapimenta/copy-chief-black@1.0.0

**Date:** 2026-03-05
**Auditor:** Ops (@ops)
**Package path:** `~/copywriting-ecosystem/packages/copy-chief-black/`

---

## Executive Summary

The npm package **IS published** (`1.0.0`) and contains **1197 files / 3.5MB packed / 11.5MB unpacked**. The core framework is substantially included. However, there are **critical gaps** that will cause a fresh install to fail or be incomplete:

1. `framework/rules/` is missing 10 AIOS-framework rule files (present on live system, absent from package)
2. `agents/ops/` and `agents/strategist/` directories are absent (only `.md` files present, not the AGENT.md/MEMORY.md/SOUL.md subdirectories)
3. Two `.ts` source files missing from `copy-chief/memory/` (minor — compiled `.js` versions are present)
4. `@lucapimenta/copywriting-mcp` (the MCP server) is **NOT published to npm** — referenced by `install-all` but will fail
5. `@lucapimenta/copy-chief-dashboard` is **NOT published to npm** — referenced by `install-all` but will fail
6. The `framework/plugins/` directory is intentionally excluded from `files` field but the installer copies it

---

## Section A: What the npm Package INCLUDES (tarball)

### Installer / CLI Layer (always included)
| Path | Description |
|------|-------------|
| `bin/cli.js` | Main CLI entry point |
| `installer/install.js` | Core install logic |
| `installer/update.js` | Update logic |
| `installer/verify.js` | Verification |
| `installer/doctor.js` | Diagnostics |
| `installer/transpile.js` | TS → JS transpiler |
| `installer/new-offer.js` | Offer scaffolder |
| `lib/platform.js` | Cross-platform helpers |
| `lib/settings-builder.js` | settings.json generator |

### Templates (always included)
| Path | Description |
|------|-------------|
| `templates/settings.json.tpl` | settings.json template (81 hooks wired) |
| `templates/mcp.json.tpl` | MCP config template (8 MCPs) |
| `templates/ecosystem/` | Full ecosystem scaffold (67 files) including .synapse/, .claude/, squads/ |

### Framework (installed to `~/.claude/`)
| Directory | Files in Package | Status |
|-----------|-----------------|--------|
| `framework/.aios-core/` | Full copy-chief engine (59 .ts + compiled .js) | INCLUDED |
| `framework/.aios-core/constitution.md` | Constitutional document | INCLUDED |
| `framework/hooks/` | 156 hook files (.cjs, .js, .ts) | INCLUDED |
| `framework/agents/` | 30 agent files (but see gaps below) | PARTIALLY INCLUDED |
| `framework/skills/` | All 10 skill directories | INCLUDED |
| `framework/knowledge/` | Selective: universal/, cloned/, frameworks/, experts/, voc/ + index files | INCLUDED (partial) |
| `framework/scripts/` | health-check.js/ts, export-web.js, statusline.sh, sync-ide.js | INCLUDED |
| `framework/copy-squad/` | Full copywriter library (100+ files) | INCLUDED |
| `framework/rules/CLAUDE.md` | Rules context file | INCLUDED |
| `framework/rules/offers/` | 4 offer rules (cognixor, florayla, neuvelys, quimica-amarracao) | INCLUDED |
| `framework/schemas/` | YAML schemas | INCLUDED |
| `framework/workflows/` | Workflow definitions | INCLUDED |
| `framework/checklists/` | Acceptance checklists | INCLUDED |
| `framework/data/` | Framework data | INCLUDED |
| `framework/docs/` | Documentation | INCLUDED |
| `framework/reference/` | Reference materials | INCLUDED |
| `framework/references/` | Extended references | INCLUDED |
| `framework/stories/` | Story templates | INCLUDED |
| `framework/gotchas/` | Gotcha registry | INCLUDED |
| `framework/learned-patterns/` | ML patterns | INCLUDED |
| `framework/ids/` | IDS config | INCLUDED |
| `framework/commands/` | Star commands | INCLUDED |
| `framework/config/` | Framework config | INCLUDED |
| `framework/dossiers/` | Expert dossiers | INCLUDED |
| `framework/experts/` | Expert profiles | INCLUDED |
| `framework/templates/` | Production templates | INCLUDED |

### Root Config Files (installed to `~/.claude/`)
All of: `CLAUDE.md`, `constitution.md`, `core-config.yaml`, `manifest.yaml`, `manifest.json`, `framework-config.yaml`, `synapse-manifest.yaml`, `copy-surface-criteria.yaml`, `registry.yaml`, `CHANGELOG.md`, `COPY-CHIEF-INDEX.md`, and several guide `.md` files.

---

## Section B: What the Installer COPIES to `~/.claude/`

The installer (`installer/install.js`) performs these operations in order:

1. **Backup** existing `~/.claude/` (timestamped copy)
2. **Copy framework** — iterates these directories from `framework/` → `~/.claude/`:
   ```
   .aios-core, hooks, scripts, agents, copy-squad, plugins, schemas,
   skills, commands, knowledge, reference, references, dossiers, experts,
   config, checklists, rules, data, templates, workflows,
   stories, gotchas, learned-patterns, ids, docs, tests
   ```
3. **Install deps** — `npm install` js-yaml inside `~/.claude/.aios-core/`
4. **Transpile TypeScript** — runs esbuild on all `.ts` files in hooks/ and copy-chief/
5. **Generate settings.json** — writes from template with resolved paths
6. **Generate mcp.json** — writes from template with API tokens
7. **Scaffold ecosystem** — copies `templates/ecosystem/` → `~/copywriting-ecosystem/`
8. **Create runtime dirs** — creates: `logs/`, `session-state/`, `session-env/`, `session-digests/`, `agent-memory/`, `projects/`, `plans/`, `cache/`, `debug/`, `production-logs/`, `production-loops/`, `shell-snapshots/`, `paste-cache/`, `memory/`, `artifacts/`, `file-history/`

---

## Section C: What Is MISSING from the Package

### CRITICAL GAPS (will cause runtime failures)

#### 1. 10 AIOS Framework Rules Missing from `framework/rules/`

The live system has these 10 rule files in `~/.claude/rules/` that are NOT in `framework/rules/` and thus NOT distributed:

| Missing File | Purpose |
|-------------|---------|
| `agent-authority.md` | Agent delegation matrix, @ops exclusive ops |
| `agent-handoff.md` | Agent switch compaction protocol |
| `agent-memory-imports.md` | Agent memory lifecycle |
| `coderabbit-integration.md` | Automated code review rules |
| `ids-principles.md` | Incremental Development System |
| `mcp-usage.md` | MCP server usage rules + tool selection priority |
| `story-lifecycle.md` | Story status transitions and quality gates |
| `tool-examples.md` | Tool selection guidance |
| `tool-response-filtering.md` | Tool response filtering rules |
| `workflow-execution.md` | 4 primary workflows (SDC, QA Loop, Spec Pipeline, Brownfield) |

**Impact:** Without these rules, the AIOS framework doesn't know its own operational rules. The `agent-authority.md` rule is particularly critical — it governs the `agent-authority-gate.cjs` hook behavior.

**Fix required:** Add all 10 files to `framework/rules/` and add `framework/rules/*.md` (minus offers/) to `package.json` files field.

#### 2. Agent Subdirectories Missing for `ops` and `strategist`

The live system has `~/.claude/agents/ops/` and `~/.claude/agents/strategist/` as directories, each containing:
- `AGENT.md` — Agent-specific state/configuration
- `MEMORY.md` — Persistent agent memory
- `SOUL.md` — Agent soul/personality definition

The package has `framework/agents/ops.md` and `framework/agents/strategist.md` (the persona instruction files) but **does NOT have** the `ops/` or `strategist/` subdirectories.

**Impact:** New installs won't have the structured agent state directories for the two newest agents. Other agents (atlas, blade, cipher, echo, forge, hawk, helix, reflection, scad, scout, sentinel, vox) correctly have their subdirectories in `framework/agents/`.

**Fix required:** Create `framework/agents/ops/` and `framework/agents/strategist/` with seeded `AGENT.md`, `MEMORY.md`, `SOUL.md` files.

#### 3. `.ts` Source Files Missing from `copy-chief/memory/`

Live `~/.claude/.aios-core/copy-chief/memory/` has two `.ts` files not in the package:
- `agent-memory-writeback.ts`
- `memory-populator.ts`

The compiled `.js` versions ARE present in the package. This means source code is not distributable for these two modules. **Minor impact** since compiled `.js` runs correctly, but inconsistent with other modules that ship both.

### SIGNIFICANT GAPS (functional but degraded experience)

#### 4. `@lucapimenta/copywriting-mcp` NOT Published to npm

The `install-all` command calls `npx @lucapimenta/copywriting-mcp install`. This package **is not published** (version 1.0.0 exists locally at `~/copywriting-ecosystem/packages/copywriting-mcp/` but npm returns 404).

The MCP server (`~/.claude/plugins/copywriting-mcp/`) is what powers ALL `mcp__copywriting__*` tools:
- `validate_gate` — gate enforcement
- `blind_critic` — post-production validation
- `emotional_stress_test` — stress testing
- `black_validation` — final delivery validation
- `write_chapter`, `get_mecanismo`, etc.

**Without this MCP, the entire copywriting quality gate system fails.**

The `mcp.json.tpl` references it as:
```json
"copywriting": {
  "command": "{{NODE_BIN}}",
  "args": ["{{CLAUDE_HOME}}/plugins/copywriting-mcp/src/server.js"],
  "env": { "COPYWRITING_ECOSYSTEM": "{{ECOSYSTEM_ROOT}}" }
}
```

**Fix required:** Publish `@lucapimenta/copywriting-mcp` to npm (GitHub: `lckx777/copywriting-mcp`).

#### 5. `@lucapimenta/copy-chief-dashboard` NOT Published to npm

The `install-all` command calls `npx @lucapimenta/copy-chief-dashboard install`. This package **is not published** (GitHub: `lckx777/copy-chief-dashboard`).

**Impact:** Dashboard installation fails silently (warning message shown, continues). Non-blocking for core functionality but the status dashboard won't work.

**Fix required:** Publish `@lucapimenta/copy-chief-dashboard` to npm.

#### 6. `framework/plugins/` NOT in `package.json` files Field

The installer copies `plugins` from `framework/` to `~/.claude/plugins/`, but `framework/plugins/` is **not listed** in the `package.json` `files` field.

The `framework/plugins/` directory contains:
- `blocklist.json`
- `CLAUDE.md`
- `install-counts-cache.json`
- `installed_plugins.json`
- `known_marketplaces.json`
- `marketplaces/`
- (NOT the actual `copywriting-mcp/` server — that comes from the separate package)

**Verification:** `npm pack --dry-run` shows NO `framework/plugins/` files in the tarball. The installer will silently skip this (`if (!fs.existsSync(src)) continue;`).

**Impact:** Plugin registry/blocklist not installed. Plugin marketplace metadata missing. Functionality works but plugin system is uninitialized.

**Fix required:** Add `framework/plugins/` to `package.json` files field (excluding `copywriting-mcp/` which comes from the separate package).

### MINOR GAPS (cosmetic / non-blocking)

#### 7. `statusline.cjs` Missing from Framework and Live System

The `settings.json.tpl` references `{{HOOKS_DIR}}/statusline.cjs` in the `statusLine.command` field. This file does NOT exist in `framework/hooks/` OR in the live `~/.claude/hooks/`.

The live `~/.claude/scripts/statusline.sh` exists (shell version) but the `.cjs` referenced in settings does not. This means the Claude Code statusline command will silently fail.

**Impact:** No statusline display. Non-blocking.

#### 8. `knowledge/` Partial Inclusion

The `files` field includes only specific knowledge subdirectories and excludes the root-level dynamic tracking files:
- `enrichment-suggestions.md` — NOT in tarball
- `entity-registry.yaml` — NOT in tarball
- `feedback-loops.yaml` — NOT in tarball
- `retry-queue.yaml` — NOT in tarball
- `self-healing-log.yaml` — NOT in tarball
- `patterns-by-niche.yaml.bak` — NOT in tarball

These are runtime-generated files and are correctly excluded.

---

## Section D: Component-by-Component Checklist

| Component | In Package | In Tarball | Installs Correctly |
|-----------|-----------|------------|-------------------|
| CLI (`bin/cli.js`) | YES | YES | YES |
| Installer | YES | YES | YES |
| `~/.claude/hooks/` (156 files) | YES | YES | YES |
| `~/.claude/.aios-core/` | YES | YES | YES |
| `~/.claude/.aios-core/copy-chief/plan/` | YES | YES | YES |
| `~/.claude/agents/` (persona .md files) | YES | YES | YES |
| `~/.claude/agents/ops/` dir | NO | NO | NO — MISSING |
| `~/.claude/agents/strategist/` dir | NO | NO | NO — MISSING |
| `~/.claude/skills/` | YES | YES | YES |
| `~/.claude/knowledge/` | YES (partial) | YES (partial) | MOSTLY YES |
| `~/.claude/scripts/` | YES | YES | YES |
| `~/.claude/rules/CLAUDE.md` | YES | YES | YES |
| `~/.claude/rules/offers/` | YES | YES | YES |
| `~/.claude/rules/*.md` (10 files) | NO | NO | NO — MISSING |
| `~/.claude/plugins/` (registry) | YES in framework | NO in tarball | NO — files field omission |
| `~/.claude/plugins/copywriting-mcp/` | NO | NO | Requires separate package (unpublished) |
| `~/.claude/copy-squad/` | YES | YES | YES |
| `~/.claude/schemas/` | YES | YES | YES |
| `~/.claude/settings.json` | Generated from template | YES (template) | YES |
| `~/.claude/mcp.json` → `~/.claude.json` | Generated from template | YES (template) | PARTIAL (copywriting MCP broken) |
| `~/.claude/CLAUDE.md` | YES | YES | YES |
| `~/copywriting-ecosystem/` scaffold | YES (templates/ecosystem/) | YES | YES |
| `~/copywriting-ecosystem/.synapse/` | YES (templates/ecosystem/) | YES | YES |
| `~/copywriting-ecosystem/squads/` | YES (templates/ecosystem/) | YES | YES |
| MCP: sequential-thinking | npx (external) | n/a | YES |
| MCP: apify | npx (external) | n/a | YES (needs APIFY_TOKEN) |
| MCP: firecrawl | npx (external) | n/a | YES (needs FIRECRAWL_API_KEY) |
| MCP: playwright | npx (external) | n/a | YES |
| MCP: context7 | npx (external) | n/a | YES |
| MCP: fb_ad_library | npx (external) | n/a | YES (needs SCRAPECREATORS_API_KEY) |
| MCP: zen | npx (external) | n/a | YES (needs GEMINI_API_KEY + OPENAI_API_KEY) |
| MCP: copywriting | `@lucapimenta/copywriting-mcp` | n/a | BROKEN — not published |
| Dashboard | `@lucapimenta/copy-chief-dashboard` | n/a | BROKEN — not published |

---

## Section E: The 3 GitHub Repos — Status

| Repo | npm Package | Published | Referenced By | Required? |
|------|-------------|-----------|---------------|-----------|
| `lckx777/copy-chief-black` | `@lucapimenta/copy-chief-black` | YES (1.0.0) | Self | Core package |
| `lckx777/copywriting-mcp` | `@lucapimenta/copywriting-mcp` | NO | `install-all` cmd, `mcp.json.tpl` | CRITICAL |
| `lckx777/copy-chief-dashboard` | `@lucapimenta/copy-chief-dashboard` | NO | `install-all` cmd | Optional |

All 3 repos need to be published. The copywriting-mcp repo is **critical** — without it, the entire validation and gate system (blind_critic, emotional_stress_test, validate_gate, black_validation) won't function.

---

## Section F: Prioritized Fix List

### P0 — Blockers (fresh install non-functional without these)

1. **Publish `@lucapimenta/copywriting-mcp`** — The entire MCP quality gate system depends on this
2. **Add 10 rules files to `framework/rules/`** — AIOS framework won't know its operational rules

### P1 — Important (install works but degraded)

3. **Create `framework/agents/ops/` and `framework/agents/strategist/`** with seeded AGENT.md, MEMORY.md, SOUL.md
4. **Add `framework/plugins/` to `package.json` files field** — plugin registry won't initialize

### P2 — Minor (non-blocking)

5. **Publish `@lucapimenta/copy-chief-dashboard`** — statusline dashboard won't work
6. **Create `~/.claude/hooks/statusline.cjs`** — statusline command will fail silently
7. **Add `agent-memory-writeback.ts` and `memory-populator.ts` to package** — source consistency

---

*Audit completed by @ops — Log antes, executa depois, verifica sempre.*
