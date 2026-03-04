---
description: Gera ZIP completo do ecossistema com descoberta automática de componentes
argument-hint: "[--check] [--no-offers]"
---

# /update-ecosystem - Backup Completo do Ecossistema

Gera um ZIP com **TUDO** do ecossistema Claude Code usando descoberta automática.

**Filosofia:** Incluir TUDO, excluir apenas auto-gerados.

---

## FASE 0: IDENTIFICAR VERSÃO (Automático)

```bash
# Ler versão de ~/.claude/.version (Single Source of Truth)
VERSION=$(grep "^VERSION=" ~/.claude/.version | cut -d= -f2)
RELEASED=$(grep "^RELEASED=" ~/.claude/.version | cut -d= -f2)
TIMESTAMP=$(date +%Y%m%d-%H%M)

echo "Versão: v$VERSION"
echo "Released: $RELEASED"
echo "Timestamp: $TIMESTAMP"
```

**Se .version não existe:**
```bash
# Criar com versão atual
echo "VERSION=4.9.3" > ~/.claude/.version
echo "RELEASED=$(date +%Y-%m-%d)" >> ~/.claude/.version
```

---

## FASE 1: SINCRONIZAR VERSÃO

```bash
# Propagar versão para todos os arquivos
~/.claude/scripts/sync-version.sh

# Verificar sincronização
~/.claude/scripts/sync-version.sh --check
```

**❌ BLOQUEAR SE:** Arquivos dessincronizados

---

## FASE 2: PREPARAR DIRETÓRIO DE BUILD

```bash
BUILD_DIR="/tmp/eco-build-$TIMESTAMP"
PAYLOAD_DIR="$BUILD_DIR/ecossistema-v${VERSION}-installer/payload"
ZIP_NAME="ecossistema-v${VERSION}-installer.zip"

rm -rf "$BUILD_DIR"
mkdir -p "$PAYLOAD_DIR/.claude"
mkdir -p "$PAYLOAD_DIR/copywriting-ecosystem"
```

---

## FASE 3: COPIAR ~/.claude/ (Descoberta Automática)

### 3.1 Definir Exclusões (Única Lista a Manter)

```bash
CLAUDE_EXCLUDES=(
    "debug"
    "cache"
    "plans"
    "session-env"
    "shell-snapshots"
    "file-history"
    "projects"
    "paste-cache"
    "todos"
    "tasks"
    "telemetry"
    "downloads"
    "history.jsonl"
    ".DS_Store"
    "statsig"
    "memory.db"
    "memory.db-wal"
    "memory.db-shm"
    "plugins/marketplaces"
    "plugins/cache"
)
```

### 3.2 Copiar Tudo Exceto Exclusões

```bash
# Construir padrão de exclusão para rsync
EXCLUDE_PATTERN=""
for item in "${CLAUDE_EXCLUDES[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN --exclude=$item"
done

# Copiar TUDO de ~/.claude/ exceto exclusões
rsync -av $EXCLUDE_PATTERN ~/.claude/ "$PAYLOAD_DIR/.claude/"
```

**Resultado:** Tudo que existir em ~/.claude/ vai para o ZIP automaticamente.
- Novo skill? ✅ Incluído
- Novo command? ✅ Incluído
- Novo template? ✅ Incluído
- Novo hook? ✅ Incluído

---

## FASE 4: COPIAR ~/copywriting-ecosystem/ (Descoberta Automática)

### 4.1 Definir Exclusões

```bash
ECO_EXCLUDES=(
    ".git"
    "worktrees"
    ".DS_Store"
    "node_modules"
    "__pycache__"
    "*.pyc"
    ".claude/debug"
    ".claude/cache"
    ".claude/plans"
    ".claude/session-env"
    ".claude/shell-snapshots"
    ".claude/file-history"
    ".claude/projects"
    ".claude/paste-cache"
    ".claude/todos"
    ".claude/tasks"
    ".claude/telemetry"
    ".claude/downloads"
    ".claude/history.jsonl"
    ".claude/statsig"
    ".claude/memory.db*"
    ".claude/plugins/marketplaces"
    ".claude/plugins/cache"
)
```

### 4.2 Copiar Tudo Exceto Exclusões

```bash
# Construir padrão de exclusão
EXCLUDE_PATTERN=""
for item in "${ECO_EXCLUDES[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN --exclude=$item"
done

# Copiar TUDO de ~/copywriting-ecosystem/ exceto exclusões
rsync -av $EXCLUDE_PATTERN ~/copywriting-ecosystem/ "$PAYLOAD_DIR/copywriting-ecosystem/"
```

**Resultado:**
- Scripts? ✅ Incluídos
- Templates? ✅ Incluídos
- Ofertas? ✅ Incluídas
- Qualquer novo arquivo? ✅ Incluído

### 4.3 Opção --no-offers (MACRO: Auto-Descoberta)

Se usuário passar `--no-offers`:
```bash
# Descobrir ofertas automaticamente e adicionar à exclusão
for offer in $(~/.claude/scripts/discover-components.sh --list-offers); do
    ECO_EXCLUDES+=("$offer")
done

# Resultado: TODAS as ofertas excluídas, independente de quantas existem
# Nunca precisará editar este comando ao adicionar novas ofertas
```

> **REGRA MACRO:** Nunca hardcodar lista de ofertas. Usar auto-descoberta.

---

## FASE 5: ADICIONAR SCRIPTS DE INSTALAÇÃO

