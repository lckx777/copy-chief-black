'use strict';

/**
 * Quality Collector — Copy Chief BLACK Edition
 *
 * Scores context quality using two weighted rubrics:
 *
 * 1. UAP Loader Scoring (Copy Chief equivalent — agent activation pipeline):
 *    agentConfig=25, memories=20, sessionContext=15, offerContext=15,
 *    craftData=10, dependencies=10, squadConfig=5
 *
 * 2. Hook Layer Scoring (SYNAPSE pipeline layers):
 *    constitution=25, agent=25, global=20, domain=15, craft=10, memory=5
 *
 * Bracket-aware: FRESH only uses [0,1,2,6,7] so max possible score adjusts.
 * Reads bracket from hook-metrics.json and bracket-config.yaml for validation.
 *
 * Grades: A (90+), B (80+), C (70+), D (60+), F (<60)
 *
 * @module core/synapse/diagnostics/collectors/quality-collector
 * @version 2.0.0
 * @adapted Copy Chief BLACK (from Synkra AIOS Core SYN-12)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const yaml = require('js-yaml');

const HOME = os.homedir();

// ---------------------------------------------------------------------------
// Rubrics
// ---------------------------------------------------------------------------

/**
 * Agent Activation Loader rubric (Copy Chief equivalent of UAP loaders).
 * Scores the quality of context loaded when an agent is activated.
 */
const AGENT_LOADER_RUBRIC = [
  { name: 'agentConfig',    weight: 25, criticality: 'CRITICAL', impact: 'Agent identity, persona, instructions' },
  { name: 'memories',       weight: 20, criticality: 'HIGH',     impact: 'Episodic memory + VOC summaries' },
  { name: 'sessionContext', weight: 15, criticality: 'HIGH',     impact: 'Session continuity + offer state' },
  { name: 'offerContext',   weight: 15, criticality: 'HIGH',     impact: 'Offer CONTEXT.md + helix-state' },
  { name: 'craftData',      weight: 10, criticality: 'MEDIUM',   impact: 'Squad craft data (psicologia, escrita)' },
  { name: 'dependencies',   weight: 10, criticality: 'MEDIUM',   impact: 'Agent frontmatter dependencies.data' },
  { name: 'squadConfig',    weight:  5, criticality: 'LOW',      impact: 'Squad YAML + workflow definitions' },
];

/**
 * SYNAPSE Hook layer rubric.
 * Maps each layer name to its quality weight and criticality.
 */
const HOOK_LAYER_RUBRIC = [
  { name: 'constitution', weight: 25, criticality: 'CRITICAL', impact: 'Copy Chief BLACK principles' },
  { name: 'agent',        weight: 25, criticality: 'CRITICAL', impact: 'Persona-specific rules (L2)' },
  { name: 'global',       weight: 20, criticality: 'CRITICAL', impact: 'Project-wide rules (L1)' },
  { name: 'domain',       weight: 15, criticality: 'HIGH',     impact: 'DRE, HELIX, mecanismo domains (L6)' },
  { name: 'craft',        weight: 10, criticality: 'MEDIUM',   impact: 'Craft domain keywords' },
  { name: 'memory',       weight:  5, criticality: 'LOW',      impact: 'Memory hints (DEPLETED+)' },
];

/**
 * Hook layer name aliases — maps hook-metrics perLayer keys to rubric names.
 * 'keyword' layer in metrics = 'domain' in quality rubric (L6 = domain keywords).
 */
const LAYER_ALIAS = {
  keyword: 'domain',
  'star-command': 'memory', // star-command carries memory-level weight
};

/**
 * Layers expected to be active per bracket (from bracket-config.yaml layer indices).
 * Layer 0=constitution, 1=global, 2=agent, 6=keyword(domain), 7=star-command(memory)
 */
