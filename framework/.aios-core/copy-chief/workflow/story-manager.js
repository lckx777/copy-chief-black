'use strict';

/**
 * Story Manager
 * U-23: Story-Driven Production
 *
 * Manages story lifecycle per-offer at {offer}/.aios/story.yaml
 * A story is a production contract: it defines what "done" looks like
 * for a given production phase.
 *
 * @module story-manager
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ─── Internal Helpers ────────────────────────────────────────────────────────

function storyPath(offerPath) {
  return path.join(offerPath, '.aios', 'story.yaml');
}

function ensureAiosDir(offerPath) {
  const dir = path.join(offerPath, '.aios');
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Derive acceptance criteria from a workflow definition.
 * Each phase in the workflow that has agents produces one criterion per agent:
 *   "agent {agentId} produces output for {phaseId}"
 * Falls back to a generic criterion if no phases are found.
 */
function deriveCriteria(workflowDef) {
  const criteria = [];

  const phases = workflowDef?.phases || workflowDef?.workflow?.phases || [];

  for (const phase of phases) {
    const agents = phase.agents || [];
    const phaseId = phase.id || 'unknown';
    const expectedOutputs = phase.expected_outputs || [];

    if (agents.length === 0 && expectedOutputs.length === 0) {
      // Phase with no agents and no outputs — skip
      continue;
    }

    if (agents.length > 0) {
      for (const agentId of agents) {
        const outputHint = expectedOutputs.length > 0
          ? expectedOutputs.join(', ')
          : `output for phase ${phaseId}`;
        criteria.push({
          id: `${phaseId}-${agentId}`,
          description: `agent ${agentId} produces ${outputHint}`,
          phase_id: phaseId,
          agent_id: agentId,
          expected_outputs: expectedOutputs,
        });
      }
    } else {
      // Phase has expected_outputs but no named agents
      criteria.push({
        id: phaseId,
        description: `phase ${phaseId} produces ${expectedOutputs.join(', ')}`,
        phase_id: phaseId,
        agent_id: null,
        expected_outputs: expectedOutputs,
      });
    }
  }

  if (criteria.length === 0) {
    // Fallback: at least one generic criterion so story is not trivially met
    criteria.push({
      id: 'production-complete',
      description: 'production output delivered to production/ directory',
      phase_id: 'production',
      agent_id: null,
      expected_outputs: [],
    });
  }

  return criteria;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a new story for an offer.
 *
 * @param {string} offerPath   Absolute path to the offer directory
 * @param {string} phase       Phase name (e.g. 'production', 'research')
 * @param {object} workflowDef Workflow definition object (phases[], or workflow.phases[])
 * @returns {object} The story object written to disk
 */
function createStory(offerPath, phase, workflowDef) {
  ensureAiosDir(offerPath);

  const acceptanceCriteria = deriveCriteria(workflowDef || {});

  const story = {
    status: 'open',
    phase: phase || 'unknown',
    created_at: new Date().toISOString(),
    acceptance_criteria: acceptanceCriteria,
    completed_criteria: [],
  };

  const filePath = storyPath(offerPath);
  const content = yaml.dump(story, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(filePath, content, 'utf8');

  return story;
}

/**
 * Check which acceptance criteria are currently met.
 * A criterion is met if all its expected_outputs exist as files (or if it has none,
 * it is not auto-met — requires explicit completion).
 *
 * @param {string} offerPath Absolute path to the offer directory
 * @returns {{ met: number, total: number, all_met: boolean, story: object|null }}
 */
function checkCriteria(offerPath) {
  const filePath = storyPath(offerPath);
  if (!fs.existsSync(filePath)) {
    return { met: 0, total: 0, all_met: false, story: null };
  }

  let story;
  try {
    story = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return { met: 0, total: 0, all_met: false, story: null };
  }

  if (!story || !Array.isArray(story.acceptance_criteria)) {
    return { met: 0, total: 0, all_met: false, story };
  }

  const criteria = story.acceptance_criteria;
  const total = criteria.length;
  let met = 0;
  const nowMet = [];

  for (const criterion of criteria) {
    const outputs = criterion.expected_outputs || [];

    if (outputs.length === 0) {
      // No file check possible — criterion must be met explicitly
      // Check if it's already in completed_criteria
      const alreadyDone = (story.completed_criteria || []).some(c =>
        (typeof c === 'string' ? c : c.id) === criterion.id
      );
      if (alreadyDone) {
        met++;
        nowMet.push(criterion.id);
      }
      continue;
    }

    // Check if all expected output files exist relative to offerPath
    const allExist = outputs.every(output => {
      const absPath = output.startsWith('/') ? output : path.join(offerPath, output);
      return fs.existsSync(absPath);
    });

    if (allExist) {
      met++;
      nowMet.push(criterion.id);
    }
  }

  return {
    met,
    total,
    all_met: total > 0 && met >= total,
    met_ids: nowMet,
    story,
  };
}

/**
 * Close a story (mark as done).
 *
 * @param {string} offerPath Absolute path to the offer directory
 * @returns {object|null} Updated story, or null if story doesn't exist
 */
function closeStory(offerPath) {
  const filePath = storyPath(offerPath);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  let story;
  try {
    story = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }

  if (!story) return null;

  story.status = 'closed';
  story.closed_at = new Date().toISOString();

  const content = yaml.dump(story, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(filePath, content, 'utf8');

  return story;
}

module.exports = { createStory, checkCriteria, closeStory };
