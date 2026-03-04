# Instalacao — Linux

> Testado em Ubuntu 22.04+, Debian 12+, Fedora 38+.

## Pre-requisitos

### Ubuntu / Debian

```bash
# Node.js 18+ (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git
sudo apt-get install -y git

# Claude Code
npm install -g @anthropic-ai/claude-code
```

### Fedora / RHEL

```bash
# Node.js 18+
sudo dnf install -y nodejs npm

# Git
sudo dnf install -y git

# Claude Code
npm install -g @anthropic-ai/claude-code
```

## Instalacao

```bash
npx @lucapimenta/copy-chief-black install-all
```

## Verificacao

```bash
npx @lucapimenta/copy-chief-black doctor
```

## Permissoes

O framework instala em `~/.claude/` (home do usuario). Nao precisa de sudo.

Se encontrar problemas de permissao:

```bash
chmod -R u+rwX ~/.claude
```

## Locais de Instalacao

Mesmos do macOS — veja [macOS Installation](./macos.md#locais-de-instalacao).
