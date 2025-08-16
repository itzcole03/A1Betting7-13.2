/**
 * Enhanced Backoff Strategy with Jitter, Ceiling, and Reason Codes
 * 
 * Implements sophisticated backoff algorithms for WebSocket reconnection
 * with jitter to prevent thundering herd problems and reason-specific
 * strategies for different failure types.
 */

import { 
  WSBackoffConfig, 
  WSBackoffReason, 
  WSBackoffState,
  DEFAULT_BACKOFF_CONFIG,
  AGGRESSIVE_BACKOFF_CONFIG,
  CONSERVATIVE_BACKOFF_CONFIG
} from './protocol-types';

export class EnhancedBackoffStrategy {
  private state: WSBackoffState;
  private config: WSBackoffConfig;
  private reasonSpecificConfigs: Map<WSBackoffReason, WSBackoffConfig>;

  constructor(config: WSBackoffConfig = DEFAULT_BACKOFF_CONFIG) {
    this.config = config;
    this.state = this.createInitialState();
    this.reasonSpecificConfigs = new Map();
    this.initializeReasonSpecificConfigs();
  }

  /**
   * Calculate next delay with jitter and ceiling
   */
  getNextDelay(reason: WSBackoffReason = WSBackoffReason.UNKNOWN): number {
    const activeConfig = this.reasonSpecificConfigs.get(reason) || this.config;
    
    // Update state
    this.state.attempt++;
    this.state.reason = reason;
    this.state.lastAttemptTime = Date.now();

    // Check if max attempts exceeded
    if (this.state.attempt > activeConfig.maxAttempts) {
      this.state.nextDelay = -1; // Indicates no more attempts
      return -1;
    }

    const delay = this.calculateDelayWithJitter(this.state.attempt, activeConfig);
    this.state.nextDelay = delay;
    this.state.totalBackoffTime += delay;

    return delay;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelayWithJitter(attempt: number, config: WSBackoffConfig): number {
    const baseIndex = Math.min(attempt - 1, config.baseDelays.length - 1);
    const baseDelay = config.baseDelays[baseIndex];
    
    // Apply exponential multiplier for attempts beyond base delays
    const exponentialDelay = attempt > config.baseDelays.length 
      ? baseDelay * Math.pow(config.multiplier, attempt - config.baseDelays.length)
      : baseDelay;
    
    // Cap at maximum delay
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Apply jitter to prevent thundering herd
    const jitterAmount = cappedDelay * config.jitterRatio;
    const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
    
    // Ensure minimum delay of 100ms
    return Math.max(100, Math.floor(cappedDelay + jitter));
  }

  /**
   * Reset backoff state for successful connection
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get current backoff state
   */
  getState(): WSBackoffState {
    return { ...this.state };
  }

  /**
   * Check if max attempts reached
   */
  isExhausted(): boolean {
    return this.state.attempt >= this.config.maxAttempts;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(): number {
    return Math.max(0, this.config.maxAttempts - this.state.attempt);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WSBackoffConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set reason-specific configuration
   */
  setReasonSpecificConfig(reason: WSBackoffReason, config: WSBackoffConfig): void {
    this.reasonSpecificConfigs.set(reason, config);
  }

  /**
   * Get effective configuration for a reason
   */
  getEffectiveConfig(reason: WSBackoffReason): WSBackoffConfig {
    return this.reasonSpecificConfigs.get(reason) || this.config;
  }

  /**
   * Calculate total expected backoff time
   */
  calculateTotalBackoffTime(reason: WSBackoffReason = WSBackoffReason.UNKNOWN): number {
    const config = this.getEffectiveConfig(reason);
    let totalTime = 0;
    
    for (let i = 1; i <= config.maxAttempts; i++) {
      const baseIndex = Math.min(i - 1, config.baseDelays.length - 1);
      const baseDelay = config.baseDelays[baseIndex];
      
      const exponentialDelay = i > config.baseDelays.length 
        ? baseDelay * Math.pow(config.multiplier, i - config.baseDelays.length)
        : baseDelay;
      
      const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
      totalTime += cappedDelay;
    }
    
    return totalTime;
  }

  /**
   * Create initial backoff state
   */
  private createInitialState(): WSBackoffState {
    return {
      attempt: 0,
      nextDelay: 0,
      reason: WSBackoffReason.UNKNOWN,
      lastAttemptTime: 0,
      totalBackoffTime: 0
    };
  }

  /**
   * Initialize reason-specific backoff configurations
   */
  private initializeReasonSpecificConfigs(): void {
    // Network errors: More aggressive retries
    this.reasonSpecificConfigs.set(WSBackoffReason.NETWORK_ERROR, AGGRESSIVE_BACKOFF_CONFIG);
    
    // Rate limiting: Conservative retries with longer delays
    this.reasonSpecificConfigs.set(WSBackoffReason.RATE_LIMITED, {
      baseDelays: [5000, 10000, 20000, 40000],
      maxDelay: 120000, // 2 minutes max
      jitterRatio: 0.3,
      maxAttempts: 3,
      multiplier: 2.0
    });
    
    // Authentication failures: Minimal retries
    this.reasonSpecificConfigs.set(WSBackoffReason.AUTHENTICATION_FAILED, {
      baseDelays: [1000, 5000],
      maxDelay: 10000,
      jitterRatio: 0.1,
      maxAttempts: 2,
      multiplier: 1.0
    });
    
    // Server errors: Standard progressive backoff
    this.reasonSpecificConfigs.set(WSBackoffReason.SERVER_ERROR, DEFAULT_BACKOFF_CONFIG);
    
    // Protocol errors: Minimal retries (likely configuration issue)
    this.reasonSpecificConfigs.set(WSBackoffReason.PROTOCOL_ERROR, {
      baseDelays: [2000, 5000],
      maxDelay: 10000,
      jitterRatio: 0.1,
      maxAttempts: 3,
      multiplier: 1.0
    });
    
    // Timeouts: Aggressive retries (may be temporary)
    this.reasonSpecificConfigs.set(WSBackoffReason.TIMEOUT, AGGRESSIVE_BACKOFF_CONFIG);
  }

  /**
   * Get human-readable description of backoff state
   */
  getDescription(): string {
    if (this.state.attempt === 0) {
      return 'No reconnection attempts yet';
    }
    
    if (this.isExhausted()) {
      return `Max attempts (${this.config.maxAttempts}) exceeded for ${this.state.reason}`;
    }
    
    const remainingTime = Math.round(this.state.nextDelay / 1000);
    return `Attempt ${this.state.attempt}/${this.config.maxAttempts}, next retry in ${remainingTime}s (${this.state.reason})`;
  }

  /**
   * Export state for persistence/debugging
   */
  exportState(): string {
    return JSON.stringify({
      state: this.state,
      config: this.config,
      timestamp: Date.now()
    });
  }

  /**
   * Import state from persistence
   */
  importState(stateJson: string): boolean {
    try {
      const imported = JSON.parse(stateJson);
      if (imported.state && imported.config) {
        this.state = imported.state;
        this.config = imported.config;
        return true;
      }
    } catch {
      // Failed to import state - will use default
    }
    return false;
  }

  /**
   * Static factory methods for common strategies
   */
  static createProductionStrategy(): EnhancedBackoffStrategy {
    return new EnhancedBackoffStrategy(DEFAULT_BACKOFF_CONFIG);
  }

  static createAggressiveStrategy(): EnhancedBackoffStrategy {
    return new EnhancedBackoffStrategy(AGGRESSIVE_BACKOFF_CONFIG);
  }

  static createConservativeStrategy(): EnhancedBackoffStrategy {
    return new EnhancedBackoffStrategy(CONSERVATIVE_BACKOFF_CONFIG);
  }

  static createTestStrategy(): EnhancedBackoffStrategy {
    return new EnhancedBackoffStrategy({
      baseDelays: [100, 200, 400],
      maxDelay: 1000,
      jitterRatio: 0.1,
      maxAttempts: 3,
      multiplier: 1.5
    });
  }

  /**
   * Create custom strategy based on requirements
   */
  static createCustomStrategy(requirements: {
    maxTotalTime?: number;
    maxAttempts?: number;
    urgency?: 'low' | 'medium' | 'high';
  }): EnhancedBackoffStrategy {
    const { maxTotalTime = 60000, maxAttempts = 10, urgency = 'medium' } = requirements;
    
    let baseConfig: WSBackoffConfig;
    
    switch (urgency) {
      case 'high':
        baseConfig = AGGRESSIVE_BACKOFF_CONFIG;
        break;
      case 'low':
        baseConfig = CONSERVATIVE_BACKOFF_CONFIG;
        break;
      default:
        baseConfig = DEFAULT_BACKOFF_CONFIG;
    }
    
    // Adjust config to meet time/attempt constraints
    const adjustedConfig: WSBackoffConfig = {
      ...baseConfig,
      maxAttempts,
      maxDelay: Math.min(baseConfig.maxDelay, maxTotalTime / maxAttempts)
    };
    
    return new EnhancedBackoffStrategy(adjustedConfig);
  }
}