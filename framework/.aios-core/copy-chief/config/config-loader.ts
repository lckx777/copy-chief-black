// ~/.claude/hooks/lib/config-loader.ts
// Shared Config Loader — Single source for core-config.yaml + helix-state.yaml
// v1.0 — Gap Closure #3 (2026-03-02)
//
// Replaces: each hook parsing YAML independently
// Used by: tool-matrix-enforcer.ts, story-required-gate.ts, phase-gate.ts, etc.

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let yaml: any;
try { yaml = require('yaml'); } catch { yaml = require('js-yaml'); }

const CORE_CONFIG_PATH = join(process.env.HOME!, '.claude', 'core-config.yaml');
const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QualityGate {
  required_tools: string[];
  deliverables?: string[];
  threshold?: string;
}

export interface CoreConfig {
  project: { type: string; version: string };
  stories: { location: string; activeStoryDetection: string };
  agents: { location: string; registry: Array<{ id: string; name: string; handle: string; model: string; triggers: string[] }> };
  constitution: { principles: Array<{ id: string; severity: string; rule: string }> };
  quality: { gates: Record<string, QualityGate> };
  context: { always_load: string[]; per_agent: Record<string, string[]> };
}

// ─── Cache ───────────────────────────────────────────────────────────────────

let _coreConfig: CoreConfig | null = null;
let _coreConfigMtime: number = 0;

const _offerStateCache = new Map<string, { data: any; mtime: number }>();

// ─── Core Config ─────────────────────────────────────────────────────────────

/**
 * Load core-config.yaml (cached by mtime).
 * Returns typed config object.
 */
export function loadCoreConfig(): CoreConfig {
  try {
    const stat = require('fs').statSync(CORE_CONFIG_PATH);
    const mtime = stat.mtimeMs;

    if (_coreConfig && _coreConfigMtime === mtime) {
      return _coreConfig;
    }

    const content = readFileSync(CORE_CONFIG_PATH, 'utf-8');
    const parsed = yaml.parse ? yaml.parse(content) : yaml.load(content);
    _coreConfig = parsed as CoreConfig;
    _coreConfigMtime = mtime;
    return _coreConfig;
  } catch (err) {
    throw new Error(`[config-loader] Failed to load core-config.yaml: ${err}`);
  }
}

// ─── Quality Gates ───────────────────────────────────────────────────────────

/**
 * Get required tools for a quality gate phase.
 * Reads from core-config.yaml quality.gates section.
 */
export function getRequiredTools(gate: string): string[] {
  const config = loadCoreConfig();
  const gateConfig = config.quality?.gates?.[gate];
  return gateConfig?.required_tools || [];
}

/**
 * Get all quality gates defined in config.
 */
export function getQualityGates(): Record<string, QualityGate> {
  const config = loadCoreConfig();
  return config.quality?.gates || {};
}

/**
 * Get gate threshold string (e.g., "blind_critic >= 8 AND EST >= 8").
 */
export function getGateThreshold(gate: string): string | undefined {
  const config = loadCoreConfig();
  return config.quality?.gates?.[gate]?.threshold;
}

// ─── Offer State (helix-state.yaml) ──────────────────────────────────────────

/**
 * Load helix-state.yaml for an offer (cached by mtime).
 */
