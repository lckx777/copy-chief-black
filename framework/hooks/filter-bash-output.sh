#!/bin/bash
# Hook: PreToolUse (Bash matcher)
# Purpose: Filter verbose bash output to save tokens
# v5.3 - FASE 2 Hook de Filtro

set -e

# Read input JSON from stdin
read -r input_json

command=$(echo "$input_json" | jq -r '.tool_input.command // empty')

# Exit early if no command
if [[ -z "$command" ]]; then
    exit 0
fi

modified_command=""

# Pattern 1: Test commands - show only failures and summary
if [[ "$command" =~ (npm\ test|jest|pytest|vitest|mocha) ]]; then
    # Filter to show only FAIL, Error, and summary lines
    modified_command="$command 2>&1 | grep -E '(FAIL|PASS|Error|●|✓|✕|Test Suites|Tests:|passed|failed|error)' || true"
fi

# Pattern 2: Build commands - show only errors and warnings
if [[ "$command" =~ (npm\ run\ build|tsc|webpack|vite\ build) ]]; then
    modified_command="$command 2>&1 | grep -E '(error|warning|Error|Warning|ENOENT|failed)' || echo '[BUILD OK - no errors]'"
fi

# Pattern 3: Install commands - show only summary
if [[ "$command" =~ (npm\ install|pip\ install|brew\ install) ]]; then
    modified_command="$command 2>&1 | tail -n 10"
fi

# Pattern 4: Find commands with too many results - add head limit
if [[ "$command" =~ ^find && ! "$command" =~ "head" && ! "$command" =~ "wc" ]]; then
    modified_command="$command | head -50"
fi

# If we have a modified command, return it
if [[ -n "$modified_command" ]]; then
    # Escape the command for JSON
    escaped_command=$(echo "$modified_command" | jq -Rs '.')

    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "command": ${escaped_command}
    }
  }
}
EOF
    exit 0
fi

# Allow unmodified
exit 0
