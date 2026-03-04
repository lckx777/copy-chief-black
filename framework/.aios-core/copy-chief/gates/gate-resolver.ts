// ~/.claude/hooks/lib/gate-resolver.ts
// Gate Resolver - v2.1 (State Machine Integration)
// Simplificado: delega para state-machine.ts como fonte primária
// Mantém interface pública para compatibilidade com phase-gate.ts
// Criado: 2026-02-03 | Atualizado: 2026-02-23
// v2.1: Lazy-load state deps to allow require() without full resolution chain

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ─── Lazy loaders for state modules (avoid hard import-chain failures) ─────

type GateType = 'research' | 'briefing' | 'production';
type Phase = 'IDLE' | 'RESEARCH' | 'BRIEFING' | 'PRODUCTION' | 'REVIEW' | 'DELIVERED';

function loadStateMachineModule(): any {
  try {
    return require('../state/state-machine.ts');
  } catch {
    try { return require('../state/state-machine'); } catch { return null; }
  }
}

function loadSessionStateModule(): any {
  try {
    return require('../state/session-state.ts');
  } catch {
    try { return require('../state/session-state'); } catch { return null; }
  }
}

function loadOfferStateModule(): any {
  try {
    return require('../state/offer-state.ts');
  } catch {
    try { return require('../state/offer-state'); } catch { return null; }
  }
}

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

export interface GateResolution {
  allowed: boolean;
  source: 'state-machine' | 'offer-state' | 'session-state' | 'heuristic' | 'default';
  reason?: string;
  requiredGate?: GateType;
  offerPath?: string;
  debug?: {
    offerStateChecked: boolean;
    offerGatePassed?: boolean;
    sessionStateChecked: boolean;
    sessionGatePassed?: boolean;
    heuristicChecked: boolean;
    heuristicPassed?: boolean;
  };
}

/**
 * Verifica se pode escrever em um path usando state-machine.ts como fonte primária
 * Fallback chain: state-machine → offer-state → session-state → heurística
 */
export function resolveCanWriteToPath(filePath: string): GateResolution {
  const debug = {
    offerStateChecked: false,
    offerGatePassed: undefined as boolean | undefined,
    sessionStateChecked: false,
    sessionGatePassed: undefined as boolean | undefined,
    heuristicChecked: false,
    heuristicPassed: undefined as boolean | undefined,
  };

  const smModule = loadStateMachineModule();
  const sessionModule = loadSessionStateModule();
  const offerModule = loadOfferStateModule();

  if (!smModule) {
    return { allowed: true, source: 'default', debug };
  }

  const { loadMachine, canWriteToPath: smCanWrite, detectOffer } = smModule;

  // 1. Tentar state-machine.ts (nova fonte primária)
  const offerPath = detectOffer(filePath);
  if (offerPath) {
    const smCheck = smCanWrite(filePath);
    debug.offerStateChecked = true;
    debug.offerGatePassed = smCheck.allowed;

    if (smCheck.allowed) {
      return {
        allowed: true,
        source: smCheck.source === 'heuristic' ? 'heuristic' : 'state-machine',
        offerPath,
        debug,
      };
    }

    // State machine bloqueou — tentar fallbacks

    // 2. Tentar offer-state legado (helix-state.yaml pode ter formato antigo)
    if (offerModule) {
      const { hasOfferState, getOfferState } = offerModule;
      if (hasOfferState(offerPath)) {
        const offerState = getOfferState(offerPath);
        const isBriefing = /briefings?\//i.test(filePath);
        const isProduction = /production\//i.test(filePath);

        if (isBriefing && offerState.gates?.research?.passed) {
          debug.offerGatePassed = true;
          return { allowed: true, source: 'offer-state', offerPath, debug };
        }
        if (isProduction && offerState.gates?.briefing?.passed) {
          debug.offerGatePassed = true;
          return { allowed: true, source: 'offer-state', offerPath, debug };
        }
      }
    }

    // 3. Tentar session-state
    if (sessionModule) {
      const { canWriteToPath: sessionCanWrite } = sessionModule;
      debug.sessionStateChecked = true;
      const sessionCheck = sessionCanWrite(filePath);
      debug.sessionGatePassed = sessionCheck.allowed;

      if (sessionCheck.allowed) {
        return { allowed: true, source: 'session-state', offerPath, debug };
      }
    }

    // Todas as fontes falharam — retornar bloqueio do state-machine
    const requiredGate = /briefings?\//i.test(filePath) ? 'research' as GateType
      : /production\//i.test(filePath) ? 'briefing' as GateType
      : undefined;

    return {
      allowed: false,
      source: 'state-machine',
      reason: smCheck.reason || `Gate não passou para "${offerPath}".`,
      requiredGate,
      offerPath,
      debug,
    };
  }

  // Sem oferta detectada — permitir por default
  return { allowed: true, source: 'default', debug };
}

/**
 * Sincroniza estado do session-state com offer/state-machine
 * Útil para hidratar sessão nova com estado persistente
 */
