// ~/.claude/hooks/lib/production-gates.ts
// FASE 1: Gate Enforcement para Produção "Nível Jarvis"
// v1.0 (2026-01-30)
//
// Bloqueia escrita em production/ sem research+briefing completos.
// Verifica deliverables obrigatórios por tipo de oferta.

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { evaluateBriefingGate } from './weighted-gates';

// ============================================
// INTERFACES
// ============================================

export interface GateCheckResult {
  passed: boolean;
  gate: 'RESEARCH' | 'BRIEFING' | 'ANTI_HOMOG' | 'NONE';
  issues: string[];
  suggestions: string[];
  confidence?: number;
}

export interface OfferContext {
  offerPath: string;
  offerName: string;
  nicheName: string;
  hasResearch: boolean;
  hasBriefing: boolean;
  hasProduction: boolean;
  deliverables: DeliverableStatus;
}

export interface DeliverableStatus {
  // Research
  synthesisExists: boolean;
  synthesisConfidence: number;
  vocSummary: boolean;
  vocTrends: boolean;
  competitorsSummary: boolean;
  adsLibrarySpy: boolean;
  mechanismSummary: boolean;
  avatarSummary: boolean;

  // Briefing
  phasesComplete: number;
  totalPhases: number;
  mupDefined: boolean;
  musDefined: boolean;
}

// ============================================
// CONSTANTS
// ============================================

// Deliverables OBRIGATÓRIOS para Research Gate
const RESEARCH_DELIVERABLES = {
  core: [
    { path: 'research/synthesis.md', name: 'Synthesis' },
  ],
  voc: [
    { path: 'research/voc/summary.md', name: 'VOC Summary' },
    { path: 'research/voc/trends-analysis.md', name: 'VOC Trends' },
  ],
  competitors: [
    { path: 'research/competitors/summary.md', name: 'Competitors Summary' },
    { path: 'research/competitors/processed/ads-library-spy.md', name: 'Ads Library Spy' },
  ],
  mechanism: [
    { path: 'research/mechanism/summary.md', name: 'Mechanism Summary' },
  ],
  avatar: [
    { path: 'research/avatar/summary.md', name: 'Avatar Summary' },
  ],
};

// Número mínimo de fases HELIX para Briefing Gate
const MIN_HELIX_PHASES = 6;
const TOTAL_HELIX_PHASES = 10;

// Patterns de arquivos de produção
const PRODUCTION_PATTERNS = [
  /\/production\//i,
  /\/vsl\//i,
  /\/landing-page\//i,
  /\/creatives\//i,
  /\/emails\//i,
  /criativo.*\.md$/i,
  /headline.*\.md$/i,
  /script.*\.md$/i,
  /vsl.*\.md$/i,
];

// Clichês por nicho para Anti-Homogeneização
export const CLICHES_BY_NICHE: Record<string, string[]> = {
  concursos: [
    'método infalível', 'passe em menos tempo', 'decoreba não funciona',
    'estudar de forma inteligente', 'concurseiro aprovado', 'método dos aprovados',
    'segredo dos aprovados', 'fórmula da aprovação', 'estudar menos e aprender mais'
  ],
  saude: [
    'emagreça sem dieta', 'queimar gordura', 'metabolismo acelerado',
    'segredo dos magros', 'corpo dos sonhos', 'transformação',
    'revolucionário', 'milagroso', 'método natural'
  ],
  relacionamento: [
    'recuperar casamento', 'comunicação eficaz', 'conexão profunda',
    'segredo das mulheres', 'atração irresistível', 'conquistar qualquer pessoa'
  ],
  riqueza: [
    'renda extra', 'liberdade financeira', 'método comprovado',
    'trabalhar de casa', 'sem experiência', 'dinheiro fácil'
  ],
};

// Palavras banidas globais (cross-nicho)
export const BANNED_WORDS = [
  'revolucionário', 'inovador', 'incrível', 'inacreditável',
  'empoderar', 'potencializar', 'alavancar', 'desbloquear',
  'jornada', 'caminho', 'segredo', 'milagre'
];

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Detecta se o arquivo de destino é de produção
 */
