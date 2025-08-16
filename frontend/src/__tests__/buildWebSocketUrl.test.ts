/**
 * Tests for buildWebSocketUrl utility
 * 
 * Comprehensive test coverage for WebSocket URL construction and validation.
 */

import { 
  buildWebSocketUrl,
  extractClientIdFromUrl,
  isCanonicalWebSocketUrl,
  type WebSocketUrlOptions
} from '../websocket/buildWebSocketUrl';

describe('buildWebSocketUrl', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock crypto.randomUUID if not available
    if (!global.crypto) {
      global.crypto = {
        randomUUID: () => 'test-uuid-1234-5678-9abc-def0',
        subtle: {} as SubtleCrypto,
        getRandomValues: jest.fn()
      } as Crypto;
    }
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Basic URL Construction', () => {
    it('should build a canonical WebSocket URL with default options', () => {
      const url = buildWebSocketUrl();
      
      expect(url).toMatch(/^wss?:\/\/[^/]+\/ws\/client\?.*client_id=[a-f0-9-]+.*version=1.*role=frontend/);
      expect(isCanonicalWebSocketUrl(url)).toBe(true);
    });

    it('should use provided base URL', () => {
      const url = buildWebSocketUrl({
        baseUrl: 'ws://example.com:9000'
      });
      
      expect(url).toMatch(/^ws:\/\/example\.com:9000\/ws\/client\?/);
      expect(url).toContain('client_id=');
    });

    it('should use provided client ID', () => {
      const customClientId = 'custom-client-123';
      const url = buildWebSocketUrl({
        clientId: customClientId
      });
      
      expect(url).toContain(`client_id=${customClientId}`);
      expect(extractClientIdFromUrl(url)).toBe(customClientId);
    });

    it('should use provided version and role', () => {
      const url = buildWebSocketUrl({
        version: 2,
        role: 'admin'
      });
      
      expect(url).toContain('version=2');
      expect(url).toContain('role=admin');
    });

    it('should include additional parameters', () => {
      const url = buildWebSocketUrl({
        additionalParams: {
          debug: 'true',
          feature: 'test'
        }
      });
      
      expect(url).toContain('debug=true');
      expect(url).toContain('feature=test');
    });
  });

  describe('Client ID Extraction', () => {
    it('should extract client ID from URL', () => {
      const clientId = 'test-client-id-123';
      const url = buildWebSocketUrl({ clientId });
      
      expect(extractClientIdFromUrl(url)).toBe(clientId);
    });

    it('should return null for URL without client ID', () => {
      const url = 'ws://localhost:8000/ws/client?version=1&role=frontend';
      
      expect(extractClientIdFromUrl(url)).toBeNull();
    });

    it('should handle malformed URLs gracefully', () => {
      const malformedUrl = 'not-a-url';
      
      expect(extractClientIdFromUrl(malformedUrl)).toBeNull();
    });
  });

  describe('URL Validation', () => {
    it('should validate canonical WebSocket URLs', () => {
      const canonicalUrl = buildWebSocketUrl();
      
      expect(isCanonicalWebSocketUrl(canonicalUrl)).toBe(true);
    });

    it('should reject non-canonical URLs', () => {
      const nonCanonicalUrls = [
        'ws://localhost:8000/client_/ws/client123',
        'ws://localhost:8000/ws/invalid',
        'http://localhost:8000/api',
        'not-a-url'
      ];
      
      nonCanonicalUrls.forEach(url => {
        expect(isCanonicalWebSocketUrl(url)).toBe(false);
      });
    });

    it('should validate URLs with different protocols', () => {
      const wsUrl = buildWebSocketUrl({ baseUrl: 'ws://localhost:8000' });
      const wssUrl = buildWebSocketUrl({ baseUrl: 'wss://example.com' });
      
      expect(isCanonicalWebSocketUrl(wsUrl)).toBe(true);
      expect(isCanonicalWebSocketUrl(wssUrl)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid options gracefully', () => {
      // Should not throw for invalid additional params
      expect(() => {
        buildWebSocketUrl({
          additionalParams: {
            invalid: null as any
          }
        });
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = jest.fn(() => {
        throw new Error('localStorage not available');
      });
      
      // Should still build URL even if localStorage fails
      expect(() => buildWebSocketUrl()).not.toThrow();
      
      // Restore original localStorage
      Storage.prototype.getItem = originalGetItem;
    });
  });

  describe('URL Construction Edge Cases', () => {
    it('should handle base URLs with trailing slashes', () => {
      const url = buildWebSocketUrl({
        baseUrl: 'ws://localhost:8000/'
      });
      
      // Should not have double slashes
      expect(url).not.toContain('//ws/');
      expect(url).toContain('/ws/client');
    });

    it('should encode special characters in additional parameters', () => {
      const url = buildWebSocketUrl({
        additionalParams: {
          message: 'hello world',
          special: 'café & résumé'
        }
      });
      
      expect(url).toContain('message=hello%20world');
      expect(url).toContain('special=caf%C3%A9%20%26%20r%C3%A9sum%C3%A9');
    });

    it('should maintain parameter order consistency', () => {
      const url1 = buildWebSocketUrl({ clientId: 'test', version: 1, role: 'frontend' });
      const url2 = buildWebSocketUrl({ clientId: 'test', version: 1, role: 'frontend' });
      
      expect(url1).toBe(url2);
    });
  });

  describe('Performance', () => {
    it('should build URLs efficiently for repeated calls', () => {
      const startTime = performance.now();
      const options: WebSocketUrlOptions = {
        clientId: 'test-client',
        version: 1,
        role: 'frontend'
      };
      
      // Build 100 URLs to test performance
      for (let i = 0; i < 100; i++) {
        buildWebSocketUrl(options);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 100ms for 100 URLs)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Different Environments', () => {
    it('should work in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const url = buildWebSocketUrl();
      expect(url).toBeDefined();
      expect(isCanonicalWebSocketUrl(url)).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should work in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const url = buildWebSocketUrl();
      expect(url).toBeDefined();
      expect(isCanonicalWebSocketUrl(url)).toBe(true);
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});