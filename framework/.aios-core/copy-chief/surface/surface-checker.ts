// ~/.claude/hooks/lib/surface-checker.ts
// Surface Checker — Evaluates context against criteria to determine when human input is needed
// Adapted from AIOS surface-checker.js (404 lines) simplified for DR Copy
// Part of P0: Surface Checker + Decision Queue (AIOS Gap Closure)
// Created: 2026-02-24

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { homedir } from 'os';
import { queueDecision, type DecisionAction, type DecisionPriority } from './decision-queue';

const HOME = homedir();
const CRITERIA_PATH = join(HOME, '.claude', 'copy-surface-criteria.yaml');

// ==========================================
// Types
// ==========================================

interface CriterionDef {
  description: string;
  condition: string;
  action: DecisionAction;
  priority: DecisionPriority;
  blocking: boolean;
  bypass: boolean;
  message: string;
  context_fields: string[];
  auto_resolve_after_hours?: number;
  auto_resolve_choice?: string;
}

interface CriteriaConfig {
  version: string;
  evaluation_order: string[];
  criteria: Record<string, CriterionDef>;
  lists: Record<string, string[]>;
}

interface SurfaceContext {
  phase?: string;
  deliverable?: string;
  offer_name?: string;
  offer_id?: string;
  candidate_count?: number;
  candidates?: string[];
  consensus_result?: string;
  scores?: Record<string, number>;
  gimmick_name?: string;
  authority_hook?: string;
  origin_story?: string;
  rmbc_scores?: Record<string, number>;
  black_validation_passed?: boolean;
  deliverable_type?: string;
  score?: number;
  lentes_scores?: Record<string, number>;
  loop_failures?: number;
  failure_reasons?: string[];
  last_scores?: number[];
  scope_change_detected?: boolean;
  change_type?: string;
  change_description?: string;
  impact_assessment?: string;
  [key: string]: unknown;
}

export interface SurfaceResult {
  should_surface: boolean;
  criterion_id?: string;
  criterion?: CriterionDef;
  message?: string;
  queued_decision_id?: string;
}

// ==========================================
// Config Loading
// ==========================================

let cachedConfig: CriteriaConfig | null = null;

function loadConfig(): CriteriaConfig {
  if (cachedConfig) return cachedConfig;

  if (!existsSync(CRITERIA_PATH)) {
    throw new Error(`Surface criteria not found: ${CRITERIA_PATH}`);
  }

  const raw = readFileSync(CRITERIA_PATH, 'utf-8');
  cachedConfig = parseYaml(raw) as CriteriaConfig;
  return cachedConfig;
}

// ==========================================
// Condition Evaluator (Mini-Language)
// ==========================================

/**
 * Evaluate a condition string against a context object.
 * Supports: ==, !=, >=, <=, >, <, IN, AND, OR
 * Examples:
 *   "phase == 'BRIEFING' AND deliverable IN mup_deliverables"
 *   "loop_failures >= 3"
 *   "scope_change_detected == true"
 */
function evaluateCondition(condition: string, context: SurfaceContext, lists: Record<string, string[]>): boolean {
  // Handle AND/OR (split at top level)
  if (condition.includes(' AND ')) {
    const parts = condition.split(' AND ');
    return parts.every((part) => evaluateCondition(part.trim(), context, lists));
  }

  if (condition.includes(' OR ')) {
    const parts = condition.split(' OR ');
    return parts.some((part) => evaluateCondition(part.trim(), context, lists));
  }

  // Handle IN operator: "field IN listName"
  const inMatch = condition.match(/^(\w+)\s+IN\s+(\w+)$/);
  if (inMatch) {
    const [, field, listName] = inMatch;
    const value = String(context[field] || '');
    const list = lists[listName] || [];
    return list.includes(value);
  }

  // Handle comparison operators
  const compMatch = condition.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (compMatch) {
    const [, field, op, rawRight] = compMatch;
    const leftVal = context[field];

    // Parse right value
    let rightVal: unknown;
    const trimmed = rawRight.trim();
    if (trimmed === 'true') rightVal = true;
    else if (trimmed === 'false') rightVal = false;
    else if (trimmed === 'null') rightVal = null;
    else if (/^'[^']*'$/.test(trimmed)) rightVal = trimmed.slice(1, -1);
    else if (/^"[^"]*"$/.test(trimmed)) rightVal = trimmed.slice(1, -1);
    else if (!isNaN(Number(trimmed))) rightVal = Number(trimmed);
    else rightVal = trimmed;

    switch (op) {
      case '==': return leftVal == rightVal;
      case '!=': return leftVal != rightVal;
      case '>=': return Number(leftVal) >= Number(rightVal);
      case '<=': return Number(leftVal) <= Number(rightVal);
      case '>': return Number(leftVal) > Number(rightVal);
      case '<': return Number(leftVal) < Number(rightVal);
    }
  }

  // Bare truthy check
  const bareField = condition.trim();
  if (bareField in context) {
    return !!context[bareField];
  }

  return false;
}

// ==========================================
// Message Interpolation
// ==========================================

function interpolateMessage(template: string, context: SurfaceContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = context[key];
    if (val === undefined || val === null) return match;
    return String(val);
  });
}

// ==========================================
// Core API
// ==========================================

/**
 * Check if the current context should trigger a human decision.
 * Uses first-match-wins over evaluation_order.
 * If a criterion matches, queues the decision and returns the result.
 */
export function shouldSurface(context: SurfaceContext): SurfaceResult {
  const config = loadConfig();

  for (const criterionId of config.evaluation_order) {
    const criterion = config.criteria[criterionId];
    if (!criterion) continue;

    try {
      const matches = evaluateCondition(criterion.condition, context, config.lists);

      if (matches) {
        const message = interpolateMessage(criterion.message, context);

        // Queue the decision if offer_id is available
        let queuedId: string | undefined;
        if (context.offer_id) {
          const queued = queueDecision(context.offer_id, criterionId, {
            type: criterion.action,
            priority: criterion.priority as DecisionPriority,
            blocking: criterion.blocking,
            title: criterionId.replace(/_/g, ' ').replace(/^C\d+\s*/, ''),
            context: message,
            auto_resolve_after_hours: criterion.auto_resolve_after_hours,
            auto_resolve_choice: criterion.auto_resolve_choice,
          });
          queuedId = queued.id;
        }

        return {
          should_surface: true,
          criterion_id: criterionId,
          criterion,
          message,
          queued_decision_id: queuedId,
        };
      }
    } catch {
      // Skip criterion if evaluation fails
      continue;
    }
  }

  return { should_surface: false };
}

/**
 * Check a specific criterion by ID.
 */
export function checkCriterion(criterionId: string, context: SurfaceContext): boolean {
  const config = loadConfig();
  const criterion = config.criteria[criterionId];
  if (!criterion) return false;

  return evaluateCondition(criterion.condition, context, config.lists);
}

/**
 * Get all criteria definitions (for display/debugging).
 */
export function getCriteria(): Record<string, CriterionDef> {
  const config = loadConfig();
  return config.criteria;
}

/**
 * Invalidate cached config (e.g., after editing criteria YAML).
 */
export function invalidateCache(): void {
  cachedConfig = null;
}