export function isProductionFile(filePath: string): boolean {
  return PRODUCTION_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Extrai contexto da oferta a partir do path do arquivo
 */
export function getOfferContext(filePath: string): OfferContext | null {
  // Padrão: ~/copywriting-ecosystem/{nicho}/{oferta}/...
  const match = filePath.match(/copywriting-ecosystem\/([^\/]+)\/([^\/]+)\//);

  if (!match) return null;

  const [, nicheName, offerName] = match;
  const ecosystemRoot = filePath.match(/(.*?copywriting-ecosystem)/)?.[1];

  if (!ecosystemRoot) return null;

  const offerPath = join(ecosystemRoot, nicheName, offerName);

  // Verificar existência de diretórios
  const hasResearch = existsSync(join(offerPath, 'research'));
  const hasBriefing = existsSync(join(offerPath, 'briefings'));
  const hasProduction = existsSync(join(offerPath, 'production'));

  // Coletar status dos deliverables
  const deliverables = collectDeliverableStatus(offerPath);

  return {
    offerPath,
    offerName,
    nicheName,
    hasResearch,
    hasBriefing,
    hasProduction,
    deliverables,
  };
}

/**
 * Coleta status de todos os deliverables da oferta
 */
function collectDeliverableStatus(offerPath: string): DeliverableStatus {
  const status: DeliverableStatus = {
    synthesisExists: false,
    synthesisConfidence: 0,
    vocSummary: false,
    vocTrends: false,
    competitorsSummary: false,
    adsLibrarySpy: false,
    mechanismSummary: false,
    avatarSummary: false,
    phasesComplete: 0,
    totalPhases: TOTAL_HELIX_PHASES,
    mupDefined: false,
    musDefined: false,
  };

  // Research deliverables
  const synthesisPath = join(offerPath, 'research/synthesis.md');
  if (existsSync(synthesisPath)) {
    status.synthesisExists = true;
    status.synthesisConfidence = extractConfidence(synthesisPath);
  }

  status.vocSummary = existsSync(join(offerPath, 'research/voc/summary.md'));
  status.vocTrends = existsSync(join(offerPath, 'research/voc/trends-analysis.md'));
  status.competitorsSummary = existsSync(join(offerPath, 'research/competitors/summary.md'));
  status.adsLibrarySpy = existsSync(join(offerPath, 'research/competitors/processed/ads-library-spy.md'));
  status.mechanismSummary = existsSync(join(offerPath, 'research/mechanism/summary.md'));
  status.avatarSummary = existsSync(join(offerPath, 'research/avatar/summary.md'));

  // Briefing phases
  const phasesDir = join(offerPath, 'briefings/phases');
  if (existsSync(phasesDir)) {
    try {
      // Suporta "fase01", "fase-01", "phase-01" (padrões do ecossistema)
      const phases = readdirSync(phasesDir).filter(f =>
        /^(fase|phase)-?0?\d+.*\.md$/i.test(f) &&
        statSync(join(phasesDir, f)).isFile()
      );
      status.phasesComplete = phases.length;

      // Verificar MUP (Fase 05) e MUS (Fase 06)
      // Suporta múltiplos padrões de naming
      status.mupDefined = phases.some(p => /(fase|phase)-?0?5/i.test(p));
      status.musDefined = phases.some(p => /(fase|phase)-?0?6/i.test(p));
    } catch {
      // Ignore errors
    }
  }

  return status;
}

/**
 * Extrai confidence do synthesis.md
 * Suporta múltiplos formatos:
 * - "confidence: 85%"
 * - "Confidence Score: 0.85"
 * - "**Confidence Média:** 87%"
 * - "Confidence: 85%"
 */
function extractConfidence(synthesisPath: string): number {
  try {
    const content = readFileSync(synthesisPath, 'utf-8');

    // Padrão 1: **Confidence Média:** 87% (formato atual do ecossistema)
    const pattern1 = content.match(/\*\*Confidence[^*]*\*\*[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern1) {
      const value = parseFloat(pattern1[1]);
      return value > 1 ? value : value * 100;
    }

    // Padrão 2: confidence: 85% ou Confidence Score: 0.85
    const pattern2 = content.match(/confidence[^:]*[:\s]+(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern2) {
      const value = parseFloat(pattern2[1]);
      return value > 1 ? value : value * 100;
    }

    // Padrão 3: MÉDIA ou Média seguido de número
    const pattern3 = content.match(/m[ée]dia[:\s]*(\d+(?:\.\d+)?)\s*%?/i);
    if (pattern3) {
      const value = parseFloat(pattern3[1]);
      return value > 1 ? value : value * 100;
    }

  } catch {
    // Ignore errors
  }
  return 0;
}

// ============================================
// GATE CHECKS
// ============================================

/**
 * Verifica Research Gate
 */
export function checkResearchGate(context: OfferContext): GateCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const d = context.deliverables;

  // Core: synthesis obrigatório
  if (!d.synthesisExists) {
    issues.push('synthesis.md não existe');
    suggestions.push('Rode audience-research-agent para criar research completa');
  } else if (d.synthesisConfidence < 70) {
    issues.push(`synthesis.md com confidence ${d.synthesisConfidence}% (mínimo: 70%)`);
    suggestions.push('Complete módulos de research faltantes para aumentar confidence');
  }

  // VOC
  if (!d.vocSummary) {
    issues.push('VOC summary.md não existe');
    suggestions.push('Execute voc-research-agent para extração de VOC');
  }
  if (!d.vocTrends) {
    issues.push('VOC trends-analysis.md não existe');
    suggestions.push('Gere análise de tendências após extração VOC');
  }

  // Competitors
  if (!d.competitorsSummary) {
    issues.push('Competitors summary.md não existe');
  }
  if (!d.adsLibrarySpy) {
    issues.push('ads-library-spy.md não existe');
    suggestions.push('Use fb_ad_library MCP para análise de concorrentes');
  }

  // Mechanism
  if (!d.mechanismSummary) {
    issues.push('Mechanism summary.md não existe');
    suggestions.push('Pesquise mecanismo científico para a oferta');
  }

  // Avatar
  if (!d.avatarSummary) {
    issues.push('Avatar summary.md não existe');
    suggestions.push('Defina avatar com base na VOC extraída');
  }

  return {
    passed: issues.length === 0,
    gate: 'RESEARCH',
    issues,
    suggestions,
    confidence: d.synthesisConfidence,
  };
}

/**
 * Verifica Briefing Gate — delegates weighted scoring to evaluateBriefingGate().
 * Returns synchronously with cached/pre-computed result or falls back to legacy binary check.
 *
 * Note: evaluateBriefingGate is async. This function calls it via a sync fallback pattern:
 * callers that need the full weighted score should use evaluateBriefingGate directly.
 * This wrapper preserves backward compatibility with synchronous checkProductionGates().
 */
export function checkBriefingGate(context: OfferContext): GateCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Attempt to read helix-state.yaml for gate status (fast sync path)
  const helixStatePath = join(context.offerPath, 'helix-state.yaml');
  if (existsSync(helixStatePath)) {
    try {
      const helixContent = readFileSync(helixStatePath, 'utf-8');

      // Check if briefing gate is already marked as passed in helix-state
      const gatesSection = helixContent.match(/^gates:([\s\S]*?)(?=^\w)/m)?.[1] || helixContent.substring(helixContent.indexOf('gates:') + 6);
      const gateLines = gatesSection.split('\n');
      let currentGate = '';
      let briefingPassed = false;

      for (const line of gateLines) {
        const gateNameMatch = line.match(/^\s{2}(briefing)\s*:/);
        if (gateNameMatch) { currentGate = 'briefing'; continue; }
        const passedMatch = line.match(/^\s+passed\s*:\s*(true|false)/);
        if (passedMatch && currentGate === 'briefing') {
          briefingPassed = passedMatch[1] === 'true';
          break;
        }
      }

      if (briefingPassed) {
        // Briefing already passed — skip inline check
        return { passed: true, gate: 'BRIEFING', issues: [], suggestions: [] };
      }

      // Not yet passed — check HELIX phases and MUP/MUS from helix-state
      const phasesMatch = helixContent.match(/phases_completed\s*:\s*(\d+)/);
      let helixPhases = phasesMatch ? parseInt(phasesMatch[1], 10) : 0;
      if (helixPhases === 0) {
        const completedMatches = helixContent.match(/status:\s*completed/g);
        helixPhases = completedMatches ? completedMatches.length : 0;
      }

      if (helixPhases < MIN_HELIX_PHASES) {
        issues.push(`Apenas ${helixPhases}/${TOTAL_HELIX_PHASES} fases HELIX (mínimo: ${MIN_HELIX_PHASES})`);
        suggestions.push('Complete fases HELIX via helix-system-agent. Use evaluateBriefingGate() para score detalhado.');
      }

      // Check MUP/MUS from mecanismo-unico.yaml
      const mecPath = join(context.offerPath, 'mecanismo-unico.yaml');
      if (existsSync(mecPath)) {
        const mecContent = readFileSync(mecPath, 'utf-8');
        const hasMup = /new_cause\s*:/.test(mecContent) && mecContent.match(/new_cause\s*:\s*.{5,}/)?.[0] !== undefined;
        const hasMus = /hero_ingredient\s*:|gimmick_name\s*:/.test(mecContent);

        if (!hasMup) {
          issues.push('MUP (new_cause) não definido no mecanismo-unico.yaml');
          suggestions.push('Defina MUP via HELIX Fase 05 e rode evaluateBriefingGate() para score completo');
        }
        if (!hasMus) {
          issues.push('MUS (hero_ingredient/gimmick_name) não definido no mecanismo-unico.yaml');
          suggestions.push('Complete MUS via HELIX Fase 06');
        }
      } else {
        // Fallback to legacy deliverables check
        const d = context.deliverables;
        if (!d.mupDefined) {
          issues.push('MUP (Fase 05) não definida');
          suggestions.push('Fase 05 é CRÍTICA - define a promessa principal');
        }
        if (!d.musDefined) {
          issues.push('MUS (Fase 06) não definida');
          suggestions.push('Fase 06 completa o par MUP/MUS');
        }
      }

      return { passed: issues.length === 0, gate: 'BRIEFING', issues, suggestions };
    } catch {
      // Fall through to legacy check
    }
  }

  // Legacy fallback: use deliverables from context
  const d = context.deliverables;
  if (d.phasesComplete < MIN_HELIX_PHASES) {
    issues.push(`Apenas ${d.phasesComplete}/${TOTAL_HELIX_PHASES} fases HELIX (mínimo: ${MIN_HELIX_PHASES})`);
    suggestions.push('Complete fases HELIX via helix-system-agent');
  }
  if (!d.mupDefined) {
    issues.push('MUP (Fase 05) não definida');
    suggestions.push('Fase 05 é CRÍTICA - define a promessa principal');
  }
  if (!d.musDefined) {
    issues.push('MUS (Fase 06) não definida');
    suggestions.push('Fase 06 completa o par MUP/MUS');
  }

  return { passed: issues.length === 0, gate: 'BRIEFING', issues, suggestions };
}

/**
 * Verifica Briefing Gate com score ponderado via evaluateBriefingGate().
 * Versão async que retorna score detalhado (0-100) ao invés de binary pass/fail.
 * Use esta função quando precisar de diagnóstico detalhado do briefing.
 */
export async function checkBriefingGateWeighted(offerPath: string): Promise<{
  passed: boolean;
  gate: 'BRIEFING';
  score: number;
  verdict: 'PASSED' | 'NEEDS_REVIEW' | 'FAILED';
  issues: string[];
  suggestions: string[];
}> {
  const result = await evaluateBriefingGate(offerPath);
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Convert criteria failures into issues
  for (const criterion of result.criteria) {
    if (criterion.raw_score < criterion.weight * 0.5) {
      issues.push(`${criterion.name}: ${criterion.raw_score.toFixed(1)}/10 (${criterion.details})`);
      if (criterion.name === 'HELIX Completeness') {
        suggestions.push('Complete todas as 10 fases HELIX via atlas (@briefer)');
      } else if (criterion.name === 'MUP Quality') {
        suggestions.push('Valide MUP com blind_critic + emotional_stress_test');
      } else if (criterion.name === 'MUS Quality') {
        suggestions.push('Defina gimmick_name e hero_ingredient no mecanismo-unico.yaml');
      } else if (criterion.name === 'VOC Alignment') {
        suggestions.push('Execute research completa — vox (@researcher) para synthesis.md');
      } else if (criterion.name === 'Mecanismo State') {
        suggestions.push('Avance mecanismo de DRAFT para VALIDATED/APPROVED via consensus MCP');
      }
    }
  }

  return {
    passed: result.verdict === 'PASSED',
    gate: 'BRIEFING',
    score: result.total_weighted,
    verdict: result.verdict,
    issues,
    suggestions,
  };
}

/**
 * Verifica Anti-Homogeneização
 * Analisa conteúdo para detectar clichês e genericidade
 */
export function checkAntiHomogenization(
  content: string,
  nicheName: string
): GateCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const lowerContent = content.toLowerCase();

  // Verificar clichês do nicho
  const nicheCliches = CLICHES_BY_NICHE[nicheName] || [];
  const foundCliches = nicheCliches.filter(c => lowerContent.includes(c.toLowerCase()));

  if (foundCliches.length > 0) {
    issues.push(`Clichês detectados: ${foundCliches.join(', ')}`);
    suggestions.push('Substitua por elementos ÚNICOS da oferta');
  }

  // Verificar palavras banidas
  const foundBanned = BANNED_WORDS.filter(w => lowerContent.includes(w.toLowerCase()));

  if (foundBanned.length > 0) {
    issues.push(`Palavras banidas: ${foundBanned.join(', ')}`);
    suggestions.push('Use linguagem específica da VOC em vez de adjetivos genéricos');
  }

  // Logo Test simplificado: procurar por elementos proprietários
  const hasProprietaryName = /método\s+[A-Z][a-zA-Z]+|sistema\s+[A-Z][a-zA-Z]+|protocolo\s+[A-Z][a-zA-Z]+/i.test(content);
  const hasSpecificNumbers = /\d{2,}%|\d{2,}\s*(dias|horas|minutos|pessoas|alunos)/i.test(content);

  if (!hasProprietaryName) {
    issues.push('Sem nome proprietário para método/sistema');
    suggestions.push('Crie um nome único para o mecanismo (ex: Método HELIX)');
  }

  if (!hasSpecificNumbers) {
    issues.push('Sem números específicos');
    suggestions.push('Adicione dados concretos: tempo, porcentagens, quantidade de alunos');
  }

  // Calcular genericidade score
  const genericityScore = calculateGenericityScore(content, issues.length);

  // Threshold: 8/10 (onde 10 = totalmente único)
  const passed = genericityScore >= 8;

  if (!passed) {
    issues.unshift(`Genericidade Score: ${genericityScore}/10 (mínimo: 8)`);
    suggestions.unshift('Copy genérica demais - concorrente poderia usar sem alteração');
  }

  return {
    passed,
    gate: 'ANTI_HOMOG',
    issues,
    suggestions,
    confidence: genericityScore * 10, // 0-100
  };
}

/**
 * Calcula score de genericidade (0-10)
 * 10 = totalmente único, 0 = totalmente genérico
 */
function calculateGenericityScore(content: string, issueCount: number): number {
  let score = 10;

  // Penalizar por issues encontradas
  score -= Math.min(5, issueCount * 1.5);

  // Bonus por elementos específicos
  const hasQuotes = /"[^"]{20,}"/g.test(content); // Quotes de VOC
  const hasSpecificProof = /\d{1,3}[,.]?\d{0,3}\s*(pessoas|alunos|clientes)/i.test(content);
  const hasUniqueStory = /minha história|meu caso|quando eu/i.test(content);

  if (hasQuotes) score += 0.5;
  if (hasSpecificProof) score += 0.5;
  if (hasUniqueStory) score += 0.5;

  return Math.max(0, Math.min(10, Math.round(score)));
}

