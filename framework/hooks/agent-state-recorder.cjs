'use strict';

/**
 * Agent State Recorder
 * Event: PostToolUse (blind_critic, emotional_stress_test, black_validation)
 * Budget: <3s
 *
 * Records episodic memory entries when MCP validation tools return results.
 * Gap 4: Persistent Agent State
 */

const fs = require('fs');
const path = require('path');

const KNOWN_AGENTS = ['vox', 'cipher', 'atlas', 'echo', 'forge', 'scout', 'blade', 'hawk', 'sentinel', 'ops', 'strategist'];

const TOOL_TO_LEARNING = {
  'mcp__copywriting__blind_critic': 'blind_critic',
  'mcp__copywriting__emotional_stress_test': 'emotional_stress_test',
  'mcp__copywriting__black_validation': 'black_validation',
};

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const toolName = context.tool_name || '';
  const toolType = TOOL_TO_LEARNING[toolName];
  if (!toolType) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Detect active agent from conversation context
  const agentId = detectActiveAgent(context);
  if (!agentId) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  // Detect offer path
  const offerPath = detectOfferPath(context);

  // Extract score from tool result
  const score = extractScore(context.tool_result || context.result || '');

  // Extract deliverable type hint
  const deliverableType = detectDeliverableType(context);

  try {
    const { AgentMemoryManager } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'memory', 'agent-memory-manager')
    );

    const memoryManager = new AgentMemoryManager();

    // Build episodic entry
    const entry = {
      offer: offerPath || 'unknown',
      niche: offerPath ? offerPath.split('/')[0] : 'unknown',
      tool: toolType,
      score: score,
      deliverable_type: deliverableType,
      result: score >= 8 ? 'passed' : score > 0 ? 'needs_revision' : 'unknown',
      learning: buildLearning(toolType, score, deliverableType),
    };

    // Write episodic memory (sync for budget)
    memoryManager.appendSync(agentId, 'episodic', entry);

    // Also write to per-offer episodic
    if (offerPath) {
      writeOfferEpisodic(offerPath, agentId, entry);
    }

    process.stdout.write(JSON.stringify({}));
  } catch (error) {
    // Non-critical: don't block on memory write failures
    process.stdout.write(JSON.stringify({}));
  }
}

function detectActiveAgent(context) {
  // Check multiple sources for agent identification
  const sources = [
    context.agent_id,
    context.active_agent,
  ];

  for (const source of sources) {
    if (source && KNOWN_AGENTS.includes(source)) return source;
  }

  // Check active-agents.json as primary source
  try {
    const activeAgentsPath = path.join(process.env.HOME, '.claude', 'session-state', 'active-agents.json');
    if (fs.existsSync(activeAgentsPath)) {
      const agents = JSON.parse(fs.readFileSync(activeAgentsPath, 'utf8'));
      if (Array.isArray(agents) && agents.length > 0) {
        // Most recent agent (last entry)
        const latest = agents[agents.length - 1];
        const id = (typeof latest === 'string') ? latest : (latest.id || latest.agent_id || '');
        if (id && KNOWN_AGENTS.includes(id)) return id;
      }
    }
  } catch { /* non-critical */ }

  // Try to detect from conversation messages or tool input
  const textSources = [
    context.tool_input?.content || '',
    context.tool_input?.text || '',
    context.conversation_context || '',
  ];

  for (const text of textSources) {
    if (!text) continue;
    const lower = text.toLowerCase();
    for (const agent of KNOWN_AGENTS) {
      if (lower.includes(`@${agent}`) || lower.includes(`you are ${agent}`)) {
        return agent;
      }
    }
  }

  // Fallback: detect from deliverable type
  const deliverable = detectDeliverableType(context);
  const deliverableAgentMap = {
    'vsl': 'echo',
    'landing-page': 'forge',
    'creatives': 'scout',
    'emails': 'blade',
    'research': 'vox',
    'briefing': 'atlas',
    'review': 'hawk',
  };

  return deliverableAgentMap[deliverable] || null;
}

function detectOfferPath(context) {
  const sources = [
    context.offer,
    context.offer_path,
    context.tool_input?.offer,
    context.session_state?.activeOffer,
  ];

  for (const source of sources) {
    if (source && source.includes('/')) return source;
  }

  // Check current-offer.json as fallback
  try {
    const offerJsonPath = path.join(process.env.HOME, '.claude', 'session-state', 'current-offer.json');
    if (fs.existsSync(offerJsonPath)) {
      const data = JSON.parse(fs.readFileSync(offerJsonPath, 'utf8'));
      const offerPath = data.offer || data.offer_path || data.active_offer || '';
      if (offerPath && offerPath.includes('/')) return offerPath;
    }
  } catch { /* non-critical */ }

  // Try to detect from CWD or text
  const cwd = context.cwd || process.cwd();
  const ecosystemRoot = path.join(process.env.HOME, 'copywriting-ecosystem');

  if (cwd.startsWith(ecosystemRoot)) {
    const relative = cwd.slice(ecosystemRoot.length + 1);
    const parts = relative.split('/');
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  }

  // Try text patterns
  const text = JSON.stringify(context).slice(0, 5000);
  const match = text.match(/\b(saude|relacionamento|concursos|financeiro|educacao)\/([a-z][a-z0-9-]+)\b/);
  if (match) return `${match[1]}/${match[2]}`;

  return null;
}

