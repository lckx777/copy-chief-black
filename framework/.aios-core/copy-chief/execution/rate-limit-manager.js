'use strict';

/**
 * Rate Limit Manager
 *
 * Per-tool sliding-window rate limiting with exponential backoff.
 * Adapted from Synkra's rate-limit-manager.js.
 * Complements mcp-circuit-breaker.js (breaker = failure protection,
 * rate limiter = throughput protection).
 *
 * - Sliding window: 1 minute
 * - Default limit: 10 calls/minute per tool
 * - Backoff: 1s → 2s → 4s → 8s → 16s with ±20% jitter
 * - Event log: last 50 rate-limit events
 *
 * @module rate-limit-manager
 * @version 1.0.0
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_MS = 60 * 1000;           // 1-minute sliding window
const DEFAULT_LIMIT = 10;              // calls per window
const MAX_EVENT_LOG = 50;             // max stored rate-limit events
const BACKOFF_BASE_MS = 1000;         // base backoff: 1 second
const BACKOFF_MAX_EXPONENT = 4;       // max exponent → 16s
const JITTER_FACTOR = 0.20;           // ±20% jitter

/**
 * Per-tool overrides.
 * Expensive or quota-sensitive tools get lower limits.
 */
const TOOL_LIMITS = {
  // MCP Copywriting
  'mcp__copywriting__blind_critic': 5,
  'mcp__copywriting__emotional_stress_test': 5,
  'mcp__copywriting__black_validation': 3,
  'mcp__copywriting__validate_gate': 8,
  'mcp__copywriting__write_chapter': 6,
  'mcp__copywriting__layered_review': 5,
  'mcp__copywriting__voc_search': 10,
  // MCP Firecrawl
  'mcp__firecrawl__firecrawl_scrape': 8,
  'mcp__firecrawl__firecrawl_search': 8,
  'mcp__firecrawl__firecrawl_agent': 3,
  // MCP Zen (heavy LLM tools)
  'mcp__zen__consensus': 4,
  'mcp__zen__thinkdeep': 4,
  'mcp__zen__challenge': 4,
  'mcp__zen__codereview': 4,
  // Meta Ads
  'mcp__fb_ad_library__get_meta_ads': 6,
  'mcp__fb_ad_library__analyze_ad_video': 4,
  // Apify
  'mcp__apify__call-actor': 5,
  'mcp__apify__get-dataset-items': 8,
};

// ─── Internal State ───────────────────────────────────────────────────────────

/**
 * Per-tool call timestamps (ms epoch), kept in a sliding window.
 * @type {Map<string, number[]>}
 */
const _callTimestamps = new Map();

/**
 * Per-tool backoff state: how many consecutive rate-limit hits.
 * @type {Map<string, number>}
 */
const _backoffCounts = new Map();

/**
 * Global event log (rate-limit events only).
 * @type {Array<{timestamp: string, tool: string, event: string, wait_ms?: number}>}
 */
const _eventLog = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the configured limit for a tool.
 */
function _limitFor(toolName) {
  return TOOL_LIMITS[toolName] !== undefined ? TOOL_LIMITS[toolName] : DEFAULT_LIMIT;
}

/**
 * Remove timestamps outside the current window.
 */
function _pruneWindow(toolName) {
  const cutoff = Date.now() - WINDOW_MS;
  const timestamps = _callTimestamps.get(toolName) || [];
  const pruned = timestamps.filter((t) => t > cutoff);
  _callTimestamps.set(toolName, pruned);
  return pruned;
}

/**
 * Add a rate-limit event to the bounded event log.
 */
function _logEvent(tool, event, extra = {}) {
  _eventLog.push({
    timestamp: new Date().toISOString(),
    tool,
    event,
    ...extra,
  });
  // Keep log bounded
  if (_eventLog.length > MAX_EVENT_LOG) {
    _eventLog.splice(0, _eventLog.length - MAX_EVENT_LOG);
  }
}

/**
 * Compute exponential backoff with jitter.
 * Exponent capped at BACKOFF_MAX_EXPONENT to prevent excessive wait.
 *
 * @param {number} consecutiveHits - Number of consecutive rate-limit hits for this tool
 * @returns {number} Wait time in ms
 */