// ============================================
// MAIN GATE CHECK
// ============================================

/**
 * Verifica todos os gates para produção
 */
export function checkProductionGates(
  filePath: string,
  content?: string
): GateCheckResult {
  // 1. Verificar se é arquivo de produção
  if (!isProductionFile(filePath)) {
    return {
      passed: true,
      gate: 'NONE',
      issues: [],
      suggestions: [],
    };
  }

  // 2. Obter contexto da oferta
  const context = getOfferContext(filePath);

  if (!context) {
    return {
      passed: true, // Permitir se não conseguir determinar contexto
      gate: 'NONE',
      issues: ['Não foi possível determinar contexto da oferta'],
      suggestions: [],
    };
  }

  // 3. Verificar Research Gate
  const researchResult = checkResearchGate(context);
  if (!researchResult.passed) {
    return researchResult;
  }

  // 4. Verificar Briefing Gate
  const briefingResult = checkBriefingGate(context);
  if (!briefingResult.passed) {
    return briefingResult;
  }

  // 5. Se content fornecido, verificar Anti-Homogeneização
  if (content) {
    const homogResult = checkAntiHomogenization(content, context.nicheName);
    if (!homogResult.passed) {
      return homogResult;
    }
  }

  // Passou em tudo
  return {
    passed: true,
    gate: 'NONE',
    issues: [],
    suggestions: [],
  };
}

/**
 * Formata mensagem de bloqueio para o hook
 */
export function formatGateBlockMessage(result: GateCheckResult, context?: OfferContext): string {
  if (result.passed) return '';

  const gateNames: Record<string, string> = {
    'RESEARCH': '📊 RESEARCH GATE',
    'BRIEFING': '📋 BRIEFING GATE',
    'ANTI_HOMOG': '🎯 ANTI-HOMOGENEIZAÇÃO GATE',
  };

  const gateName = gateNames[result.gate] || 'GATE';
  const offerInfo = context ? `\n**Oferta:** ${context.nicheName}/${context.offerName}` : '';

  const issuesList = result.issues.map(i => `  ❌ ${i}`).join('\n');
  const suggestionsList = result.suggestions.map(s => `  → ${s}`).join('\n');

  return `
🚫 BLOQUEADO - ${gateName}
${offerInfo}
${result.confidence !== undefined ? `\n**Confidence:** ${result.confidence}%` : ''}

### ISSUES ENCONTRADAS
${issuesList}

### AÇÕES NECESSÁRIAS
${suggestionsList}

---
**Para bypass de emergência:** Adicione \`--force-production\` no prompt.
`;
}
