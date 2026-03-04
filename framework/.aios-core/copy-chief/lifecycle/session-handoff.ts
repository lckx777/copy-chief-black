#!/usr/bin/env bun
/**
 * session-handoff.ts — Session Handoff Module
 * copy-chief/lifecycle/session-handoff.ts
 *
 * Extracted from ~/.claude/hooks/session-handoff.ts (353L)
 * Handles: offer detection, phase detection, task extraction, decision
 * extraction, and handoff content building for cross-session continuity.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

// ─── Constants ───────────────────────────────────────────────────────────────

const HOME = process.env.HOME || '/tmp';
export const SESSION_STATE_DIR = `${HOME}/.claude/session-state`;
export const ECOSYSTEM_ROOT = `${HOME}/copywriting-ecosystem`;
export const LATEST_SESSION_FILE = `${SESSION_STATE_DIR}/LATEST-SESSION.md`;
export const CURRENT_SESSION_FILE = `${SESSION_STATE_DIR}/current-session.json`;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionState {
  sessionId?: string;
  startedAt?: string;
  lastActivity?: string;
  activeOffer?: string | null;
  currentPhase?: string;
  filesRead?: string[];
  filesWritten?: string[];
  mcpToolsUsed?: string[];
  gatesPassed?: Record<string, boolean>;
}

export interface StopInput {
  session_id?: string;
  stop_hook_active?: boolean;
}

export interface HandoffResult {
  handoffFile: string;
  offer: string;
  phase: string;
  pendingCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function safeExec(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, {
      cwd: cwd || ECOSYSTEM_ROOT,
      timeout: 3000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatTimestamp(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

export function readSessionState(): SessionState {
  if (!existsSync(CURRENT_SESSION_FILE)) return {};
  try {
    const raw = readFileSync(CURRENT_SESSION_FILE, 'utf-8');
    return JSON.parse(raw) as SessionState;
  } catch {
    return {};
  }
}

export function getGitModifiedFiles(): string[] {
  const raw = safeExec('git status --short', ECOSYSTEM_ROOT);
  if (!raw) return [];
  return raw
    .split('\n')
    .filter(l => l.trim().length > 0)
    .map(l => l.trim());
}

export function getRecentGitLog(): string[] {
  const raw = safeExec('git log --oneline -5', ECOSYSTEM_ROOT);
  if (!raw) return [];
  return raw.split('\n').filter(l => l.trim().length > 0);
}

export function detectActiveOffer(state: SessionState): string {
  if (state.activeOffer) return state.activeOffer;

  const allFiles = [...(state.filesWritten || []), ...(state.filesRead || [])];
  const niches = ['saude', 'relacionamento', 'concursos', 'riqueza'];
  for (const f of allFiles) {
    for (const niche of niches) {
      const match = f.match(new RegExp(`${niche}/([^/]+)`));
      if (match) return `${niche}/${match[1]}`;
    }
  }
  return 'none detected';
}

export function detectCurrentPhase(state: SessionState): string {
  if (state.currentPhase && state.currentPhase !== 'idle') {
    return state.currentPhase.toUpperCase();
  }
  if (!state.gatesPassed) return 'UNKNOWN';
  const { research, briefing, production } = state.gatesPassed;
  if (production) return 'PRODUCTION';
  if (briefing) return 'BRIEFING';
  if (research) return 'RESEARCH';
  return 'SETUP';
}

export function extractPendingTasks(): string[] {
  const progressPath = `${ECOSYSTEM_ROOT}/progress.md`;
  const taskPlanPath = `${ECOSYSTEM_ROOT}/task_plan.md`;

  const pending: string[] = [];

  for (const filePath of [progressPath, taskPlanPath]) {
    if (!existsSync(filePath)) continue;
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const m = line.match(/^[\s*-]*\[\s\]\s+(.+)$/);
        if (m) {
          const task = m[1].trim();
          if (task.length > 0 && pending.length < 10) {
            pending.push(task);
          }
        }
      }
    } catch {
      // ignore
    }
    if (pending.length >= 10) break;
  }

  return pending;
}

export function inferNextSteps(state: SessionState, offer: string, phase: string, pending: string[]): string[] {
  const steps: string[] = [];

  for (const t of pending.slice(0, 3)) {
    steps.push(t);
  }

  if (steps.length < 2) {
    switch (phase) {
      case 'PRODUCTION':
        steps.push('Continuar producao de deliverables (VSL/LP/Criativos)');
        steps.push('Rodar blind_critic + emotional_stress_test apos cada bloco');
        break;
      case 'BRIEFING':
        steps.push('Continuar fases HELIX');
        steps.push('Validar MUP/MUS via consensus + blind_critic');
        break;
      case 'RESEARCH':
        steps.push('Completar research summaries');
        steps.push('Validar research gate');
        break;
      default:
        steps.push('Revisar status do projeto em progress.md');
        steps.push('Identificar proxima tarefa prioritaria');
    }
  }

  return steps.slice(0, 5);
}

export function extractDecisions(state: SessionState): string[] {
  const decisions: string[] = [];

  const mcpTools = state.mcpToolsUsed || [];
  if (mcpTools.includes('validate_gate')) {
    decisions.push('Gate de fase validado via validate_gate');
  }
  if (mcpTools.includes('black_validation')) {
    decisions.push('Validacao final executada via black_validation');
  }
  if (mcpTools.includes('consensus')) {
    decisions.push('Decisao tomada via consensus multi-modelo');
  }
  if (mcpTools.includes('blind_critic')) {
    decisions.push('Copy avaliada via blind_critic');
  }

  const gates = state.gatesPassed || {};
  if (gates.research) decisions.push('Research gate: PASSED');
  if (gates.briefing) decisions.push('Briefing gate: PASSED');
  if (gates.production) decisions.push('Production gate: PASSED');

  return decisions;
}

export function buildHandoffContent(
  now: Date,
  state: SessionState,
  offer: string,
  phase: string,
  modifiedFiles: string[],
  recentLog: string[],
  pendingTasks: string[],
  nextSteps: string[],
  decisions: string[],
): string {
  const dt = formatDateTime(now);
  const sessionId = state.sessionId || 'unknown';

  const modifiedSection = modifiedFiles.length > 0
    ? modifiedFiles.map(f => `- ${f}`).join('\n')
    : '- (no changes detected)';

  const pendingSection = pendingTasks.length > 0
    ? pendingTasks.map(t => `- [ ] ${t}`).join('\n')
    : '- (none detected)';

  const nextSection = nextSteps.length > 0
    ? nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '1. Revisar progress.md e continuar';

  const decisionsSection = decisions.length > 0
    ? decisions.map(d => `- ${d}`).join('\n')
    : '- (none recorded)';

  const gitSection = recentLog.length > 0
    ? recentLog.map(l => `- ${l}`).join('\n')
    : '- (no recent commits)';

  const filesWrittenCount = (state.filesWritten || []).length;
  const filesReadCount = (state.filesRead || []).length;
  const mcpTools = (state.mcpToolsUsed || []).join(', ') || 'none';

  return `# Session Handoff — ${dt}

## Status
- Session: ${sessionId}
- Offer: ${offer}
- Phase: ${phase}
- Files Read: ${filesReadCount} | Files Written: ${filesWrittenCount}
- MCP Tools Used: ${mcpTools}

## Files Modified (git status)
${modifiedSection}

## Recent Commits
${gitSection}

## Pending Tasks
${pendingSection}

## Next Steps
${nextSection}

## Decisions Made
${decisionsSection}

## Resume Command
\`leia progress.md e continue o plano\`

---
*Generated by session-handoff.ts at ${now.toISOString()}*
`;
}

function cleanupOldHandoffs(): void {
  try {
    const handoffs = readdirSync(SESSION_STATE_DIR)
      .filter((f: string) => f.startsWith('HANDOFF-') && f.endsWith('.md'))
      .sort()
      .reverse();

    if (handoffs.length > 20) {
      for (const old of handoffs.slice(20)) {
        try { unlinkSync(`${SESSION_STATE_DIR}/${old}`); } catch { /* ignore */ }
      }
    }
  } catch { /* ignore cleanup errors */ }
}

