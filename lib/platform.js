/**
 * Cross-platform helpers for Copy Chief BLACK
 * Replaces: /dev/stdin, process.env.HOME, hardcoded paths, shell commands
 */
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');

// ─── Path Resolution ───────────────────────────────────────────────

function homeDir() { return os.homedir(); }
function claudeHome() { return path.join(homeDir(), '.claude'); }
function aiosCoreDir() { return path.join(claudeHome(), '.aios-core'); }
function copyChiefDir() { return path.join(aiosCoreDir(), 'copy-chief'); }
function hooksDir() { return path.join(claudeHome(), 'hooks'); }

function ecosystemRoot() {
  if (process.env.ECOSYSTEM_ROOT) return process.env.ECOSYSTEM_ROOT;
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.synapse'))) return dir;
    dir = path.dirname(dir);
  }
  return path.join(homeDir(), 'copywriting-ecosystem');
}

function resolvePath(p) {
  if (p.startsWith('~/') || p === '~') return path.join(homeDir(), p.slice(2));
  return path.resolve(p);
}

function normalizePath(p) { return p.split(/[/\\]/).join(path.sep); }

// ─── Stdin Reading ─────────────────────────────────────────────────

function readStdinSync() {
  try { return fs.readFileSync(0, 'utf8'); }
  catch (e) { return ''; }
}

function readStdinJSON() {
  const raw = readStdinSync();
  if (!raw || !raw.trim()) return null;
  try { return JSON.parse(raw); }
  catch (e) { return null; }
}

// ─── YAML Helpers ──────────────────────────────────────────────────

let _yaml = null;

function getYaml() {
  if (_yaml) return _yaml;
  try { _yaml = require('js-yaml'); }
  catch {
    try { _yaml = require(path.join(aiosCoreDir(), 'node_modules', 'js-yaml')); }
    catch { throw new Error('js-yaml not found. Run: npm install js-yaml'); }
  }
  return _yaml;
}

function readYaml(filePath) {
  const yaml = getYaml();
  const resolved = resolvePath(filePath);
  if (!fs.existsSync(resolved)) return null;
  return yaml.load(fs.readFileSync(resolved, 'utf8')) || {};
}

function writeYaml(filePath, data) {
  const yaml = getYaml();
  const resolved = resolvePath(filePath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(resolved, yaml.dump(data, { lineWidth: -1 }), 'utf8');
}

// ─── File System Helpers ───────────────────────────────────────────

function ensureDir(dirPath) {
  const resolved = resolvePath(dirPath);
  if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

function readFileSafe(filePath, fallback = '') {
  try { return fs.readFileSync(resolvePath(filePath), 'utf8'); }
  catch { return fallback; }
}

function isWindows() { return process.platform === 'win32'; }
function isMacOS() { return process.platform === 'darwin'; }
function nodeBin() { return process.execPath; }

function buildPath() {
  const paths = [];
  if (isWindows()) {
    paths.push(path.dirname(process.execPath));
    const gitPath = findExecutable('git');
    if (gitPath) paths.push(path.dirname(gitPath));
    paths.push(process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : 'C:\\Windows\\System32');
  } else {
    const homeLocal = path.join(homeDir(), '.local', 'bin');
    if (fs.existsSync(homeLocal)) paths.push(homeLocal);
    if (fs.existsSync('/opt/homebrew/bin')) paths.push('/opt/homebrew/bin');
    if (fs.existsSync('/usr/local/bin')) paths.push('/usr/local/bin');
    paths.push('/usr/bin', '/bin', '/usr/sbin', '/sbin');
  }
  return paths.filter(Boolean).join(path.delimiter);
}

function findExecutable(name) {
  const ext = isWindows() ? ['.exe', '.cmd', '.bat', ''] : [''];
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  for (const dir of pathDirs) {
    for (const e of ext) {
      const full = path.join(dir, name + e);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

// ─── Hook Response Helpers ─────────────────────────────────────────

function hookResponse(obj) { process.stdout.write(JSON.stringify(obj)); }
function hookPass() { /* empty = pass */ }
function hookBlock(reason) { hookResponse({ decision: 'block', reason }); }
function hookMessage(message) { hookResponse({ message }); }

// ─── Offer Detection ──────────────────────────────────────────────

function detectOffer() {
  const cwd = process.cwd();
  const eco = ecosystemRoot();
  const rel = path.relative(eco, cwd);
  const parts = rel.split(path.sep);
  if (parts.length >= 2 && !parts[0].startsWith('.')) {
    return { niche: parts[0], offer: parts[1], path: path.join(eco, parts[0], parts[1]) };
  }
  return null;
}

module.exports = {
  homeDir, claudeHome, aiosCoreDir, copyChiefDir, hooksDir,
  ecosystemRoot, resolvePath, normalizePath,
  readStdinSync, readStdinJSON,
  getYaml, readYaml, writeYaml,
  ensureDir, readFileSafe,
  isWindows, isMacOS, nodeBin, buildPath, findExecutable,
  hookResponse, hookPass, hookBlock, hookMessage,
  detectOffer,
};
