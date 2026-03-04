'use strict';

/**
 * MCP Circuit Breaker Hook
 * Events: PreToolUse (matcher: mcp__.*), PostToolUse (matcher: mcp__.*), PostToolUseFailure (matcher: mcp__.*)
 * Budget: <100ms
 *
 * Checks circuit state before MCP tool calls and records failures.
 */

const path = require('path');
const fs = require('fs');

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const toolName = context.tool_name || '';
  const hookEvent = context.hook_event || 'PreToolUse';

  // Only process MCP tools
  if (!toolName.startsWith('mcp__')) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  try {
    const { MCPCircuitBreakerRegistry } = require(
      path.join(process.env.HOME, '.claude', '.aios-core', 'copy-chief', 'ids', 'mcp-circuit-breaker')
    );

    const registry = new MCPCircuitBreakerRegistry({ debug: false });

    // Restore state from disk
    registry.restore();

    if (hookEvent === 'PreToolUse') {
      // Check if circuit allows this call
      const check = registry.isAllowed(toolName);

      if (!check.allowed) {
        // Circuit is open — warn but don't block
        const output = {
          hookSpecificOutput: {
            additionalContext: `<circuit-breaker tool="${toolName}" state="${check.state}">${check.message}</circuit-breaker>`,
          },
        };
        registry.persist();
        process.stdout.write(JSON.stringify(output));
        return;
      }
    } else if (hookEvent === 'PostToolUseFailure') {
      // Record failure
      registry.recordFailure(toolName);
      registry.persist();

      const openCircuits = registry.getOpenCircuits();
      if (openCircuits.length > 0) {
        const output = {
          hookSpecificOutput: {
            additionalContext: `<circuit-breaker-update>Circuitos abertos: ${openCircuits.map(c => c.tool.replace('mcp__', '')).join(', ')}</circuit-breaker-update>`,
          },
        };
        process.stdout.write(JSON.stringify(output));
        return;
      }
    } else if (hookEvent === 'PostToolUse') {
      // Record success
      registry.recordSuccess(toolName);
      registry.persist();
    }

    process.stdout.write(JSON.stringify({}));
  } catch (error) {
    // Graceful degradation — never block tool calls
    process.stdout.write(JSON.stringify({}));
  }
}

main().catch(() => {
  process.exit(0);
});
