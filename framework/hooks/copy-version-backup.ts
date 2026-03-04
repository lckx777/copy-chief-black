#!/usr/bin/env bun
/**
 * Copy Version Backup — PreToolUse hook
 * Auto-saves version backup before Write overwrites production files.
 */

import { readFileSync } from 'fs';
import { backupVersion } from '../.aios-core/copy-chief/copy/copy-versioning';

let input = '';
try {
  input = readFileSync(0, 'utf8');
} catch { process.exit(0); }

let hookData: any;
try {
  hookData = JSON.parse(input);
} catch { process.exit(0); }

const toolName = hookData?.tool_name || '';
const toolInput = hookData?.tool_input || {};

// Only intercept Write to production paths
if (toolName !== 'Write') process.exit(0);

const filePath = toolInput?.file_path || '';
if (!filePath.includes('/production/')) process.exit(0);

// Skip .versions/ directory itself
if (filePath.includes('/.versions/')) process.exit(0);

// Backup the current version
const versionPath = backupVersion(filePath);
if (versionPath) {
  console.error(`📦 Version backup: ${versionPath.split('/').slice(-2).join('/')}`);
}

console.log('{}');
