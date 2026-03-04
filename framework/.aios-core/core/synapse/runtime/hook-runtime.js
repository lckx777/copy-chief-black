'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Resolve runtime dependencies for Synapse hook execution.
 *
 * @param {{cwd?: string, session_id?: string, sessionId?: string}} input
 * @returns {{
 *   engine: import('../engine').SynapseEngine,
 *   session: Object
 * } | null}
 */
function resolveHookRuntime(input) {
  const cwd = input && input.cwd;
  const sessionId = input && (input.session_id || input.sessionId);
  if (!cwd || typeof cwd !== 'string') return null;

  const synapsePath = path.join(cwd, '.synapse');
  if (!fs.existsSync(synapsePath)) return null;

  try {
    // Copy Chief BLACK: resolve core modules via __dirname (not cwd)
    // .aios-core lives at ~/.claude/.aios-core/, hook-runtime.js is inside it
    const coreBase = path.resolve(__dirname, '..');
    const { loadSession } = require(
      path.join(coreBase, 'session', 'session-manager.js'),
    );
    const { SynapseEngine } = require(
      path.join(coreBase, 'engine.js'),
    );
    const { parseManifest } = require(
      path.join(coreBase, 'domain', 'domain-loader.js'),
    );

    const sessionsDir = path.join(synapsePath, 'sessions');
    const session = loadSession(sessionId, sessionsDir) || { prompt_count: 0 };

    // Load and parse manifest so layers (L0-L7) have domain data
    const manifestPath = path.join(synapsePath, 'manifest');
    const manifest = parseManifest(manifestPath);
    const engine = new SynapseEngine(synapsePath, {
      manifest,
      devmode: manifest.devmode || false,
      synapsePath,
    });

    return { engine, session };
  } catch (error) {
    if (process.env.DEBUG === '1') {
      console.error(`[hook-runtime] Failed to resolve runtime: ${error.message}`);
    }
    return null;
  }
}

/**
 * Normalize hook output payload shape.
 * @param {string} xml
 * @returns {{hookSpecificOutput: {additionalContext: string}}}
 */
function buildHookOutput(xml) {
  return {
    hookSpecificOutput: {
      additionalContext: xml || '',
    },
  };
}

module.exports = {
  resolveHookRuntime,
  buildHookOutput,
};
