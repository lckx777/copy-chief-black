// ~/.claude/hooks/lib/state-machine.ts
// Unified State Machine — v8.0 (AIOS Pattern: Formal State Machine)
// Consolidates: session-state.ts + offer-state.ts + gate-resolver.ts
// ~300 lines vs ~850 lines previous
// Created: 2026-02-23

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// ==========================================
// Types
// ==========================================

export type Phase = 'IDLE' | 'RESEARCH' | 'BRIEFING' | 'PRODUCTION' | 'REVIEW' | 'DELIVERED';
export type GateType = 'research' | 'briefing' | 'production';

export interface GateEntry {
  type: GateType;
  result: 'PASSED' | 'BLOCKED';
  timestamp: string;
  details?: string;
}

export interface OfferMachine {
  offer_path: string;
  phase: Phase;
  created_at: string;
  updated_at: string;
  session_count: number;

  gates: {
    research: { passed: boolean; passed_at?: string; confidence?: number };
    briefing: { passed: boolean; passed_at?: string; phases_completed: number };
    production: { passed: boolean; passed_at?: string; score?: number };
  };

  tools_by_phase: Record<string, string[]>;
  gate_history: GateEntry[];

  mecanismo: {
    state: 'UNDEFINED' | 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'APPROVED';
    mup_validated: boolean;
    mus_validated: boolean;
  };

  // Stuck detection
  consecutive_sessions_same_phase: number;
  last_phase_change_at?: string;
}

// ==========================================
// Constants
// ==========================================

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');
const STATE_DIR = join(process.env.HOME!, '.claude', 'session-state');
const SESSION_FILE = join(STATE_DIR, 'current-session.json');

// Valid transitions: from → [allowed destinations]
const VALID_TRANSITIONS: Record<Phase, Phase[]> = {
  IDLE: ['RESEARCH'],
  RESEARCH: ['BRIEFING'],
  BRIEFING: ['PRODUCTION'],
  PRODUCTION: ['REVIEW'],
  REVIEW: ['DELIVERED', 'PRODUCTION'], // Can go back for fixes
  DELIVERED: ['IDLE'], // Start new offer
};

// Preconditions for transitions
const TRANSITION_PRECONDITIONS: Record<string, (m: OfferMachine) => { ok: boolean; reason?: string }> = {
  'RESEARCH→BRIEFING': (m) => ({
    ok: m.gates.research.passed,
    reason: 'Research gate must PASS via validate_gate("research") first',
  }),
  'BRIEFING→PRODUCTION': (m) => ({
    ok: m.gates.briefing.passed && ['VALIDATED', 'APPROVED'].includes(m.mecanismo.state),
    reason: `Briefing gate must PASS and mecanismo must be VALIDATED/APPROVED (current: ${m.mecanismo.state})`,
  }),
  'PRODUCTION→REVIEW': (m) => {
    const hasBlind = m.tools_by_phase.production?.includes('blind_critic');
    const hasStress = m.tools_by_phase.production?.includes('emotional_stress_test');
    return {
      ok: hasBlind && hasStress,
      reason: 'blind_critic and emotional_stress_test must be run in production phase',
    };
  },
  'REVIEW→DELIVERED': (m) => ({
    ok: m.gates.production.passed && (m.gates.production.score ?? 0) >= 8,
    reason: `black_validation score must be >= 8 (current: ${m.gates.production.score ?? 'none'})`,
  }),
};

// Required tools per phase (for enforcement)
export const REQUIRED_TOOLS: Record<Phase, string[]> = {
  IDLE: [],
  RESEARCH: ['firecrawl_agent', 'voc_search'],
  BRIEFING: ['get_phase_context'],
  PRODUCTION: ['blind_critic', 'emotional_stress_test'],
  REVIEW: ['black_validation'],
  DELIVERED: [],
};

// ==========================================
// Core Functions
// ==========================================

function getStatePath(offerPath: string): string {
  return join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');
}

export function loadMachine(offerPath: string): OfferMachine {
  const statePath = getStatePath(offerPath);

  if (existsSync(statePath)) {
    try {
      const raw = parseYaml(readFileSync(statePath, 'utf-8')) as any;
      // Migrate from old format if needed
      return migrateState(raw, offerPath);
    } catch {
      // Corrupted, create new
    }
  }

  return createMachine(offerPath);
}

export function createMachine(offerPath: string): OfferMachine {
  const now = new Date().toISOString();
  const machine: OfferMachine = {
    offer_path: offerPath,
    phase: 'IDLE',
    created_at: now,
    updated_at: now,
    session_count: 0,
    gates: {
      research: { passed: false },
      briefing: { passed: false, phases_completed: 0 },
      production: { passed: false },
    },
    tools_by_phase: {},
    gate_history: [],
    mecanismo: { state: 'UNDEFINED', mup_validated: false, mus_validated: false },
    consecutive_sessions_same_phase: 0,
  };
  saveMachine(machine);
  return machine;
}

