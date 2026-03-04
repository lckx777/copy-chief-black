/**
 * Self-Learning Feedback Loop (v1.0)
 *
 * Tracks validation outcomes over time and generates insights about
 * patterns in copy quality. Helps the system learn from past reviews
 * to improve future production.
 *
 * Storage:
 *   ~/.claude/learning/validation-events.json  (array of ValidationEvent)
 *   ~/.claude/learning/insights.json           (array of LearningInsight)
 *
 * Dependencies: Node.js builtins only (fs, path). Zero npm deps.
 *
 * Created: 2026-02-24
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOME = homedir();
const LEARNING_DIR = join(HOME, ".claude", "learning");
const EVENTS_FILE = join(LEARNING_DIR, "validation-events.json");
const INSIGHTS_FILE = join(LEARNING_DIR, "insights.json");

const MAX_EVENTS = 1000;
const INSIGHT_TRIGGER_INTERVAL = 10;
const MIN_EVENTS_FOR_INSIGHT = 5;
const FULL_CONFIDENCE_THRESHOLD = 20;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationEvent {
  timestamp: string;
  offer_path: string;
  deliverable_type: string;
  phase: string;
  expert_used?: string;
  tool: string;
  score: number;
  iteration: number;
  criteria_failed: string[];
  passed: boolean;
}

export interface LearningInsight {
  id: string;
  type: "pattern" | "performance" | "bottleneck" | "trend";
  description: string;
  confidence: number;
  data_points: number;
  recommendation?: string;
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function ensureDir(): void {
  if (!existsSync(LEARNING_DIR)) {
    mkdirSync(LEARNING_DIR, { recursive: true });
  }
}

function readEvents(): ValidationEvent[] {
  ensureDir();
  if (!existsSync(EVENTS_FILE)) return [];
  try {
    const raw = readFileSync(EVENTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ValidationEvent[]): void {
  ensureDir();
  writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
}

function readInsights(): LearningInsight[] {
  ensureDir();
  if (!existsSync(INSIGHTS_FILE)) return [];
  try {
    const raw = readFileSync(INSIGHTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeInsights(insights: LearningInsight[]): void {
  ensureDir();
  writeFileSync(INSIGHTS_FILE, JSON.stringify(insights, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function confidence(dataPoints: number): number {
  return Math.min(1, dataPoints / FULL_CONFIDENCE_THRESHOLD);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function hourOf(timestamp: string): number {
  try {
    return new Date(timestamp).getHours();
  } catch {
    return 12; // fallback to noon
  }
}

function daysAgo(timestamp: string): number {
  try {
    const diff = Date.now() - new Date(timestamp).getTime();
    return diff / (1000 * 60 * 60 * 24);
  } catch {
    return 999;
  }
}

// ---------------------------------------------------------------------------
// recordValidation
// ---------------------------------------------------------------------------

export function recordValidation(event: ValidationEvent): void {
  const events = readEvents();
  events.push(event);

  // FIFO: trim to MAX_EVENTS
  while (events.length > MAX_EVENTS) {
    events.shift();
  }

  writeEvents(events);

  // Auto-generate insights every INSIGHT_TRIGGER_INTERVAL new events
  if (events.length >= MIN_EVENTS_FOR_INSIGHT && events.length % INSIGHT_TRIGGER_INTERVAL === 0) {
    const insights = generateInsights();
    writeInsights(insights);
  }
}

// ---------------------------------------------------------------------------
// generateInsights
// ---------------------------------------------------------------------------

export function generateInsights(): LearningInsight[] {
  const events = readEvents();
  if (events.length < MIN_EVENTS_FOR_INSIGHT) return [];

  const now = new Date().toISOString();
  const insights: LearningInsight[] = [];

  // -----------------------------------------------------------------------
  // 1. First-iteration failure patterns
  // -----------------------------------------------------------------------
  const firstIterEvents = events.filter((e) => e.iteration === 1);
  const failedFirst = firstIterEvents.filter((e) => !e.passed);

  if (failedFirst.length >= MIN_EVENTS_FOR_INSIGHT) {
    // Count criteria failures on first iteration by deliverable_type
    const byDeliverableAndCriteria: Record<string, Record<string, number>> = {};

    for (const ev of failedFirst) {
      if (!byDeliverableAndCriteria[ev.deliverable_type]) {
        byDeliverableAndCriteria[ev.deliverable_type] = {};
      }
      for (const criterion of ev.criteria_failed) {
        byDeliverableAndCriteria[ev.deliverable_type][criterion] =
          (byDeliverableAndCriteria[ev.deliverable_type][criterion] || 0) + 1;
      }
    }

    for (const [delivType, criteria] of Object.entries(byDeliverableAndCriteria)) {
      const sorted = Object.entries(criteria).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [topCriterion, count] = sorted[0];
        const totalFirstIter = firstIterEvents.filter((e) => e.deliverable_type === delivType).length;
        const failRate = totalFirstIter > 0 ? round2((count / totalFirstIter) * 100) : 0;

        if (count >= 3) {
          insights.push({
            id: `first-iter-${delivType}-${topCriterion}`.replace(/\s+/g, "-").toLowerCase(),
            type: "pattern",
            description: `"${delivType}" fails "${topCriterion}" on 1st iteration ${failRate}% of the time (${count}/${totalFirstIter} events).`,
            confidence: confidence(count),
            data_points: count,
            recommendation: `Pre-check "${topCriterion}" criteria before submitting "${delivType}" for validation. Consider adding a self-review step.`,
            generated_at: now,
          });
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 2. Expert performance
  // -----------------------------------------------------------------------
  const eventsWithExpert = events.filter((e) => e.expert_used);
  if (eventsWithExpert.length >= MIN_EVENTS_FOR_INSIGHT) {
    const byExpert = groupBy(eventsWithExpert, (e) => e.expert_used!);
    const expertAvgs: { expert: string; avg: number; count: number }[] = [];

    for (const [expert, evts] of Object.entries(byExpert)) {
      const scores = evts.map((e) => e.score);
      expertAvgs.push({ expert, avg: round2(mean(scores)), count: evts.length });
    }

    expertAvgs.sort((a, b) => b.avg - a.avg);

    if (expertAvgs.length >= 2) {
      const best = expertAvgs[0];
      const overall = round2(mean(eventsWithExpert.map((e) => e.score)));
      const diff = round2(((best.avg - overall) / overall) * 100);

      insights.push({
        id: `expert-performance-${best.expert}`.replace(/\s+/g, "-").toLowerCase(),
        type: "performance",
        description: `Expert "${best.expert}" produces scores ${diff > 0 ? diff + "% above" : Math.abs(diff) + "% below"} average (${best.avg} vs ${overall} overall, ${best.count} events).`,
        confidence: confidence(best.count),
        data_points: best.count,
        recommendation: diff > 5 ? `Prefer expert "${best.expert}" for high-stakes deliverables.` : undefined,
        generated_at: now,
      });

      // Also report per deliverable type for top expert
      const bestExpertByType = groupBy(
        eventsWithExpert.filter((e) => e.expert_used === best.expert),
        (e) => e.deliverable_type
      );

      for (const [delivType, evts] of Object.entries(bestExpertByType)) {
        if (evts.length >= 3) {
          const typeAvg = round2(mean(evts.map((e) => e.score)));
          const globalTypeAvg = round2(
            mean(eventsWithExpert.filter((e) => e.deliverable_type === delivType).map((e) => e.score))
          );
          const typeDiff = round2(((typeAvg - globalTypeAvg) / (globalTypeAvg || 1)) * 100);

          if (Math.abs(typeDiff) >= 10) {
            insights.push({
              id: `expert-${best.expert}-${delivType}`.replace(/\s+/g, "-").toLowerCase(),
              type: "performance",
              description: `Expert "${best.expert}" scores ${typeDiff > 0 ? typeDiff + "% higher" : Math.abs(typeDiff) + "% lower"} for "${delivType}" (${typeAvg} vs ${globalTypeAvg} avg).`,
              confidence: confidence(evts.length),
              data_points: evts.length,
              recommendation:
                typeDiff > 10
                  ? `Route "${delivType}" tasks to expert "${best.expert}" when possible.`
                  : undefined,
              generated_at: now,
            });
          }
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 3. Phase bottlenecks
  // -----------------------------------------------------------------------
  const byPhase = groupBy(events, (e) => e.phase);
  const phaseStats: { phase: string; avgIter: number; count: number }[] = [];

  for (const [phase, evts] of Object.entries(byPhase)) {
    if (evts.length >= MIN_EVENTS_FOR_INSIGHT) {
      phaseStats.push({
        phase,
        avgIter: round2(mean(evts.map((e) => e.iteration))),
        count: evts.length,
      });
    }
  }

  if (phaseStats.length >= 2) {
    phaseStats.sort((a, b) => b.avgIter - a.avgIter);
    const worst = phaseStats[0];
    const best = phaseStats[phaseStats.length - 1];
    const ratio = best.avgIter > 0 ? round2(worst.avgIter / best.avgIter) : worst.avgIter;

    insights.push({
      id: `phase-bottleneck-${worst.phase}`,
      type: "bottleneck",
      description: `"${worst.phase}" phase averages ${worst.avgIter} iterations (${ratio}x more than "${best.phase}" at ${best.avgIter}).`,
      confidence: confidence(worst.count),
      data_points: worst.count,
      recommendation: `Invest in pre-validation checklists for "${worst.phase}" to reduce iteration count.`,
      generated_at: now,
    });
  }

  // -----------------------------------------------------------------------
  // 4. Time patterns
  // -----------------------------------------------------------------------
  if (events.length >= MIN_EVENTS_FOR_INSIGHT) {
    const byHour = groupBy(events, (e) => String(hourOf(e.timestamp)));
    const hourAvgs: { hour: number; avg: number; count: number }[] = [];

    for (const [hour, evts] of Object.entries(byHour)) {
      if (evts.length >= 3) {
        hourAvgs.push({
          hour: parseInt(hour, 10),
          avg: round2(mean(evts.map((e) => e.score))),
          count: evts.length,
        });
      }
    }

    if (hourAvgs.length >= 2) {
      hourAvgs.sort((a, b) => b.avg - a.avg);
      const bestHour = hourAvgs[0];
      const worstHour = hourAvgs[hourAvgs.length - 1];
      const diff = round2(((bestHour.avg - worstHour.avg) / (worstHour.avg || 1)) * 100);

      if (diff >= 5) {
        insights.push({
          id: "time-pattern-hourly",
          type: "pattern",
          description: `Scores are ${diff}% higher at ${bestHour.hour}:00 (avg ${bestHour.avg}) vs ${worstHour.hour}:00 (avg ${worstHour.avg}).`,
          confidence: confidence(Math.min(bestHour.count, worstHour.count)),
          data_points: bestHour.count + worstHour.count,
          recommendation: `Schedule critical validations around ${bestHour.hour}:00 when possible.`,
          generated_at: now,
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Criterion weak spots
  // -----------------------------------------------------------------------
  const allFailedCriteria: Record<string, number> = {};
  let totalFailed = 0;

  for (const ev of events) {
    for (const criterion of ev.criteria_failed) {
      allFailedCriteria[criterion] = (allFailedCriteria[criterion] || 0) + 1;
      totalFailed++;
    }
  }

  const criterionSorted = Object.entries(allFailedCriteria).sort((a, b) => b[1] - a[1]);

  for (const [criterion, count] of criterionSorted.slice(0, 5)) {
    if (count >= MIN_EVENTS_FOR_INSIGHT) {
      const failRate = round2((count / events.length) * 100);
      insights.push({
        id: `criterion-weak-${criterion}`.replace(/\s+/g, "-").toLowerCase(),
        type: "pattern",
        description: `"${criterion}" fails in ${failRate}% of all validations (${count}/${events.length} events).`,
        confidence: confidence(count),
        data_points: count,
        recommendation: `Add a dedicated self-check for "${criterion}" before submitting copy for validation.`,
        generated_at: now,
      });
    }
  }

  // -----------------------------------------------------------------------
  // 6. Improvement trends
  // -----------------------------------------------------------------------
  const recentEvents = events.filter((e) => daysAgo(e.timestamp) <= 30);
  const olderEvents = events.filter((e) => daysAgo(e.timestamp) > 30 && daysAgo(e.timestamp) <= 90);

  if (recentEvents.length >= MIN_EVENTS_FOR_INSIGHT && olderEvents.length >= MIN_EVENTS_FOR_INSIGHT) {
    // Overall pass rate trend
    const recentPassRate = round2(
      (recentEvents.filter((e) => e.passed).length / recentEvents.length) * 100
    );
    const olderPassRate = round2(
      (olderEvents.filter((e) => e.passed).length / olderEvents.length) * 100
    );
    const passRateDelta = round2(recentPassRate - olderPassRate);

    insights.push({
      id: "trend-overall-pass-rate",
      type: "trend",
      description: `Overall pass rate ${passRateDelta > 0 ? "improved" : passRateDelta < 0 ? "declined" : "unchanged"} by ${Math.abs(passRateDelta)}pp (${recentPassRate}% recent vs ${olderPassRate}% older).`,
      confidence: confidence(Math.min(recentEvents.length, olderEvents.length)),
      data_points: recentEvents.length + olderEvents.length,
      recommendation:
        passRateDelta < -5
          ? "Quality is declining. Review recent validation failures for systemic issues."
          : passRateDelta > 5
            ? "Quality is improving. Current workflow adjustments are working."
            : undefined,
      generated_at: now,
    });

    // Per deliverable type trend
    const recentByType = groupBy(recentEvents, (e) => e.deliverable_type);
    const olderByType = groupBy(olderEvents, (e) => e.deliverable_type);

    for (const [delivType, recentEvts] of Object.entries(recentByType)) {
      const olderEvts = olderByType[delivType];
      if (!olderEvts || recentEvts.length < 3 || olderEvts.length < 3) continue;

      const recentAvgIter = round2(mean(recentEvts.map((e) => e.iteration)));
      const olderAvgIter = round2(mean(olderEvts.map((e) => e.iteration)));
      const iterDelta = round2(((olderAvgIter - recentAvgIter) / (olderAvgIter || 1)) * 100);

      if (Math.abs(iterDelta) >= 10) {
        insights.push({
          id: `trend-${delivType}-iterations`.replace(/\s+/g, "-").toLowerCase(),
          type: "trend",
          description: `"${delivType}" now passes ${iterDelta > 0 ? iterDelta + "% faster" : Math.abs(iterDelta) + "% slower"} than 30+ days ago (${recentAvgIter} vs ${olderAvgIter} avg iterations).`,
          confidence: confidence(Math.min(recentEvts.length, olderEvts.length)),
          data_points: recentEvts.length + olderEvts.length,
          generated_at: now,
        });
      }
    }
  }

  // Persist and return
  writeInsights(insights);
  return insights;
}

// ---------------------------------------------------------------------------
// getInsights
// ---------------------------------------------------------------------------

export function getInsights(): LearningInsight[] {
  return readInsights();
}

// ---------------------------------------------------------------------------
// getPerformanceReport
// ---------------------------------------------------------------------------

export function getPerformanceReport(offerPath?: string): string {
  const allEvents = readEvents();
  const events = offerPath ? allEvents.filter((e) => e.offer_path === offerPath) : allEvents;

  if (events.length === 0) {
    return offerPath
      ? `No validation events found for offer "${offerPath}".`
      : "No validation events recorded yet.";
  }

  const lines: string[] = [];
  const sep = "\u2500".repeat(60);

  // ---- Header ----
  lines.push(sep);
  lines.push(
    offerPath
      ? `  PERFORMANCE REPORT \u2014 ${offerPath}`
      : "  PERFORMANCE REPORT \u2014 All Offers"
  );
  lines.push(sep);
  lines.push("");

  // ---- Summary ----
  const totalPassed = events.filter((e) => e.passed).length;
  const passRate = round2((totalPassed / events.length) * 100);
  const avgScore = round2(mean(events.map((e) => e.score)));
  const avgIter = round2(mean(events.map((e) => e.iteration)));

  lines.push("## Summary");
  lines.push(`  Total validations:  ${events.length}`);
  lines.push(`  Pass rate:          ${passRate}% (${totalPassed}/${events.length})`);
  lines.push(`  Average score:      ${avgScore}/10`);
  lines.push(`  Average iterations: ${avgIter}`);
  lines.push("");

  // ---- Average iterations to pass by deliverable type ----
  lines.push("## Avg Iterations to Pass \u2014 by Deliverable Type");
  const passedEvents = events.filter((e) => e.passed);
  const byDelivType = groupBy(passedEvents, (e) => e.deliverable_type);
  const delivStats = Object.entries(byDelivType)
    .map(([type, evts]) => ({
      type,
      avgIter: round2(mean(evts.map((e) => e.iteration))),
      count: evts.length,
    }))
    .sort((a, b) => b.avgIter - a.avgIter);

  for (const stat of delivStats) {
    lines.push(`  ${stat.type.padEnd(25)} ${stat.avgIter} iters  (${stat.count} events)`);
  }
  if (delivStats.length === 0) lines.push("  (no passed events yet)");
  lines.push("");

  // ---- Top 3 most-failed criteria ----
  lines.push("## Top 3 Most-Failed Criteria");
  const criterionCounts: Record<string, number> = {};
  for (const ev of events) {
    for (const c of ev.criteria_failed) {
      criterionCounts[c] = (criterionCounts[c] || 0) + 1;
    }
  }
  const topCriteria = Object.entries(criterionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (let i = 0; i < topCriteria.length; i++) {
    const [criterion, count] = topCriteria[i];
    const pct = round2((count / events.length) * 100);
    lines.push(`  ${i + 1}. ${criterion} \u2014 ${count} failures (${pct}% of validations)`);
  }
  if (topCriteria.length === 0) lines.push("  (no failures recorded)");
  lines.push("");

  // ---- Top 3 best-performing experts ----
  lines.push("## Top 3 Best-Performing Experts");
  const expertEvents = events.filter((e) => e.expert_used);
  const byExpert = groupBy(expertEvents, (e) => e.expert_used!);
  const expertStats = Object.entries(byExpert)
    .map(([expert, evts]) => ({
      expert,
      avgScore: round2(mean(evts.map((e) => e.score))),
      count: evts.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3);

  for (let i = 0; i < expertStats.length; i++) {
    const s = expertStats[i];
    lines.push(`  ${i + 1}. ${s.expert} \u2014 avg ${s.avgScore}/10 (${s.count} events)`);
  }
  if (expertStats.length === 0) lines.push("  (no expert data recorded)");
  lines.push("");

  // ---- Recent trend ----
  lines.push("## Recent Trend (last 14d vs prior 14d)");
  const last14 = events.filter((e) => daysAgo(e.timestamp) <= 14);
  const prior14 = events.filter((e) => daysAgo(e.timestamp) > 14 && daysAgo(e.timestamp) <= 28);

  if (last14.length >= 3 && prior14.length >= 3) {
    const recentRate = round2((last14.filter((e) => e.passed).length / last14.length) * 100);
    const priorRate = round2((prior14.filter((e) => e.passed).length / prior14.length) * 100);
    const delta = round2(recentRate - priorRate);
    const direction = delta > 2 ? "IMPROVING" : delta < -2 ? "DECLINING" : "STABLE";

    lines.push(`  Last 14d pass rate:  ${recentRate}% (${last14.length} events)`);
    lines.push(`  Prior 14d pass rate: ${priorRate}% (${prior14.length} events)`);
    lines.push(`  Direction:           ${direction} (${delta > 0 ? "+" : ""}${delta}pp)`);
  } else {
    lines.push("  Insufficient data for trend analysis (need 3+ events in each 14d window).");
  }
  lines.push("");
  lines.push(sep);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// feedToWIE
// ---------------------------------------------------------------------------

export function feedToWIE(): Record<string, any> {
  const events = readEvents();

  if (events.length === 0) {
    return {
      avg_pass_rate: 0,
      avg_iterations: 0,
      weak_criteria: [],
      strong_experts: [],
      time_patterns: { best_hour: -1, worst_hour: -1 },
    };
  }

  // Average pass rate
  const avgPassRate = round2((events.filter((e) => e.passed).length / events.length) * 100);

  // Average iterations
  const avgIterations = round2(mean(events.map((e) => e.iteration)));

  // Weak criteria (top 3 most-failed)
  const criterionCounts: Record<string, number> = {};
  for (const ev of events) {
    for (const c of ev.criteria_failed) {
      criterionCounts[c] = (criterionCounts[c] || 0) + 1;
    }
  }
  const weakCriteria = Object.entries(criterionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  // Strong experts (top 3 by avg score, min 3 events)
  const expertEvents = events.filter((e) => e.expert_used);
  const byExpert = groupBy(expertEvents, (e) => e.expert_used!);
  const strongExperts = Object.entries(byExpert)
    .filter(([, evts]) => evts.length >= 3)
    .map(([expert, evts]) => ({
      expert,
      avgScore: mean(evts.map((e) => e.score)),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map((s) => s.expert);

  // Time patterns
  const byHour = groupBy(events, (e) => String(hourOf(e.timestamp)));
  const hourAvgs = Object.entries(byHour)
    .filter(([, evts]) => evts.length >= 3)
    .map(([hour, evts]) => ({
      hour: parseInt(hour, 10),
      avg: mean(evts.map((e) => e.score)),
    }))
    .sort((a, b) => b.avg - a.avg);

  const bestHour = hourAvgs.length > 0 ? hourAvgs[0].hour : -1;
  const worstHour = hourAvgs.length > 0 ? hourAvgs[hourAvgs.length - 1].hour : -1;

  return {
    avg_pass_rate: avgPassRate,
    avg_iterations: avgIterations,
    weak_criteria: weakCriteria,
    strong_experts: strongExperts,
    time_patterns: { best_hour: bestHour, worst_hour: worstHour },
  };
}
