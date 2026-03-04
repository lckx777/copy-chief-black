'use strict';

/**
 * Report Formatter — Copy Chief BLACK Edition
 *
 * Generates a structured markdown report from the 4 Copy Chief collector results:
 * - timing: hook pipeline timing + slow layer detection
 * - quality: agent activation + hook layer quality scoring
 * - consistency: cross-file state validation
 * - hooks: heartbeat health per hook
 *
 * Sections:
 *   1. Summary (overall health score + active agents)
 *   2. Timing Analysis (per-layer pipeline timing)
 *   3. Context Quality (UAP-equivalent + hook layers, graded)
 *   4. Consistency Checks (4 cross-file validations)
 *   5. Hook Heartbeats (per-hook health from .hook-health/)
 *   6. Gaps & Recommendations (all WARN/FAIL items with fixes)
 *
 * @module core/synapse/diagnostics/report-formatter
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-13)
 */

// Status display helpers
const STATUS_EMOJI = { OK: '[OK]', WARN: '[WARN]', FAIL: '[FAIL]', PASS: '[OK]', UNKNOWN: '[?]' };

/**
 * Get status display string.
 * @param {string} status
 * @returns {string}
 */
function _statusBadge(status) {
  return STATUS_EMOJI[status] || `[${status}]`;
}

/**
 * Detect active agents from diagnostics _meta field.
 * @param {object} data - Full collector results
 * @returns {{ agents: string[], primary: string|null }}
 */
function _extractAgents(data) {
  const meta = data._meta || {};
  return {
    agents: meta.activeAgents || [],
    primary: meta.primaryAgent || null,
  };
}

// ---------------------------------------------------------------------------
// Section formatters
// ---------------------------------------------------------------------------

/**
 * Section 1: Summary — overall health derived from all collector statuses.
 *
 * @param {string[]} lines
 * @param {object} data
 */
function _formatSummary(lines, data) {
  const timestamp = (data._meta && data._meta.timestamp) || new Date().toISOString();
  const agentInfo = _extractAgents(data);

  // Compute overall health from all collectors
  const collectorNames = ['timing', 'quality', 'consistency', 'hooks'];
  const statuses = collectorNames.map(name => {
    const c = data[name];
    if (!c || c.error) return 'WARN';
    return c.status || 'WARN';
  });

  const failCount = statuses.filter(s => s === 'FAIL').length;
  const warnCount = statuses.filter(s => s === 'WARN').length;
  const okCount = statuses.filter(s => s === 'OK').length;

  let overallStatus = 'OK';
  let overallScore = 100;
  if (failCount > 0) { overallStatus = 'FAIL'; overallScore = Math.max(0, 100 - failCount * 25 - warnCount * 10); }
  else if (warnCount > 0) { overallStatus = 'WARN'; overallScore = Math.max(0, 100 - warnCount * 15); }

  lines.push('# SYNAPSE Diagnostic Report — Copy Chief BLACK');
  lines.push(`**Timestamp:** ${timestamp}`);
  lines.push(`**Overall Health:** ${_statusBadge(overallStatus)} ${overallScore}/100`);
  lines.push(`**Collectors:** ${okCount} OK, ${warnCount} WARN, ${failCount} FAIL`);

  // Active agents
  if (agentInfo.agents.length > 0) {
    const agentList = agentInfo.agents.map(a => `@${a}`).join(', ');
    lines.push(`**Active Agents:** ${agentList}`);
  } else {
    lines.push('**Active Agents:** none (idle session)');
  }

  // Bracket from timing
  const timing = data.timing;
  if (timing && timing.data && timing.data.available) {
    const bracket = timing.data.bracket || 'unknown';
    const totalMs = timing.data.totalDuration || 0;
    lines.push(`**Bracket:** ${bracket} | **Pipeline:** ${totalMs.toFixed(1)}ms`);
  }

  lines.push('');
  lines.push('| Collector | Status | Summary |');
  lines.push('|-----------|--------|---------|');
  for (const name of collectorNames) {
    const c = data[name];
    const s = c && !c.error ? c.status : 'WARN';
    const msg = c && !c.error ? (c.message || '-') : (c ? c.message : 'collector not loaded');
    lines.push(`| ${name} | ${_statusBadge(s)} | ${msg} |`);
  }
  lines.push('');
}

/**
 * Section 2: Timing Analysis — per-layer pipeline timing from hook-metrics.json.
 *
 * @param {string[]} lines
 * @param {object} timing
 */
