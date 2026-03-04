'use strict';

/**
 * Synapse Performance Health Check
 *
 * Reads hook-metrics.json and alerts on degraded performance.
 * Pipeline > 50ms = WARN. Any layer > 20ms = WARN. Errors > 0 = FAIL.
 *
 * @module synapse-performance
 * @version 1.0.0
 * @atom U-04
 */

const fs = require('fs');
const path = require('path');

const METRICS_PATH = path.join(process.env.HOME, 'copywriting-ecosystem', '.synapse', 'metrics', 'hook-metrics.json');
const PIPELINE_WARN_MS = 50;
const LAYER_WARN_MS = 20;

/**
 * @returns {{ name: string, domain: string, severity: string, status: string, details: string }}
 */
function check() {
  const result = {
    name: 'synapse-performance',
    domain: 'LOCAL',
    severity: 'low',
    status: 'OK',
    details: '',
  };

  if (!fs.existsSync(METRICS_PATH)) {
    result.status = 'WARN';
    result.details = 'No metrics file found. Synapse engine may not have run yet.';
    return result;
  }

  let metrics;
  try {
    metrics = JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
  } catch {
    result.status = 'WARN';
    result.details = 'Cannot parse metrics file';
    return result;
  }

  const totalDuration = metrics.totalDuration || 0;
  const layersErrored = metrics.layersErrored || 0;
  const perLayer = metrics.perLayer || {};
  const warnings = [];

  // Check total pipeline time
  if (totalDuration > PIPELINE_WARN_MS) {
    warnings.push(`Pipeline: ${totalDuration}ms (threshold: ${PIPELINE_WARN_MS}ms)`);
  }

  // Check individual layers
  for (const [layer, timing] of Object.entries(perLayer)) {
    const duration = typeof timing === 'number' ? timing : timing?.duration || 0;
    if (duration > LAYER_WARN_MS) {
      warnings.push(`${layer}: ${duration}ms (threshold: ${LAYER_WARN_MS}ms)`);
    }
  }

  // Check errors
  if (layersErrored > 0) {
    result.status = 'FAIL';
    result.details = `${layersErrored} layers errored. ${warnings.join('; ')}`;
    return result;
  }

  if (warnings.length > 0) {
    result.status = 'WARN';
    result.details = warnings.join('; ');
  } else {
    result.details = `Pipeline: ${totalDuration}ms, bracket: ${metrics.bracket || 'unknown'}, layers: ${metrics.layersLoaded || 0}`;
  }

  return result;
}

module.exports = { check };
