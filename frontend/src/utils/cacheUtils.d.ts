export interface CacheConfig {
  ttl: number;
  maxSize?: number;
}
export declare class Cache<K, V> {
  private cache;
  private config;
  constructor(config: CacheConfig);
  set(key: K, value: V): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): void;
  clear(): void;
  private cleanup;
  size(): number;
}
export declare function cached(
  ttl: number,
  maxSize?: number
): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
