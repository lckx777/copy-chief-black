# Instalacao — Windows

> Cross-platform via Node.js. Funciona nativamente no Windows (nao precisa de WSL).

## Pre-requisitos

### Opcao 1: Instaladores oficiais

1. **Node.js 18+** — [Download](https://nodejs.org/) (LTS recomendado)
2. **Git** — [Download](https://git-scm.com/download/win)
3. **Claude Code** — Abra PowerShell ou CMD:

```powershell
npm install -g @anthropic-ai/claude-code
```

### Opcao 2: Via winget

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
npm install -g @anthropic-ai/claude-code
```

### Opcao 3: Via Chocolatey

```powershell
choco install nodejs-lts git
npm install -g @anthropic-ai/claude-code
```

## Instalacao

```powershell
npx @lucapimenta/copy-chief-black install-all
```

## Verificacao

```powershell
npx @lucapimenta/copy-chief-black doctor
```

## Locais de Instalacao (Windows)

| Componente | Local |
|------------|-------|
| Framework | `%USERPROFILE%\.claude\` |
| Synapse Engine | `%USERPROFILE%\.claude\.aios-core\` |
| Workspace | `%USERPROFILE%\copywriting-ecosystem\` |
| Settings | `%USERPROFILE%\.claude\settings.json` |

## Notas Windows

- O framework usa `os.homedir()` para resolver paths — funciona automaticamente no Windows
- Hooks usam `readFileSync(0, 'utf8')` em vez de `/dev/stdin` — compativel com Windows
- Paths usam `path.join()` e `path.sep` — sem barras hardcoded
- Transpilacao TS via esbuild (cross-platform)

## Troubleshooting

### "npx: command not found"

Node.js nao esta no PATH. Reinstale com a opcao "Add to PATH" marcada.

### "EACCES: permission denied"

```powershell
# Rode como Administrador
npm config set prefix "%APPDATA%\npm"
```

### "Execution policy"

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
