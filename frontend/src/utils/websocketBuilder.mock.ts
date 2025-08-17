/**
 * Mock websocket builder for Jest tests
 */

interface WebSocketUrlOptions {
  clientId?: string;
  role?: string;
  version?: number;
  baseUrl?: string;
}

// Mock environment for testing
let mockEnv = {
  VITE_WS_URL: undefined as string | undefined,
  DEV: true
};

// Test helper to set mock environment
export function setMockEnv(env: Partial<typeof mockEnv>) {
  mockEnv = { ...mockEnv, ...env };
}

export function getOrPersistClientId(storageKey = 'ws_client_id', passedClientId?: string): string {
  let clientId = passedClientId;
  
  // Try to get from storage first - ensure we have access to window
  let storedClientId: string | null = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storedClientId = window.localStorage.getItem(storageKey);
    }
  } catch (e) {
    // Storage access failed, continue without it
  }
  
  const initialFromStorage = !!storedClientId;
  
  if (!clientId && storedClientId) {
    clientId = storedClientId;
  }
  
  // Generate new one if none available
  if (!clientId) {
    clientId = `client_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Always persist to storage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(storageKey, clientId);
    }
  } catch (e) {
    // Storage access failed, continue without persistence
  }
  
  // Dev-only diagnostic log
  if (mockEnv.DEV) {
    // eslint-disable-next-line no-console
    console.log('[ClientIdDiag]', {
      initialFromStorage,
      passedIn: !!passedClientId,
      finalClientId: clientId
    });
  }
  
  return clientId;
}

export function resolveWebSocketBase(): string {
  let baseUrl = mockEnv.VITE_WS_URL;
  
  // Check for legacy path in environment and sanitize
  if (baseUrl && baseUrl.includes('client_/ws')) {
    // eslint-disable-next-line no-console
    console.warn('[EnvDiag][LegacyInEnv] Legacy WebSocket path detected in environment, sanitizing:', baseUrl);
    baseUrl = baseUrl.replace(/\/client_\/ws.*$/, '').replace(/\/ws\/client_.*$/, '');
  }
  
  // Default fallback
  if (!baseUrl) {
    const protocol = 'ws:';
    const host = 'localhost';
    const port = '8000';
    baseUrl = `${protocol}//${host}:${port}`;
  }
  
  return baseUrl;
}

export function buildWebSocketUrl(options: WebSocketUrlOptions = {}): string {
  const {
    clientId: providedClientId,
    role = 'frontend',
    version = 1,
    baseUrl: providedBaseUrl
  } = options;
  
  // Resolve base URL
  const baseUrl = providedBaseUrl || resolveWebSocketBase();
  
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
    if (mockEnv.DEV) {
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
    if (mockEnv.DEV && fallbackUrl.includes('client_/ws')) {
      // eslint-disable-next-line no-console
      console.error('[WSBuildDiag][LegacyDetected] Even fallback created legacy path!', { 
        url: fallbackUrl, 
        error,
        stack: new Error().stack 
      });
      throw new Error('Legacy websocket path constructed in fallback after migration');
    }
    
    if (mockEnv.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[WSBuildDiag] URL constructor failed, using fallback:', fallbackUrl, error);
    }
    
    return fallbackUrl;
  }
}

export function validateWebSocketUrl(url: string): boolean {
  return !url.includes('client_/ws');
}