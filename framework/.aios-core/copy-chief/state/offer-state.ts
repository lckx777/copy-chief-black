// ~/.claude/hooks/lib/offer-state.ts
// Gerenciador de estado por OFERTA (não por sessão)
// v7.4 - BSSF Solution #5 (Híbrido Offer State + Header)
// Criado: 2026-02-02 (GBS 95%)

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');
const TEMPLATE_PATH = join(process.env.HOME!, '.claude', 'templates', 'helix-state-template.yaml');

// Ferramentas obrigatórias por fase HELIX
export const HELIX_REQUIRED_TOOLS: Record<number, string[]> = {
  1: ['get_phase_context'],
  2: ['get_phase_context'],
  3: ['get_phase_context', 'voc_search'],
  4: ['get_phase_context', 'voc_search'],
  5: ['get_phase_context', 'voc_search', 'consensus', 'blind_critic'],
  6: ['get_phase_context', 'blind_critic', 'emotional_stress_test'],
  7: ['get_phase_context'],
  8: ['get_phase_context'],
  9: ['get_phase_context'],
  10: ['get_phase_context', 'validate_gate'],
};

// Nomes das ferramentas para mensagens
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'get_phase_context': 'mcp__copywriting__get_phase_context',
  'voc_search': 'mcp__copywriting__voc_search',
  'consensus': 'mcp__zen__consensus',
  'blind_critic': 'mcp__copywriting__blind_critic',
  'emotional_stress_test': 'mcp__copywriting__emotional_stress_test',
  'validate_gate': 'mcp__copywriting__validate_gate',
  'sequential_thinking': 'mcp__sequential-thinking__sequentialthinking',
  'thinkdeep': 'mcp__zen__thinkdeep',
};

export interface HelixPhaseState {
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  tools_used: string[];
  tools_required: string[];
  tools_missing: string[];
  file_path?: string;
  validation?: {
    header_checked: boolean;
    tools_verified: boolean;
  };
}

export interface OfferState {
  offer_path: string;
  created_at: string;
  updated_at: string;
  workflow_phase: 'idle' | 'research' | 'briefing' | 'production' | 'delivered';
  gates: {
    research: { passed: boolean; passed_at?: string; confidence?: number };
    briefing: { passed: boolean; passed_at?: string; phases_completed: number };
    production: { passed: boolean; passed_at?: string; black_validation_score?: number };
  };
  helix_phases: Record<string, HelixPhaseState>;
  mecanismo: {
    state: 'UNDEFINED' | 'DRAFT' | 'PENDING_VALIDATION' | 'VALIDATED' | 'APPROVED';
    mup_validated: boolean;
    mus_validated: boolean;
    consensus_score?: number;
    blind_critic_mup_score?: number;
    blind_critic_mus_score?: number;
    emotional_stress_test_score?: number;
  };
  validation_history: Array<{
    tool: string;
    phase: number;
    timestamp: string;
    result: 'passed' | 'failed' | 'warning';
    score?: number;
    details?: string;
  }>;
  metadata: {
    version: string;
    last_session_id?: string;
    total_sessions: number;
  };
}

/**
 * Detecta o path da oferta a partir de um file path
 */
