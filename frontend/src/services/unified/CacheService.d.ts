export declare class CacheService {
  static get(key: string): Promise<any>;
  static set(key: string, value: any): Promise<boolean>;
}
export default CacheService;
