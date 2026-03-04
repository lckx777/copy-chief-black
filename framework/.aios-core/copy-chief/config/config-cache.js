var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var config_cache_exports = {};
__export(config_cache_exports, {
  ConfigCache: () => ConfigCache,
  globalConfigCache: () => globalConfigCache
});
module.exports = __toCommonJS(config_cache_exports);
class ConfigCache {
  cache;
  timestamps;
  ttl;
  hits;
  misses;
  /**
   * Create a new ConfigCache
   * @param ttl Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(ttl = 5 * 60 * 1e3) {
    this.cache = /* @__PURE__ */ new Map();
    this.timestamps = /* @__PURE__ */ new Map();
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }
  /**
   * Get value from cache. Returns null if not found or expired.
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }
    const timestamp = this.timestamps.get(key);
    const now = Date.now();
    if (now - timestamp > this.ttl) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return this.cache.get(key);
  }
  /**
   * Set value in cache
   */
  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }
  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }
  /**
   * Invalidate a specific cache entry
   */
  invalidate(key) {
    const deleted = this.cache.delete(key);
    this.timestamps.delete(key);
    return deleted;
  }
  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.hits = 0;
    this.misses = 0;
  }
  /**
   * Clear expired entries
   */
  clearExpired() {
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
  get size() {
    return this.cache.size;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : "0.0";
    return {
      size: this.size,
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate}%`,
      ttl: this.ttl,
      ttlMinutes: (this.ttl / 1e3 / 60).toFixed(1)
    };
  }
  /**
   * Get all cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  /**
   * Set new TTL
   */
  setTTL(ttl) {
    this.ttl = ttl;
  }
}
const globalConfigCache = new ConfigCache();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigCache,
  globalConfigCache
});
