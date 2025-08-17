/**
 * Canonical WebSocket URL Builder
 * 
 * CRITICAL: This is the ONLY way to build WebSocket URLs in the application.
 * All other URL construction methods are deprecated and must be replaced.
 * 
 * Legacy path pattern `client_/ws/<id>` is NOT SUPPORTED and will result in 403 errors.
 * Canonical pattern is `/ws/client?client_id=<id>&version=1&role=frontend`
 */

export interface WebSocketBuildOptions {
  base?: string;
  clientId?: string;
  version?: string;
  role?: 'frontend' | 'admin' | 'test';
}

/**
 * Build canonical WebSocket URL with proper query parameters
 * 
 * @param options - Configuration options
 * @returns Canonical WebSocket URL with query parameters
 * 
 * @example
 * ```ts
 * const url = buildWebSocketUrl({ 
 *   base: 'ws://localhost:8000',
 *   clientId: 'client_abc123',
 *   version: '1',
 *   role: 'frontend'
 * });
 * // Returns: ws://localhost:8000/ws/client?client_id=client_abc123&version=1&role=frontend
 * ```
 */
export function buildWebSocketUrl(options?: WebSocketBuildOptions | undefined): string {
  const {
    base: rawBase = getEnvironmentVariable('VITE_WS_URL') || 'ws://localhost:8000',
    clientId = generateClientId(),
    version = '1',
    role = 'frontend'
  } = options || {};

  // Handle empty string base - use default
  const base = rawBase.trim() === '' ? 'ws://localhost:8000' : rawBase;

  // Always try to persist the client ID that will be used
  try {
    const storage = (typeof window !== 'undefined' && window.localStorage) || 
                    (typeof localStorage !== 'undefined' && localStorage) ||
                    ((typeof global !== 'undefined' && (global as unknown as { window?: { localStorage?: Storage } }).window?.localStorage));
    
    if (storage) {
      storage.setItem('ws_client_id', clientId);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[WebSocket] Could not persist client ID to localStorage:', error);
  }

  // Remove any trailing slashes and existing /ws paths to normalize
  // Also remove any legacy client_ paths to ensure clean base
  const normalizedBase = base
    .replace(/\/+$/, '') // Remove trailing slashes
    .replace(/\/ws.*$/, '') // Remove any existing /ws paths
    .replace(/\/client_.*$/, ''); // Remove any legacy client_ paths
  
  // Build URL manually to avoid URL constructor issues in Jest
  const params = new URLSearchParams();
  params.set('client_id', clientId);
  params.set('version', version);
  params.set('role', role);
  
  const finalUrl = `${normalizedBase}/ws/client?${params.toString()}`;
  
  // SAFETY CHECK: Ensure we never return legacy path format
  if (finalUrl.includes('client_/ws')) {
    throw new Error(`CRITICAL: Legacy WebSocket path detected in built URL: ${finalUrl}. This indicates a bug in buildWebSocketUrl implementation.`);
  }
  
  // eslint-disable-next-line no-console
  console.log(`[WebSocket] Built canonical URL: ${finalUrl}`);
  return finalUrl;
}

/**
 * Generate a unique client ID for WebSocket connections
 */
function generateClientId(): string {
  let existingId: string | null = null;
  
  try {
    // Access localStorage - prefer window.localStorage for consistency with test setup
    const storage = (typeof window !== 'undefined' && window.localStorage) || 
                    (typeof localStorage !== 'undefined' && localStorage) ||
                    ((typeof global !== 'undefined' && (global as unknown as { window?: { localStorage?: Storage } }).window?.localStorage));
    
    if (storage) {
      existingId = storage.getItem('ws_client_id');
    }
  } catch {
    // localStorage access failed, continue with generation
  }
  
  if (existingId) {
    return existingId;
  }
  
  // Generate new client ID (persistence will happen in buildWebSocketUrl)
  const newId = `client_${Math.random().toString(36).substr(2, 9)}`;
  return newId;
}

/**
 * Get environment variable with fallback for test environments
 */
function getEnvironmentVariable(key: string): string | undefined {
  // Try import.meta.env mock (test environment)
  try {
    if (typeof globalThis !== 'undefined' && 
        (globalThis as unknown as { import?: { meta?: { env?: Record<string, string> } } }).import?.meta?.env) {
      const env = (globalThis as unknown as { import: { meta: { env: Record<string, string> } } }).import.meta.env;
      return env[key];
    }
  } catch {
    // globalThis mock not available
  }

  // In Jest/test environment, use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  // In browser/Vite, this will be replaced during build
  return undefined;
}

/**
 * Validate that a WebSocket URL uses canonical format
 * Used in tests and development mode checks
 */
export function validateWebSocketUrl(url: string): { isValid: boolean; error?: string } {
  try {
    // Basic URL format validation
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'Invalid URL: URL must be a non-empty string'
      };
    }
    
    // Check for WebSocket protocol first
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      return {
        isValid: false,
        error: 'Invalid URL format: WebSocket URL must use ws:// or wss:// protocol'
      };
    }
    
    // Check for basic URL structure (must have host and path)
    if (!url.includes('://') || url.split('://').length !== 2) {
      return {
        isValid: false,
        error: 'Invalid URL format: Malformed URL structure'
      };
    }
    
    // Check for legacy path format
    if (url.includes('client_/ws')) {
      return {
        isValid: false,
        error: 'Legacy path format detected: client_/ws is not supported. Use /ws/client with query parameters.'
      };
    }
    
    // Check for canonical path
    if (!url.includes('/ws/client')) {
      return {
        isValid: false,
        error: 'Invalid path: WebSocket URL must use /ws/client endpoint'
      };
    }
    
    // Check for required query parameters
    if (!url.includes('client_id=')) {
      return {
        isValid: false,
        error: 'Missing required query parameter: client_id'
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}