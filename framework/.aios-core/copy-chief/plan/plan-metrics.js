'use strict';

/**
 * Plan Metrics
 *
 * Collects and analyzes execution plan timing metrics.
 * Tracks estimated vs actual duration, bottlenecks, velocity.
 *
 * @module plan-metrics
 * @version 1.0.0
 * @atom U-25
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Record task start time.
 *
 * @param {object} plan - Execution plan object
 * @param {string} taskId - Task ID
 */
function recordTaskStart(plan, taskId) {
  const task = plan.tasks?.find(t => t.id === taskId);
  if (task) {
    task.started_at = new Date().toISOString();
  }
}

/**
 * Record task completion with duration.
 *
 * @param {object} plan - Execution plan object
 * @param {string} taskId - Task ID
 */
function recordTaskCompletion(plan, taskId) {
  const task = plan.tasks?.find(t => t.id === taskId);
  if (!task) return;

  task.completed_at = new Date().toISOString();

  if (task.started_at) {
    const startMs = new Date(task.started_at).getTime();
    const endMs = new Date(task.completed_at).getTime();
    task.actual_duration_minutes = Math.round((endMs - startMs) / 60000 * 10) / 10;
  }
}

/**
 * Generate plan summary with metrics.
 *
 * @param {object} plan - Execution plan object
 * @returns {{ estimatedMinutes: number, actualMinutes: number, velocity: number, bottleneck: string|null, taskMetrics: object[] }}
 */
function getSummary(plan) {
  if (!plan?.tasks) return { estimatedMinutes: 0, actualMinutes: 0, velocity: 0, bottleneck: null, taskMetrics: [] };

  const taskMetrics = [];
  let totalEstimated = 0;
  let totalActual = 0;
  let completedCount = 0;
  let slowestTask = null;
  let slowestDuration = 0;

  for (const task of plan.tasks) {
    const estimated = task.expected_duration_minutes || 0;
    const actual = task.actual_duration_minutes || 0;

    totalEstimated += estimated;
    if (actual > 0) {
      totalActual += actual;
      completedCount++;
    }

    if (actual > slowestDuration) {
      slowestDuration = actual;
      slowestTask = task.id;
    }

    taskMetrics.push({
      id: task.id,
      agent: task.agent,
      estimated,
      actual,
      status: task.status,
      delta: actual > 0 ? Math.round((actual - estimated) * 10) / 10 : null,
    });
  }

  const velocity = completedCount > 0
    ? Math.round((completedCount / (totalActual / 60)) * 10) / 10
    : 0;

  return {
    estimatedMinutes: totalEstimated,
    actualMinutes: Math.round(totalActual * 10) / 10,
    velocity, // tasks per hour
    bottleneck: slowestTask,
    bottleneckDuration: slowestDuration,
    completedTasks: completedCount,
    totalTasks: plan.tasks.length,
    taskMetrics,
  };
}

/**
 * Format metrics as human-readable text.
 *
 * @param {object} plan - Execution plan object
 * @returns {string}
 */
function formatMetrics(plan) {
  const summary = getSummary(plan);
  const lines = [
    `Plan Metrics: ${summary.completedTasks}/${summary.totalTasks} tasks completed`,
    `  Estimated: ${summary.estimatedMinutes} min`,
    `  Actual:    ${summary.actualMinutes} min`,
    `  Velocity:  ${summary.velocity} tasks/hour`,
  ];

  if (summary.bottleneck) {
    lines.push(`  Bottleneck: ${summary.bottleneck} (${summary.bottleneckDuration} min)`);
  }

  return lines.join('\n');
}

module.exports = { recordTaskStart, recordTaskCompletion, getSummary, formatMetrics };
