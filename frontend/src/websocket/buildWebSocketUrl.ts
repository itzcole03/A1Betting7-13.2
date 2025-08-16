/**
 * WebSocket URL Builder Utility
 * 
 * Single source of truth for constructing WebSocket URLs with the canonical format.
 * Supports environment variables and persistent client IDs.
 */

export interface WebSocketUrlOptions {
  /** Base WebSocket URL (default: VITE_WS_URL or ws://localhost:8000) */
  baseUrl?: string;
  /** Client ID (default: persistent from localStorage or generated) */
  clientId?: string;
  /** Protocol version (default: 1) */
  version?: number;
  /** Client role (default: frontend) */
  role?: string;
  /** Additional query parameters */
  additionalParams?: Record<string, string>;
}

/**
 * Build canonical WebSocket URL with proper query parameters
 * 
 * Format: ws://localhost:8000/ws/client?client_id=<uuid>&version=1&role=frontend
 * 
 * @param options WebSocket URL configuration options
 * @returns Canonical WebSocket URL
 */
export function buildWebSocketUrl(options: WebSocketUrlOptions = {}): string {
  const {
    baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
    clientId = getOrCreateClientId(),
    version = 1,
    role = 'frontend',
    additionalParams = {}
  } = options;

  // Normalize base URL - remove trailing slashes and ensure proper format
  const normalizedBase = normalizeBaseUrl(baseUrl);
  
  // Build URL with canonical path
  const url = new URL('/ws/client', normalizedBase);
  
  // Add required query parameters
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('version', version.toString());
  url.searchParams.set('role', role);
  
  // Add additional parameters
  Object.entries(additionalParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Get or create a persistent client ID
 * Uses crypto.randomUUID() with fallback for older browsers
 */
function getOrCreateClientId(): string {
  const storageKey = 'ws_client_id';
  
  try {
    const existingId = localStorage.getItem(storageKey);
    if (existingId && isValidClientId(existingId)) {
      return existingId;
    }
  } catch {
    // localStorage might not be available
  }
  
  // Generate new client ID
  const newClientId = generateClientId();
  
  try {
    localStorage.setItem(storageKey, newClientId);
  } catch {
    // Ignore if localStorage is not available
  }
  
  return newClientId;
}

/**
 * Generate a new client ID using crypto.randomUUID() with fallback
 */
function generateClientId(): string {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return `client_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
}

/**
 * Validate client ID format
 */
function isValidClientId(clientId: string): boolean {
  // Allow UUID format or legacy client_ format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const legacyPattern = /^client_[a-z0-9_]+$/i;
  
  return uuidPattern.test(clientId) || legacyPattern.test(clientId);
}

/**
 * Normalize base URL by removing trailing slashes and ensuring proper protocol
 */
function normalizeBaseUrl(baseUrl: string): string {
  let normalized = baseUrl.trim();
  
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');
  
  // Ensure WebSocket protocol
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'ws://');
  } else if (normalized.startsWith('https://')) {
    normalized = normalized.replace('https://', 'wss://');
  } else if (!normalized.startsWith('ws://') && !normalized.startsWith('wss://')) {
    // Default to ws:// for unspecified protocol
    normalized = `ws://${normalized}`;
  }
  
  return normalized;
}

/**
 * Extract client ID from a WebSocket URL
 * Useful for debugging and testing
 */
export function extractClientIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('client_id');
  } catch {
    return null;
  }
}

/**
 * Check if URL uses the canonical format
 * Useful for migration validation
 */
export function isCanonicalWebSocketUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Must have correct path
    if (parsedUrl.pathname !== '/ws/client') {
      return false;
    }
    
    // Must have required parameters
    const clientId = parsedUrl.searchParams.get('client_id');
    const version = parsedUrl.searchParams.get('version');
    const role = parsedUrl.searchParams.get('role');
    
    return !!(clientId && version && role);
  } catch {
    return false;
  }
}