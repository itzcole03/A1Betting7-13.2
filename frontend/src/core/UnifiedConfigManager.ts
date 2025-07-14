import { UnifiedConfig } from './UnifiedConfig';
import type { UnifiedConfigManager as UnifiedConfigManagerType } from './config/types';

/**
 * UnifiedConfigManager
 *
 * Singleton config manager for legacy compatibility. Delegates to UnifiedConfig.
 * Implements get, set, delete, has, and getInstance().
 */
export class UnifiedConfigManager implements UnifiedConfigManagerType {
  private static instance: UnifiedConfigManager;
  private readonly config: UnifiedConfig;

  private constructor() {
    this.config = UnifiedConfig.getInstance();
  }

  /**
   * Get the singleton instance of UnifiedConfigManager.
   */
  public static getInstance(): UnifiedConfigManager {
    if (!UnifiedConfigManager.instance) {
      UnifiedConfigManager.instance = new UnifiedConfigManager();
    }
    return UnifiedConfigManager.instance;
  }

  /**
   * Get a config value by key.
   */
  public async get<T>(key: string): Promise<T> {
    return this.config.get<T>(key);
  }

  /**
   * Set a config value by key.
   */
  public async set<T>(key: string, value: T): Promise<void> {
    this.config.set(key, value);
  }

  /**
   * Delete a config value by key.
   */
  public async delete(key: string): Promise<void> {
    this.config.set(key, undefined);
  }

  /**
   * Check if a config key exists.
   */
  public async has(key: string): Promise<boolean> {
    return this.config.get(key) !== undefined;
  }

  /**
   * Get the entire config object (for compatibility with legacy code).
   */
  public async getConfig(): Promise<Record<string, unknown>> {
    // UnifiedConfig stores config as Record<string, ConfigValue>
    // Cast to unknown for compatibility
    // Optionally, clone to prevent mutation
    return { ...(this.config as any).config };
  }
}
