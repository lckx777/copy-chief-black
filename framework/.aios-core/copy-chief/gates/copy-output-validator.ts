/**
 * copy-output-validator.ts — Copy Output Validation Module
 * Part of AIOS Copy Chief OS Layer
 *
 * Validates that copy produced in a session:
 * 1. Was written to a file (not just printed in terminal)
 * 2. Was produced with methodology files read (vitals or methodology references)
 *
 * Usage:
 *   import { validateCopyOutput } from './copy-output-validator'
 *
 * Extracted from: ~/.claude/hooks/stop-copy-validation.ts
 * Created: 2026-02-01 | Refactored: 2026-03-02
 */

import { readFileSync, existsSync } from 'fs';
import { getSessionState } from '../state/session-state';

// ─── Pattern Tables ───────────────────────────────────────────────────────────

/** Directories/files where copy MUST be written */
export const COPY_OUTPUT_PATTERNS = [
  /production\//i,
  /creatives?\//i,
  /landing-page\//i,
  /vsl\//i,
  /emails?\//i,
  /scripts?\//i,
  /copy[-_]?output/i,
];

/** Patterns that indicate copy production in the assistant response */
export const COPY_PATTERNS = [
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
  /Score\s*(atual|final)?:\s*\d+\/10/i,
];

/** Vital file patterns (must be read before producing copy) */
export const VITAL_PATTERNS = [
  /copy-fundamentals\/references\//i,
  /psicologia-persuasao/i,
  /estrutura-mecanismo/i,
  /principios-escrita/i,
  /erros-fatais/i,
];

/** Methodology file patterns (alternative to vitals) */
export const METHODOLOGY_PATTERNS = [
  /skills\/.*\/references\/(core|fundamentos|frameworks)/i,
  /RMBC|DRE|puzzle.*pieces|principios/i,
  /metodologia|framework.*copy/i,
  /ref_frameworks.*georgi.*evaldo/i,
];

/** Minimum vital files that must have been read */
export const MIN_VITALS_REQUIRED = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValidationOutcome =
  | { ok: true }
  | { ok: false; reason: 'terminal_copy'; filesWritten: string[] }
  | { ok: false; reason: 'missing_methodology'; vitalsCount: number; methodologyCount: number; totalFiles: number };

// ─── Transcript Parser ────────────────────────────────────────────────────────

/**
 * Extract the last assistant message text from a JSONL transcript.
 */
export function extractLastAssistantResponse(transcript: string): string {
  const lines = transcript.trim().split('\n');

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]);

      if (entry.type === 'assistant' || entry.role === 'assistant') {
        const content = entry.message?.content || entry.content;

        if (Array.isArray(content)) {
          return content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text || '')
            .join('\n');
        }

        if (typeof content === 'string') {
          return content;
        }
      }
    } catch {
      // Skip non-JSON lines
    }
  }

  return '';
}

// ─── Main Validation ──────────────────────────────────────────────────────────

/**
 * Main validation entrypoint. Reads transcript from disk and checks:
 * 1. Does the response contain copy patterns?
 * 2. Was the copy written to a production file?
 * 3. Were methodology/vital files read?
 *
 * @param transcriptPath - Absolute path to the session JSONL transcript
 * @returns ValidationOutcome — ok or blocked with reason details
 */
export function validateCopyOutput(transcriptPath: string): ValidationOutcome {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { ok: true };
  }

  const transcript = readFileSync(transcriptPath, 'utf-8');
  const lastResponse = extractLastAssistantResponse(transcript);

  if (!lastResponse) {
    return { ok: true };
  }

  // Check if the response contains copy
  const hasCopy = COPY_PATTERNS.some(p => p.test(lastResponse));
  if (!hasCopy) {
    return { ok: true };
  }

  // Copy was produced — verify it was written to a file
  const state = getSessionState();
  const filesRead = state.filesRead || [];
  const filesWritten = state.filesWritten || [];

  const copyInFile = filesWritten.some(f =>
    COPY_OUTPUT_PATTERNS.some(p => p.test(f))
  );

  if (!copyInFile) {
    return { ok: false, reason: 'terminal_copy', filesWritten };
  }

  // Verify methodology files were consulted
  const vitalsRead = filesRead.filter(f =>
    VITAL_PATTERNS.some(p => p.test(f))
  );
  const methodologyRead = filesRead.filter(f =>
    METHODOLOGY_PATTERNS.some(p => p.test(f))
  );

  const hasEnoughVitals = vitalsRead.length >= MIN_VITALS_REQUIRED;
  const hasEnoughMethodology = methodologyRead.length >= 2;

  if (!hasEnoughVitals && !hasEnoughMethodology) {
    return {
      ok: false,
      reason: 'missing_methodology',
      vitalsCount: vitalsRead.length,
      methodologyCount: methodologyRead.length,
      totalFiles: filesRead.length,
    };
  }

  return { ok: true };
}

// ─── Block Message Builders ───────────────────────────────────────────────────

export function buildTerminalCopyMessage(filesWritten: string[]): string {
  return `\uD83D\uDEAB BLOQUEADO - COPY NO TERMINAL

Copy DEVE ser escrita em ARQUIVO, não no terminal.

**Regra:** Todo material de copy deve ser salvo em arquivo para:
- Versionamento (git)
- Validação de metodologia
- Rastreabilidade
- Reutilização

**Arquivos escritos nesta sessão:** ${filesWritten.length > 0 ? filesWritten.slice(-5).join(', ') : 'nenhum'}

**AÇÃO OBRIGATÓRIA:**
Reescreva a copy usando Write tool em um destes diretórios:
- \`production/creatives/\` - para criativos
- \`production/vsl/\` - para scripts VSL
- \`production/landing-page/\` - para LP
- \`production/emails/\` - para emails

**Exemplo:**
\`\`\`
Write production/creatives/hook-v1.md
\`\`\`

**NÃO entregue copy no terminal.**`;
}

export function buildMissingMethodologyMessage(
  vitalsCount: number,
  methodologyCount: number,
  totalFiles: number
): string {
  return `\uD83D\uDEAB BLOQUEADO - COPY SEM METODOLOGIA

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
