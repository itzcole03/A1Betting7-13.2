import { CacheService } from '@/types.ts';
declare class CacheServiceImpl implements CacheService {
  private static instance;
  private cache;
  private defaultTTL;
  private constructor();
  static getInstance(): CacheServiceImpl;
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  private cleanExpired;
}
export declare const cache: CacheServiceImpl;
export default cache;
