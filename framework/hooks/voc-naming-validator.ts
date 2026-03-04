#!/usr/bin/env bun
/**
 * voc-naming-validator.ts — PreToolUse Hook (Write matcher)
 *
 * Validates that VOC file names match the actual extraction method.
 * Prevents files named *-apify.md that contain WebSearch data.
 *
 * Gap 3 fix: https://memory/apify-mcp-gaps.md
 */

import { readFileSync } from 'fs';

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
  };
}

function main(): void {
  const timeout = setTimeout(() => process.exit(0), 2000);

  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) { clearTimeout(timeout); process.exit(0); }

    const input: HookInput = JSON.parse(raw);

    // Only check Write tool
    if (input.tool_name !== 'Write') {
      clearTimeout(timeout);
      process.exit(0);
    }

    const filePath = input.tool_input.file_path || '';
    const content = input.tool_input.content || '';

    // Only check files in research/voc paths
    if (!filePath.match(/research.*voc/i)) {
      clearTimeout(timeout);
      process.exit(0);
    }

    const fileName = filePath.split('/').pop() || '';

    // Check: filename says "apify" but content doesn't have extraction_method: apify
    if (fileName.includes('-apify') && !content.includes('extraction_method: apify')) {
      const json = JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            `File named "${fileName}" claims Apify extraction but content lacks "extraction_method: apify" in YAML header. ` +
            `Rename file to match actual method (e.g., *-websearch.md, *-firecrawl.md) or add correct extraction_method header.`
        }
      });
      process.stdout.write(json);
      clearTimeout(timeout);
      process.exit(0);
    }

    // Check: file in voc/ path but missing extraction_method header entirely
    if (fileName.endsWith('.md') && !content.includes('extraction_method:')) {
      // Warn but don't block
      process.stderr.write(
        `[VOC-NAMING] Warning: ${fileName} in voc/ path is missing "extraction_method:" YAML header. ` +
        `Add extraction_method: apify|firecrawl|playwright|websearch to the YAML frontmatter.\n`
      );
    }

  } catch {
    /* silent fail — non-blocking for parse errors */
  }

  clearTimeout(timeout);
  process.exit(0);
}

main();
