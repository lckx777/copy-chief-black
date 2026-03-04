#!/usr/bin/env node
// setup-environment.cjs - One-time environment initialization
// v5.4 - BSSF Fix: stdout=JSON, stderr=display

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

let inputJson = '{}';
try {
  // Read with a short timeout equivalent — just attempt sync read
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

const trigger = parsed.trigger || 'unknown';

// Log setup event
const logFile = path.join(HOME, '.claude', 'logs', 'setup.log');
fs.mkdirSync(path.dirname(logFile), { recursive: true });

const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
fs.appendFileSync(logFile, `[${timestamp}] Setup triggered: ${trigger}\n`);

// Set environment variables if CLAUDE_ENV_FILE is available
const claudeEnvFile = process.env.CLAUDE_ENV_FILE;
if (claudeEnvFile) {
  const envLines = [
    'export ECOSYSTEM_VERSION=5.4',
    `export ECOSYSTEM_ROOT=${HOME}/copywriting-ecosystem`,
    ''
  ].join('\n');
  fs.appendFileSync(claudeEnvFile, envLines);

  const ts2 = new Date().toISOString().replace('T', ' ').slice(0, 19);
  fs.appendFileSync(logFile, `[${ts2}] Environment variables written to ${claudeEnvFile}\n`);
}

// Verify critical directories exist
const criticalDirs = [
  path.join(HOME, '.claude', 'logs'),
  path.join(HOME, '.claude', 'hooks'),
  path.join(HOME, 'copywriting-ecosystem')
];

for (const dir of criticalDirs) {
  if (!fs.existsSync(dir)) {
    const ts3 = new Date().toISOString().replace('T', ' ').slice(0, 19);
    fs.appendFileSync(logFile, `[${ts3}] WARNING: Directory missing: ${dir}\n`);
  }
}

// Return valid JSON (BSSF requirement)
process.stdout.write('{}');
