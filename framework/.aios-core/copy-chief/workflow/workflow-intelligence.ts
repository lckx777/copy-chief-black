/**
 * Workflow Intelligence Engine (WIE) v1.0
 * Adapted from aios-core/workflow-intelligence for Copy Chief ecosystem.
 *
 * Components:
 * 1. Confidence Scorer — scores pattern suggestions (0-1) with decay
 * 2. Wave Analysis — detects temporal patterns (peak hours, day patterns)
 * 3. QA Feedback Loop — tracks if suggestions were followed and outcomes
 *
 * Created: 2026-02-23
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const HOME = process.env.HOME || '';
const WIE_DIR = join(HOME, '.claude/learned-patterns');
const WIE_DATA = join(WIE_DIR, 'wie-data.json');
const PATTERNS_PATH = join(WIE_DIR, 'patterns.yaml');

// ============================================================
// TYPES
// ============================================================

interface ToolUsageEntry {
  tool: string;
  hour: number;
  day: string; // 'Mon','Tue', etc
  timestamp: number;
}

interface SuggestionRecord {
  pattern_id: string;
  suggested_at: number;
  followed: boolean | null; // null = unknown yet
  outcome_score?: number;
}

interface WIEData {
  tool_usage: ToolUsageEntry[];
  suggestions: SuggestionRecord[];
  wave_cache?: {
    peak_hours: number[];
    peak_days: string[];
    computed_at: number;
  };
}

interface PatternEntry {
  id: string;
  title: string;
  sequence: string[];
  count: number;
  status: string;
  benefit: string;
}

// ============================================================
// 1. CONFIDENCE SCORER
// ============================================================

const WEIGHTS = {
  PATTERN_COUNT: 0.30,    // How often the pattern was observed
  RECENCY: 0.25,          // When was it last seen
  CONTEXT_MATCH: 0.25,    // Does current context match
  QA_FEEDBACK: 0.20,      // Did following the suggestion improve scores?
};

export function scoreConfidence(
  pattern: PatternEntry,
  recentTools: string[],
  currentTool: string,
  feedback: SuggestionRecord[]
): number {
  // 1. Pattern count score (log scale, max at 10+)
  const countScore = Math.min(Math.log2(pattern.count + 1) / Math.log2(11), 1.0);

  // 2. Recency score — patterns used recently get higher score
  const relevantRecent = recentTools.filter(t =>
    pattern.sequence.some(s => t.includes(s))
  );
  const recencyScore = relevantRecent.length > 0 ? 0.8 : 0.3;

  // 3. Context match — does the current tool relate to this pattern?
  let contextScore = 0;
  if (pattern.sequence.some(s => currentTool.includes(s))) contextScore = 1.0;
  else if (pattern.sequence.some(s => recentTools.some(t => t.includes(s)))) contextScore = 0.5;

  // 4. QA Feedback score — did suggestions improve outcomes?
  const patternFeedback = feedback.filter(f => f.pattern_id === pattern.id);
  let qaScore = 0.5; // neutral default
  if (patternFeedback.length > 0) {
    const followed = patternFeedback.filter(f => f.followed === true);
    const notFollowed = patternFeedback.filter(f => f.followed === false);
    const followedAvg = followed.length > 0
      ? followed.reduce((sum, f) => sum + (f.outcome_score || 7), 0) / followed.length
      : 0;
    const notFollowedAvg = notFollowed.length > 0
      ? notFollowed.reduce((sum, f) => sum + (f.outcome_score || 5), 0) / notFollowed.length
      : 0;

    if (followed.length > 0 && notFollowed.length > 0) {
      qaScore = followedAvg > notFollowedAvg ? 0.9 : 0.3;
    } else if (followed.length > 0) {
      qaScore = followedAvg >= 8 ? 0.9 : 0.6;
    }
  }

  // Weighted sum
  const raw =
    countScore * WEIGHTS.PATTERN_COUNT +
    recencyScore * WEIGHTS.RECENCY +
    contextScore * WEIGHTS.CONTEXT_MATCH +
    qaScore * WEIGHTS.QA_FEEDBACK;

  return Math.max(0, Math.min(1, raw));
}

// ============================================================
// 2. WAVE ANALYSIS (Temporal Patterns)
// ============================================================

export function analyzeWaves(data: WIEData): {
  peak_hours: number[];
  peak_days: string[];
  total_sessions: number;
} {
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};

  for (const entry of data.tool_usage) {
    hourCounts[entry.hour] = (hourCounts[entry.hour] || 0) + 1;
    dayCounts[entry.day] = (dayCounts[entry.day] || 0) + 1;
  }

  // Find peak hours (top 3)
  const sortedHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h]) => parseInt(h));

  // Find peak days (top 3)
  const sortedDays = Object.entries(dayCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([d]) => d);

  return {
    peak_hours: sortedHours,
    peak_days: sortedDays,
    total_sessions: data.tool_usage.length,
  };
}

// ============================================================
// 3. QA FEEDBACK LOOP
// ============================================================

export function recordSuggestion(patternId: string): void {
  const data = loadWIEData();
  data.suggestions.push({
    pattern_id: patternId,
    suggested_at: Date.now(),
    followed: null,
  });
  // Keep last 100 suggestions
  if (data.suggestions.length > 100) {
    data.suggestions = data.suggestions.slice(-100);
  }
  saveWIEData(data);
}

export function recordFollowed(patternId: string, followed: boolean, score?: number): void {
  const data = loadWIEData();
  // Find most recent unresolved suggestion for this pattern
  for (let i = data.suggestions.length - 1; i >= 0; i--) {
    if (data.suggestions[i].pattern_id === patternId && data.suggestions[i].followed === null) {
      data.suggestions[i].followed = followed;
      data.suggestions[i].outcome_score = score;
      break;
    }
  }
  saveWIEData(data);
}

export function recordToolUsage(toolName: string): void {
  const data = loadWIEData();
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  data.tool_usage.push({
    tool: toolName,
    hour: now.getHours(),
    day: days[now.getDay()],
    timestamp: Date.now(),
  });

  // Keep last 1000 entries
  if (data.tool_usage.length > 1000) {
    data.tool_usage = data.tool_usage.slice(-1000);
  }

  // Invalidate wave cache
  data.wave_cache = undefined;

  saveWIEData(data);
}

// ============================================================
// DATA PERSISTENCE
// ============================================================

export function loadWIEData(): WIEData {
  try {
    if (existsSync(WIE_DATA)) {
      return JSON.parse(readFileSync(WIE_DATA, 'utf8'));
    }
  } catch { /* fresh start */ }
  return { tool_usage: [], suggestions: [] };
}

