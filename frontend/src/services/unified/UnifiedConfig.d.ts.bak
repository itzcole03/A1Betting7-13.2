export declare class UnifiedConfig {
  private static instance;
  private config;
  private constructor();
  static getInstance(): UnifiedConfig;
  /**
   * Returns the API base URL from Vite env or config, with fallback.
   */
  getApiUrl(): string;
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  getAll(): Record<string, unknown>;
}
