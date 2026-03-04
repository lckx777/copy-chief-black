/**
 * mecanismo-updater.ts — Copy Chief OS Layer
 * copy-chief/state/mecanismo-updater.ts
 *
 * Business logic for automatically updating mecanismo-unico.yaml state
 * after MCP validation tools (consensus, blind_critic, emotional_stress_test) pass.
 *
 * Exported by hook: ~/.claude/hooks/post-mcp-mecanismo-update.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: string;
  session_context?: {
    current_directory?: string;
  };
}

export interface HookOutput {
  continue: boolean;
  message?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const BLIND_CRITIC_THRESHOLD = 8;
export const EMOTIONAL_STRESS_THRESHOLD = 8;
export const RMBC_THRESHOLD = 7;

export const RELEVANT_TOOLS = [
  'mcp__zen__consensus',
  'mcp__copywriting__blind_critic',
  'mcp__copywriting__emotional_stress_test',
];

// ─── File finding ─────────────────────────────────────────────────────────────

/**
 * Find mecanismo-unico.yaml by walking up from startPath.
 * Stops at offer root (has CONTEXT.md) or filesystem root.
 */
export function findMecanismoFile(startPath: string): string | null {
  let current = startPath;
  const maxDepth = 10;
  let depth = 0;

  while (depth < maxDepth) {
    const mecanismoPath = path.join(current, 'mecanismo-unico.yaml');
    if (fs.existsSync(mecanismoPath)) {
      return mecanismoPath;
    }

    // Check for CONTEXT.md to confirm it's an offer without a mecanismo file
    if (fs.existsSync(path.join(current, 'CONTEXT.md'))) {
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
    depth++;
  }

  return null;
}

// ─── Score parsing ────────────────────────────────────────────────────────────

/**
 * Parse a numeric score from MCP tool output using a regex pattern.
 */
export function parseScore(output: string, pattern: RegExp): number | null {
  const match = output.match(pattern);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return null;
}

// ─── YAML mutation ────────────────────────────────────────────────────────────

/**
 * Update a single YAML field in-place by regex replacement.
 */
export function updateYamlField(
  filePath: string,
  fieldPattern: string,
  newValue: string | number | boolean,
): void {
  let content = fs.readFileSync(filePath, 'utf-8');
  const regex = new RegExp(`(${fieldPattern}:)\\s*.*$`, 'm');
  content = content.replace(regex, `$1 ${newValue}`);
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ─── Pass-checking ────────────────────────────────────────────────────────────

/**
 * Read mecanismo file and verify that all MCP validation fields meet thresholds.
 */
export function checkAllPassed(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');

  const consensusMatch = content.match(/consensus_passed:\s*(true|false)/);
  const mupMatch = content.match(/blind_critic_mup_score:\s*(\d+)/);
  const musMatch = content.match(/blind_critic_mus_score:\s*(\d+)/);
  const estMatch = content.match(/emotional_stress_test_score:\s*(\d+)/);

  const consensus = consensusMatch?.[1] === 'true';
  const mup = parseInt(mupMatch?.[1] || '0') >= BLIND_CRITIC_THRESHOLD;
  const mus = parseInt(musMatch?.[1] || '0') >= BLIND_CRITIC_THRESHOLD;
  const est = parseInt(estMatch?.[1] || '0') >= EMOTIONAL_STRESS_THRESHOLD;

  return consensus && mup && mus && est;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * Process a PostToolUse event from a relevant MCP tool.
 * Updates mecanismo-unico.yaml fields and advances state if all thresholds are met.
 */
export function postToolUse(input: HookInput): HookOutput {
  const { tool_name, tool_output, session_context } = input;

  if (!RELEVANT_TOOLS.includes(tool_name)) {
    return { continue: true };
  }

  const cwd = session_context?.current_directory || process.cwd();
  const mecanismoPath = findMecanismoFile(cwd);

  if (!mecanismoPath) {
    console.log('[post-mcp-mecanismo] No mecanismo-unico.yaml found in context');
    return { continue: true };
  }

  console.log(`[post-mcp-mecanismo] Processing ${tool_name} for ${mecanismoPath}`);

  try {
    if (tool_name === 'mcp__zen__consensus') {
      const passed =
        tool_output.includes('agreement') ||
        tool_output.includes('consensus') ||
        tool_output.includes('approved') ||
        tool_output.includes('selected');

      updateYamlField(mecanismoPath, 'consensus_passed', passed);
      console.log(`[post-mcp-mecanismo] Updated consensus_passed: ${passed}`);
    }

    if (tool_name === 'mcp__copywriting__blind_critic') {
      const scorePatterns = [
        /score[:\s]+(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*\/\s*10/i,
        /rating[:\s]+(\d+(?:\.\d+)?)/i,
        /média[:\s]+(\d+(?:\.\d+)?)/i,
      ];

      let score: number | null = null;
      for (const pattern of scorePatterns) {
        score = parseScore(tool_output, pattern);
        if (score !== null) break;
      }

      if (score !== null) {
        const isMUS =
          tool_output.toLowerCase().includes('mus') ||
          tool_output.toLowerCase().includes('solução') ||
          tool_output.toLowerCase().includes('solucao');

        if (isMUS) {
          updateYamlField(mecanismoPath, 'blind_critic_mus_score', Math.round(score));
          console.log(`[post-mcp-mecanismo] Updated blind_critic_mus_score: ${score}`);
        } else {
          updateYamlField(mecanismoPath, 'blind_critic_mup_score', Math.round(score));
          console.log(`[post-mcp-mecanismo] Updated blind_critic_mup_score: ${score}`);
        }
      }
    }

    if (tool_name === 'mcp__copywriting__emotional_stress_test') {
      const scorePatterns = [
        /genericidade[:\s]+(\d+(?:\.\d+)?)/i,
        /score[:\s]+(\d+(?:\.\d+)?)/i,
        /(\d+(?:\.\d+)?)\s*\/\s*10/i,
      ];

      let score: number | null = null;
      for (const pattern of scorePatterns) {
        score = parseScore(tool_output, pattern);
        if (score !== null) break;
      }

      if (score !== null) {
        updateYamlField(mecanismoPath, 'emotional_stress_test_score', Math.round(score));
        console.log(`[post-mcp-mecanismo] Updated emotional_stress_test_score: ${score}`);
      }
    }

    // Check if all validations passed and potentially advance state
    if (checkAllPassed(mecanismoPath)) {
      const content = fs.readFileSync(mecanismoPath, 'utf-8');
      const stateMatch = content.match(/state:\s*"?(\w+)"?/);
      const currentState = stateMatch?.[1] || 'DRAFT';

      if (currentState !== 'VALIDATED' && currentState !== 'APPROVED') {
        updateYamlField(mecanismoPath, 'state', '"VALIDATED"');
        updateYamlField(mecanismoPath, 'all_passed', 'true');

        const date = new Date().toISOString().split('T')[0];
        updateYamlField(mecanismoPath, 'updated_at', `"${date}"`);

        console.log(`[post-mcp-mecanismo] State advanced to VALIDATED`);

        return {
          continue: true,
          message: `✅ MECANISMO VALIDATED - Todos os thresholds atingidos!\n\nArquivo atualizado: ${mecanismoPath}\nState: VALIDATED\n\nPróximo: HUMANO deve aprovar (human_approved: true, state: APPROVED)`,
        };
      }
    }
  } catch (error) {
    console.error(`[post-mcp-mecanismo] Error: ${error}`);
  }

  return { continue: true };
}
