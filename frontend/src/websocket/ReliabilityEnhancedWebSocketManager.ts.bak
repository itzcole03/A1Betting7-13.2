/**
 * Enhanced WebSocket Reliability Layer
 * 
 * Extends the existing WebSocketManager with:
 * - Jittered backoff with exponential growth, max 60s
 * - Local simulation fallback after 3 consecutive failures  
 * - Ping/pong heartbeat every 30s with auto close for stale connections
 * - Event emission for websocket.failover.local_sim
 */

import { WebSocketManager as BaseWebSocketManager } from './WebSocketManager';
import { BackoffStrategy } from './BackoffStrategy';

export interface ReliabilityConfig {
  heartbeatIntervalMs?: number; // Default: 30000 (30s)
  heartbeatTimeoutMs?: number;  // Default: 10000 (10s)
  consecutiveFailureThreshold?: number; // Default: 3 failures before local sim
  enableLocalSimulation?: boolean; // Default: true
  localSimDataSource?: LocalSimDataSource;
}

export interface LocalSimDataSource {
  generateProps: (sport: string, gameId?: string) => Promise<any[]>;
  generateOdds: (propId: string) => Promise<{ over: number; under: number }>;
  generateLiveData: () => Promise<any>;
}

export interface WebSocketFailoverEvent {
  type: 'websocket.failover.local_sim';
  timestamp: number;
  reason: string;
  consecutiveFailures: number;
  lastError?: string;
}

// Default local simulation data source
class DefaultLocalSimDataSource implements LocalSimDataSource {
  async generateProps(sport: string, _gameId?: string): Promise<any[]> {
    // Generate mock props based on sport
    const mockProps = [
      { 
        id: `sim_${Date.now()}_1`,
        player: 'John Smith',
        stat: 'Points',
        line: 22.5,
        sport,
        market: 'player_props',
        confidence: 0.85,
        source: 'local_simulation'
      },
      {
        id: `sim_${Date.now()}_2`, 
        player: 'Mike Johnson',
        stat: 'Rebounds',
        line: 8.5,
        sport,
        market: 'player_props',
        confidence: 0.78,
        source: 'local_simulation'
      }
    ];
    
    return mockProps;
  }

  async generateOdds(propId: string): Promise<{ over: number; under: number }> {
    // Generate realistic odds
    const baseOdds = -110;
    const variation = Math.random() * 20 - 10; // ±10 variation
    
    return {
      over: Math.round(baseOdds + variation),
      under: Math.round(baseOdds - variation)
    };
  }

  async generateLiveData(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      status: 'live_simulation',
      updates: [
        {
          type: 'prop_update',
          prop_id: 'sim_prop_1',
          new_line: 23.0,
          movement: '+0.5'
        }
      ]
    };
  }
}

export class EnhancedWebSocketManager extends BaseWebSocketManager {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private consecutiveFailures = 0;
  private isInLocalSimulation = false;
  private reliabilityConfig: Required<ReliabilityConfig>;
  private localSimInterval: NodeJS.Timeout | null = null;
  private staleConnectionTimeout: NodeJS.Timeout | null = null;

  // Event listeners for failover events
  private failoverListeners: ((event: WebSocketFailoverEvent) => void)[] = [];

  constructor(
    baseUrl?: string,
    clientId?: string,
    options?: any,
    reliabilityConfig?: ReliabilityConfig
  ) {
    // Use enhanced backoff strategy with 60s max delay
    const enhancedBackoffStrategy = BackoffStrategy.createProductionStrategy();
    
    super(baseUrl, clientId, {
      ...options,
      backoffStrategy: enhancedBackoffStrategy
    });

    this.reliabilityConfig = {
      heartbeatIntervalMs: 30000, // 30s per acceptance criteria
      heartbeatTimeoutMs: 10000,  // 10s timeout
      consecutiveFailureThreshold: 3, // 3 failures trigger local sim
      enableLocalSimulation: true,
      localSimDataSource: new DefaultLocalSimDataSource(),
      ...reliabilityConfig
    };

    this.setupEnhancedFeatures();
  }

