/**
 * dashboard-client.ts — Copy Chief Observability Module
 * Part of AIOS Core: copy-chief/observability
 *
 * Sends tool events to the Copy Chief Dashboard server.
 * Non-blocking: fire-and-forget HTTP POST.
 *
 * Handles:
 * - Session ID management (per-PPID, persistent across hooks)
 * - Stale session cleanup (8h TTL)
 * - Score extraction from validation tool outputs
 * - Offer/phase detection from file paths and tool outputs
 * - HTTP event + metrics emission to dashboard
 *
 * Created: 2026-02-23
 * Updated: 2026-02-25 — Added duration_ms tracking via companion timestamp file
 * Refactored: 2026-03-02 (AIOS Core module extraction)
 */

import { readFileSync, existsSync, unlinkSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { translateEvent } from "./semantic-translator";

// ─── Constants ───────────────────────────────────────────────────────────────

export const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:4001";
export const TOOL_START_DIR = join(process.env.HOME || "", ".claude/session-state/tool-starts");
export const SESSION_DIR = join(process.env.HOME || "", ".claude/session-state/sessions");

export const VALIDATION_TOOLS = [
  "mcp__copywriting__blind_critic",
  "mcp__copywriting__emotional_stress_test",
  "mcp__copywriting__black_validation",
  "mcp__copywriting__layered_review",
];

export const TOOL_SPECIFIC_SCORE_PATTERNS: Record<string, RegExp[]> = {
  mcp__copywriting__blind_critic: [
    /\*\*(?:Average|Overall|Final)\s*(?:Score)?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Overall|Average|Final)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i,
  ],
  mcp__copywriting__emotional_stress_test: [
    /\*\*(?:Genericidade|Overall|Score)\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Genericidade|Overall)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i,
  ],
  mcp__copywriting__black_validation: [
    /\*\*(?:Final|BLACK|Overall)\s*(?:Score)?\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Final|BLACK|Overall)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i,
  ],
  mcp__copywriting__layered_review: [
    /\*\*(?:Overall|Final|Score)\*\*[:\s]*(\d+(?:\.\d+)?)/i,
    /(?:Overall|Final)\s*(?:Score)?[:\s]+(\d+(?:\.\d+)?)/i,
  ],
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string | Record<string, unknown>;
  is_error?: boolean;
}

export interface DashboardPayload {
  type: string;
  timestamp: number;
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_result?: string;
  is_error: boolean;
  duration_ms?: number;
  offer?: string;
  phase?: string;
  data: Record<string, unknown>;
  semantic_description?: string;
  significance?: 'milestone' | 'significant' | 'noise';
  semantic_data?: Record<string, unknown>;
}

export interface MetricsPayload {
  offer: string;
  tool: string;
  score: number;
  copy_type?: string;
  deliverable?: string;
  session_id: string;
}

// ─── Session Management ───────────────────────────────────────────────────────

/**
 * Get or create a stable session ID for the current Claude Code process.
 * Uses CLAUDE_SESSION_ID env var if available, otherwise generates one based on
 * the parent process PID + date, persisted to a PER-PPID file so multiple
 * Claude Code tabs each maintain their own session ID.
 *
 * Fix (2026-02-27): Previously used a single shared file — each new tab
 * overwrote the previous session ID, causing the dashboard to show only 1 session.
 * Now uses one file per PPID: sessions/session-{ppid}.json
 */
export function getSessionId(): string {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  if (process.env.SESSION_ID) return process.env.SESSION_ID;

  const ppid = process.ppid || process.pid;
  const sessionFile = join(SESSION_DIR, `session-${ppid}.json`);

  try {
    if (existsSync(sessionFile)) {
      const data = JSON.parse(readFileSync(sessionFile, "utf-8"));
      if (data.ts && Date.now() - data.ts < 4 * 60 * 60 * 1000) {
        return data.id;
      }
    }
  } catch { /* regenerate */ }

  const now = new Date();
  const id = `claude-${ppid}-${now.toISOString().slice(0, 16).replace(/[T:]/g, "-")}`;
  try {
    if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });
    writeFileSync(sessionFile, JSON.stringify({ id, ts: Date.now(), ppid }));
  } catch { /* best effort */ }
  return id;
}

