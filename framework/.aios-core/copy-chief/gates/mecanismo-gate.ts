/**
 * mecanismo-gate.ts — Mecanismo Unico Gate Module
 * Part of AIOS Copy Chief OS Layer
 *
 * Enforces Mecanismo Unico validation before allowing production writes.
 * Blocks production/ writes if mecanismo-unico.yaml is missing or not validated.
 *
 * Usage:
 *   import { preToolUse } from './mecanismo-gate'
 *
 * Exit conventions (for CLI wrappers):
 *   - Allow → exit 0
 *   - Block → print message to stdout, then process.exit(2)
 *
 * Extracted from: ~/.claude/hooks/mecanismo-validation.ts
 * Created: 2026-02 | Refactored: 2026-03-02
 */

import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { parse as yamlParse } from 'yaml';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BLIND_CRITIC_THRESHOLD = 8;
export const EMOTIONAL_STRESS_THRESHOLD = 8;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MecanismoData {
  unique_mechanism?: {
    validation?: {
      state?: string;
      mcp_validation?: {
        consensus_passed?: boolean;
        blind_critic_mup_score?: number;
        blind_critic_mus_score?: number;
        emotional_stress_test_score?: number;
        all_passed?: boolean;
      };
      human_approved?: boolean;
    };
  };
  // Flat format support
  state?: string;
  validation?: Record<string, unknown>;
}

export interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    gate_name?: string;
    [key: string]: unknown;
  };
}

export interface HookOutput {
  decision: 'allow' | 'block' | 'modify';
  message?: string;
  modified_input?: Record<string, unknown>;
}

// ─── Offer Root Discovery ─────────────────────────────────────────────────────

/**
 * Walk up the directory tree from a file path to find the offer root.
 * Identified by the presence of CONTEXT.md or mecanismo-unico.yaml.
 */
export function findOfferRoot(filePath: string): string | null {
  let current = path.dirname(filePath);
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    if (
      existsSync(path.join(current, 'CONTEXT.md')) ||
      existsSync(path.join(current, 'mecanismo-unico.yaml'))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }

  return null;
}

// ─── Mecanismo Loader ─────────────────────────────────────────────────────────

/**
 * Load and parse the mecanismo-unico.yaml for an offer root path.
 * Returns null if the file doesn't exist or fails to parse.
 */
export function loadMecanismo(offerPath: string): MecanismoData | null {
  const mecanismoPath = path.join(offerPath, 'mecanismo-unico.yaml');

  if (!existsSync(mecanismoPath)) {
    return null;
  }

  try {
    const content = readFileSync(mecanismoPath, 'utf-8');
    return yamlParse(content) as MecanismoData;
  } catch (e) {
    console.error(`Error parsing mecanismo-unico.yaml: ${e}`);
    return null;
  }
}

// ─── Validation Logic ─────────────────────────────────────────────────────────

/**
 * Check if a parsed MecanismoData is in a validated/approved state.
 * Supports both nested (unique_mechanism.validation.state) and flat (state) formats.
 */
export function isMecanismoValidated(data: MecanismoData): { valid: boolean; reason: string } {
  const validation = data.unique_mechanism?.validation || (data.validation as any) || data;
  const state =
    data.unique_mechanism?.validation?.state ||
    data.state ||
    (validation as any)?.state ||
    'UNDEFINED';

  if (state === 'APPROVED' || state === 'VALIDATED') {
    return { valid: true, reason: `State: ${state}` };
  }

  const mcp =
    (validation as any)?.mcp_validation ||
    data.unique_mechanism?.validation?.mcp_validation;

  if (!mcp) {
    return {
      valid: false,
      reason: 'MCP validation not run. Execute: consensus, blind_critic, emotional_stress_test',
    };
  }

  const issues: string[] = [];

  if (!mcp.consensus_passed) {
    issues.push('consensus not passed');
  }
  if ((mcp.blind_critic_mup_score || 0) < BLIND_CRITIC_THRESHOLD) {
    issues.push(`blind_critic MUP: ${mcp.blind_critic_mup_score || 0}/10 (need ${BLIND_CRITIC_THRESHOLD}+)`);
  }
  if ((mcp.blind_critic_mus_score || 0) < BLIND_CRITIC_THRESHOLD) {
    issues.push(`blind_critic MUS: ${mcp.blind_critic_mus_score || 0}/10 (need ${BLIND_CRITIC_THRESHOLD}+)`);
  }
  if ((mcp.emotional_stress_test_score || 0) < EMOTIONAL_STRESS_THRESHOLD) {
    issues.push(`emotional_stress_test: ${mcp.emotional_stress_test_score || 0}/10 (need ${EMOTIONAL_STRESS_THRESHOLD}+)`);
  }

  if (issues.length > 0) {
    return { valid: false, reason: `MCP validation issues: ${issues.join(', ')}` };
  }

  return { valid: false, reason: `State is ${state}, needs VALIDATED or APPROVED` };
}

