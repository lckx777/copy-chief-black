# Getting Started

> Primeiro valor em 10 minutos.

## Pre-requisitos

1. **Node.js 18+** — [Download](https://nodejs.org/)
2. **Git** — [Download](https://git-scm.com/)
3. **Claude Code** — `npm install -g @anthropic-ai/claude-code`

## Instalacao Rapida

```bash
# Instala tudo: core + MCP server + dashboard
npx @lucapimenta/copy-chief-black install-all
```

Isso copia o framework para `~/.claude/` e cria o workspace em `~/copywriting-ecosystem/`.

## Verificar Instalacao

```bash
npx @lucapimenta/copy-chief-black doctor
```

Deve mostrar:
- Node.js ✓
- Git ✓
- Claude Code ✓
- Framework files ✓
- Settings.json ✓

## Criar Primeira Oferta

```bash
npx @lucapimenta/copy-chief-black new-offer saude meu-suplemento
```

Isso cria a estrutura:

```
~/copywriting-ecosystem/saude/meu-suplemento/
  CONTEXT.md              Contexto da oferta
  mecanismo-unico.yaml    Mecanismo (MUP + MUS)
  helix-state.yaml        Estado do briefing
  project_state.yaml      Estado do projeto
  research/               Pesquisa
  briefings/              Briefings HELIX
  production/             Copy produzida
    vsl/
    landing-page/
    creatives/
    emails/
  swipes/                 Referencia
```

## Iniciar o Pipeline

1. Abra o Claude Code no diretorio da oferta:

```bash
cd ~/copywriting-ecosystem
claude
```

2. Peca para iniciar a pesquisa:

```
Inicie a pesquisa de publico para saude/meu-suplemento
```

O Helix (@chief) vai rotear para o Vox (@researcher) automaticamente.

3. O pipeline segue:

```
Research → Briefing → Production → Validation → Delivery
```

## Comandos Uteis dentro do Claude Code

| Comando | Descricao |
|---------|-----------|
| `/status` | Ver estado de todas as ofertas |
| `/pipeline` | Executar pipeline |
| `/validate` | Rodar quality gate |
| `/produce-offer` | Produzir todos os deliverables |
| `/helix-parallel` | Research HELIX em paralelo |
| `/health` | Health check do ecossistema |

## Proximos Passos

- [Guia do Usuario](./guides/user-guide.md) — Referencia completa
- [Copy Squad](./guides/squad-guide.md) — Como usar os 12 agentes
- [HELIX System](./guides/helix-guide.md) — Briefing em 10 fases
