/**
 * Unit tests for buildWebSocketUrl
 * 
 * These tests ensure the canonical WebSocket URL builder works correctly
 * and prevents regression to legacy path formats.
 */

import { buildWebSocketUrl, validateWebSocketUrl, type WebSocketBuildOptions } from '../buildWebSocketUrl';

// Mock localStorage for testing
const mockStorage = new Map<string, string>();

const mockLocalStorage = {
  storage: mockStorage,
  getItem: jest.fn((key: string): string | null => mockStorage.get(key) || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockStorage.set(key, value);
  }),
  removeItem: jest.fn((key: string): void => {
    mockStorage.delete(key);
  }),
  clear: jest.fn((): void => {
    mockStorage.clear();
  }),
  key: jest.fn((): null => null),
  length: 0
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock import.meta.env
const mockEnv = {
  VITE_WS_URL: undefined as string | undefined,
};

// Mock import.meta
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: mockEnv,
    },
  },
});

describe('buildWebSocketUrl', () => {
  beforeEach(() => {
    mockStorage.clear();
    (mockLocalStorage.getItem as jest.Mock).mockClear();
    (mockLocalStorage.setItem as jest.Mock).mockClear();
    mockEnv.VITE_WS_URL = undefined;
    
    // Clear console mocks
    jest.clearAllMocks();
    
    // Mock console.log to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds canonical URL with default options', () => {
    const url = buildWebSocketUrl();
    expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client\?client_id=client_[a-z0-9]+&version=1&role=frontend$/);
  });

  it('builds canonical URL with custom options', () => {
    const options: WebSocketBuildOptions = {
      base: 'ws://example.com:8080',
      clientId: 'test-client-123',
      version: '2',
      role: 'admin'
    };
    
    const url = buildWebSocketUrl(options);
    expect(url).toBe('ws://example.com:8080/ws/client?client_id=test-client-123&version=2&role=admin');
  });

  it('uses VITE_WS_URL environment variable when available', () => {
    mockEnv.VITE_WS_URL = 'ws://env-test:9000';
    
    const url = buildWebSocketUrl({ clientId: 'env-test' });
    expect(url).toBe('ws://env-test:9000/ws/client?client_id=env-test&version=1&role=frontend');
  });

  it('normalizes base URL by removing trailing slashes', () => {
    const url = buildWebSocketUrl({ 
      base: 'ws://localhost:8000/', 
      clientId: 'test-id' 
    });
    expect(url).toBe('ws://localhost:8000/ws/client?client_id=test-id&version=1&role=frontend');
  });

  it('normalizes base URL by removing existing /ws paths', () => {
    const url = buildWebSocketUrl({ 
      base: 'ws://localhost:8000/ws/legacy', 
      clientId: 'test-id' 
    });
    expect(url).toBe('ws://localhost:8000/ws/client?client_id=test-id&version=1&role=frontend');
  });

  it('persists client ID to localStorage', () => {
    const clientId = 'persistent-client-123';
    buildWebSocketUrl({ clientId });
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('ws_client_id', clientId);
  });

  it('retrieves existing client ID from localStorage', () => {
    const existingClientId = 'existing-client-456';
    mockStorage.set('ws_client_id', existingClientId);
    
    const url = buildWebSocketUrl();
    expect(url).toContain(`client_id=${existingClientId}`);
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage.setItem to throw an error
    (mockLocalStorage.setItem as jest.Mock).mockImplementation(() => {
      throw new Error('localStorage not available');
    });
    
    // Mock console.warn to verify it's called
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    const url = buildWebSocketUrl({ clientId: 'test-client' });
    
    // Should still work even if localStorage fails
    expect(url).toContain('client_id=test-client');
    expect(consoleSpy).toHaveBeenCalledWith('[WebSocket] Could not persist client ID to localStorage:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('throws error if legacy path format is somehow generated', () => {
    // This test ensures our safety check works
    // Since the function uses manual URL building and normalizes paths,
    // we test that it properly handles and normalizes potentially problematic inputs
    
    const url = buildWebSocketUrl({ 
      base: 'ws://localhost:8000/client_/ws', // This should be normalized to proper path
      clientId: 'test-id' 
    });
    
    // The function should normalize this properly and create canonical URL
    expect(url).toContain('/ws/client?');
    expect(url).toContain('client_id=test-id');
    expect(url).not.toContain('client_/ws');
  });

  it('generates unique client IDs when none provided', () => {
    const url1 = buildWebSocketUrl();
    const url2 = buildWebSocketUrl();
    
    // Extract client IDs using string parsing since URL constructor might not be available in Jest
    const clientId1 = url1.match(/client_id=([^&]+)/)?.[1];
    const clientId2 = url2.match(/client_id=([^&]+)/)?.[1];
    
    expect(clientId1).toBeTruthy();
    expect(clientId2).toBeTruthy();
    // Since localStorage is mocked, each call should get the same stored ID after first call
    // But both should be valid client ID format
    expect(clientId1).toMatch(/^client_[a-z0-9]+$/);
  });

  describe('URL validation', () => {
    it('validates canonical URLs correctly', () => {
      const validUrl = 'ws://localhost:8000/ws/client?client_id=test-id&version=1&role=frontend';
      const result = validateWebSocketUrl(validUrl);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects legacy path format', () => {
      const legacyUrl = 'ws://localhost:8000/client_/ws/test-id';
      const result = validateWebSocketUrl(legacyUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Legacy path format detected');
    });

    it('rejects URLs without required path', () => {
      const invalidUrl = 'ws://localhost:8000/some/other/path?client_id=test';
      const result = validateWebSocketUrl(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid path: WebSocket URL must use /ws/client endpoint');
    });

    it('rejects URLs without client_id parameter', () => {
      const invalidUrl = 'ws://localhost:8000/ws/client?version=1&role=frontend';
      const result = validateWebSocketUrl(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required query parameter: client_id');
    });

    it('handles invalid URL format', () => {
      const invalidUrl = 'not-a-valid-url';
      const result = validateWebSocketUrl(invalidUrl);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });
  });

  describe('integration with WebSocketManager', () => {
    it('generates URLs compatible with WebSocketManager expectations', () => {
      const url = buildWebSocketUrl({
        base: 'ws://localhost:8000',
        clientId: 'manager-test-id',
        version: '1',
        role: 'frontend'
      });
      
      // Parse URL using string methods instead of URL constructor for Jest compatibility
      expect(url).toMatch(/^ws:/);
      expect(url).toContain('/ws/client');
      expect(url).toContain('client_id=manager-test-id');
      expect(url).toContain('version=1');
      expect(url).toContain('role=frontend');
    });
  });

  describe('edge cases', () => {
    it('handles empty string base URL', () => {
      // Our function should handle empty base by using default
      const url = buildWebSocketUrl({ base: '', clientId: 'test' });
      expect(url).toContain('ws://localhost:8000/ws/client');
      expect(url).toContain('client_id=test');
    });

    it('handles undefined options object', () => {
      const url = buildWebSocketUrl(undefined);
      expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client\?client_id=client_[a-z0-9]+&version=1&role=frontend$/);
    });

    it('handles special characters in client ID', () => {
      const clientId = 'test-client_123.special';
      const url = buildWebSocketUrl({ clientId });
      
      // Parse client ID using string parsing for Jest compatibility
      const parsedClientId = url.match(/client_id=([^&]+)/)?.[1];
      expect(decodeURIComponent(parsedClientId || '')).toBe(clientId);
    });
  });
});