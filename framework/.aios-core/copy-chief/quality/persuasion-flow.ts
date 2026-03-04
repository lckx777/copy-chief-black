/**
 * persuasion-flow.ts — Copy Chief Quality Module
 * Part of AIOS Core: copy-chief/quality
 *
 * Validates emotional flow continuity in produced copy.
 * Checks that emotional_exit[N] ≈ emotional_entry[N+1] between adjacent
 * persuasive units.
 *
 * Trigger: PostToolUse when Write|Edit targets */production/**\/*.md
 * Output: WARNING only (never blocks). Reports continuity status via stderr.
 *
 * Ref: persuasion-chunking.md for canonical framework
 * Ref: persuasion-chunk.schema.yaml for field definitions
 *
 * Created: 2026-02-27 (Sprint S4: Persuasion Chunking)
 * Refactored: 2026-03-02 (AIOS Core module extraction)
 */

import { readFileSync, existsSync } from "fs";

// ─── Constants ───────────────────────────────────────────────────────────────

export const UNIT_HEADER_REGEX = /^##\s+(?:Unidade|Unit|Capitulo|Capítulo|Bloco|Section)\s+(\d+)/im;
export const EMOTIONAL_ENTRY_REGEX = /(?:ENTRADA\s+EMOCIONAL|emotional[_-]?entry|Entrada)\s*:\s*(.+)/i;
export const EMOTIONAL_EXIT_REGEX = /(?:SAÍDA\s+EMOCIONAL|SAIDA\s+EMOCIONAL|emotional[_-]?exit|Saída|Saida)\s*:\s*(.+)/i;
export const DRE_LEVEL_REGEX = /(?:DRE\s+LEVEL|dre[_-]?level|DRE)\s*:\s*(\d)/i;
export const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---/;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PersuasionFlowInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: Record<string, unknown>;
}

export interface PersuasiveUnit {
  position: number;
  name: string;
  emotional_entry: string;
  emotional_exit: string;
  dre_level: number;
}

export interface FlowCheck {
  from_unit: number;
  to_unit: number;
  exit_emotion: string;
  entry_emotion: string;
  continuous: boolean;
}

export interface PersuasionFlowOutput {
  filePath: string;
  units: PersuasiveUnit[];
  checks: FlowCheck[];
  discontinuities: number;
  dreDrops: number;
  warningMessage: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field] as string;
  }
  return null;
}

export function isProductionFile(filePath: string): boolean {
  return /\/production\/.*\.md$/i.test(filePath);
}

export function normalizeEmotion(emotion: string): string {
  return emotion
    .toLowerCase()
    .trim()
    .replace(/[+,&]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/nível\s*\d/gi, "")
    .replace(/nivel\s*\d/gi, "")
    .trim();
}

export const COMPATIBLE_PAIRS: Record<string, string[]> = {
  medo: ["medo", "ansiedade", "desespero", "urgencia", "urgência"],
  curiosidade: ["curiosidade", "interesse", "engajamento", "atencao", "atenção"],
  esperanca: ["esperança", "esperanca", "crenca", "crença", "desejo", "confianca", "confiança"],
  raiva: ["raiva", "indignacao", "indignação", "frustração", "frustracao"],
  reconhecimento: ["reconhecimento", "medo", "vergonha", "identificacao", "identificação"],
  desejo: ["desejo", "urgencia", "urgência", "acao", "ação"],
  confianca: ["confianca", "confiança", "seguranca", "segurança", "desejo"],
  seguranca: ["seguranca", "segurança", "urgencia", "urgência", "acao", "ação"],
  crenca: ["crenca", "crença", "desejo", "confianca", "confiança"],
  frustracao: ["frustracao", "frustração", "raiva", "desespero", "esperanca", "esperança"],
  vergonha: ["vergonha", "medo", "desespero", "esperanca", "esperança"],
};

