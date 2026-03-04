/**
 * ETL Collection Helpers
 * Utility functions for VOC data collection pipelines.
 * Inspired by aios-squads/etl-squad patterns.
 *
 * ~/.claude/hooks/lib/etl-helpers.ts
 * v1.0 — Created: 2026-02-24
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const ECOSYSTEM_ROOT = join(process.env.HOME!, 'copywriting-ecosystem');

// ==========================================
// Types
// ==========================================

export interface Quote {
  text: string;
  platform: string;
  username?: string;
  engagement?: number;
  intensity?: number;
  emotion?: 'MEDO' | 'VERGONHA' | 'CULPA' | 'RAIVA' | 'FRUSTRACAO' | 'OTHER';
  url?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ResumeState {
  offer_path: string;
  started_at: string;
  updated_at: string;
  platforms_completed: string[];
  platforms_in_progress: string[];
  quotes_per_platform: Record<string, number>;
  last_error?: string;
  last_error_at?: string;
  total_quotes: number;
  status: 'in_progress' | 'completed' | 'error';
}

export interface ValidationResult {
  passed: boolean;
  tier: 'completeness' | 'security' | 'quality';
  issues: string[];
}

export interface CollectionProgress {
  platform: string;
  total: number;
  valid: number;
  rejected: number;
}

export interface SpeakerSegment {
  speaker: 'host' | 'commenter' | 'unknown';
  text: string;
  timestamp_hint?: string;
}

// ==========================================
// 1. Resume System
// ==========================================

const RESUME_FILENAME = '.etl-resume.json';

function getResumePath(offerPath: string): string {
  return join(ECOSYSTEM_ROOT, offerPath, 'research', RESUME_FILENAME);
}

/**
 * Loads the ETL resume state for an offer.
 * Returns null if no resume state exists (fresh start).
 */
export function getResumeState(offerPath: string): ResumeState | null {
  const resumePath = getResumePath(offerPath);

  if (!existsSync(resumePath)) {
    return null;
  }

  try {
    const content = readFileSync(resumePath, 'utf-8');
    return JSON.parse(content) as ResumeState;
  } catch (error) {
    console.error(`[ETL-HELPERS] Error reading resume state: ${error}`);
    return null;
  }
}

/**
 * Saves the ETL resume state for an offer.
 * Creates the research directory if it does not exist.
 */
