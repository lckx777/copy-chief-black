#!/bin/bash
# log-tool-failure.sh - Loga falhas de ferramentas

INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name','unknown'))" 2>/dev/null || echo "unknown")
ERROR=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','')[:200])" 2>/dev/null || echo "")

# Log para arquivo
LOG_DIR="$HOME/.claude/logs"
mkdir -p "$LOG_DIR"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] TOOL_FAILURE: $TOOL - $ERROR" >> "$LOG_DIR/tool-failures.log"

exit 0
