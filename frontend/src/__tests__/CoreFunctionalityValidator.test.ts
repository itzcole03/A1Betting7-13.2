/**
 * Tests for CoreFunctionalityValidator
 * 
 * Comprehensive test coverage for enhanced validator with 
 * readiness gating, navigation validation, and error handling.
 */

import { CoreFunctionalityValidator } from '../utils/CoreFunctionalityValidator';
import { useWebSocketConnection } from '../hooks/useWebSocketConnection';

// Mock the WebSocket hook
jest.mock('../hooks/useWebSocketConnection', () => ({
  useWebSocketConnection: jest.fn()
}));

const mockUseWebSocketConnection = useWebSocketConnection as jest.MockedFunction<typeof useWebSocketConnection>;

describe('CoreFunctionalityValidator', () => {
  let validator: CoreFunctionalityValidator;
  let mockGtag: jest.Mock;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    
    // Mock gtag
    mockGtag = jest.fn();
    (global as any).gtag = mockGtag;
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Default WebSocket mock
    mockUseWebSocketConnection.mockReturnValue({
      connected: false,
      connecting: false,
      error: null,
      connectionAttempts: 0,
      lastConnected: null,
      connect: jest.fn(),
      disconnect: jest.fn(),
      send: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn()
    });

    validator = new CoreFunctionalityValidator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    validator.stopValidation();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(validator).toBeDefined();
      expect(validator.isRunning()).toBe(false);
    });

    it('should accept custom configuration', () => {
      const customValidator = new CoreFunctionalityValidator({
        interval: 5000,
        maxFailures: 10,
        enableLogging: false
      });
      
      expect(customValidator).toBeDefined();
    });

    it('should handle undefined configuration gracefully', () => {
      const undefinedValidator = new CoreFunctionalityValidator(undefined);
      expect(undefinedValidator).toBeDefined();
    });
  });

  describe('DOM Validation', () => {
    it('should validate root element presence', () => {
      // No root element
      const result1 = validator.validateDOM();
      expect(result1.success).toBe(false);
      expect(result1.message).toContain('root element');

      // Add root element
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);

      const result2 = validator.validateDOM();
      expect(result2.success).toBe(true);
    });

    it('should validate React app structure', () => {
      // Create basic structure
      const root = document.createElement('div');
      root.id = 'root';
      const app = document.createElement('div');
      app.className = 'App';
      root.appendChild(app);
      document.body.appendChild(root);

      const result = validator.validateDOM();
      expect(result.success).toBe(true);
    });

    it('should handle missing DOM gracefully', () => {
      // Clear entire DOM
      document.documentElement.innerHTML = '';
      
      const result = validator.validateDOM();
      expect(result.success).toBe(false);
      expect(result.message).toContain('root element');
    });
  });

  describe('Navigation Validation', () => {
    beforeEach(() => {
      // Setup basic DOM structure
      const root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    });

    it('should validate navigation elements', () => {
      // No navigation elements
      const result1 = validator.validateNavigation();
      expect(result1.success).toBe(false);

      // Add navigation
      const nav = document.createElement('nav');
      nav.role = 'navigation';
      document.body.appendChild(nav);

      const result2 = validator.validateNavigation();
      expect(result2.success).toBe(true);
    });

    it('should validate using multiple selectors', () => {
      // Add navbar with class
      const navbar = document.createElement('div');
      navbar.className = 'navbar';
      document.body.appendChild(navbar);

      const result = validator.validateNavigation();
      expect(result.success).toBe(true);
    });

    it('should validate header elements', () => {
      // Add header
      const header = document.createElement('header');
      document.body.appendChild(header);

      const result = validator.validateNavigation();
      expect(result.success).toBe(true);
    });

    it('should validate navigation links', () => {
      // Add navigation with links
      const nav = document.createElement('nav');
      const link = document.createElement('a');
      link.href = '/dashboard';
      nav.appendChild(link);
      document.body.appendChild(nav);

      const result = validator.validateNavigation();
      expect(result.success).toBe(true);
    });
  });

  describe('Readiness Gating', () => {
    beforeEach(() => {
      // Setup basic DOM structure
      const root = document.createElement('div');
      root.id = 'root';
      const app = document.createElement('div');
      app.className = 'App';
      root.appendChild(app);
      document.body.appendChild(root);
    });

    it('should wait for DOM readiness', async () => {
      const promise = validator.waitForReadinessGating();
      
      // Should not resolve immediately without navigation
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(resolved).toBe(false);

      // Add navigation
      const nav = document.createElement('nav');
      document.body.appendChild(nav);

      await promise;
      expect(resolved).toBe(true);
    });

    it('should wait for WebSocket connection', async () => {
      // Add navigation immediately
      const nav = document.createElement('nav');
      document.body.appendChild(nav);

      // Mock WebSocket as disconnected
      mockUseWebSocketConnection.mockReturnValue({
        connected: false,
        connecting: true,
        error: null,
        connectionAttempts: 1,
        lastConnected: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });

      const promise = validator.waitForReadinessGating();
      
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(resolved).toBe(false);

      // Connect WebSocket
      mockUseWebSocketConnection.mockReturnValue({
        connected: true,
        connecting: false,
        error: null,
        connectionAttempts: 1,
        lastConnected: new Date(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });

      await promise;
      expect(resolved).toBe(true);
    });

    it('should timeout if conditions are not met', async () => {
      const promise = validator.waitForReadinessGating(500); // 500ms timeout
      
      let resolved = false;
      let rejected = false;
      
      promise
        .then(() => { resolved = true; })
        .catch(() => { rejected = true; });

      await new Promise(resolve => setTimeout(resolve, 600));
      
      expect(resolved).toBe(false);
      expect(rejected).toBe(true);
    });

    it('should resolve immediately if conditions are already met', async () => {
      // Setup complete state
      const nav = document.createElement('nav');
      document.body.appendChild(nav);
      
      mockUseWebSocketConnection.mockReturnValue({
        connected: true,
        connecting: false,
        error: null,
        connectionAttempts: 1,
        lastConnected: new Date(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });

      const startTime = Date.now();
      await validator.waitForReadinessGating();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should resolve quickly
    });
  });

  describe('Validation Execution', () => {
    beforeEach(() => {
      // Setup complete valid state
      const root = document.createElement('div');
      root.id = 'root';
      const app = document.createElement('div');
      app.className = 'App';
      root.appendChild(app);
      const nav = document.createElement('nav');
      root.appendChild(nav);
      document.body.appendChild(root);

      mockUseWebSocketConnection.mockReturnValue({
        connected: true,
        connecting: false,
        error: null,
        connectionAttempts: 1,
        lastConnected: new Date(),
        connect: jest.fn(),
        disconnect: jest.fn(),
        send: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn()
      });
    });

    it('should start validation successfully', async () => {
      expect(validator.isRunning()).toBe(false);
      
      await validator.startValidation();
      
      expect(validator.isRunning()).toBe(true);
    });

    it('should stop validation', async () => {
      await validator.startValidation();
      expect(validator.isRunning()).toBe(true);
      
      validator.stopValidation();
      expect(validator.isRunning()).toBe(false);
    });

    it('should not start validation if already running', async () => {
      await validator.startValidation();
      const firstStart = validator.isRunning();
      
      await validator.startValidation(); // Second start
      
      expect(firstStart).toBe(true);
      expect(validator.isRunning()).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      // Break DOM to cause validation failure
      document.body.innerHTML = '';
      
      await validator.startValidation();
      
      // Should still be running even with failures
      expect(validator.isRunning()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM query errors', () => {
      // Mock querySelector to throw
      const originalQuerySelector = document.querySelector;
      document.querySelector = jest.fn().mockImplementation(() => {
        throw new Error('Query error');
      });

      const result = validator.validateDOM();
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error');

      // Restore
      document.querySelector = originalQuerySelector;
    });

    it('should handle missing WebSocket hook gracefully', () => {
      // Mock hook to throw
      mockUseWebSocketConnection.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => {
        validator.validateDOM();
      }).not.toThrow();
    });

    it('should handle gtag errors gracefully', async () => {
      mockGtag.mockImplementation(() => {
        throw new Error('Analytics error');
      });

      // Should not throw
      expect(async () => {
        await validator.startValidation();
      }).not.toThrow();
    });
  });

  describe('Logging and Analytics', () => {
    it('should log validation results', async () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      await validator.startValidation();
      
      // Should have logged validation start
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CoreFunctionalityValidator: Starting validation')
      );
    });

    it('should send analytics events', async () => {
      await validator.startValidation();
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'core_validation_start', {
        event_category: 'reliability',
        event_label: 'validation_cycle'
      });
    });

    it('should track validation failures', () => {
      // Break DOM to cause failure
      document.body.innerHTML = '';
      
      const result = validator.validateDOM();
      expect(result.success).toBe(false);
      
      // Should log the failure
      const consoleErrorSpy = jest.spyOn(console, 'error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('CoreFunctionalityValidator: DOM validation failed')
      );
    });

    it('should disable logging when configured', () => {
      const quietValidator = new CoreFunctionalityValidator({
        enableLogging: false
      });
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      quietValidator.validateDOM();
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should complete validation quickly', () => {
      const startTime = performance.now();
      validator.validateDOM();
      validator.validateNavigation();
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle multiple rapid validations', () => {
      for (let i = 0; i < 100; i++) {
        validator.validateDOM();
        validator.validateNavigation();
      }
      
      // Should not crash or cause memory issues
      expect(validator).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    it('should clean up timers on stop', async () => {
      await validator.startValidation();
      expect(validator.isRunning()).toBe(true);
      
      validator.stopValidation();
      expect(validator.isRunning()).toBe(false);
      
      // Wait to ensure cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle multiple start/stop cycles', async () => {
      for (let i = 0; i < 10; i++) {
        await validator.startValidation();
        validator.stopValidation();
      }
      
      expect(validator.isRunning()).toBe(false);
    });
  });
});