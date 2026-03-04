'use strict';

/**
 * Data Lifecycle Hook
 * Event: SessionStart
 * Budget: <10s
 *
 * Runs startup cleanup across all offers.
 */

const path = require('path');
const fs = require('fs');

async function main() {
  const ecosystemRoot = process.env.ECOSYSTEM_ROOT
    || path.join(process.env.HOME, 'copywriting-ecosystem');

  // Verify ecosystem exists
  if (!fs.existsSync(ecosystemRoot)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  try {
    const copyChiefPath = path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief');
    const { CopyDataLifecycle } = require(path.join(copyChiefPath, 'lifecycle', 'copy-data-lifecycle'));

    const lifecycle = new CopyDataLifecycle(ecosystemRoot, { debug: false });
    const result = await lifecycle.runStartupCleanup();

    // U-07: Memory compaction on startup
    let compactResult = { totalPruned: 0, totalTechniques: 0 };
    try {
      const { AgentMemoryManager } = require(path.join(copyChiefPath, 'memory', 'agent-memory-manager'));
      const { compactAll } = require(path.join(copyChiefPath, 'memory', 'memory-compactor'));
      const mgr = new AgentMemoryManager();
      compactResult = await compactAll(mgr);
    } catch { /* non-critical */ }

    const hasWork = result.sessionsArchived > 0 || result.locksRemoved > 0 ||
                    result.productionArchived > 0 || result.aiosCleanedUp > 0 ||
                    compactResult.totalPruned > 0;

    if (hasWork) {
      const compactMsg = compactResult.totalPruned > 0
        ? `, ${compactResult.totalPruned} episodic pruned, ${compactResult.totalTechniques} techniques extracted`
        : '';
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          additionalContext: `<data-lifecycle>Cleanup: ${result.sessionsArchived} sessions archived, ${result.locksRemoved} locks removed, ${result.productionArchived} production archived${compactMsg}</data-lifecycle>`,
        },
      }));
    } else {
      process.stdout.write(JSON.stringify({}));
    }
  } catch (error) {
    // Graceful degradation — never block session
    process.stdout.write(JSON.stringify({}));
  }
}

main().catch(() => {
  process.exit(0);
});
