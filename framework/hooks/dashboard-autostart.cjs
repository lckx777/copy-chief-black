#!/usr/bin/env node
// dashboard-autostart.cjs - Auto-start dashboard server on SessionStart
// Inspired by Serena MCP auto-open pattern

'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

const HOME = os.homedir();
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || '4001';
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;
const DASHBOARD_SCRIPT = path.join(HOME, '.claude', 'dashboard', 'server.ts');
const DASHBOARD_LOG = path.join(HOME, '.claude', 'logs', 'dashboard.log');
const DASHBOARD_PID_FILE = path.join(HOME, '.claude', 'logs', 'dashboard.pid');

function display(msg) {
  process.stderr.write(msg + '\n');
}

// Ensure logs dir exists
fs.mkdirSync(path.join(HOME, '.claude', 'logs'), { recursive: true });

// Check if server is already running on the port
function isPortInUse(port) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

if (isPortInUse(DASHBOARD_PORT)) {
  display(`Dashboard: ${DASHBOARD_URL} (already running)`);
  process.stdout.write('{}');
  process.exit(0);
}

// Start dashboard server in background
if (fs.existsSync(DASHBOARD_SCRIPT)) {
  const logFd = fs.openSync(DASHBOARD_LOG, 'a');
  const child = spawn('bun', ['run', DASHBOARD_SCRIPT], {
    detached: true,
    stdio: ['ignore', logFd, logFd]
  });
  const pid = child.pid;
  child.unref();
  fs.closeSync(logFd);
  fs.writeFileSync(DASHBOARD_PID_FILE, String(pid));

  // Wait briefly for server to start (1 second equivalent via sync sleep)
  const waitUntil = Date.now() + 1000;
  while (Date.now() < waitUntil) {
    // busy wait — acceptable in a hook init context
  }

  if (isPortInUse(DASHBOARD_PORT)) {
    display(`Dashboard: ${DASHBOARD_URL} (started, PID ${pid})`);
  } else {
    display(`Dashboard: failed to start (check ${DASHBOARD_LOG})`);
  }
} else {
  display(`Dashboard: server.ts not found at ${DASHBOARD_SCRIPT}`);
}

process.stdout.write('{}');
