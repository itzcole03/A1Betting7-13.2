interface CacheItem<T> {
  value: T;
  expiry: number;
  tags?: string[];
}

type CacheSetOptions = number | { ttl?: number; tags?: string[] };

const DEFAULT_TTL_MS = 300_000; // 5 minutes

export class UnifiedCache {
  private static instance: UnifiedCache;
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private pending: Map<string, Promise<unknown>> = new Map();
  private defaultTTL: number = DEFAULT_TTL_MS;

  private constructor() {}

  static getInstance(): UnifiedCache {
    if (!UnifiedCache.instance) {
      UnifiedCache.instance = new UnifiedCache();
    }
    return UnifiedCache.instance;
  }

  set<T>(key: string, value: T, ttlOrOptions?: CacheSetOptions): void {
    const { ttl, tags } = this.normalizeSetOptions(ttlOrOptions);
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry, tags });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttlOrOptions?: CacheSetOptions
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const existing = this.pending.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const promise = Promise.resolve().then(factory);
    this.pending.set(key, promise);

    try {
      const value = await promise;
      this.set(key, value, ttlOrOptions);
      return value;
    } finally {
      this.pending.delete(key);
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }

    for (const key of this.pending.keys()) {
      if (key.startsWith(prefix)) {
        this.pending.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  setDefaultTTL(ttl: number): void {
    if (ttl <= 0) {
      throw new Error('TTL must be greater than zero');
    }
    this.defaultTTL = ttl;
  }

  getDefaultTTL(): number {
    return this.defaultTTL;
  }

  private normalizeSetOptions(ttlOrOptions?: CacheSetOptions): { ttl: number; tags?: string[] } {
    if (typeof ttlOrOptions === 'number') {
      return { ttl: ttlOrOptions > 0 ? ttlOrOptions : this.defaultTTL };
    }

    if (ttlOrOptions && typeof ttlOrOptions === 'object') {
      const ttl = ttlOrOptions.ttl ?? this.defaultTTL;
      return { ttl: ttl > 0 ? ttl : this.defaultTTL, tags: ttlOrOptions.tags };
    }

    return { ttl: this.defaultTTL };
  }

  private isExpired(item: CacheItem<unknown>): boolean {
    return Date.now() > item.expiry;
  }
}

export const _unifiedCache = UnifiedCache.getInstance();
