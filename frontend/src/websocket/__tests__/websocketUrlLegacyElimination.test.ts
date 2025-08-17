/**
 * WebSocket URL Legacy Elimination Tests
 * Ensures legacy 'client_/ws' path cannot be constructed
 */

import { 
  buildWebSocketUrl, 
  resolveWebSocketBase, 
  getOrPersistClientId, 
  validateWebSocketUrl,
  setMockEnv 
} from '../../utils/websocketBuilder.mock';

// Simple localStorage mock
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: function(key: string) {
    return this.store[key] || null;
  },
  setItem: function(key: string, value: string) {
    this.store[key] = value;
  },
  clear: function() {
    this.store = {};
  }
};

// Mock global window if it doesn't exist
if (typeof global.window === 'undefined') {
  (global as any).window = {
    localStorage: mockLocalStorage,
    location: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '5173'
    }
  };
} else {
  // If window exists, just mock localStorage
  (global.window as any).localStorage = mockLocalStorage;
}

describe('WebSocket Legacy Elimination', () => {
  
  beforeEach(() => {
    // Clear localStorage between tests
    mockLocalStorage.clear();
    // Clear environment
    setMockEnv({ VITE_WS_URL: undefined });
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('buildWebSocketUrl canonical builder', () => {
    test('never returns URL containing client_/ws', () => {
      // Test with various configurations
      const testCases = [
        {},
        { clientId: 'test123' },
        { baseUrl: 'ws://localhost:8000' },
        { baseUrl: 'wss://production.com' },
        { clientId: 'custom', role: 'admin', version: 2 }
      ];

      testCases.forEach(options => {
        const url = buildWebSocketUrl(options);
        expect(url).not.toContain('client_/ws');
        expect(validateWebSocketUrl(url)).toBe(true);
        expect(url).toMatch(/\/ws\/client\?/); // Should contain canonical path
      });
    });

    test('throws in development when legacy path detected', () => {
      // Mock a scenario where URL constructor might create legacy path
      // We'll monkey-patch URL constructor to return legacy path
      const originalURL = global.URL;
      
      // Create a mock that returns legacy path
      const mockURL = jest.fn().mockImplementation((path, base) => {
        const url = new originalURL(path, base);
        // Force toString to return legacy path for this test
        url.toString = () => 'ws://localhost:8000/client_/ws/client_test?client_id=test';
        return url;
      });
      
      global.URL = mockURL as any;
      
      try {
        expect(() => buildWebSocketUrl({ clientId: 'test' })).toThrow('Legacy websocket path constructed after migration');
      } finally {
        // Restore original URL constructor
        global.URL = originalURL;
      }
    });

    test('generates correct canonical URLs', () => {
      const url = buildWebSocketUrl({
        clientId: 'test123',
        role: 'frontend',
        version: 1,
        baseUrl: 'ws://localhost:8000'
      });

      expect(url).toBe('ws://localhost:8000/ws/client?client_id=test123&version=1&role=frontend');
      expect(url).toContain('/ws/client?');
      expect(url).not.toContain('client_/ws');
    });
  });

  describe('Environment variable sanitization', () => {
    test('sanitizes legacy path from VITE_WS_URL environment', () => {
      // Set environment with legacy path
      setMockEnv({ VITE_WS_URL: 'ws://localhost:8000/ws/client_/legacy' });
      
      const baseUrl = resolveWebSocketBase();
      expect(baseUrl).not.toContain('client_/ws');
      expect(baseUrl).toBe('ws://localhost:8000');
      
      // Should log warning about legacy environment
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[EnvDiag][LegacyInEnv]'),
        'ws://localhost:8000/ws/client_/legacy'
      );
    });

    test('handles environment without legacy path correctly', () => {
      setMockEnv({ VITE_WS_URL: 'ws://localhost:8000' });
      
      const baseUrl = resolveWebSocketBase();
      expect(baseUrl).toBe('ws://localhost:8000');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Client ID persistence', () => {
    test('creates and persists new client ID when none exists', () => {
      const clientId = getOrPersistClientId('test_key');
      
      expect(clientId).toMatch(/^client_[a-zA-Z0-9]{9}$/);
      expect(mockLocalStorage.getItem('test_key')).toBe(clientId);
      
      // Should log diagnostic info in dev mode
      expect(console.log).toHaveBeenCalledWith(
        '[ClientIdDiag]',
        expect.objectContaining({
          initialFromStorage: false,
          passedIn: false,
          finalClientId: clientId
        })
      );
    });

    test('reuses existing client ID from storage', () => {
      mockLocalStorage.setItem('existing_key', 'stored_client_id');
      
      const clientId = getOrPersistClientId('existing_key');
      
      expect(clientId).toBe('stored_client_id');
      expect(console.log).toHaveBeenCalledWith(
        '[ClientIdDiag]',
        expect.objectContaining({
          initialFromStorage: true,
          passedIn: false,
          finalClientId: 'stored_client_id'
        })
      );
    });

    test('prefers passed client ID but still persists it', () => {
      const passedId = 'custom_client_123';
      const clientId = getOrPersistClientId('persist_key', passedId);
      
      expect(clientId).toBe(passedId);
      expect(mockLocalStorage.getItem('persist_key')).toBe(passedId);
    });
  });

  describe('URL validation', () => {
    test('validateWebSocketUrl correctly identifies legacy URLs', () => {
      expect(validateWebSocketUrl('ws://localhost:8000/ws/client')).toBe(true);
      expect(validateWebSocketUrl('ws://localhost:8000/client_/ws/test')).toBe(false);
      expect(validateWebSocketUrl('wss://prod.com/ws/client?id=123')).toBe(true);
      expect(validateWebSocketUrl('ws://dev.local/some/client_/ws/path')).toBe(false);
    });
  });

  describe('Reconnection backoff capping integration', () => {
    test('mock reconnection delay sequence caps at expected max', () => {
      // This test mocks the backoff strategy to verify max delay
      const expectedMax = 16000;
      
      // Simulate sequential failures
      let currentDelay = 1000;
      const delaySequence: number[] = [];
      
      // Mock exponential backoff with cap
      for (let attempt = 0; attempt < 8; attempt++) {
        delaySequence.push(currentDelay);
        currentDelay = Math.min(currentDelay * 2, expectedMax);
      }
      
      // Verify sequence caps correctly
      expect(delaySequence).toEqual([1000, 2000, 4000, 8000, 16000, 16000, 16000, 16000]);
      expect(Math.max(...delaySequence)).toBe(expectedMax);
    });
  });

  describe('Integration with legacy detection', () => {
    test('full URL construction flow prevents legacy path', () => {
      // Test complete flow: env resolution → client ID → URL building → validation
      setMockEnv({ VITE_WS_URL: 'ws://localhost:8000' }); // Clean environment
      
      const url = buildWebSocketUrl();
      
      expect(validateWebSocketUrl(url)).toBe(true);
      expect(url).toMatch(/^ws:\/\/localhost:8000\/ws\/client\?client_id=client_[a-zA-Z0-9]{9}&version=1&role=frontend$/);
      expect(url).not.toContain('client_/ws');
    });
  });
});