/**
 * Cleanup stale session files (older than 8 hours).
 * Called once per hook invocation — lightweight scan.
 */
export function cleanupStaleSessions(): void {
  try {
    if (!existsSync(SESSION_DIR)) return;
    const now = Date.now();
    const maxAge = 8 * 60 * 60 * 1000;
    for (const file of readdirSync(SESSION_DIR)) {
      if (!file.startsWith("session-") || !file.endsWith(".json")) continue;
      const filePath = join(SESSION_DIR, file);
      try {
        const data = JSON.parse(readFileSync(filePath, "utf-8"));
        if (data.ts && now - data.ts > maxAge) {
          unlinkSync(filePath);
        }
      } catch {
        try { unlinkSync(filePath); } catch {}
      }
    }
  } catch { /* best effort */ }
}

// ─── Duration Tracking ────────────────────────────────────────────────────────

export function getDurationMs(toolName: string): number | undefined {
  const startFile = join(TOOL_START_DIR, `${toolName.replace(/[^a-zA-Z0-9_-]/g, "_")}.start`);
  try {
    if (existsSync(startFile)) {
      const startTs = parseInt(readFileSync(startFile, "utf-8").trim(), 10);
      unlinkSync(startFile);
      if (!isNaN(startTs) && startTs > 0) {
        return Date.now() - startTs;
      }
    }
  } catch { /* best effort */ }
  return undefined;
}

export function recordToolStart(toolName: string): void {
  try {
    if (!existsSync(TOOL_START_DIR)) mkdirSync(TOOL_START_DIR, { recursive: true });
    const startFile = join(TOOL_START_DIR, `${toolName.replace(/[^a-zA-Z0-9_-]/g, "_")}.start`);
    writeFileSync(startFile, String(Date.now()));
  } catch { /* best effort */ }
}

// ─── Offer / Phase Detection ──────────────────────────────────────────────────

export function detectOffer(input: HookInput): string | undefined {
  const explicitOffer = input.tool_input?.offer as string;
  if (explicitOffer) return explicitOffer;

  const filePath = input.tool_input?.file_path as string;
  const ecoDir = `${process.env.HOME}/copywriting-ecosystem/`;

  if (filePath?.startsWith(ecoDir)) {
    const rel = filePath.slice(ecoDir.length);
    const parts = rel.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  }

  const cwd = process.cwd();
  if (cwd.startsWith(ecoDir)) {
    const rel = cwd.slice(ecoDir.length);
    const parts = rel.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  }

  return undefined;
}

