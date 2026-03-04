'use strict';

/**
 * Mutability Guard
 *
 * Enforces 4-layer config mutability rules.
 * WARNING-only (never blocks) to preserve backwards compatibility.
 *
 * @module mutability-guard
 * @version 1.0.0
 * @atom U-29
 */

const path = require('path');

/**
 * Config layer definitions.
 * L1: Core (NEVER modify) — constitution, synapse engine
 * L2: Templates (NEVER extend-only) — workflow YAMLs, templates
 * L3: Config (mutable) — core-config, MEMORY, manifest
 * L4: Runtime (ALWAYS mutable) — offer state, dispatches, agent memory
 */
const LAYERS = {
  L1_CORE: {
    name: 'Core',
    mutability: 'NEVER',
    patterns: [
      /\.aios-core\/core\/synapse\//,
      /constitution\.md$/,
      /\.synapse\/constitution$/,
    ],
  },
  L2_TEMPLATES: {
    name: 'Templates',
    mutability: 'EXTEND_ONLY',
    patterns: [
      /templates\//,
      /squads\/.*\/workflows\//,
      /squads\/.*\/schemas\//,
    ],
  },
  L3_CONFIG: {
    name: 'Config',
    mutability: 'MUTABLE',
    patterns: [
      /core-config\.yaml$/,
      /MEMORY\.md$/,
      /\.synapse\/manifest$/,
      /settings\.json$/,
    ],
  },
  L4_RUNTIME: {
    name: 'Runtime',
    mutability: 'ALWAYS',
    patterns: [
      /\.aios\//,
      /helix-state\.yaml$/,
      /mecanismo-unico\.yaml$/,
      /project_state\.yaml$/,
      /agent-memory\//,
      /dispatch-queue\.yaml$/,
      /session-state\//,
      /production\//,
      /research\//,
      /briefings?\//,
    ],
  },
};

/**
 * Determine the config layer for a file path.
 *
 * @param {string} filePath - Absolute or relative file path
 * @returns {{ layer: string, name: string, mutability: string } | null}
 */
function getLayer(filePath) {
  for (const [layerId, layer] of Object.entries(LAYERS)) {
    for (const pattern of layer.patterns) {
      if (pattern.test(filePath)) {
        return { layer: layerId, name: layer.name, mutability: layer.mutability };
      }
    }
  }
  return null;
}

/**
 * Check if a write to filePath should produce a warning.
 * Returns null if allowed, or a warning string if restricted.
 *
 * @param {string} filePath - File being written
 * @param {string} [agentId] - Agent performing the write (ops exempt)
 * @returns {string|null}
 */
function checkMutability(filePath, agentId) {
  if (agentId === 'ops') return null; // Ops agent exempt

  const layer = getLayer(filePath);
  if (!layer) return null; // Unknown layer = no restriction

  if (layer.mutability === 'NEVER') {
    return `WARNING: Modifying L1 Core file (${layer.name}): ${filePath}. L1 files should NEVER be modified directly.`;
  }

  if (layer.mutability === 'EXTEND_ONLY') {
    return `WARNING: Modifying L2 Template file (${layer.name}): ${filePath}. L2 files should only be extended, not overwritten.`;
  }

  return null; // L3 and L4 are freely mutable
}

module.exports = { getLayer, checkMutability, LAYERS };
