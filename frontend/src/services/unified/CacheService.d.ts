export declare class CacheService {
  static get(key: string): Promise<unknown>;
  static set(key: string, value: unknown): Promise<boolean>;
}
export default CacheService;
