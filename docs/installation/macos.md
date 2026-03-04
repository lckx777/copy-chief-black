# Instalacao — macOS

> Plataforma primaria. Testado em macOS 14+ (Sonoma/Sequoia).

## Pre-requisitos

```bash
# Node.js 18+ (via Homebrew)
brew install node

# Git (ja vem com macOS, mas atualize)
brew install git

# Claude Code
npm install -g @anthropic-ai/claude-code
```

## Instalacao

### Tudo de uma vez

```bash
npx @lucapimenta/copy-chief-black install-all
```

### Passo a passo

```bash
# 1. Core framework
npx @lucapimenta/copy-chief-black install

# 2. MCP server (quality gates)
npx @lucapimenta/copywriting-mcp install

# 3. Dashboard (opcional)
npx @lucapimenta/copy-chief-dashboard install
npx @lucapimenta/copy-chief-dashboard start
# -> http://localhost:3000
```

## Verificacao

```bash
npx @lucapimenta/copy-chief-black doctor
```

## Locais de Instalacao

| Componente | Local |
|------------|-------|
| Framework | `~/.claude/` |
| Synapse Engine | `~/.claude/.aios-core/` |
| Hooks | `~/.claude/hooks/` |
| Agents | `~/.claude/agents/` |
| MCP Server | `~/.claude/plugins/copywriting-mcp/` |
| Dashboard | `~/.claude/dashboard-v2/` |
| Workspace | `~/copywriting-ecosystem/` |
| Settings | `~/.claude/settings.json` |
| MCP Config | `~/.claude/mcp.json` |

## Atualizacao

```bash
npx @lucapimenta/copy-chief-black update
```

Preserva customizacoes (settings personalizados, regras de oferta, etc).

## Desinstalar

Remova os diretorios:

```bash
# Framework
rm -rf ~/.claude/.aios-core ~/.claude/hooks ~/.claude/agents
rm -rf ~/.claude/copy-squad ~/.claude/skills ~/.claude/knowledge

# MCP
rm -rf ~/.claude/plugins/copywriting-mcp

# Dashboard
rm -rf ~/.claude/dashboard-v2

# Workspace (CUIDADO — contem suas ofertas!)
# rm -rf ~/copywriting-ecosystem
```

## Troubleshooting

### "Command not found: claude"

```bash
npm install -g @anthropic-ai/claude-code
```

### "Permission denied"

```bash
sudo chown -R $(whoami) ~/.claude
```

### Hooks nao executam

```bash
npx @lucapimenta/copy-chief-black verify --fix
```
