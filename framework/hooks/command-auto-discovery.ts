#!/usr/bin/env bun
/**
 * command-auto-discovery.ts — S39.9
 * SessionStart hook: detects new commands/skills since last session
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { homedir } from 'os';

const HOME = homedir();
const COMMANDS_DIR = join(HOME, '.claude', 'commands');
const SKILLS_DIR = join(HOME, '.claude', 'skills');
const CACHE_PATH = join(HOME, '.claude', '.command-cache.json');

interface CacheData {
  commands: string[];
  skills: string[];
  lastChecked: string;
}

function scanCommands(): string[] {
  try {
    return readdirSync(COMMANDS_DIR)
      .filter(f => extname(f) === '.md')
      .map(f => basename(f, '.md'))
      .sort();
  } catch { return []; }
}

function scanSkills(): string[] {
  try {
    return readdirSync(SKILLS_DIR)
      .filter(d => {
        const skillPath = join(SKILLS_DIR, d, 'SKILL.md');
        return existsSync(skillPath);
      })
      .sort();
  } catch { return []; }
}

function loadCache(): CacheData | null {
  try {
    if (!existsSync(CACHE_PATH)) return null;
    return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  } catch { return null; }
}

function saveCache(data: CacheData): void {
  writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
}

// Main
const currentCommands = scanCommands();
const currentSkills = scanSkills();
const cache = loadCache();

const newCommands = cache
  ? currentCommands.filter(c => !cache.commands.includes(c))
  : [];
const newSkills = cache
  ? currentSkills.filter(s => !cache.skills.includes(s))
  : [];

// Save updated cache
saveCache({
  commands: currentCommands,
  skills: currentSkills,
  lastChecked: new Date().toISOString(),
});

// Output for hook
if (newCommands.length > 0 || newSkills.length > 0) {
  const parts: string[] = [];
  if (newCommands.length > 0) {
    parts.push(`New commands: ${newCommands.map(c => '/' + c).join(', ')}`);
  }
  if (newSkills.length > 0) {
    parts.push(`New skills: ${newSkills.join(', ')}`);
  }
  console.log(parts.join(' | '));
} else {
  console.log(`${currentCommands.length} commands, ${currentSkills.length} skills registered`);
}
