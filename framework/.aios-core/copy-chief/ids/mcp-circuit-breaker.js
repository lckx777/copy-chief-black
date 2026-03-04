'use strict';

const path = require('path');
const fs = require('fs');

// Import base CircuitBreaker from AIOS Core
const { CircuitBreaker, STATE_CLOSED, STATE_OPEN, STATE_HALF_OPEN } = require(
  path.join(__dirname, '..', '..', 'core', 'ids', 'circuit-breaker')
);

const DEFAULT_STATE_PATH = path.join(
  process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'state', 'circuit-breakers.json'
);

const PROTECTED_TOOLS = [
  'mcp__copywriting__blind_critic',
  'mcp__copywriting__emotional_stress_test',
  'mcp__copywriting__validate_gate',
  'mcp__copywriting__black_validation',
  'mcp__copywriting__voc_search',
  'mcp__copywriting__write_chapter',
  'mcp__copywriting__layered_review',
  'mcp__copywriting__create_mecanismo',
  'mcp__copywriting__get_phase_context',
  'mcp__firecrawl__firecrawl_agent',
  'mcp__firecrawl__firecrawl_scrape',
  'mcp__firecrawl__firecrawl_search',
  'mcp__zen__consensus',
  'mcp__zen__thinkdeep',
  'mcp__zen__challenge',
  'mcp__zen__codereview',
  'mcp__fb_ad_library__get_meta_ads',
  'mcp__fb_ad_library__analyze_ad_video',
  'mcp__apify__call-actor',
  'mcp__apify__get-dataset-items',
];

const DEFAULT_OPTIONS = {
  failureThreshold: 5,
  successThreshold: 3,
  resetTimeoutMs: 60000,
};

class MCPCircuitBreakerRegistry {
  constructor(options = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      statePath: DEFAULT_STATE_PATH,
      debug: false,
      ...options,
    };

    this._breakers = new Map();
    this._protectedTools = new Set(options.protectedTools || PROTECTED_TOOLS);
  }

  getBreaker(toolName) {
    if (!this._breakers.has(toolName)) {
      this._breakers.set(toolName, new CircuitBreaker({
        failureThreshold: this.options.failureThreshold,
        successThreshold: this.options.successThreshold,
        resetTimeoutMs: this.options.resetTimeoutMs,
      }));
    }
    return this._breakers.get(toolName);
  }

  isProtected(toolName) {
    return this._protectedTools.has(toolName);
  }

  recordSuccess(toolName) {
    if (!this.isProtected(toolName)) return;
    const breaker = this.getBreaker(toolName);
    breaker.recordSuccess();
    this._log(`SUCCESS: ${toolName} — state: ${breaker.getState()}`);
  }

  recordFailure(toolName) {
    if (!this.isProtected(toolName)) return;
    const breaker = this.getBreaker(toolName);
    const previousState = breaker.getState();
    breaker.recordFailure();
    const newState = breaker.getState();

    this._log(`FAILURE: ${toolName} — ${previousState} -> ${newState}`);

    if (previousState !== STATE_OPEN && newState === STATE_OPEN) {
      this._log(`CIRCUIT OPENED: ${toolName} after ${this.options.failureThreshold} consecutive failures`);
    }
  }

  isAllowed(toolName) {
    if (!this.isProtected(toolName)) return { allowed: true, reason: 'not_protected' };

    const breaker = this.getBreaker(toolName);
    const allowed = breaker.isAllowed();
    const state = breaker.getState();

    if (!allowed) {
      const stats = breaker.getStats();
      return {
        allowed: false,
        reason: 'circuit_open',
        state,
        failureCount: stats.failureCount,
        totalTrips: stats.totalTrips,
        lastFailureTime: stats.lastFailureTime,
        message: this._buildWarningMessage(toolName, stats),
      };
    }

    return {
      allowed: true,
      reason: state === STATE_HALF_OPEN ? 'half_open_probe' : 'circuit_closed',
      state,
    };
  }

  getStatus() {
    const status = {};
    for (const [toolName, breaker] of this._breakers) {
      status[toolName] = breaker.getStats();
    }
    return status;
  }

  getOpenCircuits() {
    const open = [];
    for (const [toolName, breaker] of this._breakers) {
      const state = breaker.getState();
      if (state === STATE_OPEN || state === STATE_HALF_OPEN) {
        open.push({
          tool: toolName,
          state,
          stats: breaker.getStats(),
        });
      }
    }
    return open;
  }

  persist(statePath) {
    const targetPath = statePath || this.options.statePath;
    const state = {};

    for (const [toolName, breaker] of this._breakers) {
      state[toolName] = breaker.getStats();
    }

    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        breakers: state,
      }, null, 2), 'utf8');
      this._log(`State persisted to ${targetPath}`);
    } catch (e) {
      this._log(`Failed to persist state: ${e.message}`);
    }
  }

  restore(statePath) {
    const targetPath = statePath || this.options.statePath;

    if (!fs.existsSync(targetPath)) {
      this._log('No persisted state found');
      return false;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const data = JSON.parse(content);

      if (!data.breakers) return false;

      // Only restore failure counts, not states (let circuit breaker recalculate)
      for (const [toolName, stats] of Object.entries(data.breakers)) {
        if (this.isProtected(toolName)) {
          const breaker = this.getBreaker(toolName);
          // If tool had recent failures, pre-seed the failure count
          if (stats.failureCount > 0) {
            const timeSinceLastFailure = Date.now() - (stats.lastFailureTime || 0);
            // Only restore if failure was within last 5 minutes
            if (timeSinceLastFailure < 300000) {
              for (let i = 0; i < stats.failureCount; i++) {
                breaker.recordFailure();
              }
              this._log(`Restored ${toolName}: ${stats.failureCount} failures`);
            }
          }
        }
      }

      return true;
    } catch (e) {
      this._log(`Failed to restore state: ${e.message}`);
      return false;
    }
  }

  reset(toolName) {
    if (toolName) {
      const breaker = this._breakers.get(toolName);
      if (breaker) breaker.reset();
    } else {
      for (const breaker of this._breakers.values()) {
        breaker.reset();
      }
    }
  }

  _buildWarningMessage(toolName, stats) {
    const shortName = toolName.replace('mcp__copywriting__', '').replace('mcp__', '');
    const resetIn = Math.max(0, Math.ceil(
      (this.options.resetTimeoutMs - (Date.now() - stats.lastFailureTime)) / 1000
    ));

    return [
      `⚠️ CIRCUIT BREAKER OPEN: ${shortName}`,
      `${stats.failureCount} falhas consecutivas (threshold: ${this.options.failureThreshold}).`,
      `Circuito reabre em ~${resetIn}s para probe.`,
      `Trips totais: ${stats.totalTrips}.`,
      `Ação sugerida: verificar se o MCP server está respondendo.`,
    ].join(' ');
  }

  _log(message) {
    if (this.options.debug) {
      console.log(`[MCPCircuitBreaker] ${message}`);
    }
  }
}

module.exports = {
  MCPCircuitBreakerRegistry,
  PROTECTED_TOOLS,
  DEFAULT_OPTIONS,
  STATE_CLOSED,
  STATE_OPEN,
  STATE_HALF_OPEN,
};
