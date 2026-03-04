// ~/.claude/hooks/lib/platform-actors.ts
// Mapeamento de plataformas sociais → Apify Actors preferidos
// FASE 3: Tool Priority Enforcement

/**
 * Platform → Apify Actors Mapping
 * Lista de actors recomendados por plataforma
 */
export const PLATFORM_ACTORS: Record<string, string[]> = {
  youtube: [
    'streamers/youtube-comment-scraper',
    'bernardo/youtube-scraper',
    'apify/youtube-scraper'
  ],
  instagram: [
    'apify/instagram-comment-scraper',
    'apify/instagram-scraper',
    'apify/instagram-post-scraper'
  ],
  tiktok: [
    'clockworks/tiktok-comments-scraper',
    'clockworks/tiktok-scraper',
    'apify/tiktok-scraper'
  ],
  reddit: [
    'trudax/reddit-scraper',
    'apify/reddit-scraper'
  ],
  reclameaqui: [
    'pocesar/reclame-aqui-scraper'
  ],
  twitter: [
    'apify/twitter-scraper',
    'quacker/twitter-scraper'
  ],
  facebook: [
    'apify/facebook-posts-scraper',
    'apify/facebook-comments-scraper'
  ]
};

/**
 * URL patterns para detectar plataforma
 */
export const URL_PATTERNS: Record<string, RegExp> = {
  youtube: /youtube\.com|youtu\.be/i,
  instagram: /instagram\.com|instagr\.am/i,
  tiktok: /tiktok\.com/i,
  reddit: /reddit\.com/i,
  reclameaqui: /reclameaqui\.com\.br/i,
  twitter: /twitter\.com|x\.com/i,
  facebook: /facebook\.com|fb\.com/i
};

/**
 * Ferramentas que devem ser verificadas
 */
export const PLAYWRIGHT_TOOLS = [
  'mcp__playwright__browser_navigate',
  'mcp__playwright__browser_click',
  'mcp__playwright__browser_snapshot',
  'browser_navigate',
  'browser_click',
  'browser_snapshot'
];

/**
 * Escape phrases que permitem bypass do gate
 */
export const ESCAPE_PHRASES = [
  /forçar playwright/i,
  /force playwright/i,
  /--force/i,
  /usar playwright direto/i,
  /bypass apify/i,
  /apify não funciona/i,
  /apify falhou/i
];

export interface ToolPriorityResult {
  shouldBlock: boolean;
  platform: string | null;
  suggestedActors: string[];
  reason: string;
}

/**
 * Detecta plataforma a partir de uma URL
 */
export function detectPlatformFromUrl(url: string): string | null {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}

/**
 * Verifica se o prompt contém escape phrase
 */
export function hasEscapePhrase(prompt: string): boolean {
  return ESCAPE_PHRASES.some(pattern => pattern.test(prompt));
}

/**
 * Obtém actors sugeridos para uma plataforma
 */
export function getSuggestedActors(platform: string): string[] {
  return PLATFORM_ACTORS[platform] || [];
}

/**
 * Verifica se a ferramenta é Playwright
 */
export function isPlaywrightTool(toolName: string): boolean {
  const normalizedName = toolName.toLowerCase();
  return PLAYWRIGHT_TOOLS.some(tool =>
    normalizedName.includes('playwright') ||
    normalizedName === tool.toLowerCase()
  );
}

/**
 * Extrai URL do input da ferramenta
 */
export function extractUrlFromInput(toolInput: Record<string, unknown>): string | null {
  // Tentar diferentes campos comuns
  const urlFields = ['url', 'target_url', 'page_url', 'navigate_url', 'href'];

  for (const field of urlFields) {
    if (typeof toolInput[field] === 'string') {
      return toolInput[field] as string;
    }
  }

  // Verificar se há URL em algum campo string
  for (const value of Object.values(toolInput)) {
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      return value;
    }
  }

  return null;
}

/**
 * Função principal: verifica se deve bloquear uso de Playwright
 *
 * @param toolName - Nome da ferramenta sendo usada
 * @param toolInput - Input da ferramenta
 * @param currentPrompt - Prompt atual (para verificar escape)
 * @returns Resultado indicando se deve bloquear
 */
export function checkToolPriority(
  toolName: string,
  toolInput: Record<string, unknown>,
  currentPrompt: string = ''
): ToolPriorityResult {
  // Não é ferramenta Playwright → permitir
  if (!isPlaywrightTool(toolName)) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: 'Not a Playwright tool'
    };
  }

  // Verificar escape phrase no prompt
  if (hasEscapePhrase(currentPrompt)) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: 'Escape phrase detected - allowing Playwright'
    };
  }

  // Extrair URL do input
  const url = extractUrlFromInput(toolInput);
  if (!url) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: 'No URL detected in tool input'
    };
  }

  // Detectar plataforma
  const platform = detectPlatformFromUrl(url);
  if (!platform) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: 'URL is not a known social platform'
    };
  }

  // Plataforma detectada → sugerir Apify
  const suggestedActors = getSuggestedActors(platform);

  return {
    shouldBlock: true,
    platform,
    suggestedActors,
    reason: `Detected ${platform} URL. Use Apify actors instead of Playwright for better reliability.`
  };
}

/**
 * Gera mensagem de bloqueio formatada
 */
export function formatBlockMessage(result: ToolPriorityResult): string {
  if (!result.shouldBlock || !result.platform) {
    return '';
  }

  const actorsList = result.suggestedActors
    .slice(0, 3) // Mostrar top 3
    .map(actor => `  - ${actor}`)
    .join('\n');

  return `
🚫 BLOQUEADO - TOOL PRIORITY VIOLATION

**Plataforma detectada:** ${result.platform}
**Motivo:** ${result.reason}

### USE APIFY ACTORS EM VEZ DE PLAYWRIGHT

Actors recomendados para ${result.platform}:
${actorsList}

### COMO USAR APIFY

\`\`\`typescript
// 1. Buscar actor
mcp__apify__search-actors({ query: "${result.platform} comments" })

// 2. Executar
mcp__apify__call-actor({
  actorId: "${result.suggestedActors[0] || 'actor-id'}",
  input: { ... }
})
\`\`\`

### ESCAPE (se necessário)

Diga "forçar playwright" ou "apify falhou" para bypass.
`;
}
