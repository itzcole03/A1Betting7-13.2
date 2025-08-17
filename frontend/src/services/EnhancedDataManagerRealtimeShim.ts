/**
 * Realtime Shim for legacy EnhancedDataManager.
 * Prevents use of legacy 'client_/ws' path and guides devs to use WebSocketManager.
 * 
 * This shim logs deprecation warnings and prevents the EnhancedDataManager from
 * initiating WebSocket connections using the legacy path format.
 */

import { buildWebSocketUrl } from '../websocket/buildWebSocketUrl';

let hasLoggedDeprecationWarning = false;

/**
 * Shim that replaces EnhancedDataManager's WebSocket initialization
 * with a deprecation warning and guidance to use WebSocketManager
 */
export function shimEnhancedDataManagerWebSocket(): void {
  if (!hasLoggedDeprecationWarning) {
    // eslint-disable-next-line no-console
    console.warn(`
[DEPRECATION WARNING] EnhancedDataManager WebSocket connection disabled.

Legacy path 'client_/ws/<id>' is deprecated and causes 403 errors.

SOLUTION:
1. Use WebSocketManager instead of EnhancedDataManager for realtime connections
2. Import from: frontend/src/websocket/WebSocketManager.ts
3. Use canonical URL builder: buildWebSocketUrl()

Example migration:
OLD: enhancedDataManager.initializeWebSocket() 
NEW: const wsManager = new WebSocketManager(); wsManager.connect();

This warning will only appear once per session.
`);
    hasLoggedDeprecationWarning = true;
  }
}

/**
 * Replacement for legacy getWebSocketUrl method in EnhancedDataManager
 * Returns canonical URL instead of legacy format
 */
export function getCanonicalWebSocketUrl(): string {
  shimEnhancedDataManagerWebSocket();
  return buildWebSocketUrl();
}

/**
 * Check if WebSocket should be disabled in EnhancedDataManager
 * Returns true to prevent legacy WebSocket initialization
 */
export function shouldDisableInternalWebSocket(): boolean {
  return true; // Always disable internal WebSocket in EnhancedDataManager
}