export function syncSessionFromOffer(offerPath: string): void {
  const smModule = loadStateMachineModule();
  const sessionModule = loadSessionStateModule();
  const offerModule = loadOfferStateModule();

  try {
    if (smModule && sessionModule) {
      const { loadMachine } = smModule;
      const { getSessionState, saveSessionState } = sessionModule;

      const machine = loadMachine(offerPath);
      const sessionState = getSessionState();

      if (machine.gates.research.passed) sessionState.gatesPassed.research = true;
      if (machine.gates.briefing.passed) sessionState.gatesPassed.briefing = true;
      if (machine.gates.production.passed) sessionState.gatesPassed.production = true;

      const phaseMap: Record<Phase, string> = {
        IDLE: 'idle',
        RESEARCH: 'research',
        BRIEFING: 'briefing',
        PRODUCTION: 'production',
        REVIEW: 'production',
        DELIVERED: 'delivered',
      };
      sessionState.currentPhase = (phaseMap[machine.phase] || 'idle') as any;
      sessionState.activeOffer = offerPath;
      saveSessionState(sessionState);
      return;
    }
  } catch {
    // Fallback: tentar offer-state legado
  }

  try {
    if (offerModule && sessionModule) {
      const { hasOfferState, getOfferState } = offerModule;
      const { getSessionState, saveSessionState } = sessionModule;

      if (hasOfferState(offerPath)) {
        const offerState = getOfferState(offerPath);
        const sessionState = getSessionState();

        if (offerState.gates?.research?.passed) sessionState.gatesPassed.research = true;
        if (offerState.gates?.briefing?.passed) sessionState.gatesPassed.briefing = true;
        if (offerState.gates?.production?.passed) sessionState.gatesPassed.production = true;
        if (offerState.workflow_phase) sessionState.currentPhase = offerState.workflow_phase as any;
        sessionState.activeOffer = offerPath;
        saveSessionState(sessionState);
      }
    }
  } catch {
    // Silent fail — session-state permanece como está
  }
}

// ==========================================
// Routing Support
// ==========================================

export interface RoutingGateStatus {
  phase: string;
  gates: {
    research: boolean;
    briefing: boolean;
    production: boolean;
  };
  offerPath: string;
  source: 'helix-state' | 'state-machine' | 'default';
}

/**
 * resolveForRouting — Read-only gate status for routing decisions.
 * Simpler than resolveCanWriteToPath: no side effects, just reads helix-state.yaml
 * and returns current phase + gate status. Used by orchestration to decide which
 * agent or workflow step to dispatch.
 *
 * Completely self-contained: only uses 'fs' and 'path' — no state-machine deps.
 *
 * @param offerPath - Relative path (e.g. "saude/florayla") or absolute path
 * @returns RoutingGateStatus with phase and gate booleans
 */
export function resolveForRouting(offerPath: string): RoutingGateStatus {
  const resolved = offerPath.startsWith('/')
    ? offerPath
    : join(ECOSYSTEM_ROOT, offerPath);

  const helixStatePath = join(resolved, 'helix-state.yaml');

  // Default result (fail-open for routing)
  const defaultResult: RoutingGateStatus = {
    phase: 'IDLE',
    gates: { research: false, briefing: false, production: false },
    offerPath: resolved,
    source: 'default',
  };

  try {
    if (!existsSync(helixStatePath)) {
      return defaultResult;
    }

    const content = readFileSync(helixStatePath, 'utf-8');

    // Parse phase
    const phaseMatch = content.match(/^phase\s*:\s*(\w+)/m);
    const phase = phaseMatch ? phaseMatch[1].toUpperCase() : 'IDLE';

    // Parse gate statuses from gates block
    const gatesSection = content.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || content.substring(content.indexOf('gates:') + 6);
    const gateLines = gatesSection.split('\n');

    let researchPassed = false;
    let briefingPassed = false;
    let productionPassed = false;
    let currentGate = '';

    for (const line of gateLines) {
      const gateNameMatch = line.match(/^\s{2}(research|briefing|production)\s*:/);
      if (gateNameMatch) {
        currentGate = gateNameMatch[1];
        continue;
      }
      const passedMatch = line.match(/^\s+passed\s*:\s*(true|false)/);
      if (passedMatch && currentGate) {
        const val = passedMatch[1] === 'true';
        if (currentGate === 'research') researchPassed = val;
        else if (currentGate === 'briefing') briefingPassed = val;
        else if (currentGate === 'production') productionPassed = val;
      }
    }

    return {
      phase,
      gates: {
        research: researchPassed,
        briefing: briefingPassed,
        production: productionPassed,
      },
      offerPath: resolved,
      source: 'helix-state',
    };
  } catch {
    return defaultResult;
  }
}

// Legacy exports para compatibilidade
export function hasResearchGatePassed(offerPath: string): boolean {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.research.passed;
}

export function hasBriefingGatePassed(offerPath: string): boolean {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.briefing.passed;
}

export function hasProductionGatePassed(offerPath: string): boolean {
  const smModule = loadStateMachineModule();
  if (!smModule) return false;
  const machine = smModule.loadMachine(offerPath);
  return machine.gates.production.passed;
}
