<p align="center">
  <h1 align="center">Copy Chief BLACK</h1>
  <p align="center">
    <strong>Direct Response Copywriting Framework for Claude Code</strong>
  </p>
  <p align="center">
    <a href="#installation">Installation</a> •
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="./README.md">Portugues</a> •
    <a href="./docs/getting-started.md">Getting Started</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue" alt="Platform">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
    <img src="https://img.shields.io/badge/version-1.0.0-orange" alt="Version">
  </p>
</p>

---

## What is it

Copy Chief BLACK is a complete Direct Response copywriting framework that runs on Claude Code. It turns Claude into a **team of 12 specialists** (Copy Squad) with an automated pipeline, MCP-powered quality gates, and parallel production of VSLs, Landing Pages, Creatives, and Emails.

### One command to install everything:

```bash
npx @lucapimenta/copy-chief-black install
```

## Features

### Copy Squad — 12 Specialized Personas

| Persona | Handle | Specialty |
|---------|--------|-----------|
| Helix | @chief | Orchestration and routing |
| Vox | @researcher | VOC research, avatar, market |
| Cipher | @miner | Ads spy, scale score, patterns |
| Atlas | @briefer | HELIX System briefing (10 phases) |
| Echo | @vsl | VSL production |
| Forge | @lp | Landing pages (14 blocks) |
| Scout | @creative | Ad creatives |
| Blade | @producer | Emails, generic copy |
| Hawk | @critic | Validation and review |
| Sentinel | @gatekeeper | Quality gates |
| Ops | @ops | Git, deploy, infra |
| Strategist | @strategist | Portfolio strategy |

### Synapse Engine (8 layers)

Context engine that automatically injects domain rules:
- **L0** Constitution — Non-negotiable principles
- **L1** Domain Rules — DRE, HELIX, mechanism, anti-homogenization
- **L2** Agent Rules — Per-persona rules
- **L6** Keyword Recall — Keyword-triggered activation
- **L7** Quality Gates — Automatic validation

### Automated Pipeline

```
Research → Briefing → Production → Validation → Delivery
   |          |           |            |            |
  Vox      Atlas    Echo/Forge/     Hawk +       Final
            +       Scout/Blade    MCP Gates    Package
          Cipher
```

### MCP Quality Gates

10 integrated validation tools:
- `validate_gate` — Advance pipeline phase
- `blind_critic` — Blind critique (no context)
- `emotional_stress_test` — Emotional stress test
- `black_validation` — Final BLACK validation
- `semantic_memory_search` — Semantic swipe search
- `layered_review` — Layered review
- And 4 more specialized tools

### 30+ Automated Hooks

Thin wrappers that orchestrate the pipeline:
- **SessionStart** — Orchestrator boot, health check, context loading
- **SubagentStart** — Persona activation, deps, offer context
- **SubagentStop** — Contract validation, chaining, memory writeback
- **PreToolUse** — Circuit breaker, authority gate, story validation
- **PostToolUse** — State recording, gate auto-advance
- **UserPromptSubmit** — Intent detection, dispatch queue

### 77 Production Templates

Ready-to-use templates for VSL, Landing Page, Creatives, Emails — validated in real campaigns.

## Installation

### Requirements

- Node.js >= 18
- Git
- Claude Code (`npm install -g @anthropic-ai/claude-code`)

### Install everything (Core + MCP + Dashboard)

```bash
npx @lucapimenta/copy-chief-black install-all
```

### Install core only

```bash
npx @lucapimenta/copy-chief-black install
```

### Verify installation

```bash
npx @lucapimenta/copy-chief-black doctor
```

### Create new offer

```bash
npx @lucapimenta/copy-chief-black new-offer health my-product
```

## Architecture

```
~/.claude/                              Installed by framework
  .aios-core/                           Synapse engine + modules
    core/synapse/                       8-layer engine
    copy-chief/                         ~55 domain modules
  hooks/                                30+ thin wrappers
  agents/                               12 persona files
  copy-squad/                           28 expert clones
  skills/                               Slash commands
  knowledge/                            Frameworks, VOC, patterns
  templates/                            77 production templates
  workflows/                            Pipeline YAMLs
  schemas/                              Validation schemas

~/copywriting-ecosystem/                Your workspace
  .synapse/                             Domain rules
  squads/copy-chief/                    Squad manifest
  health/florayla/                      Offer 1
  ...
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `install` | Install framework to ~/.claude/ |
| `install-all` | Install core + MCP server + dashboard |
| `update` | Update preserving customizations |
| `verify` | Verify installation integrity |
| `doctor` | Diagnose environment issues |
| `new-offer <niche> <name>` | Scaffold new offer project |

## Related Packages

| Package | Description | Repo |
|---------|-------------|------|
| `@lucapimenta/copy-chief-dashboard` | Next.js Dashboard (pipeline, kanban, helix) | [copy-chief-dashboard](https://github.com/lckx777/copy-chief-dashboard) |
| `@lucapimenta/copywriting-mcp` | MCP Server (10 quality tools, SQLite) | [copywriting-mcp](https://github.com/lckx777/copywriting-mcp) |

## Documentation

- [Getting Started](./docs/getting-started.md) — First value in 10 minutes
- [User Guide](./docs/guides/user-guide.md) — Complete reference
- [Copy Squad](./docs/guides/squad-guide.md) — How to use 12 agents
- [HELIX System](./docs/guides/helix-guide.md) — 10-phase briefing
- [macOS Installation](./docs/installation/macos.md)
- [Linux Installation](./docs/installation/linux.md)
- [Windows Installation](./docs/installation/windows.md)

## License

MIT License — see [LICENSE](./LICENSE)

## Author

**Luca Pimenta** — [@lckx777](https://github.com/lckx777)
