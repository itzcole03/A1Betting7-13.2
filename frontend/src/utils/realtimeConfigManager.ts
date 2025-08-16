import { UnifiedConfig, RealtimeConfig } from '../core/UnifiedConfig';

/**
 * Realtime Configuration Manager
 * 
 * Provides high-level interface for managing realtime connectivity settings
 * using the UnifiedConfig system.
 */
export class RealtimeConfigManager {
  private config: UnifiedConfig;

  constructor() {
    this.config = UnifiedConfig.getInstance();
  }

  /**
   * Initialize realtime configuration with environment-specific defaults
   */
  public initializeRealtimeConfig(): void {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const currentConfig = this.config.getRealtimeConfig();

    // Override defaults for development
    if (isDevelopment) {
      this.config.updateRealtimeConfig('websocket', {
        reconnectInterval: 2000, // Faster reconnect in dev
        heartbeatInterval: 15000 // More frequent heartbeat in dev
      });
      
      this.config.updateRealtimeConfig('monitoring', {
        performanceTracking: true,
        metricsInterval: 30000 // More frequent metrics in dev
      });
    }

    // eslint-disable-next-line no-console
    console.log('[RealtimeConfig] Initialized with config:', currentConfig);
  }

  /**
   * Configure for offline/local development mode
   */
  public configureLocalMode(): void {
    this.config.updateRealtimeConfig('websocket', {
      enabled: false // Disable WebSocket in local mode
    });
    
    this.config.updateRealtimeConfig('sse', {
      enabled: false // Disable SSE in local mode
    });
    
    this.config.updateRealtimeConfig('fallback', {
      enablePolling: true,
      pollingInterval: 10000 // 10-second polling for local dev
    });

    this.config.updateRealtimeConfig('ui', {
      showConnectionStatus: false, // Hide connection indicators in local mode
      showRealtimeIndicators: false
    });
  }

  /**
   * Configure for production deployment
   */
  public configureProductionMode(): void {
    this.config.updateRealtimeConfig('websocket', {
      enabled: true,
      maxReconnectAttempts: 10, // More attempts in production
      reconnectInterval: 5000
    });

    this.config.updateRealtimeConfig('sse', {
      enabled: true,
      activationThreshold: 2 // Activate SSE sooner in production
    });

    this.config.updateRealtimeConfig('monitoring', {
      enabled: true,
      performanceTracking: false, // Disable detailed tracking in prod
      metricsInterval: 300000 // 5-minute intervals in production
    });
  }

  /**
   * Configure WebSocket endpoints based on current environment
   */
  public configureEndpoints(baseUrl?: string): void {
    const base = baseUrl || this.getBaseUrl();
    
    this.config.updateRealtimeConfig('websocket', {
      endpoints: {
        primary: `${base}/ws/client`,
        fallback: `${base}/ws/legacy`
      }
    });

    this.config.updateRealtimeConfig('sse', {
      endpoint: `${base}/api/sse/realtime`
    });
  }

  /**
   * Get current realtime configuration
   */
  public getCurrentConfig(): RealtimeConfig {
    return this.config.getRealtimeConfig();
  }

  /**
   * Enable/disable realtime features entirely
   */
  public toggleRealtimeFeatures(enabled: boolean): void {
    this.config.toggleWebSocket(enabled);
    this.config.toggleSSE(enabled);
    
    this.config.updateRealtimeConfig('ui', {
      showConnectionStatus: enabled,
      showRealtimeIndicators: enabled
    });

    // eslint-disable-next-line no-console
    console.log(`[RealtimeConfig] Realtime features ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Configure aggressive reconnection for critical applications
   */
  public enableAggressiveReconnection(): void {
    this.config.configureWebSocketReconnect(15, 1000); // 15 attempts, 1-second intervals
    
    this.config.updateRealtimeConfig('sse', {
      maxReconnectAttempts: 10,
      reconnectInterval: 2000,
      activationThreshold: 1 // Activate SSE after first WebSocket failure
    });

    // eslint-disable-next-line no-console
    console.log('[RealtimeConfig] Aggressive reconnection enabled');
  }

  /**
   * Configure conservative reconnection for bandwidth-limited environments
   */
  public enableConservativeReconnection(): void {
    this.config.configureWebSocketReconnect(3, 30000); // 3 attempts, 30-second intervals
    
    this.config.updateRealtimeConfig('sse', {
      maxReconnectAttempts: 2,
      reconnectInterval: 60000, // 1-minute intervals
      activationThreshold: 5 // Only activate SSE after many failures
    });

    this.config.configureMonitoring(true, 120000); // 2-minute monitoring intervals

    // eslint-disable-next-line no-console
    console.log('[RealtimeConfig] Conservative reconnection enabled');
  }

  /**
   * Get appropriate base URL for WebSocket/SSE connections
   */
  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return 'ws://localhost:8000'; // Default for server-side
  }

  /**
   * Validate current configuration and provide recommendations
   */
  public validateConfiguration(): { isValid: boolean; warnings: string[]; recommendations: string[] } {
    const config = this.getCurrentConfig();
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for potential issues
    if (config.websocket.reconnectInterval < 1000) {
      warnings.push('WebSocket reconnect interval is very short (< 1 second)');
      recommendations.push('Consider increasing reconnect interval to reduce server load');
    }

    if (config.websocket.maxReconnectAttempts > 20) {
      warnings.push('WebSocket max reconnect attempts is very high (> 20)');
      recommendations.push('Consider reducing max attempts to avoid indefinite retry loops');
    }

    if (!config.sse.enabled && !config.fallback.enablePolling) {
      warnings.push('No fallback mechanism enabled - connection loss will not be recoverable');
      recommendations.push('Enable either SSE fallback or polling fallback for better reliability');
    }

    if (config.monitoring.metricsInterval < 10000) {
      warnings.push('Metrics interval is very frequent (< 10 seconds)');
      recommendations.push('Consider increasing metrics interval to reduce performance impact');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      recommendations
    };
  }
}

// Export singleton instance
export const realtimeConfigManager = new RealtimeConfigManager();