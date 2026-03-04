#!/usr/bin/env bun
// hooks/suggestion-on-gate.ts — PostToolUse hook
// Fires after validate_gate / black_validation to suggest next action
// via SuggestionEngine.
//
// Wires: hooks/lib/aios/suggestion-engine.ts → PostToolUse hook

import { SuggestionEngine, type SuggestionContext } from '../.aios-core/copy-chief/utils/suggestion-engine';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output?: string;
}

function main(): void {
  const raw = process.env.CLAUDE_TOOL_USE_CONTEXT;
  if (!raw) return;

  let input: HookInput;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  // Only fire after gate tools
  const gateTools = [
    'mcp__copywriting__validate_gate',
    'mcp__copywriting__black_validation',
  ];
  if (!gateTools.includes(input.tool_name)) return;

  const engine = new SuggestionEngine();

  // Build context from tool input
  const offerPath = input.tool_input?.offer_path || input.tool_input?.offerPath || '';
  const context: SuggestionContext = engine.buildContext({ offerPath });

  // Detect execution state from gate output
  const output = input.tool_output || '';
  if (/pass|approved|score.*[89]/i.test(output)) {
    context.executionSignals = { gate_status: 'passed' };
  } else if (/fail|blocked|score.*[0-6]/i.test(output)) {
    context.executionSignals = { gate_status: 'failed' };
  }

  context.lastCommand = input.tool_name.replace('mcp__copywriting__', '');
  context.lastCommands = [context.lastCommand];

  const result = engine.suggestNext(context);

  if (result.suggestions.length > 0) {
    const top = result.suggestions[0];
    const msg = `💡 Next: ${top.command}${top.args ? ' ' + top.args : ''} — ${top.description} (${Math.round(top.confidence * 100)}% confidence)`;
    // Output as system message for the user
    console.log(JSON.stringify({ result: msg }));
  }
}

main();
