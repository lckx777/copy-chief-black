'use strict';

/**
 * Plan Session Guard
 * Event: PreCompact
 * Budget: <3s
 *
 * Before compact, saves continue-here.yaml if an execution plan is active.
 * This ensures session continuity across compacts and new sessions.
 */

const fs = require('fs');
const path = require('path');

/**
 * Writes an enriched continue-here.yaml to targetPath for the given offerPath.
 * offerPath is relative to ecosystemRoot (e.g. 'saude/florayla').
 * Exported for testing.
 */
function _writeContinueHereToPath(targetPath, offerPath) {
  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  const yaml = require('js-yaml');

  // --- Base fields ---
  const doc = {
    offer: offerPath,
    phase: null,
    timestamp: new Date().toISOString(),
    plan_id: null,
  };

  // Try to load plan for phase/plan_id
  const aiosDir = path.join(ecosystemRoot, offerPath, '.aios');
  const planPath = path.join(aiosDir, 'execution-plan.yaml');
  try {
    const plan = yaml.load(fs.readFileSync(planPath, 'utf8'));
    if (plan) {
      doc.plan_id = plan.id || null;
      doc.phase = plan.current_task || null;
    }
  } catch { /* non-critical */ }

  // --- dispatch_queue_snapshot ---
  const queuePath = path.join(aiosDir, 'dispatch-queue.yaml');
  try {
    if (fs.existsSync(queuePath)) {
      const queue = yaml.load(fs.readFileSync(queuePath, 'utf8'));
      const dispatches = queue && Array.isArray(queue.dispatches) ? queue.dispatches : [];
      const pending = dispatches.filter(d => d.status === 'pending').length;
      const completed = dispatches.filter(d => d.status === 'completed').length;
      const failed = dispatches.filter(d => d.status === 'failed').length;
      doc.dispatch_queue_snapshot = { pending, completed, failed };
    } else {
      doc.dispatch_queue_snapshot = { pending: 0, completed: 0, failed: 0 };
    }
  } catch {
    doc.dispatch_queue_snapshot = { pending: 0, completed: 0, failed: 0 };
  }

  // --- last_agent_outputs ---
  try {
    const entries = fs.readdirSync(aiosDir, { withFileTypes: true });
    const outputFiles = entries
      .filter(e => e.isFile() && e.name !== 'execution-plan.yaml' && e.name !== 'dispatch-queue.yaml' && e.name !== 'continue-here.yaml')
      .map(e => {
        const fullPath = path.join(aiosDir, e.name);
        let mtime = 0;
        try { mtime = fs.statSync(fullPath).mtimeMs; } catch { /* ignore */ }
        return { name: e.name, mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 3)
      .map(e => e.name);
    doc.last_agent_outputs = outputFiles;
  } catch {
    doc.last_agent_outputs = [];
  }

  // --- circuit_breaker_status ---
  const cbPath = path.join(process.env.HOME, '.claude', '.hook-health', 'mcp-circuit-breaker-hook.json');
  try {
    if (fs.existsSync(cbPath)) {
      const raw = JSON.parse(fs.readFileSync(cbPath, 'utf8'));
      doc.circuit_breaker_status = raw;
    } else {
      doc.circuit_breaker_status = null;
    }
  } catch {
    doc.circuit_breaker_status = null;
  }

  // --- pending_human_decisions (placeholder) ---
  doc.pending_human_decisions = [];

  // Write YAML
  const targetDir = path.dirname(targetPath);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, yaml.dump(doc, { lineWidth: 120 }), 'utf8');
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  // Scan for active execution plan
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
        const planPath = path.join(nichePath, dir.name, '.aios', 'execution-plan.yaml');
        if (!fs.existsSync(planPath)) continue;

        try {
          const yaml = require('js-yaml');
          const plan = yaml.load(fs.readFileSync(planPath, 'utf8'));
          if (!plan || plan.status !== 'executing') continue;

          const offerPath = `${topDir.name}/${dir.name}`;
          const continuePath = path.join(nichePath, dir.name, '.aios', 'continue-here.yaml');
          _writeContinueHereToPath(continuePath, offerPath);
        } catch { /* non-critical */ }
      }
    }
  } catch { /* fail-open */ }

  process.stdout.write(JSON.stringify({}));
}

module.exports = { _writeContinueHereToPath };

main().catch(() => process.exit(0));