function _formatTiming(lines, timing) {
  lines.push('## 1. Timing Analysis');

  if (!timing || timing.error || !timing.data || !timing.data.available) {
    lines.push('*No timing data available — send a prompt first to generate hook-metrics.json*');
    lines.push('');
    return;
  }

  const d = timing.data;
  const staleTag = d.stale ? ' **[STALE]**' : '';
  const bootStr = d.hookBootMs > 0 ? `, boot: ${d.hookBootMs.toFixed(1)}ms` : '';
  lines.push(`**Pipeline:** ${d.totalDuration.toFixed(1)}ms${bootStr}, bracket: **${d.bracket}**${staleTag}`);
  lines.push(`**Layers:** ${d.layersLoaded} loaded, ${d.layersSkipped} skipped, ${d.layersErrored} errored | **Rules injected:** ${d.totalRules}`);

  if (d.slowHooks && d.slowHooks.length > 0) {
    lines.push(`**Slow layers (>${timing.data.slowHooks.length > 0 ? '20ms' : '?'}):** ${d.slowHooks.join(', ')}`);
  }
  lines.push('');

  if (d.layers && d.layers.length > 0) {
    lines.push('| Layer | Duration | Status | Rules | Slow? |');
    lines.push('|-------|----------|--------|-------|-------|');
    for (const layer of d.layers) {
      const slowFlag = layer.slow ? 'YES' : '-';
      lines.push(`| ${layer.name} | ${layer.duration}ms | ${layer.status} | ${layer.rules} | ${slowFlag} |`);
    }
    const totalLoaded = d.layers.filter(l => l.status === 'ok').length;
    lines.push(`| **Total** | **${d.totalDuration.toFixed(1)}ms** | ${totalLoaded} ok | **${d.totalRules}** | |`);
  }
  lines.push('');
}

/**
 * Section 3: Context Quality — agent activation + hook layer scoring.
 *
 * @param {string[]} lines
 * @param {object} quality
 */
function _formatQuality(lines, quality) {
  lines.push('## 2. Context Quality');

  if (!quality || quality.error || !quality.data) {
    lines.push('*No quality data available*');
    lines.push('');
    return;
  }

  const d = quality.data;
  const overall = d.overall || { score: 0, grade: 'F', label: 'UNKNOWN' };
  lines.push(`**Overall: ${overall.score}/100 (${overall.grade} — ${overall.label})**`);

  const agentScore = d.agentActivation ? d.agentActivation.normalizedScore : 0;
  const hookScore = d.hookLayers ? d.hookLayers.normalizedScore : 0;
  const agentAvail = d.agentActivation && d.agentActivation.available;
  const hookAvail = d.hookLayers && d.hookLayers.available;
  lines.push(`Agent Activation: ${agentAvail ? agentScore + '/100' : 'n/a'} | Hook Layers: ${hookAvail ? hookScore + '/100' : 'n/a'}`);
  lines.push('');

  // Agent activation loaders table
  if (agentAvail && d.agentActivation.loaders && d.agentActivation.loaders.length > 0) {
    const agentId = d.agentActivation.agentId || 'unknown';
    const offer = d.agentActivation.offer || 'none';
    lines.push(`### Agent Activation Context (@${agentId}, offer: ${offer})`);
    lines.push('| Component | Score | Max | Criticality | Impact |');
    lines.push('|-----------|-------|-----|-------------|--------|');
    for (const loader of d.agentActivation.loaders) {
      const statusFlag = loader.status !== 'ok' ? ` *(${loader.status})*` : '';
      lines.push(`| ${loader.name}${statusFlag} | ${loader.score} | ${loader.maxScore} | ${loader.criticality} | ${loader.impact} |`);
    }
    lines.push('');
  }

  // Hook layers table
  if (hookAvail && d.hookLayers.layers && d.hookLayers.layers.length > 0) {
    const bracket = d.hookLayers.bracket || 'unknown';
    lines.push(`### SYNAPSE Hook Layers (${bracket} bracket)`);
    lines.push('| Layer | Score | Max | Criticality | Rules | Impact |');
    lines.push('|-------|-------|-----|-------------|-------|--------|');
    for (const layer of d.hookLayers.layers) {
      if (layer.maxScore === 0) continue; // not expected in this bracket
      const statusFlag = layer.status !== 'ok' && layer.status !== 'not-expected' ? ` *(${layer.status})*` : '';
      lines.push(`| ${layer.name}${statusFlag} | ${layer.score} | ${layer.maxScore} | ${layer.criticality} | ${layer.rules} | ${layer.impact} |`);
    }
    lines.push('');
  }
}

