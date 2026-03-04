/**
 * semantic-translator.ts — Semantic Activity Feed Translator
 * Part of AIOS Core: copy-chief/observability
 *
 * Pure module (zero I/O): translates raw tool events into human-readable
 * Portuguese descriptions with significance levels for the War Room feed.
 *
 * Created: 2026-03-03
 */

// ─── Agent Registry (source of truth) ────────────────────────────────────────

export interface AgentInfo {
  name: string;
  handle: string;
  color: string;
  initial: string;
  role: string;
}

export const AGENT_REGISTRY: Record<string, AgentInfo> = {
  helix:      { name: 'Helix',      handle: '@chief',      color: '#FFD700', initial: 'H', role: 'Orchestrator' },
  vox:        { name: 'Vox',        handle: '@researcher',  color: '#10B981', initial: 'V', role: 'VOC Research' },
  atlas:      { name: 'Atlas',      handle: '@briefer',     color: '#3B82F6', initial: 'A', role: 'HELIX Briefing' },
  blade:      { name: 'Blade',      handle: '@producer',    color: '#EF4444', initial: 'B', role: 'Copy Production' },
  hawk:       { name: 'Hawk',       handle: '@critic',      color: '#F59E0B', initial: 'K', role: 'Quality Validation' },
  scout:      { name: 'Scout',      handle: '@creative',    color: '#06B6D4', initial: 'S', role: 'Creative Hooks' },
  forge:      { name: 'Forge',      handle: '@lp',          color: '#8B5CF6', initial: 'F', role: 'Landing Pages' },
  echo:       { name: 'Echo',       handle: '@vsl',         color: '#EC4899', initial: 'E', role: 'VSL Narration' },
  cipher:     { name: 'Cipher',     handle: '@miner',       color: '#14B8A6', initial: 'C', role: 'Pattern Mining' },
  sentinel:   { name: 'Sentinel',   handle: '@gatekeeper',  color: '#E8ECF4', initial: 'T', role: 'Gate Enforcement' },
  ops:        { name: 'Ops',        handle: '@ops',          color: '#78716C', initial: 'O', role: 'Ecosystem Ops' },
  strategist: { name: 'Strategist', handle: '@strategist',  color: '#D97706', initial: 'R', role: 'Business Strategy' },
};