export function emotionsCompatible(exitEmotion: string, entryEmotion: string): boolean {
  const exitNorm = normalizeEmotion(exitEmotion);
  const entryNorm = normalizeEmotion(entryEmotion);

  if (exitNorm === entryNorm) return true;

  const exitWords = exitNorm.split(" ").filter((w) => w.length > 3);
  const entryWords = entryNorm.split(" ").filter((w) => w.length > 3);

  for (const word of exitWords) {
    if (entryWords.includes(word)) return true;
  }

  for (const exitWord of exitWords) {
    const compatible = COMPATIBLE_PAIRS[exitWord];
    if (compatible) {
      for (const entryWord of entryWords) {
        if (compatible.includes(entryWord)) return true;
      }
    }
  }

  return false;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

export function parseUnits(content: string): PersuasiveUnit[] {
  const units: PersuasiveUnit[] = [];
  const sectionRegex = /^##\s+(?:Unidade|Unit|Capitulo|Capítulo|Bloco|Section)\s+(\d+)\s*[:\-—]\s*(.+)/gim;
  const sections: { position: number; name: string; startIdx: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      position: parseInt(match[1], 10),
      name: match[2].trim(),
      startIdx: match.index,
    });
  }

  if (sections.length === 0) return units;

  for (let i = 0; i < sections.length; i++) {
    const startIdx = sections[i].startIdx;
    const endIdx = i < sections.length - 1 ? sections[i + 1].startIdx : content.length;
    const sectionContent = content.substring(startIdx, endIdx);

    const entryMatch = EMOTIONAL_ENTRY_REGEX.exec(sectionContent);
    const exitMatch = EMOTIONAL_EXIT_REGEX.exec(sectionContent);
    const dreMatch = DRE_LEVEL_REGEX.exec(sectionContent);

    if (entryMatch && exitMatch) {
      units.push({
        position: sections[i].position,
        name: sections[i].name,
        emotional_entry: entryMatch[1].trim(),
        emotional_exit: exitMatch[1].trim(),
        dre_level: dreMatch ? parseInt(dreMatch[1], 10) : 0,
      });
    }
  }

  return units;
}

export function parseFromFrontmatter(content: string): PersuasiveUnit[] {
  const fmMatch = FRONTMATTER_REGEX.exec(content);
  if (!fmMatch) return [];

  const fm = fmMatch[1];
  const units: PersuasiveUnit[] = [];

  const unitBlocks = fm.split(/^-\s+/m).filter((b) => b.trim());

  for (const block of unitBlocks) {
    const posMatch = /position\s*:\s*(\d+)/i.exec(block);
    const nameMatch = /unit_name\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const entryMatch = /emotional_entry\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const exitMatch = /emotional_exit\s*:\s*["']?(.+?)["']?\s*$/im.exec(block);
    const dreMatch = /dre_level\s*:\s*(\d)/i.exec(block);

    if (entryMatch && exitMatch) {
      units.push({
        position: posMatch ? parseInt(posMatch[1], 10) : units.length + 1,
        name: nameMatch ? nameMatch[1].trim() : `Unit ${units.length + 1}`,
        emotional_entry: entryMatch[1].trim(),
        emotional_exit: exitMatch[1].trim(),
        dre_level: dreMatch ? parseInt(dreMatch[1], 10) : 0,
      });
    }
  }

  return units;
}

// ─── Main exported function ───────────────────────────────────────────────────

export function runPersuasionFlowCheck(input: PersuasionFlowInput): PersuasionFlowOutput | null {
  const filePath = extractFilePath(input.tool_input);

  if (!filePath || !isProductionFile(filePath)) return null;
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, "utf-8");

  let units = parseUnits(content);
  if (units.length === 0) {
    units = parseFromFrontmatter(content);
  }

  if (units.length < 2) return null;

  units.sort((a, b) => a.position - b.position);

  const checks: FlowCheck[] = [];
  let discontinuities = 0;

  for (let i = 0; i < units.length - 1; i++) {
    const current = units[i];
    const next = units[i + 1];

    const continuous = emotionsCompatible(current.emotional_exit, next.emotional_entry);

    checks.push({
      from_unit: current.position,
      to_unit: next.position,
      exit_emotion: current.emotional_exit,
      entry_emotion: next.emotional_entry,
      continuous,
    });

    if (!continuous) discontinuities++;
  }

  let dreDrops = 0;
  for (let i = 0; i < units.length - 1; i++) {
    if (units[i + 1].dre_level > 0 && units[i].dre_level > 0) {
      if (units[i + 1].dre_level < units[i].dre_level - 1) {
        dreDrops++;
      }
    }
  }

  let warningMessage: string | null = null;
  if (discontinuities === 0 && dreDrops === 0) {
    warningMessage = `[FLOW-CHECK] ✅ Fluxo emocional contínuo — ${units.length} unidades, ${checks.length} transições OK`;
  } else {
    const lines: string[] = [];
    if (discontinuities > 0) {
      lines.push(`[FLOW-CHECK] ⚠️ ${discontinuities} ruptura(s) de fluxo emocional detectada(s):`);
      for (const check of checks) {
        if (!check.continuous) {
          lines.push(`  Unidade ${check.from_unit} → ${check.to_unit}: saída="${check.exit_emotion}" ≠ entrada="${check.entry_emotion}"`);
        }
      }
    }
    if (dreDrops > 0) {
      lines.push(`[FLOW-CHECK] ⚠️ ${dreDrops} queda(s) brusca(s) de DRE level detectada(s) — escalada deve ser progressiva`);
    }
    warningMessage = lines.join("\n");
  }

  return { filePath, units, checks, discontinuities, dreDrops, warningMessage };
}
