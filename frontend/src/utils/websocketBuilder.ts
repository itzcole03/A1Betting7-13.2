/**
 * Canonical WebSocket URL Builder
 * Single source of truth for WebSocket URL construction
 */

interface WebSocketUrlOptions {
  clientId?: string;
  role?: string;
  version?: number;
  baseUrl?: string;
}

// Client ID persistence utility
export function getOrPersistClientId(storageKey = 'ws_client_id', passedClientId?: string): string {
  let clientId = passedClientId;
  
  // Try to get from storage first
  const storedClientId = window.localStorage.getItem(storageKey);
  const initialFromStorage = !!storedClientId;
  
  if (!clientId && storedClientId) {
    clientId = storedClientId;
  }
  
  // Generate new one if none available
  if (!clientId) {
    clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Always persist to storage
  window.localStorage.setItem(storageKey, clientId);
  
  // Dev-only diagnostic log
  const _import_meta_env = (globalThis as any).importMeta?.env || (global as any).importMeta?.env || (typeof window !== 'undefined' ? (window as any).import?.meta?.env : undefined) || {};

  if (_import_meta_env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[ClientIdDiag]', {
      initialFromStorage,
      passedIn: !!passedClientId,
      finalClientId: clientId
    });
  }
  
  return clientId;
}

// Environment resolution helper
export function resolveWebSocketBase(): string {
  const _import_meta_env2 = (globalThis as any).importMeta?.env || (global as any).importMeta?.env || (typeof window !== 'undefined' ? (window as any).import?.meta?.env : undefined) || {};

  let baseUrl = _import_meta_env2.VITE_WS_URL;
  
  // Check for legacy path in environment and sanitize
  if (baseUrl && baseUrl.includes('client_/ws')) {
    // eslint-disable-next-line no-console
    console.warn('[EnvDiag][LegacyInEnv] Legacy WebSocket path detected in environment, sanitizing:', baseUrl);
    baseUrl = baseUrl.replace(/\/client_\/ws.*$/, '');
  }
  
  // Default fallback
  if (!baseUrl) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = host === 'localhost' ? '8000' : window.location.port;
    baseUrl = `${protocol}//${host}${port ? `:${port}` : ''}`;
  }
  
  return baseUrl;
}

/**
 * Canonical WebSocket URL Builder
 * MUST be used for all WebSocket URL construction
 */
export function buildWebSocketUrl(options: WebSocketUrlOptions = {}): string {
  const {
    clientId: providedClientId,
    role = 'frontend',
    version = 1,
    baseUrl: providedBaseUrl
  } = options;
  
  // Resolve base URL
  const baseUrl = providedBaseUrl || resolveWebSocketBase();

  // Runtime-safe import.meta.env accessor for DEV checks inside this function
  const _import_meta_env2 = (globalThis as any).importMeta?.env || (global as any).importMeta?.env || (typeof window !== 'undefined' ? (window as any).import?.meta?.env : undefined) || {};
  
  // Get or generate client ID
  const clientId = getOrPersistClientId('ws_client_id', providedClientId);
  
  try {
    // Use URL constructor for robust path building
    const url = new URL('/ws/client', baseUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('version', String(version));
    url.searchParams.set('role', role);
    
    const result = url.toString();
    
    // Defensive assertion - dev only
    if (_import_meta_env2.DEV) {
      if (result.includes('client_/ws')) {
        // eslint-disable-next-line no-console
        console.error('[WSBuildDiag][LegacyDetected]', { 
          url: result, 
          stack: new Error().stack 
        });
        throw new Error('Legacy websocket path constructed after migration');
      }
      
      // eslint-disable-next-line no-console
      console.log('[WSBuildDiag] Built canonical WebSocket URL:', result);
    }
    
    return result;
  } catch (error) {
    // Fallback with defensive assertion
    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('version', String(version));
    params.set('role', role);
    
    const fallbackUrl = `${baseUrl}/ws/client?${params.toString()}`;
    
    // Defensive assertion on fallback too
    if (_import_meta_env2.DEV && fallbackUrl.includes('client_/ws')) {
      // eslint-disable-next-line no-console
      console.error('[WSBuildDiag][LegacyDetected] Even fallback created legacy path!', { 
        url: fallbackUrl, 
        error,
        stack: new Error().stack 
      });
      throw new Error('Legacy websocket path constructed in fallback after migration');
    }
    
  if (_import_meta_env2.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[WSBuildDiag] URL constructor failed, using fallback:', fallbackUrl, error);
    }
    
    return fallbackUrl;
  }
}

// Validate that a URL doesn't contain legacy patterns
export function validateWebSocketUrl(url: string): boolean {
  return !url.includes('client_/ws');
}