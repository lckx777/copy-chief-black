// ~/.claude/hooks/lib/session-state.ts
// Gerenciador de estado da sessão - v7.0 State Machine
// Atualizado: 2026-02-02

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  HELIX_PHASE_REQUIREMENTS,
  HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_NAMES,
  detectHelixPhaseFromPath,
  getMissingRequiredTools as getHelixMissingRequired,
  getMissingRecommendedTools as getHelixMissingRecommended,
  generateMissingToolsMessage,
} from '../workflow/helix-requirements';

const STATE_DIR = join(process.env.HOME!, '.claude', 'session-state');
const STATE_FILE = join(STATE_DIR, 'current-session.json');

// v7.0: Tipo de fase do workflow (state machine)
export type WorkflowPhase = 'idle' | 'research' | 'briefing' | 'production' | 'delivered';

// v7.0: Tipo de gate
export type GateType = 'research' | 'briefing' | 'production';

// v7.0: Entrada no histórico de gates
export interface GateHistoryEntry {
  type: GateType;
  result: 'PASSED' | 'BLOCKED';
  timestamp: string;
  offer?: string;
  details?: string;
}

export interface SessionState {
  // Identificação
  sessionId: string;
  startedAt: string;
  lastActivity: string;

  // v7.0: State Machine
  activeOffer: string | null;  // ex: "concursos/hacker"
  currentPhase: WorkflowPhase;

  // v7.0: Gates (fonte de verdade para transições)
  gatesPassed: {
    research: boolean;   // validate_gate("research") = PASSED
    briefing: boolean;   // validate_gate("briefing") = PASSED
    production: boolean; // black_validation score ≥8
  };

  // v7.0: Histórico de gates (auditável)
  gateHistory: GateHistoryEntry[];

  // v7.0: Ferramentas usadas por fase
  toolsUsedByPhase: {
    research: string[];
    briefing: string[];
    production: string[];
  };

  // Tracking de arquivos
  filesRead: string[];
  filesWritten: string[];

  // Metodologia
  methodologyLoaded: boolean;
  frameworksConsulted: string[];
  reasoningDepth: number;
  planCreated: boolean;
  sequentialThinkingUsed: boolean;

  // v6.9: Tool tracking (mantido para compatibilidade)
  mcpToolsUsed: string[];
  validationsPassed: {
    blind_critic: boolean;
    emotional_stress_test: boolean;
    layered_review: boolean;
    black_validation: boolean;
    validate_gate: boolean;
    consensus: boolean;
  };

  // v7.0: Copy validations
  copyValidations: {
    blind_critic: boolean;
    emotional_stress_test: boolean;
    black_validation_score: number | null;
  };
}

function ensureStateDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function getSessionState(): SessionState {
  ensureStateDir();
  if (!existsSync(STATE_FILE)) {
    return createNewSession();
  }

  try {
    const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8')) as SessionState;

    // Sessão expira após 2 horas
    const lastActivity = new Date(state.lastActivity);
    const now = new Date();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    if (now.getTime() - lastActivity.getTime() > twoHoursMs) {
      return createNewSession();
    }

    // Migração: adicionar campos v7.0 se não existirem
    if (!state.gatesPassed) {
      state.gatesPassed = { research: false, briefing: false, production: false };
    }
    if (!state.gateHistory) {
      state.gateHistory = [];
    }
    if (!state.toolsUsedByPhase) {
      state.toolsUsedByPhase = { research: [], briefing: [], production: [] };
    }
    if (!state.copyValidations) {
      state.copyValidations = { blind_critic: false, emotional_stress_test: false, black_validation_score: null };
    }
    if (state.activeOffer === undefined) {
      state.activeOffer = null;
    }

    return state;
  } catch {
    return createNewSession();
  }
}

