/**
 * Configuration Resolver — Layered Config Hierarchy
 *
 * Port of: aios-core/.aios-core/core/config/config-resolver.js
 * Adapted for Copy Chief BLACK (TypeScript, Bun runtime)
 *
 * Implements 3-level configuration hierarchy:
 *   L1 Framework  → ~/.claude/framework-config.yaml  (immutable defaults)
 *   L2 Project    → ~/.claude/core-config.yaml        (quality gates, registry, handoffs)
 *   L3 Offer      → {offer}/helix-state.yaml          (per-offer overrides)
 *
 * Provides:
 * - resolveConfig(offerPath?) — main entry point, returns merged config
 * - getCoreConfig() — shortcut for L2 (quality gates, registry)
 * - getConfigAtLevel(level) — raw config from specific level
 * - getQualityGates() — quality.gates from merged config
 * - getRequiredTools(phase) — required_tools for a specific phase
 * - getAgentRegistry() — agents.registry array
 *
 * @module lib/config-resolver
 * @version 1.0.0
 * @forked aios-core v4.4.6
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { globalConfigCache } from './config-cache';
import { deepMerge as mergeDeep, mergeAll, isPlainObject } from './merge-utils';
import { interpolateEnvVars } from './env-interpolator';

const HOME = process.env.HOME || '/tmp';
const CLAUDE_DIR = join(HOME, '.claude');
const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');

// ─── Config File Paths ───────────────────────────────────────────────────────

const CONFIG_FILES = {
  framework: join(CLAUDE_DIR, 'framework-config.yaml'),  // L1
  project: join(CLAUDE_DIR, 'core-config.yaml'),          // L2
  // L3 is dynamic: {offer}/helix-state.yaml
} as const;

const LEVELS = {
  framework: 'L1',
  project: 'L2',
  offer: 'L3',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QualityGate {
  required_tools: string[];
  deliverables?: string[];
  threshold?: string;
}

export interface AgentRegistryEntry {
  id: string;
  name: string;
  handle: string;
  title: string;
  model: string;
  icon: string;
  dir: string;
  triggers: string[];
  direct?: boolean;
}

export interface HandoffRule {
  pattern: string;
  next_agent: string;
  message: string;
  condition?: string;
}

export interface ResolvedConfig {
  // L1: Framework
  quality?: {
    thresholds?: Record<string, number>;
    gates?: Record<string, QualityGate>;
    max_iterations?: Record<string, number>;
  };
  workflow?: {
    phases?: string[];
    phase_descriptions?: Record<string, string>;
    default_gates?: Record<string, string[]>;
  };
  // L2: Project
  agents?: {
    registry?: AgentRegistryEntry[];
    location?: string;
    format?: string;
    activation?: Record<string, string>;
  };
  handoffs?: {
    detection?: string;
    rules?: HandoffRule[];
  };
  context?: {
    always_load?: string[];
    per_agent?: Record<string, string[]>;
  };
  constitution?: {
    file?: string;
    principles?: Array<{
      id: string;
      severity: string;
      rule: string;
      gate?: string;
    }>;
  };
  stories?: Record<string, unknown>;
  // L3: Offer
  _offer_overrides?: Record<string, unknown>;
  // Metadata
  _sources?: Record<string, { level: string; file: string }>;
  _legacy?: boolean;
}

// ─── YAML Parser (js-yaml — identical to AIOS Core) ─────────────────────────
// Uses js-yaml for full YAML spec support including nested lists of objects,
// multi-line strings, anchors, etc. Same dependency as aios-core.

// ─── Deep Merge (delegated to merge-utils.ts) ────────────────────────────────
// deepMerge follows ADR-PRO-002 rules (last-wins scalars, recursive objects,
// +append arrays, null-deletes-key). Re-exported for callers that imported it
// from this module previously.
export { mergeDeep as deepMerge, mergeAll };

// ─── YAML File Loading ───────────────────────────────────────────────────────

function loadYamlFile(filePath: string): Record<string, any> | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, 'utf-8');
    const data = yaml.load(content) as Record<string, any>;
    return data || {};
  } catch (error) {
    console.error(`[CONFIG-RESOLVER] Failed to parse ${filePath}: ${error}`);
    return null;
  }
}

// ─── Source Tracking (debug mode) ────────────────────────────────────────────

function trackSources(
  sources: Record<string, { level: string; file: string }>,
  data: Record<string, any>,
  level: string,
  file: string,
  prefix: string = '',
): void {
  if (!sources || !data) return;

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    sources[fullKey] = { level, file };

    if (isPlainObject(value)) {
      trackSources(sources, value as Record<string, any>, level, file, fullKey);
    }
  }
}

// ─── Main API ────────────────────────────────────────────────────────────────

/**
 * Resolve the final configuration by merging all levels.
 *
 * L1 Framework → L2 Project → L3 Offer
 *
 * @param offerPath — Relative path to offer dir (e.g. "saude/florayla")
 * @param options.debug — Enable source tracking per key
 * @param options.skipCache — Bypass cache
 */
