// UnifiedConfig singleton implementation for A1Betting platform
// Provides in-memory configuration management with get/set/update/reset methods
// and a static getInstance() for global access.
//
// @see UnifiedConfig.d.ts for type definitions

// Browser-compatible event emitter implementation
class SimpleEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }
}

export type ConfigLeaf = string | number | boolean | null;
export type ConfigValue = ConfigLeaf | ConfigLeaf[] | { [key: string]: ConfigValue } | undefined;

/**
 * UnifiedConfig
 *
 * Singleton configuration manager for the A1Betting platform frontend.
 * Provides get/set/update/reset methods for runtime config, with optional event bus integration.
 *
 * Usage:
 *   const config = UnifiedConfig.getInstance();
 *   config.set('theme', 'dark');
 *   const theme = config.get<string>('theme');
 */
export class UnifiedConfig {
  private static instance: UnifiedConfig;
  private config: Record<string, ConfigValue> = {};
  private readonly defaultConfig: Record<string, ConfigValue> = {};
  private readonly eventBus: SimpleEventEmitter;

  private constructor() {
    this.eventBus = new SimpleEventEmitter();
    // Optionally initialize defaultConfig here
  }

  /**
   * Get the singleton instance of UnifiedConfig.
   */
  public static getInstance(): UnifiedConfig {
    if (!UnifiedConfig.instance) {
      UnifiedConfig.instance = new UnifiedConfig();
    }
    return UnifiedConfig.instance;
  }

  /**
   * Get a config value by key.
   * @param key The config key
   * @returns The config value (typed)
   */
  public get<T = unknown>(key: string): T {
    return (this.config[key] as T) ?? (this.defaultConfig[key] as T);
  }

  /**
   * Set a config value by key.
   * @param key The config key
   * @param value The value to set
   */
  public set(key: string, value: ConfigValue): void {
    this.config[key] = value;
    this.saveToStorage();
    this.eventBus.emit('configChanged', { key, value });
  }

  /**
   * Update a config value by merging updates into the existing value.
   * @param key The config key
   * @param updates Partial updates to merge
   */
  public update(key: string, updates: Partial<ConfigValue>): void {
    const current = this.config[key] ?? this.defaultConfig[key] ?? {};
    if (typeof current === 'object' && current !== null) {
      this.config[key] = { ...current, ...updates };
      this.saveToStorage();
      this.eventBus.emit('configChanged', { key, value: this.config[key] });
    }
  }

  /**
   * Reset a config value to its default, or all if no key is provided.
   * @param key Optional config key to reset
   */
  public reset(key?: string): void {
    if (key) {
      this.config[key] = this.defaultConfig[key];
      this.saveToStorage();
      this.eventBus.emit('configChanged', { key, value: this.config[key] });
    } else {
      this.config = { ...this.defaultConfig };
      this.saveToStorage();
      this.eventBus.emit('configReset');
    }
  }

  /**
   * Save config to localStorage (or other persistent storage if needed).
   * (Stub implementation for now.)
   */
  private saveToStorage(): void {
    // Optionally implement persistent storage
    // localStorage.setItem('a1betting_config', JSON.stringify(this.config));
  }
}

/**
 * Get the initialized UnifiedConfig singleton.
 * @returns UnifiedConfig instance
 */
export function getInitializedUnifiedConfig(): UnifiedConfig {
  return UnifiedConfig.getInstance();
}
