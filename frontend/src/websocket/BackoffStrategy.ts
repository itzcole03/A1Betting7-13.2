/**
 * Adaptive Backoff Strategy for WebSocket Reconnection
 * 
 * Implements jittered exponential backoff with configurable caps and seed-based
 * deterministic jitter for testing.
 */

export interface BackoffOptions {
  baseDelaysMs?: number[];      // Base delay sequence [1000, 2000, 4000, 8000, 12000]
  capDelayMs?: number;          // Maximum delay cap (12000ms = 12s)  
  jitterRatio?: number;         // Jitter as ratio of delay (0.2 = ±20%)
  seed?: number;                // Seed for deterministic jitter (testing)
  maxAttempts?: number;         // Maximum attempts before giving up
}

export class BackoffStrategy {
  private readonly baseDelays: number[];
  private readonly capDelay: number;
  private readonly jitterRatio: number;
  private readonly maxAttempts: number;
  private currentAttempt: number = 0;
  private rng: () => number;

  constructor(options: BackoffOptions = {}) {
    this.baseDelays = options.baseDelaysMs || [1000, 2000, 4000, 8000, 12000];
    this.capDelay = options.capDelayMs || 12000;
    this.jitterRatio = Math.max(0, Math.min(1, options.jitterRatio || 0.2)); // Clamp 0-1
    this.maxAttempts = options.maxAttempts || 8;

    // Initialize RNG (seedable for testing)
    if (options.seed !== undefined) {
      this.rng = this.createSeededRNG(options.seed);
    } else {
      this.rng = Math.random;
    }
  }

  /**
   * Get the next delay value with jitter applied
   * @returns Delay in milliseconds, or null if max attempts exceeded
   */
  public nextDelay(): number | null {
    if (this.currentAttempt >= this.maxAttempts) {
      return null; // Give up
    }

    // Get base delay for this attempt
    const delayIndex = Math.min(this.currentAttempt, this.baseDelays.length - 1);
    const baseDelay = this.baseDelays[delayIndex];
    
    // Apply cap
    const cappedDelay = Math.min(baseDelay, this.capDelay);
    
    // Apply jitter: delay ± (jitterRatio * delay)
    const jitterAmount = cappedDelay * this.jitterRatio;
    const jitter = (this.rng() - 0.5) * 2 * jitterAmount; // Random between -jitterAmount and +jitterAmount
    const jitteredDelay = Math.max(100, cappedDelay + jitter); // Minimum 100ms
    
    this.currentAttempt++;
    
    return Math.round(jitteredDelay);
  }

  /**
   * Reset the backoff strategy (e.g., after successful connection)
   */
  public reset(): void {
    this.currentAttempt = 0;
  }

  /**
   * Get current attempt number (0-based)
   */
  public getCurrentAttempt(): number {
    return this.currentAttempt;
  }

  /**
   * Check if max attempts have been reached
   */
  public hasExceededMaxAttempts(): boolean {
    return this.currentAttempt >= this.maxAttempts;
  }

  /**
   * Get the next delay without consuming an attempt (preview)
   */
  public peekNextDelay(): number | null {
    if (this.currentAttempt >= this.maxAttempts) {
      return null;
    }

    const delayIndex = Math.min(this.currentAttempt, this.baseDelays.length - 1);
    const baseDelay = this.baseDelays[delayIndex];
    return Math.min(baseDelay, this.capDelay);
  }

  /**
   * Get configuration summary
   */
  public getConfig(): {
    baseDelays: number[];
    capDelay: number;
    jitterRatio: number;
    maxAttempts: number;
    currentAttempt: number;
  } {
    return {
      baseDelays: [...this.baseDelays],
      capDelay: this.capDelay,
      jitterRatio: this.jitterRatio,
      maxAttempts: this.maxAttempts,
      currentAttempt: this.currentAttempt
    };
  }

  /**
   * Create a seeded random number generator for deterministic testing
   */
  private createSeededRNG(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      // Simple LCG (Linear Congruential Generator)
      currentSeed = (currentSeed * 1664525 + 1013904223) % Math.pow(2, 32);
      return currentSeed / Math.pow(2, 32);
    };
  }

  /**
   * Static method to calculate jitter bounds for testing
   */
  public static calculateJitterBounds(
    baseDelay: number, 
    jitterRatio: number
  ): { min: number; max: number } {
    const jitterAmount = baseDelay * jitterRatio;
    return {
      min: Math.max(100, baseDelay - jitterAmount),
      max: baseDelay + jitterAmount
    };
  }

  /**
   * Create a strategy for immediate retry (testing/development)
   */
  public static createImmediateStrategy(): BackoffStrategy {
    return new BackoffStrategy({
      baseDelaysMs: [100, 100, 100],
      capDelayMs: 100,
      jitterRatio: 0,
      maxAttempts: 3
    });
  }

  /**
   * Create a strategy with aggressive reconnection
   */
  public static createAggressiveStrategy(): BackoffStrategy {
    return new BackoffStrategy({
      baseDelaysMs: [500, 1000, 2000, 4000],
      capDelayMs: 4000,
      jitterRatio: 0.1,
      maxAttempts: 10
    });
  }

  /**
   * Create the default production strategy
   */
  public static createProductionStrategy(): BackoffStrategy {
    return new BackoffStrategy({
      baseDelaysMs: [1000, 2000, 4000, 8000, 12000],
      capDelayMs: 12000,
      jitterRatio: 0.2,
      maxAttempts: 8
    });
  }
}