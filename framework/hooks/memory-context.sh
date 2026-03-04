#!/bin/bash
# memory-context.sh - Exibe contexto recente de memória (v1.1)
# Parte do Memory Protocol v1.0 (BSSF Score 8.3)
#
# v1.1: BSSF Fix - Output para stderr, JSON para stdout (Score 8.7, GBS 90%)
#
# Mostra resumo de:
# - RLM: últimos chunks salvos
# - claude-mem: já carregado automaticamente no system-reminder
#
# Uso: memory-context.sh

# Importar helpers (stdout=JSON, stderr=display)
source "$HOME/.claude/hooks/lib/hook-helpers.sh" 2>/dev/null || {
    # Fallback inline se lib não existir
    display() { echo "$@" >&2; }
    respond() { echo "${1:-{}}"; }
}

RLM_DIR="$HOME/.claude/rlm"

display "# Memória Disponível"
display ""

# === RLM CHUNKS ===
display "## RLM Chunks Recentes"
if [[ -d "$RLM_DIR/chunks" ]]; then
    # Listar últimos 5 chunks
    CHUNKS=$(ls -t "$RLM_DIR/chunks"/*.md 2>/dev/null | head -5)
    if [[ -n "$CHUNKS" ]]; then
        for CHUNK in $CHUNKS; do
            CHUNK_NAME=$(basename "$CHUNK" .md)
            # Extrair primeira linha do summary (se existir)
            SUMMARY=$(head -5 "$CHUNK" 2>/dev/null | grep -E "^#|Summary:" | head -1 | sed 's/^# //' | cut -c1-60)
            display "- $CHUNK_NAME: $SUMMARY..."
        done
    else
        display "- Nenhum chunk encontrado"
    fi
else
    display "- Diretório RLM não encontrado"
fi
display ""

# === CLAUDE-MEM ===
display "## claude-mem"
display "- Status: Ativo (automático)"
display "- Observações carregadas no system-reminder"
display "- Use: mcp__plugin_claude-mem_mcp-search__search(query='...')"
display ""

# === INSTRUÇÕES ===
display "## Para Recuperar Contexto"
display "1. RLM: rlm_list_chunks() → rlm_peek(chunk_id)"
display "2. claude-mem: search(query) → get_observations(ids)"
display ""
display "Ver: ~/.claude/rules/memory-protocol.md"

# Resposta JSON para Claude Code (stdout)
respond '{}'
