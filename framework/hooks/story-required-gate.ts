#!/usr/bin/env bun
// ~/.claude/hooks/story-required-gate.ts
// Story Required Gate — Gap Closure #1
// v2.0 (2026-03-03) — U-23: Story-Driven Production
//
// Constitution principle: "Nenhum codigo/copy e produzido sem story ativa"
// Story location: {offer}/.aios/story.yaml (status: open | closed)
//
// BLOCKS: Write/Edit to production/* if no open story exists at offer level
// ALLOWS: research/, briefings/, .claude/, scripts/, config files, etc.

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PreToolUseInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

interface PreToolUseOutput {
  decision?: 'block' | 'allow';
  reason?: string;
}

// ─── Paths that REQUIRE an active story ──────────────────────────────────────

const STORY_REQUIRED_PATTERNS = [
  /production\//i,
];

// ─── Paths that are EXEMPT (never need a story) ─────────────────────────────

const EXEMPT_PATTERNS = [
  /\.claude\//i,
  /scripts\//i,
  /hooks\//i,
  /templates\//i,
  /\.synapse\//i,
  /squads\//i,
  /research\//i,
  /briefings?\//i,
  /swipes\//i,
  /reviews?\//i,
  /\.json$/i,
  /\.yaml$/i,
  /\.yml$/i,
  /\.ts$/i,
  /\.js$/i,
  /\.sh$/i,
  /CONTEXT\.md$/i,
  /CLAUDE\.md$/i,
  /README/i,
  /helix-state/i,
  /mecanismo-unico/i,
  /project_state/i,
  /task_plan/i,
  /progress\.md/i,
  /findings\.md/i,
];

// ─── Story Detection ─────────────────────────────────────────────────────────

/**
 * Resolve the offer path from a production file path.
 * Walks up from the file path to find the directory containing .aios/story.yaml.
 * Production paths look like: {ecosystemRoot}/{niche}/{offer}/production/...
 * We look for the first ancestor that has a .aios/ dir or helix-state.yaml.
 */
function resolveOfferPath(filePath: string): string | null {
  const ecosystemRoot = join(process.env.HOME || '/root', 'copywriting-ecosystem');

  // Strip trailing segments until we find the offer root
  let dir = filePath;
  // Remove the filename if it looks like a file (has extension or no trailing slash)
  if (!dir.endsWith('/')) {
    dir = join(dir, '..'); // go up one level from the file
  }

  // Walk up at most 6 levels looking for an .aios dir or helix-state.yaml
  for (let i = 0; i < 6; i++) {
    if (dir === '/' || dir === ecosystemRoot || dir === process.env.HOME) break;

    const aiosDir = join(dir, '.aios');
    const helixState = join(dir, 'helix-state.yaml');

    if (existsSync(aiosDir) || existsSync(helixState)) {
      return dir;
    }

    dir = join(dir, '..');
  }

  return null;
}

/**
 * Check if there's an open story for the offer that owns this file path.
 * Reads from {offer}/.aios/story.yaml (status: 'open' = active).
 * Falls back to scanning ecosystem for any open story if offer can't be resolved.
 */
