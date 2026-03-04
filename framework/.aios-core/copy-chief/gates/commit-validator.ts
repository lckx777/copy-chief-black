#!/usr/bin/env bun
/**
 * commit-validator.ts — Commit Validation Module
 * copy-chief/gates/commit-validator.ts
 *
 * Extracted from ~/.claude/hooks/validate-before-commit.ts (340L)
 * Handles: staged file analysis, protected file detection, health checks,
 * mecanismo validation, and gate validation.
 *
 * NOTE: Imports from copy-chief/config/config-loader (kept as-is per spec).
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { getProtectedPaths, isCommitValidationEnabled } from '../config/config-loader';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOME = homedir();
const HEALTH_CHECK = join(HOME, '.claude/scripts/health-check.ts');
const ECOSYSTEM_DIR = join(HOME, 'copywriting-ecosystem');

// Protected paths from framework-config.yaml (S20.4)
let PROTECTED_PATHS: string[] = ['production/'];
try {
  if (isCommitValidationEnabled()) {
    PROTECTED_PATHS = getProtectedPaths();
  }
} catch {
  // Fallback to default if config not available
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: {
    command?: string;
    [key: string]: unknown;
  };
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface CommitValidationDecision {
  allow: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isGitCommitCommand(command: string): boolean {
  const trimmed = command.trim();
  return /\bgit\s+commit\b/.test(trimmed);
}

export function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd: ECOSYSTEM_DIR,
      encoding: 'utf-8',
      timeout: 5000,
    });
    return output
      .trim()
      .split('\n')
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

export function hasProtectedFiles(files: string[]): boolean {
  return files.some((f) => PROTECTED_PATHS.some((p) => f.includes(p)));
}

export function detectOfferFromFiles(files: string[]): string | null {
  for (const file of files) {
    if (file.includes('production/')) {
      const parts = file.split('/');
      const prodIdx = parts.indexOf('production');
      if (prodIdx >= 2) {
        return parts.slice(0, prodIdx).join('/');
      }
    }
  }
  return null;
}

export function runHealthCheck(): ValidationResult {
  if (!existsSync(HEALTH_CHECK)) {
    return { ok: true, message: 'health-check.ts not found, skipping' };
  }

  try {
    const output = execSync(`bun run ${HEALTH_CHECK} --no-cache 2>&1`, {
      cwd: ECOSYSTEM_DIR,
      encoding: 'utf-8',
      timeout: 15000,
    });

    const hasFail = output.includes('FAIL');
    const hasCritical = output.includes('\ud83d\udd34');

    if (hasCritical) {
      return {
        ok: false,
        message: `Health check has CRITICAL failures:\n${output.trim()}`,
      };
    }

    return {
      ok: true,
      message: hasFail ? `Health check warnings:\n${output.trim()}` : 'Health check OK',
    };
  } catch (err: any) {
    const output = err.stdout || err.message || 'Unknown error';
    return {
      ok: false,
      message: `Health check failed:\n${String(output).trim()}`,
    };
  }
}

export function validateMecanismo(offerPath: string): ValidationResult {
  const fullPath = join(ECOSYSTEM_DIR, offerPath, 'mecanismo-unico.yaml');

  if (!existsSync(fullPath)) {
    return {
      ok: false,
      message: `mecanismo-unico.yaml not found at ${offerPath}`,
    };
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const stateMatch = content.match(/state:\s*(\w+)/);
    const state = stateMatch ? stateMatch[1] : 'UNKNOWN';

    if (state === 'VALIDATED' || state === 'APPROVED') {
      return { ok: true, message: `Mecanismo state: ${state}` };
    }

    return {
      ok: false,
      message: `Mecanismo state is ${state} (needs VALIDATED or APPROVED)`,
    };
  } catch {
    return { ok: false, message: 'Failed to read mecanismo-unico.yaml' };
  }
}

export function validateGatesForOffer(offerPath: string): ValidationResult {
  const helixStatePath = join(ECOSYSTEM_DIR, offerPath, 'helix-state.yaml');

  if (!existsSync(helixStatePath)) {
    return {
      ok: false,
      message: `helix-state.yaml not found at ${offerPath}`,
    };
  }

  try {
    const content = readFileSync(helixStatePath, 'utf-8');
    const briefingGate = content.match(/briefing[\s\S]*?passed:\s*(true|false)/);
    const briefingPassed = briefingGate ? briefingGate[1] === 'true' : false;

    if (!briefingPassed) {
      return {
        ok: false,
        message: `Briefing gate not PASSED for ${offerPath}. Cannot commit to production/.`,
      };
    }

    return { ok: true, message: 'Gates OK' };
  } catch {
    return { ok: false, message: 'Failed to read helix-state.yaml' };
  }
}

// ─── Main Validation Logic ────────────────────────────────────────────────────

/**
 * Run all commit validations for a git commit command.
 * Returns decision with errors/warnings for the hook to act on.
 */
export async function processHookEvent(input: HookInput): Promise<CommitValidationDecision> {
  const command = input.tool_input?.command;

  if (!command || !isGitCommitCommand(command)) {
    return { allow: true, errors: [], warnings: [] };
  }

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    return { allow: true, errors: [], warnings: [] };
  }

  if (!hasProtectedFiles(stagedFiles)) {
    return { allow: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const healthResult = runHealthCheck();
  if (!healthResult.ok) {
    errors.push(`[HEALTH] ${healthResult.message}`);
  }

  const offerPath = detectOfferFromFiles(stagedFiles);

  if (offerPath) {
    const mecResult = validateMecanismo(offerPath);
    if (!mecResult.ok) {
      errors.push(`[MECANISMO] ${mecResult.message}`);
    }

    const gateResult = validateGatesForOffer(offerPath);
    if (!gateResult.ok) {
      errors.push(`[GATE] ${gateResult.message}`);
    }
  } else {
    warnings.push('[OFFER] Could not detect offer path from staged production files. Gate validation skipped.');
  }

  return {
    allow: errors.length === 0,
    errors,
    warnings,
  };
}
