// ~/.claude/hooks/lib/helix-phases.ts
// Sequência HELIX 1-10 com pré-requisitos
// FASE 3: Briefing Phase Sequencing

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Definição de uma fase HELIX
 */
export interface HelixPhase {
  phase: number;
  name: string;
  displayName: string;
  prereqs: number[];
  required: boolean;
  filePattern: string;
}

/**
 * Sequência HELIX completa (10 fases)
 * Cada fase tem suas pré-requisitos obrigatórios
 */
export const HELIX_PHASES: HelixPhase[] = [
  {
    phase: 1,
    name: 'one-belief',
    displayName: 'One Belief',
    prereqs: [], // Fase inicial
    required: true,
    filePattern: '*01*one*belief*'
  },
  {
    phase: 2,
    name: 'big-idea',
    displayName: 'Big Idea',
    prereqs: [1],
    required: true,
    filePattern: '*02*big*idea*'
  },
  {
    phase: 3,
    name: 'avatar',
    displayName: 'Avatar/DRE',
    prereqs: [1, 2],
    required: true,
    filePattern: '*03*avatar*'
  },
  {
    phase: 4,
    name: 'competitors',
    displayName: 'Competitors',
    prereqs: [1, 2, 3],
    required: true,
    filePattern: '*04*competitor*'
  },
  {
    phase: 5,
    name: 'mup',
    displayName: 'MUP (Problema/Vilão)',
    prereqs: [1, 2, 3, 4],
    required: true,
    filePattern: '*05*mup*'
  },
  {
    phase: 6,
    name: 'mus',
    displayName: 'MUS (Mecanismo/Solução)',
    prereqs: [5], // Depende diretamente do MUP
    required: true,
    filePattern: '*06*mus*'
  },
  {
    phase: 7,
    name: 'big-offer',
    displayName: 'Big Offer',
    prereqs: [5, 6],
    required: true,
    filePattern: '*07*offer*'
  },
  {
    phase: 8,
    name: 'fechamento',
    displayName: 'Fechamento/Pitch',
    prereqs: [7],
    required: true,
    filePattern: '*08*fechamento*'
  },
  {
    phase: 9,
    name: 'leads',
    displayName: 'Leads/Ganchos',
    prereqs: [5, 6], // Pode ser feito em paralelo com 7-8
    required: true,
    filePattern: '*09*lead*'
  },
  {
    phase: 10,
    name: 'progressao',
    displayName: 'Progressão Emocional',
    prereqs: [8, 9], // Síntese final
    required: true,
    filePattern: '*10*progress*'
  }
];

/**
 * Patterns para detectar fase no prompt
 */
export const PHASE_PATTERNS: Record<number, RegExp[]> = {
  1: [/one\s*belief/i, /fase\s*1\b/i, /fase01/i],
  2: [/big\s*idea/i, /fase\s*2\b/i, /fase02/i],
  3: [/avatar/i, /dre/i, /psicologia/i, /fase\s*3\b/i, /fase03/i],
  4: [/competitor/i, /concorrente/i, /fase\s*4\b/i, /fase04/i],
  5: [/\bmup\b/i, /vilão/i, /vilao/i, /problema/i, /horror\s*stor/i, /fase\s*5\b/i, /fase05/i],
  6: [/\bmus\b/i, /mecanismo/i, /solução/i, /solucao/i, /origin\s*stor/i, /fase\s*6\b/i, /fase06/i],
  7: [/big\s*offer/i, /oferta/i, /stack/i, /bonus/i, /bônus/i, /fase\s*7\b/i, /fase07/i],
  8: [/fechamento/i, /pitch/i, /\bcta\b/i, /future\s*pacing/i, /fase\s*8\b/i, /fase08/i],
  9: [/lead/i, /gancho/i, /headline/i, /hook/i, /fase\s*9\b/i, /fase09/i],
  10: [/progressão/i, /progressao/i, /emocional/i, /fase\s*10\b/i, /fase10/i]
};

/**
 * Escape phrases que permitem bypass do sequencing
 */
export const SEQUENCE_ESCAPES = [
  /pular\s*fase/i,
  /skip\s*phase/i,
  /fora\s*de\s*ordem/i,
  /sem\s*sequência/i,
  /--skip-sequence/i,
  /forçar\s*fase/i
];

export interface PhaseCheckResult {
  unlocked: boolean;
  targetPhase: number | null;
  missingPhases: number[];
  missingNames: string[];
  reason: string;
}

/**
 * Obtém informações de uma fase pelo número
 */
export function getPhaseInfo(phaseNum: number): HelixPhase | undefined {
  return HELIX_PHASES.find(p => p.phase === phaseNum);
}

/**
 * Detecta qual fase está sendo tentada a partir do prompt
 */
export function detectPhaseFromPrompt(prompt: string): number | null {
  for (const [phaseStr, patterns] of Object.entries(PHASE_PATTERNS)) {
    const phase = parseInt(phaseStr);
    if (patterns.some(pattern => pattern.test(prompt))) {
      return phase;
    }
  }
  return null;
}

/**
 * Verifica se prompt contém escape phrase
 */
export function hasSequenceEscape(prompt: string): boolean {
  return SEQUENCE_ESCAPES.some(pattern => pattern.test(prompt));
}

/**
 * Verifica se um arquivo de fase existe no diretório de briefings
 */
export function phaseFileExists(offerPath: string, phase: HelixPhase): boolean {
  const briefingsDir = join(offerPath, 'briefings', 'phases');

  if (!existsSync(briefingsDir)) {
    return false;
  }

  // Verificar diferentes padrões de nome
  const possibleNames = [
    `fase${String(phase.phase).padStart(2, '0')}.md`,
    `${String(phase.phase).padStart(2, '0')}-${phase.name}.md`,
    `phase${phase.phase}.md`,
    `${phase.name}.md`
  ];

  for (const name of possibleNames) {
    if (existsSync(join(briefingsDir, name))) {
      return true;
    }
  }

  return false;
}