function extractScore(result) {
  if (typeof result !== 'string') {
    // Try structured object extraction first (MCP tools return structured data)
    if (result && typeof result === 'object') {
      const candidates = [
        result.overall_score, result.final_score, result.score,
        result.scores?.overall, result.scores?.final,
        result.result?.score, result.result?.overall_score,
      ];
      for (const val of candidates) {
        if (typeof val === 'number' && val >= 0 && val <= 10) return val;
        if (typeof val === 'string') {
          const n = parseFloat(val);
          if (!isNaN(n) && n >= 0 && n <= 10) return n;
        }
      }
    }
    result = JSON.stringify(result || '');
  }

  // Try JSON parse on string (tool results often come as JSON strings)
  try {
    const parsed = JSON.parse(result);
    if (parsed && typeof parsed === 'object') {
      const candidates = [
        parsed.overall_score, parsed.final_score, parsed.score,
        parsed.scores?.overall, parsed.scores?.final,
        parsed.result?.score, parsed.result?.overall_score,
      ];
      for (const val of candidates) {
        if (typeof val === 'number' && val >= 0 && val <= 10) return val;
        if (typeof val === 'string') {
          const n = parseFloat(val);
          if (!isNaN(n) && n >= 0 && n <= 10) return n;
        }
      }
    }
  } catch { /* not JSON, fall through to regex */ }

  // Regex fallback: "score: 8.5", "Score: 8.5/10", "rating: 8.5"
  const patterns = [
    /(?:score|rating|nota|pontuacao)[:\s]+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/,
    /(?:overall|total|final)[:\s]+(\d+(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = result.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 0 && score <= 10) return score;
    }
  }

  return 0;
}

function detectDeliverableType(context) {
  const text = JSON.stringify(context).slice(0, 3000).toLowerCase();

  if (text.includes('vsl') || text.includes('chapter')) return 'vsl';
  if (text.includes('landing') || text.includes('lp') || text.includes('block')) return 'landing-page';
  if (text.includes('creative') || text.includes('criativo')) return 'creatives';
  if (text.includes('email') || text.includes('sequence')) return 'emails';
  if (text.includes('research') || text.includes('voc')) return 'research';
  if (text.includes('briefing') || text.includes('helix')) return 'briefing';
  if (text.includes('review') || text.includes('hawk')) return 'review';

  return 'unknown';
}

function buildLearning(toolType, score, deliverableType) {
  if (score === 0) return `${toolType} executed on ${deliverableType}`;

  if (score >= 9) {
    return `${toolType} ${score}/10 on ${deliverableType} — excellent, pattern worth replicating`;
  } else if (score >= 8) {
    return `${toolType} ${score}/10 on ${deliverableType} — passed threshold`;
  } else if (score >= 6) {
    return `${toolType} ${score}/10 on ${deliverableType} — needs improvement, revision required`;
  } else {
    return `${toolType} ${score}/10 on ${deliverableType} — significant issues, deep revision needed`;
  }
}

function writeOfferEpisodic(offerPath, agentId, entry) {
  try {
    const yaml = require('js-yaml');
    const ecosystemRoot = process.env.ECOSYSTEM_ROOT
      || path.join(process.env.HOME, 'copywriting-ecosystem');
    const episodicDir = path.join(ecosystemRoot, offerPath, '.aios', 'memory');
    fs.mkdirSync(episodicDir, { recursive: true });

    const episodicPath = path.join(episodicDir, 'episodic.yaml');
    let entries = [];

    if (fs.existsSync(episodicPath)) {
      try {
        entries = yaml.load(fs.readFileSync(episodicPath, 'utf8')) || [];
      } catch { entries = []; }
    }

    if (!Array.isArray(entries)) entries = [];

    entries.unshift({
      ...entry,
      agent: agentId,
      timestamp: new Date().toISOString(),
    });

    // Cap at 100 per offer
    if (entries.length > 100) entries = entries.slice(0, 100);

    fs.writeFileSync(episodicPath, yaml.dump(entries, { lineWidth: 120 }), 'utf8');
  } catch { /* non-critical */ }
}

main().catch(() => process.exit(0));
