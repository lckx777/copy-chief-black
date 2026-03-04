#!/bin/bash
# Hook: SubagentStart
# Purpose: Log subagent context when spawning
# v5.3 - FASE 4 Hook Avançado

set -e

# Read input JSON from stdin
read -r input_json

agent_id=$(echo "$input_json" | jq -r '.agent_id // "unknown"')
agent_type=$(echo "$input_json" | jq -r '.agent_type // "unknown"')
cwd=$(echo "$input_json" | jq -r '.cwd // "unknown"')

# Log to file
LOG_FILE="$HOME/.claude/logs/subagents.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] START | Agent: $agent_type | ID: $agent_id | CWD: $cwd" >> "$LOG_FILE"

# Always allow
exit 0
