#!/usr/bin/env bun
// ~/.claude/hooks/context-tracker.ts
// PostToolUse hook — tracks tool calls to estimate context usage
// Wires context-tiering.ts into the hook system
// Created: 2026-02-26

import { readFileSync } from 'fs';
import { recordToolCall, shouldEmitWarning, getContextHealth } from '../.aios-core/copy-chief/context/context-tiering';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
}

// Estimate token count for specific tools
function estimateTokens(input: HookInput): number {
  const outputLen = input.tool_output?.length || 0;
  const inputLen = JSON.stringify(input.tool_input).length;

  // Rough estimate: 4 chars per token
  const baseTokens = Math.round((outputLen + inputLen) / 4);

  // Known heavy tools
  if (input.tool_name === 'Read') return Math.max(baseTokens, 2000);
  if (input.tool_name.includes('firecrawl')) return Math.max(baseTokens, 3000);
  if (input.tool_name.includes('playwright')) return Math.max(baseTokens, 2500);

  return Math.max(baseTokens, 500); // Minimum 500 tokens per call
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);

    // Skip error responses (usually short)
    if (input.is_error) {
      process.exit(0);
    }

    // Record the tool call with estimated tokens
    const tokens = estimateTokens(input);
    const state = recordToolCall(tokens);

    // Check if we should emit a warning
    const warning = shouldEmitWarning();
    if (warning.emit && warning.message) {
      console.error(`[CONTEXT] ${warning.message}`);
    }

    // Log context state at milestones (AIOS S5.5: warning a cada 10 tool calls)
    if (state.tool_calls % 10 === 0) {
      const health = getContextHealth();
      const tokensK = Math.round(health.estimated_tokens / 1000);
      const threshold = 100; // AIOS §3.4: 100K tokens (~50%)
      const emoji = health.pct >= 50 ? '🔴' : health.pct >= 40 ? '🟡' : '🟢';

      console.error(`${emoji} [CONTEXT] ~${tokensK}K tokens (~${health.pct}%) | ${health.tool_calls} calls | Threshold: ${threshold}K`);

      // Specific warning if approaching threshold
      if (health.pct >= 50) {
        console.error(`   ⚠️  Contexto acima de 50%. Considere /compact ou nova sessão.`);
      } else if (health.pct >= 40) {
        console.error(`   ⏰ Aproximando do threshold. Monitore e prepare para /compact.`);
      }
    }

    // N1: Meta-Prompt automático (AIOS Aula #20)
    // A cada ~15 tool calls, emitir reflexão meta-cognitiva
    if (state.tool_calls > 0 && state.tool_calls % 15 === 0) {
      console.error('');
      console.error('🔍 [META-PROMPT] Checkpoint de meta-cognição (a cada 15 interações):');
      console.error('   → O que deveria ter perguntado que não perguntei?');
      console.error('   → Que contexto está faltando para ajudar melhor?');
      console.error('   → Que suposições estou fazendo que deveriam ser validadas?');
      console.error('');
    }

    process.exit(0);
  } catch (error) {
    console.error(`[CONTEXT-TRACKER] Error: ${error}`);
    process.exit(0);
  }
}

main();
