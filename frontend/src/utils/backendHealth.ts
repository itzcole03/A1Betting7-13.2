/**
 * Backend Health Checking Utilities
 * Helps diagnose and resolve backend connectivity issues
 */

import { logger } from './logger';

export interface BackendHealthInfo {
  isHealthy: boolean;
  responseTime: number;
  port?: number;
  endpoint?: string;
  version?: string;
  error?: string;
}

export class BackendHealthChecker {
  private static instance: BackendHealthChecker;
  private healthCache = new Map<string, { result: BackendHealthInfo; timestamp: number }>();
  private readonly CACHE_TTL = 10000; // 10 seconds

  public static getInstance(): BackendHealthChecker {
    if (!BackendHealthChecker.instance) {
      BackendHealthChecker.instance = new BackendHealthChecker();
    }
    return BackendHealthChecker.instance;
  }

  /**
   * Check backend health on multiple common ports
   */
  async checkBackendHealth(): Promise<BackendHealthInfo> {
    const cacheKey = 'backend-health';
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    logger.info('[BackendHealth] Checking backend connectivity...');

    // In cloud environment, we can only test same-origin endpoints
    const isCloudEnvironment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (isCloudEnvironment) {
      // Only test proxy endpoints in cloud environment
      const testCases = [
        { endpoint: '/api/health' },
        { endpoint: '/health' },
        { endpoint: '/api/v1/cheatsheets/health' },
      ];

      for (const testCase of testCases) {
        try {
          const result = await this.testEndpoint(testCase.endpoint);
          if (result.isHealthy) {
            this.setCachedResult(cacheKey, result);
            logger.info('[BackendHealth] Backend found and healthy (via proxy)', {
              endpoint: testCase.endpoint,
              responseTime: result.responseTime
            });
            return result;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.debug('[BackendHealth] Test failed', {
            endpoint: testCase.endpoint,
            error: errorMessage
          });
        }
      }
    } else {
      // Local development - test multiple ports
      const testCases = [
        { port: 8000, endpoint: '/api/health' },
        { port: 8000, endpoint: '/health' },
        { port: 8001, endpoint: '/api/health' },
        { port: 8001, endpoint: '/health' },
        { port: 3000, endpoint: '/api/health' },
        { port: 3000, endpoint: '/health' },
        { port: 5000, endpoint: '/api/health' },
        { port: 5000, endpoint: '/health' },
      ];

      for (const testCase of testCases) {
        try {
          const result = await this.testEndpoint(testCase.endpoint, testCase.port);
          if (result.isHealthy) {
            this.setCachedResult(cacheKey, result);
            logger.info('[BackendHealth] Backend found and healthy', {
              port: testCase.port,
              endpoint: testCase.endpoint,
              responseTime: result.responseTime
            });
            return result;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.debug('[BackendHealth] Test failed', {
            port: testCase.port,
            endpoint: testCase.endpoint,
            error: errorMessage
          });
        }
      }
    }

    // No working backend found
    const failureResult: BackendHealthInfo = {
      isHealthy: false,
      responseTime: 0,
      error: isCloudEnvironment
        ? 'Backend not responding via proxy - check if backend is connected to this cloud environment'
        : 'No backend found on common ports (8000, 8001, 3000, 5000)'
    };

    this.setCachedResult(cacheKey, failureResult);
    return failureResult;
  }

  /**
   * Test a specific endpoint
   */
  private async testEndpoint(endpoint: string, port?: number): Promise<BackendHealthInfo> {
    const startTime = Date.now();
    
    try {
      const url = port ? `http://localhost:${port}${endpoint}` : endpoint;
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
        mode: port ? 'cors' : 'same-origin'
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        let version: string | undefined;
        try {
          const data = await response.json();
          version = data.version || data.app_version || 'unknown';
        } catch {
          // Response might not be JSON, that's okay
        }

        return {
          isHealthy: true,
          responseTime,
          port,
          endpoint,
          version
        };
      } else {
        return {
          isHealthy: false,
          responseTime,
          port,
          endpoint,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        isHealthy: false,
        responseTime,
        port,
        endpoint,
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      };
    }
  }

  /**
   * Check if cheatsheets API is available
   */
  async checkCheatsheetsAPI(): Promise<BackendHealthInfo> {
    const cacheKey = 'cheatsheets-api';
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.testEndpoint('/api/v1/cheatsheets/health');
      this.setCachedResult(cacheKey, result);
      return result;
    } catch (error) {
      const failureResult: BackendHealthInfo = {
        isHealthy: false,
        responseTime: 0,
        error: error.message
      };
      this.setCachedResult(cacheKey, failureResult);
      return failureResult;
    }
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(key: string): BackendHealthInfo | null {
    const cached = this.healthCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    
    if (cached) {
      this.healthCache.delete(key);
    }
    
    return null;
  }

  /**
   * Cache a health check result
   */
  private setCachedResult(key: string, result: BackendHealthInfo): void {
    this.healthCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached results
   */
  clearCache(): void {
    this.healthCache.clear();
    logger.info('[BackendHealth] Cache cleared');
  }

  /**
   * Get diagnostic information for troubleshooting
   */
  async getDiagnosticInfo(): Promise<{
    backendHealth: BackendHealthInfo;
    cheatsheetsAPI: BackendHealthInfo;
    suggestions: string[];
  }> {
    const [backendHealth, cheatsheetsAPI] = await Promise.all([
      this.checkBackendHealth(),
      this.checkCheatsheetsAPI()
    ]);

    const suggestions: string[] = [];

    if (!backendHealth.isHealthy) {
      suggestions.push('Backend server is not running or not accessible');
      suggestions.push('Check if the backend is started on port 8000 (or other common ports)');
      suggestions.push('Verify the backend is binding to 0.0.0.0 (not just 127.0.0.1)');
      suggestions.push('Check firewall settings allow connections to the backend port');
    }

    if (!cheatsheetsAPI.isHealthy && backendHealth.isHealthy) {
      suggestions.push('Backend is running but cheatsheets API routes are not available');
      suggestions.push('Check if the cheatsheets routes are properly registered');
      suggestions.push('Verify the backend includes the enhanced production integration');
    }

    if (backendHealth.isHealthy && cheatsheetsAPI.isHealthy) {
      suggestions.push('All systems operational! Backend and APIs are responding correctly.');
    }

    return {
      backendHealth,
      cheatsheetsAPI,
      suggestions
    };
  }
}

// Export singleton instance
export const backendHealthChecker = BackendHealthChecker.getInstance();
