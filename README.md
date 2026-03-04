<p align="center">
  <h1 align="center">Copy Chief BLACK</h1>
  <p align="center">
    <strong>Framework de Copywriting Direct Response para Claude Code</strong>
  </p>
  <p align="center">
    <a href="#instalacao">Instalacao</a> •
    <a href="#funcionalidades">Funcionalidades</a> •
    <a href="#arquitetura">Arquitetura</a> •
    <a href="./README.en.md">English</a> •
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

## O que e

Copy Chief BLACK e um framework completo de copywriting Direct Response que roda sobre o Claude Code. Ele transforma o Claude em um **time de 12 especialistas** (Copy Squad) com pipeline automatizado, quality gates via MCP, e producao paralela de VSLs, Landing Pages, Criativos e Emails.

### Um comando para instalar tudo:

```bash
npx @lucapimenta/copy-chief-black install
```

## Funcionalidades

### Copy Squad — 12 Personas Especializadas

| Persona | Handle | Especialidade |
|---------|--------|--------------|
| Helix | @chief | Orquestracao e routing |
| Vox | @researcher | Pesquisa VOC, avatar, mercado |
| Cipher | @miner | Ads spy, scale score, patterns |
| Atlas | @briefer | Briefing HELIX System (10 fases) |
| Echo | @vsl | Producao de VSL |
| Forge | @lp | Landing pages (14 blocos) |
| Scout | @creative | Criativos para ads |
| Blade | @producer | Emails, copy generica |
| Hawk | @critic | Validacao e review |
| Sentinel | @gatekeeper | Quality gates |
| Ops | @ops | Git, deploy, infra |
| Strategist | @strategist | Estrategia de portfolio |

### Synapse Engine (8 camadas)

Motor de contexto que injeta regras de dominio automaticamente:
- **L0** Constitution — Principios inegociaveis
- **L1** Domain Rules — DRE, HELIX, mecanismo, anti-homogeneizacao
- **L2** Agent Rules — Regras per-persona
- **L6** Keyword Recall — Ativacao por palavras-chave
- **L7** Quality Gates — Validacao automatica

### Pipeline Automatizado

```
Research → Briefing → Production → Validation → Delivery
   |          |           |            |            |
  Vox      Atlas    Echo/Forge/     Hawk +       Final
            +       Scout/Blade    MCP Gates    Package
          Cipher
```

### Quality Gates via MCP

10 ferramentas de validacao integradas:
- `validate_gate` — Avanca fase do pipeline
- `blind_critic` — Critica cega (sem contexto)
- `emotional_stress_test` — Teste de estresse emocional
- `black_validation` — Validacao final BLACK
- `semantic_memory_search` — Busca semantica em swipes
- `layered_review` — Review em camadas
- E mais 4 ferramentas especializadas

### 30+ Hooks Automatizados

Thin wrappers que orquestram o pipeline:
- **SessionStart** — Boot do orquestrador, health check, context loading
- **SubagentStart** — Ativacao de persona, deps, offer context
- **SubagentStop** — Validacao de contratos, chaining, memory writeback
- **PreToolUse** — Circuit breaker, authority gate, story validation
- **PostToolUse** — State recording, gate auto-advance
- **UserPromptSubmit** — Intent detection, dispatch queue

### 77 Templates de Producao

Templates prontos para VSL, Landing Page, Criativos, Emails — validados em campanhas reais.

## Instalacao

### Requisitos

- Node.js >= 18
- Git
- Claude Code (`npm install -g @anthropic-ai/claude-code`)

### Instalar tudo (Core + MCP + Dashboard)

```bash
npx @lucapimenta/copy-chief-black install-all
```

### Instalar apenas o Core

```bash
npx @lucapimenta/copy-chief-black install
```

### Verificar instalacao

```bash
npx @lucapimenta/copy-chief-black doctor
```

### Criar nova oferta

```bash
npx @lucapimenta/copy-chief-black new-offer saude meu-produto
```

## Arquitetura

```
~/.claude/                              Instalado pelo framework
  .aios-core/                           Synapse engine + modulos
    core/synapse/                       Motor de 8 camadas
    copy-chief/                         ~55 modulos de dominio
      state/                            Session state, offer state
      gates/                            Quality gates, validation
      workflow/                         HELIX phases, skill triggers
      orchestration/                    Routing, offer scanner
      execution/                        Prompt builder, workflow executor
      memory/                           Agent memory, writeback
      dispatch/                         Auto-dispatch queue
      ...
  hooks/                                30+ thin wrappers (.cjs + .js)
  agents/                               12 persona files (.md)
  copy-squad/                           28 expert clones
  skills/                               Slash commands
  knowledge/                            Frameworks, VOC, patterns
  templates/                            77 production templates
  workflows/                            Pipeline YAMLs
  schemas/                              Validation schemas
  config/                               Framework configuration
  commands/                             Custom commands

~/copywriting-ecosystem/                Seu workspace
  .synapse/                             Domain rules
  squads/copy-chief/                    Squad manifest
  saude/florayla/                       Oferta 1
  saude/neuvelys/                       Oferta 2
  relacionamento/quimica-amarracao/     Oferta 3
  ...
```

## Comandos CLI

| Comando | Descricao |
|---------|-----------|
| `install` | Instala framework em ~/.claude/ |
| `install-all` | Instala core + MCP server + dashboard |
| `update` | Atualiza preservando customizacoes |
| `verify` | Verifica integridade da instalacao |
| `doctor` | Diagnostica problemas de ambiente |
| `new-offer <nicho> <nome>` | Cria scaffold de oferta nova |

## Pacotes Relacionados

| Pacote | Descricao | Repo |
|--------|-----------|------|
| `@lucapimenta/copy-chief-dashboard` | Dashboard Next.js (pipeline, kanban, helix) | [copy-chief-dashboard](https://github.com/lckx777/copy-chief-dashboard) |
| `@lucapimenta/copywriting-mcp` | MCP server (10 quality tools, SQLite) | [copywriting-mcp](https://github.com/lckx777/copywriting-mcp) |

## Documentacao

- [Getting Started](./docs/getting-started.md) — Primeiro valor em 10 minutos
- [Guia do Usuario](./docs/guides/user-guide.md) — Referencia completa
- [Copy Squad](./docs/guides/squad-guide.md) — Como usar os 12 agentes
- [HELIX System](./docs/guides/helix-guide.md) — Briefing em 10 fases
- [Instalacao macOS](./docs/installation/macos.md)
- [Instalacao Linux](./docs/installation/linux.md)
- [Instalacao Windows](./docs/installation/windows.md)

## Suporte a Plataformas

| Plataforma | Metodo | Notas |
|------------|--------|-------|
| macOS | `npx @lucapimenta/copy-chief-black install` | Plataforma primaria |
| Linux | `npx @lucapimenta/copy-chief-black install` | Ubuntu, Debian, Fedora |
| Windows | `npx @lucapimenta/copy-chief-black install` | Via Node.js cross-platform |

## Licenca

MIT License — veja [LICENSE](./LICENSE)

## Autor

**Luca Pimenta** — [@lckx777](https://github.com/lckx777)

---

<p align="center">
  <sub>Copy Chief BLACK — Framework de Copywriting Direct Response para Claude Code</sub>
</p>
