/**
 * Unit tests for buildWebSocketUrl utility
 */

import { buildWebSocketUrl, extractClientIdFromUrl, isCanonicalWebSocketUrl } from '../buildWebSocketUrl';

// Mock crypto.randomUUID for consistent testing
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
const originalCrypto = global.crypto;

describe('buildWebSocketUrl', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    
    // Mock crypto.randomUUID
    global.crypto = {
      ...originalCrypto,
      randomUUID: jest.fn(() => mockUUID)
    } as any;
  });

  afterEach(() => {
    global.crypto = originalCrypto;
  });

  describe('URL construction', () => {
    it('should build canonical URL with default parameters', () => {
      const url = buildWebSocketUrl();
      expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client\?client_id=.+&version=1&role=frontend$/);
    });

    it('should handle custom base URL', () => {
      const url = buildWebSocketUrl({ baseUrl: 'wss://example.com:9000' });
      expect(url).toMatch(/^wss:\/\/example\.com:9000\/ws\/client\?client_id=.+&version=1&role=frontend$/);
    });

    it('should handle custom client ID', () => {
      const customClientId = 'test-client-123';
      const url = buildWebSocketUrl({ clientId: customClientId });
      expect(url).toContain('client_id=test-client-123');
    });

    it('should handle custom version and role', () => {
      const url = buildWebSocketUrl({ version: 2, role: 'backend' });
      expect(url).toContain('version=2');
      expect(url).toContain('role=backend');
    });

    it('should handle additional parameters', () => {
      const url = buildWebSocketUrl({ 
        additionalParams: { 
          token: 'abc123',
          debug: 'true'
        }
      });
      expect(url).toContain('token=abc123');
      expect(url).toContain('debug=true');
    });
  });

  describe('base URL normalization', () => {
    it('should remove trailing slashes', () => {
      const url = buildWebSocketUrl({ baseUrl: 'ws://localhost:8000///' });
      expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client/);
    });

    it('should convert http to ws', () => {
      const url = buildWebSocketUrl({ baseUrl: 'http://example.com' });
      expect(url).toMatch(/^ws:\/\/example\.com\/ws\/client/);
    });

    it('should convert https to wss', () => {
      const url = buildWebSocketUrl({ baseUrl: 'https://example.com' });
      expect(url).toMatch(/^wss:\/\/example\.com\/ws\/client/);
    });

    it('should default to ws:// for unspecified protocol', () => {
      const url = buildWebSocketUrl({ baseUrl: 'example.com:8000' });
      expect(url).toMatch(/^ws:\/\/example\.com:8000\/ws\/client/);
    });
  });

  describe('client ID persistence', () => {
    it('should use existing client ID from localStorage', () => {
      const existingId = 'existing-client-id';
      localStorage.setItem('ws_client_id', existingId);
      
      const url = buildWebSocketUrl();
      expect(url).toContain(`client_id=${existingId}`);
    });

    it('should generate new client ID if none exists', () => {
      const url = buildWebSocketUrl();
      const clientId = extractClientIdFromUrl(url);
      
      expect(clientId).toBeTruthy();
      expect(localStorage.getItem('ws_client_id')).toBe(clientId);
    });

    it('should use crypto.randomUUID when available', () => {
      const url = buildWebSocketUrl();
      expect(url).toContain(`client_id=${mockUUID}`);
    });

    it('should fallback gracefully when crypto.randomUUID is not available', () => {
      // Remove crypto.randomUUID
      global.crypto = {} as any;
      
      const url = buildWebSocketUrl();
      const clientId = extractClientIdFromUrl(url);
      
      expect(clientId).toBeTruthy();
      expect(clientId).toMatch(/^client_[a-z0-9_]+$/);
    });

    it('should handle localStorage unavailability', () => {
      // Mock localStorage to throw
      const originalLocalStorage = global.localStorage;
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage not available'); },
          setItem: () => { throw new Error('localStorage not available'); }
        },
        configurable: true
      });

      expect(() => buildWebSocketUrl()).not.toThrow();
      
      // Restore localStorage
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        configurable: true
      });
    });
  });

  describe('URL validation', () => {
    it('should validate canonical URLs correctly', () => {
      const canonicalUrl = 'ws://localhost:8000/ws/client?client_id=test&version=1&role=frontend';
      expect(isCanonicalWebSocketUrl(canonicalUrl)).toBe(true);
    });

    it('should reject legacy URLs', () => {
      const legacyUrl = 'ws://localhost:8000/ws/client_test123';
      expect(isCanonicalWebSocketUrl(legacyUrl)).toBe(false);
    });

    it('should reject URLs missing required parameters', () => {
      const incompleteUrl = 'ws://localhost:8000/ws/client?client_id=test';
      expect(isCanonicalWebSocketUrl(incompleteUrl)).toBe(false);
    });

    it('should reject URLs with wrong path', () => {
      const wrongPathUrl = 'ws://localhost:8000/client_/ws/test?client_id=test&version=1&role=frontend';
      expect(isCanonicalWebSocketUrl(wrongPathUrl)).toBe(false);
    });

    it('should reject malformed URLs', () => {
      const malformedUrl = 'not-a-url';
      expect(isCanonicalWebSocketUrl(malformedUrl)).toBe(false);
    });
  });

  describe('client ID extraction', () => {
    it('should extract client ID from valid URL', () => {
      const url = 'ws://localhost:8000/ws/client?client_id=test123&version=1&role=frontend';
      expect(extractClientIdFromUrl(url)).toBe('test123');
    });

    it('should return null for malformed URLs', () => {
      expect(extractClientIdFromUrl('not-a-url')).toBe(null);
    });

    it('should return null if client_id parameter is missing', () => {
      const url = 'ws://localhost:8000/ws/client?version=1&role=frontend';
      expect(extractClientIdFromUrl(url)).toBe(null);
    });
  });

  describe('deterministic behavior for testing', () => {
    it('should produce consistent results with same inputs', () => {
      const options = { baseUrl: 'ws://test.com', clientId: 'test-id', version: 1, role: 'frontend' };
      
      const url1 = buildWebSocketUrl(options);
      const url2 = buildWebSocketUrl(options);
      
      expect(url1).toBe(url2);
    });

    it('should handle empty additional parameters', () => {
      const url = buildWebSocketUrl({ additionalParams: {} });
      expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client\?client_id=.+&version=1&role=frontend$/);
    });
  });
});