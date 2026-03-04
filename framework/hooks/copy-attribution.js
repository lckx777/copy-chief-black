/**
 * copy-attribution.ts — Auto-Attribution Hook
 * Part of AIOS Upgrade Plan v4.0 § S1.6
 *
 * PostToolUse hook for Write|Edit on */production/**/*.md
 * Checks if attribution YAML frontmatter exists; logs warning if missing.
 *
 * NOTE: This hook does NOT inject attribution (would require re-writing the file
 * after Claude already wrote it, causing loops). Instead, it WARNS when attribution
 * is missing so the producing persona knows to include it.
 *
 * Created: 2026-02-27
 */

const { readFileSync, existsSync } = require('fs');

interface HookInput {
  tool_name;
  tool_input;
  tool_output?;
}

function main() {
  try {
    const raw = readFileSync(0, 'utf8').trim();
    if (!raw) return;

    const input: HookInput = JSON.parse(raw);
    const filePath = input.tool_input?.file_path || "";

    // Only check production .md files
    if (!filePath.includes("/production/") || !filePath.endsWith(".md")) return;

    // Check if file exists and has attribution
    if (!existsSync(filePath)) return;

    const content = readFileSync(filePath, "utf-8");

    // Check for YAML frontmatter with attribution
    const hasFrontmatter = content.startsWith("---");
    const hasAttribution = content.includes("attribution:") && content.includes("produced_by:");

    if (!hasFrontmatter || !hasAttribution) {
      // Output warning via stderr (shown to user)
      console.error(
        `⚠️ [ATTRIBUTION] Deliverable sem attribution header: ${filePath}\n` +
        `   Ref: ~/.claude/templates/partials/attribution-header.md\n` +
        `   Adicione YAML frontmatter com: produced_by, offer, created_at, scores`
      );
    }
  } catch {
    // Silent fail — attribution check is non-blocking
  }
}

main();
