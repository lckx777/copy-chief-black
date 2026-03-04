'use strict';

/**
 * Agent Authority Gate
 * Event: PreToolUse (Bash)
 * Budget: <3s
 *
 * Hard enforcement: blocks destructive ops by non-authorized agents.
 * Only @ops can: git push, git reset --hard, rm -rf
 */

const fs = require('fs');
const path = require('path');

function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch { return pass(); }

  let context;
  try {
    context = JSON.parse(input);
  } catch { return pass(); }

  const command = context.tool_input?.command || '';
  if (!command) return pass();

  // Check if command is destructive
  const destructive = isDestructive(command);
  if (!destructive) return pass();

  // Read active agents
  const setPath = path.join(process.env.HOME, '.claude', 'session-state', 'active-agents.json');
  let agentSet;
  try {
    if (!fs.existsSync(setPath)) return pass(); // No agents active → backwards compat
    agentSet = JSON.parse(fs.readFileSync(setPath, 'utf8'));
  } catch { return pass(); } // Parse failure → fail-open

  const activeIds = Object.keys(agentSet);
  if (activeIds.length === 0) return pass(); // No agents → allow

  // If ANY active agent is ops, allow
  if (activeIds.includes('ops')) return pass();

  // Block: no ops agent active
  return block(destructive, activeIds);
}

function isDestructive(cmd) {
  const lower = cmd.toLowerCase().replace(/\s+/g, ' ').trim();
  if (/\bgit\s+push\b/.test(lower)) return 'git push';
  if (/\bgit\s+reset\s+--hard\b/.test(lower)) return 'git reset --hard';
  if (/\brm\s+-rf\b/.test(lower)) return 'rm -rf';
  return null;
}

/**
 * U-10: Tier-based permission check.
 * Returns { warning } if tier is insufficient, null if OK.
 * WARNING-only (never blocks).
 *
 * Tier 1: orchestrate-workflow, validate_gate, system ops
 * Tier 2: research, validation, specialized production
 * Tier 3: basic production only
 */
function _checkTierPermission(tier, operation) {
  const TIER_1_OPS = ['orchestrate-workflow', 'dispatch-agents', 'gate-override', 'system-config'];
  const TIER_2_OPS = ['validate_gate', 'research-deep', 'cross-offer-query'];

  if (TIER_1_OPS.includes(operation) && tier > 1) {
    return { warning: `Tier ${tier} agent attempting Tier 1 operation: ${operation}` };
  }
  if (TIER_2_OPS.includes(operation) && tier > 2) {
    return { warning: `Tier ${tier} agent attempting Tier 2 operation: ${operation}` };
  }
  return null;
}

function pass() {
  process.stdout.write(JSON.stringify({}));
}

function block(op, activeAgents) {
  const msg = [
    `BLOCKED: "${op}" requires @ops authority.`,
    `Active agents: [${activeAgents.join(', ')}]`,
    `Delegate to Ops:`,
    `Agent(description: "Ops: ${op}", subagent_type: "general-purpose", model: "sonnet",`,
    `  prompt: "You are Ops (@ops). Read ~/.claude/agents/ops.md. TASK: ${op}")`,
  ].join('\n');

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: msg,
  }));
}

main();
