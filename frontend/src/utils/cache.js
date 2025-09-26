// Simple in-memory cache utility
class Cache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes TTL
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    return this.cache.delete(key);
  }
}

// Create a global cache instance
const apiCache = new Cache();

export default apiCache;