// ~/.claude/.aios-core/copy-chief/gates/gate-prereq.ts
// Business logic extracted from validate-gate-prereq.ts hook
// v7.6 - Tool Enforcement prereq evaluation
// Extracted: 2026-03-02

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { GateType } from '../state/session-state';

// ─── Tool Name Mapping ───────────────────────────────────────────────────────

const TOOL_SHORT_TO_MCP: Record<string, string> = {
  voc_search: 'mcp__copywriting__voc_search',
  firecrawl_agent: 'mcp__firecrawl__firecrawl_agent',
  firecrawl_scrape: 'mcp__firecrawl__firecrawl_scrape',
  firecrawl_search: 'mcp__firecrawl__firecrawl_search',
  browser_navigate: 'mcp__playwright__browser_navigate',
  get_phase_context: 'mcp__copywriting__get_phase_context',
  blind_critic: 'mcp__copywriting__blind_critic',
  emotional_stress_test: 'mcp__copywriting__emotional_stress_test',
  get_meta_ads: 'mcp__fb_ad_library__get_meta_ads',
  get_meta_platform_id: 'mcp__fb_ad_library__get_meta_platform_id',
  analyze_ad_video: 'mcp__fb_ad_library__analyze_ad_video',
  consensus: 'mcp__zen__consensus',
  thinkdeep: 'mcp__zen__thinkdeep',
  layered_review: 'mcp__copywriting__layered_review',
  write_chapter: 'mcp__copywriting__write_chapter',
  black_validation: 'mcp__copywriting__black_validation',
};

// ─── Required / Recommended Tool Tables ──────────────────────────────────────

/**
 * Ferramentas OBRIGATÓRIAS por gate.
 * Pelo menos UMA de cada grupo interno deve ter sido usada.
 */
export const REQUIRED_TOOLS_BY_GATE: Record<GateType, string[][]> = {
  research: [
    // Grupo 1: Coleta de dados (pelo menos uma)
    [
      'mcp__firecrawl__firecrawl_agent',
      'mcp__firecrawl__firecrawl_scrape',
      'mcp__firecrawl__firecrawl_search',
      'mcp__playwright__browser_navigate',
    ],
    // Grupo 2: VOC Search
    [
      'mcp__copywriting__voc_search',
    ],
  ],
  briefing: [
    // Grupo 1: Phase Context
    [
      'mcp__copywriting__get_phase_context',
    ],
  ],
  production: [
    // Grupo 1: Blind Critic
    [
      'mcp__copywriting__blind_critic',
    ],
    // Grupo 2: Emotional Stress Test
    [
      'mcp__copywriting__emotional_stress_test',
    ],
  ],
};

/**
 * Ferramentas RECOMENDADAS por gate.
 * Não bloqueiam — apenas emitem warning.
 */
export const RECOMMENDED_TOOLS_BY_GATE: Record<GateType, string[]> = {
  research: [
    'mcp__fb_ad_library__get_meta_ads',
    'mcp__fb_ad_library__get_meta_platform_id',
    'mcp__fb_ad_library__analyze_ad_video',
  ],
  briefing: [
    'mcp__zen__consensus',
    'mcp__zen__thinkdeep',
  ],
  production: [
    'mcp__copywriting__layered_review',
    'mcp__copywriting__write_chapter',
  ],
};

// ─── Persistent State Reader ──────────────────────────────────────────────────

/**
 * Lê ferramentas registradas no helix-state.yaml persistente
 * e converte nomes curtos para nomes MCP completos.
 */
export function getToolsFromPersistentState(offerPath: string | null, gateType: GateType): string[] {
  if (!offerPath) return [];

  try {
    const ecosystemRoot = join(process.env.HOME!, 'copywriting-ecosystem');
    const helixStatePath = join(ecosystemRoot, offerPath, 'helix-state.yaml');

    if (!existsSync(helixStatePath)) return [];

    const content = readFileSync(helixStatePath, 'utf-8');

    // Simple YAML parsing for tools_by_phase section
    const phaseKey = gateType; // research, briefing, production
    const toolsByPhaseMatch = content.match(
      new RegExp(`tools_by_phase:[\\s\\S]*?${phaseKey}:\\s*\\n((?:\\s+-\\s+.+\\n)*)`, 'm')
    );

    if (!toolsByPhaseMatch) return [];

    const toolLines = toolsByPhaseMatch[1];
    const tools: string[] = [];
    const toolRegex = /^\s+-\s+(.+)$/gm;
    let match;
    while ((match = toolRegex.exec(toolLines)) !== null) {
      const toolName = match[1].trim();
      if (toolName.startsWith('mcp__')) {
        tools.push(toolName);
      } else if (TOOL_SHORT_TO_MCP[toolName]) {
        tools.push(TOOL_SHORT_TO_MCP[toolName]);
      } else {
        tools.push(toolName);
      }
    }

    return tools;
  } catch (error) {
    console.error(`[GATE-PREREQ] Warning: Could not read persistent state: ${error}`);
    return [];
  }
}