export function saveMachine(machine: OfferMachine): void {
  const statePath = getStatePath(machine.offer_path);
  machine.updated_at = new Date().toISOString();

  const dir = dirname(statePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(statePath, stringifyYaml(machine));
}

// ==========================================
// State Transitions
// ==========================================

export function canTransition(machine: OfferMachine, targetPhase: Phase): { ok: boolean; reason?: string } {
  const validTargets = VALID_TRANSITIONS[machine.phase];
  if (!validTargets?.includes(targetPhase)) {
    return { ok: false, reason: `Invalid transition: ${machine.phase} → ${targetPhase}. Valid: ${validTargets?.join(', ')}` };
  }

  const key = `${machine.phase}→${targetPhase}`;
  const precondition = TRANSITION_PRECONDITIONS[key];
  if (precondition) {
    return precondition(machine);
  }

  return { ok: true };
}

export function transition(machine: OfferMachine, targetPhase: Phase): { ok: boolean; reason?: string } {
  const check = canTransition(machine, targetPhase);
  if (!check.ok) return check;

  machine.phase = targetPhase;
  machine.last_phase_change_at = new Date().toISOString();
  machine.consecutive_sessions_same_phase = 0;
  saveMachine(machine);
  return { ok: true };
}

// ==========================================
// Gate Operations
// ==========================================

export function recordGatePassed(machine: OfferMachine, gate: GateType, details?: string): void {
  machine.gates[gate].passed = true;
  machine.gates[gate].passed_at = new Date().toISOString();
  machine.gate_history.push({
    type: gate,
    result: 'PASSED',
    timestamp: new Date().toISOString(),
    details,
  });

  // Auto-transition on gate pass
  const gateToPhase: Record<GateType, Phase> = {
    research: 'BRIEFING',
    briefing: 'PRODUCTION',
    production: 'DELIVERED',
  };
  const target = gateToPhase[gate];
  if (target && VALID_TRANSITIONS[machine.phase]?.includes(target)) {
    machine.phase = target;
    machine.last_phase_change_at = new Date().toISOString();
    machine.consecutive_sessions_same_phase = 0;
  }

  saveMachine(machine);
}

export function recordGateBlocked(machine: OfferMachine, gate: GateType, details?: string): void {
  machine.gate_history.push({
    type: gate,
    result: 'BLOCKED',
    timestamp: new Date().toISOString(),
    details,
  });
  saveMachine(machine);
}

// ==========================================
// Tool Tracking
// ==========================================

export function recordTool(machine: OfferMachine, toolName: string): void {
  const phase = machine.phase.toLowerCase();
  if (!machine.tools_by_phase[phase]) {
    machine.tools_by_phase[phase] = [];
  }

  // Normalize: mcp__copywriting__blind_critic → blind_critic
  const normalized = toolName.replace(/^mcp__[^_]+__/, '');
  if (!machine.tools_by_phase[phase].includes(normalized)) {
    machine.tools_by_phase[phase].push(normalized);
  }
  saveMachine(machine);
}

export function getMissingTools(machine: OfferMachine): string[] {
  const required = REQUIRED_TOOLS[machine.phase] || [];
  const used = machine.tools_by_phase[machine.phase.toLowerCase()] || [];
  return required.filter(t => !used.includes(t));
}

// ==========================================
// Path-based Write Permission
// ==========================================

export function canWriteToPath(filePath: string): { allowed: boolean; reason?: string; source: string } {
  const offerPath = detectOffer(filePath);
  if (!offerPath) return { allowed: true, source: 'no-offer' };

  const isResearch = /research\//i.test(filePath);
  const isBriefing = /briefings?\//i.test(filePath);
  const isProduction = /production\//i.test(filePath);

  if (isResearch) return { allowed: true, source: 'research-always-allowed' };

  const machine = loadMachine(offerPath);

  if (isBriefing) {
    // Check: research gate OR heuristic (synthesis.md exists)
    if (machine.gates.research.passed) return { allowed: true, source: 'gate' };
    if (hasResearchFiles(offerPath)) return { allowed: true, source: 'heuristic' };
    return {
      allowed: false,
      reason: `Research gate not passed for "${offerPath}". Run validate_gate("research") first.`,
      source: 'blocked',
    };
  }

  if (isProduction) {
    // Check: briefing gate OR heuristic (10 phase files exist)
    if (machine.gates.briefing.passed) return { allowed: true, source: 'gate' };
    if (hasBriefingFiles(offerPath)) return { allowed: true, source: 'heuristic' };
    return {
      allowed: false,
      reason: `Briefing gate not passed for "${offerPath}". Run validate_gate("briefing") first.`,
      source: 'blocked',
    };
  }

  return { allowed: true, source: 'default' };
}

// ==========================================
// Stuck Detection
// ==========================================

export function checkStuck(machine: OfferMachine): string | null {
  if (machine.consecutive_sessions_same_phase >= 3) {
    return `⚠️ Stuck: ${machine.consecutive_sessions_same_phase} sessions in ${machine.phase}. Missing: ${getMissingTools(machine).join(', ') || 'none'}.`;
  }
  return null;
}

export function incrementSessionCount(machine: OfferMachine): void {
  machine.session_count++;
  machine.consecutive_sessions_same_phase++;
  saveMachine(machine);
}

// ==========================================
// Detection Helpers
// ==========================================

export function detectOffer(filePath: string): string | null {
  const match = filePath.match(/([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i)
    || filePath.match(/copywriting-ecosystem\/([^/]+\/[^/]+)\//i);
  return match ? match[1] : null;
}

export function detectPhaseFromPath(filePath: string): Phase {
  if (/research\//i.test(filePath)) return 'RESEARCH';
  if (/briefings?\//i.test(filePath)) return 'BRIEFING';
  if (/production\//i.test(filePath)) return 'PRODUCTION';
  return 'IDLE';
}

function hasResearchFiles(offerPath: string): boolean {
  const base = join(ECOSYSTEM_ROOT, offerPath);
  return existsSync(join(base, 'research', 'synthesis.md'))
    || existsSync(join(base, 'research', 'voc', 'summary.md'));
}

function hasBriefingFiles(offerPath: string): boolean {
  const phasesDir = join(ECOSYSTEM_ROOT, offerPath, 'briefings', 'phases');
  if (!existsSync(phasesDir)) return false;
  try {
    const files = readdirSync(phasesDir).filter(f => f.endsWith('.md'));
    return files.length >= 10;
  } catch { return false; }
}

// ==========================================
// Migration from old format
// ==========================================

function migrateState(raw: any, offerPath: string): OfferMachine {
  // If already new format
  if (raw.phase && raw.tools_by_phase !== undefined) {
    return raw as OfferMachine;
  }

  // Migrate from old offer-state format
  const now = new Date().toISOString();
  const machine: OfferMachine = {
    offer_path: offerPath,
    phase: mapOldPhase(raw.workflow_phase || raw.currentPhase || 'idle'),
    created_at: raw.created_at || now,
    updated_at: now,
    session_count: raw.metadata?.total_sessions || 0,
    gates: {
      research: { passed: raw.gates?.research?.passed || false, passed_at: raw.gates?.research?.passed_at },
      briefing: { passed: raw.gates?.briefing?.passed || false, passed_at: raw.gates?.briefing?.passed_at, phases_completed: raw.gates?.briefing?.phases_completed || 0 },
      production: { passed: raw.gates?.production?.passed || false, passed_at: raw.gates?.production?.passed_at, score: raw.gates?.production?.black_validation_score },
    },
    tools_by_phase: raw.toolsUsedByPhase || raw.tools_by_phase || {},
    gate_history: raw.gate_history || raw.gateHistory || [],
    mecanismo: raw.mecanismo || { state: 'UNDEFINED', mup_validated: false, mus_validated: false },
    consecutive_sessions_same_phase: 0,
  };

  return machine;
}

function mapOldPhase(old: string): Phase {
  const map: Record<string, Phase> = {
    idle: 'IDLE', research: 'RESEARCH', briefing: 'BRIEFING',
    production: 'PRODUCTION', review: 'REVIEW', delivered: 'DELIVERED',
  };
  return map[old.toLowerCase()] || 'IDLE';
}

// ==========================================
// Session State (Thin Wrapper — Backward Compat)
// ==========================================

interface SessionRef {
  sessionId: string;
  startedAt: string;
  lastActivity: string;
  activeOffer: string | null;
  currentPhase: Phase;
  mcpToolsUsed: string[];
}

export function getSession(): SessionRef {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });

  if (existsSync(SESSION_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
      const last = new Date(raw.lastActivity || 0);
      if (Date.now() - last.getTime() < 2 * 60 * 60 * 1000) {
        return {
          sessionId: raw.sessionId,
          startedAt: raw.startedAt,
          lastActivity: raw.lastActivity,
          activeOffer: raw.activeOffer || null,
          currentPhase: mapOldPhase(raw.currentPhase || 'idle'),
          mcpToolsUsed: raw.mcpToolsUsed || [],
        };
      }
    } catch {}
  }

  const session: SessionRef = {
    sessionId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    activeOffer: null,
    currentPhase: 'IDLE',
    mcpToolsUsed: [],
  };
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  return session;
}

export function saveSession(session: SessionRef): void {
  session.lastActivity = new Date().toISOString();
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}
