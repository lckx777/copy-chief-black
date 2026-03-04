#!/usr/bin/env bun
/**
 * Pre-Tool-Use Hook
 *
 * Executa ANTES de cada tool call para gate enforcement.
 * Implementa bloqueio de produção sem gates aprovados.
 *
 * Gates:
 * 1. Research Gate - Antes de briefing
 * 2. Briefing Gate - Antes de produção
 * 3. Anti-Hivemind - Sempre em produção de copy
 */

import { existsSync, readFileSync } from "fs";
import path from "path";

interface HookInput {
  tool_name: string;
  tool_input: Record<string, any>;
}

interface HookResult {
  allow: boolean;
  message?: string;
}

// Tools that create production copy
const PRODUCTION_TOOLS = [
  "write_chapter",
  "Write", // Claude Code's write tool
];

// File patterns that indicate production output
const PRODUCTION_PATTERNS = [
  /production\//,
  /\/vsl\//,
  /\/landing-page\//,
  /\/creatives\//,
  /\/emails\//,
  /draft.*\.md$/,
  /final.*\.md$/,
];

/**
 * Check if a file path is a production output
 */
function isProductionPath(filePath: string): boolean {
  return PRODUCTION_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Extract offer path from file path or tool input
 */
function extractOfferPath(input: Record<string, any>): string | null {
  // Check direct offer_path
  if (input.offer_path) {
    return input.offer_path;
  }

  // Check file_path for Write tool
  if (input.file_path) {
    const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
    const relativePath = path.relative(ecosystemBase, input.file_path);

    if (!relativePath.startsWith("..")) {
      const parts = relativePath.split(path.sep);
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}`;
      }
    }
  }

  return null;
}

/**
 * Check if research gate is passed
 */
function checkResearchGate(offerPath: string): { passed: boolean; reason?: string } {
  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerDir = path.join(ecosystemBase, offerPath);

  const requiredFiles = [
    "research/synthesis.md",
    "research/voc/summary.md",
    "research/competitors/summary.md",
  ];

  const missing: string[] = [];

  for (const file of requiredFiles) {
    const filePath = path.join(offerDir, file);
    if (!existsSync(filePath)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    return {
      passed: false,
      reason: `Research Gate não passou. Faltam: ${missing.join(", ")}`,
    };
  }

  // Check synthesis confidence if exists
  const synthesisPath = path.join(offerDir, "research/synthesis.md");
  if (existsSync(synthesisPath)) {
    const content = readFileSync(synthesisPath, "utf-8");
    const confidenceMatch = content.match(/confidence[:\s]+(\d+)%?/i);
    if (confidenceMatch) {
      const confidence = parseInt(confidenceMatch[1], 10);
      if (confidence < 70) {
        return {
          passed: false,
          reason: `Research Gate: Confidence ${confidence}% < 70% mínimo`,
        };
      }
    }
  }

  return { passed: true };
}

/**
 * Check if briefing gate is passed
 */
function checkBriefingGate(offerPath: string): { passed: boolean; reason?: string } {
  const ecosystemBase = process.env.COPYWRITING_ECOSYSTEM || path.join(process.env.HOME || "~", "copywriting-ecosystem");
  const offerDir = path.join(ecosystemBase, offerPath);

  // Check critical phases
  const criticalPhases = ["fase-05.md", "fase-06.md"];
  const missing: string[] = [];

  for (const phase of criticalPhases) {
    const phasePath = path.join(offerDir, "briefings/phases", phase);
    if (!existsSync(phasePath)) {
      missing.push(phase);
    } else {
      // Check for minimum content
      const content = readFileSync(phasePath, "utf-8");
      if (content.split(/\s+/).length < 100) {
        missing.push(`${phase} (incompleto)`);
      }
    }
  }

  if (missing.length > 0) {
    return {
      passed: false,
      reason: `Briefing Gate não passou. Faltam fases críticas: ${missing.join(", ")}`,
    };
  }

  return { passed: true };
}

/**
 * Check for anti-hivemind violations in content
 */
function checkAntiHivemind(content: string): { passed: boolean; violations?: string[] } {
  const bannedPatterns = [
    { pattern: /\b(elevate|seamless|unlock|leverage|empower)\b/gi, name: "banned_word" },
    { pattern: /\bgame-?changer\b/gi, name: "banned_word" },
    { pattern: /\bIn today's \w+ world\b/gi, name: "banned_structure" },
    { pattern: /\bWhat if I told you\b/gi, name: "banned_structure" },
  ];

  const violations: string[] = [];

  for (const { pattern, name } of bannedPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(`${name}: "${matches[0]}"`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Main hook execution
 */
async function main() {
  try {
    // Read input from stdin
    const input = await new Promise<string>((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
    });

    if (!input) {
      // No input, allow by default
      console.log(JSON.stringify({ allow: true }));
      return;
    }

    const hookInput: HookInput = JSON.parse(input);
    const { tool_name, tool_input } = hookInput;

    // Check if this is a production tool
    const isProductionTool = PRODUCTION_TOOLS.includes(tool_name);
    const isProductionFile = tool_input.file_path && isProductionPath(tool_input.file_path);

    if (!isProductionTool && !isProductionFile) {
      // Not a production action, allow
      console.log(JSON.stringify({ allow: true }));
      return;
    }

    // Extract offer path
    const offerPath = extractOfferPath(tool_input);

    if (!offerPath) {
      // Can't determine offer, warn but allow
      console.error("[copywriting-mcp] Warning: Could not determine offer path for gate check");
      console.log(JSON.stringify({ allow: true }));
      return;
    }

    // Check gates
    const researchGate = checkResearchGate(offerPath);
    if (!researchGate.passed) {
      console.error(`[copywriting-mcp] ❌ BLOCKED: ${researchGate.reason}`);
      console.log(JSON.stringify({
        allow: false,
        message: researchGate.reason,
      }));
      return;
    }

    const briefingGate = checkBriefingGate(offerPath);
    if (!briefingGate.passed) {
      console.error(`[copywriting-mcp] ❌ BLOCKED: ${briefingGate.reason}`);
      console.log(JSON.stringify({
        allow: false,
        message: briefingGate.reason,
      }));
      return;
    }

    // Check anti-hivemind if content is being written
    if (tool_input.content) {
      const hivemindCheck = checkAntiHivemind(tool_input.content);
      if (!hivemindCheck.passed) {
        console.error(`[copywriting-mcp] ⚠️ Anti-Hivemind violations: ${hivemindCheck.violations?.join(", ")}`);
        // Warn but don't block - just log
      }
    }

    // All gates passed
    console.error(`[copywriting-mcp] ✅ Gates passed for ${offerPath}`);
    console.log(JSON.stringify({ allow: true }));

  } catch (error) {
    // On error, allow to not block workflow
    console.error(`[copywriting-mcp] Hook error: ${error}`);
    console.log(JSON.stringify({ allow: true }));
  }
}

main();
