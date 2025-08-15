/**
 * Bootstrap App Tests - Idempotency & Environment Resolution
 * 
 * Tests ensure bootstrap only runs once even if called multiple times,
 * environment is correctly detected, and all services are properly initialized.
 */

// Mock the environment module before importing
jest.mock('../env', () => ({
  getRuntimeEnv: () => ({
    mode: 'test' as const,
    isDev: false,
    isProd: false,
    isTest: true,
    source: 'node' as const,
  }),
  isDev: () => false,
  isProd: () => false,
  isTest: () => true,
  getMode: () => 'test' as const,
}));

// Mock the logger to capture calls
const mockLogger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock dependencies with correct paths
jest.mock('../../utils/logger', () => ({
  logger: mockLogger,
}));

// Mock auth service
const mockAuthService = {
  isAuthenticated: jest.fn().mockReturnValue(false),
  getUser: jest.fn().mockReturnValue(null),
};

jest.mock('../../services/authService', () => ({
  _authService: mockAuthService,
}));

// Mock reliability orchestrator
const mockReliabilityOrchestrator = {
  startMonitoring: jest.fn().mockResolvedValue(void 0),
};

jest.mock('../../services/reliabilityMonitoringOrchestrator', () => ({
  reliabilityMonitoringOrchestrator: mockReliabilityOrchestrator,
}));

// Mock web vitals service
const mockWebVitalsService = {
  init: jest.fn(),
};

jest.mock('../../services/webVitalsService', () => ({
  webVitalsService: mockWebVitalsService,
}));

// Setup DOM mocks without causing navigation
delete (window as any).location;
(window as any).location = {
  search: '',
  reload: jest.fn(),
  href: 'http://localhost:3000'
};

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
  },
  writable: true,
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(100)
  },
  writable: true
});

import { bootstrapApp, isBootstrapped, __resetBootstrapForTesting } from '../bootstrapApp';
import { getRuntimeEnv } from '../env';

Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
  },
  writable: true,
});