export function saveResumeState(offerPath: string, state: ResumeState): void {
  const resumePath = getResumePath(offerPath);
  const dir = dirname(resumePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  state.updated_at = new Date().toISOString();
  state.total_quotes = Object.values(state.quotes_per_platform)
    .reduce((sum, count) => sum + count, 0);

  writeFileSync(resumePath, JSON.stringify(state, null, 2));
}

/**
 * Creates a fresh resume state for a new collection run.
 */
export function createResumeState(offerPath: string): ResumeState {
  const state: ResumeState = {
    offer_path: offerPath,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    platforms_completed: [],
    platforms_in_progress: [],
    quotes_per_platform: {},
    total_quotes: 0,
    status: 'in_progress',
  };

  saveResumeState(offerPath, state);
  return state;
}

/**
 * Marks a platform as completed in the resume state.
 */
export function markPlatformCompleted(
  offerPath: string,
  platform: string,
  quoteCount: number
): void {
  let state = getResumeState(offerPath);
  if (!state) {
    state = createResumeState(offerPath);
  }

  // Move from in_progress to completed
  state.platforms_in_progress = state.platforms_in_progress.filter(p => p !== platform);
  if (!state.platforms_completed.includes(platform)) {
    state.platforms_completed.push(platform);
  }

  state.quotes_per_platform[platform] = quoteCount;

  // Check if all required platforms are done
  const required = ['youtube', 'instagram', 'tiktok', 'reddit'];
  const allDone = required.every(p => state!.platforms_completed.includes(p));
  if (allDone) {
    state.status = 'completed';
  }

  saveResumeState(offerPath, state);
}

/**
 * Records an error in the resume state so the next run knows what failed.
 */
export function recordResumeError(offerPath: string, error: string): void {
  let state = getResumeState(offerPath);
  if (!state) {
    state = createResumeState(offerPath);
  }

  state.last_error = error;
  state.last_error_at = new Date().toISOString();
  state.status = 'error';

  saveResumeState(offerPath, state);
}

// ==========================================
// 2. Quality Checklist (3-tier)
// ==========================================

const REQUIRED_PLATFORMS = ['youtube', 'instagram', 'tiktok', 'reddit'];
const MIN_QUOTES_PER_PLATFORM = 50;

const REQUIRED_RESEARCH_DIRS = [
  'research/voc',
  'research/voc/raw',
  'research/voc/processed',
  'research/competitors',
  'research/mechanism',
  'research/avatar',
];

/**
 * Tier 1: Completeness — checks all required research directories exist
 * and minimum quote counts are met (50 per platform).
 */
export function validateCompleteness(offerPath: string): ValidationResult {
  const issues: string[] = [];
  const basePath = join(ECOSYSTEM_ROOT, offerPath);

  // Check required directories
  for (const dir of REQUIRED_RESEARCH_DIRS) {
    const fullPath = join(basePath, dir);
    if (!existsSync(fullPath)) {
      issues.push(`Missing directory: ${dir}`);
    }
  }

  // Check raw data stored in raw/ (not in context)
  const rawDir = join(basePath, 'research', 'voc', 'raw');
  if (existsSync(rawDir)) {
    try {
      const rawFiles = readdirSync(rawDir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
      if (rawFiles.length === 0) {
        issues.push('raw/ directory exists but contains no data files');
      }
    } catch {
      issues.push('Cannot read raw/ directory');
    }
  }

  // Check processed summaries exist
  const processedDir = join(basePath, 'research', 'voc', 'processed');
  if (existsSync(processedDir)) {
    try {
      const processedFiles = readdirSync(processedDir).filter(f => f.endsWith('.md'));
      if (processedFiles.length === 0) {
        issues.push('processed/ directory exists but contains no summary files');
      }
    } catch {
      issues.push('Cannot read processed/ directory');
    }
  }

  // Check resume state for quote counts per platform
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

    // Check all required platforms covered
    const coveredPlatforms = Object.keys(resumeState.quotes_per_platform)
      .filter(p => (resumeState.quotes_per_platform[p] || 0) > 0);
    const missingPlatforms = REQUIRED_PLATFORMS.filter(p => !coveredPlatforms.includes(p));
    if (missingPlatforms.length > 0) {
      issues.push(`Missing platforms: ${missingPlatforms.join(', ')}`);
    }
  } else {
    issues.push('No ETL resume state found — collection may not have started');
  }

  return {
    passed: issues.length === 0,
    tier: 'completeness',
    issues,
  };
}

/**
 * Tier 2: Security — strips PII, validates URLs, removes spam.
 * Operates on an array of quote data objects.
 */
export function validateSecurity(data: Quote[]): ValidationResult {
  const issues: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const quote = data[i];
    const label = `Quote[${i}]`;

    // Check for PII: email patterns
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(quote.text)) {
      issues.push(`${label}: Contains email address`);
    }

    // Check for PII: phone patterns (international and BR)
    if (/(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/.test(quote.text)) {
      issues.push(`${label}: Contains phone number`);
    }

    // Check for PII: CPF pattern (Brazilian)
    if (/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(quote.text)) {
      issues.push(`${label}: Contains CPF number`);
    }

    // Validate URLs if present
    if (quote.url) {
      try {
        const url = new URL(quote.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          issues.push(`${label}: Invalid URL protocol: ${url.protocol}`);
        }
      } catch {
        issues.push(`${label}: Malformed URL: ${quote.url}`);
      }
    }

    // Check for spam indicators
    if (isSpamContent(quote.text)) {
      issues.push(`${label}: Suspected spam/bot content`);
    }

    // Check for brand/influencer content (not authentic VOC)
    if (isBrandContent(quote.text)) {
      issues.push(`${label}: Suspected brand/influencer content (not authentic VOC)`);
    }
  }

  return {
    passed: issues.length === 0,
    tier: 'security',
    issues,
  };
}

/**
 * Tier 3: Quality — checks intensity scores, removes duplicates,
 * verifies minimum engagement thresholds.
 */