function hasActiveStory(filePath: string): { active: boolean; storyName?: string; offerPath?: string } {
  try {
    // First: try to resolve story from the specific offer this file belongs to
    const offerPath = resolveOfferPath(filePath);

    if (offerPath) {
      const storyFile = join(offerPath, '.aios', 'story.yaml');
      if (existsSync(storyFile)) {
        const content = readFileSync(storyFile, 'utf-8');
        // Parse status field from YAML (simple line-based read, avoid full YAML parse dependency)
        const statusMatch = content.match(/^status:\s*['"]?(\w+)['"]?/m);
        const status = statusMatch ? statusMatch[1] : null;
        if (status === 'open') {
          const phaseMatch = content.match(/^phase:\s*['"]?([^\s'"]+)['"]?/m);
          const phase = phaseMatch ? phaseMatch[1] : 'unknown';
          return { active: true, storyName: `${offerPath.split('/').slice(-2).join('/')}:${phase}`, offerPath };
        }
        // Story exists but is closed — block
        return { active: false, offerPath };
      }
      // No story.yaml at offer level — no story exists
      return { active: false, offerPath };
    }

    // Fallback: scan all offers in ecosystem for an open story
    const ecosystemRoot = join(process.env.HOME || '/root', 'copywriting-ecosystem');
    if (!existsSync(ecosystemRoot)) return { active: false };

    const niches = readdirSync(ecosystemRoot).filter(n => {
      if (n.startsWith('.') || n === 'squads' || n === 'scripts' || n === 'site') return false;
      try {
        return readdirSync(join(ecosystemRoot, n)).length > 0;
      } catch { return false; }
    });

    for (const niche of niches) {
      try {
        const offers = readdirSync(join(ecosystemRoot, niche));
        for (const offer of offers) {
          const storyFile = join(ecosystemRoot, niche, offer, '.aios', 'story.yaml');
          if (!existsSync(storyFile)) continue;
          const content = readFileSync(storyFile, 'utf-8');
          const statusMatch = content.match(/^status:\s*['"]?(\w+)['"]?/m);
          if (statusMatch && statusMatch[1] === 'open') {
            return { active: true, storyName: `${niche}/${offer}` };
          }
        }
      } catch { /* skip unreadable */ }
    }

    return { active: false };
  } catch {
    // If we can't read stories, fail-open (don't block)
    return { active: true };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  try {
    const stdin = readFileSync(0, 'utf8');
    const input: PreToolUseInput = JSON.parse(stdin);

    const toolName = input.tool_name;

    // Only check Write and Edit
    if (!['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(toolName)) {
      allow();
      return;
    }

    // Extract file path
    const filePath = (input.tool_input?.file_path || input.tool_input?.path || input.tool_input?.notebook_path || '') as string;
    if (!filePath) {
      allow();
      return;
    }

    // Check if path is exempt
    if (EXEMPT_PATTERNS.some(p => p.test(filePath))) {
      allow();
      return;
    }

    // Check if path requires a story
    const requiresStory = STORY_REQUIRED_PATTERNS.some(p => p.test(filePath));
    if (!requiresStory) {
      allow();
      return;
    }

    // Check for active story in {offer}/.aios/story.yaml
    const { active, storyName } = hasActiveStory(filePath);

    if (active) {
      console.error(`[STORY-GATE] OK: Active story "${storyName}" — write allowed to ${filePath}`);
      allow();
      return;
    }

    // No open story — hard block (U-23: story is required for production writes)
    block(filePath);

  } catch (error) {
    console.error(`[STORY-GATE] Error: ${error}`);
    allow(); // Fail-open
  }
}

function allow(): void {
  console.log(JSON.stringify({}));
  process.exit(0);
}

function block(filePath: string): void {
  const offerHint = resolveOfferPath(filePath);
  const storyLocation = offerHint
    ? `${offerHint}/.aios/story.yaml`
    : '{offer}/.aios/story.yaml';

  const output: PreToolUseOutput = {
    decision: 'block',
    reason: `BLOQUEADO — Nenhuma story aberta para esta oferta

**Arquivo:** ${filePath}
**Principio:** "Nenhum codigo/copy e produzido sem story ativa"
**Fonte:** U-23 Story-Driven Production

Writes em production/ requerem uma story com status: open em:
  ${storyLocation}

**ACAO:**
1. Crie a story com StoryManager.createStory(offerPath, phase, workflowDef)
   Ou manualmente: escreva ${storyLocation} com status: open
2. A story define os acceptance_criteria do que deve ser entregue
3. Ao concluir, feche com StoryManager.closeStory(offerPath)

Exemplo de story.yaml:
\`\`\`yaml
status: open
phase: production
created_at: "${new Date().toISOString()}"
acceptance_criteria:
  - id: vsl-draft
    description: "echo produces production/vsl/vsl-draft.md"
    expected_outputs: ["production/vsl/vsl-draft.md"]
completed_criteria: []
\`\`\``,
  };

  console.error(`[STORY-GATE] BLOCKED: No active story for production write to ${filePath}`);
  console.log(JSON.stringify(output));
  process.exit(0);
}

main();
