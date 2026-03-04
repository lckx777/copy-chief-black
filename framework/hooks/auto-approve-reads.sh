#!/bin/bash
# auto-approve-reads.sh - Auto-aprova leituras seguras
# JSON output com decision

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

# Bloquear arquivos sensíveis
if echo "$FILE_PATH" | grep -qE "(\.env|credentials|\.git/|node_modules/)"; then
    # Não auto-aprovar, deixar prompt normal
    exit 0
fi

# Auto-aprovar arquivos de research e briefings
if echo "$FILE_PATH" | grep -qE "(research/|briefings/|SKILL\.md|CLAUDE\.md)"; then
    echo '{"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}'
    exit 0
fi

# Outros arquivos: deixar prompt normal
exit 0