export function validateQuality(quotes: Quote[]): ValidationResult {
  const issues: string[] = [];

  // Check intensity scores assigned
  const withoutIntensity = quotes.filter(q => q.intensity === undefined || q.intensity === null);
  if (withoutIntensity.length > 0) {
    issues.push(
      `${withoutIntensity.length} quotes missing intensity score (1-5 scale required)`
    );
  }

  // Check intensity range
  const invalidIntensity = quotes.filter(
    q => q.intensity !== undefined && (q.intensity < 1 || q.intensity > 5)
  );
  if (invalidIntensity.length > 0) {
    issues.push(`${invalidIntensity.length} quotes with intensity outside 1-5 range`);
  }

  // Check for duplicates
  const duplicateCount = findDuplicateCount(quotes);
  if (duplicateCount > 0) {
    issues.push(`${duplicateCount} duplicate quotes detected (exact or near-match)`);
  }

  // Check minimum engagement thresholds per platform
  const engagementThresholds: Record<string, number> = {
    youtube: 500,    // 500+ comments on video
    instagram: 200,  // 200+ comments
    tiktok: 1000,    // 1K+ comments
    reddit: 10,      // 10+ upvotes
  };

  for (const [platform, threshold] of Object.entries(engagementThresholds)) {
    const platformQuotes = quotes.filter(q => q.platform === platform && q.engagement !== undefined);
    const belowThreshold = platformQuotes.filter(q => (q.engagement || 0) < threshold);
    if (belowThreshold.length > platformQuotes.length * 0.5 && platformQuotes.length > 0) {
      issues.push(
        `${platform}: ${belowThreshold.length}/${platformQuotes.length} quotes below engagement threshold (${threshold})`
      );
    }
  }

  // Check emotions categorized
  const withoutEmotion = quotes.filter(q => !q.emotion);
  if (withoutEmotion.length > quotes.length * 0.3) {
    issues.push(
      `${withoutEmotion.length}/${quotes.length} quotes missing emotion category ` +
      `(MEDO, VERGONHA, CULPA, RAIVA, FRUSTRACAO required)`
    );
  }

  // Check for triangulation (quotes appearing in 2+ platforms)
  const textsByPlatform = new Map<string, Set<string>>();
  for (const q of quotes) {
    const normalized = q.text.toLowerCase().trim().substring(0, 80);
    if (!textsByPlatform.has(normalized)) {
      textsByPlatform.set(normalized, new Set());
    }
    textsByPlatform.get(normalized)!.add(q.platform);
  }
  const triangulated = [...textsByPlatform.values()].filter(s => s.size >= 2).length;
  if (triangulated === 0 && quotes.length > 20) {
    issues.push('No triangulated quotes found (quotes appearing in 2+ platforms)');
  }

  return {
    passed: issues.length === 0,
    tier: 'quality',
    issues,
  };
}

// ==========================================
// 3. Data Transformation
// ==========================================

/**
 * Splits large quote collections into processable chunks.
 * Useful for staying within context limits (~5000 tokens per chunk).
 */
export function chunkQuotes(quotes: Quote[], maxPerChunk: number): Quote[][] {
  if (maxPerChunk <= 0) {
    throw new Error('maxPerChunk must be a positive integer');
  }

  const chunks: Quote[][] = [];
  for (let i = 0; i < quotes.length; i += maxPerChunk) {
    chunks.push(quotes.slice(i, i + maxPerChunk));
  }
  return chunks;
}

/**
 * Normalizes a raw quote string: cleans unicode, strips HTML, trims whitespace.
 */