/**
 * Section 4: Consistency Checks.
 *
 * @param {string[]} lines
 * @param {object} consistency
 */
function _formatConsistency(lines, consistency) {
  lines.push('## 3. Consistency Checks');

  if (!consistency || consistency.error || !consistency.data || !consistency.data.available) {
    lines.push('*No consistency data available*');
    lines.push('');
    return;
  }

  const d = consistency.data;
  lines.push(`**Score:** ${d.score}/${d.maxScore}`);
  lines.push('');
  lines.push('| Check | Status | Detail |');
  lines.push('|-------|--------|--------|');
  for (const check of d.checks) {
    lines.push(`| ${check.name} | ${_statusBadge(check.status)} | ${check.detail} |`);
  }
  lines.push('');
}

/**
 * Section 5: Hook Heartbeats.
 *
 * @param {string[]} lines
 * @param {object} hooks
 */
function _formatHookHeartbeats(lines, hooks) {
  lines.push('## 4. Hook Heartbeats');

  if (!hooks || hooks.error) {
    lines.push('*No hook heartbeat data available*');
    lines.push('');
    return;
  }

  const d = hooks.data || {};

  if (!d.available) {
    lines.push(`*${hooks.message || 'Heartbeat directory not found'}*`);
    lines.push('');
    return;
  }

  lines.push(`**${d.totalHooks} hook(s)** | ${d.healthyCount} healthy, ${d.warnCount} warn, ${d.failCount} failing, ${d.staleCount} stale`);
  lines.push('');

  if (d.hooks && d.hooks.length > 0) {
    lines.push('| Hook | Status | Last Success | Errors | Total Runs | Detail |');
    lines.push('|------|--------|--------------|--------|------------|--------|');
    for (const hook of d.hooks) {
      const lastSuccess = hook.lastSuccess
        ? new Date(hook.lastSuccess).toISOString().slice(11, 19) + 'Z'
        : 'never';
      lines.push(`| ${hook.hookName} | ${_statusBadge(hook.status)} | ${lastSuccess} | ${hook.errorCount} | ${hook.totalRuns} | ${hook.detail} |`);
    }
  } else {
    lines.push('*No heartbeat files found*');
  }
  lines.push('');
}

/**
 * Section 6: Gaps & Recommendations.
 * Collects all WARN/FAIL items from all collectors and provides actionable fixes.
 *
 * @param {string[]} lines
 * @param {object} data - Full collector results
 */
function _formatGaps(lines, data) {
  lines.push('## 5. Gaps & Recommendations');

  const gaps = _collectGaps(data);

  if (gaps.length === 0) {
    lines.push('| # | Severity | Gap | Recommendation |');
    lines.push('|---|----------|-----|----------------|');
    lines.push('| - | - | None | Pipeline operating correctly |');
  } else {
    lines.push('| # | Severity | Gap | Recommendation |');
    lines.push('|---|----------|-----|----------------|');
    gaps.forEach((gap, i) => {
      lines.push(`| ${i + 1} | ${gap.severity} | ${gap.gap} | ${gap.recommendation} |`);
    });
  }
  lines.push('');
}

/**
 * Collect all gaps from all collector results.
 *
 * @param {object} data - Full collector results
 * @returns {Array<{ severity: string, gap: string, recommendation: string }>}
 */
