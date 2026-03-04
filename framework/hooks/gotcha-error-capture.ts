#!/usr/bin/env bun
// ~/.claude/hooks/gotcha-error-capture.ts
// PostToolUseFailure hook — auto-captures recurring tool errors into gotchas.
//
// Reads failed tool info from stdin (Claude Code hook contract).
// Calls recordError() from lib/gotchas-memory.ts.
// Promotes to active gotcha at 3 occurrences within 24 h.
// Output: {"continue": true}

import { readFileSync } from 'fs';
import { recordError } from '../.aios-core/copy-chief/learning/gotchas-memory';

interface HookInput {
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: string;
  error?: string;
  is_error?: boolean;
}

function main(): void {
  let input: HookInput = {};
  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (raw) input = JSON.parse(raw);
  } catch {
    // No stdin or malformed — still output continue
    process.stdout.write(JSON.stringify({ continue: true }));
    return;
  }

  const tool = input.tool_name || 'unknown';

  // Prefer explicit error field, fall back to tool_response content
  const errorText = input.error
    || input.tool_response
    || 'unknown error';

  // Build context string from tool input (helps with samples)
  let context: string | undefined;
  if (input.tool_input) {
    try {
      const inp = input.tool_input;
      // Extract the most meaningful field (query, url, file_path, etc.)
      const snippet = inp.query ?? inp.url ?? inp.file_path ?? inp.command ?? JSON.stringify(inp);
      context = String(snippet).substring(0, 100);
    } catch { /* skip */ }
  }

  try {
    const promoted = recordError(tool, String(errorText), context);
    if (promoted) {
      process.stderr.write(
        `[gotcha-error-capture] Promoted to ${promoted.id}: ${promoted.title}\n`
      );
    }
  } catch (e) {
    // Never block tool use due to our own error
    process.stderr.write(`[gotcha-error-capture] ERROR: ${e}\n`);
  }

  process.stdout.write(JSON.stringify({ continue: true }));
}

main();
