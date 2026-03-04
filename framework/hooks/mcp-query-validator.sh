#!/bin/bash
# Hook: PreToolUse (mcp__* matcher)
# Purpose: Validate MCP queries have LIMIT to prevent expensive operations
# v5.3 - FASE 2 Hook de Filtro

set -e

# Read input JSON from stdin
read -r input_json

tool_name=$(echo "$input_json" | jq -r '.tool_name // empty')

# Exit early if not an MCP tool
if [[ ! "$tool_name" =~ ^mcp__ ]]; then
    exit 0
fi

# Extract common query parameters
query=$(echo "$input_json" | jq -r '.tool_input.query // .tool_input.sql // .tool_input.search // empty')
limit=$(echo "$input_json" | jq -r '.tool_input.limit // .tool_input.maxResults // .tool_input.max_results // empty')

# Check for SQL-like queries without LIMIT
if [[ -n "$query" ]] && [[ "$query" =~ SELECT ]] && [[ ! "$query" =~ LIMIT ]]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "SQL queries must include LIMIT clause to prevent expensive operations. Add LIMIT 100 or appropriate limit."
  }
}
EOF
    exit 0
fi

# Check Apify actors - recommend pagination
if [[ "$tool_name" =~ ^mcp__apify ]] && [[ -z "$limit" ]]; then
    # Allow but add context about pagination
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "additionalContext": "Note: Consider using pagination parameters (limit, offset) for Apify actors to control output size."
  }
}
EOF
    exit 0
fi

# Check firecrawl - recommend maxPages
if [[ "$tool_name" =~ ^mcp__firecrawl__firecrawl_crawl ]]; then
    max_pages=$(echo "$input_json" | jq -r '.tool_input.maxPages // empty')
    if [[ -z "$max_pages" ]] || [[ "$max_pages" -gt 50 ]]; then
        cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
            "additionalContext": "Warning: Firecrawl crawl without maxPages limit may be slow and expensive. Consider adding maxPages: 10-20."
  }
}
EOF
        exit 0
    fi
fi

# Allow by default
exit 0
