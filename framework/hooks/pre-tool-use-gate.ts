#!/usr/bin/env bun
// ~/.claude/hooks/pre-tool-use-gate.ts
// Hook de BLOQUEIO - VERSÃO JARVIS (2026-01-30)
// Usa hookSpecificOutput conforme docs atuais
// FASE 3: Adicionado Gate #4 - Tool Priority Enforcement
// FASE JARVIS: Adicionado Gate #5 - Production Gates (Research + Briefing + Anti-Homog)

import {
  hasReadMethodology,
  getSessionState,
  getRequiredReadings,
  hasMinimumReasoningDepth,
  hasUsedSequentialThinking
} from '../.aios-core/copy-chief/state/session-state';

import {
  checkToolPriority,
  formatBlockMessage,
  ToolPriorityResult
} from '../.aios-core/copy-chief/etl/platform-actors';

import {
  checkProductionGates,
  formatGateBlockMessage,
  isProductionFile,
  getOfferContext
} from '../.aios-core/copy-chief/gates/production-gates';

import {
  detectRequiredSkill,
  hasSkillException
} from '../.aios-core/copy-chief/workflow/skill-triggers';

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  prompt?: string; // Contexto do prompt atual (se disponível)
}

// FORMATO CORRETO JAN/2026 - usa hookSpecificOutput
interface PreToolUseOutput {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse';
    permissionDecision: 'allow' | 'deny' | 'ask';
    permissionDecisionReason?: string;
  };
}

const GATED_TOOLS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const ALWAYS_ALLOWED = ['Read', 'View', 'Cat', 'Glob', 'Grep', 'LS', 'Bash', 'Task', 'WebSearch', 'WebFetch'];

// Escape phrase para bypass de Production Gates
const PRODUCTION_ESCAPE_PHRASES = [
  /--force-production/i,
  /forçar produção/i,
  /bypass.*gate/i,
  /emergência/i,
];

// MACRO: Padrões de CONFIGURAÇÃO/SISTEMA (não copy)
// Detecta automaticamente arquivos de infraestrutura vs copy de produção
const EXEMPT_PATTERNS = [
  // Arquivos de planejamento e tracking
  /PLAN/i, /OUTLINE/i, /NOTES/i, /TODO/i, /STRATEGY/i,
  // Configuração e dados estruturados
  /\.json$/i, /\.yml$/i, /\.yaml$/i, /\.ts$/i, /\.sh$/i,
  // Arquivos de sistema do ecossistema (auto-descoberta)
  /CHANGELOG/i, /CLAUDE\.md$/i, /RUNBOOK/i, /GUIA/i, /README/i,
  /ecosystem-status/i, /\.version$/i, /SKILL\.md$/i,
  // Diretórios de infraestrutura (não copy de produção)
  /\.claude\//i, /scripts\//i, /hooks\//i, /templates\//i, /logs\//i,
  // Arquivos de research/briefing (input, não output)
  /research\//i, /briefings\//i, /findings/i, /progress/i, /task_plan/i,
];

const MIN_REASONING_DEPTH = 0.6;

