'use strict';

/**
 * Persona Detector
 * Event: UserPromptSubmit
 * Budget: <1s
 *
 * Detects @persona activation in user prompt and registers in active-agents.json.
 * Fixes gap: top-level persona (not spawned via Agent()) was invisible to dashboard.
 *
 * AIOS pattern: deterministic detection → state write → dashboard reads.
 */

const fs = require('fs');
const path = require('path');

// Handle → internal agent ID mapping
const HANDLE_TO_ID = {
  chief: 'helix', helix: 'helix',
  researcher: 'vox', vox: 'vox',
  miner: 'cipher', cipher: 'cipher',
  briefer: 'atlas', atlas: 'atlas',
  vsl: 'echo', echo: 'echo',
  lp: 'forge', forge: 'forge',
  creative: 'scout', scout: 'scout',
  producer: 'blade', blade: 'blade',
  critic: 'hawk', hawk: 'hawk',
  gatekeeper: 'sentinel', sentinel: 'sentinel',
  ops: 'ops', operator: 'ops',
  strategist: 'strategist',
};

const PERSONA_PATTERNS = [
  // @handle at start or standalone
  /^@(\w+)\b/i,
  // "como @handle" or "ativa @handle"
  /\b(?:como|ativa|activate|switch\s+to)\s+@(\w+)\b/i,
];

function detectPersona(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const trimmed = prompt.trim();
  if (trimmed.length > 500) return null;

  for (const pattern of PERSONA_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const handle = match[1].toLowerCase();
      if (HANDLE_TO_ID[handle]) return HANDLE_TO_ID[handle];
    }
  }
  return null;
}

function detectOfferFromPrompt(prompt) {
  const match = prompt.match(/\b(saude|relacionamento|concursos|financeiro|educacao|marketing-digital)\/([a-z][a-z0-9-]+)\b/);
  return match ? `${match[1]}/${match[2]}` : null;
}

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

  const prompt = context.prompt || '';
  const personaId = detectPersona(prompt);

  if (!personaId) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const stateDir = path.join(process.env.HOME, '.claude', 'session-state');
  const setPath = path.join(stateDir, 'active-agents.json');
  const offerPath = detectOfferFromPrompt(prompt);

  try {
    fs.mkdirSync(stateDir, { recursive: true });

    // Read existing set
    let agentSet = {};
    try {
      if (fs.existsSync(setPath)) {
        agentSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
      }
    } catch { agentSet = {}; }

    // Add/update this persona
    agentSet[personaId] = {
      offer: offerPath,
      task: `Top-level: ${prompt.substring(0, 80).trim()}`,
      timestamp: new Date().toISOString(),
      activatedAt: Date.now(),
      source: 'persona-detector',
    };

    fs.writeFileSync(setPath, JSON.stringify(agentSet, null, 2));

    // Also write single marker for backwards compat
    const markerPath = path.join(stateDir, 'active-persona.json');
    fs.writeFileSync(markerPath, JSON.stringify({
      persona: personaId,
      offer: offerPath,
      timestamp: new Date().toISOString(),
      activatedAt: Date.now(),
    }, null, 2));
  } catch { /* non-critical */ }

  // Emit dashboard event
  try {
    const dashUrl = process.env.DASHBOARD_URL || 'http://localhost:4001';
    fetch(`${dashUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AgentStart',
        timestamp: Date.now(),
        agent_id: personaId,
        offer: offerPath,
        task: `Top-level persona: @${personaId}`,
        source: 'persona-detector',
      }),
      signal: AbortSignal.timeout(1000),
    }).catch(() => {});
  } catch { /* non-critical */ }

  process.stdout.write(JSON.stringify({}));
}

main().catch(() => process.exit(0));
