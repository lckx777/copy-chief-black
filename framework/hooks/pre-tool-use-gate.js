#!/usr/bin/env node
var import_session_state = require("../.aios-core/copy-chief/state/session-state");
var import_platform_actors = require("../.aios-core/copy-chief/etl/platform-actors");
var import_production_gates = require("../.aios-core/copy-chief/gates/production-gates");
var import_skill_triggers = require("../.aios-core/copy-chief/workflow/skill-triggers");
const GATED_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit"];
const ALWAYS_ALLOWED = ["Read", "View", "Cat", "Glob", "Grep", "LS", "Bash", "Task", "WebSearch", "WebFetch"];
const PRODUCTION_ESCAPE_PHRASES = [
  /--force-production/i,
  /forçar produção/i,
  /bypass.*gate/i,
  /emergência/i
];
const EXEMPT_PATTERNS = [
  // Arquivos de planejamento e tracking
  /PLAN/i,
  /OUTLINE/i,
  /NOTES/i,
  /TODO/i,
  /STRATEGY/i,
  // Configuração e dados estruturados
  /\.json$/i,
  /\.yml$/i,
  /\.yaml$/i,
  /\.ts$/i,
  /\.sh$/i,
  // Arquivos de sistema do ecossistema (auto-descoberta)
  /CHANGELOG/i,
  /CLAUDE\.md$/i,
  /RUNBOOK/i,
  /GUIA/i,
  /README/i,
  /ecosystem-status/i,
  /\.version$/i,
  /SKILL\.md$/i,
  // Diretórios de infraestrutura (não copy de produção)
  /\.claude\//i,
  /scripts\//i,
  /hooks\//i,
  /templates\//i,
  /logs\//i,
  // Arquivos de research/briefing (input, não output)
  /research\//i,
  /briefings\//i,
  /findings/i,
  /progress/i,
  /task_plan/i
];
const MIN_REASONING_DEPTH = 0.6;
function main() {
  try {
    const stdin = require("fs").readFileSync(0, "utf8");
    const input = JSON.parse(stdin);
    const toolName = input.tool_name;
    if (ALWAYS_ALLOWED.includes(toolName)) {
      allowTool();
      return;
    }
    try {
      const prompt = input.tool_input?.prompt || input.tool_input?.message || "";
      if (prompt && !(0, import_skill_triggers.hasSkillException)(prompt)) {
        const required = (0, import_skill_triggers.detectRequiredSkill)(prompt);
        if (required) {
          console.error(`[SKILL-TRIGGER] Detected skill: ${required.skill} (${required.description})`);
        }
      }
    } catch {
    }
    const toolPriorityResult = (0, import_platform_actors.checkToolPriority)(
      toolName,
      input.tool_input,
      input.prompt || ""
    );
    if (toolPriorityResult.shouldBlock) {
      denyToolPriority(toolPriorityResult);
      return;
    }
    if (!GATED_TOOLS.includes(toolName)) {
      allowTool();
      return;
    }
    const targetPath = input.tool_input?.file_path || input.tool_input?.path || "";
    const currentPrompt = input.prompt || "";
    if ((0, import_production_gates.isProductionFile)(targetPath)) {
      const hasProductionEscape = PRODUCTION_ESCAPE_PHRASES.some((p) => p.test(currentPrompt));
      if (!hasProductionEscape) {
        const productionResult = (0, import_production_gates.checkProductionGates)(targetPath);
        if (!productionResult.passed) {
          const context = (0, import_production_gates.getOfferContext)(targetPath);
          denyProductionGate(productionResult, context);
          return;
        }
        console.error(`[GATE] \u2705 Production Gates OK para: ${targetPath}`);
      } else {
        console.error(`[GATE] \u26A0\uFE0F Production Gates BYPASS por escape phrase`);
      }
    }
    if (EXEMPT_PATTERNS.some((p) => p.test(targetPath))) {
      console.error(`[GATE] Planejamento permitido: ${targetPath}`);
      allowTool();
      return;
    }
    const isCopyOutput = /\.(md|txt|html)$/i.test(targetPath) || /copy|script|vsl|headline|lead|email|criativo|origin/i.test(targetPath);
    if (!isCopyOutput) {
      allowTool();
      return;
    }
    const state = (0, import_session_state.getSessionState)();
    if (!(0, import_session_state.hasReadMethodology)()) {
      denyNoMethodology(state, targetPath);
      return;
    }
    if (!(0, import_session_state.hasMinimumReasoningDepth)(MIN_REASONING_DEPTH)) {
      denyLowDepth(state, targetPath);
      return;
    }
    if (!(0, import_session_state.hasUsedSequentialThinking)()) {
      denyNoSequentialThinking(state, targetPath);
      return;
    }
    console.error(`[GATE] \u2705 Permitido: ${targetPath} (depth: ${(state.reasoningDepth * 100).toFixed(0)}%, sequential: \u2713)`);
    allowTool();
  } catch (error) {
    console.error(`[GATE] Erro, permitindo: ${error}`);
    allowTool();
  }
}
function allowTool() {
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow"
    }
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}
function denyNoMethodology(state, targetFile) {
  const required = (0, import_session_state.getRequiredReadings)("default");
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `
\u{1F6AB} BLOQUEADO - METODOLOGIA N\xC3O CONSULTADA

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}% (m\xEDnimo: 60%)
Frameworks lidos: ${state.frameworksConsulted.length}

A\xC7\xC3O OBRIGAT\xD3RIA - Leia pelo menos um:
${required.map((f) => `\u2022 Read ${f}`).join("\n")}

Ap\xF3s ler, tente novamente.
`
    }
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}
function denyLowDepth(state, targetFile) {
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `
\u{1F9E0} BLOQUEADO - PROFUNDIDADE INSUFICIENTE

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}% (m\xEDnimo: 60%)

Voc\xEA consultou metodologia, mas n\xE3o explorou suficientemente.
Leia mais arquivos de fundamentos para aumentar a profundidade:

\u2022 Read skills/helix-system-agent/references/fundamentos/principios_fundamentais.md
\u2022 Read skills/helix-system-agent/references/fundamentos/puzzle_pieces.md
`
    }
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}
function denyNoSequentialThinking(state, targetFile) {
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `
\u{1F9E0} BLOQUEADO - SEQUENTIAL THINKING N\xC3O USADO

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}%
Sequential Thinking: \u274C N\xE3o usado

Para produzir copy, voc\xEA DEVE usar racioc\xEDnio estruturado primeiro.

A\xC7\xC3O OBRIGAT\xD3RIA:
1. Use a ferramenta: mcp__sequential-thinking__sequentialthinking
2. Steps recomendados no sequential thinking:
   - Identificar tipo de copy e objetivo
   - Listar metodologias relevantes (RMBC, Puzzle Pieces, DRE)
   - Planejar estrutura da copy
3. Ap\xF3s completar, tente escrever novamente

Isso garante copy de qualidade, n\xE3o gen\xE9rica.
`
    }
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}
function denyToolPriority(result) {
  const blockMessage = (0, import_platform_actors.formatBlockMessage)(result);
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: blockMessage
    }
  };
  console.error(`[GATE] \u26A0\uFE0F Tool Priority: Bloqueando Playwright para ${result.platform}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
function denyProductionGate(result, context) {
  const blockMessage = (0, import_production_gates.formatGateBlockMessage)(result, context || void 0);
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: blockMessage
    }
  };
  console.error(`[GATE] \u{1F6AB} Production Gate BLOCKED: ${result.gate} - ${result.issues.length} issues`);
  console.log(JSON.stringify(output));
  process.exit(0);
}
main();
