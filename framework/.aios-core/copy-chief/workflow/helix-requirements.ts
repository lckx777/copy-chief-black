// ~/.claude/hooks/lib/helix-requirements.ts
// Requisitos de ferramentas por fase HELIX - v7.2
// Criado: 2026-02-02 (BSSF Solution #3)

/**
 * Ferramentas OBRIGATÓRIAS por fase HELIX
 * Se a ferramenta não foi usada, fase NÃO pode avançar
 */
export const HELIX_PHASE_REQUIREMENTS: Record<number, string[]> = {
  // Fase 1: Identificação - precisa carregar contexto
  1: ['mcp__copywriting__get_phase_context'],
  
  // Fase 2: Pesquisa Mercado - precisa carregar contexto + validar com VOC
  2: ['mcp__copywriting__get_phase_context'],
  
  // Fase 3: Avatar/Psicologia - precisa carregar contexto + validar emoções
  3: ['mcp__copywriting__get_phase_context'],
  
  // Fase 4: Níveis de Consciência - precisa carregar contexto
  4: ['mcp__copywriting__get_phase_context'],
  
  // Fase 5: MUP - CRÍTICA - precisa consensus para validar
  5: ['mcp__copywriting__get_phase_context', 'mcp__zen__consensus'],
  
  // Fase 6: MUS - precisa carregar contexto + validar com VOC
  6: ['mcp__copywriting__get_phase_context', 'mcp__copywriting__voc_search'],
  
  // Fase 7: Big Offer - precisa carregar contexto
  7: ['mcp__copywriting__get_phase_context'],
  
  // Fase 8: Fechamento/Pitch - precisa carregar contexto
  8: ['mcp__copywriting__get_phase_context'],
  
  // Fase 9: Leads/Ganchos - precisa carregar contexto + validar com VOC
  9: ['mcp__copywriting__get_phase_context', 'mcp__copywriting__voc_search'],
  
  // Fase 10: Progressão Emocional - precisa validar gate
  10: ['mcp__copywriting__get_phase_context'],
};

/**
 * Ferramentas RECOMENDADAS (warning, não bloqueio)
 */
export const HELIX_PHASE_RECOMMENDED: Record<number, string[]> = {
  1: [],
  2: ['mcp__copywriting__voc_search'],
  3: ['mcp__copywriting__voc_search'],
  4: [],
  5: ['mcp__zen__thinkdeep'],
  6: ['mcp__zen__consensus'],
  7: ['mcp__copywriting__voc_search'],
  8: [],
  9: [],
  10: ['mcp__copywriting__validate_gate'],
};

/**
 * Nomes das fases HELIX
 */
export const HELIX_PHASE_NAMES: Record<number, string> = {
  1: 'Identificação e Posicionamento',
  2: 'Pesquisa de Mercado',
  3: 'Avatar e Psicologia',
  4: 'Níveis de Consciência',
  5: 'Problema, Vilão e MUP',
  6: 'Solução e MUS',
  7: 'Big Offer',
  8: 'Fechamento e Pitch',
  9: 'Leads e Ganchos',
  10: 'Progressão Emocional',
};

/**
 * Arquivos de output por fase
 */
export const HELIX_PHASE_OUTPUTS: Record<number, string> = {
  1: 'phase-01-identificacao.md',
  2: 'phase-02-pesquisa-mercado.md',
  3: 'phase-03-avatar-psicologia.md',
  4: 'phase-04-niveis-consciencia.md',
  5: 'phase-05-problema-vilao-mup.md',
  6: 'phase-06-solucao-mus.md',
  7: 'phase-07-big-offer.md',
  8: 'phase-08-fechamento-pitch.md',
  9: 'phase-09-leads-ganchos.md',
  10: 'phase-10-progressao-emocional.md',
};

/**
 * Detecta fase HELIX pelo nome do arquivo
 */
export function detectHelixPhaseFromPath(filePath: string): number | null {
  const phaseMatch = filePath.match(/phase-(\d{2})/);
  if (phaseMatch) {
    return parseInt(phaseMatch[1], 10);
  }
  return null;
}

/**
 * Retorna ferramentas obrigatórias para uma fase
 */
export function getRequiredTools(phase: number): string[] {
  return HELIX_PHASE_REQUIREMENTS[phase] || [];
}

/**
 * Retorna ferramentas recomendadas para uma fase
 */
export function getRecommendedTools(phase: number): string[] {
  return HELIX_PHASE_RECOMMENDED[phase] || [];
}

/**
 * Verifica se todas as ferramentas obrigatórias foram usadas
 */
export function getMissingRequiredTools(phase: number, usedTools: string[]): string[] {
  const required = getRequiredTools(phase);
  return required.filter(tool => !usedTools.includes(tool));
}

/**
 * Verifica se ferramentas recomendadas foram usadas (para warning)
 */
export function getMissingRecommendedTools(phase: number, usedTools: string[]): string[] {
  const recommended = getRecommendedTools(phase);
  return recommended.filter(tool => !usedTools.includes(tool));
}

/**
 * Formata nome da ferramenta para exibição
 */
export function formatToolName(tool: string): string {
  // mcp__copywriting__voc_search -> copywriting.voc_search
  return tool.replace('mcp__', '').replace('__', '.');
}

/**
 * Gera mensagem de erro para ferramentas faltantes
 */
export function generateMissingToolsMessage(phase: number, missing: string[]): string {
  const phaseName = HELIX_PHASE_NAMES[phase] || `Fase ${phase}`;
  const formattedTools = missing.map(formatToolName).join('\n  - ');
  
  return `🚫 BLOQUEADO - FERRAMENTAS OBRIGATÓRIAS NÃO USADAS

Fase ${phase} (${phaseName}) requer as seguintes ferramentas:

Ferramentas FALTANDO:
  - ${formattedTools}

AÇÃO OBRIGATÓRIA:
Execute as ferramentas faltantes ANTES de criar o arquivo da fase.

Exemplo:
  mcp__copywriting__get_phase_context(phase=${phase}, offer_path="...")
${missing.includes('mcp__copywriting__voc_search') ? '  mcp__copywriting__voc_search(query="...", emotion="...")' : ''}
${missing.includes('mcp__zen__consensus') ? '  mcp__zen__consensus(question="Qual MUP é mais forte?", ...)' : ''}

Ver: ~/.claude/rules/tool-usage-matrix.md`;
}
