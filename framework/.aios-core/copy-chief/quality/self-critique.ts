/**
 * self-critique.ts — Copy Chief Quality Module
 * Part of AIOS Core: copy-chief/quality
 *
 * Analyzes copy CONTENT before saving to production/.
 * 5-point quick self-critique that catches issues BEFORE blind_critic.
 * Runs in <3s. Never blocks — warns via stderr.
 *
 * Checks:
 * 1. VOC Tokens presentes? (>= 3 keywords VOC)
 * 2. MUP/MUS mencionado? (mecanismo-unico.yaml elements)
 * 3. Clichês detectados? (banned words list)
 * 4. Especificidade mínima? (números, nomes, cenas)
 * 5. DRE escalada? (emoção dominante presente)
 *
 * Created: 2026-02-26 (AIOS Gap Closure v3)
 * Refactored: 2026-03-02 (AIOS Core module extraction)
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname, basename } from "path";

// ─── Constants ───────────────────────────────────────────────────────────────

export const BANNED_WORDS = [
  "revolucionário", "revolucionario", "inovador", "incrível", "inacreditável",
  "inacreditavel", "empoderar", "potencializar", "alavancar", "desbloquear",
  "transformação", "transformacao", "jornada",
];

export const HESITATION_WORDS = [
  "pode ser", "talvez", "possivelmente", "provavelmente", "quem sabe",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SelfCritiqueInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface CritiqueResult {
  check: string;
  passed: boolean;
  detail: string;
}

export interface SelfCritiqueOutput {
  filePath: string;
  fileName: string;
  results: CritiqueResult[];
  failures: CritiqueResult[];
  passCount: number;
  totalChecks: number;
  warningMessage: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function extractFilePath(toolInput: Record<string, unknown>): string | null {
  for (const field of ["file_path", "path", "filePath"]) {
    if (typeof toolInput[field] === "string") return toolInput[field] as string;
  }
  return null;
}

export function extractContent(toolInput: Record<string, unknown>): string {
  if (typeof toolInput.content === "string") return toolInput.content;
  if (typeof toolInput.new_string === "string") return toolInput.new_string;
  return "";
}

export function detectOfferPath(filePath: string): string {
  let dir = dirname(filePath);
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "CONTEXT.md")) || existsSync(join(dir, "mecanismo-unico.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "";
}

export function loadVocKeywords(offerPath: string): string[] {
  const vocPath = join(offerPath, "research", "voc", "summary.md");
  if (!existsSync(vocPath)) return [];

  try {
    const content = readFileSync(vocPath, "utf-8").toLowerCase();
    const stopwords = new Set([
      "para", "como", "mais", "está", "esta", "esse", "essa", "isso",
      "sobre", "pode", "quando", "onde", "qual", "quem", "porque",
      "muito", "mesmo", "ainda", "também", "todos", "todas", "outro",
      "cada", "entre", "após", "antes", "desde", "parte", "forma",
      "being", "with", "that", "this", "from", "have", "they",
    ]);

    const words = content.match(/\b[a-záàâãéêíóôõúüç]{4,}\b/g) || [];
    const freq: Record<string, number> = {};
    for (const w of words) {
      if (!stopwords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([w]) => w);
  } catch {
    return [];
  }
}

// ─── 5 Critique Checks ───────────────────────────────────────────────────────

export function check1_vocTokens(content: string, offerPath: string): CritiqueResult {
  const keywords = loadVocKeywords(offerPath);
  if (keywords.length === 0) {
    return { check: "VOC Tokens", passed: true, detail: "VOC não disponível (skip)" };
  }

  const contentLower = content.toLowerCase();
  const hits = keywords.filter(kw => contentLower.includes(kw));
  const passed = hits.length >= 3;

  return {
    check: "VOC Tokens",
    passed,
    detail: passed
      ? `${hits.length} keywords VOC encontradas`
      : `Apenas ${hits.length} keywords VOC (mín: 3). Reler research/voc/summary.md`,
  };
}

export function check2_mupMus(content: string, offerPath: string): CritiqueResult {
  const mecPath = join(offerPath, "mecanismo-unico.yaml");
  if (!existsSync(mecPath)) {
    return { check: "MUP/MUS", passed: true, detail: "mecanismo-unico.yaml não encontrado (skip)" };
  }

  try {
    const mec = readFileSync(mecPath, "utf-8");
    const contentLower = content.toLowerCase();

    const gimmickName = mec.match(/gimmick_name[:\s]+["']?([^\n"']+)/i)?.[1] || "";
    const sexyCause = mec.match(/sexy_cause[:\s]+["']?([^\n"']+)/i)?.[1] || "";

    const hasGimmick = gimmickName && contentLower.includes(gimmickName.toLowerCase().slice(0, 12));
    const hasCause = sexyCause && contentLower.includes(sexyCause.toLowerCase().slice(0, 12));
    const passed = hasGimmick || hasCause;

    const missing: string[] = [];
    if (!hasGimmick && gimmickName) missing.push(`Gimmick: "${gimmickName}"`);
    if (!hasCause && sexyCause) missing.push(`Sexy Cause: "${sexyCause}"`);

    return {
      check: "MUP/MUS",
      passed,
      detail: passed
        ? "Elementos do mecanismo presentes"
        : `Faltam: ${missing.join(", ")}`,
    };
  } catch {
    return { check: "MUP/MUS", passed: true, detail: "Erro ao ler mecanismo (skip)" };
  }
}

export function check3_cliches(content: string): CritiqueResult {
  const contentLower = content.toLowerCase();
  const found = BANNED_WORDS.filter(w => contentLower.includes(w));
  const hesitations = HESITATION_WORDS.filter(w => contentLower.includes(w));

  const allFound = [...found, ...hesitations];
  const passed = allFound.length === 0;

  return {
    check: "Clichês/Hesitação",
    passed,
    detail: passed
      ? "Zero clichês e hesitações"
      : `${allFound.length} detectado(s): ${allFound.slice(0, 5).join(", ")}`,
  };
}

export function check4_especificidade(content: string): CritiqueResult {
  let hits = 0;

  if (/\b\d{2}\s*anos\b/i.test(content)) hits++;
  if (/\b(Dona|Sr\.|Sra\.|Dr\.|Maria|João|José|Ana|Pedro)\b/.test(content)) hits++;
  if (/\b\d+[,.]\d+%?\b/.test(content)) hits++;
  if (/(acordou|3h|4h|madrugada|suando|tremendo|chorou)/i.test(content)) hits++;
  if (/(disse|falou|olhou|perguntou)/i.test(content)) hits++;

  const passed = hits >= 3;

  return {
    check: "Especificidade",
    passed,
    detail: passed
      ? `${hits}/5 elementos específicos`
      : `Apenas ${hits}/5 (mín: 3). Faltam dados concretos, nomes, cenas`,
  };
}

export function check5_dre(content: string): CritiqueResult {
  const patterns: Record<string, RegExp> = {
    medo: /medo|terror|pavor|assust|pânico|panico/gi,
    vergonha: /vergonha|humilha|constrang/gi,
    frustracao: /frustra|desespero|desist|cansad/gi,
    culpa: /culpa|negligên|falh(ei|ou)|arrepen/gi,
    raiva: /raiva|indigna|revolt|injusti/gi,
  };

  let maxCount = 0;
  let dominantEmotion = "";

  for (const [emotion, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern) || [];
    if (matches.length > maxCount) {
      maxCount = matches.length;
      dominantEmotion = emotion;
    }
  }

  const passed = maxCount >= 3;

  return {
    check: "DRE Presente",
    passed,
    detail: passed
      ? `DRE "${dominantEmotion}" com ${maxCount} menções`
      : `DRE fraca: "${dominantEmotion || "nenhuma"}" com ${maxCount} menções (mín: 3)`,
  };
}

// ─── Main exported function ───────────────────────────────────────────────────

export function runSelfCritique(input: SelfCritiqueInput): SelfCritiqueOutput | null {
  if (!["Write", "Edit"].includes(input.tool_name)) return null;

  const filePath = extractFilePath(input.tool_input);
  if (!filePath) return null;

  if (!/production\//i.test(filePath)) return null;
  if (!filePath.endsWith(".md")) return null;

  const content = extractContent(input.tool_input);
  if (content.length < 200) return null;

  const offerPath = detectOfferPath(filePath);

  const results: CritiqueResult[] = [
    check1_vocTokens(content, offerPath),
    check2_mupMus(content, offerPath),
    check3_cliches(content),
    check4_especificidade(content),
    check5_dre(content),
  ];

  const failures = results.filter(r => !r.passed);
  const passCount = results.length - failures.length;
  const fileName = basename(filePath);

  let warningMessage: string | null = null;
  if (failures.length > 0) {
    const header = `\n🔍 SELF-CRITIQUE: ${passCount}/5 checks passed para ${fileName}`;
    const details = failures.map(f => `  ⚠ ${f.check}: ${f.detail}`).join("\n");
    const footer = failures.length >= 3
      ? "  💡 Considere revisar antes de salvar (3+ falhas = copy frágil)"
      : "  💡 Issues menores — copy pode prosseguir";
    warningMessage = `${header}\n${details}\n${footer}\n`;
  }

  return {
    filePath,
    fileName,
    results,
    failures,
    passCount,
    totalChecks: results.length,
    warningMessage,
  };
}
