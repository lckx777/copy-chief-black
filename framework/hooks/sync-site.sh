#!/bin/bash
# ~/.claude/hooks/sync-site.sh
# v1.0 - Auto-regenera site do ecossistema
# Chamado pelo SessionEnd hook

SITE_DIR="$HOME/copywriting-ecosystem/site"
GENERATOR="$SITE_DIR/generate.py"
OUTPUT="$HOME/copywriting-ecosystem/index.html"

# Verificar se gerador existe
if [[ ! -f "$GENERATOR" ]]; then
    echo "[SYNC-SITE] Gerador não encontrado: $GENERATOR" >&2
    exit 0
fi

# Gerar site
echo "[SYNC-SITE] Regenerando site..." >&2
python3 "$GENERATOR" 2>&1 | while read -r line; do
    echo "[SYNC-SITE] $line" >&2
done

# Verificar se houve mudanças
cd "$HOME/copywriting-ecosystem" || exit 0

if git diff --quiet "$OUTPUT" 2>/dev/null; then
    echo "[SYNC-SITE] Site sem alterações" >&2
else
    echo "[SYNC-SITE] Site atualizado - commit automático" >&2
    git add "$OUTPUT" 2>/dev/null
    git commit -m "site: auto-update $(date +%Y-%m-%d)" 2>/dev/null || true
fi

exit 0