// ─── Block Message Builders ───────────────────────────────────────────────────

export function buildMissingMecanismoMessage(offerRoot: string): string {
  return `
\uD83D\uDEAB BLOQUEADO - MECANISMO UNICO NAO DEFINIDO

Para escrever em production/, o Mecanismo Unico deve estar validado.

Arquivo faltando: ${path.join(offerRoot, 'mecanismo-unico.yaml')}

ACAO OBRIGATORIA:
1. Crie mecanismo-unico.yaml usando o template
2. Preencha MUP, MUS e INDUTOR
3. Valide via MCP (consensus, blind_critic, emotional_stress_test)
4. Marque human_approved: true

Template: ~/.claude/templates/mecanismo-unico-template.md
Schema: ~/.claude/schemas/mecanismo-unico.schema.yaml
`;
}

export function buildInvalidMecanismoMessage(reason: string, offerRoot: string): string {
  return `
\uD83D\uDEAB BLOQUEADO - MECANISMO NAO VALIDADO

${reason}

Para escrever em production/, o Mecanismo Unico deve estar VALIDATED ou APPROVED.

ACAO OBRIGATORIA:
1. Complete mecanismo-unico.yaml
2. Run: consensus (selecionar MUP/MUS)
3. Run: blind_critic (score >= 8 para MUP e MUS)
4. Run: emotional_stress_test (score >= 8)
5. Set human_approved: true

Validar: python3 ~/copywriting-ecosystem/scripts/validate-mecanismo.py ${offerRoot}
`;
}

// ─── Main Gate Handler ────────────────────────────────────────────────────────

/**
 * PreToolUse gate handler.
 *
 * Checks:
 * 1. Write to production/ → requires validated mecanismo-unico.yaml
 * 2. validate_gate("briefing") → warns (actual enforcement in MCP tool)
 */
export function preToolUse(input: HookInput): HookOutput {
  const { tool_name, tool_input } = input;

  // Check 1: Write to production/ directory
  if (tool_name === 'Write' && tool_input.file_path) {
    const filePath = tool_input.file_path;

    if (!filePath.includes('/production/')) {
      return { decision: 'allow' };
    }

    const offerRoot = findOfferRoot(filePath);
    if (!offerRoot) {
      console.warn('Could not determine offer root for production write');
      return { decision: 'allow' };
    }

    const mecanismo = loadMecanismo(offerRoot);

    if (!mecanismo) {
      return {
        decision: 'block',
        message: buildMissingMecanismoMessage(offerRoot),
      };
    }

    const { valid, reason } = isMecanismoValidated(mecanismo);

    if (!valid) {
      return {
        decision: 'block',
        message: buildInvalidMecanismoMessage(reason, offerRoot),
      };
    }

    return { decision: 'allow' };
  }

  // Check 2: validate_gate("briefing") call — warn only
  if (tool_name === 'mcp__copywriting__validate_gate' && tool_input.gate_name === 'briefing') {
    console.log('validate_gate(briefing) called - ensure mecanismo-unico.yaml is validated');
    return { decision: 'allow' };
  }

  return { decision: 'allow' };
}