export function createNewSession(): SessionState {
  const state: SessionState = {
    // Identificação
    sessionId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),

    // v7.0: State Machine
    activeOffer: null,
    currentPhase: 'idle',

    // v7.0: Gates
    gatesPassed: {
      research: false,
      briefing: false,
      production: false,
    },

    // v7.0: Histórico
    gateHistory: [],

    // v7.0: Tools por fase
    toolsUsedByPhase: {
      research: [],
      briefing: [],
      production: [],
    },

    // Tracking de arquivos
    filesRead: [],
    filesWritten: [],

    // Metodologia
    methodologyLoaded: false,
    frameworksConsulted: [],
    reasoningDepth: 0.0,
    planCreated: false,
    sequentialThinkingUsed: false,

    // v6.9: Tool tracking (compatibilidade)
    mcpToolsUsed: [],
    validationsPassed: {
      blind_critic: false,
      emotional_stress_test: false,
      layered_review: false,
      black_validation: false,
      validate_gate: false,
      consensus: false,
    },

    // v7.0: Copy validations
    copyValidations: {
      blind_critic: false,
      emotional_stress_test: false,
      black_validation_score: null,
    },
  };
  saveSessionState(state);
  return state;
}

export function saveSessionState(state: SessionState): void {
  ensureStateDir();
  state.lastActivity = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ==========================================
// v7.0: State Machine Functions
// ==========================================

/**
 * Define a oferta ativa na sessão
 */
export function setActiveOffer(offerPath: string): void {
  const state = getSessionState();
  state.activeOffer = offerPath;

  // Se estava idle, mover para research
  if (state.currentPhase === 'idle') {
    state.currentPhase = 'research';
  }

  saveSessionState(state);
}

/**
 * Retorna a oferta ativa
 */
export function getActiveOffer(): string | null {
  return getSessionState().activeOffer;
}

/**
 * Registra que um gate passou
 * Atualiza gatesPassed e currentPhase automaticamente
 */
export function recordGatePassed(gateType: GateType, details?: string): void {
  const state = getSessionState();

  // Atualizar gate
  state.gatesPassed[gateType] = true;

  // Adicionar ao histórico
  state.gateHistory.push({
    type: gateType,
    result: 'PASSED',
    timestamp: new Date().toISOString(),
    offer: state.activeOffer || undefined,
    details,
  });

  // Atualizar fase baseado no gate que passou
  const phaseTransitions: Record<GateType, WorkflowPhase> = {
    research: 'briefing',
    briefing: 'production',
    production: 'delivered',
  };

  state.currentPhase = phaseTransitions[gateType];

  saveSessionState(state);
}

/**
 * Registra que um gate foi bloqueado
 */
export function recordGateBlocked(gateType: GateType, details?: string): void {
  const state = getSessionState();

  state.gateHistory.push({
    type: gateType,
    result: 'BLOCKED',
    timestamp: new Date().toISOString(),
    offer: state.activeOffer || undefined,
    details,
  });

  saveSessionState(state);
}

/**
 * Verifica se um gate específico passou
 */
export function hasGatePassed(gateType: GateType): boolean {
  return getSessionState().gatesPassed[gateType];
}

/**
 * Verifica se pode escrever em um path baseado nos gates
 */
export function canWriteToPath(filePath: string): { allowed: boolean; reason?: string; requiredGate?: GateType } {
  const state = getSessionState();

  // Detectar tipo de path
  const isBriefingPath = /briefings?\//i.test(filePath);
  const isProductionPath = /production\//i.test(filePath);
  const isResearchPath = /research\//i.test(filePath);

  // Research: sempre permitido (é o início)
  if (isResearchPath) {
    return { allowed: true };
  }

  // Briefing: precisa de research gate
  if (isBriefingPath) {
    if (!state.gatesPassed.research) {
      return {
        allowed: false,
        reason: `Research gate não passou. Execute validate_gate('research', '${state.activeOffer || '[oferta]'}') primeiro.`,
        requiredGate: 'research',
      };
    }
    return { allowed: true };
  }

  // Production: precisa de briefing gate
  if (isProductionPath) {
    if (!state.gatesPassed.briefing) {
      return {
        allowed: false,
        reason: `Briefing gate não passou. Execute validate_gate('briefing', '${state.activeOffer || '[oferta]'}') primeiro.`,
        requiredGate: 'briefing',
      };
    }
    return { allowed: true };
  }

  // Outros paths: permitido
  return { allowed: true };
}

/**
 * Registra ferramenta usada na fase atual
 */
export function recordToolInPhase(toolName: string): void {
  const state = getSessionState();
  const phase = state.currentPhase;

  if (phase === 'idle' || phase === 'delivered') {
    return;
  }

  if (!state.toolsUsedByPhase[phase].includes(toolName)) {
    state.toolsUsedByPhase[phase].push(toolName);
  }

  saveSessionState(state);
}

/**
 * Retorna ferramentas usadas em uma fase
 */
export function getToolsUsedInPhase(phase: 'research' | 'briefing' | 'production'): string[] {
  return getSessionState().toolsUsedByPhase[phase];
}

/**
 * Registra score do black_validation
 */
export function recordBlackValidationScore(score: number): void {
  const state = getSessionState();
  state.copyValidations.black_validation_score = score;

  // Se score >= 8, marcar production gate como passed
  if (score >= 8) {
    state.gatesPassed.production = true;
    state.gateHistory.push({
      type: 'production',
      result: 'PASSED',
      timestamp: new Date().toISOString(),
      offer: state.activeOffer || undefined,
      details: `black_validation score: ${score}/10`,
    });
    state.currentPhase = 'delivered';
  }

  saveSessionState(state);
}

/**
 * Reseta gates para uma nova oferta
 */
export function resetGatesForNewOffer(offerPath: string): void {
  const state = getSessionState();

  state.activeOffer = offerPath;
  state.currentPhase = 'research';
  state.gatesPassed = {
    research: false,
    briefing: false,
    production: false,
  };
  state.toolsUsedByPhase = {
    research: [],
    briefing: [],
    production: [],
  };
  state.copyValidations = {
    blind_critic: false,
    emotional_stress_test: false,
    black_validation_score: null,
  };

  // Manter histórico (não resetar gateHistory)

  saveSessionState(state);
}

/**
 * Retorna o estado atual dos gates
 */
export function getGatesStatus(): SessionState['gatesPassed'] {
  return getSessionState().gatesPassed;
}

/**
 * Retorna a fase atual
 */
export function getCurrentPhase(): WorkflowPhase {
  return getSessionState().currentPhase;
}

// ==========================================
// Funções legadas (mantidas para compatibilidade)
// ==========================================

export function recordFileRead(filePath: string): void {
  const state = getSessionState();
  const normalizedPath = filePath.replace(/^\.\//, '');

  if (!state.filesRead.includes(normalizedPath)) {
    state.filesRead.push(normalizedPath);
  }

  // Patterns que indicam arquivo de metodologia
  const methodologyPatterns = [
    /skills\/.*\/(SKILL|methodology|framework|principles)/i,
    /skills\/.*\/references\//i,
    /RMBC|DRE|Puzzle.*Pieces|MUP|MUS/i,
    /metodologia|principios|formulas/i,
    /references\/(core|fundamentos|templates)/i,
    /helix.*system/i,
    /copy-fundamentals\/vitais\//i,
    /psicologia-persuasao/i,
    /estrutura-mecanismo/i,
    /principios-escrita/i,
    /erros-fatais/i,
  ];

  const isMethodologyFile = methodologyPatterns.some(p => p.test(normalizedPath));

  if (isMethodologyFile) {
    state.methodologyLoaded = true;
    if (!state.frameworksConsulted.includes(normalizedPath)) {
      state.frameworksConsulted.push(normalizedPath);
    }

    const isVital = /copy-fundamentals\/vitais\//i.test(normalizedPath);
    const isFundamental = /fundamentos|principios|core/i.test(normalizedPath);
    const increment = isVital ? 0.30 : (isFundamental ? 0.25 : 0.15);
    state.reasoningDepth = Math.min(1.0, state.reasoningDepth + increment);
  }

  saveSessionState(state);
}

export function hasReadMethodology(): boolean {
  const state = getSessionState();
  return state.methodologyLoaded && state.frameworksConsulted.length > 0;
}

export function hasMinimumReasoningDepth(threshold: number = 0.6): boolean {
  return getSessionState().reasoningDepth >= threshold;
}

export function getRequiredReadings(taskType: string = 'default'): string[] {
  const taskReadings: Record<string, string[]> = {
    'origin-story': [
      'skills/helix-system-agent/references/core/RMBC.md',
      'skills/helix-system-agent/references/fundamentos/principios_fundamentais.md'
    ],
    'headline': [
      'skills/criativos-agent/references/headline-formulas.md',
      'skills/helix-system-agent/references/fundamentos/puzzle_pieces.md'
    ],
    'copy': [
      'skills/helix-system-agent/SKILL.md',
      'skills/helix-system-agent/references/core/metodologias.md'
    ],
    'default': [
      'skills/helix-system-agent/SKILL.md'
    ]
  };

  return taskReadings[taskType] || taskReadings['default'];
}

export function markPlanCreated(): void {
  const state = getSessionState();
  state.planCreated = true;
  saveSessionState(state);
}

export function recordSequentialThinking(): void {
  const state = getSessionState();
  state.sequentialThinkingUsed = true;
  state.reasoningDepth = Math.min(1.0, state.reasoningDepth + 0.20);
  saveSessionState(state);
}

export function hasUsedSequentialThinking(): boolean {
  return getSessionState().sequentialThinkingUsed;
}

// v6.9: Tool Enforcement System Functions (mantidas)

export function recordMcpToolUse(toolName: string): void {
  const state = getSessionState();

  if (!state.mcpToolsUsed.includes(toolName)) {
    state.mcpToolsUsed.push(toolName);
  }

  // Track specific validation tools
  const validationMap: Record<string, keyof SessionState['validationsPassed']> = {
    'mcp__copywriting__blind_critic': 'blind_critic',
    'mcp__copywriting__emotional_stress_test': 'emotional_stress_test',
    'mcp__copywriting__layered_review': 'layered_review',
    'mcp__copywriting__black_validation': 'black_validation',
    'mcp__copywriting__validate_gate': 'validate_gate',
    'mcp__zen__consensus': 'consensus',
  };

  const validationKey = validationMap[toolName];
  if (validationKey) {
    state.validationsPassed[validationKey] = true;
  }

  // v7.0: Também registrar na fase atual
  recordToolInPhase(toolName);

  saveSessionState(state);
}

export function recordFileWrite(filePath: string): void {
  const state = getSessionState();

  if (!state.filesWritten.includes(filePath)) {
    state.filesWritten.push(filePath);
  }

  // Detectar oferta do path se não tiver uma ativa
  if (!state.activeOffer) {
    const offerMatch = filePath.match(/([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i);
    if (offerMatch) {
      state.activeOffer = offerMatch[1];
    }
  }

  // Atualizar fase baseado no path (se não for por gate)
  if (state.currentPhase === 'idle') {
    if (/research\//i.test(filePath)) {
      state.currentPhase = 'research';
    }
  }

  saveSessionState(state);
}

export function setCurrentPhase(phase: WorkflowPhase): void {
  const state = getSessionState();
  state.currentPhase = phase;
  saveSessionState(state);
}

export function getMcpToolsUsed(): string[] {
  return getSessionState().mcpToolsUsed;
}

export function getValidationStatus(): SessionState['validationsPassed'] {
  return getSessionState().validationsPassed;
}

export function hasPassedProductionValidation(): boolean {
  const validations = getValidationStatus();
  return validations.blind_critic && validations.emotional_stress_test;
}

export function hasPassedFullValidation(): boolean {
  const validations = getValidationStatus();
  return validations.blind_critic &&
         validations.emotional_stress_test &&
         validations.black_validation;
}

export function getRequiredMcpToolsForPhase(phase: WorkflowPhase): string[] {
  const toolsByPhase: Record<string, string[]> = {
    idle: [],
    research: [
      'mcp__firecrawl__firecrawl_agent',
      'mcp__copywriting__voc_search',
    ],
    briefing: [
      'mcp__copywriting__get_phase_context',
      'mcp__copywriting__voc_search',
    ],
    production: [
      'mcp__copywriting__blind_critic',
      'mcp__copywriting__emotional_stress_test',
      'mcp__copywriting__black_validation',
    ],
    delivered: [],
  };

  return toolsByPhase[phase] || [];
}

export function getMissingRequiredTools(): string[] {
  const state = getSessionState();
  const required = getRequiredMcpToolsForPhase(state.currentPhase);
  return required.filter(tool => !state.mcpToolsUsed.includes(tool));
}

// ==========================================
// v7.1: HELIX Phase Functions
// ==========================================

/**
 * Detecta qual fase HELIX está sendo trabalhada baseado no path
 */
export function detectCurrentHelixPhase(filePath: string): number | null {
  return detectHelixPhaseFromPath(filePath);
}

/**
 * Retorna nome da fase HELIX
 */
export function getHelixPhaseName(phase: number): string {
  return HELIX_PHASE_NAMES[phase] || `Fase ${phase}`;
}

/**
 * Verifica se pode escrever arquivo de fase HELIX
 * Retorna { allowed, reason, missingTools }
 */
export function canWriteHelixPhase(filePath: string): {
  allowed: boolean;
  reason?: string;
  missingTools?: string[];
  phase?: number;
} {
  // Só verificar se é um arquivo de fase HELIX
  if (!filePath.includes('briefings/phases/') && !filePath.includes('briefings\\phases\\')) {
    return { allowed: true };
  }

  const phase = detectHelixPhaseFromPath(filePath);
  if (!phase) {
    return { allowed: true };
  }

  const state = getSessionState();
  const toolsUsed = state.toolsUsedByPhase.briefing;

  // Verificar ferramentas obrigatórias para esta fase
  const missingRequired = getHelixMissingRequired(phase, toolsUsed);

  if (missingRequired.length > 0) {
    return {
      allowed: false,
      reason: generateMissingToolsMessage(phase, missingRequired),
      missingTools: missingRequired,
      phase,
    };
  }

  // Verificar ferramentas recomendadas (apenas warning, não bloqueia)
  const missingRecommended = getHelixMissingRecommended(phase, toolsUsed);
  if (missingRecommended.length > 0) {
    console.error(`[SESSION-STATE] ⚠️ Ferramentas recomendadas não usadas para fase ${phase}: ${missingRecommended.join(', ')}`);
  }

  return { allowed: true, phase };
}

/**
 * Registra que uma fase HELIX foi completada
 */
export function recordHelixPhaseComplete(phase: number): void {
  const state = getSessionState();

  // Criar campo se não existir
  if (!(state as any).helixPhasesCompleted) {
    (state as any).helixPhasesCompleted = [];
  }

  if (!(state as any).helixPhasesCompleted.includes(phase)) {
    (state as any).helixPhasesCompleted.push(phase);
  }

  saveSessionState(state);
}

/**
 * Retorna fases HELIX já completadas
 */
export function getCompletedHelixPhases(): number[] {
  const state = getSessionState() as any;
  return state.helixPhasesCompleted || [];
}

/**
 * Verifica se todas as fases HELIX estão completas (1-10)
 */
export function areAllHelixPhasesComplete(): boolean {
  const completed = getCompletedHelixPhases();
  for (let i = 1; i <= 10; i++) {
    if (!completed.includes(i)) {
      return false;
    }
  }
  return true;
}

// Re-export HELIX constants for convenience
export {
  HELIX_PHASE_REQUIREMENTS,
  HELIX_PHASE_RECOMMENDED,
  HELIX_PHASE_NAMES,
};
