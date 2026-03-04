'use strict';

/**
 * Dashboard Emitter — Lightweight event emitter for Copy Chief pipeline events.
 * Part of AIOS Core: copy-chief/observability
 *
 * Complements dashboard-client.ts. While dashboard-client handles tool-use events
 * (PostToolUse), this module handles high-level Copy Chief lifecycle events:
 * agent lifecycle, command flow, phase transitions, gate evaluations, dispatches.
 *
 * Non-blocking: fire-and-forget with 500ms timeout.
 * Fallback: JSONL append to ~/.claude/session-state/event-log.jsonl when HTTP fails.
 *
 * Usage:
 *   const { emit, EVENT_TYPES } = require('./dashboard-emitter');
 *   emit(EVENT_TYPES.AGENT_ACTIVATED, { agent_id: 'vox', offer: 'saude/florayla' });
 *
 * @module dashboard-emitter
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:4001';
const EVENT_LOG_PATH = path.join(
  process.env.HOME || '',
  '.claude',
  'session-state',
  'event-log.jsonl'
);
const EVENT_LOG_DIR = path.dirname(EVENT_LOG_PATH);
const EMIT_TIMEOUT_MS = 500;

/**
 * Supported Copy Chief lifecycle event types.
 */
const EVENT_TYPES = {
  AGENT_ACTIVATED:    'agent_activated',
  AGENT_DEACTIVATED:  'agent_deactivated',
  COMMAND_START:      'command_start',
  COMMAND_COMPLETE:   'command_complete',
  COMMAND_ERROR:      'command_error',
  PHASE_CHANGE:       'phase_change',
  GATE_EVALUATED:     'gate_evaluated',
  DISPATCH_QUEUED:    'dispatch_queued',
};

// ─── Session ID ───────────────────────────────────────────────────────────────

/**
 * Resolve a stable session ID from environment or PPID.
 * Mirrors the pattern in dashboard-client.ts without file I/O.
 *
 * @returns {string}
 */
function _resolveSessionId() {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  if (process.env.SESSION_ID) return process.env.SESSION_ID;
  const ppid = process.ppid || process.pid;
  const date = new Date().toISOString().slice(0, 10);
  return `claude-${ppid}-${date}`;
}

// ─── Fallback JSONL ───────────────────────────────────────────────────────────

/**
 * Append a serialized event to the JSONL fallback log. Best-effort.
 *
 * @param {object} event
 */
function _appendToLog(event) {
  try {
    if (!fs.existsSync(EVENT_LOG_DIR)) {
      fs.mkdirSync(EVENT_LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(EVENT_LOG_PATH, JSON.stringify(event) + '\n', 'utf8');
  } catch {
    // Silently swallow — emitter must never throw
  }
}

// ─── Core emit ────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget HTTP POST to the dashboard server.
 * Falls back to JSONL append if HTTP fails or times out.
 *
 * Auto-enriches every event with:
 *   - timestamp (ms since epoch)
 *   - session_id (stable per PPID)
 *   - event_type
 *
 * @param {string} eventType - One of EVENT_TYPES values
 * @param {object} [data={}]  - Event-specific payload
 */
function emit(eventType, data = {}) {
  const event = {
    timestamp: Date.now(),
    session_id: _resolveSessionId(),
    event_type: eventType,
    ...data,
  };

  // Non-blocking: do not await
  _post(event).catch(() => {
    _appendToLog(event);
  });
}

/**
 * Internal HTTP POST with AbortSignal timeout.
 *
 * @param {object} event
 * @returns {Promise<void>}
 */
async function _post(event) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMIT_TIMEOUT_MS);

  try {
    const response = await fetch(`${DASHBOARD_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      signal: controller.signal,
    });

    // Non-2xx is treated as failure → fallback
    if (!response.ok) {
      _appendToLog(event);
    }
  } catch {
    // Network error, timeout, or AbortError → fallback
    _appendToLog(event);
  } finally {
    clearTimeout(timer);
  }
}

// ─── Event Log Reader ─────────────────────────────────────────────────────────

/**
 * Read the last N events from the JSONL fallback log.
 * Returns newest-first. Returns [] if file doesn't exist or is unreadable.
 *
 * @param {number} [limit=50]
 * @returns {object[]}
 */
function getEventLog(limit = 50) {
  try {
    if (!fs.existsSync(EVENT_LOG_PATH)) return [];

    const raw = fs.readFileSync(EVENT_LOG_PATH, 'utf8');
    const lines = raw
      .split('\n')
      .filter(l => l.trim().length > 0);

    // Parse from end (newest last in JSONL)
    const results = [];
    for (let i = lines.length - 1; i >= 0 && results.length < limit; i--) {
      try {
        results.push(JSON.parse(lines[i]));
      } catch {
        // Skip malformed lines
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── Singleton guard (module is cached by Node require) ───────────────────────

module.exports = { emit, getEventLog, EVENT_TYPES };
