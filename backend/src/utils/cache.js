// Simple in-memory cache utility for backend with performance metrics
class Cache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.sets = 0;
  }

  set(key, value, ttl = 10 * 60 * 1000) { // Default 10 minutes TTL
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry, created: Date.now() });
    this.sets++;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    return this.cache.delete(key);
  }

  // Get or set with function
  async getOrSet(key, fn, ttl = 10 * 60 * 1000) {
    let value = this.get(key);
    if (value !== null) return value;

    value = await fn();
    this.set(key, value, ttl);
    return value;
  }

  // Get cache statistics
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(2) : 0;

    return {
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      hitRate: `${hitRate}%`,
      memoryUsage: JSON.stringify(this.cache).length // Rough estimate
    };
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Create a global cache instance
const apiCache = new Cache();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const cleaned = apiCache.cleanup();
  if (cleaned > 0) {
    console.log(`[Cache] Cleaned ${cleaned} expired entries`);
  }
}, 5 * 60 * 1000);

export default apiCache;