'use strict';

/**
 * Web Builder Export (U-36)
 *
 * Bundles agent persona + craft data + offer context into .txt files
 * optimized for web LLM UIs (ChatGPT, Gemini, etc).
 *
 * Usage: node ~/.claude/scripts/export-web.js <agentId> <offerPath>
 *
 * @module export-web
 * @version 1.0.0
 * @atom U-36
 */

const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME;
const AGENTS_DIR = path.join(HOME, '.claude', 'agents');
const ECOSYSTEM_ROOT = path.join(HOME, 'copywriting-ecosystem');
const CRAFT_DIR = path.join(ECOSYSTEM_ROOT, 'squads', 'copy-chief', 'data', 'craft');
const EXPORT_DIR = path.join(ECOSYSTEM_ROOT, 'export', 'web');

/**
 * Export an agent+offer combo for web use.
 *
 * @param {string} agentId - Agent ID (e.g., 'echo')
 * @param {string} offerPath - Relative offer path (e.g., 'saude/florayla')
 * @returns {string} Combined text output
 */
function exportForWeb(agentId, offerPath) {
  const sections = [];

  // 1. Agent persona
  const agentPath = path.join(AGENTS_DIR, `${agentId}.md`);
  if (fs.existsSync(agentPath)) {
    const content = fs.readFileSync(agentPath, 'utf8');
    // Strip frontmatter for web export
    const stripped = content.replace(/^---\n[\s\S]*?\n---\n?/, '').trim();
    sections.push('=== AGENT PERSONA ===\n');
    sections.push(stripped);
    sections.push('\n');
  }

  // 2. Craft data (shared knowledge)
  if (fs.existsSync(CRAFT_DIR)) {
    const craftFiles = fs.readdirSync(CRAFT_DIR).filter(f => f.endsWith('.md'));
    if (craftFiles.length > 0) {
      sections.push('=== CRAFT KNOWLEDGE ===\n');
      for (const file of craftFiles.slice(0, 5)) { // Max 5 craft files
        const content = fs.readFileSync(path.join(CRAFT_DIR, file), 'utf8');
        sections.push(`--- ${file} ---`);
        sections.push(content.slice(0, 2000)); // Truncate long files
        sections.push('');
      }
      sections.push('');
    }
  }

  // 3. Offer context
  const absOffer = path.join(ECOSYSTEM_ROOT, offerPath);
  const contextPath = path.join(absOffer, 'CONTEXT.md');
  if (fs.existsSync(contextPath)) {
    sections.push('=== OFFER CONTEXT ===\n');
    sections.push(fs.readFileSync(contextPath, 'utf8'));
    sections.push('\n');
  }

  // 4. Mecanismo
  const mecPath = path.join(absOffer, 'mecanismo-unico.yaml');
  if (fs.existsSync(mecPath)) {
    sections.push('=== MECANISMO UNICO ===\n');
    sections.push(fs.readFileSync(mecPath, 'utf8'));
    sections.push('\n');
  }

  // 5. HELIX state
  const helixPath = path.join(absOffer, 'helix-state.yaml');
  if (fs.existsSync(helixPath)) {
    sections.push('=== HELIX STATE ===\n');
    sections.push(fs.readFileSync(helixPath, 'utf8'));
    sections.push('\n');
  }

  return sections.join('\n');
}

/**
 * Export and write to file.
 *
 * @param {string} agentId
 * @param {string} offerPath
 * @returns {string} Output file path
 */
function exportToFile(agentId, offerPath) {
  const content = exportForWeb(agentId, offerPath);
  const offerName = path.basename(offerPath);

  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const outputPath = path.join(EXPORT_DIR, `${agentId}-${offerName}.txt`);
  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}

// CLI entry point
if (require.main === module) {
  const agentId = process.argv[2];
  const offerPath = process.argv[3];

  if (!agentId || !offerPath) {
    console.error('Usage: node export-web.js <agentId> <offerPath>');
    process.exit(1);
  }

  const outputPath = exportToFile(agentId, offerPath);
  console.log(`Exported to: ${outputPath}`);
}

module.exports = { exportForWeb, exportToFile };