function saveWIEData(data: WIEData): void {
  mkdirSync(WIE_DIR, { recursive: true });
  writeFileSync(WIE_DATA, JSON.stringify(data, null, 2));
}

// ============================================================
// PATTERN PARSING (shared helper)
// ============================================================

export function parsePatterns(): PatternEntry[] {
  if (!existsSync(PATTERNS_PATH)) return [];
  const content = readFileSync(PATTERNS_PATH, 'utf8');
  const patterns: PatternEntry[] = [];
  let current: Partial<PatternEntry> | null = null;

  for (const line of content.split('\n')) {
    const idMatch = line.match(/^\s{2}(PAT-\d+):/);
    if (idMatch) {
      if (current?.id) patterns.push(current as PatternEntry);
      current = { id: idMatch[1], title: '', sequence: [], count: 0, status: '', benefit: '' };
      continue;
    }
    if (!current) continue;
    const t = line.match(/^\s+title:\s*"(.+)"/); if (t) { current.title = t[1]; continue; }
    const s = line.match(/^\s+sequence:\s*\[(.+)\]/);
    if (s) { current.sequence = s[1].split(',').map(x => x.trim().replace(/['"]/g, '')); continue; }
    const c = line.match(/^\s+count:\s*(\d+)/); if (c) { current.count = parseInt(c[1]); continue; }
    const st = line.match(/^\s+status:\s*(\w+)/); if (st) { current.status = st[1]; continue; }
    const b = line.match(/^\s+benefit:\s*"(.+)"/); if (b) { current.benefit = b[1]; continue; }
  }
  if (current?.id) patterns.push(current as PatternEntry);
  return patterns;
}

// ============================================================
// HIGH-LEVEL API
// ============================================================

export interface ScoredSuggestion {
  pattern: PatternEntry;
  confidence: number;
  message: string;
}

/**
 * Get ranked suggestions for the current context.
 * Returns learned patterns sorted by confidence score.
 */
export function getScoredSuggestions(
  currentTool: string,
  recentTools: string[]
): ScoredSuggestion[] {
  const patterns = parsePatterns().filter(p => p.status === 'learned');
  if (patterns.length === 0) return [];

  const data = loadWIEData();

  return patterns
    .map(pattern => {
      const confidence = scoreConfidence(pattern, recentTools, currentTool, data.suggestions);
      return {
        pattern,
        confidence,
        message: `[WIE ${(confidence * 100).toFixed(0)}%] ${pattern.id}: ${pattern.title} — ${pattern.benefit}`,
      };
    })
    .filter(s => s.confidence > 0.3)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get wave analysis summary for display.
 */
export function getWaveSummary(): string {
  const data = loadWIEData();
  if (data.tool_usage.length < 10) return '';

  const waves = analyzeWaves(data);
  const hours = waves.peak_hours.map(h => `${h}h`).join(', ');
  const days = waves.peak_days.join(', ');

  return `Peak hours: ${hours} | Peak days: ${days} | ${waves.total_sessions} tool calls tracked`;
}

// ============================================================
// G9: ENHANCED WAVE ANALYZER — Productivity by Phase
// ============================================================

interface PhaseProductivity {
  phase: string;
  avg_tools_per_session: number;
  peak_hours: number[];
  avg_score: number;
  total_sessions: number;
}

/**
 * Analyze productivity patterns by HELIX phase.
 * Requires self-learning data for score correlation.
 */
export function analyzePhaseProductivity(): PhaseProductivity[] {
  const data = loadWIEData();
  if (data.tool_usage.length < 20) return [];

  // Categorize tools by phase
  const phaseToolMap: Record<string, string> = {
    firecrawl: 'RESEARCH',
    playwright: 'RESEARCH',
    fb_ad_library: 'RESEARCH',
    voc_search: 'RESEARCH',
    get_phase_context: 'BRIEFING',
    consensus: 'BRIEFING',
    thinkdeep: 'BRIEFING',
    write_chapter: 'PRODUCTION',
    blind_critic: 'PRODUCTION',
    emotional_stress_test: 'PRODUCTION',
    black_validation: 'REVIEW',
    layered_review: 'PRODUCTION',
  };

  const phaseData: Record<string, { hours: number[]; tools: number; sessions: Set<string> }> = {};

  for (const entry of data.tool_usage) {
    let phase = 'OTHER';
    for (const [key, ph] of Object.entries(phaseToolMap)) {
      if (entry.tool.includes(key)) { phase = ph; break; }
    }

    if (!phaseData[phase]) phaseData[phase] = { hours: [], tools: 0, sessions: new Set() };
    phaseData[phase].hours.push(entry.hour);
    phaseData[phase].tools++;
    // Group by day as "session"
    const sessionKey = `${entry.day}-${entry.hour}`;
    phaseData[phase].sessions.add(sessionKey);
  }

  // Try to load self-learning scores
  let phaseScores: Record<string, number[]> = {};
  try {
    const learningPath = join(HOME, '.claude/learning/validation-events.json');
    if (existsSync(learningPath)) {
      const events = JSON.parse(readFileSync(learningPath, 'utf-8'));
      if (Array.isArray(events)) {
        for (const ev of events) {
          const ph = ev.phase || 'OTHER';
          if (!phaseScores[ph]) phaseScores[ph] = [];
          if (typeof ev.score === 'number') phaseScores[ph].push(ev.score);
        }
      }
    }
  } catch { /* no scores available */ }

  return Object.entries(phaseData).map(([phase, pd]) => {
    // Peak hours for this phase
    const hourCounts: Record<number, number> = {};
    for (const h of pd.hours) hourCounts[h] = (hourCounts[h] || 0) + 1;
    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([h]) => parseInt(h));

    const scores = phaseScores[phase] || [];
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    return {
      phase,
      avg_tools_per_session: pd.sessions.size > 0 ? pd.tools / pd.sessions.size : 0,
      peak_hours: peakHours,
      avg_score: Math.round(avgScore * 10) / 10,
      total_sessions: pd.sessions.size,
    };
  }).sort((a, b) => b.total_sessions - a.total_sessions);
}

/**
 * Get a formatted productivity report.
 */
export function getProductivityReport(): string {
  const phases = analyzePhaseProductivity();
  if (phases.length === 0) return 'Insufficient data for productivity analysis.';

  const lines = ['=== Productivity by Phase ==='];
  for (const p of phases) {
    const hours = p.peak_hours.map(h => `${h}h`).join(',');
    const score = p.avg_score > 0 ? ` | Avg Score: ${p.avg_score}` : '';
    lines.push(`${p.phase}: ${p.avg_tools_per_session.toFixed(1)} tools/session | Peak: ${hours} | Sessions: ${p.total_sessions}${score}`);
  }

  return lines.join('\n');
}
