interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class UnifiedCache {
  private static instance: UnifiedCache;
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.expiry;
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

export const unifiedCache = UnifiedCache.getInstance();
