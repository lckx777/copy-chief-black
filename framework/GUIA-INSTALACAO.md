# Guia de Instalação - Ecossistema de Copywriting v4.9.6

**Versão:** 4.9.6
**Atualizado:** 2026-01-26
**Plataformas:** macOS, Windows (WSL), Linux

---

## Pré-Requisitos

### Todos os Sistemas

| Requisito | Versão Mínima | Verificar |
|-----------|---------------|-----------|
| Claude Code | Última | `claude --version` |
| Python 3 | 3.8+ | `python3 --version` |
| Git | 2.0+ | `git --version` |
| Bun (para hooks) | 1.0+ | `bun --version` |

### Dependências Python

```bash
pip3 install pyyaml
```

---

## INSTALAÇÃO NO MAC

### Passo 1: Baixar Claude Code

```bash
# Via Homebrew (recomendado)
brew install claude-code

# Ou via npm
npm install -g @anthropic/claude-code
```

### Passo 2: Instalar Bun (para hooks)

```bash
curl -fsSL https://bun.sh/install | bash
```

### Passo 3: Extrair o Ecossistema

**IMPORTANTE:** Extrair no Desktop, NUNCA dentro de ~/copywriting-ecosystem

```bash
cd ~/Desktop
unzip ecossistema-v4.9.6-installer.zip
cd ecossistema-v4.9.6-installer
```

### Passo 4: Executar Instalador

```bash
./install.sh
```

O instalador faz:
1. Copia `payload/.claude/` → `~/.claude/`
2. Copia `payload/copywriting-ecosystem/` → `~/copywriting-ecosystem/`
3. Instala dependências Python
4. Configura permissões

### Passo 5: Verificar Instalação

```bash
cd ~/copywriting-ecosystem && claude
```

Na sessão Claude, digite:
```
mostrar status do ecossistema
```

Deve retornar: `🟢 OPERACIONAL`

---

## INSTALAÇÃO NO WINDOWS (WSL)

### Passo 1: Instalar WSL

Abra PowerShell como Administrador:

```powershell
wsl --install
```

Reinicie o computador quando solicitado.

### Passo 2: Configurar Ubuntu

Após reiniciar, abra "Ubuntu" no menu iniciar.

Crie usuário e senha quando solicitado.

### Passo 3: Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### Passo 4: Instalar Dependências

```bash
# Python e pip
sudo apt install python3 python3-pip -y

# Git
sudo apt install git -y

# Node.js (para Claude Code)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Bun (para hooks)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Passo 5: Instalar Claude Code

```bash
npm install -g @anthropic/claude-code
```

### Passo 6: Transferir ZIP para WSL

**Opção A: Via Explorer**
1. No Explorer Windows, navegue até `\\wsl$\Ubuntu\home\SEU_USUARIO\`
2. Copie o ZIP para lá

**Opção B: Via comando**
```bash
# No WSL
cp /mnt/c/Users/SEU_USUARIO/Desktop/ecossistema-v4.9.6-installer.zip ~/
```

### Passo 7: Extrair e Instalar

```bash
cd ~
unzip ecossistema-v4.9.6-installer.zip
cd ecossistema-v4.9.6-installer
chmod +x install.sh
./install.sh
```

### Passo 8: Instalar PyYAML

```bash
pip3 install pyyaml
```

### Passo 9: Verificar Instalação

```bash
cd ~/copywriting-ecosystem && claude
```

---

## INSTALAÇÃO NO LINUX

Mesmos passos do WSL, exceto:
- Pular passos 1-2 (WSL)
- Instalar dependências conforme sua distro

### Ubuntu/Debian
```bash
sudo apt install python3 python3-pip git nodejs npm unzip -y
```

### Fedora
```bash
sudo dnf install python3 python3-pip git nodejs npm unzip -y
```

### Arch
```bash
sudo pacman -S python python-pip git nodejs npm unzip
```

---

## ESTRUTURA APÓS INSTALAÇÃO

```
~/
├── .claude/                          ← Configuração global
│   ├── CLAUDE.md                     ← Instruções autoritativas
│   ├── CHANGELOG.md                  ← Histórico de versões
│   ├── GUIA-INSTALACAO.md            ← Este arquivo
│   ├── ecosystem-status.md           ← Status dos componentes
│   ├── settings.json                 ← Hooks e permissões
│   ├── .version                      ← Single Source of Truth
│   ├── skills/                       ← 10+ skills instaladas
│   ├── commands/                     ← Slash commands
│   ├── agents/                       ← Subagents
│   ├── templates/                    ← Templates de research
│   ├── hooks/                        ← Hooks TypeScript
│   └── scripts/                      ← Scripts de manutenção
│
└── copywriting-ecosystem/            ← Diretório de trabalho
    ├── TUTORIAL-COMO-USAR.md         ← Guia passo-a-passo
    ├── scripts/                      ← Scripts de validação
    │   ├── sync-tracking.py          ← Enforcement automático
    │   ├── validate-research.sh      ← Validação de gate
    │   └── validate-gate.py          ← Validação Python
    ├── concursos/                    ← Nicho: Concursos
    │   ├── hacker/                   ← Oferta 1
    │   ├── gpt-dos-aprovados/        ← Oferta 2
    │   ├── gabaritando-lei-seca/     ← Oferta 3
    │   └── concursa-ai/              ← Oferta 4
    └── templates/                    ← Templates de oferta
