#!/usr/bin/env bun
/**
 * mermaid-auto-update.ts — Auto-regenerate pipeline-diagram.md on state changes
 * Sprint S24.5 — Auto-Update Hook
 *
 * PostToolUse hook for Write|Edit events.
 * Triggers when helix-state.yaml or project_state.yaml is modified.
 * Regenerates {offer}/pipeline-diagram.md via yaml-to-mermaid.ts.
 *
 * Created: 2026-03-02
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join, basename, resolve } from "path";
import { spawnSync } from "child_process";

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
  };
  tool_output?: string;
}

const SCRIPT_PATH = resolve(
  process.env.HOME ?? "~",
  "copywriting-ecosystem/scripts/yaml-to-mermaid.ts"
);

const TRIGGER_FILES = ["helix-state.yaml", "project_state.yaml"];

function main(): void {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) return;

    const input: HookInput = JSON.parse(raw);
    const filePath = input.tool_input?.file_path ?? "";

    if (!filePath) return;

    // Check if it's a trigger file
    const fileName = basename(filePath);
    if (!TRIGGER_FILES.includes(fileName)) return;

    // Determine offer directory
    const offerDir = dirname(filePath);
    const helixStateFile = join(offerDir, "helix-state.yaml");

    // Need helix-state.yaml to generate the diagram
    if (!existsSync(helixStateFile)) return;

    // Skip scaffold/template directories
    if (
      offerDir.includes("/scripts/") ||
      offerDir.includes("/assemblers/") ||
      offerDir.includes("/.claude/")
    ) {
      return;
    }

    // Run the converter
    if (!existsSync(SCRIPT_PATH)) {
      console.error(`[mermaid-auto-update] Script not found: ${SCRIPT_PATH}`);
      return;
    }

    const outputPath = join(offerDir, "pipeline-diagram.md");

    const result = spawnSync(
      "bun",
      ["run", SCRIPT_PATH, "--file", helixStateFile, "--format", "md", "--output", outputPath],
      {
        encoding: "utf-8",
        timeout: 10_000,
      }
    );

    if (result.error) {
      console.error(`[mermaid-auto-update] Spawn error: ${result.error.message}`);
      return;
    }

    if (result.status !== 0) {
      // Non-zero exit but not fatal — just log
      const errOutput = result.stderr ?? "";
      if (errOutput.trim()) {
        console.error(`[mermaid-auto-update] Warning: ${errOutput.trim()}`);
      }
      return;
    }

    // Success — log to stderr (visible to user as info)
    const offerName = basename(offerDir);
    console.error(`[mermaid-auto-update] Diagram updated: ${offerName}/pipeline-diagram.md`);

  } catch (err) {
    // Never crash — hook failure must be silent
    if (process.env.MERMAID_DEBUG) {
      console.error(`[mermaid-auto-update] Error: ${err}`);
    }
  }
}

main();
