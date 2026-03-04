#!/usr/bin/env node
// filter-bash-output.cjs - Filter verbose bash output to save tokens
// Hook: PreToolUse (Bash matcher) — v5.3

'use strict';
const fs = require('fs');

let inputJson = '{}';
try {
  inputJson = fs.readFileSync(0, 'utf8');
} catch (e) {
  inputJson = '{}';
}

let parsed = {};
try {
  parsed = JSON.parse(inputJson);
} catch (e) {
  process.exit(0);
}

const command = (parsed.tool_input || {}).command || '';

// Exit early if no command
if (!command) {
  process.exit(0);
}

let modifiedCommand = '';

// Pattern 1: Test commands - show only failures and summary
if (/npm test|jest|pytest|vitest|mocha/.test(command)) {
  modifiedCommand = `${command} 2>&1 | grep -E '(FAIL|PASS|Error|●|✓|✕|Test Suites|Tests:|passed|failed|error)' || true`;
}

// Pattern 2: Build commands - show only errors and warnings
if (/npm run build|tsc|webpack|vite build/.test(command)) {
  modifiedCommand = `${command} 2>&1 | grep -E '(error|warning|Error|Warning|ENOENT|failed)' || echo '[BUILD OK - no errors]'`;
}

// Pattern 3: Install commands - show only summary
if (/npm install|pip install|brew install/.test(command)) {
  modifiedCommand = `${command} 2>&1 | tail -n 10`;
}

// Pattern 4: Find commands with too many results - add head limit
if (/^find/.test(command) && !command.includes('head') && !command.includes('wc')) {
  modifiedCommand = `${command} | head -50`;
}

// If we have a modified command, return updated input
if (modifiedCommand) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: {
        command: modifiedCommand
      }
    }
  }));
  process.exit(0);
}

// Allow unmodified
process.exit(0);