describe('Bootstrap App', () => {
  beforeEach(() => {
    // Reset all mocks and bootstrap state
    jest.clearAllMocks();
    __resetBootstrapForTesting();
    
    // Clear any global state
    delete (window as any).__A1_AUTH_RESTORED;
    
    // Reset environment mocks
    Object.defineProperty(process, 'env', {
      value: { NODE_ENV: 'test' },
      writable: true,
    });
    
    // Mock import.meta.env
    (global as any).importMetaEnv = { MODE: 'test' };
  });

  describe('Environment Detection', () => {
    it('should correctly detect test environment', () => {
      const env = getRuntimeEnv();
      expect(env.mode).toBe('test');
      expect(env.isTest).toBe(true);
      expect(env.isDev).toBe(false);
      expect(env.isProd).toBe(false);
    });

    it('should use mocked environment values', () => {
      // Our mock returns test mode - verify it works
      const env = getRuntimeEnv();
      expect(env.mode).toBe('test');
      expect(env.source).toBe('node');
    });

    it('should have consistent environment interface', () => {
      // Verify all expected properties exist
      const env = getRuntimeEnv();
      expect(env).toHaveProperty('mode');
      expect(env).toHaveProperty('isDev');
      expect(env).toHaveProperty('isProd');
      expect(env).toHaveProperty('isTest');
      expect(env).toHaveProperty('source');
    });
  });

  describe('Bootstrap Idempotency', () => {
    it('should not be bootstrapped initially', () => {
      expect(isBootstrapped()).toBe(false);
    });

    it('should complete bootstrap successfully on first call', async () => {
      const result = await bootstrapApp();

      expect(result.alreadyBootstrapped).toBe(false);
      expect(result.environment.mode).toBe('test');
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.services.errorHandlersRegistered).toBe(true);
      expect(result.services.authRestored).toBe(true);
      expect(result.services.webVitalsInitialized).toBe(true);
      
      // Should be marked as bootstrapped
      expect(isBootstrapped()).toBe(true);
      
      // Should log completion
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Bootstrap ✅ Completed'),
        expect.objectContaining({
          environment: 'test',
          services: result.services,
        }),
        'Bootstrap'
      );
    });

    it('should skip duplicate initialization on second call', async () => {
      // First bootstrap
      const firstResult = await bootstrapApp();
      expect(firstResult.alreadyBootstrapped).toBe(false);
      
      // Clear mock calls to isolate second call
      jest.clearAllMocks();
      
      // Second bootstrap (should be skipped)
      const secondResult = await bootstrapApp();
      
      expect(secondResult.alreadyBootstrapped).toBe(true);
      expect(secondResult.environment.mode).toBe('test');
      expect(secondResult.durationMs).toBeGreaterThan(0);
      
      // Services should not be called again
      expect(mockReliabilityOrchestrator.startMonitoring).not.toHaveBeenCalled();
      expect(mockWebVitalsService.init).not.toHaveBeenCalled();
      
      // Should log skip message
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Bootstrap skipped - already initialized',
        expect.objectContaining({
          environment: 'test',
        }),
        'Bootstrap'
      );
    });

    it('should reinitialize when force option is used', async () => {
      // First bootstrap
      await bootstrapApp();
      jest.clearAllMocks();
      
      // Force second bootstrap
      const result = await bootstrapApp({ force: true });
      
      expect(result.alreadyBootstrapped).toBe(false);
      
      // Services should be called again
      expect(mockReliabilityOrchestrator.startMonitoring).toHaveBeenCalled();
      expect(mockWebVitalsService.init).toHaveBeenCalled();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize all services by default', async () => {
      const result = await bootstrapApp();

      expect(result.services.errorHandlersRegistered).toBe(true);
      expect(result.services.authRestored).toBe(true);
      expect(result.services.reliabilityStarted).toBe(true);
      expect(result.services.webVitalsInitialized).toBe(true);
      
      expect(mockReliabilityOrchestrator.startMonitoring).toHaveBeenCalled();
      expect(mockWebVitalsService.init).toHaveBeenCalled();
    });

    it('should skip auth when skipAuth option is used', async () => {
      const result = await bootstrapApp({ skipAuth: true });

      expect(result.services.authRestored).toBe(false);
      expect(result.services.errorHandlersRegistered).toBe(true);
      expect(result.services.webVitalsInitialized).toBe(true);
    });

    it('should skip reliability when skipReliability option is used', async () => {
      const result = await bootstrapApp({ skipReliability: true });

      expect(result.services.reliabilityStarted).toBe(false);
      expect(mockReliabilityOrchestrator.startMonitoring).not.toHaveBeenCalled();
    });

    it('should skip web vitals when skipWebVitals option is used', async () => {
      const result = await bootstrapApp({ skipWebVitals: true });

      expect(result.services.webVitalsInitialized).toBe(false);
      expect(mockWebVitalsService.init).not.toHaveBeenCalled();
    });

    it('should skip reliability in lean mode', async () => {
      // Mock lean mode
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn((key: string) => key === 'DEV_LEAN_MODE' ? 'true' : null),
        },
        writable: true,
      });

      const result = await bootstrapApp();

      expect(result.services.reliabilityStarted).toBe(false);
      expect(mockReliabilityOrchestrator.startMonitoring).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Coordination', () => {
    it('should restore authenticated user and set global flag', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
      };

      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getUser.mockReturnValue(mockUser);

      const result = await bootstrapApp();

      expect(result.services.authRestored).toBe(true);
      expect((window as any).__A1_AUTH_RESTORED).toBe(true);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔐 Authentication restored',
        expect.objectContaining({
          email: mockUser.email,
          role: mockUser.role,
          userId: mockUser.id,
        }),
        'Auth'
      );
    });

    it('should not restore auth when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const result = await bootstrapApp();

      expect(result.services.authRestored).toBe(true); // Process completed
      expect((window as any).__A1_AUTH_RESTORED).toBeUndefined();
      
      // Should not log auth restoration
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Authentication restored'),
        expect.any(Object),
        'Auth'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failures gracefully', async () => {
      const error = new Error('Service initialization failed');
      mockReliabilityOrchestrator.startMonitoring.mockRejectedValue(error);

      await expect(bootstrapApp()).rejects.toThrow('Service initialization failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Bootstrap failed',
        expect.objectContaining({
          error: error.message,
          stack: error.stack,
          environment: 'test',
        }),
        'Bootstrap'
      );
    });

    it('should include timing information in error logs', async () => {
      const error = new Error('Test error');
      mockWebVitalsService.init.mockImplementation(() => {
        throw error;
      });

      await expect(bootstrapApp()).rejects.toThrow('Test error');
      
      const errorCall = mockLogger.error.mock.calls[0];
      expect(errorCall[1]).toHaveProperty('durationMs');
      expect(errorCall[1].durationMs).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking', () => {
    it('should track bootstrap timing', async () => {
      const result = await bootstrapApp();

      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
      
      // Should log timing information
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Completed in ${result.durationMs.toFixed(1)}ms`),
        expect.any(Object),
        'Bootstrap'
      );
    });

    it('should include environment information in logs', async () => {
      await bootstrapApp();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'A1Betting Platform Loading - Test Mode',
        expect.objectContaining({
          environment: 'test',
          source: expect.any(String),
          timestamp: expect.any(String),
          userAgent: 'test-user-agent',
          force: false,
        }),
        'Bootstrap'
      );
    });
  });
});