export function loadOfferState(offerPath: string): any {
  const statePath = join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');

  if (!existsSync(statePath)) return null;

  try {
    const stat = require('fs').statSync(statePath);
    const mtime = stat.mtimeMs;

    const cached = _offerStateCache.get(offerPath);
    if (cached && cached.mtime === mtime) {
      return cached.data;
    }

    const content = readFileSync(statePath, 'utf-8');
    const parsed = yaml.parse ? yaml.parse(content) : yaml.load(content);
    _offerStateCache.set(offerPath, { data: parsed, mtime });
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Get workflow phase for an offer.
 */
export function getOfferPhase(offerPath: string): string {
  const state = loadOfferState(offerPath);
  return state?.workflow_phase || 'idle';
}

/**
 * Check if a gate has passed for an offer.
 */
export function hasGatePassed(offerPath: string, gate: string): boolean {
  const state = loadOfferState(offerPath);
  return state?.gates?.[gate]?.passed === true;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Get stories directory from config.
 */
export function getStoriesLocation(): string {
  const config = loadCoreConfig();
  const loc = config.stories?.location || '~/.claude/stories';
  return loc.replace('~', process.env.HOME!);
}

// ─── Agent Registry ──────────────────────────────────────────────────────────

/**
 * Get agent config by ID.
 */
export function getAgentConfig(agentId: string): CoreConfig['agents']['registry'][0] | undefined {
  const config = loadCoreConfig();
  return config.agents?.registry?.find(a => a.id === agentId);
}

// ─── Tool Name Mapping ──────────────────────────────────────────────────────

/**
 * Map short tool names (from core-config.yaml) to full MCP tool names.
 * Shared across all hooks to avoid duplication.
 */
export const TOOL_NAME_MAP: Record<string, string> = {
  'voc_search': 'mcp__copywriting__voc_search',
  'firecrawl_agent': 'mcp__firecrawl__firecrawl_agent',
  'firecrawl_scrape': 'mcp__firecrawl__firecrawl_scrape',
  'firecrawl_search': 'mcp__firecrawl__firecrawl_search',
  'browser_navigate': 'mcp__playwright__browser_navigate',
  'get_phase_context': 'mcp__copywriting__get_phase_context',
  'blind_critic': 'mcp__copywriting__blind_critic',
  'emotional_stress_test': 'mcp__copywriting__emotional_stress_test',
  'get_meta_ads': 'mcp__fb_ad_library__get_meta_ads',
  'get_meta_platform_id': 'mcp__fb_ad_library__get_meta_platform_id',
  'analyze_ad_video': 'mcp__fb_ad_library__analyze_ad_video',
  'consensus': 'mcp__zen__consensus',
  'thinkdeep': 'mcp__zen__thinkdeep',
  'layered_review': 'mcp__copywriting__layered_review',
  'write_chapter': 'mcp__copywriting__write_chapter',
  'black_validation': 'mcp__copywriting__black_validation',
  'validate_gate': 'mcp__copywriting__validate_gate',
  'sequential_thinking': 'mcp__sequential-thinking__sequentialthinking',
};

/**
 * Resolve a tool name to its full MCP name.
 */
export function resolveToolName(name: string): string {
  if (name.startsWith('mcp__')) return name;
  return TOOL_NAME_MAP[name] || name;
}

/**
 * Format a tool name for display (strip mcp__ prefix).
 */
export function formatToolName(tool: string): string {
  return tool.replace(/^mcp__/, '').replace(/__/g, '.').replace(/_/g, ' ');
}

// ─── Convenience: Required Tools as MCP Names ───────────────────────────────

/**
 * Get required tools for a gate, resolved to full MCP names.
 * Also groups alternatives (e.g., firecrawl_agent OR firecrawl_scrape).
 */
export function getRequiredToolGroups(gate: string): string[][] {
  const shortNames = getRequiredTools(gate);

  // Research has alternatives — firecrawl_agent OR firecrawl_scrape OR playwright
  if (gate === 'research') {
    return [
      // Group 1: Data collection (any scraping tool)
      [
        resolveToolName('firecrawl_agent'),
        resolveToolName('firecrawl_scrape'),
        resolveToolName('firecrawl_search'),
        resolveToolName('browser_navigate'),
      ],
      // Group 2: VOC Search
      [resolveToolName('voc_search')],
    ];
  }

  // For other gates, each required tool is its own group (all required)
  return shortNames.map(name => [resolveToolName(name)]);
}

/**
 * Recommended (non-blocking) tools per gate.
 */
export function getRecommendedTools(gate: string): string[] {
  const recommended: Record<string, string[]> = {
    research: ['get_meta_ads', 'get_meta_platform_id', 'analyze_ad_video'],
    briefing: ['consensus', 'thinkdeep'],
    production: ['layered_review', 'write_chapter'],
  };
  return (recommended[gate] || []).map(resolveToolName);
}

// ─── Cache Management ────────────────────────────────────────────────────────

/**
 * Clear all caches. Useful for testing.
 */
export function clearCaches(): void {
  _coreConfig = null;
  _coreConfigMtime = 0;
  _offerStateCache.clear();
}
