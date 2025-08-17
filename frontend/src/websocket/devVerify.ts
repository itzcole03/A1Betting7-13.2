/**
 * Development Verification for WebSocket URL Builder
 * 
 * This script runs in development mode to verify that buildWebSocketUrl()
 * returns canonical URLs and fails if legacy patterns are detected.
 * 
 * Imported conditionally in main.tsx for development mode only.
 */

import { buildWebSocketUrl, validateWebSocketUrl } from './buildWebSocketUrl';

function verifyWebSocketUrl(): void {
  try {
    // Test canonical URL generation
    const url = buildWebSocketUrl();
    
    if (url.includes('client_/ws')) {
      // eslint-disable-next-line no-console
      console.error('[devVerify] CRITICAL: Legacy pattern still present in built URL:', url);
      throw new Error('Legacy WebSocket pattern detected in development build');
    }
    
    // Test URL validation
    const validation = validateWebSocketUrl(url);
    if (!validation.isValid) {
      // eslint-disable-next-line no-console
      console.error('[devVerify] CRITICAL: Generated URL fails validation:', validation.error);
      throw new Error('Generated WebSocket URL is invalid');
    }
    
    // eslint-disable-next-line no-console
    console.log('[devVerify] ✅ WebSocket URL generation verified:', url);
    
    // Test that legacy URL validation catches problems
    const legacyUrl = 'ws://localhost:8000/client_/ws/test-id';
    const legacyValidation = validateWebSocketUrl(legacyUrl);
    
    if (legacyValidation.isValid) {
      // eslint-disable-next-line no-console
      console.error('[devVerify] CRITICAL: Legacy URL incorrectly validated as valid');
      throw new Error('Legacy URL validation is broken');
    }
    
    // eslint-disable-next-line no-console
    console.log('[devVerify] ✅ Legacy URL correctly rejected:', legacyValidation.error);
    
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[devVerify] WebSocket URL verification failed:', error);
    
    // In development, we want to make this visible to developers
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error(`
========================================
DEVELOPMENT ERROR: WebSocket URL Verification Failed
========================================

The WebSocket URL builder or validator has a bug that needs to be fixed.

This error prevents legacy 'client_/ws' patterns from being reintroduced.

See docs/websockets/LEGACY_MIGRATION_NOTICE.md for guidance.
========================================
      `);
    }
    
    // Don't throw in production to avoid breaking the app
    // The error is already logged for debugging
  }
}

// Run verification
verifyWebSocketUrl();