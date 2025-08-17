/**
 * EnhancedDataManager Deprecation Shim
 * 
 * This is a temporary shim that provides backward compatibility for EnhancedDataManager
 * while logging deprecation warnings and delegating to the new WebSocket connection service.
 * 
 * TODO: Remove this file once all references to EnhancedDataManager are updated.
 */

let hasLoggedDeprecationWarning = false;

function logDeprecationOnce(method: string): void {
  if (!hasLoggedDeprecationWarning) {
    hasLoggedDeprecationWarning = true;
    /* eslint-disable-next-line no-console */
    console.warn(
      '🚨 [DEPRECATED] EnhancedDataManager is deprecated. ' +
      'Please use useWebSocketConnection hook instead. ' +
      `Called method: ${method}. ` +
      'This shim will be removed in a future version.'
    );
  }
}

/**
 * Deprecated EnhancedDataManager shim
 * @deprecated Use useWebSocketConnection hook instead
 */
class DeprecatedEnhancedDataManager {
  async fetchBatch(_requests: unknown[]): Promise<unknown[]> {
    logDeprecationOnce('fetchBatch');
    // Return empty array as fallback
    return [];
  }

  async fetchSportsProps(_sport: string, _marketType = 'player', _options?: unknown): Promise<unknown[]> {
    logDeprecationOnce('fetchSportsProps');
    // Return empty array as fallback
    return [];
  }

  async fetchData(_endpoint: string, _params?: unknown, _options?: unknown): Promise<unknown> {
    logDeprecationOnce('fetchData');
    // Return null as fallback
    return null;
  }

  async fetchPropAnalysis(_propId: string, _player: string, _stat: string, _options?: unknown): Promise<unknown> {
    logDeprecationOnce('fetchPropAnalysis');
    // Return null as fallback
    return null;
  }

  subscribe(_pattern: string, _callback: (data: unknown) => void, _options?: unknown): () => void {
    logDeprecationOnce('subscribe');
    // Return no-op unsubscribe function
    return () => {};
  }

  getMetrics(): unknown {
    logDeprecationOnce('getMetrics');
    // Return basic metrics
    return {
      totalRequests: 0,
      cacheHitRate: 0,
      errorRate: 0,
      avgResponseTime: 0,
    };
  }

  clearCache(): void {
    logDeprecationOnce('clearCache');
    // No-op
  }

  async prefetchData(_pattern: string): Promise<void> {
    logDeprecationOnce('prefetchData');
    // No-op
  }

  /**
   * Mock method to maintain interface compatibility
   */
  mapToFeaturedProps(props: unknown[], sport?: string): unknown[] {
    logDeprecationOnce('mapToFeaturedProps');
    
    if (!Array.isArray(props)) {
      return [];
    }

    // Basic transformation to maintain compatibility
    return props.map(prop => {
      if (!prop || typeof prop !== 'object') {
        return {
          sport: sport || 'Unknown',
          id: Math.random().toString(),
          player: 'Unknown',
          stat: 'Unknown',
        };
      }

      const propObj = prop as Record<string, unknown>;
      
      return {
        ...propObj,
        sport: sport || 'Unknown',
        // Add any other required fields with safe defaults
        id: propObj.id || Math.random().toString(),
        player: propObj.player || 'Unknown',
        stat: propObj.stat || 'Unknown',
      };
    });
  }
}

// Export singleton instance for backward compatibility
export const enhancedDataManager = new DeprecatedEnhancedDataManager();

/**
 * Factory function to create EnhancedDataManager instance
 * @deprecated Use useWebSocketConnection hook instead
 */
export function createEnhancedDataManager(): DeprecatedEnhancedDataManager {
  return new DeprecatedEnhancedDataManager();
}

export default DeprecatedEnhancedDataManager;