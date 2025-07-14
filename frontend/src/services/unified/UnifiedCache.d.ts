export declare class UnifiedCache {
  private static instance;
  private cache;
  private defaultTTL;
  private constructor();
  static getInstance(): UnifiedCache;
  set<T>(key: string, value: T, ttl?: number): void;
  get<T>(key: string): T | null;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  private isExpired;
  getSize(): number;
  getKeys(): string[0];
  setDefaultTTL(ttl: number): void;
}
