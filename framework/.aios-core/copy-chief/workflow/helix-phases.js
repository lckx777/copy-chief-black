var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var helix_phases_exports = {};
__export(helix_phases_exports, {
  HELIX_PHASES: () => HELIX_PHASES,
  PHASE_PATTERNS: () => PHASE_PATTERNS,
  SEQUENCE_ESCAPES: () => SEQUENCE_ESCAPES,
  checkPhaseSequence: () => checkPhaseSequence,
  detectPhaseFromPrompt: () => detectPhaseFromPrompt,
  extractOfferPath: () => extractOfferPath,
  formatPhaseBlockMessage: () => formatPhaseBlockMessage,
  getCompletedPhases: () => getCompletedPhases,
  getPhaseInfo: () => getPhaseInfo,
  hasSequenceEscape: () => hasSequenceEscape,
  isPhaseUnlocked: () => isPhaseUnlocked,
  phaseFileExists: () => phaseFileExists
});
module.exports = __toCommonJS(helix_phases_exports);
var import_fs = require("fs");
var import_path = require("path");
const HELIX_PHASES = [
  {
    phase: 1,
    name: "one-belief",
    displayName: "One Belief",
    prereqs: [],
    // Fase inicial
    required: true,
    filePattern: "*01*one*belief*"
  },
  {
    phase: 2,
    name: "big-idea",
    displayName: "Big Idea",
    prereqs: [1],
    required: true,
    filePattern: "*02*big*idea*"
  },
  {
    phase: 3,
    name: "avatar",
    displayName: "Avatar/DRE",
    prereqs: [1, 2],
    required: true,
    filePattern: "*03*avatar*"
  },
  {
    phase: 4,
    name: "competitors",
    displayName: "Competitors",
    prereqs: [1, 2, 3],
    required: true,
    filePattern: "*04*competitor*"
  },
  {
    phase: 5,
    name: "mup",
    displayName: "MUP (Problema/Vil\xE3o)",
    prereqs: [1, 2, 3, 4],
    required: true,
    filePattern: "*05*mup*"
  },
  {
    phase: 6,
    name: "mus",
    displayName: "MUS (Mecanismo/Solu\xE7\xE3o)",
    prereqs: [5],
    // Depende diretamente do MUP
    required: true,
    filePattern: "*06*mus*"
  },
  {
    phase: 7,
    name: "big-offer",
    displayName: "Big Offer",
    prereqs: [5, 6],
    required: true,
    filePattern: "*07*offer*"
  },
  {
    phase: 8,
    name: "fechamento",
    displayName: "Fechamento/Pitch",
    prereqs: [7],
    required: true,
    filePattern: "*08*fechamento*"
  },
  {
    phase: 9,
    name: "leads",
    displayName: "Leads/Ganchos",
    prereqs: [5, 6],
    // Pode ser feito em paralelo com 7-8
    required: true,
    filePattern: "*09*lead*"
  },
  {
    phase: 10,
    name: "progressao",
    displayName: "Progress\xE3o Emocional",
    prereqs: [8, 9],
    // Síntese final
    required: true,
    filePattern: "*10*progress*"
  }
];
const PHASE_PATTERNS = {
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
const SEQUENCE_ESCAPES = [
  /pular\s*fase/i,
  /skip\s*phase/i,
  /fora\s*de\s*ordem/i,
  /sem\s*sequência/i,
  /--skip-sequence/i,
  /forçar\s*fase/i
];
function getPhaseInfo(phaseNum) {
  return HELIX_PHASES.find((p) => p.phase === phaseNum);
}
function detectPhaseFromPrompt(prompt) {
  for (const [phaseStr, patterns] of Object.entries(PHASE_PATTERNS)) {
    const phase = parseInt(phaseStr);
    if (patterns.some((pattern) => pattern.test(prompt))) {
      return phase;
    }
  }
  return null;
}
function hasSequenceEscape(prompt) {
  return SEQUENCE_ESCAPES.some((pattern) => pattern.test(prompt));
}
function phaseFileExists(offerPath, phase) {
  const briefingsDir = (0, import_path.join)(offerPath, "briefings", "phases");
  if (!(0, import_fs.existsSync)(briefingsDir)) {
    return false;
  }
  const possibleNames = [
    `fase${String(phase.phase).padStart(2, "0")}.md`,
    `${String(phase.phase).padStart(2, "0")}-${phase.name}.md`,
    `phase${phase.phase}.md`,
    `${phase.name}.md`
  ];
  for (const name of possibleNames) {
    if ((0, import_fs.existsSync)((0, import_path.join)(briefingsDir, name))) {
      return true;
    }
  }
  return false;
}
function getCompletedPhases(offerPath) {
  const completed = [];
  for (const phase of HELIX_PHASES) {
    if (phaseFileExists(offerPath, phase)) {
      completed.push(phase.phase);
    }
  }
  return completed;
}
function isPhaseUnlocked(targetPhase, offerPath) {
  const phaseInfo = getPhaseInfo(targetPhase);
  if (!phaseInfo) {
    return {
      unlocked: false,
      targetPhase,
      missingPhases: [],
      missingNames: [],
      reason: `Fase ${targetPhase} n\xE3o existe no sistema HELIX (1-10)`
    };
  }
  if (targetPhase === 1) {
    return {
      unlocked: true,
      targetPhase,
      missingPhases: [],
      missingNames: [],
      reason: "Fase 1 (One Belief) sempre dispon\xEDvel"
    };
  }
  const completedPhases = getCompletedPhases(offerPath);
  const missingPhases = [];
  const missingNames = [];
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
function checkPhaseSequence(prompt, offerPath) {
  if (hasSequenceEscape(prompt)) {
    return {
      unlocked: true,
      targetPhase: null,
      missingPhases: [],
      missingNames: [],
      reason: "Escape phrase detected - sequence check bypassed"
    };
  }
  const targetPhase = detectPhaseFromPrompt(prompt);
  if (!targetPhase) {
    return {
      unlocked: true,
      targetPhase: null,
      missingPhases: [],
      missingNames: [],
      reason: "No specific phase detected in prompt"
    };
  }
  return isPhaseUnlocked(targetPhase, offerPath);
}
function formatPhaseBlockMessage(result) {
  if (result.unlocked || !result.targetPhase) {
    return "";
  }
  const phaseInfo = getPhaseInfo(result.targetPhase);
  const phaseName = phaseInfo?.displayName || `Fase ${result.targetPhase}`;
  const missingList = result.missingNames.map((name) => `  - [ ] ${name}`).join("\n");
  return `
\u{1F6AB} BLOQUEADO - HELIX PHASE SEQUENCING

**Fase tentada:** ${result.targetPhase} - ${phaseName}
**Motivo:** ${result.reason}

### PR\xC9-REQUISITOS FALTANDO

${missingList}

### A\xC7\xC3O OBRIGAT\xD3RIA

Complete as fases anteriores antes de prosseguir.

Cada fase deve ter um arquivo em:
\`briefings/phases/faseXX-nome.md\`

### ESCAPE (se necess\xE1rio)

Diga "pular fase" ou "fora de ordem" para bypass.

### SEQU\xCANCIA HELIX

1. One Belief \u2192 2. Big Idea \u2192 3. Avatar
                              \u2193
4. Competitors \u2190 \u2190 \u2190 \u2190 \u2190 \u2190 \u2190 \u2190
                              \u2193
5. MUP (Problema/Vil\xE3o)
        \u2193
6. MUS (Mecanismo/Solu\xE7\xE3o)
        \u2193         \u2193
7. Big Offer    9. Leads/Ganchos
        \u2193         \u2193
8. Fechamento/Pitch
        \u2193         \u2193
10. Progress\xE3o Emocional
`;
}
function extractOfferPath(prompt, cwd) {
  const offerPatterns = {
    "concursa": "concursos/concursa-ai",
    "hacker": "concursos/hacker",
    "gabaritando": "concursos/gabaritando-lei-seca",
    "gpt": "concursos/gpt-dos-aprovados"
  };
  for (const [key, path] of Object.entries(offerPatterns)) {
    if (prompt.toLowerCase().includes(key)) {
      return (0, import_path.join)(process.env.HOME || "", "copywriting-ecosystem", path);
    }
  }
  if (cwd.includes("copywriting-ecosystem")) {
    const match = cwd.match(/copywriting-ecosystem\/[^/]+\/[^/]+/);
    if (match) {
      return match[0].startsWith("/") ? match[0] : (0, import_path.join)(process.env.HOME || "", match[0]);
    }
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HELIX_PHASES,
  PHASE_PATTERNS,
  SEQUENCE_ESCAPES,
  checkPhaseSequence,
  detectPhaseFromPrompt,
  extractOfferPath,
  formatPhaseBlockMessage,
  getCompletedPhases,
  getPhaseInfo,
  hasSequenceEscape,
  isPhaseUnlocked,
  phaseFileExists
});