/**
 * Lista fases completadas para uma oferta
 */
export function getCompletedPhases(offerPath: string): number[] {
  const completed: number[] = [];

  for (const phase of HELIX_PHASES) {
    if (phaseFileExists(offerPath, phase)) {
      completed.push(phase.phase);
    }
  }

  return completed;
}

/**
 * Verifica se uma fase está desbloqueada
 */
export function isPhaseUnlocked(
  targetPhase: number,
  offerPath: string
): PhaseCheckResult {
  const phaseInfo = getPhaseInfo(targetPhase);

  if (!phaseInfo) {
    return {
      unlocked: false,
      targetPhase,
      missingPhases: [],
      missingNames: [],
      reason: `Fase ${targetPhase} não existe no sistema HELIX (1-10)`
    };
  }

  // Fase 1 sempre desbloqueada
  if (targetPhase === 1) {
    return {
      unlocked: true,
      targetPhase,
      missingPhases: [],
      missingNames: [],
      reason: 'Fase 1 (One Belief) sempre disponível'
    };
  }

  const completedPhases = getCompletedPhases(offerPath);
  const missingPhases: number[] = [];
  const missingNames: string[] = [];

  for (const prereq of phaseInfo.prereqs) {
    if (!completedPhases.includes(prereq)) {
      missingPhases.push(prereq);
      const prereqInfo = getPhaseInfo(prereq);
      if (prereqInfo) {
        missingNames.push(`Fase ${prereq}: ${prereqInfo.displayName}`);
      }
    }
  }

  if (missingPhases.length > 0) {
    return {
      unlocked: false,
      targetPhase,
      missingPhases,
      missingNames,
      reason: `Fase ${targetPhase} (${phaseInfo.displayName}) requer fases anteriores`
    };
  }

  return {
    unlocked: true,
    targetPhase,
    missingPhases: [],
    missingNames: [],
    reason: `Fase ${targetPhase} (${phaseInfo.displayName}) desbloqueada`
  };
}

/**
 * Verifica sequência de fase no contexto de um prompt
 */
export function checkPhaseSequence(
  prompt: string,
  offerPath: string
): PhaseCheckResult {
  // Verificar escape
  if (hasSequenceEscape(prompt)) {
    return {
      unlocked: true,
      targetPhase: null,
      missingPhases: [],
      missingNames: [],
      reason: 'Escape phrase detected - sequence check bypassed'
    };
  }

  // Detectar fase
  const targetPhase = detectPhaseFromPrompt(prompt);
  if (!targetPhase) {
    return {
      unlocked: true,
      targetPhase: null,
      missingPhases: [],
      missingNames: [],
      reason: 'No specific phase detected in prompt'
    };
  }

  // Verificar se está desbloqueada
  return isPhaseUnlocked(targetPhase, offerPath);
}

/**
 * Gera mensagem de bloqueio formatada
 */
export function formatPhaseBlockMessage(result: PhaseCheckResult): string {
  if (result.unlocked || !result.targetPhase) {
    return '';
  }

  const phaseInfo = getPhaseInfo(result.targetPhase);
  const phaseName = phaseInfo?.displayName || `Fase ${result.targetPhase}`;

  const missingList = result.missingNames
    .map(name => `  - [ ] ${name}`)
    .join('\n');

  return `
🚫 BLOQUEADO - HELIX PHASE SEQUENCING

**Fase tentada:** ${result.targetPhase} - ${phaseName}
**Motivo:** ${result.reason}

### PRÉ-REQUISITOS FALTANDO

${missingList}

### AÇÃO OBRIGATÓRIA

Complete as fases anteriores antes de prosseguir.

Cada fase deve ter um arquivo em:
\`briefings/phases/faseXX-nome.md\`

### ESCAPE (se necessário)

Diga "pular fase" ou "fora de ordem" para bypass.

### SEQUÊNCIA HELIX

1. One Belief → 2. Big Idea → 3. Avatar
                              ↓
4. Competitors ← ← ← ← ← ← ← ←
                              ↓
5. MUP (Problema/Vilão)
        ↓
6. MUS (Mecanismo/Solução)
        ↓         ↓
7. Big Offer    9. Leads/Ganchos
        ↓         ↓
8. Fechamento/Pitch
        ↓         ↓
10. Progressão Emocional
`;
}

/**
 * Extrai path da oferta do prompt ou contexto
 */
export function extractOfferPath(prompt: string, cwd: string): string | null {
  // Tentar detectar oferta mencionada no prompt
  const offerPatterns: Record<string, string> = {
    'concursa': 'concursos/concursa-ai',
    'hacker': 'concursos/hacker',
    'gabaritando': 'concursos/gabaritando-lei-seca',
    'gpt': 'concursos/gpt-dos-aprovados'
  };

  for (const [key, path] of Object.entries(offerPatterns)) {
    if (prompt.toLowerCase().includes(key)) {
      return join(process.env.HOME || '', 'copywriting-ecosystem', path);
    }
  }

  // Se estiver dentro de uma oferta, usar cwd
  if (cwd.includes('copywriting-ecosystem')) {
    // Extrair até o nível da oferta
    const match = cwd.match(/copywriting-ecosystem\/[^/]+\/[^/]+/);
    if (match) {
      return match[0].startsWith('/') ? match[0] : join(process.env.HOME || '', match[0]);
    }
  }

  return null;
}
