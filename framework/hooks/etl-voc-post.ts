#!/usr/bin/env bun
// ~/.claude/hooks/etl-voc-post.ts
// PostToolUse hook — validates VOC data quality after extraction
// Wires etl-helpers.ts into the hook system
// Created: 2026-02-26

import { readFileSync } from 'fs';
import { validateSecurity, validateQuality, deduplicateQuotes, type Quote } from '../.aios-core/copy-chief/etl/etl-helpers';

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: string;
  is_error?: boolean;
}

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: HookInput = JSON.parse(stdin);

    // Only trigger for VOC-related tools
    const vocTools = [
      'mcp__copywriting__voc_search',
      'mcp__apify__call-actor',
      'mcp__apify__get-dataset-items',
    ];

    if (!vocTools.includes(input.tool_name)) {
      process.exit(0);
    }

    if (input.is_error || !input.tool_output) {
      process.exit(0);
    }

    // Try to parse quotes from output
    try {
      const output = input.tool_output;

      // Extract quote-like content from output
      const quoteMatches = output.match(/"[^"]{20,300}"/g) || [];
      if (quoteMatches.length < 3) {
        process.exit(0); // Too few quotes to validate
      }

      const quotes: Quote[] = quoteMatches.map((q) => ({
        text: q.replace(/^"|"$/g, ''),
        platform: input.tool_name.includes('apify') ? 'apify' : 'mcp',
        username: 'unknown',
        engagement: 0,
        intensity: 0,
      }));

      // Run quality checks (security + quality operate on Quote[], completeness on offerPath)
      const security = validateSecurity(quotes);
      const quality = validateQuality(quotes);
      const deduplicated = deduplicateQuotes(quotes);
      const duplicateCount = quotes.length - deduplicated.length;

      console.error(`[ETL-VOC] ${quotes.length} quotes extracted | ${duplicateCount} duplicates removed`);

      if (!security.passed) {
        console.error(`[ETL-VOC] ⚠️ Security: ${security.issues.join('; ')}`);
      }
      if (!quality.passed) {
        console.error(`[ETL-VOC] ⚠️ Quality: ${quality.issues.join('; ')}`);
      }

    } catch {
      // Quote parsing is best-effort
    }

    process.exit(0);
  } catch (error) {
    console.error(`[ETL-VOC] Error: ${error}`);
    process.exit(0);
  }
}

main();
