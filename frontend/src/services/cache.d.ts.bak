import { CacheService } from '@/types.ts';
declare class CacheServiceImpl implements CacheService {
  private static instance;
  private cache;
  private defaultTTL;
  private constructor();
  static getInstance(): CacheServiceImpl;
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  private cleanExpired;
}
export declare const _cache: CacheServiceImpl;
export default cache;
