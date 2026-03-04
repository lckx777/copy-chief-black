#!/usr/bin/env node
// log-tool-failure.cjs - Loga falhas de ferramentas

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

let input = '{}';
try {
  input = fs.readFileSync(0, 'utf8');
} catch (e) {
  input = '{}';
}

let parsed = {};
try {
  parsed = JSON.parse(input);
} catch (e) {
  parsed = {};
}

const tool = parsed.tool_name || 'unknown';
const error = (parsed.error || '').slice(0, 200);

// Log para arquivo
const logDir = path.join(HOME, '.claude', 'logs');
fs.mkdirSync(logDir, { recursive: true });

const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
const logFile = path.join(logDir, 'tool-failures.log');
fs.appendFileSync(logFile, `[${timestamp}] TOOL_FAILURE: ${tool} - ${error}\n`);

process.exit(0);
