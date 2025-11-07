/**
 * Navigation Validator Tests
 * Tests for the refactored navigation validation system
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CoreFunctionalityValidator } from '../coreFunctionalityValidator';
import * as navReadySignal from '../navigation/navReadySignal';

// Mock environment variables
const mockEnv = {
  VITE_VALIDATOR_NAV_MAX_ATTEMPTS: '12',
  VITE_VALIDATOR_NAV_INTERVAL_MS: '250',
  NODE_ENV: 'development'
};

// Mock DOM methods
const mockQuerySelectorAll = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();

describe('NavigationValidator', () => {
  let validator: CoreFunctionalityValidator;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock DOM
    Object.defineProperty(document, 'querySelectorAll', {
      value: mockQuerySelectorAll,
      writable: true
    });

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);

    // Mock environment
    Object.defineProperty(import.meta, 'env', {
      value: mockEnv,
      writable: true
    });

    // Mock navReadySignal functions
    vi.spyOn(navReadySignal, 'isNavReady').mockReturnValue(false);
    vi.spyOn(navReadySignal, 'onNavReady').mockImplementation((_callback) => {
      return () => {}; // Return unsubscribe function
    });

    validator = new CoreFunctionalityValidator();
  });

  afterEach(() => {
    validator.stopValidation();
    vi.restoreAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should validate navigation when navReady signal is already true', async () => {
      // Setup: Navigation is already ready
      vi.mocked(navReadySignal.isNavReady).mockReturnValue(true);

      // Act
      const result = await (validator as any).validateNavigation();

      // Assert
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('[NavDiag] Navigation already ready');
    });

    it('should validate navigation when nav elements are found', async () => {
      // Setup: Mock finding navigation elements
      const mockNavElements = [
        { tagName: 'NAV', getAttribute: vi.fn().mockReturnValue('primary-nav') }
      ];
      mockQuerySelectorAll.mockReturnValue(mockNavElements);

      // Act
      const result = await (validator as any).validateNavigation();

      // Assert
      expect(result).toBe(true);
      expect(mockQuerySelectorAll).toHaveBeenCalledWith(
        '[data-testid="primary-nav"], [role="navigation"], nav'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '[NavDiag] Navigation validation successful - found elements:',
        1
      );
    });

    it('should use hardened selectors for navigation detection', async () => {
      // Setup
      mockQuerySelectorAll.mockReturnValue([document.createElement('nav')]);

      // Act
      await (validator as any).validateNavigation();

      // Assert
      expect(mockQuerySelectorAll).toHaveBeenCalledWith(
        '[data-testid="primary-nav"], [role="navigation"], nav'
      );
    });
  });

  describe('Delayed Navigation', () => {
    it('should handle delayed navigation component mounting', async () => {
      let navReadyCallback: (() => void) | undefined;

      // Setup: Mock navigation not ready initially, but will be ready later
      vi.mocked(navReadySignal.isNavReady).mockReturnValue(false);
      vi.mocked(navReadySignal.onNavReady).mockImplementation((callback) => {
        navReadyCallback = callback;
        return () => {}; // Return unsubscribe function
      });

      mockQuerySelectorAll.mockReturnValue([]); // No nav elements initially

      // Act: First validation call
      const firstResult = await (validator as any).validateNavigation();
      expect(firstResult).toBe(false);

      // Simulate navigation becoming ready
      if (navReadyCallback) {
        navReadyCallback();
      }

      // Mock finding navigation elements after signal
      mockQuerySelectorAll.mockReturnValue([document.createElement('nav')]);

      // Act: Second validation call
      const secondResult = await (validator as any).validateNavigation();

      // Assert
      expect(secondResult).toBe(true);
    });
  });

  describe('Degraded Timeout Scenarios', () => {
    it('should timeout after max attempts reached', async () => {
      // Setup: No navigation elements and max attempts
      mockQuerySelectorAll.mockReturnValue([]);
      const maxAttempts = parseInt(mockEnv.VITE_VALIDATOR_NAV_MAX_ATTEMPTS);

      // Act: Call validation multiple times to reach max attempts
      let result = false;
      for (let i = 0; i < maxAttempts + 1; i++) {
        result = await (validator as any).validateNavigation();
      }

      // Assert
      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[NavDiag] Navigation validation degraded - no nav elements found after',
        maxAttempts,
        'attempts'
      );
    });

    it('should increment attempts counter correctly', async () => {
      // Setup
      mockQuerySelectorAll.mockReturnValue([]);

      // Act: Make multiple validation calls
      await (validator as any).validateNavigation(); // Attempt 1
      await (validator as any).validateNavigation(); // Attempt 2
      await (validator as any).validateNavigation(); // Attempt 3

      // Assert: Should log diagnostic only on first attempt
      expect(mockConsoleLog).toHaveBeenCalledWith('[NavDiag] Starting navigation validation...');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1); // Only first attempt logs
    });

    it('should cleanup state on timeout', async () => {
      // Setup
      mockQuerySelectorAll.mockReturnValue([]);
      const maxAttempts = parseInt(mockEnv.VITE_VALIDATOR_NAV_MAX_ATTEMPTS);

      // Act: Reach max attempts
      for (let i = 0; i < maxAttempts + 1; i++) {
        await (validator as any).validateNavigation();
      }

      // Assert: State should be cleaned up
      expect((validator as any).navValidationState).toBe('idle');
      expect((validator as any).navValidationAttempts).toBe(0);
    });
  });

  describe('Configuration Overrides', () => {
    it('should use custom max attempts from environment', async () => {
      // Setup: Custom max attempts
      const customMaxAttempts = '5';
      Object.defineProperty(import.meta, 'env', {
        value: { ...mockEnv, VITE_VALIDATOR_NAV_MAX_ATTEMPTS: customMaxAttempts },
        writable: true
      });

      mockQuerySelectorAll.mockReturnValue([]);

      // Act: Call validation up to custom max + 1
      let result = false;
      for (let i = 0; i < parseInt(customMaxAttempts) + 1; i++) {
        result = await (validator as any).validateNavigation();
      }

      // Assert: Should timeout after custom max attempts
      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '[NavDiag] Navigation validation degraded - no nav elements found after',
        parseInt(customMaxAttempts),
        'attempts'
      );
    });

    it('should fall back to defaults for invalid environment values', async () => {
      // Setup: Invalid environment values
      Object.defineProperty(import.meta, 'env', {
        value: { 
          ...mockEnv, 
          VITE_VALIDATOR_NAV_MAX_ATTEMPTS: 'invalid',
          VITE_VALIDATOR_NAV_INTERVAL_MS: 'invalid'
        },
        writable: true
      });

      // Act: Create new validator with invalid config
      const configValidator = new CoreFunctionalityValidator();
      const config = (configValidator as any).getConfig();

      // Assert: Should use defaults (tested indirectly through timeout behavior)
      expect(config.navMaxAttempts).toBe(12); // Default value
      expect(config.navIntervalMs).toBe(250); // Default value

      configValidator.stopValidation();
    });
  });

  describe('Quiet Mode', () => {
    it('should suppress logs in production mode', async () => {
      // Setup: Production environment
      Object.defineProperty(import.meta, 'env', {
        value: { ...mockEnv, NODE_ENV: 'production' },
        writable: true
      });

      // Create new validator for production mode
      const prodValidator = new CoreFunctionalityValidator();
      mockQuerySelectorAll.mockReturnValue([document.createElement('nav')]);

      // Act
      await (prodValidator as any).validateNavigation();

      // Assert: No console logs in production
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockConsoleWarn).not.toHaveBeenCalled();

      prodValidator.stopValidation();
    });

    it('should only log diagnostic message once per validation cycle', async () => {
      // Setup
      mockQuerySelectorAll.mockReturnValue([]);

      // Act: Multiple validation calls
      await (validator as any).validateNavigation();
      await (validator as any).validateNavigation();
      await (validator as any).validateNavigation();

      // Assert: Only one diagnostic log for the start
      const diagnosticLogs = mockConsoleLog.mock.calls.filter(
        call => call[0] === '[NavDiag] Starting navigation validation...'
      );
      expect(diagnosticLogs).toHaveLength(1);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup navigation validation on stopValidation', () => {
      // Setup: Start validation to initialize resources
      validator.startValidation();

      // Act
      validator.stopValidation();

      // Assert: Should have cleaned up nav validation resources
      expect((validator as any).navValidationState).toBe('idle');
      expect((validator as any).navValidationAttempts).toBe(0);
    });

    it('should unsubscribe from navReady events on cleanup', () => {
      // Setup: Mock unsubscribe function
      const mockUnsubscribe = vi.fn();
      vi.mocked(navReadySignal.onNavReady).mockReturnValue(mockUnsubscribe);

      // Act: Start and immediately cleanup
      (validator as any).validateNavigation();
      (validator as any).cleanupNavValidation();

      // Assert: Should have called unsubscribe
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should clear timeout on cleanup', () => {
      // Setup: Mock setTimeout/clearTimeout
      const mockClearTimeout = vi.fn();
      vi.spyOn(global, 'clearTimeout').mockImplementation(mockClearTimeout);
      
      // Set up a timeout
      (validator as any).navValidationTimeout = setTimeout(() => {}, 1000);

      // Act
      (validator as any).cleanupNavValidation();

      // Assert
      expect(mockClearTimeout).toHaveBeenCalled();
      expect((validator as any).navValidationTimeout).toBe(null);
    });
  });

  describe('State Machine Behavior', () => {
    it('should track validation state correctly', async () => {
      // Setup
      mockQuerySelectorAll.mockReturnValue([]);

      // Initial state
      expect((validator as any).navValidationState).toBe('idle');

      // Act: First validation
      await (validator as any).validateNavigation();

      // Assert: Should be waiting for DOM
      expect((validator as any).navValidationState).toBe('idle'); // Still idle as no success

      // Simulate finding navigation
      mockQuerySelectorAll.mockReturnValue([document.createElement('nav')]);
      await (validator as any).validateNavigation();

      // Assert: Should be success
      expect((validator as any).navValidationState).toBe('idle'); // Cleaned up after success
    });
  });
});