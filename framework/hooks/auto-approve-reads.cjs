#!/usr/bin/env node
// auto-approve-reads.cjs - Auto-aprova leituras seguras
// JSON output com decision

'use strict';
const fs = require('fs');

let input = '';
try {
  input = fs.readFileSync(0, 'utf8');
} catch (e) {
  input = '{}';
}

let parsed = {};
try {
  parsed = JSON.parse(input);
} catch (e) {
  process.exit(0);
}

const filePath = (parsed.tool_input || {}).file_path || '';

// Bloquear arquivos sensíveis — não auto-aprovar, deixar prompt normal
if (/(\\.env|credentials|\\.git\/|node_modules\/)/.test(filePath)) {
  process.exit(0);
}

// Auto-aprovar arquivos de research e briefings
if (/(research\/|briefings\/|SKILL\.md|CLAUDE\.md)/.test(filePath)) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PermissionRequest',
      decision: { behavior: 'allow' }
    }
  }));
  process.exit(0);
}

// Outros arquivos: deixar prompt normal
process.exit(0);