export function resolveConfig(
  offerPath?: string,
  options: { debug?: boolean; skipCache?: boolean } = {},
): ResolvedConfig {
  const cacheKey = `resolved:${offerPath || 'global'}:${options.debug ? 'debug' : 'std'}`;

  if (!options.skipCache) {
    const cached = globalConfigCache.get<ResolvedConfig>(cacheKey);
    if (cached) return cached;
  }

  const sources: Record<string, { level: string; file: string }> = {};

  // L1: Framework (immutable defaults)
  const l1 = loadYamlFile(CONFIG_FILES.framework);
  let config: Record<string, any> = l1 || {};

  if (options.debug && l1) {
    trackSources(sources, l1, LEVELS.framework, CONFIG_FILES.framework);
  }

  // L2: Project (quality gates, registry, handoffs)
  const l2 = loadYamlFile(CONFIG_FILES.project);
  if (l2) {
    config = mergeDeep(config, l2);
    if (options.debug) {
      trackSources(sources, l2, LEVELS.project, CONFIG_FILES.project);
    }
  }

  // L3: Offer (per-offer overrides)
  if (offerPath) {
    const helixStatePath = join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');
    const l3 = loadYamlFile(helixStatePath);
    if (l3) {
      // Only merge specific sections from offer level
      const offerOverrides: Record<string, any> = {};
      if (l3.config) offerOverrides.quality = l3.config;
      if (l3.gates_override) offerOverrides.quality = { ...offerOverrides.quality, gates_override: l3.gates_override };

      config = mergeDeep(config, offerOverrides);
      config._offer_overrides = l3;

      if (options.debug) {
        trackSources(sources, offerOverrides, LEVELS.offer, helixStatePath);
      }
    }
  }

  if (options.debug) {
    config._sources = sources;
  }

  // Run env-var interpolation on the fully merged config (ADR-PRO-002: applied post-merge)
  const interpolated = interpolateEnvVars(config) as Record<string, any>;
  // Preserve debug-only _sources (not interpolated — it's metadata, not user config)
  if (options.debug && config._sources) {
    interpolated._sources = config._sources;
  }

  const result = interpolated as ResolvedConfig;
  globalConfigCache.set(cacheKey, result);
  return result;
}

/**
 * Get raw config from a specific level (no merge).
 */
export function getConfigAtLevel(level: 'framework' | 'project' | 'offer', offerPath?: string): Record<string, any> | null {
  switch (level) {
    case 'framework':
      return loadYamlFile(CONFIG_FILES.framework);
    case 'project':
      return loadYamlFile(CONFIG_FILES.project);
    case 'offer':
      if (!offerPath) return null;
      return loadYamlFile(join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml'));
    default:
      return null;
  }
}

// ─── Convenience Accessors ───────────────────────────────────────────────────

/**
 * Get L2 core-config.yaml directly (most common use case).
 */
export function getCoreConfig(): Record<string, any> | null {
  const cacheKey = 'core-config';
  const cached = globalConfigCache.get<Record<string, any>>(cacheKey);
  if (cached) return cached;

  const config = loadYamlFile(CONFIG_FILES.project);
  if (config) globalConfigCache.set(cacheKey, config);
  return config;
}

/**
 * Get quality.gates from merged config.
 */
export function getQualityGates(offerPath?: string): Record<string, QualityGate> {
  const config = resolveConfig(offerPath);
  return (config.quality?.gates || {}) as Record<string, QualityGate>;
}

/**
 * Get required_tools for a specific phase.
 */
export function getRequiredTools(phase: string, offerPath?: string): string[] {
  const gates = getQualityGates(offerPath);
  return gates[phase]?.required_tools || [];
}

/**
 * Get threshold for a specific quality metric.
 */
export function getThreshold(name: string, offerPath?: string): number {
  const config = resolveConfig(offerPath);
  const thresholds = config.quality?.thresholds || {};
  return (thresholds as Record<string, number>)[name] || 0;
}

/**
 * Get agent registry from L2 config.
 */
export function getAgentRegistry(): AgentRegistryEntry[] {
  const config = getCoreConfig();
  return (config?.agents?.registry || []) as AgentRegistryEntry[];
}

/**
 * Get handoff rules from L2 config.
 */
export function getHandoffRules(): HandoffRule[] {
  const config = getCoreConfig();
  return (config?.handoffs?.rules || []) as HandoffRule[];
}

/**
 * Get context injection rules from L2 config.
 */
export function getContextRules(): { always_load: string[]; per_agent: Record<string, string[]> } {
  const config = getCoreConfig();
  return {
    always_load: (config?.context?.always_load || []) as string[],
    per_agent: (config?.context?.per_agent || {}) as Record<string, string[]>,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const CONFIG_PATHS = CONFIG_FILES;
export { LEVELS };