```

---

## VERIFICAÇÃO COMPLETA

### 1. Verificar Claude Code

```bash
claude --version
```

### 2. Verificar Hooks

```bash
ls ~/.claude/hooks/
# Deve mostrar: session-start.ts, user-prompt.ts, curation.ts
```

### 3. Verificar Skills

```bash
ls ~/.claude/skills/
# Deve mostrar: 10+ diretórios de skills
```

### 4. Verificar Scripts

```bash
python3 ~/copywriting-ecosystem/scripts/sync-tracking.py --check
```

### 5. Teste Completo

```bash
cd ~/copywriting-ecosystem && claude
```

Digite:
```
validar gate research para hacker
```

Deve retornar resultado da validação.

---

## TROUBLESHOOTING

### "bun: command not found"

```bash
# Recarregar shell
source ~/.bashrc
# Ou
source ~/.zshrc

# Se ainda não funcionar
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### "python3: command not found"

```bash
# Mac
brew install python3

# Ubuntu/WSL
sudo apt install python3 python3-pip -y
```

### "ModuleNotFoundError: No module named 'yaml'"

```bash
pip3 install pyyaml
```

### "Permission denied" no install.sh

```bash
chmod +x install.sh
./install.sh
```

### "Claude não reconhece skills"

```bash
# Verificar se CLAUDE.md existe
cat ~/.claude/CLAUDE.md | head -20

# Se não existir, reinstalar
cd ~/Desktop/ecossistema-v4.9.6-installer
./install.sh
```

### Hooks não executam

```bash
# Verificar settings.json
cat ~/.claude/settings.json | grep -A5 "SessionEnd"

# Deve mostrar hooks configurados
```

---

## ATUALIZAÇÃO

### De versão anterior para v4.9.6

1. **Backup (opcional)**
```bash
cp -r ~/copywriting-ecosystem ~/copywriting-ecosystem-backup
cp -r ~/.claude ~/.claude-backup
```

2. **Extrair novo installer**
```bash
cd ~/Desktop
unzip ecossistema-v4.9.6-installer.zip
cd ecossistema-v4.9.6-installer
```

3. **Executar instalador**
```bash
./install.sh
```

O instalador preserva:
- Ofertas existentes em `~/copywriting-ecosystem/concursos/`
- Dados de research e briefings
- project_state.yaml de cada oferta

---

## SUPORTE

### Diagnóstico Automático

```bash
cd ~/copywriting-ecosystem
./scripts/diagnose.sh
```

### Verificar Status

```bash
cd ~/copywriting-ecosystem && claude
# Digite: mostrar ecosystem status
```

### Logs de Hooks

```bash
# Ver erros recentes
cat ~/.claude/debug/hooks.log 2>/dev/null || echo "Sem logs"
```

---

*Guia criado: 2026-01-24*
*Versão: v4.9.6*
