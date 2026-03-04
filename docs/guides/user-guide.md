# Guia do Usuario

> Referencia completa do Copy Chief BLACK.

## Conceitos

### Ecossistema

O Copy Chief BLACK opera em dois diretorios:

1. **`~/.claude/`** — Framework (engine, hooks, agents, templates)
2. **`~/copywriting-ecosystem/`** — Workspace (ofertas, pesquisa, producao)

### Ofertas

Cada produto/campanha e uma "oferta" com estrutura padrao:

```
{nicho}/{oferta}/
  CONTEXT.md              Contexto e estado da oferta
  mecanismo-unico.yaml    MUP + MUS + Gimmick Name
  helix-state.yaml        Estado das 10 fases HELIX
  project_state.yaml      Estado geral do projeto
  research/               Pesquisa VOC, avatar, mercado
  briefings/              Briefings HELIX (10 fases)
  production/             Copy produzida
    vsl/                  Chapters do VSL
    landing-page/         14 blocos da LP
    creatives/            Criativos para ads
    emails/               Sequencia de emails
  swipes/                 Material de referencia
  .aios/                  Estado runtime
```

### Pipeline

Cada oferta segue um pipeline de 4 fases:

```
1. RESEARCH    → VOC, avatar, concorrentes, mecanismo
2. BRIEFING    → HELIX System (10 fases de deep dive)
3. PRODUCTION  → VSL, LP, criativos, emails (paralelo)
4. DELIVERY    → Validacao final + empacotamento
```

Quality gates controlam a transicao entre fases.

### Copy Squad

12 agentes especializados que o Helix (@chief) roteia automaticamente:

- **@researcher** (Vox) — Pesquisa VOC, avatar, mercado
- **@miner** (Cipher) — Ads spy, scale score
- **@briefer** (Atlas) — HELIX briefing
- **@vsl** (Echo) — VSL scripts
- **@lp** (Forge) — Landing pages
- **@creative** (Scout) — Ad creatives
- **@producer** (Blade) — Emails, copy generica
- **@critic** (Hawk) — Review e validacao
- **@gatekeeper** (Sentinel) — Quality gates
- **@ops** (Ops) — Git, deploy, infra
- **@strategist** (Strategist) — Portfolio e pricing

## Workflow Basico

### 1. Criar oferta

```bash
npx @lucapimenta/copy-chief-black new-offer saude meu-produto
```

### 2. Iniciar pesquisa

No Claude Code:

```
Inicie a pesquisa de publico para saude/meu-produto
```

Helix roteia para Vox (@researcher) automaticamente.

### 3. Monitorar progresso

```
/status
```

### 4. Avancar fase

Quality gates sao validados automaticamente via MCP. Quando a pesquisa completa:

```
/validate
```

### 5. Produzir copy

```
/produce-offer saude/meu-produto
```

Lanca 4 agentes em paralelo: Echo (VSL), Forge (LP), Scout (criativos), Blade (emails).

## Slash Commands

| Comando | Descricao |
|---------|-----------|
| `/status` | Estado de todas as ofertas |
| `/pipeline` | Executar pipeline completo |
| `/validate` | Rodar quality gate da fase atual |
| `/produce-offer` | Produzir todos os deliverables |
| `/helix-parallel` | Research HELIX em paralelo |
| `/health` | Health check do ecossistema |
| `/analyze` | Analise estrutural de copy |
| `/checklist` | Mostrar checklist do deliverable |
| `/story` | Mostrar story ativa |
| `/next-action` | Proxima acao prioritaria |

## Quality Gates

Cada transicao de fase requer validacao:

| Gate | Criterio |
|------|----------|
| Research → Briefing | VOC extraido, avatar definido, concorrentes mapeados |
| Briefing → Production | HELIX 10/10, mecanismo aprovado |
| Production → Delivery | blind_critic + emotional_stress_test passam |
| Delivery | black_validation final |

## Configuracao

### settings.json

Gerado automaticamente. Principais secoes:

- `env` — Variaveis de ambiente (PATH, AIOS_CORE)
- `hooks` — 30+ hooks por evento
- `permissions` — Allow/deny lists

### core-config.yaml

Configuracao do framework:

- Ofertas ativas
- Squad settings
- Gate thresholds
- Template paths

## Troubleshooting

### Hooks nao executam

```bash
npx @lucapimenta/copy-chief-black verify --fix
```

### MCP tools nao disponveis

```bash
npx @lucapimenta/copywriting-mcp install
# Reinicie o Claude Code
```

### Agent nao ativa

Verifique se o agent file existe:

```bash
ls ~/.claude/agents/
```

### Pipeline travado

```
/diagnose-offer saude/meu-produto
```
