'use strict';

/**
 * Timing Collector — Copy Chief BLACK Edition
 *
 * Reads hook-metrics.json written by SynapseEngine._persistHookMetrics()
 * after every UserPromptSubmit. Reports per-layer timing, identifies slow
 * hooks (>100ms), and flags stale data (>5min without a new prompt).
 *
 * Source: ~/copywriting-ecosystem/.synapse/metrics/hook-metrics.json
 *
 * @module core/synapse/diagnostics/collectors/timing-collector
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-12)
 */

const fs = require('fs');
const path = require('path');

/** Slow hook threshold in milliseconds. Hooks above this get flagged. */
const SLOW_HOOK_THRESHOLD_MS = 100;

/** Stale data threshold — metrics older than this are considered stale. */
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/** Per-layer slow threshold (individual layer within the pipeline). */
const SLOW_LAYER_THRESHOLD_MS = 20;

/**
 * Safely read and parse a JSON file.
 * @param {string} filePath
 * @returns {object|null}
 */
function _safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Collect hook execution timing from persisted metrics.
 *
 * Returns:
 * - name: 'timing'
 * - status: 'OK' | 'WARN' | 'FAIL'
 * - data.available: boolean — whether metrics file was found
 * - data.stale: boolean — data older than STALE_THRESHOLD_MS
 * - data.ageMs: number — age of the metrics file in ms
 * - data.totalDuration: number — full pipeline duration in ms
 * - data.hookBootMs: number — hook boot overhead in ms
 * - data.bracket: string — context bracket at last run
 * - data.slowHooks: string[] — hooks exceeding SLOW_HOOK_THRESHOLD_MS
 * - data.layers: Array<{ name, duration, status, rules, slow }>
 * - message: string — human-readable summary
 *
 * @param {string} projectRoot - Absolute path to copywriting-ecosystem root
 * @returns {{ name: string, status: string, data: object, message: string }}
 */
function collectTimingMetrics(projectRoot) {
  const metricsPath = path.join(projectRoot, '.synapse', 'metrics', 'hook-metrics.json');
  const now = Date.now();

  const metricsData = _safeReadJson(metricsPath);

  if (!metricsData) {
    return {
      name: 'timing',
      status: 'WARN',
      data: { available: false },
      message: 'hook-metrics.json not found — send a prompt first to generate metrics',
    };
  }

  // Staleness check
  const ageMs = metricsData.timestamp
    ? now - new Date(metricsData.timestamp).getTime()
    : 0;
  const stale = ageMs > STALE_THRESHOLD_MS;

  // Build per-layer stats
  const perLayer = metricsData.perLayer || {};
  const layers = Object.entries(perLayer).map(([name, info]) => {
    const duration = typeof info === 'number' ? info : (info.duration || 0);
    const status = typeof info === 'object' ? (info.status || 'unknown') : 'unknown';
    const rules = typeof info === 'object' ? (info.rules || 0) : 0;
    return {
      name,
      duration: Math.round(duration * 100) / 100,
      status,
      rules,
      slow: duration > SLOW_LAYER_THRESHOLD_MS,
    };
  });

  // Identify slow hooks (layers exceeding per-layer threshold)
  const slowLayers = layers.filter(l => l.slow).map(l => `${l.name}(${l.duration}ms)`);

  // Total pipeline slow check
  const totalDuration = metricsData.totalDuration || 0;
  const pipelineSlow = totalDuration > SLOW_HOOK_THRESHOLD_MS;

  // Determine overall status
  let status = 'OK';
  const warnings = [];

  if (stale) {
    warnings.push(`data stale (${Math.round(ageMs / 60000)}min old)`);
    status = 'WARN';
  }
  if (pipelineSlow) {
    warnings.push(`pipeline ${totalDuration.toFixed(1)}ms (threshold: ${SLOW_HOOK_THRESHOLD_MS}ms)`);
    status = 'WARN';
  }
  if (slowLayers.length > 0) {
    warnings.push(`slow layers: ${slowLayers.join(', ')}`);
    if (status === 'OK') status = 'WARN';
  }
  if ((metricsData.layersErrored || 0) > 0) {
    status = 'FAIL';
    warnings.unshift(`${metricsData.layersErrored} layer(s) errored`);
  }

  const message = warnings.length > 0
    ? warnings.join('; ')
    : `Pipeline ${totalDuration.toFixed(1)}ms, bracket: ${metricsData.bracket || 'unknown'}, layers loaded: ${metricsData.layersLoaded || 0}`;

  return {
    name: 'timing',
    status,
    data: {
      available: true,
      stale,
      ageMs,
      totalDuration: Math.round(totalDuration * 100) / 100,
      hookBootMs: metricsData.hookBootMs || 0,
      bracket: metricsData.bracket || 'unknown',
      layersLoaded: metricsData.layersLoaded || 0,
      layersSkipped: metricsData.layersSkipped || 0,
      layersErrored: metricsData.layersErrored || 0,
      totalRules: metricsData.totalRules || 0,
      slowHooks: slowLayers,
      layers,
      timestamp: metricsData.timestamp || null,
    },
    message,
  };
}

module.exports = {
  collectTimingMetrics,
  SLOW_HOOK_THRESHOLD_MS,
  STALE_THRESHOLD_MS,
  SLOW_LAYER_THRESHOLD_MS,
};