  private setupEnhancedFeatures(): void {
    // Listen to existing connection events to track failures
    this.onStateChange((state) => {
      this.handleStateChangeForReliability(state);
    });

    this.onError((error, context) => {
      this.handleErrorForReliability(error, context);
    });

    // Override message handling to process ping/pong
    const originalOnMessage = this.onMessage.bind(this);
    this.onMessage = (listener) => {
      const enhancedListener = (message: any) => {
        if (this.handleHeartbeatMessage(message)) {
          return; // Heartbeat message handled, don't pass to original listener
        }
        listener(message);
      };
      return originalOnMessage(enhancedListener);
    };
  }

  private handleStateChangeForReliability(state: any): void {
    switch (state.phase) {
      case 'open':
        // Connection successful - reset failure count and start heartbeat
        this.consecutiveFailures = 0;
        this.exitLocalSimulationMode();
        this.startHeartbeat();
        break;
        
      case 'closed':
      case 'error':
        // Connection failed
        this.consecutiveFailures++;
        this.stopHeartbeat();
        this.checkForLocalSimulationFallback();
        break;
        
      case 'connecting':
      case 'reconnecting':
        // Stop heartbeat during connection attempts
        this.stopHeartbeat();
        break;
    }
  }

  private handleErrorForReliability(error: Error, context: string): void {
    // Track consecutive failures for local simulation decision
    if (context.includes('connection') || context.includes('websocket')) {
      this.consecutiveFailures++;
      this.checkForLocalSimulationFallback();
    }
  }

  private checkForLocalSimulationFallback(): void {
    if (!this.reliabilityConfig.enableLocalSimulation) {
      return;
    }

    if (this.consecutiveFailures >= this.reliabilityConfig.consecutiveFailureThreshold && 
        !this.isInLocalSimulation) {
      this.enterLocalSimulationMode();
    }
  }

  private enterLocalSimulationMode(): void {
    this.isInLocalSimulation = true;
    
    const failoverEvent: WebSocketFailoverEvent = {
      type: 'websocket.failover.local_sim',
      timestamp: Date.now(),
      reason: `Entered local simulation after ${this.consecutiveFailures} consecutive failures`,
      consecutiveFailures: this.consecutiveFailures
    };

    // Emit failover event
    this.emitFailoverEvent(failoverEvent);

    // Start local simulation data generation
    this.startLocalSimulation();
  }

  private exitLocalSimulationMode(): void {
    if (!this.isInLocalSimulation) {
      return;
    }

    this.isInLocalSimulation = false;
    this.stopLocalSimulation();
    
    const recoveryEvent: WebSocketFailoverEvent = {
      type: 'websocket.failover.local_sim',
      timestamp: Date.now(),
      reason: 'Exited local simulation - WebSocket connection restored',
      consecutiveFailures: 0
    };

    this.emitFailoverEvent(recoveryEvent);
  }

  private startLocalSimulation(): void {
    if (this.localSimInterval) {
      clearInterval(this.localSimInterval);
    }

    // Generate simulated data every 5 seconds
    this.localSimInterval = setInterval(async () => {
      try {
        const liveData = await this.reliabilityConfig.localSimDataSource.generateLiveData();
        
        // Simulate receiving live data via message listeners
        const simulatedMessage = {
          type: 'live_data',
          data: liveData,
          timestamp: Date.now(),
          source: 'local_simulation'
        };

        // Notify message listeners with simulated data
        this.simulateMessageReceived(simulatedMessage);
        
      } catch (error) {
        // Silently handle local simulation errors
      }
    }, 5000);
  }

  private stopLocalSimulation(): void {
    if (this.localSimInterval) {
      clearInterval(this.localSimInterval);
      this.localSimInterval = null;
    }
  }

