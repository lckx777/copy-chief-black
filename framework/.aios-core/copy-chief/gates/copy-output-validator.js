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
var copy_output_validator_exports = {};
__export(copy_output_validator_exports, {
  COPY_OUTPUT_PATTERNS: () => COPY_OUTPUT_PATTERNS,
  COPY_PATTERNS: () => COPY_PATTERNS,
  METHODOLOGY_PATTERNS: () => METHODOLOGY_PATTERNS,
  MIN_VITALS_REQUIRED: () => MIN_VITALS_REQUIRED,
  VITAL_PATTERNS: () => VITAL_PATTERNS,
  buildMissingMethodologyMessage: () => buildMissingMethodologyMessage,
  buildTerminalCopyMessage: () => buildTerminalCopyMessage,
  extractLastAssistantResponse: () => extractLastAssistantResponse,
  validateCopyOutput: () => validateCopyOutput
});
module.exports = __toCommonJS(copy_output_validator_exports);
var import_fs = require("fs");
var import_session_state = require("../state/session-state");
const COPY_OUTPUT_PATTERNS = [
  /production\//i,
  /creatives?\//i,
  /landing-page\//i,
  /vsl\//i,
  /emails?\//i,
  /scripts?\//i,
  /copy[-_]?output/i
];
const COPY_PATTERNS = [
  // Explicit structures
  /\[GANCHO\s*\d*\]/i,
  /\[HOOK\s*\d*\]/i,
  /\[CTA\]/i,
  /\[BODY\]/i,
  /\[P\s*[-:]\s*PROBLEMA\]/i,
  /\[R\s*[-:]\s*ROTA\]/i,
  /\[S\s*[-:]\s*SOLU[ÇC][ÃA]O\]/i,
  /\[A\s*[-:]\s*A[ÇC][ÃA]O\]/i,
  // Copy headers
  /##\s*(Hook|Gancho|Body|CTA|Criativo)/i,
  /##\s*Continua[çc][ãa]o\s*(do\s*)?(Body|Criativo)/i,
  // Code blocks with copy
  /```\s*(copy|criativo|script|headline)/i,
  // Inline indicators
  /Corpo:|GANCHO\s+\d+:/i,
  /\*\*Hook\*\*:|Hook\s+\d+:/i,
  // Production structures
  /Score\s*(atual|final)?:\s*\d+\/10/i
];
const VITAL_PATTERNS = [
  /copy-fundamentals\/references\//i,
  /psicologia-persuasao/i,
  /estrutura-mecanismo/i,
  /principios-escrita/i,
  /erros-fatais/i
];
const METHODOLOGY_PATTERNS = [
  /skills\/.*\/references\/(core|fundamentos|frameworks)/i,
  /RMBC|DRE|puzzle.*pieces|principios/i,
  /metodologia|framework.*copy/i,
  /ref_frameworks.*georgi.*evaldo/i
];
const MIN_VITALS_REQUIRED = 2;
function extractLastAssistantResponse(transcript) {
  const lines = transcript.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.type === "assistant" || entry.role === "assistant") {
        const content = entry.message?.content || entry.content;
        if (Array.isArray(content)) {
          return content.filter((c) => c.type === "text").map((c) => c.text || "").join("\n");
        }
        if (typeof content === "string") {
          return content;
        }
      }
    } catch {
    }
  }
  return "";
}
function validateCopyOutput(transcriptPath) {
  if (!transcriptPath || !(0, import_fs.existsSync)(transcriptPath)) {
    return { ok: true };
  }
  const transcript = (0, import_fs.readFileSync)(transcriptPath, "utf-8");
  const lastResponse = extractLastAssistantResponse(transcript);
  if (!lastResponse) {
    return { ok: true };
  }
  const hasCopy = COPY_PATTERNS.some((p) => p.test(lastResponse));
  if (!hasCopy) {
    return { ok: true };
  }
  const state = (0, import_session_state.getSessionState)();
  const filesRead = state.filesRead || [];
  const filesWritten = state.filesWritten || [];
  const copyInFile = filesWritten.some(
    (f) => COPY_OUTPUT_PATTERNS.some((p) => p.test(f))
  );
  if (!copyInFile) {
    return { ok: false, reason: "terminal_copy", filesWritten };
  }
  const vitalsRead = filesRead.filter(
    (f) => VITAL_PATTERNS.some((p) => p.test(f))
  );
  const methodologyRead = filesRead.filter(
    (f) => METHODOLOGY_PATTERNS.some((p) => p.test(f))
  );
  const hasEnoughVitals = vitalsRead.length >= MIN_VITALS_REQUIRED;
  const hasEnoughMethodology = methodologyRead.length >= 2;
  if (!hasEnoughVitals && !hasEnoughMethodology) {
    return {
      ok: false,
      reason: "missing_methodology",
      vitalsCount: vitalsRead.length,
      methodologyCount: methodologyRead.length,
      totalFiles: filesRead.length
    };
  }
  return { ok: true };
}
function buildTerminalCopyMessage(filesWritten) {
  return `\u{1F6AB} BLOQUEADO - COPY NO TERMINAL

Copy DEVE ser escrita em ARQUIVO, n\xE3o no terminal.

**Regra:** Todo material de copy deve ser salvo em arquivo para:
- Versionamento (git)
- Valida\xE7\xE3o de metodologia
- Rastreabilidade
- Reutiliza\xE7\xE3o

**Arquivos escritos nesta sess\xE3o:** ${filesWritten.length > 0 ? filesWritten.slice(-5).join(", ") : "nenhum"}

**A\xC7\xC3O OBRIGAT\xD3RIA:**
Reescreva a copy usando Write tool em um destes diret\xF3rios:
- \`production/creatives/\` - para criativos
- \`production/vsl/\` - para scripts VSL
- \`production/landing-page/\` - para LP
- \`production/emails/\` - para emails

**Exemplo:**
\`\`\`
Write production/creatives/hook-v1.md
\`\`\`

**N\xC3O entregue copy no terminal.**`;
}
function buildMissingMethodologyMessage(vitalsCount, methodologyCount, totalFiles) {
  return `\u{1F6AB} BLOQUEADO - COPY SEM METODOLOGIA

Voce produziu copy sem consultar os fundamentos obrigatorios.

**Estado atual:**
- Arquivos VITAIS lidos: ${vitalsCount}/${MIN_VITALS_REQUIRED} minimo
- Arquivos de metodologia: ${methodologyCount}
- Total de arquivos lidos: ${totalFiles}

**ACAO OBRIGATORIA:**
1. Leia os arquivos VITAIS em:
   \`~/.claude/references/copy-fundamentals/references/\`

   - psicologia-persuasao.md
   - estrutura-mecanismo.md
   - principios-escrita.md
   - erros-fatais.md

2. Apos ler pelo menos ${MIN_VITALS_REQUIRED} arquivos, refaca a copy aplicando os frameworks.

**Comandos:**
\`\`\`
Read ~/.claude/references/copy-fundamentals/references/psicologia-persuasao.md
Read ~/.claude/references/copy-fundamentals/references/estrutura-mecanismo.md
\`\`\`

**NAO responda com copy ate completar as leituras.**`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COPY_OUTPUT_PATTERNS,
  COPY_PATTERNS,
  METHODOLOGY_PATTERNS,
  MIN_VITALS_REQUIRED,
  VITAL_PATTERNS,
  buildMissingMethodologyMessage,
  buildTerminalCopyMessage,
  extractLastAssistantResponse,
  validateCopyOutput
});
