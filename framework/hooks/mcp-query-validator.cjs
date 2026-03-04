#!/usr/bin/env node
// mcp-query-validator.cjs — Cross-platform rewrite of mcp-query-validator.sh
// Validates MCP queries have LIMIT to prevent expensive operations
'use strict';

const fs = require('fs');

try {
  const input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  const toolName = input.tool_name || '';

  if (!toolName.startsWith('mcp__')) process.exit(0);

  const toolInput = input.tool_input || {};
  const query = toolInput.query || toolInput.sql || toolInput.search || '';
  const limit = toolInput.limit || toolInput.maxResults || toolInput.max_results || null;

  // SQL without LIMIT
  if (query && /SELECT/i.test(query) && !/LIMIT/i.test(query)) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'SQL queries must include LIMIT clause. Add LIMIT 100 or appropriate limit.',
      },
    }));
    process.exit(0);
  }

  // Apify without limit
  if (toolName.startsWith('mcp__apify') && !limit) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        additionalContext: 'Consider using pagination parameters (limit, offset) for Apify actors.',
      },
    }));
    process.exit(0);
  }

  // Firecrawl crawl without maxPages
  if (toolName.startsWith('mcp__firecrawl__firecrawl_crawl')) {
    const maxPages = toolInput.maxPages;
    if (!maxPages || maxPages > 50) {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'allow',
          additionalContext: 'Warning: Firecrawl crawl without maxPages may be slow. Consider maxPages: 10-20.',
        },
      }));
      process.exit(0);
    }
  }
} catch (e) {
  process.stderr.write(`[mcp-query-validator] ${e.message}\n`);
}