// Reverse lookup: handle → agent key
const HANDLE_TO_KEY: Record<string, string> = {};
for (const [key, info] of Object.entries(AGENT_REGISTRY)) {
  HANDLE_TO_KEY[info.handle] = key;
  HANDLE_TO_KEY[info.name.toLowerCase()] = key;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Significance = 'milestone' | 'significant' | 'noise';

export interface SemanticEvent {
  type?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_result?: string;
  offer?: string;
  data?: Record<string, unknown>;
  is_error?: boolean;
}

export interface SemanticResult {
  description: string;
  significance: Significance;
  agent_name: string | null;
  agent_color: string;
  agent_initial: string;
  verb: string;
  object: string;
  offer_short: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "saude/florayla" → "Florayla" */
export function extractOfferShort(offerPath: string | undefined | null): string | null {
  if (!offerPath) return null;
  const parts = offerPath.split('/');
  const name = parts[parts.length - 1] || parts[0] || '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Resolve agent key to full info. Tries: exact key, handle, name. */
export function resolveAgent(agentId: string | undefined | null): AgentInfo | null {
  if (!agentId) return null;
  const lower = agentId.toLowerCase().replace('@', '');
  if (AGENT_REGISTRY[lower]) return AGENT_REGISTRY[lower];
  const key = HANDLE_TO_KEY[`@${lower}`] || HANDLE_TO_KEY[lower];
  if (key) return AGENT_REGISTRY[key];
  // Fuzzy: check if agentId contains a known name
  for (const [k, info] of Object.entries(AGENT_REGISTRY)) {
    if (agentId.toLowerCase().includes(k)) return info;
  }
  return null;
}

/** Extract deliverable type from file path. */
export function extractDeliverableFromPath(filePath: string | undefined | null): string | null {
  if (!filePath) return null;
  if (filePath.includes('production/vsl/')) return 'VSL';
  if (filePath.includes('production/landing-page/')) return 'Landing Page';
  if (filePath.includes('production/creatives/')) return 'Criativo';
  if (filePath.includes('production/emails/')) return 'Email';
  if (filePath.includes('production/reviews/')) return 'Review';
  if (filePath.includes('briefings/phases/')) {
    const m = filePath.match(/phase[_-]?(\d+)/i);
    return m ? `Fase ${m[1]} HELIX` : 'HELIX';
  }
  if (filePath.includes('briefings/')) return 'Briefing';
  if (filePath.includes('research/voc/')) return 'VOC';
  if (filePath.includes('research/avatar/')) return 'Avatar';
  if (filePath.includes('research/competitors/')) return 'Competitors';
  if (filePath.includes('research/mechanism/')) return 'Mecanismo';
  if (filePath.includes('research/')) return 'Research';
  if (filePath.includes('mecanismo-unico')) return 'Mecanismo Unico';
  if (filePath.includes('helix-state')) return 'HELIX State';
  return null;
}

// ─── Validation tool labels ──────────────────────────────────────────────────

const VALIDATION_LABELS: Record<string, string> = {
  mcp__copywriting__blind_critic: 'Blind Critic',
  mcp__copywriting__emotional_stress_test: 'Stress Test Emocional',
  mcp__copywriting__black_validation: 'BLACK Validation',
  mcp__copywriting__layered_review: 'Layered Review',
  mcp__copywriting__validate_gate: 'Gate Validation',
};

const MCP_RESEARCH_TOOLS: Record<string, string> = {
  mcp__copywriting__voc_search: 'VOC Search',
  mcp__firecrawl__firecrawl_scrape: 'Firecrawl',
  mcp__firecrawl__firecrawl_search: 'Firecrawl Search',
  mcp__firecrawl__firecrawl_crawl: 'Firecrawl Crawl',
  mcp__apify__call_actor: 'Apify',
  'mcp__apify__call-actor': 'Apify',
  mcp__fb_ad_library__get_meta_ads: 'Meta Ads',
  'mcp__fb_ad_library__get_meta_ads': 'Meta Ads',
};

// ─── Score extraction (lightweight, from tool_result) ────────────────────────

function extractScoreFromResult(result: string | undefined): string | null {
  if (!result) return null;
  // Try "X/10" format
  const m = result.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (m) return m[1];
  // Try "Score: X"
  const m2 = result.match(/(?:score|nota)[:\s]+(\d+(?:\.\d+)?)/i);
  if (m2) return m2[1];
  return null;
}

// ─── Tool → Agent domain mapping ─────────────────────────────────────────────

const TOOL_AGENT_MAP: Record<string, string> = {
  // Validation tools → Hawk (@critic)
  mcp__copywriting__blind_critic: 'hawk',
  mcp__copywriting__emotional_stress_test: 'hawk',
  mcp__copywriting__black_validation: 'hawk',
  mcp__copywriting__layered_review: 'hawk',
  // Gate tools → Sentinel (@gatekeeper)
  mcp__copywriting__validate_gate: 'sentinel',
  // Research tools → Vox (@researcher)
  mcp__copywriting__voc_search: 'vox',
  mcp__firecrawl__firecrawl_scrape: 'vox',
  mcp__firecrawl__firecrawl_search: 'vox',
  mcp__firecrawl__firecrawl_crawl: 'vox',
  mcp__apify__call_actor: 'vox',
  'mcp__apify__call-actor': 'vox',
  // Ads tools → Cipher (@miner)
  mcp__fb_ad_library__get_meta_ads: 'cipher',
  'mcp__fb_ad_library__get_meta_ads': 'cipher',
  mcp__fb_ad_library__get_meta_platform_id: 'cipher',
  // Mecanismo tools → Atlas (@briefer)
  mcp__copywriting__create_mecanismo: 'atlas',
  mcp__copywriting__update_mecanismo: 'atlas',
  mcp__copywriting__validate_mecanismo: 'atlas',
  mcp__copywriting__get_mecanismo: 'atlas',
};

// File path patterns → Agent mapping
const PATH_AGENT_PATTERNS: Array<[RegExp, string]> = [
  [/production\/vsl\//, 'echo'],
  [/production\/landing-page\//, 'forge'],
  [/production\/creatives\//, 'scout'],
  [/production\/emails\//, 'blade'],
  [/production\/reviews\//, 'hawk'],
  [/briefings\//, 'atlas'],
  [/mecanismo-unico/, 'atlas'],
  [/research\/voc\/|research\/avatar\//, 'vox'],
  [/research\/competitors\/|ads-library/, 'cipher'],
  [/research\/mechanism\/|research\/synthesis/, 'vox'],
];

// ─── Detect agent from event data ────────────────────────────────────────────

function detectAgentFromEvent(event: SemanticEvent): AgentInfo | null {
  // 1. Tool → Agent domain mapping (HIGHEST priority — deterministic, overrides session agent_id)
  const toolKey = event.tool_name || '';
  if (TOOL_AGENT_MAP[toolKey]) {
    return AGENT_REGISTRY[TOOL_AGENT_MAP[toolKey]] || null;
  }

  // 2. From Agent tool description (subagent spawn): "AgentName: task"
  if (event.tool_name === 'Agent' && event.tool_input?.description) {
    const desc = event.tool_input.description as string;
    const agent = resolveAgent(desc.split(':')[0]?.trim());
    if (agent) return agent;
  }

  // 3. File path patterns (deterministic)
  const filePath = (event.tool_input?.file_path as string) || '';
  if (filePath) {
    for (const [pattern, agentKey] of PATH_AGENT_PATTERNS) {
      if (pattern.test(filePath)) return AGENT_REGISTRY[agentKey] || null;
    }
  }

  // 4. Explicit agent_id in data (lowest priority — often just session-level "helix")
  const agentId = event.data?.agent_id as string;
  if (agentId) {
    const agent = resolveAgent(agentId);
    if (agent) return agent;
  }

  return null;
}

// ─── Default result (fallback) ───────────────────────────────────────────────

function defaultResult(): SemanticResult {
  return {
    description: '',
    significance: 'noise',
    agent_name: null,
    agent_color: '#666',
    agent_initial: '?',
    verb: '',
    object: '',
    offer_short: null,
  };
}

function makeResult(
  agent: AgentInfo | null,
  verb: string,
  object: string,
  significance: Significance,
  offer?: string | null,
): SemanticResult {
  const offerShort = extractOfferShort(offer);
  const agentName = agent?.name || null;
  const offerSuffix = offerShort ? ` para ${offerShort}` : '';
  const description = agentName
    ? `${agentName}: ${verb} ${object}${offerSuffix}`
    : `${verb} ${object}${offerSuffix}`;

  return {
    description,
    significance,
    agent_name: agentName,
    agent_color: agent?.color || '#666',
    agent_initial: agent?.initial || '?',
    verb,
    object,
    offer_short: offerShort,
  };
}

// ─── Main translator ─────────────────────────────────────────────────────────

export function translateEvent(event: SemanticEvent): SemanticResult {
  const type = event.type || '';
  const tool = event.tool_name || '';
  const offer = event.offer;
  const agent = detectAgentFromEvent(event);
  const filePath = (event.tool_input?.file_path as string) || '';

  // --- AgentStart ---
  if (type === 'SubagentStart') {
    const desc = (event.data?.description as string) || 'tarefa';
    return makeResult(agent, 'iniciou', desc, 'milestone', offer);
  }

  // --- AgentStop ---
  if (type === 'SubagentStop') {
    const role = agent?.role || 'tarefa';
    return makeResult(agent, 'completou', role, 'milestone', offer);
  }

  // --- Validation MCP tools (blind_critic, EST, black_validation, etc.) ---
  if (VALIDATION_LABELS[tool]) {
    const label = VALIDATION_LABELS[tool];
    const score = extractScoreFromResult(event.tool_result);
    const deliverable = (event.tool_input?.deliverable as string) ||
                        (event.tool_input?.copy_type as string) ||
                        'copy';
    const scoreSuffix = score ? ` — ${score}/10` : '';
    return makeResult(agent, label, `em ${deliverable}${scoreSuffix}`, 'milestone', offer);
  }

  // --- validate_gate ---
  if (tool === 'mcp__copywriting__validate_gate') {
    const phase = (event.tool_input?.phase as string) || 'fase';
    const passed = event.tool_result?.toLowerCase().includes('passed') ||
                   event.tool_result?.toLowerCase().includes('approved');
    const status = passed ? 'PASSED' : (event.is_error ? 'FAILED' : 'verificado');
    return makeResult(agent, `Gate ${phase}`, status, 'milestone', offer);
  }

  // --- Write to production/ ---
  if (tool === 'Write' && filePath.includes('production/')) {
    const deliverable = extractDeliverableFromPath(filePath) || 'deliverable';
    return makeResult(agent, 'escreveu', deliverable, 'significant', offer);
  }

  // --- Write to briefings/ ---
  if (tool === 'Write' && filePath.includes('briefings/')) {
    const deliverable = extractDeliverableFromPath(filePath) || 'briefing';
    return makeResult(agent, 'escreveu', deliverable, 'significant', offer);
  }

  // --- Write to research/ ---
  if (tool === 'Write' && filePath.includes('research/')) {
    const deliverable = extractDeliverableFromPath(filePath) || 'pesquisa';
    return makeResult(agent, 'salvou', deliverable, 'significant', offer);
  }

  // --- Write to mecanismo-unico ---
  if (tool === 'Write' && filePath.includes('mecanismo-unico')) {
    return makeResult(agent, 'atualizou', 'Mecanismo Unico', 'significant', offer);
  }

  // --- MCP research tools ---
  if (MCP_RESEARCH_TOOLS[tool]) {
    const source = MCP_RESEARCH_TOOLS[tool];
    return makeResult(agent, 'buscou', source, 'significant', offer);
  }

  // --- Agent spawn (description is already semantic) ---
  if (tool === 'Agent') {
    const desc = (event.tool_input?.description as string) || 'subagent';
    // Try to detect agent from description prefix "AgentName: task"
    let spawnAgent = agent;
    if (!spawnAgent) {
      const colonIdx = desc.indexOf(':');
      if (colonIdx > 0 && colonIdx < 15) {
        spawnAgent = resolveAgent(desc.substring(0, colonIdx).trim());
      }
    }
    // Default to Helix (orchestrator is the one spawning)
    if (!spawnAgent) spawnAgent = AGENT_REGISTRY.helix;
    return makeResult(spawnAgent, 'lançou', desc, 'significant', offer);
  }

  // --- Everything else is noise ---
  return defaultResult();
}