function main(): void {
  try {
    const stdin = require('fs').readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Ferramentas de leitura: sempre permite
    if (ALWAYS_ALLOWED.includes(toolName)) {
      allowTool();
      return;
    }

    // --- Skill Auto-Invoke: Detect if prompt should trigger a skill ---
    // NOTE: This is informational only (console.error), not blocking
    try {
      const prompt = (input.tool_input?.prompt as string) || (input.tool_input?.message as string) || '';
      if (prompt && !hasSkillException(prompt)) {
        const required = detectRequiredSkill(prompt);
        if (required) {
          console.error(`[SKILL-TRIGGER] Detected skill: ${required.skill} (${required.description})`);
        }
      }
    } catch { /* skill detection is non-blocking */ }

    // GATE #4: Tool Priority - Bloqueia Playwright para plataformas sociais
    // Sugere usar Apify actors em vez de navegação direta
    const toolPriorityResult = checkToolPriority(
      toolName,
      input.tool_input,
      input.prompt || ''
    );

    if (toolPriorityResult.shouldBlock) {
      denyToolPriority(toolPriorityResult);
      return;
    }

    // Não é ferramenta gated: permite
    if (!GATED_TOOLS.includes(toolName)) {
      allowTool();
      return;
    }

    // É ferramenta de escrita - verificar
    const targetPath = (input.tool_input?.file_path || input.tool_input?.path || '') as string;
    const currentPrompt = input.prompt || '';

    // GATE #5: Production Gates (Research + Briefing + Anti-Homog)
    // Verifica se research e briefing estão completos antes de produção
    if (isProductionFile(targetPath)) {
      // Verificar escape phrase
      const hasProductionEscape = PRODUCTION_ESCAPE_PHRASES.some(p => p.test(currentPrompt));

      if (!hasProductionEscape) {
        const productionResult = checkProductionGates(targetPath);

        if (!productionResult.passed) {
          const context = getOfferContext(targetPath);
          denyProductionGate(productionResult, context);
          return;
        }

        console.error(`[GATE] ✅ Production Gates OK para: ${targetPath}`);
      } else {
        console.error(`[GATE] ⚠️ Production Gates BYPASS por escape phrase`);
      }
    }

    // Arquivo de planejamento: permite sem metodologia
    if (EXEMPT_PATTERNS.some(p => p.test(targetPath))) {
      console.error(`[GATE] Planejamento permitido: ${targetPath}`);
      allowTool();
      return;
    }

    // Verifica se é output de copy
    const isCopyOutput = /\.(md|txt|html)$/i.test(targetPath) ||
      /copy|script|vsl|headline|lead|email|criativo|origin/i.test(targetPath);

    if (!isCopyOutput) {
      allowTool();
      return;
    }

    // GATES DE QUALIDADE
    const state = getSessionState();

    // Gate 1: Metodologia
    if (!hasReadMethodology()) {
      denyNoMethodology(state, targetPath);
      return;
    }

    // Gate 2: Profundidade
    if (!hasMinimumReasoningDepth(MIN_REASONING_DEPTH)) {
      denyLowDepth(state, targetPath);
      return;
    }

    // Gate 3: Sequential Thinking para copy
    if (!hasUsedSequentialThinking()) {
      denyNoSequentialThinking(state, targetPath);
      return;
    }

    // Passou nos gates
    console.error(`[GATE] ✅ Permitido: ${targetPath} (depth: ${(state.reasoningDepth * 100).toFixed(0)}%, sequential: ✓)`);
    allowTool();

  } catch (error) {
    console.error(`[GATE] Erro, permitindo: ${error}`);
    allowTool();
  }
}

function allowTool(): void {
  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow'
    }
  };
  console.log(JSON.stringify(output));
  process.exit(0);
}

function denyNoMethodology(state: ReturnType<typeof getSessionState>, targetFile: string): void {
  const required = getRequiredReadings('default');

  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `
🚫 BLOQUEADO - METODOLOGIA NÃO CONSULTADA

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}% (mínimo: 60%)
Frameworks lidos: ${state.frameworksConsulted.length}

AÇÃO OBRIGATÓRIA - Leia pelo menos um:
${required.map(f => `• Read ${f}`).join('\n')}

Após ler, tente novamente.
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
}

function denyLowDepth(state: ReturnType<typeof getSessionState>, targetFile: string): void {
  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `
🧠 BLOQUEADO - PROFUNDIDADE INSUFICIENTE

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}% (mínimo: 60%)

Você consultou metodologia, mas não explorou suficientemente.
Leia mais arquivos de fundamentos para aumentar a profundidade:

• Read skills/helix-system-agent/references/fundamentos/principios_fundamentais.md
• Read skills/helix-system-agent/references/fundamentos/puzzle_pieces.md
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
}

function denyNoSequentialThinking(state: ReturnType<typeof getSessionState>, targetFile: string): void {
  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `
🧠 BLOQUEADO - SEQUENTIAL THINKING NÃO USADO

Arquivo: ${targetFile}
Reasoning Depth: ${(state.reasoningDepth * 100).toFixed(0)}%
Sequential Thinking: ❌ Não usado

Para produzir copy, você DEVE usar raciocínio estruturado primeiro.

AÇÃO OBRIGATÓRIA:
1. Use a ferramenta: mcp__sequential-thinking__sequentialthinking
2. Steps recomendados no sequential thinking:
   - Identificar tipo de copy e objetivo
   - Listar metodologias relevantes (RMBC, Puzzle Pieces, DRE)
   - Planejar estrutura da copy
3. Após completar, tente escrever novamente

Isso garante copy de qualidade, não genérica.
`
    }
  };

  console.log(JSON.stringify(output));
  process.exit(0);
}

function denyToolPriority(result: ToolPriorityResult): void {
  const blockMessage = formatBlockMessage(result);

  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: blockMessage
    }
  };

  console.error(`[GATE] ⚠️ Tool Priority: Bloqueando Playwright para ${result.platform}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

function denyProductionGate(
  result: ReturnType<typeof checkProductionGates>,
  context: ReturnType<typeof getOfferContext>
): void {
  const blockMessage = formatGateBlockMessage(result, context || undefined);

  const output: PreToolUseOutput = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: blockMessage
    }
  };

  console.error(`[GATE] 🚫 Production Gate BLOCKED: ${result.gate} - ${result.issues.length} issues`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

main();
