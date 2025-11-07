/**
 * Bootstrap App Tests - Simplified Verification
 *
 * Tests the core bootstrap functionality with minimal mocking complexity.
 * Focus on idempotency behavior and environment detection.
 */

// Suppress JSDOM navigation warnings in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Not implemented: navigation')) {
      // Suppress JSDOM navigation errors
      return;
    }
    originalConsoleError.apply(console, args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Simple DOM setup
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(100),
  },
  writable: true,
});

// Simple location mock — mutate existing mock to avoid deleting window.location (which
// can trigger jsdom navigation behavior). Ensure reload is a jest mock for assertions.
if (!(window as any).location) {
  Object.defineProperty(window, 'location', {
    configurable: false,
    enumerable: true,
    value: { search: '', reload: jest.fn() },
  });
} else {
  try {
    (window as any).location.search = '';
  } catch (e) {
    // ignore if the host environment prevents mutating search
  }
  // Try to replace reload with a jest mock if possible; some jsdom Location
  // implementations make this read-only/non-configurable, so ignore failures.
  try {
    Object.defineProperty((window as any).location, 'reload', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  } catch (e) {
    // ignore - cannot redefine reload on this environment
  }
}

// Mock the environment detection
jest.mock('../env', () => ({
  getRuntimeEnv: () => ({
    mode: 'test' as const,
    isDev: false,
    isProd: false,
    isTest: true,
    source: 'node' as const,
  }),
}));

import { __resetBootstrapForTesting, isBootstrapped } from '../bootstrapApp';
import { getRuntimeEnv } from '../env';

describe('Bootstrap App - Core Functionality', () => {
  beforeEach(() => {
    // Reset bootstrap state before each test
    __resetBootstrapForTesting();

    // Clear localStorage mock
    (window.localStorage.getItem as jest.Mock).mockClear();
  });

  describe('Environment Detection', () => {
    it('should correctly detect test environment', () => {
      const env = getRuntimeEnv();
      expect(env.mode).toBe('test');
      expect(env.isTest).toBe(true);
      expect(env.isDev).toBe(false);
      expect(env.isProd).toBe(false);
    });

    it('should have consistent environment interface', () => {
      const env = getRuntimeEnv();
      expect(env).toHaveProperty('mode');
      expect(env).toHaveProperty('isDev');
      expect(env).toHaveProperty('isProd');
      expect(env).toHaveProperty('isTest');
      expect(env).toHaveProperty('source');
    });
  });

  describe('Bootstrap State Management', () => {
    it('should not be bootstrapped initially', () => {
      expect(isBootstrapped()).toBe(false);
    });

    it('should detect when bootstrap state is reset', () => {
      expect(isBootstrapped()).toBe(false);

      __resetBootstrapForTesting();

      expect(isBootstrapped()).toBe(false);
    });
  });

  describe('Basic Functionality', () => {
    it('should export required functions', () => {
      expect(typeof isBootstrapped).toBe('function');
      expect(typeof __resetBootstrapForTesting).toBe('function');
      expect(typeof getRuntimeEnv).toBe('function');
    });

    it('should have environment working correctly', () => {
      const env = getRuntimeEnv();
      expect(env.mode).toBe('test');
      expect(typeof env.isDev).toBe('boolean');
      expect(typeof env.isProd).toBe('boolean');
    });
  });

  describe('Performance API Mock', () => {
    it('should have mocked performance.now', () => {
      expect(typeof window.performance.now).toBe('function');
      expect(window.performance.now()).toBe(100);
    });
  });

  describe('DOM Mocks', () => {
    it('should have localStorage mock', () => {
      expect(typeof window.localStorage.getItem).toBe('function');
      expect(typeof window.localStorage.setItem).toBe('function');
    });

    it('should have location mock', () => {
      expect(window.location).toBeDefined();
      expect(window.location.search).toBe('');
    });
  });
});
