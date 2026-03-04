#!/bin/bash
# dashboard-autostart.sh — Auto-start dashboard server + open browser on SessionStart
# Inspired by Serena MCP auto-open pattern
#
# Created: 2026-02-24

source "$HOME/.claude/hooks/lib/hook-helpers.sh" 2>/dev/null || {
    display() { echo "$@" >&2; }
    respond() { echo "${1:-{}}"; }
}

DASHBOARD_PORT="${DASHBOARD_PORT:-4001}"
DASHBOARD_URL="http://localhost:${DASHBOARD_PORT}"
DASHBOARD_SCRIPT="$HOME/.claude/dashboard/server.ts"
DASHBOARD_LOG="$HOME/.claude/logs/dashboard.log"
DASHBOARD_PID_FILE="$HOME/.claude/logs/dashboard.pid"

# Ensure logs dir exists
mkdir -p "$HOME/.claude/logs"

# Check if server is already running on the port
if lsof -ti:"$DASHBOARD_PORT" >/dev/null 2>&1; then
    display "Dashboard: $DASHBOARD_URL (already running)"
    respond '{}'
    exit 0
fi

# Start dashboard server in background
if [[ -f "$DASHBOARD_SCRIPT" ]]; then
    nohup bun run "$DASHBOARD_SCRIPT" >> "$DASHBOARD_LOG" 2>&1 &
    DASHBOARD_PID=$!
    echo "$DASHBOARD_PID" > "$DASHBOARD_PID_FILE"

    # Wait briefly for server to start
    sleep 1

    # Verify it started
    if lsof -ti:"$DASHBOARD_PORT" >/dev/null 2>&1; then
        display "Dashboard: $DASHBOARD_URL (started, PID $DASHBOARD_PID)"
    else
        display "Dashboard: failed to start (check $DASHBOARD_LOG)"
    fi
else
    display "Dashboard: server.ts not found at $DASHBOARD_SCRIPT"
fi

respond '{}'