  private simulateMessageReceived(message: any): void {
    // This would need to integrate with the parent class's message system
    // For now, we emit it as a custom event
    const event = new CustomEvent('websocket-simulated-message', {
      detail: message
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendPing();
    }, this.reliabilityConfig.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    if (this.staleConnectionTimeout) {
      clearTimeout(this.staleConnectionTimeout);
      this.staleConnectionTimeout = null;
    }
  }

  private sendPing(): void {
    this.lastPingTime = Date.now();
    
    const pingMessage = {
      type: 'ping',
      timestamp: new Date().toISOString(),
      client_id: this.getState().client_id
    };

    const sent = this.send(pingMessage);
    
    if (sent) {
      // Set timeout for pong response
      this.heartbeatTimeout = setTimeout(() => {
        this.handleHeartbeatTimeout();
      }, this.reliabilityConfig.heartbeatTimeoutMs);
    }
  }

  private handleHeartbeatMessage(message: any): boolean {
    if (message.type === 'ping') {
      // Respond to server ping with pong
      const pongMessage = {
        type: 'pong',
        timestamp: new Date().toISOString(),
        client_id: this.getState().client_id,
        ping_timestamp: message.timestamp
      };
      this.send(pongMessage);
      return true;
    }

    if (message.type === 'pong') {
      // Clear heartbeat timeout - connection is alive
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
      return true;
    }

    return false; // Not a heartbeat message
  }

  private handleHeartbeatTimeout(): void {
    // Pong not received - connection may be stale
    this.consecutiveFailures++;
    
    // Close stale connection and trigger reconnection
    this.closeStaleConnection();
    this.checkForLocalSimulationFallback();
  }

  private closeStaleConnection(): void {
    const state = this.getState();
    
    if (state.phase === 'open' && this.ws) {
      // Force close the stale connection
      this.ws.close(1000, 'Stale connection - heartbeat timeout');
    }
  }

  /**
   * Add listener for failover events
   */
  public onFailover(listener: (event: WebSocketFailoverEvent) => void): () => void {
    this.failoverListeners.push(listener);
    return () => {
      const index = this.failoverListeners.indexOf(listener);
      if (index >= 0) {
        this.failoverListeners.splice(index, 1);
      }
    };
  }

  private emitFailoverEvent(event: WebSocketFailoverEvent): void {
    this.failoverListeners.forEach(listener => {
      try {
        listener(event);
      } catch {
        // Silently handle listener errors
      }
    });
  }

  /**
   * Check if currently in local simulation mode
   */
  public isLocalSimulationActive(): boolean {
    return this.isInLocalSimulation;
  }

  /**
   * Get reliability metrics
   */
  public getReliabilityMetrics(): {
    consecutiveFailures: number;
    isInLocalSimulation: boolean;
    heartbeatActive: boolean;
    lastPingTime: number;
    reliabilityConfig: Required<ReliabilityConfig>;
  } {
    return {
      consecutiveFailures: this.consecutiveFailures,
      isInLocalSimulation: this.isInLocalSimulation,
      heartbeatActive: this.heartbeatInterval !== null,
      lastPingTime: this.lastPingTime,
      reliabilityConfig: this.reliabilityConfig
    };
  }

  /**
   * Manually trigger local simulation for testing
   */
  public triggerLocalSimulation(reason = 'Manual trigger'): void {
    this.consecutiveFailures = this.reliabilityConfig.consecutiveFailureThreshold;
    this.enterLocalSimulationMode();
  }

  /**
   * Force exit from local simulation
   */
  public exitLocalSimulation(): void {
    this.exitLocalSimulationMode();
  }

  /**
   * Override destroy to clean up reliability features
   */
  public destroy(): void {
    this.stopHeartbeat();
    this.stopLocalSimulation();
    this.failoverListeners.length = 0;
    super.destroy();
  }

  /**
   * Access to local simulation data source for customization
   */
  public setLocalSimDataSource(dataSource: LocalSimDataSource): void {
    this.reliabilityConfig.localSimDataSource = dataSource;
  }

  // Expose the original WebSocketManager reference for backward compatibility
  private get ws() {
    return (this as any).ws;
  }

  // Expose internal send method
  private send(message: any): boolean {
    return super.send ? super.send(message) : false;
  }
}

// Export enhanced manager as default
export { EnhancedWebSocketManager as WebSocketManager };
export default EnhancedWebSocketManager;