#!/usr/bin/env node
// subagent-stop-validate.cjs - Log subagent completion and optionally validate output
// Hook: SubagentStop — v5.3

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

// Log to file
const logFile = path.join(HOME, '.claude', 'logs', 'subagents.log');
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
fs.appendFileSync(logFile, `[${timestamp}] STOP  | Agent: ${agentType} | ID: ${agentId}\n`);

// For research agents, could add validation here
// if (agentType === 'researcher') {
//   // Check if required outputs exist
// }

// Always allow completion
process.exit(0);