export function detectOfferFromPath(filePath: string): string | null {
  // Patterns para detectar oferta
  const patterns = [
    // concursos/gabaritando-portugues/briefings/...
    /([^/]+\/[^/]+)\/(?:research|briefings?|production)\//i,
    // concursos/gabaritando-portugues/...
    /copywriting-ecosystem\/([^/]+\/[^/]+)\//i,
  ];

  for (const pattern of patterns) {
    const match = filePath.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Retorna o path do helix-state.yaml para uma oferta
 */
export function getOfferStatePath(offerPath: string): string {
  return join(ECOSYSTEM_ROOT, offerPath, 'helix-state.yaml');
}

/**
 * Verifica se uma oferta tem helix-state.yaml
 */
export function hasOfferState(offerPath: string): boolean {
  return existsSync(getOfferStatePath(offerPath));
}

/**
 * Cria um novo helix-state.yaml para uma oferta
 */
export function createOfferState(offerPath: string): OfferState {
  const statePath = getOfferStatePath(offerPath);
  const now = new Date().toISOString();

  const state: OfferState = {
    offer_path: offerPath,
    created_at: now,
    updated_at: now,
    workflow_phase: 'idle',
    gates: {
      research: { passed: false },
      briefing: { passed: false, phases_completed: 0 },
      production: { passed: false },
    },
    helix_phases: {},
    mecanismo: {
      state: 'UNDEFINED',
      mup_validated: false,
      mus_validated: false,
    },
    validation_history: [],
    metadata: {
      version: '1.0.0',
      total_sessions: 0,
    },
  };

  // Inicializar fases 1-10
  for (let i = 1; i <= 10; i++) {
    const required = HELIX_REQUIRED_TOOLS[i] || ['get_phase_context'];
    state.helix_phases[`phase_${i}`] = {
      status: 'not_started',
      tools_used: [],
      tools_required: required,
      tools_missing: [...required],
    };
  }

  // Garantir diretório existe
  const dir = dirname(statePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Salvar
  writeFileSync(statePath, stringifyYaml(state));
  return state;
}

/**
 * Carrega o estado de uma oferta (cria se não existir)
 */
export function getOfferState(offerPath: string): OfferState {
  const statePath = getOfferStatePath(offerPath);

  if (!existsSync(statePath)) {
    return createOfferState(offerPath);
  }

  try {
    const content = readFileSync(statePath, 'utf-8');
    const state = parseYaml(content) as OfferState;

    // Migração: adicionar campos se não existirem
    if (!state.helix_phases) {
      state.helix_phases = {};
    }
    for (let i = 1; i <= 10; i++) {
      const key = `phase_${i}`;
      if (!state.helix_phases[key]) {
        const required = HELIX_REQUIRED_TOOLS[i] || ['get_phase_context'];
        state.helix_phases[key] = {
          status: 'not_started',
          tools_used: [],
          tools_required: required,
          tools_missing: [...required],
        };
      }
    }

    return state;
  } catch (error) {
    console.error(`[OFFER-STATE] Erro ao ler ${statePath}: ${error}`);
    return createOfferState(offerPath);
  }
}

/**
 * Salva o estado de uma oferta
 */
export function saveOfferState(state: OfferState): void {
  const statePath = getOfferStatePath(state.offer_path);
  state.updated_at = new Date().toISOString();
  writeFileSync(statePath, stringifyYaml(state));
}

/**
 * Registra uso de ferramenta em uma fase HELIX
 */
export function recordToolUseInPhase(
  offerPath: string,
  phase: number,
  toolName: string
): void {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;

  if (!state.helix_phases[phaseKey]) {
    return;
  }

  const phaseState = state.helix_phases[phaseKey];

  // Normalizar nome da ferramenta
  const normalizedTool = normalizeToolName(toolName);

  // Adicionar se não existir
  if (!phaseState.tools_used.includes(normalizedTool)) {
    phaseState.tools_used.push(normalizedTool);
  }

  // Atualizar tools_missing
  phaseState.tools_missing = phaseState.tools_required.filter(
    (t) => !phaseState.tools_used.includes(t)
  );

  // Atualizar status
  if (phaseState.status === 'not_started') {
    phaseState.status = 'in_progress';
    phaseState.started_at = new Date().toISOString();
  }

  // Registrar no histórico
  state.validation_history.push({
    tool: normalizedTool,
    phase,
    timestamp: new Date().toISOString(),
    result: 'passed',
  });

  saveOfferState(state);
}

/**
 * Normaliza nome de ferramenta (remove prefixo mcp__)
 */
export function normalizeToolName(toolName: string): string {
  // mcp__copywriting__get_phase_context -> get_phase_context
  // mcp__zen__consensus -> consensus
  const match = toolName.match(/mcp__[^_]+__(.+)/);
  if (match) {
    return match[1];
  }
  return toolName;
}

/**
 * Verifica se pode escrever arquivo de fase HELIX
 */
export function canWriteHelixPhase(
  offerPath: string,
  phase: number
): { allowed: boolean; reason?: string; missingTools?: string[] } {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;
  const phaseState = state.helix_phases[phaseKey];

  if (!phaseState) {
    return { allowed: true };
  }

  const missingTools = phaseState.tools_missing;

  if (missingTools.length > 0) {
    const missingDisplay = missingTools.map(
      (t) => TOOL_DISPLAY_NAMES[t] || t
    );

    return {
      allowed: false,
      reason: `Ferramentas obrigatórias não usadas para Fase ${phase}:\n${missingDisplay
        .map((t) => `  - ${t}`)
        .join('\n')}\n\nFerramentas já usadas: ${
        phaseState.tools_used.length > 0
          ? phaseState.tools_used.join(', ')
          : '(nenhuma)'
      }`,
      missingTools,
    };
  }

  return { allowed: true };
}

/**
 * Marca fase como completa
 */
export function markPhaseComplete(offerPath: string, phase: number): void {
  const state = getOfferState(offerPath);
  const phaseKey = `phase_${phase}`;

  if (state.helix_phases[phaseKey]) {
    state.helix_phases[phaseKey].status = 'completed';
    state.helix_phases[phaseKey].completed_at = new Date().toISOString();

    // Atualizar contador de fases completas
    const completedCount = Object.values(state.helix_phases).filter(
      (p) => p.status === 'completed'
    ).length;
    state.gates.briefing.phases_completed = completedCount;

    saveOfferState(state);
  }
}

/**
 * Retorna fases completas
 */
export function getCompletedPhases(offerPath: string): number[] {
  const state = getOfferState(offerPath);
  const completed: number[] = [];

  for (let i = 1; i <= 10; i++) {
    const phaseKey = `phase_${i}`;
    if (state.helix_phases[phaseKey]?.status === 'completed') {
      completed.push(i);
    }
  }

  return completed;
}

/**
 * Verifica header do arquivo de fase
 */
export function validatePhaseFileHeader(
  filePath: string
): { valid: boolean; toolsFound: string[]; reason?: string } {
  if (!existsSync(filePath)) {
    return { valid: true, toolsFound: [] };
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const headerMatch = content.match(
      />\s*\*\*Ferramentas usadas:\*\*\s*([^\n]+)/i
    );

    if (!headerMatch) {
      return {
        valid: false,
        toolsFound: [],
        reason: 'Header "Ferramentas usadas" não encontrado no arquivo',
      };
    }

    const toolsLine = headerMatch[1];
    const toolsFound: string[] = [];

    // Extrair ferramentas marcadas com ✅
    const toolMatches = toolsLine.matchAll(/(\w+)\s*✅/g);
    for (const match of toolMatches) {
      toolsFound.push(match[1]);
    }

    return { valid: true, toolsFound };
  } catch (error) {
    return { valid: false, toolsFound: [], reason: `Erro ao ler arquivo: ${error}` };
  }
}

/**
 * Detecta fase HELIX do path do arquivo
 */
export function detectPhaseFromPath(filePath: string): number | null {
  // phase-01-identificacao.md, phase-05-problema-vilao-mup.md, etc.
  const match = filePath.match(/phase-0?(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Sincroniza estado da oferta com arquivos existentes
 */
export function syncOfferStateWithFiles(offerPath: string): void {
  const state = getOfferState(offerPath);
  const phasesDir = join(ECOSYSTEM_ROOT, offerPath, 'briefings', 'phases');

  if (!existsSync(phasesDir)) {
    return;
  }

  // Verificar cada arquivo de fase
  for (let i = 1; i <= 10; i++) {
    const possibleNames = [
      `phase-${String(i).padStart(2, '0')}-`,
      `phase-${i}-`,
      `fase-${String(i).padStart(2, '0')}-`,
      `fase-${i}-`,
    ];

    for (const prefix of possibleNames) {
      const files = existsSync(phasesDir)
        ? require('fs').readdirSync(phasesDir) as string[]
        : [];

      const phaseFile = files.find((f: string) =>
        f.toLowerCase().startsWith(prefix.toLowerCase()) && f.endsWith('.md')
      );

      if (phaseFile) {
        const filePath = join(phasesDir, phaseFile);
        const phaseKey = `phase_${i}`;

        // Verificar header
        const headerValidation = validatePhaseFileHeader(filePath);

        if (state.helix_phases[phaseKey]) {
          state.helix_phases[phaseKey].file_path = filePath;

          // Sincronizar ferramentas do header
          if (headerValidation.valid && headerValidation.toolsFound.length > 0) {
            for (const tool of headerValidation.toolsFound) {
              const normalized = normalizeToolName(tool);
              if (!state.helix_phases[phaseKey].tools_used.includes(normalized)) {
                state.helix_phases[phaseKey].tools_used.push(normalized);
              }
            }

            // Atualizar missing
            state.helix_phases[phaseKey].tools_missing =
              state.helix_phases[phaseKey].tools_required.filter(
                (t) => !state.helix_phases[phaseKey].tools_used.includes(t)
              );
          }

          // Marcar como completa se arquivo existe
          if (state.helix_phases[phaseKey].status === 'not_started') {
            state.helix_phases[phaseKey].status = 'completed';
          }
        }

        break;
      }
    }
  }

  saveOfferState(state);
}
