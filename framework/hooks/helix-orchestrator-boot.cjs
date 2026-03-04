'use strict';

/**
 * Helix Orchestrator Boot Hook
 * Event: SessionStart
 * Budget: <5s
 *
 * Detects offer state and outputs routing context for Helix (Copy Chief).
 * Enhanced: checks for active execution plan or continue-here.yaml first.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    // No stdin available
  }

  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    // Invalid JSON
  }

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  try {
    // --- Plan-aware boot: check for active execution plan ---
    const planDirective = checkActivePlan(ecosystemRoot);
    if (planDirective) {
      const output = {
        hookSpecificOutput: {
          additionalContext: planDirective,
        },
      };
      process.stdout.write(JSON.stringify(output));
      return;
    }

    // --- U-02: Manifest validation ---
    let manifestWarnings = '';
    try {
      const { validateManifest } = require(
        path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'health', 'manifest-validator')
      );
      const synapsePath = path.join(ecosystemRoot, '.synapse');
      const mvResult = validateManifest(synapsePath);
      if (mvResult.warnings.length > 0) {
        manifestWarnings = `<manifest-warnings>${mvResult.warnings.join('; ')}</manifest-warnings>`;
      }
    } catch { /* non-critical */ }

    // --- Original routing (no active plan) ---
    const { HelixOrchestrator } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'orchestration', 'helix-orchestrator')
    );

    const orchestrator = new HelixOrchestrator(ecosystemRoot, { debug: false });
    const result = orchestrator.orchestrate(context);
    let routingContext = orchestrator.formatRoutingContext(result) + manifestWarnings;

    // Chief knowledge injection (condensed craft principles for routing decisions)
    try {
      const { KnowledgeLoader } = require(
        path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'activation', 'knowledge-loader')
      );
      const loader = new KnowledgeLoader(ecosystemRoot);
      const principles = loader.loadChiefKnowledge();
      if (principles) {
        routingContext += '\n<chief-knowledge>\n' + principles + '\n</chief-knowledge>';
      }
    } catch { /* non-critical — Chief operates degraded without knowledge */ }

    const output = {
      hookSpecificOutput: {
        additionalContext: routingContext,
      },
    };

    process.stdout.write(JSON.stringify(output));
  } catch (error) {
    // Graceful degradation — don't block session start
    const output = {
      hookSpecificOutput: {
        additionalContext: `<helix-routing><error>${error.message}</error></helix-routing>`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  }
}

/**
 * Check all offers for active execution plans or continue-here.yaml.
 * Returns directive XML if found, null otherwise.
 */
function checkActivePlan(ecosystemRoot) {
  const UUID_RE = /^[0-9a-f]{8}-/;
  const SKIP_DIRS = new Set(['docs', 'scripts', 'site', 'export', 'knowledge', 'squads',
    'squad-prompts', 'metodologias-de-copy', 'pesquisas-setup', 'copy-chief-tutorial', 'research']);

  try {
    const topDirs = fs.readdirSync(ecosystemRoot, { withFileTypes: true });
    for (const topDir of topDirs) {
      if (!topDir.isDirectory() || topDir.name.startsWith('.')) continue;
      if (UUID_RE.test(topDir.name) || SKIP_DIRS.has(topDir.name)) continue;

      const nichePath = path.join(ecosystemRoot, topDir.name);
      let offerDirs;
      try { offerDirs = fs.readdirSync(nichePath, { withFileTypes: true }); } catch { continue; }

      for (const dir of offerDirs) {
        if (!dir.isDirectory() || dir.name.startsWith('.')) continue;
        const offerPath = `${topDir.name}/${dir.name}`;
        const aiosDir = path.join(nichePath, dir.name, '.aios');

        // Priority 1: continue-here.yaml (session resume)
        const continuePath = path.join(aiosDir, 'continue-here.yaml');
        if (fs.existsSync(continuePath)) {
          return buildResumeFromContinueHere(ecosystemRoot, offerPath, continuePath);
        }

        // Priority 2: execution-plan.yaml with status=executing
        const planPath = path.join(aiosDir, 'execution-plan.yaml');
        if (fs.existsSync(planPath)) {
          return buildDirectiveFromPlan(ecosystemRoot, offerPath, planPath);
        }
      }
    }
  } catch { /* fail-open */ }

  return null;
}

function buildResumeFromContinueHere(ecosystemRoot, offerPath, continuePath) {
  try {
    const yaml = require('js-yaml');
    const continueHere = yaml.load(fs.readFileSync(continuePath, 'utf8'));
    if (!continueHere?.plan_id) return null;

    const { PlanStateMachine } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'plan', 'plan-state-machine')
    );
    const { ExecutionPlanGenerator } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'plan', 'execution-plan-generator')
    );

    const gen = new ExecutionPlanGenerator(ecosystemRoot);
    const plan = gen.load(offerPath);
    if (!plan) return null;

    const sm = new PlanStateMachine(ecosystemRoot);

    // Remove continue-here.yaml after loading (consumed)
    try { fs.unlinkSync(continuePath); } catch { /* ok */ }

    const baseDirective = sm._buildResumeDirective(plan, continueHere);
    return enrichDirectiveWithContinueHere(baseDirective, continueHere);
  } catch {
    return null;
  }
}

/**
 * Injects enriched continue-here fields into a routing context XML string.
 * Adds <dispatch-queue-snapshot> and <recent-outputs> sections before the
 * closing tag of the directive (or at the end if no closing tag found).
 */
function enrichDirectiveWithContinueHere(directive, continueHere) {
  if (!directive || !continueHere) return directive;

  const extra = [];

  if (continueHere.dispatch_queue_snapshot) {
    const dqs = continueHere.dispatch_queue_snapshot;
    extra.push(
      '  <dispatch-queue-snapshot>',
      `    <pending>${dqs.pending ?? 0}</pending>`,
      `    <completed>${dqs.completed ?? 0}</completed>`,
      `    <failed>${dqs.failed ?? 0}</failed>`,
      '  </dispatch-queue-snapshot>',
    );
  }

  if (continueHere.last_agent_outputs && continueHere.last_agent_outputs.length > 0) {
    extra.push('  <recent-outputs>');
    for (const f of continueHere.last_agent_outputs) {
      extra.push(`    <file>${f}</file>`);
    }
    extra.push('  </recent-outputs>');
  }

  if (extra.length === 0) return directive;

  // Insert extra sections before the last closing XML tag
  const lastCloseIdx = directive.lastIndexOf('</');
  if (lastCloseIdx > 0) {
    return directive.slice(0, lastCloseIdx) + extra.join('\n') + '\n' + directive.slice(lastCloseIdx);
  }
  return directive + '\n' + extra.join('\n');
}

function buildDirectiveFromPlan(ecosystemRoot, offerPath, planPath) {
  try {
    const yaml = require('js-yaml');
    const plan = yaml.load(fs.readFileSync(planPath, 'utf8'));
    if (!plan || plan.status !== 'executing') return null;

    const { PlanStateMachine } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'plan', 'plan-state-machine')
    );
    const sm = new PlanStateMachine(ecosystemRoot);
    return sm.getDirective(plan);
  } catch {
    return null;
  }
}

main().catch(err => {
  process.stderr.write(`[helix-orchestrator-boot] Fatal: ${err.message}\n`);
  process.exit(0); // Don't block session
});