function _backoffMs(consecutiveHits) {
  const exponent = Math.min(consecutiveHits, BACKOFF_MAX_EXPONENT);
  const base = BACKOFF_BASE_MS * Math.pow(2, exponent);
  // Jitter: uniformly random in [base * (1 - JITTER), base * (1 + JITTER)]
  const jitter = base * JITTER_FACTOR * (2 * Math.random() - 1);
  return Math.max(0, Math.round(base + jitter));
}

/**
 * Sleep for ms milliseconds.
 */
function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Core API ─────────────────────────────────────────────────────────────────

/**
 * Check if a call to toolName is allowed right now.
 *
 * @param {string} toolName
 * @returns {boolean}
 */
function canCall(toolName) {
  const timestamps = _pruneWindow(toolName);
  return timestamps.length < _limitFor(toolName);
}

/**
 * Record a call to toolName (call after the actual invocation).
 * Also resets the backoff counter for this tool (successful slot acquisition).
 *
 * @param {string} toolName
 */
function recordCall(toolName) {
  const timestamps = _pruneWindow(toolName);
  timestamps.push(Date.now());
  _callTimestamps.set(toolName, timestamps);
  // Reset backoff on successful call
  _backoffCounts.set(toolName, 0);
}

/**
 * Get the estimated wait time in ms until a slot opens for toolName.
 * Returns 0 if a call is already allowed.
 *
 * @param {string} toolName
 * @returns {number} Milliseconds to wait
 */
function getWaitTime(toolName) {
  if (canCall(toolName)) return 0;

  const timestamps = _pruneWindow(toolName);
  const limit = _limitFor(toolName);
  if (timestamps.length < limit) return 0;

  // The oldest timestamp within the window — when it expires, a slot opens
  const oldest = timestamps[timestamps.length - limit];
  const expiresAt = oldest + WINDOW_MS;
  return Math.max(0, expiresAt - Date.now());
}

/**
 * Wrapper that respects rate limits before calling fn.
 * Waits if necessary (using exponential backoff on repeated hits).
 * Records the call after fn resolves.
 *
 * @param {string} toolName
 * @param {Function} fn - Async function to invoke
 * @returns {Promise<*>} Result of fn()
 */
async function withRateLimit(toolName, fn) {
  // Check if we're allowed
  if (!canCall(toolName)) {
    const hits = (_backoffCounts.get(toolName) || 0);
    const waitMs = _backoffMs(hits);
    _backoffCounts.set(toolName, hits + 1);
    _logEvent(toolName, 'rate_limited', { wait_ms: waitMs, consecutive_hits: hits + 1 });

    await _sleep(waitMs);

    // After sleeping, check again (another caller may have filled the slot)
    if (!canCall(toolName)) {
      const window = getWaitTime(toolName);
      if (window > 0) {
        _logEvent(toolName, 'secondary_wait', { wait_ms: window });
        await _sleep(window + 50); // +50ms buffer
      }
    }
  }

  // Record the call before invoking (counts against the window)
  recordCall(toolName);

  try {
    return await fn();
  } catch (err) {
    // Not a rate limit issue — propagate the error
    throw err;
  }
}

/**
 * Get statistics for all tools that have been seen in this session.
 *
 * @returns {object} Map of toolName → { calls_in_window, limit, utilization_pct, backoff_hits }
 */
function getStats() {
  const stats = {};

  for (const [tool, timestamps] of _callTimestamps.entries()) {
    const cutoff = Date.now() - WINDOW_MS;
    const active = timestamps.filter((t) => t > cutoff);
    const limit = _limitFor(tool);
    stats[tool] = {
      calls_in_window: active.length,
      limit,
      utilization_pct: Math.round((active.length / limit) * 100),
      backoff_hits: _backoffCounts.get(tool) || 0,
    };
  }

  return {
    tools: stats,
    event_log: [..._eventLog],
    window_ms: WINDOW_MS,
    default_limit: DEFAULT_LIMIT,
  };
}

/**
 * Reset the rate limit state for a specific tool.
 * Useful for testing or after a forced cooldown.
 *
 * @param {string} toolName
 */
function resetTool(toolName) {
  _callTimestamps.delete(toolName);
  _backoffCounts.delete(toolName);
  _logEvent(toolName, 'reset');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  canCall,
  recordCall,
  getWaitTime,
  withRateLimit,
  getStats,
  resetTool,
  // Constants (exposed for callers that need to read limits)
  TOOL_LIMITS,
  DEFAULT_LIMIT,
  WINDOW_MS,
};
