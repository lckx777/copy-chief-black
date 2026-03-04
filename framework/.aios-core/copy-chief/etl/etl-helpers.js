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
var etl_helpers_exports = {};
__export(etl_helpers_exports, {
  chunkQuotes: () => chunkQuotes,
  cleanQuote: () => cleanQuote,
  createResumeState: () => createResumeState,
  deduplicateQuotes: () => deduplicateQuotes,
  extractSpeakers: () => extractSpeakers,
  getCollectionProgress: () => getCollectionProgress,
  getResumeState: () => getResumeState,
  markPlatformCompleted: () => markPlatformCompleted,
  mergeVocSquadResults: () => mergeVocSquadResults,
  recordResumeError: () => recordResumeError,
  saveResumeState: () => saveResumeState,
  validateCompleteness: () => validateCompleteness,
  validateQuality: () => validateQuality,
  validateSecurity: () => validateSecurity
});
module.exports = __toCommonJS(etl_helpers_exports);
var import_fs = require("fs");
var import_path = require("path");
const ECOSYSTEM_ROOT = (0, import_path.join)(process.env.HOME, "copywriting-ecosystem");
const RESUME_FILENAME = ".etl-resume.json";
function getResumePath(offerPath) {
  return (0, import_path.join)(ECOSYSTEM_ROOT, offerPath, "research", RESUME_FILENAME);
}
function getResumeState(offerPath) {
  const resumePath = getResumePath(offerPath);
  if (!(0, import_fs.existsSync)(resumePath)) {
    return null;
  }
  try {
    const content = (0, import_fs.readFileSync)(resumePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`[ETL-HELPERS] Error reading resume state: ${error}`);
    return null;
  }
}
function saveResumeState(offerPath, state) {
  const resumePath = getResumePath(offerPath);
  const dir = (0, import_path.dirname)(resumePath);
  if (!(0, import_fs.existsSync)(dir)) {
    (0, import_fs.mkdirSync)(dir, { recursive: true });
  }
  state.updated_at = (/* @__PURE__ */ new Date()).toISOString();
  state.total_quotes = Object.values(state.quotes_per_platform).reduce((sum, count) => sum + count, 0);
  (0, import_fs.writeFileSync)(resumePath, JSON.stringify(state, null, 2));
}
function createResumeState(offerPath) {
  const state = {
    offer_path: offerPath,
    started_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    platforms_completed: [],
    platforms_in_progress: [],
    quotes_per_platform: {},
    total_quotes: 0,
    status: "in_progress"
  };
  saveResumeState(offerPath, state);
  return state;
}
function markPlatformCompleted(offerPath, platform, quoteCount) {
  let state = getResumeState(offerPath);
  if (!state) {
    state = createResumeState(offerPath);
  }
  state.platforms_in_progress = state.platforms_in_progress.filter((p) => p !== platform);
  if (!state.platforms_completed.includes(platform)) {
    state.platforms_completed.push(platform);
  }
  state.quotes_per_platform[platform] = quoteCount;
  const required = ["youtube", "instagram", "tiktok", "reddit"];
  const allDone = required.every((p) => state.platforms_completed.includes(p));
  if (allDone) {
    state.status = "completed";
  }
  saveResumeState(offerPath, state);
}
function recordResumeError(offerPath, error) {
  let state = getResumeState(offerPath);
  if (!state) {
    state = createResumeState(offerPath);
  }
  state.last_error = error;
  state.last_error_at = (/* @__PURE__ */ new Date()).toISOString();
  state.status = "error";
  saveResumeState(offerPath, state);
}
const REQUIRED_PLATFORMS = ["youtube", "instagram", "tiktok", "reddit"];
const MIN_QUOTES_PER_PLATFORM = 50;
const REQUIRED_RESEARCH_DIRS = [
  "research/voc",
  "research/voc/raw",
  "research/voc/processed",
  "research/competitors",
  "research/mechanism",
  "research/avatar"
];
function validateCompleteness(offerPath) {
  const issues = [];
  const basePath = (0, import_path.join)(ECOSYSTEM_ROOT, offerPath);
  for (const dir of REQUIRED_RESEARCH_DIRS) {
    const fullPath = (0, import_path.join)(basePath, dir);
    if (!(0, import_fs.existsSync)(fullPath)) {
      issues.push(`Missing directory: ${dir}`);
    }
  }
  const rawDir = (0, import_path.join)(basePath, "research", "voc", "raw");
  if ((0, import_fs.existsSync)(rawDir)) {
    try {
      const rawFiles = (0, import_fs.readdirSync)(rawDir).filter((f) => f.endsWith(".md") || f.endsWith(".json"));
      if (rawFiles.length === 0) {
        issues.push("raw/ directory exists but contains no data files");
      }
    } catch {
      issues.push("Cannot read raw/ directory");
    }
  }
  const processedDir = (0, import_path.join)(basePath, "research", "voc", "processed");
  if ((0, import_fs.existsSync)(processedDir)) {
    try {
      const processedFiles = (0, import_fs.readdirSync)(processedDir).filter((f) => f.endsWith(".md"));
      if (processedFiles.length === 0) {
        issues.push("processed/ directory exists but contains no summary files");
      }
    } catch {
      issues.push("Cannot read processed/ directory");
    }
  }
  const resumeState = getResumeState(offerPath);
  if (resumeState) {
    for (const platform of REQUIRED_PLATFORMS) {
      const count = resumeState.quotes_per_platform[platform] || 0;
      if (count < MIN_QUOTES_PER_PLATFORM) {
        issues.push(
          `${platform}: ${count}/${MIN_QUOTES_PER_PLATFORM} quotes (below minimum)`
        );
      }
    }
    const coveredPlatforms = Object.keys(resumeState.quotes_per_platform).filter((p) => (resumeState.quotes_per_platform[p] || 0) > 0);
    const missingPlatforms = REQUIRED_PLATFORMS.filter((p) => !coveredPlatforms.includes(p));
    if (missingPlatforms.length > 0) {
      issues.push(`Missing platforms: ${missingPlatforms.join(", ")}`);
    }
  } else {
    issues.push("No ETL resume state found \u2014 collection may not have started");
  }
  return {
    passed: issues.length === 0,
    tier: "completeness",
    issues
  };
}
function validateSecurity(data) {
  const issues = [];
  for (let i = 0; i < data.length; i++) {
    const quote = data[i];
    const label = `Quote[${i}]`;
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(quote.text)) {
      issues.push(`${label}: Contains email address`);
    }
    if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/.test(quote.text)) {
      issues.push(`${label}: Contains phone number`);
    }
    if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(quote.text)) {
      issues.push(`${label}: Contains CPF number`);
    }
    if (quote.url) {
      try {
        const url = new URL(quote.url);
        if (!["http:", "https:"].includes(url.protocol)) {
          issues.push(`${label}: Invalid URL protocol: ${url.protocol}`);
        }
      } catch {
        issues.push(`${label}: Malformed URL: ${quote.url}`);
      }
    }
    if (isSpamContent(quote.text)) {
      issues.push(`${label}: Suspected spam/bot content`);
    }
    if (isBrandContent(quote.text)) {
      issues.push(`${label}: Suspected brand/influencer content (not authentic VOC)`);
    }
  }
  return {
    passed: issues.length === 0,
    tier: "security",
    issues
  };
}
function validateQuality(quotes) {
  const issues = [];
  const withoutIntensity = quotes.filter((q) => q.intensity === void 0 || q.intensity === null);
  if (withoutIntensity.length > 0) {
    issues.push(
      `${withoutIntensity.length} quotes missing intensity score (1-5 scale required)`
    );
  }
  const invalidIntensity = quotes.filter(
    (q) => q.intensity !== void 0 && (q.intensity < 1 || q.intensity > 5)
  );
  if (invalidIntensity.length > 0) {
    issues.push(`${invalidIntensity.length} quotes with intensity outside 1-5 range`);
  }
  const duplicateCount = findDuplicateCount(quotes);
  if (duplicateCount > 0) {
    issues.push(`${duplicateCount} duplicate quotes detected (exact or near-match)`);
  }
  const engagementThresholds = {
    youtube: 500,
    // 500+ comments on video
    instagram: 200,
    // 200+ comments
    tiktok: 1e3,
    // 1K+ comments
    reddit: 10
    // 10+ upvotes
  };
  for (const [platform, threshold] of Object.entries(engagementThresholds)) {
    const platformQuotes = quotes.filter((q) => q.platform === platform && q.engagement !== void 0);
    const belowThreshold = platformQuotes.filter((q) => (q.engagement || 0) < threshold);
    if (belowThreshold.length > platformQuotes.length * 0.5 && platformQuotes.length > 0) {
      issues.push(
        `${platform}: ${belowThreshold.length}/${platformQuotes.length} quotes below engagement threshold (${threshold})`
      );
    }
  }
  const withoutEmotion = quotes.filter((q) => !q.emotion);
  if (withoutEmotion.length > quotes.length * 0.3) {
    issues.push(
      `${withoutEmotion.length}/${quotes.length} quotes missing emotion category (MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO required)`
    );
  }
  const textsByPlatform = /* @__PURE__ */ new Map();
  for (const q of quotes) {
    const normalized = q.text.toLowerCase().trim().substring(0, 80);
    if (!textsByPlatform.has(normalized)) {
      textsByPlatform.set(normalized, /* @__PURE__ */ new Set());
    }
    textsByPlatform.get(normalized).add(q.platform);
  }
  const triangulated = [...textsByPlatform.values()].filter((s) => s.size >= 2).length;
  if (triangulated === 0 && quotes.length > 20) {
    issues.push("No triangulated quotes found (quotes appearing in 2+ platforms)");
  }
  return {
    passed: issues.length === 0,
    tier: "quality",
    issues
  };
}
function chunkQuotes(quotes, maxPerChunk) {
  if (maxPerChunk <= 0) {
    throw new Error("maxPerChunk must be a positive integer");
  }
  const chunks = [];
  for (let i = 0; i < quotes.length; i += maxPerChunk) {
    chunks.push(quotes.slice(i, i + maxPerChunk));
  }
  return chunks;
}
function cleanQuote(raw) {
  let cleaned = raw;
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  cleaned = cleaned.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  cleaned = cleaned.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ");
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
  cleaned = cleaned.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();
  return cleaned;
}
function deduplicateQuotes(quotes) {
  if (quotes.length <= 1) return quotes;
  const unique = [];
  const seenTokenSets = [];
  for (const quote of quotes) {
    const tokens = tokenize(quote.text);
    const tokenSet = new Set(tokens);
    let isDuplicate = false;
    for (const existingSet of seenTokenSets) {
      const similarity = jaccardSimilarity(tokenSet, existingSet);
      if (similarity > 0.8) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(quote);
      seenTokenSets.push(tokenSet);
    }
  }
  return unique;
}
function extractSpeakers(transcript) {
  const segments = [];
  const lines = transcript.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  let currentSpeaker = "host";
  let currentText = [];
  let currentTimestamp;
  function flushSegment() {
    if (currentText.length > 0) {
      segments.push({
        speaker: currentSpeaker,
        text: currentText.join(" ").trim(),
        timestamp_hint: currentTimestamp
      });
      currentText = [];
    }
  }
  function classifySpeaker(label) {
    const lower = label.toLowerCase().trim();
    if (lower.includes("host") || lower.includes("presenter") || lower.includes("narrator") || lower.includes("speaker 1") || lower.startsWith("dr") || lower.includes("expert")) {
      return "host";
    }
    if (lower.includes("comment") || lower.includes("viewer") || lower.includes("audience") || lower.includes("caller") || lower.includes("user") || lower.includes("speaker 2")) {
      return "commenter";
    }
    return "unknown";
  }
  for (const line of lines) {
    let workingLine = line;
    const timestampMatch = workingLine.match(
      /^[\[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?\s*[-:]?\s*/
    );
    if (timestampMatch) {
      flushSegment();
      currentTimestamp = timestampMatch[1];
      workingLine = workingLine.substring(timestampMatch[0].length).trim();
    }
    const speakerMatch = workingLine.match(
      /^(?:\[([^\]]+)\]|([A-Za-z][A-Za-z0-9.\s]*?))\s*:\s+/
    );
    if (speakerMatch) {
      if (!timestampMatch) {
        flushSegment();
      }
      const label = speakerMatch[1] || speakerMatch[2];
      currentSpeaker = classifySpeaker(label);
      const remainder = workingLine.substring(speakerMatch[0].length).trim();
      if (remainder) {
        currentText.push(remainder);
      }
    } else if (timestampMatch) {
      if (workingLine) {
        currentText.push(workingLine);
      }
    } else {
      if (line.length < 100 && (line.endsWith("?") || line.startsWith("@") || line.startsWith(">"))) {
        flushSegment();
        segments.push({
          speaker: "commenter",
          text: line.replace(/^[@>]\s*/, "").trim(),
          timestamp_hint: currentTimestamp
        });
      } else {
        currentText.push(line);
      }
    }
  }
  flushSegment();
  return segments;
}
function getCollectionProgress(offerPath) {
  const progress = [];
  const resumeState = getResumeState(offerPath);
  const allPlatforms = /* @__PURE__ */ new Set([
    ...REQUIRED_PLATFORMS,
    ...resumeState ? Object.keys(resumeState.quotes_per_platform) : []
  ]);
  for (const platform of allPlatforms) {
    const total = resumeState?.quotes_per_platform[platform] || 0;
    let rejected = 0;
    const rejectionFile = (0, import_path.join)(
      ECOSYSTEM_ROOT,
      offerPath,
      "research",
      "voc",
      "processed",
      `${platform}-rejections.json`
    );
    if ((0, import_fs.existsSync)(rejectionFile)) {
      try {
        const rejections = JSON.parse((0, import_fs.readFileSync)(rejectionFile, "utf-8"));
        rejected = Array.isArray(rejections) ? rejections.length : rejections.count || 0;
      } catch {
      }
    }
    progress.push({
      platform,
      total,
      valid: Math.max(0, total - rejected),
      rejected
    });
  }
  return progress;
}
function tokenize(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((t) => t.length > 2);
}
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionSize++;
    }
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
function isSpamContent(text) {
  const lower = text.toLowerCase();
  const spamPatterns = [
    /https?:\/\/\S+\s+https?:\/\/\S+/i,
    // Multiple URLs
    /click\s+here|visit\s+my|check\s+out\s+my\s+profile/i,
    /earn\s+\$?\d+.*per\s+(day|hour|week)/i,
    /free\s+gift|you\s+won|congratulations.*winner/i,
    /dm\s+me|inbox\s+me|whatsapp\s+me/i,
    /subscribe\s+to\s+my|follow\s+my/i
  ];
  if (spamPatterns.some((p) => p.test(lower))) return true;
  const emojiSequence = text.match(
    /(?:[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*){5,}/u
  );
  if (emojiSequence) return true;
  if (text.length < 5) return true;
  return false;
}
function isBrandContent(text) {
  const lower = text.toLowerCase();
  const brandPatterns = [
    /use\s+code\s+\w+\s+for/i,
    /sponsored|parceria|publi|#ad\b/i,
    /link\s+na\s+bio|link\s+in\s+bio/i,
    /\baffiliate\b.*\blink\b/i,
    /coupon\s+code|codigo\s+de\s+desconto/i
  ];
  return brandPatterns.some((p) => p.test(lower));
}
function findDuplicateCount(quotes) {
  const tokenSets = quotes.map((q) => new Set(tokenize(q.text)));
  let duplicates = 0;
  for (let i = 1; i < tokenSets.length; i++) {
    for (let j = 0; j < i; j++) {
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) > 0.8) {
        duplicates++;
        break;
      }
    }
  }
  return duplicates;
}
function mergeVocSquadResults(results) {
  const allQuotes = [];
  const patternsByPlatform = {};
  for (const result of results) {
    allQuotes.push(...result.quotes);
    patternsByPlatform[result.platform] = result.patterns;
  }
  const uniqueQuotes = dedupQuotes(allQuotes, 0.8);
  const duplicatesRemoved = allQuotes.length - uniqueQuotes.length;
  const insightGroups = /* @__PURE__ */ new Map();
  for (const quote of uniqueQuotes) {
    const key = quote.emotion || "OTHER";
    if (!insightGroups.has(key)) {
      insightGroups.set(key, { quotes: [], platforms: /* @__PURE__ */ new Set() });
    }
    const group = insightGroups.get(key);
    group.quotes.push(quote);
    group.platforms.add(quote.platform);
  }
  const triangulatedInsights = [];
  for (const [insight, group] of insightGroups) {
    if (group.platforms.size >= 3) {
      const avgDre = group.quotes.reduce((sum, q) => sum + (q.intensity || 3), 0) / group.quotes.length;
      triangulatedInsights.push({
        insight,
        platforms: Array.from(group.platforms),
        dreAverage: Math.round(avgDre * 10) / 10
      });
    }
  }
  const triangulatedQuotesCount = triangulatedInsights.reduce(
    (sum, ins) => sum + insightGroups.get(ins.insight).quotes.length,
    0
  );
  const triangulationRate = uniqueQuotes.length > 0 ? Math.round(triangulatedQuotesCount / uniqueQuotes.length * 100) : 0;
  return {
    totalQuotes: allQuotes.length,
    uniqueQuotes,
    triangulatedInsights,
    patternsByPlatform,
    consolidationMeta: {
      mergedAt: (/* @__PURE__ */ new Date()).toISOString(),
      platformsCovered: results.map((r) => r.platform),
      triangulationRate,
      duplicatesRemoved
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chunkQuotes,
  cleanQuote,
  createResumeState,
  deduplicateQuotes,
  extractSpeakers,
  getCollectionProgress,
  getResumeState,
  markPlatformCompleted,
  mergeVocSquadResults,
  recordResumeError,
  saveResumeState,
  validateCompleteness,
  validateQuality,
  validateSecurity
});
