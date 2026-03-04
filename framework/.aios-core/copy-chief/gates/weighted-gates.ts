// ~/.claude/hooks/lib/weighted-gates.ts
// Weighted Quality Gate Scoring System — replaces binary pass/fail with nuanced scoring
// v1.0 - 2026-02-24

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ==========================================
// Constants
// ==========================================

const HOME = homedir();
const ECOSYSTEM_ROOT = join(HOME, 'copywriting-ecosystem');

// ==========================================
// Types
// ==========================================

export interface CriterionScore {
  name: string;
  weight: number;
  raw_score: number;       // 0-10
  weighted_score: number;  // raw * weight / 10
  details: string;
}

export interface GateScore {
  gate: 'research' | 'production';
  total_weighted: number;  // 0-100
  verdict: 'PASSED' | 'NEEDS_REVIEW' | 'FAILED';
  criteria: CriterionScore[];
}

// ==========================================
// Helpers
// ==========================================

function safeReadFile(filePath: string): string {
  try {
    if (!existsSync(filePath)) return '';
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function safeReadDir(dirPath: string): string[] {
  try {
    if (!existsSync(dirPath)) return [];
    return readdirSync(dirPath);
  } catch {
    return [];
  }
}

function resolveOfferPath(offerPath: string): string {
  // Accept both absolute and relative (to ecosystem root) paths
  if (offerPath.startsWith('/')) return offerPath;
  return join(ECOSYSTEM_ROOT, offerPath);
}

function computeVerdict(total: number): 'PASSED' | 'NEEDS_REVIEW' | 'FAILED' {
  if (total >= 85) return 'PASSED';
  if (total >= 70) return 'NEEDS_REVIEW';
  return 'FAILED';
}

/**
 * Minimal YAML field extractor — reads a key: value line from YAML content.
 * No npm deps. Handles simple scalar values only.
 */
function yamlFieldValue(content: string, field: string): string {
  const regex = new RegExp(`^\\s*${field}\\s*:\\s*(.+)$`, 'm');
  const match = content.match(regex);
  if (!match) return '';
  return match[1].trim().replace(/^["']|["']$/g, '');
}

/**
 * Count occurrences of a pattern in text.
 */
function countPattern(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Count words in text.
 */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Collect all .md file contents from a directory (non-recursive).
 */
function readAllMdFiles(dirPath: string): string {
  const files = safeReadDir(dirPath).filter(f => f.endsWith('.md'));
  return files.map(f => safeReadFile(join(dirPath, f))).join('\n');
}

/**
 * Collect all production file contents from standard production subdirectories.
 */
function readProductionFiles(offerPath: string): string {
  const productionDir = join(offerPath, 'production');
  if (!existsSync(productionDir)) return '';

  const subdirs = ['vsl', 'landing-page', 'creatives', 'emails'];
  let combined = '';
  for (const sub of subdirs) {
    const subPath = join(productionDir, sub);
    combined += readAllMdFiles(subPath) + '\n';
  }

  // Also check top-level production .md files
  combined += readAllMdFiles(productionDir);

  return combined;
}

// ==========================================
// RESEARCH GATE — 5 Criteria
// ==========================================

/**
 * Criterion 1: VOC Depth (30%)
 * Count quotes in research/voc/summary.md and research/voc/processed/*.md
 * Count platforms. Calculate average intensity.
 * 50+ quotes per platform = 10, 25-49 = 7, 10-24 = 5, <10 = 2
 */
function evaluateVocDepth(offerPath: string): CriterionScore {
  const vocDir = join(offerPath, 'research', 'voc');
  const summaryPath = join(vocDir, 'summary.md');
  const processedDir = join(vocDir, 'processed');

  let allContent = safeReadFile(summaryPath);
  allContent += '\n' + readAllMdFiles(processedDir);

  if (!allContent.trim()) {
    return {
      name: 'VOC Depth',
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: 'No VOC files found in research/voc/',
    };
  }

  // Count quotes — look for blockquote markers, numbered quote entries, or ">" lines with content
  const quotePatterns = [
    /^>\s*.+/gm,                          // Blockquote lines
    /[""].+?[""]/g,                        // Curly quoted text
    /(?:^|\n)\s*-\s*[""].+/gm,            // List items with quotes
    /Quote\s*[:]\s*.+/gi,                  // "Quote:" labeled entries
    /(?:^|\n)\s*\d+\.\s+[""].+/gm,        // Numbered quote entries
  ];

  // Deduplicate by using a set of matched lines
  const quoteLines = new Set<string>();
  for (const pattern of quotePatterns) {
    const matches = allContent.match(pattern);
    if (matches) {
      for (const m of matches) {
        quoteLines.add(m.trim().substring(0, 100)); // Normalize
      }
    }
  }
  const totalQuotes = quoteLines.size;

  // Count platforms mentioned
  const platformNames = ['youtube', 'instagram', 'tiktok', 'reddit', 'facebook', 'twitter', 'x.com', 'quora', 'amazon'];
  const platformsFound: string[] = [];
  const lowerContent = allContent.toLowerCase();
  for (const p of platformNames) {
    if (lowerContent.includes(p)) {
      platformsFound.push(p);
    }
  }
  const platformCount = Math.max(platformsFound.length, 1); // Avoid division by zero

  const quotesPerPlatform = Math.round(totalQuotes / platformCount);

  let rawScore: number;
  if (quotesPerPlatform >= 50) rawScore = 10;
  else if (quotesPerPlatform >= 25) rawScore = 7;
  else if (quotesPerPlatform >= 10) rawScore = 5;
  else rawScore = 2;

  // If no quotes at all, score is 0
  if (totalQuotes === 0) rawScore = 0;

  return {
    name: 'VOC Depth',
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `${totalQuotes} quotes across ${platformCount} platform(s) (${quotesPerPlatform}/platform). Platforms: ${platformsFound.join(', ') || 'none detected'}`,
  };
}

/**
 * Criterion 2: Competitor Analysis (25%)
 * Check ads-library-spy.md exists and has Scale Score data.
 * 5+ competitors with scores = 10, 3-4 = 7, 1-2 = 5, 0 = 0
 */
function evaluateCompetitorAnalysis(offerPath: string): CriterionScore {
  const adsSpyPath = join(offerPath, 'research', 'competitors', 'processed', 'ads-library-spy.md');
  const content = safeReadFile(adsSpyPath);

  if (!content) {
    return {
      name: 'Competitor Analysis',
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: 'No ads-library-spy.md found in research/competitors/processed/',
    };
  }

  // Count "Scale Score:" lines
  const scaleScoreMatches = content.match(/Scale\s*Score\s*[:]\s*\d+/gi);
  const competitorCount = scaleScoreMatches ? scaleScoreMatches.length : 0;

  let rawScore: number;
  if (competitorCount >= 5) rawScore = 10;
  else if (competitorCount >= 3) rawScore = 7;
  else if (competitorCount >= 1) rawScore = 5;
  else rawScore = 0;

  return {
    name: 'Competitor Analysis',
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `${competitorCount} competitor(s) with Scale Score in ads-library-spy.md`,
  };
}

/**
 * Criterion 3: Mechanism Discovery (20%)
 * Check mecanismo-unico.yaml exists and has MUP candidates.
 * Check new_cause, sexy_cause fields populated.
 * All populated = 10, partial = 5, empty = 0
 */
function evaluateMechanismDiscovery(offerPath: string): CriterionScore {
  const mecPath = join(offerPath, 'mecanismo-unico.yaml');
  const content = safeReadFile(mecPath);

  if (!content) {
    return {
      name: 'Mechanism Discovery',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'No mecanismo-unico.yaml found',
    };
  }

  const novaCausa = yamlFieldValue(content, 'new_cause');
  const sexyCause = yamlFieldValue(content, 'sexy_cause');

  const fieldsPopulated = [novaCausa, sexyCause].filter(v => v.length > 0).length;

  let rawScore: number;
  if (fieldsPopulated === 2) rawScore = 10;
  else if (fieldsPopulated === 1) rawScore = 5;
  else rawScore = 0;

  return {
    name: 'Mechanism Discovery',
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `mecanismo-unico.yaml: new_cause=${novaCausa ? 'YES' : 'EMPTY'}, sexy_cause=${sexyCause ? 'YES' : 'EMPTY'}`,
  };
}

/**
 * Criterion 4: Avatar Definition (20%)
 * Check research/avatar/summary.md exists and has DRE, escalada, segments.
 * All 3 = 10, 2 = 7, 1 = 4, 0 = 0
 */
function evaluateAvatarDefinition(offerPath: string): CriterionScore {
  const avatarPath = join(offerPath, 'research', 'avatar', 'summary.md');
  const content = safeReadFile(avatarPath);

  if (!content) {
    return {
      name: 'Avatar Definition',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'No research/avatar/summary.md found',
    };
  }

  const lowerContent = content.toLowerCase();
  const headingsFound: string[] = [];

  // Look for headings or sections about DRE, Escalada, Segments
  if (/##\s*dre|dre\s*[:]/i.test(content) || lowerContent.includes('emocao dominante') || lowerContent.includes('emoção dominante')) {
    headingsFound.push('DRE');
  }
  if (/##\s*escalada|escalada\s*emocional/i.test(content) || lowerContent.includes('escalada')) {
    headingsFound.push('Escalada');
  }
  if (/##\s*segment|segmentos|segments/i.test(content) || lowerContent.includes('segment')) {
    headingsFound.push('Segments');
  }

  const count = headingsFound.length;
  let rawScore: number;
  if (count >= 3) rawScore = 10;
  else if (count === 2) rawScore = 7;
  else if (count === 1) rawScore = 4;
  else rawScore = 0;

  return {
    name: 'Avatar Definition',
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `Sections found: ${headingsFound.join(', ') || 'none'} (${count}/3)`,
  };
}

/**
 * Criterion 5: Structure Compliance (5%)
 * Check all required directories exist.
 * All 4 = 10, 3 = 7, 2 = 5, <2 = 2
 */
function evaluateStructureCompliance(offerPath: string): CriterionScore {
  const requiredDirs = [
    join(offerPath, 'research', 'voc'),
    join(offerPath, 'research', 'competitors'),
    join(offerPath, 'research', 'mechanism'),
    join(offerPath, 'research', 'avatar'),
  ];

  const existingDirs: string[] = [];
  for (const dir of requiredDirs) {
    if (existsSync(dir)) {
      try {
        const stat = statSync(dir);
        if (stat.isDirectory()) {
          existingDirs.push(dir.split('/').pop()!);
        }
      } catch {
        // Skip
      }
    }
  }

  const count = existingDirs.length;
  let rawScore: number;
  if (count >= 4) rawScore = 10;
  else if (count === 3) rawScore = 7;
  else if (count === 2) rawScore = 5;
  else rawScore = 2;

  return {
    name: 'Structure Compliance',
    weight: 5,
    raw_score: rawScore,
    weighted_score: rawScore * 5 / 10,
    details: `${count}/4 required dirs exist: ${existingDirs.join(', ') || 'none'}`,
  };
}

// ==========================================
// PRODUCTION GATE — 5 Criteria
// ==========================================

/**
 * Criterion 1: Emotional Impact (30%)
 * Read latest blind_critic results from {offer}/reviews/ directory.
 * Parse score from files. Average score * 1 = raw score (0-10).
 */
function evaluateEmotionalImpact(offerPath: string): CriterionScore {
  const reviewsDir = join(offerPath, 'reviews');
  const files = safeReadDir(reviewsDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    return {
      name: 'Emotional Impact',
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: 'No review files found in reviews/',
    };
  }

  // Parse scores from review files — look for patterns like "Score: 8/10", "score: 7", "Rating: 9"
  const scores: number[] = [];
  for (const file of files) {
    const content = safeReadFile(join(reviewsDir, file));
    // Match various score formats
    const scorePatterns = [
      /(?:score|rating|nota|pontuacao)\s*[:=]\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/gi,
      /(\d+(?:\.\d+)?)\s*\/\s*10/g,
      /\*\*(\d+(?:\.\d+)?)\*\*\s*\/\s*10/g,
    ];
    for (const pattern of scorePatterns) {
      let match: RegExpExecArray | null;
      // Reset lastIndex for global regex
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const val = parseFloat(match[1]);
        if (val >= 0 && val <= 10) {
          scores.push(val);
        }
      }
    }
  }

  if (scores.length === 0) {
    return {
      name: 'Emotional Impact',
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: `Found ${files.length} review file(s) but no parseable scores`,
    };
  }

  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const rawScore = Math.min(10, Math.round(avgScore * 10) / 10);

  return {
    name: 'Emotional Impact',
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `Average score ${rawScore.toFixed(1)}/10 from ${scores.length} score(s) in ${files.length} review file(s)`,
  };
}

/**
 * Criterion 2: Specificity (25%)
 * Count data specificity markers in production files:
 * numbers (non-round), names, dates, locations, sensorial details.
 * 8+ per 1000 words = 10, 5-7 = 7, 2-4 = 4, <2 = 1
 */
function evaluateSpecificity(offerPath: string): CriterionScore {
  const productionContent = readProductionFiles(offerPath);

  if (!productionContent.trim()) {
    return {
      name: 'Specificity',
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: 'No production files found',
    };
  }

  const words = countWords(productionContent);
  if (words === 0) {
    return {
      name: 'Specificity',
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: 'Production files are empty',
    };
  }

  // Count specificity markers
  let markers = 0;

  // Non-round numbers (e.g., 87.3%, 2.847, 14, 23kg — NOT 10, 100, 1000, 50%)
  const nonRoundNumbers = productionContent.match(/\b\d+[.,]\d+\b/g); // Decimal numbers
  markers += nonRoundNumbers ? nonRoundNumbers.length : 0;

  // Numbers that are NOT round (not ending in 0, not powers of 10)
  const allNumbers = productionContent.match(/\b\d{2,}\b/g) || [];
  const nonRoundIntegers = allNumbers.filter(n => {
    const num = parseInt(n, 10);
    return num % 10 !== 0 && num !== 100 && num !== 1000;
  });
  markers += nonRoundIntegers.length;

  // Dates — various formats
  const dates = productionContent.match(/\b\d{1,2}\s+(?:de\s+)?(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\b/gi);
  markers += dates ? dates.length : 0;

  // Proper names (capitalized words in middle of sentences — heuristic)
  const properNames = productionContent.match(/(?<=[a-z]\s)[A-Z][a-zà-ú]{2,}/g);
  markers += properNames ? Math.min(properNames.length, 20) : 0; // Cap to avoid inflated counts

  // Location markers (cidade, bairro, rua patterns)
  const locations = productionContent.match(/(?:de|em|no|na)\s+[A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)*/g);
  markers += locations ? Math.min(locations.length, 15) : 0;

  // Sensorial details — time-of-day, body parts, sensations
  const sensorialPatterns = [
    /\b(?:3h|2h|4h|5h|meia-noite|madrugada|amanhecer)\b/gi,
    /\b(?:suando|tremendo|acordou|olhou|sentiu|ouviu|viu|tocou)\b/gi,
    /\b(?:peito|barriga|cabeça|cabeca|costas|joelho|mão|mao|olho|boca)\b/gi,
  ];
  for (const pattern of sensorialPatterns) {
    const matches = productionContent.match(pattern);
    markers += matches ? matches.length : 0;
  }

  const densityPer1000 = (markers / words) * 1000;

  let rawScore: number;
  if (densityPer1000 >= 8) rawScore = 10;
  else if (densityPer1000 >= 5) rawScore = 7;
  else if (densityPer1000 >= 2) rawScore = 4;
  else rawScore = 1;

  return {
    name: 'Specificity',
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `${markers} markers in ${words} words (${densityPer1000.toFixed(1)}/1000 words)`,
  };
}

/**
 * Criterion 3: MUP/MUS Alignment (20%)
 * Check if production files reference the mecanismo terms from mecanismo-unico.yaml.
 * Count references to gimmick_name, sexy_cause, authority_hook.
 * All 3 referenced = 10, 2 = 7, 1 = 4, 0 = 0
 */
function evaluateMupMusAlignment(offerPath: string): CriterionScore {
  const mecPath = join(offerPath, 'mecanismo-unico.yaml');
  const mecContent = safeReadFile(mecPath);

  if (!mecContent) {
    return {
      name: 'MUP/MUS Alignment',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'No mecanismo-unico.yaml found — cannot check alignment',
    };
  }

  const productionContent = readProductionFiles(offerPath);

  if (!productionContent.trim()) {
    return {
      name: 'MUP/MUS Alignment',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'No production files found to check alignment',
    };
  }

  // Extract key terms from mecanismo YAML
  const gimmickName = yamlFieldValue(mecContent, 'gimmick_name');
  const sexyCause = yamlFieldValue(mecContent, 'sexy_cause');
  const authorityHook = yamlFieldValue(mecContent, 'authority_hook');

  const lowerProd = productionContent.toLowerCase();
  const found: string[] = [];

  if (gimmickName && lowerProd.includes(gimmickName.toLowerCase())) {
    found.push(`gimmick_name ("${gimmickName}")`);
  }
  if (sexyCause && lowerProd.includes(sexyCause.toLowerCase())) {
    found.push(`sexy_cause ("${sexyCause}")`);
  }
  if (authorityHook && lowerProd.includes(authorityHook.toLowerCase())) {
    found.push(`authority_hook ("${authorityHook}")`);
  }

  const count = found.length;
  let rawScore: number;
  if (count >= 3) rawScore = 10;
  else if (count === 2) rawScore = 7;
  else if (count === 1) rawScore = 4;
  else rawScore = 0;

  const missing: string[] = [];
  if (gimmickName && !found.some(f => f.startsWith('gimmick'))) missing.push('gimmick_name');
  if (sexyCause && !found.some(f => f.startsWith('sexy'))) missing.push('sexy_cause');
  if (authorityHook && !found.some(f => f.startsWith('authority'))) missing.push('authority_hook');

  return {
    name: 'MUP/MUS Alignment',
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `Found: ${found.join(', ') || 'none'}. Missing: ${missing.join(', ') || 'none'}`,
  };
}

/**
 * Criterion 4: Anti-Homogeneization (20%)
 * Check production files against cliche list.
 * 0 cliches = 10, 1-2 = 7, 3-5 = 4, 6+ = 1
 */
function evaluateAntiHomogeneization(offerPath: string): CriterionScore {
  const productionContent = readProductionFiles(offerPath);

  if (!productionContent.trim()) {
    return {
      name: 'Anti-Homogeneization',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'No production files found',
    };
  }

  // Top 20 DR (direct response) cliches — cross-niche
  const cliches: RegExp[] = [
    /\bmétodo\s+infalível\b/gi,
    /\bmetodo\s+infalivel\b/gi,
    /\bsegredo\s+d[oae]s?\b/gi,
    /\btransformação\b/gi,
    /\btransformacao\b/gi,
    /\bfinalmente[\s,]/gi,
    /\bimagine\s/gi,
    /\brevolucion[aá]ri[oa]\b/gi,
    /\bincrível\b/gi,
    /\bincrivel\b/gi,
    /\bliberdade\s+financeira\b/gi,
    /\bcorpo\s+dos\s+sonhos\b/gi,
    /\bsem\s+(?:dieta|esforço|esforco)\b/gi,
    /\bmetabolismo\s+acelerado\b/gi,
    /\bconexão\s+profunda\b/gi,
    /\bconexao\s+profunda\b/gi,
    /\batracao\s+irresist[ií]vel\b/gi,
    /\brenda\s+extra\b/gi,
    /\bdesbloqu(?:ear|eie)\b/gi,
    /\bempoder[ae]/gi,
  ];

  const found: string[] = [];
  for (const cliche of cliches) {
    const matches = productionContent.match(cliche);
    if (matches && matches.length > 0) {
      found.push(`"${matches[0]}" (x${matches.length})`);
    }
  }

  const totalCliches = found.length;
  let rawScore: number;
  if (totalCliches === 0) rawScore = 10;
  else if (totalCliches <= 2) rawScore = 7;
  else if (totalCliches <= 5) rawScore = 4;
  else rawScore = 1;

  return {
    name: 'Anti-Homogeneization',
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: totalCliches === 0
      ? '0 cliches detected — clean'
      : `${totalCliches} cliche(s) detected: ${found.join(', ')}`,
  };
}

/**
 * Criterion 5: Formatting (5%)
 * Check template header exists in production files ("> **Template usado:**").
 * Present = 10, absent = 0
 */
function evaluateFormatting(offerPath: string): CriterionScore {
  const productionContent = readProductionFiles(offerPath);

  if (!productionContent.trim()) {
    return {
      name: 'Formatting',
      weight: 5,
      raw_score: 0,
      weighted_score: 0,
      details: 'No production files found',
    };
  }

  const hasTemplateHeader = />\s*\*\*Template\s+usado\s*:\*\*/i.test(productionContent);

  const rawScore = hasTemplateHeader ? 10 : 0;

  return {
    name: 'Formatting',
    weight: 5,
    raw_score: rawScore,
    weighted_score: rawScore * 5 / 10,
    details: hasTemplateHeader
      ? 'Template header present in production files'
      : 'Missing "> **Template usado:**" header in production files',
  };
}

// ==========================================
// BRIEFING GATE — 5 Criteria
// ==========================================

/**
 * Criterion 1: HELIX Completeness (30%)
 * Check helix-state.yaml for phases_completed count (10 phases = 100%)
 */
async function evaluateHelixCompleteness(offerPath: string): Promise<CriterionScore> {
  const helixPath = join(offerPath, 'helix-state.yaml');
  const content = safeReadFile(helixPath);

  if (!content) {
    return {
      name: 'HELIX Completeness',
      weight: 30,
      raw_score: 0,
      weighted_score: 0,
      details: 'helix-state.yaml not found',
    };
  }

  // Count completed phases from helix_phases section
  let phasesCompleted = 0;

  // Try to read phases_completed from gates.briefing.phases_completed
  const briefingPhasesMatch = content.match(/phases_completed\s*:\s*(\d+)/);
  if (briefingPhasesMatch) {
    phasesCompleted = parseInt(briefingPhasesMatch[1], 10);
  } else {
    // Count helix_phases with status: completed
    const completedMatches = content.match(/status:\s*completed/g);
    phasesCompleted = completedMatches ? completedMatches.length : 0;
  }

  const totalPhases = 10;
  const completionPct = Math.min(100, (phasesCompleted / totalPhases) * 100);

  let rawScore: number;
  if (phasesCompleted >= 10) rawScore = 10;
  else if (phasesCompleted >= 8) rawScore = 8;
  else if (phasesCompleted >= 6) rawScore = 6;
  else if (phasesCompleted >= 4) rawScore = 4;
  else if (phasesCompleted >= 2) rawScore = 2;
  else rawScore = 0;

  return {
    name: 'HELIX Completeness',
    weight: 30,
    raw_score: rawScore,
    weighted_score: rawScore * 30 / 10,
    details: `${phasesCompleted}/${totalPhases} phases completed (${completionPct.toFixed(0)}%)`,
  };
}

/**
 * Criterion 2: MUP Quality (25%)
 * Check mecanismo-unico.yaml: state, blind_critic_mup score
 */
async function evaluateMupQuality(offerPath: string): Promise<CriterionScore> {
  const mecPath = join(offerPath, 'mecanismo-unico.yaml');
  const content = safeReadFile(mecPath);

  if (!content) {
    return {
      name: 'MUP Quality',
      weight: 25,
      raw_score: 0,
      weighted_score: 0,
      details: 'mecanismo-unico.yaml not found',
    };
  }

  // Read blind_critic_mup score from mecanismo-unico.yaml or helix-state.yaml
  let blindCriticScore = 0;
  const mecScoreMatch = content.match(/blind_critic_mup\s*:\s*([\d.]+)/);
  if (mecScoreMatch) {
    blindCriticScore = parseFloat(mecScoreMatch[1]);
  } else {
    // Try helix-state.yaml
    const helixContent = safeReadFile(join(offerPath, 'helix-state.yaml'));
    const helixScoreMatch = helixContent.match(/blind_critic_mup[_\s]*score\s*:\s*([\d.]+)/);
    if (helixScoreMatch) {
      blindCriticScore = parseFloat(helixScoreMatch[1]);
    }
  }

  // Check state field (top-level)
  const stateMatch = content.match(/^state\s*:\s*["']?(\w+)["']?/m);
  const mecState = stateMatch ? stateMatch[1].toUpperCase() : 'UNKNOWN';

  // Check MUP fields are populated
  const hasMupNewCause = /new_cause\s*:/.test(content) && content.match(/new_cause\s*:\s*["']?.{10,}/)?.[0] !== undefined;
  const hasMupParadigmShift = /paradigm_shift\s*:/.test(content) && content.match(/paradigm_shift\s*:\s*["']?.{10,}/)?.[0] !== undefined;

  // Score: base from blind_critic (60%) + state bonus (20%) + fields (20%)
  let rawScore = 0;

  // blind_critic score contribution (0-6 raw)
  if (blindCriticScore >= 9) rawScore += 6;
  else if (blindCriticScore >= 8) rawScore += 5;
  else if (blindCriticScore >= 7) rawScore += 4;
  else if (blindCriticScore >= 6) rawScore += 3;
  else if (blindCriticScore > 0) rawScore += 1;

  // State bonus (0-2 raw)
  if (mecState === 'APPROVED') rawScore += 2;
  else if (mecState === 'VALIDATED') rawScore += 1.5;
  else if (mecState === 'DRAFT') rawScore += 0.5;

  // Fields present (0-2 raw)
  if (hasMupNewCause) rawScore += 1;
  if (hasMupParadigmShift) rawScore += 1;

  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);

  return {
    name: 'MUP Quality',
    weight: 25,
    raw_score: rawScore,
    weighted_score: rawScore * 25 / 10,
    details: `State: ${mecState}, blind_critic_mup: ${blindCriticScore || 'N/A'}, new_cause: ${hasMupNewCause ? 'YES' : 'NO'}, paradigm_shift: ${hasMupParadigmShift ? 'YES' : 'NO'}`,
  };
}

/**
 * Criterion 3: MUS Quality (20%)
 * Check mecanismo-unico.yaml: mus fields present, blind_critic_mus score
 */
async function evaluateMusQuality(offerPath: string): Promise<CriterionScore> {
  const mecPath = join(offerPath, 'mecanismo-unico.yaml');
  const content = safeReadFile(mecPath);

  if (!content) {
    return {
      name: 'MUS Quality',
      weight: 20,
      raw_score: 0,
      weighted_score: 0,
      details: 'mecanismo-unico.yaml not found',
    };
  }

  // Read blind_critic_mus score
  let blindCriticScore = 0;
  const mecScoreMatch = content.match(/blind_critic_mus\s*:\s*([\d.]+)/);
  if (mecScoreMatch) {
    blindCriticScore = parseFloat(mecScoreMatch[1]);
  } else {
    const helixContent = safeReadFile(join(offerPath, 'helix-state.yaml'));
    const helixScoreMatch = helixContent.match(/blind_critic_mus[_\s]*score\s*:\s*([\d.]+)/);
    if (helixScoreMatch) {
      blindCriticScore = parseFloat(helixScoreMatch[1]);
    }
  }

  // Check MUS section fields
  const musSection = content.match(/mus:([\s\S]*?)(?=\n\w|\n  \w{2,}:(?!\s+-)|\n---|\Z)/)?.[1] || '';
  const hasHeroIngredient = /hero_ingredient\s*:/.test(content) && content.match(/hero_ingredient[\s\S]{5,}/)?.[0] !== undefined;
  const hasGimmickName = /gimmick_name\s*:/.test(content);
  const hasNewOpportunity = /new_opportunity\s*:/.test(content) && content.match(/new_opportunity\s*:\s*.{5,}/)?.[0] !== undefined;

  let rawScore = 0;

  // blind_critic score contribution (0-6 raw)
  if (blindCriticScore >= 9) rawScore += 6;
  else if (blindCriticScore >= 8) rawScore += 5;
  else if (blindCriticScore >= 7) rawScore += 4;
  else if (blindCriticScore >= 6) rawScore += 3;
  else if (blindCriticScore > 0) rawScore += 1;

  // Fields present (0-4 raw)
  if (hasHeroIngredient) rawScore += 1.5;
  if (hasGimmickName) rawScore += 1.5;
  if (hasNewOpportunity) rawScore += 1;

  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);

  return {
    name: 'MUS Quality',
    weight: 20,
    raw_score: rawScore,
    weighted_score: rawScore * 20 / 10,
    details: `blind_critic_mus: ${blindCriticScore || 'N/A'}, hero_ingredient: ${hasHeroIngredient ? 'YES' : 'NO'}, gimmick_name: ${hasGimmickName ? 'YES' : 'NO'}, new_opportunity: ${hasNewOpportunity ? 'YES' : 'NO'}`,
  };
}

/**
 * Criterion 4: VOC Alignment (15%)
 * Check research/synthesis.md exists and has meaningful content
 */
async function evaluateVocAlignment(offerPath: string): Promise<CriterionScore> {
  const synthesisPath = join(offerPath, 'research', 'synthesis.md');
  const content = safeReadFile(synthesisPath);

  if (!content || !content.trim()) {
    return {
      name: 'VOC Alignment',
      weight: 15,
      raw_score: 0,
      weighted_score: 0,
      details: 'research/synthesis.md not found or empty',
    };
  }

  const wordCount = countWords(content);
  const lowerContent = content.toLowerCase();

  // Check for key sections indicating quality VOC synthesis
  const hasDRE = /dre|emocao dominante|emoção dominante|dominant emotion/i.test(content);
  const hasAvatar = /avatar|persona|perfil do/i.test(content);
  const hasQuotes = (/[""].{10,}[""]/.test(content)) || (/^>\s*.{10,}/m.test(content));
  const hasInsights = /insight|descoberta|finding/i.test(content);
  const hasConfidence = /confidence|confianca|confiança/i.test(content);

  const sectionsFound = [hasDRE, hasAvatar, hasQuotes, hasInsights, hasConfidence].filter(Boolean).length;

  let rawScore = 0;

  // Word count contribution (0-4)
  if (wordCount >= 2000) rawScore += 4;
  else if (wordCount >= 1000) rawScore += 3;
  else if (wordCount >= 500) rawScore += 2;
  else if (wordCount >= 100) rawScore += 1;

  // Sections found contribution (0-6, 1.2 per section)
  rawScore += sectionsFound * 1.2;

  rawScore = Math.min(10, Math.round(rawScore * 10) / 10);

  return {
    name: 'VOC Alignment',
    weight: 15,
    raw_score: rawScore,
    weighted_score: rawScore * 15 / 10,
    details: `synthesis.md: ${wordCount} words, ${sectionsFound}/5 key sections present. Sections: DRE=${hasDRE}, Avatar=${hasAvatar}, Quotes=${hasQuotes}, Insights=${hasInsights}, Confidence=${hasConfidence}`,
  };
}

/**
 * Criterion 5: Mecanismo State (10%)
 * Check mecanismo-unico.yaml state field
 * APPROVED=100, VALIDATED=80, DRAFT=40
 */
async function evaluateMecanismoState(offerPath: string): Promise<CriterionScore> {
  const mecPath = join(offerPath, 'mecanismo-unico.yaml');
  const content = safeReadFile(mecPath);

  if (!content) {
    return {
      name: 'Mecanismo State',
      weight: 10,
      raw_score: 0,
      weighted_score: 0,
      details: 'mecanismo-unico.yaml not found',
    };
  }

  const stateMatch = content.match(/^state\s*:\s*["']?(\w+)["']?/m);
  const mecState = stateMatch ? stateMatch[1].toUpperCase() : 'UNKNOWN';

  let rawScore: number;
  let pct: number;

  if (mecState === 'APPROVED') { rawScore = 10; pct = 100; }
  else if (mecState === 'VALIDATED') { rawScore = 8; pct = 80; }
  else if (mecState === 'DRAFT') { rawScore = 4; pct = 40; }
  else { rawScore = 0; pct = 0; }

  return {
    name: 'Mecanismo State',
    weight: 10,
    raw_score: rawScore,
    weighted_score: rawScore * 10 / 10,
    details: `State: ${mecState} (${pct}%)`,
  };
}

// ==========================================
// Public API
// ==========================================

/**
 * Evaluate Briefing Gate with weighted scoring.
 * @param offerRelativePath - Relative path to offer (e.g. "saude/florayla") or absolute path
 * Criteria:
 *   1. HELIX Completeness 30%
 *   2. MUP Quality 25%
 *   3. MUS Quality 20%
 *   4. VOC Alignment 15%
 *   5. Mecanismo State 10%
 * Verdict: >=75 PASSED, 50-74 NEEDS_REVIEW, <50 FAILED
 */
export async function evaluateBriefingGate(offerRelativePath: string): Promise<{
  total_weighted: number;
  verdict: 'PASSED' | 'NEEDS_REVIEW' | 'FAILED';
  criteria: CriterionScore[];
}> {
  const resolved = resolveOfferPath(offerRelativePath);

  const criteria: CriterionScore[] = await Promise.all([
    evaluateHelixCompleteness(resolved),
    evaluateMupQuality(resolved),
    evaluateMusQuality(resolved),
    evaluateVocAlignment(resolved),
    evaluateMecanismoState(resolved),
  ]);

  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);
  const total = Math.round(totalWeighted * 10) / 10;

  let verdict: 'PASSED' | 'NEEDS_REVIEW' | 'FAILED';
  if (total >= 75) verdict = 'PASSED';
  else if (total >= 50) verdict = 'NEEDS_REVIEW';
  else verdict = 'FAILED';

  return { total_weighted: total, verdict, criteria };
}

/**
 * Evaluate Research Gate with weighted scoring.
 * @param offerPath - Path to offer directory (absolute or relative to ecosystem root)
 */
export function evaluateResearchGate(offerPath: string): GateScore {
  const resolved = resolveOfferPath(offerPath);

  const criteria: CriterionScore[] = [
    evaluateVocDepth(resolved),
    evaluateCompetitorAnalysis(resolved),
    evaluateMechanismDiscovery(resolved),
    evaluateAvatarDefinition(resolved),
    evaluateStructureCompliance(resolved),
  ];

  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);

  return {
    gate: 'research',
    total_weighted: Math.round(totalWeighted * 10) / 10,
    verdict: computeVerdict(totalWeighted),
    criteria,
  };
}

/**
 * Evaluate Production Gate with weighted scoring.
 * @param offerPath - Path to offer directory (absolute or relative to ecosystem root)
 */
export function evaluateProductionGate(offerPath: string): GateScore {
  const resolved = resolveOfferPath(offerPath);

  const criteria: CriterionScore[] = [
    evaluateEmotionalImpact(resolved),
    evaluateSpecificity(resolved),
    evaluateMupMusAlignment(resolved),
    evaluateAntiHomogeneization(resolved),
    evaluateFormatting(resolved),
  ];

  const totalWeighted = criteria.reduce((sum, c) => sum + c.weighted_score, 0);

  return {
    gate: 'production',
    total_weighted: Math.round(totalWeighted * 10) / 10,
    verdict: computeVerdict(totalWeighted),
    criteria,
  };
}

/**
 * Format a GateScore into a readable report string.
 */
export function formatGateReport(score: GateScore): string {
  const divider = '═'.repeat(60);
  const thinDivider = '─'.repeat(60);

  const verdictEmoji = score.verdict === 'PASSED'
    ? 'PASSED'
    : score.verdict === 'NEEDS_REVIEW'
      ? 'NEEDS REVIEW'
      : 'FAILED';

  const lines: string[] = [
    divider,
    `  WEIGHTED ${score.gate.toUpperCase()} GATE — ${verdictEmoji}`,
    `  Total Score: ${score.total_weighted.toFixed(1)} / 100`,
    divider,
    '',
  ];

  for (const c of score.criteria) {
    const bar = '█'.repeat(Math.round(c.raw_score)) + '░'.repeat(10 - Math.round(c.raw_score));
    lines.push(`  ${c.name} (${c.weight}%)`);
    lines.push(`    Raw: ${c.raw_score}/10  |  Weighted: ${c.weighted_score.toFixed(1)}/${c.weight}`);
    lines.push(`    ${bar}`);
    lines.push(`    ${c.details}`);
    lines.push('');
  }

  lines.push(thinDivider);
  lines.push(`  Verdict: ${score.verdict} (>=85 PASSED | 70-84 NEEDS_REVIEW | <70 FAILED)`);
  lines.push(thinDivider);

  return lines.join('\n');
}
