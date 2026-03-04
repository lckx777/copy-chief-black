'use strict';

/**
 * Ops Commit Scanner
 * Event: UserPromptSubmit
 * Budget: <3s
 *
 * Detects commit intent → scans ALL tracked repos → injects structured
 * multi-repo diff summary. The LLM receives the full picture and executes.
 *
 * AIOS pattern: deterministic code prepares data, LLM is the CPU.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMMIT_PATTERNS = [
  /^commit$/i,
  /^commita$/i,
  /^commitar$/i,
  /\bcommit(ar|a|e)?\s*(tudo|all|everything|repos?)?\b/i,
  /\bsync\s+(repos?|tudo|all)\b/i,
  /\bpush(ar)?\s*(tudo|all)?\b/i,
];

const REPOS = [
  { id: 'ecosystem', path: path.join(process.env.HOME, 'copywriting-ecosystem') },
  { id: 'claude', path: path.join(process.env.HOME, '.claude') },
];

// Classification patterns for grouping files into logical commits
const FILE_GROUPS = [
  {
    id: 'auto-generated',
    label: 'chore: auto-sync',
    patterns: [
      /doc-rot-report\.yaml$/,
      /hook-metrics\.json$/,
      /\.command-cache\.json$/,
      /\.health-cache\.json$/,
      /mcp-needs-auth-cache\.json$/,
      /ecosystem-status\.md$/,
      /history\.jsonl$/,
      /known_marketplaces\.json$/,
      /events\.db/,
      /image-cache\//,
    ],
  },
  {
    id: 'dashboard-build',
    label: 'chore(dashboard): rebuild static export',
    patterns: [
      /dashboard-v2\/\.next\//,
      /dashboard-v2\/out\//,
    ],
  },
  {
    id: 'meaningful',
    label: null, // LLM decides the message
    patterns: [], // catch-all
  },
];

function detectCommitIntent(prompt) {
  if (!prompt || typeof prompt !== 'string') return false;
  const trimmed = prompt.trim();
  if (trimmed.length > 500) return false;
  return COMMIT_PATTERNS.some(p => p.test(trimmed));
}

function exec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 3000 }).trim();
  } catch {
    return '';
  }
}

function scanRepo(repo) {
  if (!fs.existsSync(path.join(repo.path, '.git'))) return null;

  const porcelain = exec('git status --porcelain', repo.path);
  if (!porcelain) return null;

  const branch = exec('git branch --show-current', repo.path);
  const diffStat = exec('git diff --stat', repo.path);
  const lines = porcelain.split('\n').filter(Boolean);

  const files = { modified: [], untracked: [], deleted: [] };
  for (const line of lines) {
    const code = line.substring(0, 2);
    const file = line.substring(3);
    if (code.includes('?')) files.untracked.push(file);
    else if (code.includes('D')) files.deleted.push(file);
    else files.modified.push(file);
  }

  return { ...repo, branch, diffStat, files, totalChanges: lines.length };
}

function classifyFile(filepath) {
  for (const group of FILE_GROUPS) {
    if (group.patterns.length === 0) continue;
    if (group.patterns.some(p => p.test(filepath))) return group.id;
  }
  return 'meaningful';
}

function groupFiles(scan) {
  const groups = {};
  const allFiles = [...scan.files.modified, ...scan.files.untracked];

  for (const file of allFiles) {
    const groupId = classifyFile(file);
    if (!groups[groupId]) groups[groupId] = [];
    groups[groupId].push(file);
  }

  // Also track deletions
  if (scan.files.deleted.length > 0) {
    const groupId = classifyFile(scan.files.deleted[0]);
    if (!groups[groupId]) groups[groupId] = [];
    groups[groupId].push(...scan.files.deleted.map(f => `(deleted) ${f}`));
  }

  return groups;
}

function buildRepoXml(scan) {
  const groups = groupFiles(scan);
  const groupEntries = Object.entries(groups);

  const groupsXml = groupEntries.map(([groupId, files]) => {
    const groupDef = FILE_GROUPS.find(g => g.id === groupId) || FILE_GROUPS[2];
    const suggestedMsg = groupDef.label || 'LLM: analyze diff and write descriptive commit message';
    const fileList = files.slice(0, 30).map(f => `        <file>${f}</file>`).join('\n');
    const truncated = files.length > 30 ? `\n        <truncated remaining="${files.length - 30}" />` : '';
    return [
      `      <group id="${groupId}" count="${files.length}" suggested_message="${suggestedMsg}">`,
      fileList + truncated,
      `      </group>`,
    ].join('\n');
  }).join('\n');

  return [
    `    <repo id="${scan.id}" path="${scan.path}" branch="${scan.branch}" total="${scan.totalChanges}">`,
    `      <counts modified="${scan.files.modified.length}" untracked="${scan.files.untracked.length}" deleted="${scan.files.deleted.length}" />`,
    `      <diff-stat>\n${scan.diffStat}\n      </diff-stat>`,
    groupsXml,
    `    </repo>`,
  ].join('\n');
}

async function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  let context = {};
  try {
    context = JSON.parse(input);
  } catch {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  if (!detectCommitIntent(context.prompt || '')) {
    process.stdout.write(JSON.stringify({}));
    return;
  }

  const scans = REPOS.map(scanRepo).filter(Boolean);

  if (scans.length === 0) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        additionalContext: '<ops-commit-scan status="ALL_CLEAN">\n  Both repos clean. Nothing to commit.\n</ops-commit-scan>',
      },
    }));
    return;
  }

  const totalChanges = scans.reduce((sum, s) => sum + s.totalChanges, 0);
  const reposXml = scans.map(buildRepoXml).join('\n');

  const xml = [
    `<ops-commit-scan repos="${scans.length}" total_changes="${totalChanges}">`,
    reposXml,
    '    <protocol>',
    '      MULTI-REPO COMMIT — EXECUTE NOW:',
    '      1. Process each repo independently',
    '      2. For "meaningful" groups: read diffs, write descriptive feat/fix message',
    '      3. For "auto-generated" groups: commit as "chore: auto-sync"',
    '      4. For "dashboard-build" groups: commit as "chore(dashboard): rebuild"',
    '      5. Commit meaningful FIRST, then chore groups',
    '      6. Report final status of ALL repos when done',
    '      7. DO NOT ask — execute all commits immediately',
    '    </protocol>',
    '</ops-commit-scan>',
  ].join('\n');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      additionalContext: xml,
    },
  }));
}

main().catch(() => process.exit(0));