export function detectPhase(input: HookInput): string | undefined {
  const toolName = input.tool_name || "";
  const output =
    typeof input.tool_output === "string"
      ? input.tool_output
      : input.tool_output
      ? JSON.stringify(input.tool_output)
      : "";

  if (toolName.includes("validate_gate") || toolName.includes("phase")) {
    const phaseMatch = output.match(/phase[:\s]+['"]?(\w+)/i);
    if (phaseMatch) return phaseMatch[1];
  }

  return undefined;
}

export function isMcpTool(toolName: string): boolean {
  return toolName.startsWith("mcp__");
}

// ─── Score Extraction ─────────────────────────────────────────────────────────

export function extractScore(toolName: string, output: string): number | null {
  const allScoreMatches: number[] = [];
  const globalPattern = /(\d+(?:\.\d+)?)\s*\/\s*10/g;
  let gm: RegExpExecArray | null;
  while ((gm = globalPattern.exec(output)) !== null) {
    const val = parseFloat(gm[1]);
    if (val >= 0 && val <= 10) allScoreMatches.push(val);
  }

  const specificPatterns = TOOL_SPECIFIC_SCORE_PATTERNS[toolName] || [];
  for (const pat of specificPatterns) {
    const m = output.match(pat);
    if (m) {
      const val = parseFloat(m[1]);
      if (val >= 0 && val <= 10) return val;
    }
  }

  if (allScoreMatches.length > 0) {
    return allScoreMatches[allScoreMatches.length - 1];
  }

  return null;
}

// ─── Active Agent Detection ──────────────────────────────────────────────────

export function detectActiveAgent(): { agent_id: string; agent_offer: string | null } | null {
  try {
    const setPath = join(process.env.HOME || "", ".claude", "session-state", "active-agents.json");
    if (!existsSync(setPath)) return null;

    const raw = readFileSync(setPath, "utf-8");
    const agentSet = JSON.parse(raw);
    const entries = Object.entries(agentSet);
    if (entries.length === 0) return null;

    // Return the most recently activated agent
    let latest: { id: string; ts: number; offer: string | null } | null = null;
    for (const [id, data] of entries) {
      const entry = data as { activatedAt?: number; offer?: string };
      const ts = entry.activatedAt || 0;
      if (!latest || ts > latest.ts) {
        latest = { id, ts, offer: entry.offer || null };
      }
    }
    return latest ? { agent_id: latest.id, agent_offer: latest.offer } : null;
  } catch {
    return null;
  }
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function emitDashboardEvent(input: HookInput): Promise<void> {
  const sessionId = getSessionId();
  cleanupStaleSessions();

  const offer = detectOffer(input);
  const phase = detectPhase(input);
  const duration_ms = getDurationMs(input.tool_name);
  const activeAgent = detectActiveAgent();

  const toolOutputStr =
    typeof input.tool_output === "string"
      ? input.tool_output
      : input.tool_output
      ? JSON.stringify(input.tool_output)
      : undefined;

  const cwd = process.cwd();

  const payload: DashboardPayload = {
    type: "PostToolUse",
    timestamp: Date.now(),
    session_id: sessionId,
    tool_name: input.tool_name,
    tool_input: input.tool_input,
    tool_result: toolOutputStr?.substring(0, 500),
    is_error: input.is_error || false,
    duration_ms,
    offer: offer || activeAgent?.agent_offer || undefined,
    phase,
    data: {
      ...(isMcpTool(input.tool_name) ? { is_mcp: true } : {}),
      ...(activeAgent ? { agent_id: activeAgent.agent_id } : {}),
      cwd,
    },
  };

  // Enrich with semantic translation (pure computation, zero I/O)
  try {
    const semantic = translateEvent({
      type: payload.type,
      tool_name: payload.tool_name,
      tool_input: payload.tool_input,
      tool_result: payload.tool_result,
      offer: payload.offer,
      data: payload.data,
      is_error: payload.is_error,
    });
    if (semantic.significance !== 'noise') {
      payload.semantic_description = semantic.description;
      payload.significance = semantic.significance;
      payload.semantic_data = {
        agent_name: semantic.agent_name,
        agent_color: semantic.agent_color,
        agent_initial: semantic.agent_initial,
        verb: semantic.verb,
        object: semantic.object,
        offer_short: semantic.offer_short,
      };
    }
  } catch { /* semantic enrichment is best-effort */ }

  await fetch(`${DASHBOARD_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(1500),
  }).catch(() => {});

  if (VALIDATION_TOOLS.includes(input.tool_name) && toolOutputStr && offer) {
    const score = extractScore(input.tool_name, toolOutputStr);
    if (score !== null) {
      const metricsPayload: MetricsPayload = {
        offer,
        tool: input.tool_name,
        score,
        copy_type: (input.tool_input?.copy_type as string) || undefined,
        deliverable: (input.tool_input?.deliverable as string) || undefined,
        session_id: sessionId,
      };

      await fetch(`${DASHBOARD_URL}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metricsPayload),
        signal: AbortSignal.timeout(1500),
      }).catch(() => {});
    }
  }
}
