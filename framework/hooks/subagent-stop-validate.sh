#!/bin/bash
# Hook: SubagentStop
# Purpose: Log subagent completion and optionally validate output
# v5.3 - FASE 4 Hook Avançado

set -e

# Read input JSON from stdin
read -r input_json

agent_id=$(echo "$input_json" | jq -r '.agent_id // "unknown"')
agent_type=$(echo "$input_json" | jq -r '.agent_type // "unknown"')

# Log to file
LOG_FILE="$HOME/.claude/logs/subagents.log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] STOP  | Agent: $agent_type | ID: $agent_id" >> "$LOG_FILE"

# For research agents, could add validation here
# if [[ "$agent_type" == "researcher" ]]; then
#   # Check if required outputs exist
# fi

# Always allow completion
exit 0
