#!/usr/bin/env bash
#
# sync-repos-on-stop.sh - Auto-sync repos when session ends
# Hook: Stop
#
# Sincroniza ~/.claude e ~/copywriting-ecosystem automaticamente
# Deploy Vercel se houver mudanças no site
#

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Log silencioso (não polui output do usuário)
LOG_FILE="/tmp/claude-sync-$(date +%Y%m%d).log"

log() {
    echo "[$(date '+%H:%M:%S')] $1" >> "$LOG_FILE"
}

sync_repo() {
    local repo_path="$1"
    local repo_name="$2"

    if [ ! -d "$repo_path/.git" ]; then
        log "SKIP: $repo_name não é git repo"
        return 0
    fi

    cd "$repo_path" || return 1

    # Verificar se há mudanças
    if git diff --quiet && git diff --cached --quiet; then
        # Verificar untracked files importantes (não includes plans/, stats, etc)
        local untracked=$(git status --porcelain | grep -v "^?? plans/" | grep -v "stats-cache" | grep -v "history.jsonl" | grep "^??" | wc -l | tr -d ' ')
        if [ "$untracked" -eq 0 ]; then
            log "OK: $repo_name - nada para commitar"
            return 0
        fi
    fi

    # Commit automático
    git add -A 2>/dev/null

    local msg="chore: Auto-sync on session end ($(date '+%Y-%m-%d %H:%M'))"
    if git commit -m "$msg" 2>/dev/null; then
        log "COMMIT: $repo_name"

        # Push
        if git push 2>/dev/null; then
            log "PUSH: $repo_name OK"
        else
            log "PUSH: $repo_name FAILED"
        fi
    else
        log "SKIP: $repo_name - commit falhou ou nada staged"
    fi
}

# Main
log "=== Sync iniciado ==="

# 1. Sync ~/.claude
sync_repo "$HOME/.claude" "claude-ecosystem"

# 2. Sync ~/copywriting-ecosystem
sync_repo "$HOME/copywriting-ecosystem" "copywriting-ecosystem"

# 3. Vercel deploy se necessário (já tratado pelo git hook post-commit)

log "=== Sync finalizado ==="

exit 0
