#!/usr/bin/env bun
// ~/.claude/hooks/production-delegation-gate.ts
// Production Delegation Gate — AIOS executor-assignment pattern
// v1.0 (2026-03-02)
//
// Principle: Orchestrador NUNCA faz work direto em production/
// Equivalent AIOS: WorkflowExecutor validation (orchestrador cannot do direct work)
//
// BLOCKS: Write/Edit to production/{type}/ if active persona doesn't match assignment
// ALLOWS: All non-production paths, or production paths with correct persona active
// FAIL MODE: fail-open (graceful degradation)

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

interface ActivePersonaMarker {
  persona: string;
  offer: string;
  timestamp: string;
  activatedAt: number;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Only check Write-family tools
    if (!['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(toolName)) {
      allow();
      return;
    }

    // Extract file path
    const filePath = (
      input.tool_input?.file_path ||
      input.tool_input?.path ||
      input.tool_input?.notebook_path ||
      ''
    ) as string;

    if (!filePath) {
      allow();
      return;
    }

    // Get deliverable type from path
    let deliverableType: string | null = null;
    try {
      const assignmentModule = require(
        join(process.env.HOME!, '.claude', '.aios-core', 'copy-chief', 'orchestration', 'deliverable-assignment')
      );
      deliverableType = assignmentModule.getDeliverableType(filePath);
    } catch {
      // Can't load assignment module — fail-open
      allow();
      return;
    }

    // Not a production deliverable path — allow
    if (!deliverableType) {
      allow();
      return;
    }

    // Check active agents SET (supports parallel agents without race condition)
    const setPath = join(process.env.HOME!, '.claude', 'session-state', 'active-agents.json');

    // Load assignment table
    let DELIVERABLE_ASSIGNMENT_TABLE: Record<string, { persona: string; model: string; quality_gate: string }>;
    try {
      DELIVERABLE_ASSIGNMENT_TABLE = require(
        join(process.env.HOME!, '.claude', '.aios-core', 'copy-chief', 'orchestration', 'deliverable-assignment')
      ).DELIVERABLE_ASSIGNMENT_TABLE;
    } catch {
      allow(); // Can't load assignments — fail-open
      return;
    }

    const assignment = DELIVERABLE_ASSIGNMENT_TABLE[deliverableType];
    if (!assignment) {
      allow();
      return;
    }

    // Read active agents set
    let agentSet: Record<string, any> = {};
    if (existsSync(setPath)) {
      try {
        agentSet = JSON.parse(readFileSync(setPath, 'utf-8'));
      } catch { /* corrupt file — fall through */ }
    }

    // Check if the EXPECTED persona for this deliverable type is in the active set
    const expectedPersona = assignment.persona;

    if (agentSet[expectedPersona]) {
      console.error(`[DELEGATION-GATE] OK: ${expectedPersona} is active — write to production/${deliverableType}/ allowed`);
      allow();
      return;
    }

    // Fallback: check old single-marker file
    const markerPath = join(process.env.HOME!, '.claude', 'session-state', 'active-persona.json');
    if (existsSync(markerPath)) {
      try {
        const marker = JSON.parse(readFileSync(markerPath, 'utf-8'));
        if (marker.persona === expectedPersona) {
          console.error(`[DELEGATION-GATE] OK: ${marker.persona} writing to production/${deliverableType}/ (single marker)`);
          allow();
          return;
        }
      } catch { /* corrupt — continue */ }
    }

    // No matching persona found — block
    if (Object.keys(agentSet).length === 0) {
      blockNoDelegation(filePath, deliverableType);
    } else {
      const activeList = Object.keys(agentSet).join(', ');
      blockWrongPersona(filePath, deliverableType, activeList, assignment);
    }

  } catch (error) {
    // Any unexpected error — fail-open
    console.error(`[DELEGATION-GATE] Error (fail-open): ${error}`);
    allow();
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function allow(): void {
  console.log(JSON.stringify({}));
  process.exit(0);
}

function blockNoDelegation(filePath: string, deliverableType: string): void {
  let assignment: { persona: string; model: string; quality_gate: string } | undefined;
  try {
    const { DELIVERABLE_ASSIGNMENT_TABLE } = require(
      join(process.env.HOME!, '.claude', '.aios-core', 'copy-chief', 'orchestration', 'deliverable-assignment')
    );
    assignment = DELIVERABLE_ASSIGNMENT_TABLE[deliverableType];
  } catch { /* ignore */ }

  const persona = assignment?.persona || 'unknown';
  const model = assignment?.model || 'sonnet';
  const personaCapitalized = persona.charAt(0).toUpperCase() + persona.slice(1);

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `BLOQUEADO — Write em production/${deliverableType}/ requer delegacao para ${personaCapitalized} (@${persona}).

**Arquivo:** ${filePath}
**Principio:** Orchestrador NUNCA faz work direto em production/ (AIOS executor-assignment pattern)

**ACAO — Use Agent tool com:**
\`\`\`
Agent(
  description: "${personaCapitalized}: produzir ${deliverableType}",
  subagent_type: "general-purpose",
  model: "${model}",
  prompt: "You are ${personaCapitalized} (@${persona}).
    Read ~/.claude/agents/${persona}.md
    TASK: [sua tarefa aqui]
    OFFER: [niche/offer] at ~/copywriting-ecosystem/[niche]/[offer]/
    Write outputs to files. Return YAML summary."
)
\`\`\`

Referencia: AIOS executor-assignment pattern (orchestrador NUNCA faz work direto)`,
  };

  console.error(`[DELEGATION-GATE] BLOCKED: No active persona for production/${deliverableType}/ write to ${filePath}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

function blockWrongPersona(
  filePath: string,
  deliverableType: string,
  activePersona: string,
  assignment: { persona: string; model: string; quality_gate: string }
): void {
  const persona = assignment.persona;
  const model = assignment.model;
  const personaCapitalized = persona.charAt(0).toUpperCase() + persona.slice(1);

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `BLOQUEADO — Persona errada para production/${deliverableType}/.

**Arquivo:** ${filePath}
**Persona ativa:** ${activePersona}
**Persona requerida:** ${personaCapitalized} (@${persona})

production/${deliverableType}/ so pode ser escrito por ${personaCapitalized} (@${persona}).
A persona ativa "${activePersona}" nao tem permissao para este tipo de deliverable.

**ACAO:** Delegue para a persona correta via Agent tool (model: ${model}).`,
  };

  console.error(`[DELEGATION-GATE] BLOCKED: Wrong persona ${activePersona} for production/${deliverableType}/ (expected ${persona})`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

main();