function _collectGaps(data) {
  const gaps = [];

  // Timing gaps
  const timing = data.timing;
  if (timing && !timing.error && timing.data) {
    if (timing.data.layersErrored > 0) {
      gaps.push({
        severity: 'HIGH',
        gap: `Synapse: ${timing.data.layersErrored} layer(s) errored`,
        recommendation: 'Check ~/.claude/hooks/synapse-engine.cjs and layer module files for syntax errors',
      });
    }
    if (timing.data.stale) {
      gaps.push({
        severity: 'LOW',
        gap: 'Synapse metrics stale (>5min)',
        recommendation: 'Send a prompt to trigger the synapse-engine hook and refresh metrics',
      });
    }
    if (timing.data.slowHooks && timing.data.slowHooks.length > 0) {
      gaps.push({
        severity: 'LOW',
        gap: `Slow layer(s): ${timing.data.slowHooks.join(', ')}`,
        recommendation: 'Review slow layers for expensive I/O — consider caching or lazy loading',
      });
    }
  } else if (timing && !timing.data.available) {
    gaps.push({
      severity: 'MEDIUM',
      gap: 'hook-metrics.json not found',
      recommendation: 'Send a prompt to generate metrics, or check synapse-engine.cjs is wired in settings.json',
    });
  }

  // Quality gaps
  const quality = data.quality;
  if (quality && !quality.error && quality.data) {
    const overall = quality.data.overall || {};
    if (overall.grade === 'F') {
      gaps.push({
        severity: 'HIGH',
        gap: `Context quality: ${overall.score}/100 (${overall.grade} — ${overall.label})`,
        recommendation: 'Activate an agent (@persona) to load context — check agent .md file exists in ~/.claude/agents/',
      });
    } else if (overall.grade === 'D') {
      gaps.push({
        severity: 'MEDIUM',
        gap: `Context quality below threshold: ${overall.score}/100 (${overall.grade})`,
        recommendation: 'Check agent activation pipeline — ensure memories/, CONTEXT.md, and craft/ data are present',
      });
    }

    // Check for missing critical agent loaders
    const agentLoaders = quality.data.agentActivation && quality.data.agentActivation.loaders || [];
    for (const loader of agentLoaders) {
      if (loader.criticality === 'CRITICAL' && loader.status === 'missing') {
        gaps.push({
          severity: 'HIGH',
          gap: `Agent loader missing: ${loader.name}`,
          recommendation: `Create/restore the required file for "${loader.name}" — ${loader.impact}`,
        });
      }
    }
  }

  // Consistency gaps
  const consistency = data.consistency;
  if (consistency && !consistency.error && consistency.data) {
    for (const check of consistency.data.checks || []) {
      if (check.status === 'FAIL') {
        gaps.push({
          severity: 'MEDIUM',
          gap: `Consistency: ${check.name} — ${check.detail}`,
          recommendation: _consistencyRecommendation(check.name),
        });
      }
    }
  }

  // Hook heartbeat gaps
  const hooks = data.hooks;
  if (hooks && !hooks.error && hooks.data) {
    for (const hook of (hooks.data.hooks || [])) {
      if (hook.status === 'FAIL') {
        gaps.push({
          severity: 'HIGH',
          gap: `Hook failing: ${hook.hookName} (${hook.errorCount} errors)`,
          recommendation: `Inspect ~/.claude/hooks/${hook.hookName}.cjs — fix runtime errors and re-test`,
        });
      }
    }
    if (!hooks.data.available) {
      gaps.push({
        severity: 'LOW',
        gap: 'No hook heartbeat data',
        recommendation: 'Hooks may not have writeHeartbeat() calls — no action needed unless hooks are failing silently',
      });
    }
  }

  // Sort by severity
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  gaps.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));

  return gaps;
}

/**
 * Map consistency check name to a recommendation string.
 * @param {string} checkName
 * @returns {string}
 */
function _consistencyRecommendation(checkName) {
  const recs = {
    'bracket-consistency': 'Re-run synapse-engine hook to regenerate hook-metrics.json with valid bracket',
    'agent-consistency': 'Check active-agents.json and remove stale entries, or add agent to core-config.yaml',
    'timestamp-consistency': 'Re-activate agent with @persona to refresh timestamps',
    'config-consistency': 'Restore missing sections in ~/.claude/.aios-core/core-config.yaml',
  };
  return recs[checkName] || 'Investigate the inconsistency and re-activate the agent';
}

// ---------------------------------------------------------------------------
// Main formatter
// ---------------------------------------------------------------------------

/**
 * Format a complete diagnostic report from Copy Chief collector results.
 *
 * @param {object} data - Raw collector results from synapse-diagnostics._collectAll()
 * @returns {string} Formatted markdown report
 */
function formatReport(data) {
  if (!data || typeof data !== 'object') {
    return '# SYNAPSE Diagnostic Report\n**Error:** No diagnostic data provided.\n';
  }

  const lines = [];

  _formatSummary(lines, data);
  _formatTiming(lines, data.timing);
  _formatQuality(lines, data.quality);
  _formatConsistency(lines, data.consistency);
  _formatHookHeartbeats(lines, data.hooks);
  _formatGaps(lines, data);

  lines.push('---');
  lines.push('*Copy Chief BLACK — Synapse Diagnostics v2.0*');

  return lines.join('\n');
}

module.exports = { formatReport };