export function cleanQuote(raw: string): string {
  let cleaned = raw;

  // Strip HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  // Normalize unicode whitespace characters to standard space
  cleaned = cleaned.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ');

  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Collapse multiple spaces/newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Removes exact and near-duplicate quotes using Jaccard similarity.
 * Threshold: similarity > 0.8 means duplicate.
 */
export function deduplicateQuotes(quotes: Quote[]): Quote[] {
  if (quotes.length <= 1) return quotes;

  const unique: Quote[] = [];
  const seenTokenSets: Set<string>[] = [];

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

/**
 * Basic speaker diarization for YouTube transcripts.
 * Separates host speech from commenter speech based on structural cues.
 *
 * Heuristics:
 * - Lines starting with timestamps or speaker labels are parsed
 * - Questions and short statements after a labeled section are commenter
 * - Longer blocks without labels default to host
 */
export function extractSpeakers(transcript: string): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  const lines = transcript.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let currentSpeaker: 'host' | 'commenter' | 'unknown' = 'host';
  let currentText: string[] = [];
  let currentTimestamp: string | undefined;

  function flushSegment(): void {
    if (currentText.length > 0) {
      segments.push({
        speaker: currentSpeaker,
        text: currentText.join(' ').trim(),
        timestamp_hint: currentTimestamp,
      });
      currentText = [];
    }
  }

  function classifySpeaker(label: string): 'host' | 'commenter' | 'unknown' {
    const lower = label.toLowerCase().trim();
    if (
      lower.includes('host') ||
      lower.includes('presenter') ||
      lower.includes('narrator') ||
      lower.includes('speaker 1') ||
      lower.startsWith('dr') ||
      lower.includes('expert')
    ) {
      return 'host';
    }
    if (
      lower.includes('comment') ||
      lower.includes('viewer') ||
      lower.includes('audience') ||
      lower.includes('caller') ||
      lower.includes('user') ||
      lower.includes('speaker 2')
    ) {
      return 'commenter';
    }
    return 'unknown';
  }

  for (const line of lines) {
    let workingLine = line;

    // Step 1: Strip timestamp prefix if present
    const timestampMatch = workingLine.match(
      /^[\[(]?(\d{1,2}:\d{2}(?::\d{2})?)[\])]?\s*[-:]?\s*/
    );
    if (timestampMatch) {
      flushSegment();
      currentTimestamp = timestampMatch[1];
      workingLine = workingLine.substring(timestampMatch[0].length).trim();
    }

    // Step 2: Check for speaker label on the (potentially timestamp-stripped) line
    // Matches: "Host:", "[Name]:", "Speaker 1:", "Dr. Klaus:"
    const speakerMatch = workingLine.match(
      /^(?:\[([^\]]+)\]|([A-Za-z][A-Za-z0-9.\s]*?))\s*:\s+/
    );
    if (speakerMatch) {
      if (!timestampMatch) {
        // Only flush if we did not already flush for the timestamp
        flushSegment();
      }
      const label = speakerMatch[1] || speakerMatch[2];
      currentSpeaker = classifySpeaker(label);
      const remainder = workingLine.substring(speakerMatch[0].length).trim();
      if (remainder) {
        currentText.push(remainder);
      }
    } else if (timestampMatch) {
      // Had a timestamp but no speaker label — keep the remainder
      if (workingLine) {
        currentText.push(workingLine);
      }
    } else {
      // No timestamp, no speaker label — use heuristics
      if (
        line.length < 100 &&
        (line.endsWith('?') || line.startsWith('@') || line.startsWith('>'))
      ) {
        flushSegment();
        segments.push({
          speaker: 'commenter',
          text: line.replace(/^[@>]\s*/, '').trim(),
          timestamp_hint: currentTimestamp,
        });
      } else {
        currentText.push(line);
      }
    }
  }

  // Flush last segment
  flushSegment();

  return segments;
}

// ==========================================
// 4. Progress Tracking
// ==========================================

/**
 * Returns collection progress per platform: total, valid, rejected counts.
 * Reads from the resume state and checks processed files for validation info.
 */
export function getCollectionProgress(offerPath: string): CollectionProgress[] {
  const progress: CollectionProgress[] = [];
  const resumeState = getResumeState(offerPath);

  const allPlatforms = new Set([
    ...REQUIRED_PLATFORMS,
    ...(resumeState ? Object.keys(resumeState.quotes_per_platform) : []),
  ]);

  for (const platform of allPlatforms) {
    const total = resumeState?.quotes_per_platform[platform] || 0;

    // Try to read rejection count from processed files
    let rejected = 0;
    const rejectionFile = join(
      ECOSYSTEM_ROOT,
      offerPath,
      'research',
      'voc',
      'processed',
      `${platform}-rejections.json`
    );

    if (existsSync(rejectionFile)) {
      try {
        const rejections = JSON.parse(readFileSync(rejectionFile, 'utf-8'));
        rejected = Array.isArray(rejections) ? rejections.length : (rejections.count || 0);
      } catch {
        // Ignore parse errors
      }
    }

    progress.push({
      platform,
      total,
      valid: Math.max(0, total - rejected),
      rejected,
    });
  }

  return progress;
}

// ==========================================
// Internal Helpers
// ==========================================

/**
 * Tokenizes text into lowercase word tokens for Jaccard similarity.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Calculates Jaccard similarity between two token sets.
 * Returns a value between 0 (no overlap) and 1 (identical).
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
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

/**
 * Detects spam/bot content using heuristic patterns.
 */
