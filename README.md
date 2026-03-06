<p align="center">
  <h1 align="center">Copy Chief BLACK</h1>
  <p align="center">
    <strong>Framework de Copywriting Direct Response para Claude Code</strong>
  </p>
  <p align="center">
    <a href="#instalacao">Instalacao</a> &bull;
    <a href="#funcionalidades">Funcionalidades</a> &bull;
    <a href="#arquitetura">Arquitetura</a> &bull;
    <a href="./README.en.md">English</a> &bull;
    <a href="./docs/getting-started.md">Getting Started</a>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue" alt="Platform">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
    <img src="https://img.shields.io/badge/version-2.0.0-orange" alt="Version">
  </p>
</p>

---

## O que e

Copy Chief BLACK e um framework completo de copywriting Direct Response que roda sobre o Claude Code. Ele transforma o Claude em um **time de 13 especialistas** (Copy Squad) com pipeline automatizado, quality gates via MCP, e producao paralela de VSLs, Landing Pages, Criativos e Emails.

### Um comando para instalar tudo:

```bash
npx @lucapimenta/copy-chief-black install
```

## Funcionalidades

### Copy Squad -- 13 Personas Especializadas

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
| Reflection | @reflect | Meta-analise e retrospectivas |

### AIOX Squad Native (v2.0)

Desde v2.0, os agentes vivem como um **AIOX Squad** nativo em `squads/copy-chief/`:
- **13 agents** com YAML activation blocks auto-contidos
- **14 tasks** (research, briefing, production, review, ops, strategy)
- **5 workflows** (research, briefing, production, review, full-pipeline)
- **3 checklists** (production-preflight, copy-quality-gate, delivery)
- **4 templates** (vsl-chapter, creative-batch, lp-block, review-report)
- **Knowledge data** organizada por dominio (craft, creative, critic, helix-ref, leads, lp)
- Ativacao via `/AIOS:agents:{name}` ou `@{handle}`

### Synapse Engine (8 camadas)

Motor de contexto que injeta regras de dominio automaticamente:
- **L0** Constitution -- Principios inegociaveis
- **L1** Domain Rules -- DRE, HELIX, mecanismo, anti-homogeneizacao
- **L2** Agent Rules -- Regras per-persona
- **L6** Keyword Recall -- Ativacao por palavras-chave
- **L7** Quality Gates -- Validacao automatica

### Pipeline Automatizado

```
Research -> Briefing -> Production -> Validation -> Delivery
   |          |           |            |            |
  Vox      Atlas    Echo/Forge/     Hawk +       Final
            +       Scout/Blade    MCP Gates    Package
          Cipher
```

### Quality Gates via MCP

10 ferramentas de validacao integradas:
- `validate_gate` -- Avanca fase do pipeline
- `blind_critic` -- Critica cega (sem contexto)
- `emotional_stress_test` -- Teste de estresse emocional
- `black_validation` -- Validacao final BLACK
- `semantic_memory_search` -- Busca semantica em swipes
- `layered_review` -- Review em camadas
- E mais 4 ferramentas especializadas

### 28 Copywriting Experts Clonados

DNA extraido de mestres do Direct Response:
- Sugarman, Schwartz, Ogilvy, Collier, Kern
- Hormozi, Abraham, Chaperon, Brown
- E mais 19 especialistas com checklists individuais

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
  .aios-core/                           Synapse engine
    core/synapse/                       Motor de 8 camadas
  commands/                             Skill stubs (thin redirects)
  rules/                               Domain rules
  scripts/                             Health check
  config/                              Framework config

~/copywriting-ecosystem/                Seu workspace
  .synapse/                             Domain rules (DRE, HELIX, etc)
  squads/copy-chief/                    AIOX Squad (v2.0 native)
    agents/                             13 agent definitions (.md)
    tasks/                              14 executable tasks
    workflows/                          5 pipeline workflows
    checklists/                         3 quality checklists
    templates/                          4 output templates
    data/                               Knowledge base
    squad.yaml                          Squad manifest
  saude/florayla/                       Oferta 1
  saude/neuvelys/                       Oferta 2
  saude/cognixor/                       Oferta 3
  saude/nerve-action/                   Oferta 4
  relacionamento/quimica-amarracao/     Oferta 5
  ...
```

## Migracoes

### v1.x -> v2.0 (Breaking Changes)

- **Hooks removidos:** Toda a arquitetura de hooks (157 arquivos) foi substituida pelo AIOX Squad nativo
- **Agents movidos:** De `~/.claude/agents/` para `squads/copy-chief/agents/` no workspace
- **Settings simplificado:** Apenas Synapse engine hook permanece ativo
- **Squad native:** Agentes agora sao AIOX-native com YAML activation blocks
- Rode `npx @lucapimenta/copy-chief-black install --force` para atualizar

## Comandos CLI

| Comando | Descricao |
|---------|-----------|
| `install` | Instala framework em ~/.claude/ + squad no ecosystem |
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

- [Getting Started](./docs/getting-started.md) -- Primeiro valor em 10 minutos
- [Guia do Usuario](./docs/guides/user-guide.md) -- Referencia completa
- [Copy Squad](./docs/guides/squad-guide.md) -- Como usar os 13 agentes
- [HELIX System](./docs/guides/helix-guide.md) -- Briefing em 10 fases
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

MIT License -- veja [LICENSE](./LICENSE)

## Autor

**Luca Pimenta** -- [@lckx777](https://github.com/lckx777)

---

<p align="center">
  <sub>Copy Chief BLACK v2.0 -- AIOX Squad Native -- Framework de Copywriting Direct Response para Claude Code</sub>
</p>
