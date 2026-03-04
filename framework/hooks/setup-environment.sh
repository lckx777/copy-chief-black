#!/bin/bash
# Hook: Setup (triggers on --init or --maintenance)
# Purpose: One-time environment initialization
# v5.4 - BSSF Fix: stdout=JSON, stderr=display (Score 8.7, GBS 90%)

set -e

# Importar helpers (stdout=JSON, stderr=display)
source "$HOME/.claude/hooks/lib/hook-helpers.sh" 2>/dev/null || {
    display() { echo "$@" >&2; }
    respond() { echo "${1:-{}}"; }
}

# Read input JSON from stdin (with timeout to avoid hanging on SessionStart)
read -t 2 -r input_json 2>/dev/null || input_json='{}'

trigger=$(echo "$input_json" | jq -r '.trigger // "unknown"' 2>/dev/null || echo "unknown")

# Log setup event
LOG_FILE="$HOME/.claude/logs/setup.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Setup triggered: $trigger" >> "$LOG_FILE"

# Set environment variables if CLAUDE_ENV_FILE is available
if [ -n "$CLAUDE_ENV_FILE" ]; then
    # Ensure required environment variables are set
    {
        echo "export ECOSYSTEM_VERSION=5.4"
        echo "export ECOSYSTEM_ROOT=$HOME/copywriting-ecosystem"
    } >> "$CLAUDE_ENV_FILE"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Environment variables written to $CLAUDE_ENV_FILE" >> "$LOG_FILE"
fi

# Verify critical directories exist
for dir in "$HOME/.claude/logs" "$HOME/.claude/hooks" "$HOME/copywriting-ecosystem"; do
    if [ ! -d "$dir" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: Directory missing: $dir" >> "$LOG_FILE" 2>&1
    fi
done

# Return valid JSON (BSSF requirement)
respond '{}'
