#!/usr/bin/env bun
// ~/.claude/hooks/tool-matrix-enforcer.ts
// Centralized Tool Matrix Enforcer — Gap Closure #2
// v1.0 (2026-03-02)
//
// REPLACES: validate-gate-prereq.ts (which hardcoded required tools)
// READS FROM: core-config.yaml quality.gates (single source of truth)
// MATCHES: mcp__copywriting__validate_gate
//
// Checks required tools per gate phase from config, not hardcoded arrays.
// Merges tool usage from offer-state (persistent) + session-state (volatile).

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  getRequiredToolGroups,
  getRecommendedTools,
  resolveToolName,
  formatToolName,
  loadOfferState,
} from '../.aios-core/copy-chief/config/config-loader';

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

type GateType = 'research' | 'briefing' | 'production' | 'delivery';

// ─── Tool Usage Detection ────────────────────────────────────────────────────

/**
 * Get tools used in a phase from persistent offer state (helix-state.yaml).
 */
function getToolsFromOfferState(offerPath: string | null, gate: GateType): string[] {
  if (!offerPath) return [];

  try {
    const helixStatePath = join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');
    if (!existsSync(helixStatePath)) return [];

    const content = readFileSync(helixStatePath, 'utf-8');

    // Parse tools_by_phase section
    const toolsByPhaseMatch = content.match(
      new RegExp(`tools_by_phase:[\\s\\S]*?${gate}:\\s*\\n((?:\\s+-\\s+.+\\n)*)`, 'm')
    );

    if (!toolsByPhaseMatch) return [];

    const tools: string[] = [];
    const toolRegex = /^\s+-\s+(.+)$/gm;
    let match;
    while ((match = toolRegex.exec(toolsByPhaseMatch[1])) !== null) {
      const toolName = match[1].trim();
      tools.push(resolveToolName(toolName));
    }
    return tools;
  } catch {
    return [];
  }
}

/**
 * Get tools used from volatile session state.
 */
function getToolsFromSessionState(gate: GateType): string[] {
  try {
    const sessionPath = join(process.env.HOME!, '.claude', 'session-state', 'current-session.json');
    if (!existsSync(sessionPath)) return [];

    const content = readFileSync(sessionPath, 'utf-8');
    const session = JSON.parse(content);

    return session.toolsUsedByPhase?.[gate] || [];
  } catch {
    return [];
  }
}

/**
 * Detect active offer from gate input or session state.
 */
function detectOffer(input: Record<string, unknown>): string | null {
  // From tool input
  const offerPath = input.offer_path as string;
  if (offerPath) return offerPath;

  // From session state
  try {
    const sessionPath = join(process.env.HOME!, '.claude', 'session-state', 'current-session.json');
    if (existsSync(sessionPath)) {
      const content = readFileSync(sessionPath, 'utf-8');
      const session = JSON.parse(content);
      return session.activeOffer || null;
    }
  } catch {}

  return null;
}

/**
 * Merge tools from all sources (deduped).
 */
function getMergedTools(offerPath: string | null, gate: GateType): string[] {
  const offerTools = getToolsFromOfferState(offerPath, gate);
  const sessionTools = getToolsFromSessionState(gate);
  return [...new Set([...offerTools, ...sessionTools])];
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    // Only process validate_gate
    if (input.tool_name !== 'mcp__copywriting__validate_gate') {
      allow();
      return;
    }

    const gateType = input.tool_input?.gate_type as GateType;
    if (!gateType) {
      allow();
      return;
    }

    const validGates: GateType[] = ['research', 'briefing', 'production', 'delivery'];
    if (!validGates.includes(gateType)) {
      allow();
      return;
    }

    // Detect offer
    const offerPath = detectOffer(input.tool_input);

    // Get required tool groups from core-config.yaml
    const requiredGroups = getRequiredToolGroups(gateType);

    // Get tools actually used (merged: persistent + volatile)
    const toolsUsed = getMergedTools(offerPath, gateType);

    // Check each required group
    const missingGroups: string[][] = [];
    for (const group of requiredGroups) {
      const hasAny = group.some(tool => toolsUsed.includes(tool));
      if (!hasAny) {
        missingGroups.push(group);
      }
    }

    if (missingGroups.length > 0) {
      block(gateType, offerPath, toolsUsed, missingGroups);
      return;
    }

    // Check recommended tools (warning only)
    const recommended = getRecommendedTools(gateType);
    const missingRecommended = recommended.filter(t => !toolsUsed.includes(t));
    if (missingRecommended.length > 0) {
      console.error(`[TOOL-MATRIX] Warning: Recommended tools not used: ${missingRecommended.map(formatToolName).join(', ')}`);
    }

    console.error(`[TOOL-MATRIX] OK: All required tools used for ${gateType}`);
    allow();

  } catch (error) {
    console.error(`[TOOL-MATRIX] Error: ${error}`);
    allow(); // Fail-open
  }
}

function allow(): void {
  console.log(JSON.stringify({}));
  process.exit(0);
}

function block(gate: GateType, offer: string | null, toolsUsed: string[], missingGroups: string[][]): void {
  const missingMsg = missingGroups.map((group, i) => {
    if (group.length === 1) {
      return `  ${i + 1}. ${formatToolName(group[0])}`;
    }
    return `  ${i + 1}. Uma das seguintes:\n${group.map(t => `     - ${formatToolName(t)}`).join('\n')}`;
  }).join('\n');

  const usedMsg = toolsUsed.length > 0
    ? toolsUsed.map(t => `  + ${formatToolName(t)}`).join('\n')
    : '  (nenhuma)';

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `BLOQUEADO — Ferramentas obrigatorias nao usadas

**validate_gate("${gate}")** requer:
${missingMsg}

**Ja usadas:**
${usedMsg}

**Oferta:** ${offer || 'nao detectada'}
**Fonte:** core-config.yaml quality.gates.${gate}

Execute as ferramentas faltantes antes de chamar validate_gate.`,
  };

  console.error(`[TOOL-MATRIX] BLOCKED: ${missingGroups.length} group(s) missing for ${gate}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

main();