const BRACKET_EXPECTED_LAYERS = {
  FRESH:    ['constitution', 'global', 'agent', 'domain'],
  MODERATE: ['constitution', 'global', 'agent', 'domain', 'workflow', 'task', 'squad', 'memory'],
  DEPLETED: ['constitution', 'global', 'agent', 'domain', 'workflow', 'task', 'squad', 'memory'],
  CRITICAL: ['constitution', 'global', 'agent', 'domain', 'workflow', 'task', 'squad', 'memory'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
 * Safely read and parse a YAML file.
 * @param {string} filePath
 * @returns {object|null}
 */
function _safeReadYaml(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Convert score to letter grade.
 * @param {number} score - 0-100
 * @returns {string} Grade letter
 */
function _getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Grade label.
 * @param {string} grade
 * @returns {string}
 */
function _getGradeLabel(grade) {
  const labels = { A: 'EXCELLENT', B: 'GOOD', C: 'ADEQUATE', D: 'POOR', F: 'FAILING' };
  return labels[grade] || 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Agent Activation Quality (Copy Chief equivalent of UAP scoring)
// ---------------------------------------------------------------------------

/**
 * Score agent activation quality by inspecting what context files actually exist
 * for the active agent. Reads active-agents.json to find the offer, then checks
 * if the relevant context directories/files exist.
 *
 * @param {string} projectRoot
 * @returns {{ available: boolean, score: number, maxPossible: number, loaders: Array }}
 */
function _scoreAgentActivation(projectRoot) {
  const agentsPath = path.join(HOME, '.claude', 'session-state', 'active-agents.json');
  const activeAgents = _safeReadJson(agentsPath);

  if (!activeAgents || Object.keys(activeAgents).length === 0) {
    return { available: false, score: 0, maxPossible: 0, loaders: [] };
  }

  // Take first active agent
  const agentId = Object.keys(activeAgents)[0];
  const agentData = activeAgents[agentId];
  const offer = agentData.offer;

  // Check what context is available for this agent
  const agentMd = path.join(HOME, '.claude', 'agents', `${agentId}.md`);
  const agentMemory = path.join(HOME, '.claude', 'agent-memory', agentId);
  const offerContextPath = offer ? path.join(projectRoot, offer, 'CONTEXT.md') : null;
  const helixPath = offer ? path.join(projectRoot, offer, 'helix-state.yaml') : null;
  const craftPath = path.join(projectRoot, 'squads', 'copy-chief', 'data', 'craft');
  const squadPath = path.join(projectRoot, 'squads', 'copy-chief', 'squad.yaml');

  const presenceMap = {
    agentConfig:    fs.existsSync(agentMd),
    memories:       fs.existsSync(agentMemory),
    sessionContext: fs.existsSync(agentsPath),
    offerContext:   offerContextPath ? (fs.existsSync(offerContextPath) || fs.existsSync(helixPath || '')) : false,
    craftData:      fs.existsSync(craftPath),
    dependencies:   agentMd ? _agentHasDependencies(agentMd) : false,
    squadConfig:    fs.existsSync(squadPath),
  };

  const maxPossible = AGENT_LOADER_RUBRIC.reduce((sum, r) => sum + r.weight, 0);
  let totalScore = 0;

  const loaders = AGENT_LOADER_RUBRIC.map(rubric => {
    const present = presenceMap[rubric.name] === true;
    const score = present ? rubric.weight : 0;
    totalScore += score;
    return {
      name: rubric.name,
      score,
      maxScore: rubric.weight,
      criticality: rubric.criticality,
      impact: rubric.impact,
      status: present ? 'ok' : 'missing',
    };
  });

  return { available: true, score: totalScore, maxPossible, loaders, agentId, offer };
}

/**
 * Check if an agent .md file has dependencies.data frontmatter entries.
 * @param {string} agentPath
 * @returns {boolean}
 */
function _agentHasDependencies(agentPath) {
  try {
    const content = fs.readFileSync(agentPath, 'utf8');
    return content.includes('dependencies:') && content.includes('data:');
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hook Layer Quality
// ---------------------------------------------------------------------------

/**
 * Score SYNAPSE hook layer quality from hook-metrics.json, bracket-adjusted.
 *
 * @param {string} projectRoot
 * @returns {{ available: boolean, score: number, maxPossible: number, bracket: string, layers: Array }}
 */
function _scoreHookLayers(projectRoot) {
  const hookData = _safeReadJson(
    path.join(projectRoot, '.synapse', 'metrics', 'hook-metrics.json')
  );

  if (!hookData || !hookData.perLayer) {
    return { available: false, score: 0, maxPossible: 0, bracket: 'unknown', layers: [] };
  }

  const bracket = hookData.bracket || 'MODERATE';

  // Load bracket-config.yaml for validation (fallback to hardcoded)
  const bracketConfigPath = path.join(projectRoot, '.synapse', 'bracket-config.yaml');
  const bracketConfig = _safeReadYaml(bracketConfigPath);
  const bracketDef = bracketConfig && bracketConfig.brackets && bracketConfig.brackets[bracket];
  const activeLayers = BRACKET_EXPECTED_LAYERS[bracket] || BRACKET_EXPECTED_LAYERS.MODERATE;

  let totalScore = 0;
  let maxPossible = 0;

  const layers = HOOK_LAYER_RUBRIC.map(rubric => {
    const isExpected = activeLayers.includes(rubric.name);
    if (!isExpected) {
      return {
        name: rubric.name,
        score: 0,
        maxScore: 0,
        criticality: rubric.criticality,
        impact: rubric.impact,
        status: 'not-expected',
        rules: 0,
      };
    }

    maxPossible += rubric.weight;

    // Find the layer in metrics — may be under an alias (e.g. 'keyword' -> 'domain')
    const reverseAlias = Object.entries(LAYER_ALIAS).find(([, v]) => v === rubric.name);
    const metricsKey = reverseAlias ? reverseAlias[0] : rubric.name;
    const layerInfo = hookData.perLayer[metricsKey] || hookData.perLayer[rubric.name];

    const isOk = layerInfo && layerInfo.status === 'ok';
    const score = isOk ? rubric.weight : 0;
    totalScore += score;

    return {
      name: rubric.name,
      score,
      maxScore: rubric.weight,
      criticality: rubric.criticality,
      impact: rubric.impact,
      status: layerInfo ? layerInfo.status : 'missing',
      rules: layerInfo ? (layerInfo.rules || 0) : 0,
    };
  });

  return {
    available: true,
    score: totalScore,
    maxPossible,
    bracket,
    bracketDef: bracketDef || null,
    layers,
  };
}

// ---------------------------------------------------------------------------
// Main collector
// ---------------------------------------------------------------------------

/**
 * Collect context quality analysis.
 *
 * @param {string} projectRoot - Absolute path to copywriting-ecosystem root
 * @returns {{
 *   name: string,
 *   status: string,
 *   data: {
 *     agentActivation: object,
 *     hookLayers: object,
 *     overall: { score: number, grade: string, label: string }
 *   },
 *   message: string
 * }}
 */
function collectQualityMetrics(projectRoot) {
  const agentActivation = _scoreAgentActivation(projectRoot);
  const hookLayers = _scoreHookLayers(projectRoot);

  // Normalize scores to 0-100
  const agentNorm = agentActivation.maxPossible > 0
    ? Math.round((agentActivation.score / agentActivation.maxPossible) * 100)
    : 0;
  const hookNorm = hookLayers.maxPossible > 0
    ? Math.round((hookLayers.score / hookLayers.maxPossible) * 100)
    : 0;

  // Overall: 40% agent activation, 60% hook layers (hook = runtime truth)
  let overallScore;
  if (agentActivation.available && hookLayers.available) {
    overallScore = Math.round(agentNorm * 0.4 + hookNorm * 0.6);
  } else if (agentActivation.available) {
    overallScore = agentNorm;
  } else if (hookLayers.available) {
    overallScore = hookNorm;
  } else {
    overallScore = 0;
  }

  const grade = _getGrade(overallScore);
  const label = _getGradeLabel(grade);

  const status = grade === 'A' ? 'OK' : grade === 'F' ? 'FAIL' : 'WARN';

  return {
    name: 'quality',
    status,
    data: {
      agentActivation: {
        ...agentActivation,
        normalizedScore: agentNorm,
      },
      hookLayers: {
        ...hookLayers,
        normalizedScore: hookNorm,
      },
      overall: { score: overallScore, grade, label },
    },
    message: `Overall: ${overallScore}/100 (${grade} — ${label}) | Agent: ${agentNorm}/100 | Hook: ${hookNorm}/100`,
  };
}

module.exports = {
  collectQualityMetrics,
  AGENT_LOADER_RUBRIC,
  HOOK_LAYER_RUBRIC,
  BRACKET_EXPECTED_LAYERS,
};
