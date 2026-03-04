#!/usr/bin/env node
var import_fs = require("fs");
var import_context_tiering = require("../.aios-core/copy-chief/context/context-tiering");
function estimateTokens(input) {
  const outputLen = input.tool_output?.length || 0;
  const inputLen = JSON.stringify(input.tool_input).length;
  const baseTokens = Math.round((outputLen + inputLen) / 4);
  if (input.tool_name === "Read") return Math.max(baseTokens, 2e3);
  if (input.tool_name.includes("firecrawl")) return Math.max(baseTokens, 3e3);
  if (input.tool_name.includes("playwright")) return Math.max(baseTokens, 2500);
  return Math.max(baseTokens, 500);
}
function main() {
  try {
    const stdin = (0, import_fs.readFileSync)(0, "utf8");
    const input = JSON.parse(stdin);
    if (input.is_error) {
      process.exit(0);
    }
    const tokens = estimateTokens(input);
    const state = (0, import_context_tiering.recordToolCall)(tokens);
    const warning = (0, import_context_tiering.shouldEmitWarning)();
    if (warning.emit && warning.message) {
      console.error(`[CONTEXT] ${warning.message}`);
    }
    if (state.tool_calls % 10 === 0) {
      const health = (0, import_context_tiering.getContextHealth)();
      const tokensK = Math.round(health.estimated_tokens / 1e3);
      const threshold = 100;
      const emoji = health.pct >= 50 ? "\u{1F534}" : health.pct >= 40 ? "\u{1F7E1}" : "\u{1F7E2}";
      console.error(`${emoji} [CONTEXT] ~${tokensK}K tokens (~${health.pct}%) | ${health.tool_calls} calls | Threshold: ${threshold}K`);
      if (health.pct >= 50) {
        console.error(`   \u26A0\uFE0F  Contexto acima de 50%. Considere /compact ou nova sess\xE3o.`);
      } else if (health.pct >= 40) {
        console.error(`   \u23F0 Aproximando do threshold. Monitore e prepare para /compact.`);
      }
    }
    if (state.tool_calls > 0 && state.tool_calls % 15 === 0) {
      console.error("");
      console.error("\u{1F50D} [META-PROMPT] Checkpoint de meta-cogni\xE7\xE3o (a cada 15 intera\xE7\xF5es):");
      console.error("   \u2192 O que deveria ter perguntado que n\xE3o perguntei?");
      console.error("   \u2192 Que contexto est\xE1 faltando para ajudar melhor?");
      console.error("   \u2192 Que suposi\xE7\xF5es estou fazendo que deveriam ser validadas?");
      console.error("");
    }
    process.exit(0);
  } catch (error) {
    console.error(`[CONTEXT-TRACKER] Error: ${error}`);
    process.exit(0);
  }
}
main();
