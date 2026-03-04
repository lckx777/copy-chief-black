'use strict';

/**
 * Gate Score Trend Analyzer (U-16)
 *
 * Analyzes gate audit trail entries to detect:
 * - Score regression (>10% drop over last 3 evaluations)
 * - Persistent low criteria (same criteria below threshold 3+ times)
 * - Improvement velocity (positive trend direction)
 *
 * @module gate-trend-analyzer
 * @version 1.0.0
 * @atom U-16
 */

const { readAuditTrail } = require('./gate-audit');

const REGRESSION_THRESHOLD_PERCENT = 10;
const PERSISTENT_LOW_COUNT = 3;
const MIN_ENTRIES_FOR_TREND = 3;

/**
 * Analyze trends from an audit trail array.
 *
 * @param {object[]} trail - Array of audit entries with { total_weighted, timestamp, criteria }
 * @returns {{ regression: boolean, direction: string, drop_percent: number, persistent_low: string[], velocity: number, entries_analyzed: number }}
 */
function analyzeTrends(trail) {
  const result = {
    regression: false,
    direction: 'stable',
    drop_percent: 0,
    persistent_low: [],
    velocity: 0,
    entries_analyzed: trail.length,
  };

  if (!trail || trail.length < MIN_ENTRIES_FOR_TREND) {
    return result;
  }

  // Sort by timestamp (oldest first)
  const sorted = [...trail].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const scores = sorted.map(e => e.total_weighted).filter(s => typeof s === 'number');
  if (scores.length < MIN_ENTRIES_FOR_TREND) return result;

  // Direction: compare first half average vs second half average
  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, mid);
  const secondHalf = scores.slice(mid);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 2) {
    result.direction = 'improving';
  } else if (secondAvg < firstAvg - 2) {
    result.direction = 'declining';
  }

  // Regression: check last 3 entries for >10% drop
  const recent = scores.slice(-3);
  if (recent.length >= 3) {
    const peak = Math.max(recent[0], recent[1]);
    const last = recent[recent.length - 1];
    if (peak > 0) {
      const drop = ((peak - last) / peak) * 100;
      result.drop_percent = Math.round(drop * 10) / 10;
      if (drop > REGRESSION_THRESHOLD_PERCENT) {
        result.regression = true;
      }
    }
  }

  // Velocity: score change per evaluation (last 3)
  if (scores.length >= 2) {
    const last3 = scores.slice(-3);
    const changes = [];
    for (let i = 1; i < last3.length; i++) {
      changes.push(last3[i] - last3[i - 1]);
    }
    result.velocity = Math.round((changes.reduce((a, b) => a + b, 0) / changes.length) * 10) / 10;
  }

  // Persistent low criteria
  const criteriaFailCounts = {};
  const recentEntries = sorted.slice(-PERSISTENT_LOW_COUNT);
  for (const entry of recentEntries) {
    if (!Array.isArray(entry.criteria)) continue;
    for (const c of entry.criteria) {
      const name = c.name || c.id;
      if (!name) continue;
      const score = c.score || c.weighted_score || 0;
      if (score < 6) {
        criteriaFailCounts[name] = (criteriaFailCounts[name] || 0) + 1;
      }
    }
  }
  for (const [name, count] of Object.entries(criteriaFailCounts)) {
    if (count >= PERSISTENT_LOW_COUNT) {
      result.persistent_low.push(name);
    }
  }

  return result;
}

/**
 * Analyze trends for a specific gate on an offer.
 *
 * @param {string} offerPath - Offer path (relative or absolute)
 * @param {string} gateName - Gate name (e.g., 'briefing', 'research', 'production')
 * @returns {object} Trend analysis result
 */
function analyzeGateTrends(offerPath, gateName) {
  const trail = readAuditTrail(offerPath, gateName);
  return analyzeTrends(trail);
}

module.exports = { analyzeTrends, analyzeGateTrends, REGRESSION_THRESHOLD_PERCENT, MIN_ENTRIES_FOR_TREND };
