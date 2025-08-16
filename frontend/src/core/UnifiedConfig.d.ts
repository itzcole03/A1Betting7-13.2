export type ConfigLeaf = string | number | boolean | null;
export type ConfigValue =
  | ConfigLeaf
  | ConfigLeaf[]
  | {
      [key: string]: ConfigValue;
    }
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
      tokenRefreshThreshold: number;
    };
  };
  sse: {
    enabled: boolean;
    endpoint: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    activationThreshold: number;
    stabilityThreshold: number;
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
    notificationDuration: number;
    connectionRetryMessage: string;
    disconnectionMessage: string;
  };
}

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
  
  // Realtime configuration methods
  getRealtimeConfig(): RealtimeConfig;
  updateRealtimeConfig(section: keyof RealtimeConfig, updates: Partial<RealtimeConfig[keyof RealtimeConfig]>): void;
  toggleWebSocket(enabled: boolean): void;
  toggleSSE(enabled: boolean): void;
  configureWebSocketReconnect(maxAttempts: number, interval: number): void;
  configureMonitoring(enabled: boolean, metricsInterval?: number): void;
}
export declare function getInitializedUnifiedConfig(): UnifiedConfig;
