export type CacheSetOptions = number | { ttl?: number; tags?: string[] };

export declare class UnifiedCache {
  private static instance;
  private cache;
  private pending;
  private defaultTTL;
  private constructor();
  static getInstance(): UnifiedCache;
  set<T>(key: string, value: T, ttlOrOptions?: CacheSetOptions): void;
  get<T>(key: string): T | null;
  getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttlOrOptions?: CacheSetOptions
  ): Promise<T>;
  has(key: string): boolean;
  delete(key: string): void;
  deleteByPrefix(prefix: string): void;
  clear(): void;
  getSize(): number;
  getKeys(): string[];
  setDefaultTTL(ttl: number): void;
  getDefaultTTL(): number;
}

export declare const _unifiedCache: UnifiedCache;
