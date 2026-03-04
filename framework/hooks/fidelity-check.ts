#!/usr/bin/env bun
/**
 * fidelity-check.ts — APEX Fidelity Warning Hook
 * Part of AIOS Sprint S7.6
 *
 * PostToolUse hook for Write|Edit on */production/**/*.md
 * Warns when expert_archetype is set but fidelity score is missing.
 *
 * Created: 2026-03-02
 */

import { readFileSync, existsSync } from "fs";

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
  };
  tool_output?: string;
}

function main(): void {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) return;

    const input: HookInput = JSON.parse(raw);
    const filePath = input.tool_input?.file_path || "";

    // Only check production .md files
    if (!filePath.includes("/production/") || !filePath.endsWith(".md")) return;

    // Check if file exists
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, "utf-8");

    // Must have frontmatter
    if (!content.startsWith("---")) return;

    const hasExpertArchetype = content.includes("expert_archetype:");
    const hasFidelityScore = content.includes("fidelity:") && content.includes("apex_score:");

    if (hasExpertArchetype && !hasFidelityScore) {
      console.error(
        `⚠️ [FIDELITY] expert_archetype definido mas fidelity score ausente: ${filePath}\n` +
        `   Adicione bloco fidelity ao frontmatter ou rode:\n` +
        `   bun run scripts/fidelity-score.ts <expert> ${filePath}\n` +
        `   Ref: ~/.claude/rules/copy-fidelity.md`
      );
    }
  } catch {
    // Silent fail — hooks should never break the workflow
  }
}

main();
