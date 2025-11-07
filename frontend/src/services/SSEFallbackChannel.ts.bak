/**
 * Server-Sent Events (SSE) Fallback Channel
 * Automatically activates after 3 consecutive WebSocket failures
 * Deactivates when WebSocket re-stabilizes for >2 minutes
 */

import { enhancedLogger } from './EnhancedLogger';

interface SSEMessage {
  type: string;
  data: any;
  timestamp: string;
  id?: string;
}

interface SSEConfig {
  endpoint: string;
  retryTimeout: number;
  heartbeatInterval: number;
  maxReconnectAttempts: number;
}

interface FallbackChannelOptions {
  activateAfterFailures: number;
  stabilityThresholdMs: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onMessage?: (message: SSEMessage) => void;
}

class SSEFallbackChannel {
  private eventSource: EventSource | null = null;
  private isActive = false;
  private consecutiveWsFailures = 0;
  private lastWsSuccess: number | null = null;
  private stabilityCheckInterval: NodeJS.Timeout | null = null;
  private reconnectAttempt = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;

  constructor(
    private config: SSEConfig,
    private options: FallbackChannelOptions
  ) {
    enhancedLogger.info('SSEFallbackChannel', 'constructor', 'SSE fallback channel initialized', {
      endpoint: config.endpoint,
      activateAfterFailures: options.activateAfterFailures,
      stabilityThresholdMs: options.stabilityThresholdMs
    });
  }

  /**
   * Report WebSocket connection failure
   */
  reportWebSocketFailure(): void {
    this.consecutiveWsFailures++;
    this.lastWsSuccess = null;

    enhancedLogger.warn('SSEFallbackChannel', 'reportWebSocketFailure', 
      `WebSocket failure reported (${this.consecutiveWsFailures}/${this.options.activateAfterFailures})`, {
      consecutiveFailures: this.consecutiveWsFailures,
      activationThreshold: this.options.activateAfterFailures,
      currentlyActive: this.isActive
    });

    // Activate fallback if threshold reached
    if (this.consecutiveWsFailures >= this.options.activateAfterFailures && !this.isActive) {
      this.activate();
    }
  }

  /**
   * Report WebSocket connection success
   */
  reportWebSocketSuccess(): void {
    this.consecutiveWsFailures = 0;
    this.lastWsSuccess = Date.now();

    enhancedLogger.info('SSEFallbackChannel', 'reportWebSocketSuccess', 'WebSocket success reported', {
      previousFailures: this.consecutiveWsFailures,
      fallbackActive: this.isActive,
      timestamp: this.lastWsSuccess
    });

    // Start stability monitoring if fallback is active
    if (this.isActive) {
      this.startStabilityMonitoring();
    }
  }

