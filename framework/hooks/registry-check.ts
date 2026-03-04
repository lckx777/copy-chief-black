#!/usr/bin/env bun
// ~/.claude/hooks/registry-check.ts
// PreToolUse hook: warns when creating a component similar to an existing one
// Phase 7: Entity Registry System
// v1.0 - 2026-02-23

import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_PATH = path.join(process.env.HOME!, '.claude/registry.yaml');

interface PreToolUseInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    command?: string;
  };
}

// Read stdin
let inputData = '';
try {
  inputData = fs.readFileSync(0, 'utf8');
} catch {
  process.exit(0);
}

let input: PreToolUseInput;
try {
  input = JSON.parse(inputData);
} catch {
  process.exit(0);
}

function isSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  // Check if one contains the other
  if (al.includes(bl) || bl.includes(al)) return true;
  // Check word overlap (words > 2 chars)
  const aWords = al.split(/[-_.]/).filter((w: string) => w.length > 2);
  const bWords = bl.split(/[-_.]/).filter((w: string) => w.length > 2);
  const overlap = aWords.filter((w: string) => bWords.includes(w));
  return overlap.length >= 2;
}

// Simple YAML parser for our known structure (no external deps)
function parseRegistryYaml(content: string): Record<string, any[]> {
  const entities: Record<string, any[]> = {};
  let currentCategory = '';
  let currentItem: Record<string, any> | null = null;

  for (const line of content.split('\n')) {
    // Match category header like "  hooks:" or "  hooks_lib:"
    const categoryMatch = line.match(/^  (\w+):$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1];
      entities[currentCategory] = [];
      currentItem = null;
      continue;
    }

    // Match list item start like "    - name: \"foo\""
    const itemMatch = line.match(/^    - (\w+):\s*"?([^"]*)"?$/);
    if (itemMatch && currentCategory) {
      currentItem = { [itemMatch[1]]: itemMatch[2] };
      entities[currentCategory].push(currentItem);
      continue;
    }

    // Match continuation property like "      type: \"PreToolUse\""
    const propMatch = line.match(/^      (\w+):\s*"?([^"]*)"?$/);
    if (propMatch && currentItem) {
      currentItem[propMatch[1]] = propMatch[2];
    }
  }

  return entities;
}

function main() {
  // Only check Write/Edit on ecosystem component paths
  if (!['Write', 'Edit'].includes(input.tool_name)) return;

  const filePath = input.tool_input?.file_path;
  if (!filePath) return;

  const watchPaths = [
    '/.claude/hooks/',
    '/.claude/skills/',
    '/.claude/rules/',
    '/.claude/scripts/workers/',
  ];

  if (!watchPaths.some(p => filePath.includes(p))) return;

  // Check if file already exists (only warn for NEW files)
  if (fs.existsSync(filePath)) return;

  // Load registry
  let registryContent: string;
  try {
    registryContent = fs.readFileSync(REGISTRY_PATH, 'utf8');
  } catch {
    return; // No registry, skip silently
  }

  const entities = parseRegistryYaml(registryContent);
  const newName = path.basename(filePath).replace(/\.[^.]+$/, ''); // strip extension

  // Check all entity categories for similar names
  for (const category of Object.keys(entities)) {
    const items = entities[category];
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const existingName = (item.name || item.path || '').replace(/\.[^.]+$/, '');
      if (!existingName) continue;
      if (isSimilar(newName, existingName)) {
        console.error(`\u26a0\ufe0f [REGISTRY] Componente similar encontrado: ${category}/${item.name || item.path}`);
        console.error(`   Novo: ${newName}`);
        console.error(`   Existente: ${existingName}`);
        console.error(`   Verifique se nao e duplicata antes de criar.`);
        return;
      }
    }
  }
}

main();
