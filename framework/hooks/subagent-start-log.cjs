#!/usr/bin/env node
// subagent-start-log.cjs - Log subagent context when spawning
// Hook: SubagentStart — v5.3

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

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
  parsed = {};
}

const agentId = parsed.agent_id || 'unknown';
const agentType = parsed.agent_type || 'unknown';
const cwd = parsed.cwd || 'unknown';

// Log to file
const logFile = path.join(HOME, '.claude', 'logs', 'subagents.log');
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
fs.appendFileSync(logFile, `[${timestamp}] START | Agent: ${agentType} | ID: ${agentId} | CWD: ${cwd}\n`);

// Always allow
process.exit(0);
