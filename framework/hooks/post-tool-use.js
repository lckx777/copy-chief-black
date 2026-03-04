#!/usr/bin/env node
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
var import_production_gates = require("../.aios-core/copy-chief/gates/production-gates");
function main() {
  try {
    const stdin = require("fs").readFileSync(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (["Read", "View", "Cat"].includes(toolName)) {
      const filePath = input.tool_input?.file_path || input.tool_input?.path || input.tool_input?.file;
      if (filePath) {
        (0, import_session_state.recordFileRead)(filePath);
        console.error(`[SESSION] Arquivo registrado: ${filePath}`);
      }
    }
    if (["Write", "Edit"].includes(toolName)) {
      const filePath = input.tool_input?.file_path || input.tool_input?.path;
      if (filePath && /PLAN|OUTLINE|STRATEGY/i.test(filePath)) {
        (0, import_session_state.markPlanCreated)();
        console.error(`[SESSION] Plano criado: ${filePath}`);
      }
      if (filePath && filePath.endsWith("summary.md")) {
        const content = input.tool_input?.content || input.tool_input?.new_string || "";
        if (content) {
          const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
          const estimatedTokens = Math.ceil(wordCount * 1.3);
          if (estimatedTokens > 500) {
            console.error(`[WARN] Summary exceeds 500 tokens (~${estimatedTokens}). Consider trimming for RAG efficiency.`);
          }
          const requiredSections = ["## Key Findings", "## Confidence", "## Quotes"];
          const missingSections = requiredSections.filter((s) => !content.includes(s));
          if (missingSections.length > 0 && missingSections.length < requiredSections.length) {
            console.error(`[INFO] Summary may be missing sections: ${missingSections.join(", ")}`);
          }
        }
      }
      if (filePath && /production\/|criativo|headline|script|vsl/i.test(filePath)) {
        const content = input.tool_input?.content || input.tool_input?.new_string || "";
        if (content && content.length > 100) {
          const nicheMatch = filePath.match(/copywriting-ecosystem\/([^\/]+)\//);
          const nicheName = nicheMatch ? nicheMatch[1] : "default";
          const lowerContent = content.toLowerCase();
          const nicheCliches = import_production_gates.CLICHES_BY_NICHE[nicheName] || [];
          const foundCliches = nicheCliches.filter((c) => lowerContent.includes(c.toLowerCase()));
          const foundBanned = import_production_gates.BANNED_WORDS.filter((w) => lowerContent.includes(w.toLowerCase()));
          if (foundCliches.length > 0) {
            console.error(`[ANTI-HOMOG] \u26A0\uFE0F CLICH\xCAS DETECTADOS: ${foundCliches.join(", ")}`);
            console.error(`[ANTI-HOMOG] Substitua por elementos \xDANICOS da oferta.`);
          }
          if (foundBanned.length > 0) {
            console.error(`[ANTI-HOMOG] \u26A0\uFE0F PALAVRAS BANIDAS: ${foundBanned.join(", ")}`);
            console.error(`[ANTI-HOMOG] Use linguagem espec\xEDfica da VOC.`);
          }
          const hasProprietaryName = /método\s+[A-Z][a-zA-Z]+|sistema\s+[A-Z][a-zA-Z]+|protocolo\s+[A-Z][a-zA-Z]+/i.test(content);
          const hasSpecificNumbers = /\d{2,}%|\d{2,}\s*(dias|horas|minutos|pessoas|alunos)/i.test(content);
          if (!hasProprietaryName) {
            console.error(`[ANTI-HOMOG] \u26A0\uFE0F Sem nome propriet\xE1rio para m\xE9todo/sistema`);
          }
          if (!hasSpecificNumbers) {
            console.error(`[ANTI-HOMOG] \u26A0\uFE0F Sem n\xFAmeros espec\xEDficos (%, dias, pessoas)`);
          }
          let genericityScore = 10;
          genericityScore -= foundCliches.length * 1.5;
          genericityScore -= foundBanned.length * 1;
          if (!hasProprietaryName) genericityScore -= 1.5;
          if (!hasSpecificNumbers) genericityScore -= 1;
          genericityScore = Math.max(0, Math.round(genericityScore));
          if (genericityScore < 8) {
            console.error(`[ANTI-HOMOG] \u274C GENERICIDADE SCORE: ${genericityScore}/10 (m\xEDnimo: 8)`);
            console.error(`[ANTI-HOMOG] Copy gen\xE9rica demais - concorrente poderia usar sem altera\xE7\xE3o.`);
          } else {
            console.error(`[ANTI-HOMOG] \u2705 Genericidade Score: ${genericityScore}/10`);
          }
        }
      }
    }
    if (toolName.includes("sequential-thinking") || toolName.includes("sequentialthinking")) {
      (0, import_session_state.recordSequentialThinking)();
      console.error(`[SESSION] Sequential Thinking usado`);
    }
    process.exit(0);
  } catch (error) {
    console.error(`[SESSION] Erro: ${error}`);
    process.exit(0);
  }
}
main();