// ─── Gate Evaluation ──────────────────────────────────────────────────────────

export interface GatePrereqResult {
  passed: boolean;
  missingGroups: string[][];
  missingRecommended: string[];
  toolsUsed: string[];
}

/**
 * Avalia se os pré-requisitos de ferramentas para um gate foram atendidos.
 */
export function evaluateGatePrereq(gateType: GateType, toolsUsed: string[]): GatePrereqResult {
  const requiredGroups = REQUIRED_TOOLS_BY_GATE[gateType];
  const recommended = RECOMMENDED_TOOLS_BY_GATE[gateType];

  const missingGroups: string[][] = [];
  for (const group of requiredGroups) {
    const hasAnyFromGroup = group.some(tool => toolsUsed.includes(tool));
    if (!hasAnyFromGroup) {
      missingGroups.push(group);
    }
  }

  const missingRecommended = recommended.filter(tool => !toolsUsed.includes(tool));

  return {
    passed: missingGroups.length === 0,
    missingGroups,
    missingRecommended,
    toolsUsed,
  };
}

// ─── Message Formatting ───────────────────────────────────────────────────────

export function formatToolName(tool: string): string {
  return tool
    .replace(/^mcp__/, '')
    .replace(/__/g, '.')
    .replace(/_/g, ' ');
}

export function formatBlockReason(
  gateType: GateType,
  toolsUsed: string[],
  missingGroups: string[][],
  offer: string | null,
  phase: string | null,
): string {
  const missingMessage = missingGroups.map((group, i) => {
    if (group.length === 1) {
      return `  ${i + 1}. ${formatToolName(group[0])}`;
    }
    return `  ${i + 1}. Uma das seguintes:\n${group.map(t => `     - ${formatToolName(t)}`).join('\n')}`;
  }).join('\n');

  const usedMessage = toolsUsed.length > 0
    ? toolsUsed.map(t => `  ✓ ${formatToolName(t)}`).join('\n')
    : '  (nenhuma ferramenta registrada)';

  return `🚫 BLOQUEADO - FERRAMENTAS OBRIGATÓRIAS NÃO USADAS

**validate_gate("${gateType}")** não pode ser executado ainda.

**Ferramentas FALTANDO:**
${missingMessage}

**Ferramentas JÁ USADAS nesta fase:**
${usedMessage}

**Estado Atual:**
- Oferta: ${offer || 'não definida'}
- Fase: ${phase}

**AÇÃO OBRIGATÓRIA:**
Execute as ferramentas faltantes ANTES de chamar validate_gate.
${getActionExamples(gateType, missingGroups)}

**Por que isso existe:**
O sistema v7.1 garante que as ferramentas corretas foram usadas
antes de aprovar a transição de fase.
Ver: ~/.claude/rules/tool-usage-matrix.md`;
}

export function getActionExamples(gateType: GateType, missingGroups: string[][]): string {
  const examples: string[] = [];

  for (const group of missingGroups) {
    const tool = group[0]; // Usar primeira opção do grupo como exemplo

    switch (tool) {
      case 'mcp__firecrawl__firecrawl_agent':
        examples.push(`
\`\`\`
Use firecrawl_agent para coletar dados de pesquisa:
mcp__firecrawl__firecrawl_agent(...)
\`\`\``);
        break;

      case 'mcp__copywriting__voc_search':
        examples.push(`
\`\`\`
Use voc_search para buscar quotes do público:
mcp__copywriting__voc_search(query="[emoção ou tema]", offer_path="[oferta]")
\`\`\``);
        break;

      case 'mcp__copywriting__get_phase_context':
        examples.push(`
\`\`\`
Use get_phase_context para carregar contexto da fase:
mcp__copywriting__get_phase_context(phase_number=1, offer_path="[oferta]")
\`\`\``);
        break;

      case 'mcp__copywriting__blind_critic':
        examples.push(`
\`\`\`
Use blind_critic para avaliar a copy:
mcp__copywriting__blind_critic(copy="[sua copy]", copy_type="vsl|lp|creative")
\`\`\``);
        break;

      case 'mcp__copywriting__emotional_stress_test':
        examples.push(`
\`\`\`
Use emotional_stress_test para validar impacto emocional:
mcp__copywriting__emotional_stress_test(copy="[sua copy]")
\`\`\``);
        break;

      default:
        examples.push(`Execute: ${formatToolName(tool)}`);
    }
  }

  return examples.join('\n');
}
