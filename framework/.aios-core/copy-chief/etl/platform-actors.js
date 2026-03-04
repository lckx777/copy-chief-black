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
var platform_actors_exports = {};
__export(platform_actors_exports, {
  ESCAPE_PHRASES: () => ESCAPE_PHRASES,
  PLATFORM_ACTORS: () => PLATFORM_ACTORS,
  PLAYWRIGHT_TOOLS: () => PLAYWRIGHT_TOOLS,
  URL_PATTERNS: () => URL_PATTERNS,
  checkToolPriority: () => checkToolPriority,
  detectPlatformFromUrl: () => detectPlatformFromUrl,
  extractUrlFromInput: () => extractUrlFromInput,
  formatBlockMessage: () => formatBlockMessage,
  getSuggestedActors: () => getSuggestedActors,
  hasEscapePhrase: () => hasEscapePhrase,
  isPlaywrightTool: () => isPlaywrightTool
});
module.exports = __toCommonJS(platform_actors_exports);
const PLATFORM_ACTORS = {
  youtube: [
    "streamers/youtube-comment-scraper",
    "bernardo/youtube-scraper",
    "apify/youtube-scraper"
  ],
  instagram: [
    "apify/instagram-comment-scraper",
    "apify/instagram-scraper",
    "apify/instagram-post-scraper"
  ],
  tiktok: [
    "clockworks/tiktok-comments-scraper",
    "clockworks/tiktok-scraper",
    "apify/tiktok-scraper"
  ],
  reddit: [
    "trudax/reddit-scraper",
    "apify/reddit-scraper"
  ],
  reclameaqui: [
    "pocesar/reclame-aqui-scraper"
  ],
  twitter: [
    "apify/twitter-scraper",
    "quacker/twitter-scraper"
  ],
  facebook: [
    "apify/facebook-posts-scraper",
    "apify/facebook-comments-scraper"
  ]
};
const URL_PATTERNS = {
  youtube: /youtube\.com|youtu\.be/i,
  instagram: /instagram\.com|instagr\.am/i,
  tiktok: /tiktok\.com/i,
  reddit: /reddit\.com/i,
  reclameaqui: /reclameaqui\.com\.br/i,
  twitter: /twitter\.com|x\.com/i,
  facebook: /facebook\.com|fb\.com/i
};
const PLAYWRIGHT_TOOLS = [
  "mcp__playwright__browser_navigate",
  "mcp__playwright__browser_click",
  "mcp__playwright__browser_snapshot",
  "browser_navigate",
  "browser_click",
  "browser_snapshot"
];
const ESCAPE_PHRASES = [
  /forçar playwright/i,
  /force playwright/i,
  /--force/i,
  /usar playwright direto/i,
  /bypass apify/i,
  /apify não funciona/i,
  /apify falhou/i
];
function detectPlatformFromUrl(url) {
  for (const [platform, pattern] of Object.entries(URL_PATTERNS)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  return null;
}
function hasEscapePhrase(prompt) {
  return ESCAPE_PHRASES.some((pattern) => pattern.test(prompt));
}
function getSuggestedActors(platform) {
  return PLATFORM_ACTORS[platform] || [];
}
function isPlaywrightTool(toolName) {
  const normalizedName = toolName.toLowerCase();
  return PLAYWRIGHT_TOOLS.some(
    (tool) => normalizedName.includes("playwright") || normalizedName === tool.toLowerCase()
  );
}
function extractUrlFromInput(toolInput) {
  const urlFields = ["url", "target_url", "page_url", "navigate_url", "href"];
  for (const field of urlFields) {
    if (typeof toolInput[field] === "string") {
      return toolInput[field];
    }
  }
  for (const value of Object.values(toolInput)) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      return value;
    }
  }
  return null;
}
function checkToolPriority(toolName, toolInput, currentPrompt = "") {
  if (!isPlaywrightTool(toolName)) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: "Not a Playwright tool"
    };
  }
  if (hasEscapePhrase(currentPrompt)) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: "Escape phrase detected - allowing Playwright"
    };
  }
  const url = extractUrlFromInput(toolInput);
  if (!url) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: "No URL detected in tool input"
    };
  }
  const platform = detectPlatformFromUrl(url);
  if (!platform) {
    return {
      shouldBlock: false,
      platform: null,
      suggestedActors: [],
      reason: "URL is not a known social platform"
    };
  }
  const suggestedActors = getSuggestedActors(platform);
  return {
    shouldBlock: true,
    platform,
    suggestedActors,
    reason: `Detected ${platform} URL. Use Apify actors instead of Playwright for better reliability.`
  };
}
function formatBlockMessage(result) {
  if (!result.shouldBlock || !result.platform) {
    return "";
  }
  const actorsList = result.suggestedActors.slice(0, 3).map((actor) => `  - ${actor}`).join("\n");
  return `
\u{1F6AB} BLOQUEADO - TOOL PRIORITY VIOLATION

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
  actorId: "${result.suggestedActors[0] || "actor-id"}",
  input: { ... }
})
\`\`\`

### ESCAPE (se necess\xE1rio)

Diga "for\xE7ar playwright" ou "apify falhou" para bypass.
`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ESCAPE_PHRASES,
  PLATFORM_ACTORS,
  PLAYWRIGHT_TOOLS,
  URL_PATTERNS,
  checkToolPriority,
  detectPlatformFromUrl,
  extractUrlFromInput,
  formatBlockMessage,
  getSuggestedActors,
  hasEscapePhrase,
  isPlaywrightTool
});
