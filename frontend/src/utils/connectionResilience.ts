/**
 * Connection Resilience Utilities
 * Implements modern retry patterns, circuit breakers, and health monitoring
 */

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

interface HealthCheckConfig {
  endpoint?: string;
  interval?: number;
  timeout?: number;
  healthyThreshold?: number;
  unhealthyThreshold?: number;
}

interface CircuitBreakerConfig {
  failureThreshold?: number;
  recoveryTimeout?: number;
  monitoringPeriod?: number;
}

class ConnectionResilience {
  private healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private config: Required<HealthCheckConfig & CircuitBreakerConfig> = {
    endpoint: '/health',
    interval: 30000, // 30 seconds
    timeout: 10000, // Increased to 10 seconds for more reliability
    healthyThreshold: 2,
    unhealthyThreshold: 5, // Increased threshold before marking unhealthy
    failureThreshold: 8, // Increased threshold before opening circuit breaker
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
  };

  constructor(config?: Partial<HealthCheckConfig & CircuitBreakerConfig>) {
    this.config = { ...this.config, ...config };
    this.startHealthMonitoring();
  }

  /**
   * Retry wrapper with exponential backoff and jitter
   */
  async withRetry<T>(operation: () => Promise<T>, retryConfig: RetryConfig = {}): Promise<T> {
    const config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryCondition: this.defaultRetryCondition,
      onRetry: () => {},
      ...retryConfig,
    };

    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.circuitBreakerState === 'open') {
          throw new Error('Circuit breaker is open - service unavailable');
        }

        const result = await operation();

        // Success - reset failure tracking
        this.onSuccess();
        return result;
      } catch (error) {
        lastError = error;
        this.onFailure(error);

        if (attempt === config.maxRetries || !config.retryCondition(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );
        const jitter = delay * 0.1 * Math.random(); // Add 10% jitter
        const finalDelay = delay + jitter;

        config.onRetry(error, attempt + 1);
        console.warn(
          `[ConnectionResilience] Retrying in ${Math.round(finalDelay)}ms (attempt ${attempt + 1}/${
            config.maxRetries + 1
          })`,
          error
        );

        await this.sleep(finalDelay);
      }
    }

    throw lastError;
  }

  /**
   * Health monitoring with automatic status tracking
   */
  private async startHealthMonitoring(): Promise<void> {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, this.config.timeout);

        // Use full URL for health endpoint
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const healthUrl = `${backendUrl}${this.config.endpoint}`;

        const response = await fetch(healthUrl, {
          signal: controller.signal,
          cache: 'no-cache',
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          this.updateHealthStatus('healthy');
        } else {
          this.updateHealthStatus('degraded');
        }
      } catch (error) {
        // Improve error handling for AbortError
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(
              '[ConnectionResilience] Health check timed out after',
              this.config.timeout,
              'ms'
            );
          } else {
            console.warn('[ConnectionResilience] Health check failed:', error.message);
          }
        } else {
          console.warn('[ConnectionResilience] Health check failed:', error);
        }
        this.updateHealthStatus('unhealthy');
      }
    };

    // Initial health check
    await checkHealth();

    // Schedule recurring health checks
    this.healthCheckInterval = setInterval(checkHealth, this.config.interval);
  }

  /**
   * Circuit breaker pattern implementation
   */
  private onSuccess(): void {
    this.failureCount = 0;
    if (this.circuitBreakerState === 'half-open') {
      this.circuitBreakerState = 'closed';
      console.log('[ConnectionResilience] Circuit breaker closed - service recovered');
    }
  }

  private onFailure(error: any): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.failureCount >= this.config.failureThreshold &&
      this.circuitBreakerState === 'closed'
    ) {
      this.circuitBreakerState = 'open';
      console.error('[ConnectionResilience] Circuit breaker opened - service degraded');

      // Schedule recovery attempt
      setTimeout(() => {
        if (this.circuitBreakerState === 'open') {
          this.circuitBreakerState = 'half-open';
          console.log('[ConnectionResilience] Circuit breaker half-open - testing recovery');
        }
      }, this.config.recoveryTimeout);
    }
  }

  private updateHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy'): void {
    if (this.healthStatus !== status) {
      console.log(`[ConnectionResilience] Health status changed: ${this.healthStatus} → ${status}`);
      this.healthStatus = status;

      // Emit custom event for UI updates
      window.dispatchEvent(
        new CustomEvent('healthStatusChanged', {
          detail: { status, timestamp: Date.now() },
        })
      );
    }
  }

  private defaultRetryCondition = (error: any): boolean => {
    // Retry on network errors, 5xx errors, timeouts
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  };

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current connection status
   */
  getStatus() {
    return {
      health: this.healthStatus,
      circuitBreaker: this.circuitBreakerState,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Export singleton instance
export const connectionResilience = new ConnectionResilience();

// Export utilities for custom configurations
export {
  ConnectionResilience,
  type CircuitBreakerConfig,
  type HealthCheckConfig,
  type RetryConfig,
};
