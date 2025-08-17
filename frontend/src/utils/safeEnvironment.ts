/**
 * Safe environment variable resolution that works in both Vite and Jest environments
 * Provides fallback handling and diagnostic logging for debugging
 */

interface EnvConfig {
  // WebSocket configuration
  VITE_WS_URL?: string;
  VITE_WEBSOCKET_ENABLED?: string;
  
  // API configuration  
  VITE_API_URL?: string;
  VITE_BACKEND_URL?: string;
  
  // Development flags
  VITE_DEBUG?: string;
  NODE_ENV?: string;
  
  // Test environment detection
  JEST_WORKER_ID?: string;
  VITEST?: string;
}

class SafeEnvironment {
  private envCache: Partial<EnvConfig> = {};
  private initialized = false;

  constructor() {
    this.initializeEnvironment();
  }

  private initializeEnvironment(): void {
    if (this.initialized) return;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[EnvDiag] Initializing environment resolution...');
    }

    try {
      // Detect environment type
      const isVite = typeof import.meta !== 'undefined' && import.meta.env;
      const isJest = typeof process !== 'undefined' && (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');
      const isVitest = typeof process !== 'undefined' && process.env.VITEST;
      const isBrowser = typeof window !== 'undefined';
      const isNode = typeof process !== 'undefined';

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Environment detection:', {
          isVite,
          isJest,
          isVitest,
          isBrowser,
          isNode,
          hasImportMeta: typeof import.meta !== 'undefined',
          hasImportMetaEnv: typeof import.meta !== 'undefined' && !!import.meta.env,
          hasProcessEnv: typeof process !== 'undefined' && !!process.env
        });
      }

      // Initialize environment variables with proper fallback chain
      this.resolveEnvVar('VITE_WS_URL');
      this.resolveEnvVar('VITE_WEBSOCKET_ENABLED');
      this.resolveEnvVar('VITE_API_URL');
      this.resolveEnvVar('VITE_BACKEND_URL');
      this.resolveEnvVar('VITE_DEBUG');
      this.resolveEnvVar('NODE_ENV');
      this.resolveEnvVar('JEST_WORKER_ID');
      this.resolveEnvVar('VITEST');

      this.initialized = true;

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Environment resolution complete:', this.envCache);
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[EnvDiag] Error during environment initialization:', error);
      }
      this.initialized = true; // Mark as initialized even on error to prevent infinite retry
    }
  }

  private resolveEnvVar(key: keyof EnvConfig): void {
    let value: string | undefined;
    const sources: Array<{ name: string; value: string | undefined }> = [];

    try {
      // Try import.meta.env first (Vite)
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viteValue = (import.meta.env as any)[key];
        sources.push({ name: 'import.meta.env', value: viteValue });
        if (viteValue !== undefined) {
          value = viteValue;
        }
      }
    } catch (error) {
      sources.push({ name: 'import.meta.env', value: `ERROR: ${error}` });
    }

    try {
      // Try process.env (Node.js/Jest)
      if (typeof process !== 'undefined' && process.env) {
        const processValue = process.env[key];
        sources.push({ name: 'process.env', value: processValue });
        if (processValue !== undefined && value === undefined) {
          value = processValue;
        }
      }
    } catch (error) {
      sources.push({ name: 'process.env', value: `ERROR: ${error}` });
    }

    try {
      // Try global window env (fallback for browser)
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__VITE_ENV__) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const windowValue = ((window as unknown as Record<string, any>).__VITE_ENV__ as any)[key];
        sources.push({ name: 'window.__VITE_ENV__', value: windowValue });
        if (windowValue !== undefined && value === undefined) {
          value = windowValue;
        }
      }
    } catch (error) {
      sources.push({ name: 'window.__VITE_ENV__', value: `ERROR: ${error}` });
    }

    // Cache the resolved value
    this.envCache[key] = value;

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[EnvDiag] Resolved ${key}:`, {
        finalValue: value,
        sources,
        cached: true
      });
    }
  }

  /**
   * Get environment variable with fallback support
   */
  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] | undefined {
    if (!this.initialized) {
      this.initializeEnvironment();
    }

    return this.envCache[key];
  }

  /**
   * Get environment variable with default value
   */
  public getWithDefault<K extends keyof EnvConfig>(
    key: K, 
    defaultValue: NonNullable<EnvConfig[K]>
  ): NonNullable<EnvConfig[K]> {
    const value = this.get(key);
    return (value ?? defaultValue) as NonNullable<EnvConfig[K]>;
  }

  /**
   * Check if we're in a test environment
   */
  public isTestEnvironment(): boolean {
    return !!(
      this.get('JEST_WORKER_ID') || 
      this.get('VITEST') || 
      this.get('NODE_ENV') === 'test'
    );
  }

  /**
   * Check if we're in development
   */
  public isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  /**
   * Check if we're in production
   */
  public isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Get WebSocket URL with proper fallbacks
   */
  public getWebSocketUrl(): string {
    const wsUrl = this.get('VITE_WS_URL');
    
    if (wsUrl) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Using configured WebSocket URL:', wsUrl);
      }
      return wsUrl;
    }

    // Fallback logic based on environment
    if (this.isTestEnvironment()) {
      const fallback = 'ws://localhost:8000/ws';
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Using test WebSocket URL fallback:', fallback);
      }
      return fallback;
    }

    if (this.isDevelopment()) {
      const fallback = 'ws://localhost:8000/ws';
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Using development WebSocket URL fallback:', fallback);
      }
      return fallback;
    }

    // Production fallback
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const fallback = `${protocol}//${window.location.host}/ws`;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[EnvDiag] Using production WebSocket URL fallback:', fallback);
      }
      return fallback;
    }

    // Final fallback
    const finalFallback = 'ws://localhost:8000/ws';
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[EnvDiag] Using final WebSocket URL fallback:', finalFallback);
    }
    return finalFallback;
  }

  /**
   * Check if WebSocket is enabled
   */
  public isWebSocketEnabled(): boolean {
    const enabled = this.get('VITE_WEBSOCKET_ENABLED');
    const result = enabled === 'true' || enabled === '1';
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[EnvDiag] WebSocket enabled check:', {
        rawValue: enabled,
        result
      });
    }
    
    return result;
  }

  /**
   * Get all resolved environment variables (for debugging)
   */
  public getAll(): Partial<EnvConfig> {
    if (!this.initialized) {
      this.initializeEnvironment();
    }
    return { ...this.envCache };
  }

  /**
   * Force re-initialization (for testing)
   */
  public reinitialize(): void {
    this.envCache = {};
    this.initialized = false;
    this.initializeEnvironment();
  }
}

// Export singleton instance
export const safeEnvironment = new SafeEnvironment();

// Export class for testing
export { SafeEnvironment };

export default safeEnvironment;