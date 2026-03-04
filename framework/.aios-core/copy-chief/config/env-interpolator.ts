// hooks/lib/env-interpolator.ts — Port of aios-core env-interpolator.js
/**
 * Environment Variable Interpolator
 *
 * Resolves ${ENV_VAR} and ${ENV_VAR:-default} patterns in configuration values.
 * Applied at load time after merge, per ADR-PRO-002.
 *
 * Rules:
 * - ${VAR}: resolves to process.env.VAR; warns if missing, returns ''
 * - ${VAR:-default}: resolves to process.env.VAR or 'default' if unset
 * - Recursive: walks nested objects and arrays
 * - lintEnvPatterns: flags ${...} patterns in framework/project config files
 *
 * @module hooks/lib/env-interpolator
 * @version 1.0.0
 * @ported-from aios-core/.aios-core/core/config/env-interpolator.js
 */

import { isPlainObject } from './merge-utils';

/**
 * Regex for ${ENV_VAR} and ${ENV_VAR:-default_value}
 * Captures: group 1 = var name, group 2 = default value (optional, after :-)
 */
export const ENV_VAR_PATTERN = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-(.*?))?\}/g;

export interface InterpolateOptions {
  warnings?: string[];
}

/**
 * Interpolate environment variables in a single string value.
 *
 * @param value - String potentially containing ${VAR} or ${VAR:-default} patterns
 * @param options - Options object; pass warnings array to collect missing-var messages
 * @returns Interpolated string
 */
export function interpolateString(value: string, options?: InterpolateOptions): string {
  const warnings = options?.warnings ?? [];

  // Reset lastIndex since ENV_VAR_PATTERN is a shared module-level regex with /g flag
  ENV_VAR_PATTERN.lastIndex = 0;

  return value.replace(ENV_VAR_PATTERN, (_match: string, varName: string, defaultValue: string | undefined) => {
    const envValue = process.env[varName];

    if (envValue !== undefined) {
      return envValue;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // Missing required env var (no default)
    warnings.push(`Missing environment variable: ${varName} (no default set)`);
    return '';
  });
}

/**
 * Recursively interpolate environment variables in a config value.
 *
 * Walks all nested objects and arrays. Only string values are interpolated.
 *
 * @param config - Configuration value (object, array, or scalar)
 * @param options - Options; pass warnings array to collect missing-var messages
 * @returns Interpolated configuration (same shape, new object)
 */
export function interpolateEnvVars(config: unknown, options?: InterpolateOptions): unknown {
  const warnings = options?.warnings ?? [];

  if (typeof config === 'string') {
    return interpolateString(config, { warnings });
  }

  if (Array.isArray(config)) {
    return config.map(item => interpolateEnvVars(item, { warnings }));
  }

  if (isPlainObject(config)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
      result[key] = interpolateEnvVars(value, { warnings });
    }
    return result;
  }

  // Numbers, booleans, null — return as-is
  return config;
}

/**
 * Check a config object for ${...} patterns that probably shouldn't be
 * in committed files (L1/L2). Returns an array of findings.
 *
 * @param config - Configuration to lint
 * @param sourceFile - File name for reporting
 * @returns Array of warning strings
 */
export function lintEnvPatterns(config: unknown, sourceFile: string): string[] {
  const findings: string[] = [];

  function walk(obj: unknown, path: string): void {
    if (typeof obj === 'string') {
      // Reset lastIndex before test() since pattern has /g flag
      ENV_VAR_PATTERN.lastIndex = 0;
      if (ENV_VAR_PATTERN.test(obj)) {
        ENV_VAR_PATTERN.lastIndex = 0;
        findings.push(`${sourceFile}: ${path} contains env variable pattern: ${obj}`);
      }
    } else if (isPlainObject(obj)) {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        walk(value, path ? `${path}.${key}` : key);
      }
    } else if (Array.isArray(obj)) {
      (obj as unknown[]).forEach((item, i) => {
        walk(item, `${path}[${i}]`);
      });
    }
  }

  walk(config, '');
  return findings;
}
