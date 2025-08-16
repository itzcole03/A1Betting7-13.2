// UnifiedConfig singleton implementation for A1Betting platform
// Provides in-memory configuration management with get/set/update/reset methods
// and a static getInstance() for global access.
//
// @see UnifiedConfig.d.ts for type definitions

// Browser-compatible event emitter implementation
class SimpleEventEmitter {
  private listeners: { [event: string]: ((...args: unknown[]) => void)[] } = {};

  emit(event: string, data?: unknown): void {
    const _eventListeners = this.listeners[event];
    if (_eventListeners) {
      _eventListeners.forEach(listener => listener(data));
    }
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: (...args: unknown[]) => void): void {
    const _eventListeners = this.listeners[event];
    if (_eventListeners) {
      const _index = _eventListeners.indexOf(listener);
      if (_index > -1) {
        _eventListeners.splice(_index, 1);
      }
    }
  }
}

export type ConfigLeaf = string | number | boolean | null;
export type ConfigValue = 
  | ConfigLeaf 
  | ConfigLeaf[] 
  | { [key: string]: ConfigValue } 
  | RealtimeConfig
  | undefined;

// Realtime configuration interfaces
export interface RealtimeConfig {
  websocket: {
    enabled: boolean;
    autoReconnect: boolean;
    maxReconnectAttempts: number;
    reconnectInterval: number;
    heartbeatInterval: number;
    connectionTimeout: number;
    endpoints: {
      primary: string;
      fallback?: string;
    };
    authentication: {
      enabled: boolean;
      tokenRefreshThreshold: number; // minutes before expiry
    };
  };
  sse: {
    enabled: boolean;
    endpoint: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    activationThreshold: number; // consecutive WebSocket failures before SSE activation
    stabilityThreshold: number; // milliseconds of stability before deactivating SSE
  };
  fallback: {
    enablePolling: boolean;
    pollingInterval: number;
    maxPollingAttempts: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
    performanceTracking: boolean;
  };
  ui: {
    showConnectionStatus: boolean;
    showRealtimeIndicators: boolean;
    notificationDuration: number; // milliseconds
    connectionRetryMessage: string;
    disconnectionMessage: string;
  };
}

/**
 * UnifiedConfig
 *
 * Singleton configuration manager for the A1Betting platform frontend.
 * Provides get/set/update/reset methods for runtime config, with optional event bus integration.
 *
 * Usage:
 *   const _config = UnifiedConfig.getInstance();
 *   config.set('theme', 'dark');
 *   const _theme = config.get<string>('theme');
 */
export class UnifiedConfig {
  private static instance: UnifiedConfig;
  private config: Record<string, ConfigValue> = {};
  private readonly defaultConfig: Record<string, ConfigValue> = {};
  private readonly eventBus: SimpleEventEmitter;

  private constructor() {
    this.eventBus = new SimpleEventEmitter();
    
    // Initialize default realtime configuration
    this.defaultConfig = {
      ...this.defaultConfig,
      realtime: {
        websocket: {
          enabled: true,
          autoReconnect: true,
          maxReconnectAttempts: 5,
          reconnectInterval: 5000, // 5 seconds
          heartbeatInterval: 30000, // 30 seconds
          connectionTimeout: 10000, // 10 seconds
          endpoints: {
            primary: '/ws/client',
            fallback: '/ws/legacy'
          },
          authentication: {
            enabled: true,
            tokenRefreshThreshold: 5 // 5 minutes before expiry
          }
        },
        sse: {
          enabled: true,
          endpoint: '/api/sse/realtime',
          reconnectInterval: 10000, // 10 seconds
          maxReconnectAttempts: 3,
          activationThreshold: 3, // 3 consecutive WebSocket failures
          stabilityThreshold: 120000 // 2 minutes of stability
        },
        fallback: {
          enablePolling: true,
          pollingInterval: 30000, // 30 seconds
          maxPollingAttempts: 10
        },
        monitoring: {
          enabled: true,
          metricsInterval: 60000, // 1 minute
          healthCheckInterval: 30000, // 30 seconds
          performanceTracking: process.env.NODE_ENV === 'development'
        },
        ui: {
          showConnectionStatus: true,
          showRealtimeIndicators: true,
          notificationDuration: 5000, // 5 seconds
          connectionRetryMessage: 'Attempting to reconnect...',
          disconnectionMessage: 'Connection lost. Retrying...'
        }
      } as RealtimeConfig
    };
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
    const _current = this.config[key] ?? this.defaultConfig[key] ?? {};
    if (typeof _current === 'object' && _current !== null) {
      // @ts-expect-error TS(2698): Spread types may only be created from object types... Remove this comment to see the full error message
      this.config[key] = { ..._current, ...updates };
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

  /**
   * Get realtime configuration with type safety
   */
  public getRealtimeConfig(): RealtimeConfig {
    return this.get<RealtimeConfig>('realtime');
  }

  /**
   * Update specific realtime configuration section
   */
  public updateRealtimeConfig(section: keyof RealtimeConfig, updates: Partial<RealtimeConfig[keyof RealtimeConfig]>): void {
    const currentRealtime = this.getRealtimeConfig();
    const updatedRealtime = {
      ...currentRealtime,
      [section]: {
        ...currentRealtime[section],
        ...updates
      }
    };
    this.set('realtime', updatedRealtime);
  }

  /**
   * Enable/disable WebSocket with configuration update
   */
  public toggleWebSocket(enabled: boolean): void {
    this.updateRealtimeConfig('websocket', { enabled });
  }

  /**
   * Enable/disable SSE fallback
   */
  public toggleSSE(enabled: boolean): void {
    this.updateRealtimeConfig('sse', { enabled });
  }

  /**
   * Update WebSocket reconnection settings
   */
  public configureWebSocketReconnect(maxAttempts: number, interval: number): void {
    this.updateRealtimeConfig('websocket', {
      maxReconnectAttempts: maxAttempts,
      reconnectInterval: interval
    });
  }

  /**
   * Configure realtime monitoring settings
   */
  public configureMonitoring(enabled: boolean, metricsInterval?: number): void {
    const updates: Partial<RealtimeConfig['monitoring']> = { enabled };
    if (metricsInterval !== undefined) {
      updates.metricsInterval = metricsInterval;
    }
    this.updateRealtimeConfig('monitoring', updates);
  }
}

/**
 * Get the initialized UnifiedConfig singleton.
 * @returns UnifiedConfig instance
 */
export function getInitializedUnifiedConfig(): UnifiedConfig {
  return UnifiedConfig.getInstance();
}