```bash
# Copiar scripts para raiz do installer
cp ~/copywriting-ecosystem/scripts/install.sh "$BUILD_DIR/ecossistema-v${VERSION}-installer/"
cp ~/copywriting-ecosystem/scripts/diagnose.sh "$BUILD_DIR/ecossistema-v${VERSION}-installer/"

# Criar README rápido
cat > "$BUILD_DIR/ecossistema-v${VERSION}-installer/README.md" << 'EOF'
# Ecossistema de Copywriting v${VERSION}

## Instalação Rápida

```bash
./install.sh
```

## Diagnóstico

```bash
./diagnose.sh
./diagnose.sh --quick
./diagnose.sh --fix
```

## Estrutura

- `payload/.claude/` → Copia para `~/.claude/`
- `payload/copywriting-ecosystem/` → Copia para `~/copywriting-ecosystem/`

## Documentação

Ver `payload/.claude/TUTORIAL-COMO-USAR.md` após instalação.
EOF
```

---

## FASE 6: GERAR ZIP

```bash
cd "$BUILD_DIR"

# Criar ZIP
zip -r "$ZIP_NAME" "ecossistema-v${VERSION}-installer/" \
    -x "*.DS_Store" \
    -x "__MACOSX/*"

# Mover para Desktop
mv "$ZIP_NAME" ~/Desktop/

echo "✅ ZIP gerado: ~/Desktop/$ZIP_NAME"
```

---

## FASE 7: VALIDAÇÃO AUTOMÁTICA

### 7.1 Verificar Estrutura do ZIP

```bash
echo "=== Validando ZIP ==="

# Contar componentes
SKILLS=$(unzip -l ~/Desktop/$ZIP_NAME | grep "skills/" | grep -c "SKILL.md")
COMMANDS=$(unzip -l ~/Desktop/$ZIP_NAME | grep "commands/" | grep -c "\.md")
AGENTS=$(unzip -l ~/Desktop/$ZIP_NAME | grep "agents/" | grep -c "\.md")
HOOKS=$(unzip -l ~/Desktop/$ZIP_NAME | grep "hooks/" | grep -c "\.ts")
TEMPLATES=$(unzip -l ~/Desktop/$ZIP_NAME | grep "\.claude/templates/" | grep -c "\.md")

echo "Skills: $SKILLS"
echo "Commands: $COMMANDS"
echo "Agents: $AGENTS"
echo "Hooks: $HOOKS"
echo "Templates: $TEMPLATES"

# Verificar arquivos críticos
CRITICAL_FILES=(
    "CLAUDE.md"
    ".version"
    "CHANGELOG.md"
    "ecosystem-status.md"
    "TUTORIAL-COMO-USAR.md"
    "install.sh"
    "diagnose.sh"
)

for file in "${CRITICAL_FILES[@]}"; do
    if unzip -l ~/Desktop/$ZIP_NAME | grep -q "$file"; then
        echo "✅ $file"
    else
        echo "❌ $file FALTANDO"
    fi
done
```

### 7.2 Mostrar Estatísticas

```bash
# Tamanho do ZIP
SIZE=$(ls -lh ~/Desktop/$ZIP_NAME | awk '{print $5}')
FILES=$(unzip -l ~/Desktop/$ZIP_NAME | tail -1 | awk '{print $2}')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ecossistema v$VERSION"
echo "  Arquivos: $FILES"
echo "  Tamanho: $SIZE"
echo "  Local: ~/Desktop/$ZIP_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## FASE 8: ATUALIZAR CHANGELOG

Adicionar entrada automática em `~/.claude/CHANGELOG.md`:

```markdown
## [v{VERSION}] - {DATA}

### Atualizado
- Backup completo do ecossistema gerado via /update-ecosystem
- Inclui: {SKILLS} skills, {COMMANDS} commands, {AGENTS} agents
- Ofertas: [lista se incluídas]

### Arquivos no ZIP
- {FILES} arquivos totais
- Tamanho: {SIZE}
```

---

## FASE 9: CLEANUP

```bash
rm -rf "$BUILD_DIR"
echo "✅ Build directory removido"
```

---

## Uso

```bash
# Backup completo (com ofertas)
/update-ecosystem

# Apenas verificar o que seria incluído
/update-ecosystem --check

# Sem ofertas (só infraestrutura)
/update-ecosystem --no-offers
```

---

## Por Que Essa Abordagem Funciona

| Antes (Micro) | Agora (Macro) |
|---------------|---------------|
| Lista hardcoded de arquivos | Descoberta automática |
| Adicionar skill = editar comando | Adicionar skill = nada a fazer |
| Versão hardcoded no código | Versão lida de .version |
| Esquece arquivos novos | Inclui tudo automaticamente |

**Única manutenção necessária:** Adicionar item à lista de EXCLUSÕES se criar novo tipo de auto-gerado.

---

## Exclusões (Referência)

Estes são os únicos arquivos/diretórios excluídos:

| Diretório | Razão |
|-----------|-------|
| debug/ | Logs de debug (auto-gerado) |
| cache/ | Cache temporário |
| plans/ | Arquivos de planejamento de sessão |
| session-env/ | Estado de sessão |
| shell-snapshots/ | Snapshots de ambiente |
| file-history/ | Histórico de arquivos |
| projects/ | Metadata local |
| paste-cache/ | Clipboard |
| todos/ | Todo lists de sessão |
| tasks/ | Tarefas de sessão |
| telemetry/ | Telemetria de uso |
| downloads/ | Downloads temporários |
| history.jsonl | Histórico de sessão |
| .git/ | Controle de versão |
| worktrees/ | Git worktrees |
| statsig/ | Feature flags |
| memory.db* | Database local (claude-mem) |
| plugins/marketplaces/ | Cache de plugins (188MB - auto-baixado) |
| plugins/cache/ | Cache de plugins |

**Tudo mais = INCLUÍDO automaticamente.**

---

*Comando redesenhado: 2026-01-23 | Filosofia: Descoberta Automática + Exclusão Explícita*