function isSpamContent(text: string): boolean {
  const lower = text.toLowerCase();

  // Common spam patterns
  const spamPatterns = [
    /https?:\/\/\S+\s+https?:\/\/\S+/i,  // Multiple URLs
    /click\s+here|visit\s+my|check\s+out\s+my\s+profile/i,
    /earn\s+\$?\d+.*per\s+(day|hour|week)/i,
    /free\s+gift|you\s+won|congratulations.*winner/i,
    /dm\s+me|inbox\s+me|whatsapp\s+me/i,
    /subscribe\s+to\s+my|follow\s+my/i,
  ];

  if (spamPatterns.some(p => p.test(lower))) return true;

  // Excessive emoji (more than 5 in a row)
  const emojiSequence = text.match(
    /(?:[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*){5,}/u
  );
  if (emojiSequence) return true;

  // Extremely short and meaningless
  if (text.length < 5) return true;

  return false;
}

/**
 * Detects brand/influencer content (not authentic VOC).
 */
function isBrandContent(text: string): boolean {
  const lower = text.toLowerCase();

  const brandPatterns = [
    /use\s+code\s+\w+\s+for/i,
    /sponsored|parceria|publi|#ad\b/i,
    /link\s+na\s+bio|link\s+in\s+bio/i,
    /\baffiliate\b.*\blink\b/i,
    /coupon\s+code|codigo\s+de\s+desconto/i,
  ];

  return brandPatterns.some(p => p.test(lower));
}

/**
 * Counts how many quotes in the list are duplicates (exact or near-match).
 */
function findDuplicateCount(quotes: Quote[]): number {
  const tokenSets = quotes.map(q => new Set(tokenize(q.text)));
  let duplicates = 0;

  for (let i = 1; i < tokenSets.length; i++) {
    for (let j = 0; j < i; j++) {
      if (jaccardSimilarity(tokenSets[i], tokenSets[j]) > 0.8) {
        duplicates++;
        break; // Count each duplicate only once
      }
    }
  }

  return duplicates;
}

// ==========================================
// VOC Squad Merge (AIOS S6.10)
// ==========================================

export interface VocSquadResult {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'reddit' | 'amazon';
  quotes: Quote[];
  patterns: Array<{
    pattern: string;
    frequency: 'alta' | 'média' | 'baixa';
    examples: string[];
  }>;
  dreAverage: number;
}

export interface MergedVocResult {
  totalQuotes: number;
  uniqueQuotes: Quote[];
  triangulatedInsights: Array<{
    insight: string;
    platforms: string[];
    dreAverage: number;
  }>;
  patternsByPlatform: Record<string, VocSquadResult['patterns']>;
  consolidationMeta: {
    mergedAt: string;
    platformsCovered: string[];
    triangulationRate: number;
    duplicatesRemoved: number;
  };
}

/**
 * Merge results from 5 VOC Squad analysts.
 * - Dedup quotes by Jaccard > 0.8
 * - Triangulate insights across platforms
 * - Calculate average DRE
 * - Generate consolidated metadata
 *
 * Part of AIOS Upgrade Plan v4.0 § S6.10
 */
export function mergeVocSquadResults(results: VocSquadResult[]): MergedVocResult {
  // Collect all quotes
  const allQuotes: Quote[] = [];
  const patternsByPlatform: Record<string, VocSquadResult['patterns']> = {};

  for (const result of results) {
    allQuotes.push(...result.quotes);
    patternsByPlatform[result.platform] = result.patterns;
  }

  // Dedup quotes using existing dedupQuotes function
  const uniqueQuotes = dedupQuotes(allQuotes, 0.8);
  const duplicatesRemoved = allQuotes.length - uniqueQuotes.length;

  // Group quotes by emotion/theme for triangulation
  const insightGroups: Map<string, { quotes: Quote[]; platforms: Set<string> }> = new Map();

  for (const quote of uniqueQuotes) {
    const key = quote.emotion || 'OTHER';
    if (!insightGroups.has(key)) {
      insightGroups.set(key, { quotes: [], platforms: new Set() });
    }
    const group = insightGroups.get(key)!;
    group.quotes.push(quote);
    group.platforms.add(quote.platform);
  }

  // Identify triangulated insights (3+ platforms)
  const triangulatedInsights: MergedVocResult['triangulatedInsights'] = [];

  for (const [insight, group] of insightGroups) {
    if (group.platforms.size >= 3) {
      const avgDre = group.quotes.reduce((sum, q) => sum + (q.intensity || 3), 0) / group.quotes.length;
      triangulatedInsights.push({
        insight,
        platforms: Array.from(group.platforms),
        dreAverage: Math.round(avgDre * 10) / 10,
      });
    }
  }

  // Calculate triangulation rate
  const triangulatedQuotesCount = triangulatedInsights.reduce(
    (sum, ins) => sum + insightGroups.get(ins.insight)!.quotes.length,
    0
  );
  const triangulationRate = uniqueQuotes.length > 0
    ? Math.round((triangulatedQuotesCount / uniqueQuotes.length) * 100)
    : 0;

  return {
    totalQuotes: allQuotes.length,
    uniqueQuotes,
    triangulatedInsights,
    patternsByPlatform,
    consolidationMeta: {
      mergedAt: new Date().toISOString(),
      platformsCovered: results.map(r => r.platform),
      triangulationRate,
      duplicatesRemoved,
    },
  };
}
