/**
 * Configuration Cache — TTL-based caching for config data
 *
 * Port of: aios-core/.aios-core/core/config/config-cache.js
 * Adapted for Copy Chief BLACK (TypeScript, Bun runtime)
 *
 * Key difference from AIOS Core:
 *   Hooks are ephemeral processes (bun spawn per hook invocation).
 *   In-memory cache only lives for the duration of one hook execution.
 *   For cross-invocation persistence, use filesystem (helix-state.yaml).
 *   Within a single hook execution, this cache prevents redundant file reads.
 *
 * @module lib/config-cache
 * @version 1.0.0
 * @forked aios-core v4.4.6
 */

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  total: number;
  hitRate: string;
  ttl: number;
  ttlMinutes: string;
}

export class ConfigCache {
  private cache: Map<string, unknown>;
  private timestamps: Map<string, number>;
  private ttl: number;
  private hits: number;
  private misses: number;

  /**
   * Create a new ConfigCache
   * @param ttl Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get value from cache. Returns null if not found or expired.
   */
  get<T = unknown>(key: string): T | null {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }

    const timestamp = this.timestamps.get(key)!;
    const now = Date.now();

    if (now - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return this.cache.get(key) as T;
  }

  /**
   * Set value in cache
   */
  set<T = unknown>(key: string, value: T): void {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.timestamps.delete(key);
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(key);
        this.timestamps.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : '0.0';

    return {
      size: this.size,
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate}%`,
      ttl: this.ttl,
      ttlMinutes: (this.ttl / 1000 / 60).toFixed(1),
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Set new TTL
   */
  setTTL(ttl: number): void {
    this.ttl = ttl;
  }
}

// Global cache instance (singleton within process lifetime)
export const globalConfigCache = new ConfigCache();
