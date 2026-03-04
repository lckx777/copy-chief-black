// hooks/lib/merge-utils.ts — Port of aios-core merge-utils.js
/**
 * Merge Utilities for Layered Configuration
 *
 * Implements the merge strategy defined in ADR-PRO-002:
 * - Scalars: last-wins
 * - Objects: deep merge (recursive)
 * - Arrays: replace (default, last-wins)
 * - Arrays with +append suffix: concatenate source onto target
 * - null values: delete key from result
 *
 * @module hooks/lib/merge-utils
 * @version 1.0.0
 * @ported-from aios-core/.aios-core/core/config/merge-utils.js
 */

/**
 * Check if value is a plain object (not array, null, Date, etc.)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep merge two configuration objects following ADR-PRO-002 rules.
 *
 * Merge strategy:
 * - Scalars (string, number, boolean): last-wins (source overrides target)
 * - Objects/Maps: recursive deep merge
 * - Arrays (default): replace (source replaces target)
 * - Arrays with +append suffix: concatenate source onto target
 * - null values: delete the key from result
 *
 * @param target - Base configuration (lower priority)
 * @param source - Override configuration (higher priority)
 * @returns Merged configuration (new object, inputs unchanged)
 */
export function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source !== undefined ? source : target;
  }

  const result: Record<string, any> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    // Handle +append modifier for arrays
    if (key.endsWith('+append')) {
      const baseKey = key.slice(0, -7); // Remove '+append' (7 chars)
      if (Array.isArray(value)) {
        const existing = result[baseKey];
        result[baseKey] = Array.isArray(existing)
          ? [...existing, ...value]
          : value;
      }
      continue;
    }

    // Handle null = delete key
    if (value === null) {
      delete result[key];
      continue;
    }

    // Deep merge plain objects
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key] as Record<string, any>, value as Record<string, any>);
      continue;
    }

    // Arrays and scalars: replace (last-wins)
    result[key] = value;
  }

  return result;
}

/**
 * Merge multiple config layers in order (left to right, last wins).
 *
 * @param layers - Configuration layers in priority order (lowest first)
 * @returns Merged configuration
 */
export function mergeAll(...layers: Array<Record<string, any> | null | undefined>): Record<string, any> {
  return layers.reduce<Record<string, any>>((result, layer) => {
    if (!layer || !isPlainObject(layer)) return result;
    return deepMerge(result, layer);
  }, {});
}
