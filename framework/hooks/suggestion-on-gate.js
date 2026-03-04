#!/usr/bin/env node
var import_suggestion_engine = require("../.aios-core/copy-chief/utils/suggestion-engine");
function main() {
  const raw = process.env.CLAUDE_TOOL_USE_CONTEXT;
  if (!raw) return;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const gateTools = [
    "mcp__copywriting__validate_gate",
    "mcp__copywriting__black_validation"
  ];
  if (!gateTools.includes(input.tool_name)) return;
  const engine = new import_suggestion_engine.SuggestionEngine();
  const offerPath = input.tool_input?.offer_path || input.tool_input?.offerPath || "";
  const context = engine.buildContext({ offerPath });
  const output = input.tool_output || "";
  if (/pass|approved|score.*[89]/i.test(output)) {
    context.executionSignals = { gate_status: "passed" };
  } else if (/fail|blocked|score.*[0-6]/i.test(output)) {
    context.executionSignals = { gate_status: "failed" };
  }
  context.lastCommand = input.tool_name.replace("mcp__copywriting__", "");
  context.lastCommands = [context.lastCommand];
  const result = engine.suggestNext(context);
  if (result.suggestions.length > 0) {
    const top = result.suggestions[0];
    const msg = `\u{1F4A1} Next: ${top.command}${top.args ? " " + top.args : ""} \u2014 ${top.description} (${Math.round(top.confidence * 100)}% confidence)`;
    console.log(JSON.stringify({ result: msg }));
  }
}
main();
