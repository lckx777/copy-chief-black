#!/usr/bin/env bun
// hooks/completion-verifier.ts — PostToolUse hook
// Port: mega-brain "Law of Iron" — No completion claim without fresh verification evidence.
// Triggers on: Write to memory files containing DONE/WIRED/COMPLETE claims.
// Also runs verifier on any Write to hooks/, kernel/, scripts/ .ts files.

import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';

const HOME = process.env.HOME || '/tmp';

// ─── Hook Input ─────────────────────────────────────────────────────────────

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    command?: string;
  };
  tool_output?: string;
}

const input: HookInput = JSON.parse(process.argv[2] || '{}');
const toolName = input.tool_name;
const filePath = input.tool_input?.file_path || '';
const content = input.tool_input?.content || '';

// ─── Only trigger on Write/Edit ─────────────────────────────────────────────

if (toolName !== 'Write' && toolName !== 'Edit') {
  process.exit(0);
}

// ─── Detect completion claims in memory writes ──────────────────────────────

const MEMORY_PATHS = [
  'memory/MEMORY.md',
  'memory/',
  'MEMORY.md',
];

const COMPLETION_CLAIMS = [
  /ALL\s+\d+\s+WIRED/i,
  /ALL\s+(?:DONE|COMPLETE|WIRED|IMPLEMENTED|VERIFIED)/i,
  /\d+\/\d+\s+(?:DONE|COMPLETE|WIRED)/i,
  /STATUS:\s*(?:IMPLEMENTED|COMPLETE|WIRED|DONE)/i,
  /\b(?:FULLY\s+)?IMPLEMENTED\b/i,
];

const isMemoryWrite = MEMORY_PATHS.some(p => filePath.includes(p));
const hasClaim = COMPLETION_CLAIMS.some(p => p.test(content));

if (isMemoryWrite && hasClaim) {
  // Extract what's being claimed
  const claims: string[] = [];
  for (const pattern of COMPLETION_CLAIMS) {
    const match = content.match(pattern);
    if (match) claims.push(match[0]);
  }

  console.error(`\n[COMPLETION-VERIFIER] ⚠️  Completion claim detected in memory write:`);
  console.error(`  Claims: ${claims.join(', ')}`);
  console.error(`  File: ${filePath}`);
  console.error(`  `);
  console.error(`  LAW OF IRON: No completion claim without fresh verification evidence.`);
  console.error(`  Before writing "${claims[0]}", verify your claims with actual evidence.`);
  console.error(`  Run: grep -r "import.*from" ~/.claude/hooks/ to check wiring.`);
  console.error(``);
}

// ─── Verify newly created .ts files in hooks/lib or kernel ──────────────────

const WATCHED_DIRS = [
  join(HOME, '.claude', 'hooks'),
  join(HOME, '.claude', 'hooks', 'lib'),
];

const isWatchedFile = filePath.endsWith('.ts') && WATCHED_DIRS.some(d => filePath.startsWith(d));

// Orphan detection was removed — kernel/ archived during AIOS fork.
// The completion claim detection above is the primary value of this hook.

process.exit(0);