// ─── Main Hook Entry Point ───────────────────────────────────────────────────

/**
 * Process a Stop event — generates handoff files for cross-session continuity.
 */
export async function processHookEvent(input: StopInput): Promise<HandoffResult> {
  if (!existsSync(SESSION_STATE_DIR)) {
    mkdirSync(SESSION_STATE_DIR, { recursive: true });
  }

  const now = new Date();
  const state = readSessionState();
  const offer = detectActiveOffer(state);
  const phase = detectCurrentPhase(state);
  const modifiedFiles = getGitModifiedFiles();
  const recentLog = getRecentGitLog();
  const pendingTasks = extractPendingTasks();
  const nextSteps = inferNextSteps(state, offer, phase, pendingTasks);
  const decisions = extractDecisions(state);

  const content = buildHandoffContent(
    now, state, offer, phase,
    modifiedFiles, recentLog,
    pendingTasks, nextSteps, decisions,
  );

  writeFileSync(LATEST_SESSION_FILE, content, 'utf-8');

  const ts = formatTimestamp(now);
  const handoffFile = `${SESSION_STATE_DIR}/HANDOFF-${ts}.md`;
  writeFileSync(handoffFile, content, 'utf-8');

  cleanupOldHandoffs();

  return { handoffFile, offer, phase, pendingCount: pendingTasks.length };
}
