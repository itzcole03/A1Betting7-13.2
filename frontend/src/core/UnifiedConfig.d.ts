export type ConfigLeaf = string | number | boolean | null;
export type ConfigValue =
  | ConfigLeaf
  | ConfigLeaf[0]
  | {
      [key: string]: ConfigValue;
    }
  | undefined;
export declare class UnifiedConfig {
  private static instance;
  private readonly eventBus;
  private _errorHandler?;
  private get errorHandler();
  private config;
  private readonly defaultConfig;
  private constructor();
  static getInstance(): UnifiedConfig;
  private initialize;
  get<T = unknown>(key: string): T;
  set(key: string, value: ConfigValue): void;
  update(key: string, updates: Partial<ConfigValue>): void;
  reset(key?: string): void;
  private saveToStorage;
}
export declare function getInitializedUnifiedConfig(): UnifiedConfig;