  /**
   * Activate SSE fallback channel
   */
  private activate(): void {
    if (this.isActive) {
      enhancedLogger.warn('SSEFallbackChannel', 'activate', 'Fallback already active');
      return;
    }

    this.isActive = true;
    this.reconnectAttempt = 0;

    enhancedLogger.info('SSEFallbackChannel', 'activate', 'Activating SSE fallback channel', {
      consecutiveWsFailures: this.consecutiveWsFailures,
      endpoint: this.config.endpoint
    });

    // Notify activation
    if (this.options.onActivate) {
      try {
        this.options.onActivate();
      } catch (error) {
        enhancedLogger.error('SSEFallbackChannel', 'activate', 'Activation callback error', {}, 
          error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Start SSE connection
    this.connectSSE();
  }

  /**
   * Deactivate SSE fallback channel
   */
  private deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.reconnectAttempt = 0;

    enhancedLogger.info('SSEFallbackChannel', 'deactivate', 'Deactivating SSE fallback channel', {
      wsStabilityDuration: this.lastWsSuccess ? Date.now() - this.lastWsSuccess : 0
    });

    // Clean up SSE connection
    this.disconnectSSE();

    // Stop stability monitoring
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
      this.stabilityCheckInterval = null;
    }

    // Notify deactivation
    if (this.options.onDeactivate) {
      try {
        this.options.onDeactivate();
      } catch (error) {
        enhancedLogger.error('SSEFallbackChannel', 'deactivate', 'Deactivation callback error', {}, 
          error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Connect to SSE endpoint
   */
  private connectSSE(): void {
    if (this.eventSource) {
      this.disconnectSSE();
    }

    try {
      enhancedLogger.info('SSEFallbackChannel', 'connectSSE', 'Connecting to SSE endpoint', {
        endpoint: this.config.endpoint,
        attempt: this.reconnectAttempt + 1
      });

      this.eventSource = new EventSource(this.config.endpoint);

      this.eventSource.onopen = () => {
        this.reconnectAttempt = 0;
        enhancedLogger.info('SSEFallbackChannel', 'connectSSE', 'SSE connection established');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = {
            type: 'message',
            data: JSON.parse(event.data),
            timestamp: new Date().toISOString(),
            id: event.lastEventId
          };

          enhancedLogger.debug('SSEFallbackChannel', 'onMessage', 'SSE message received', {
            messageType: message.type,
            dataSize: event.data.length,
            eventId: event.lastEventId
          });

          if (this.options.onMessage) {
            this.options.onMessage(message);
          }
        } catch (error) {
          enhancedLogger.error('SSEFallbackChannel', 'onMessage', 'Failed to parse SSE message', {
            rawData: event.data
          }, error instanceof Error ? error : new Error(String(error)));
        }
      };

      this.eventSource.onerror = (error) => {
        enhancedLogger.warn('SSEFallbackChannel', 'onError', 'SSE connection error', {
          readyState: this.eventSource?.readyState,
          attempt: this.reconnectAttempt
        });

        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.scheduleReconnect();
        }
      };

      // Set up custom event listeners
      this.setupCustomEventListeners();

    } catch (error) {
      enhancedLogger.error('SSEFallbackChannel', 'connectSSE', 'Failed to create SSE connection', {
        endpoint: this.config.endpoint
      }, error instanceof Error ? error : new Error(String(error)));

      this.scheduleReconnect();
    }
  }

  /**
   * Set up custom event listeners for different message types
   */
  private setupCustomEventListeners(): void {
    if (!this.eventSource) return;

    // Listen for heartbeat events
    this.eventSource.addEventListener('heartbeat', (event) => {
      enhancedLogger.debug('SSEFallbackChannel', 'heartbeat', 'SSE heartbeat received', {
        data: event.data,
        timestamp: new Date().toISOString()
      });
    });

    // Listen for props updates
    this.eventSource.addEventListener('props_update', (event) => {
      try {
        const message: SSEMessage = {
          type: 'props_update',
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString(),
          id: event.lastEventId
        };

        enhancedLogger.debug('SSEFallbackChannel', 'propsUpdate', 'Props update received via SSE');

        if (this.options.onMessage) {
          this.options.onMessage(message);
        }
      } catch (error) {
        enhancedLogger.error('SSEFallbackChannel', 'propsUpdate', 'Failed to parse props update', {
          rawData: event.data
        }, error instanceof Error ? error : new Error(String(error)));
      }
    });

    // Listen for odds updates
    this.eventSource.addEventListener('odds_update', (event) => {
      try {
        const message: SSEMessage = {
          type: 'odds_update',
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString(),
          id: event.lastEventId
        };

        enhancedLogger.debug('SSEFallbackChannel', 'oddsUpdate', 'Odds update received via SSE');

        if (this.options.onMessage) {
          this.options.onMessage(message);
        }
      } catch (error) {
        enhancedLogger.error('SSEFallbackChannel', 'oddsUpdate', 'Failed to parse odds update', {
          rawData: event.data
        }, error instanceof Error ? error : new Error(String(error)));
      }
    });

    // Listen for system events
    this.eventSource.addEventListener('system_event', (event) => {
      try {
        const message: SSEMessage = {
          type: 'system_event',
          data: JSON.parse(event.data),
          timestamp: new Date().toISOString(),
          id: event.lastEventId
        };

        enhancedLogger.info('SSEFallbackChannel', 'systemEvent', 'System event received via SSE', {
          eventType: message.data.eventType
        });

        if (this.options.onMessage) {
          this.options.onMessage(message);
        }
      } catch (error) {
        enhancedLogger.error('SSEFallbackChannel', 'systemEvent', 'Failed to parse system event', {
          rawData: event.data
        }, error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Disconnect from SSE endpoint
   */
  private disconnectSSE(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      enhancedLogger.info('SSEFallbackChannel', 'disconnectSSE', 'SSE connection closed');
    }
  }

  /**
   * Schedule SSE reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (!this.isActive || this.reconnectAttempt >= this.config.maxReconnectAttempts) {
      enhancedLogger.warn('SSEFallbackChannel', 'scheduleReconnect', 'Max reconnect attempts reached or channel deactivated');
      return;
    }

    const baseDelay = this.config.retryTimeout;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempt), 30000); // Cap at 30s
    const jitteredDelay = delay * (0.8 + Math.random() * 0.4); // ±20% jitter

    this.reconnectAttempt++;

    enhancedLogger.info('SSEFallbackChannel', 'scheduleReconnect', `Scheduling SSE reconnect in ${Math.round(jitteredDelay)}ms`, {
      attempt: this.reconnectAttempt,
      maxAttempts: this.config.maxReconnectAttempts,
      baseDelay,
      jitteredDelay: Math.round(jitteredDelay)
    });

    this.reconnectTimeoutId = setTimeout(() => {
      this.connectSSE();
    }, jitteredDelay);
  }

  /**
   * Start monitoring WebSocket stability for automatic deactivation
   */
  private startStabilityMonitoring(): void {
    if (this.stabilityCheckInterval) {
      clearInterval(this.stabilityCheckInterval);
    }

    this.stabilityCheckInterval = setInterval(() => {
      if (!this.lastWsSuccess || !this.isActive) {
        return;
      }

      const stabilityDuration = Date.now() - this.lastWsSuccess;
      const isStable = stabilityDuration >= this.options.stabilityThresholdMs;

      enhancedLogger.debug('SSEFallbackChannel', 'stabilityCheck', 'Checking WebSocket stability', {
        stabilityDurationMs: stabilityDuration,
        thresholdMs: this.options.stabilityThresholdMs,
        isStable
      });

      if (isStable) {
        enhancedLogger.info('SSEFallbackChannel', 'stabilityCheck', 'WebSocket stable - deactivating fallback', {
          stabilityDurationMs: stabilityDuration
        });
        this.deactivate();
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get current fallback status
   */
  getStatus(): {
    isActive: boolean;
    consecutiveWsFailures: number;
    reconnectAttempt: number;
    lastWsSuccess: number | null;
    sseConnected: boolean;
  } {
    return {
      isActive: this.isActive,
      consecutiveWsFailures: this.consecutiveWsFailures,
      reconnectAttempt: this.reconnectAttempt,
      lastWsSuccess: this.lastWsSuccess,
      sseConnected: this.eventSource?.readyState === EventSource.OPEN
    };
  }

  /**
   * Manually force activation (for testing)
   */
  forceActivate(): void {
    this.consecutiveWsFailures = this.options.activateAfterFailures;
    this.activate();
  }

  /**
   * Manually force deactivation
   */
  forceDeactivate(): void {
    this.deactivate();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.deactivate();
    enhancedLogger.info('SSEFallbackChannel', 'destroy', 'SSE fallback channel destroyed');
  }
}

/**
 * Factory function to create configured SSE fallback channel
 */
export function createSSEFallbackChannel(options: {
  sseEndpoint?: string;
  activateAfterFailures?: number;
  stabilityThresholdMs?: number;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onMessage?: (message: SSEMessage) => void;
}): SSEFallbackChannel {
  const config: SSEConfig = {
    endpoint: options.sseEndpoint || '/api/events/stream',
    retryTimeout: 1000, // 1 second initial retry
    heartbeatInterval: 30000, // 30 seconds
    maxReconnectAttempts: 10
  };

  const fallbackOptions: FallbackChannelOptions = {
    activateAfterFailures: options.activateAfterFailures || 3,
    stabilityThresholdMs: options.stabilityThresholdMs || (2 * 60 * 1000), // 2 minutes
    onActivate: options.onActivate,
    onDeactivate: options.onDeactivate,
    onMessage: options.onMessage
  };

  return new SSEFallbackChannel(config, fallbackOptions);
}

export type { SSEMessage, SSEFallbackChannel };