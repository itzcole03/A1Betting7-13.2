/**
 * Navigation Validator Tests
 * Tests for the refactored navigation validation system
 */

import { CoreFunctionalityValidator } from '../services/coreFunctionalityValidator';
import * as navReadySignal from '../navigation/navReadySignal';

// Mock DOM methods
const mockQuerySelectorAll = jest.fn();
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();

describe('NavigationValidator', () => {
  let validator: CoreFunctionalityValidator;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock DOM
    Object.defineProperty(document, 'querySelectorAll', {
      value: mockQuerySelectorAll,
      writable: true
    });

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(mockConsoleLog);
    jest.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);

    // Mock environment using process.env
    process.env.VITE_VALIDATOR_NAV_MAX_ATTEMPTS = '12';
    process.env.VITE_VALIDATOR_NAV_INTERVAL_MS = '250';
    process.env.NODE_ENV = 'development';

    // Mock navReadySignal functions
    jest.spyOn(navReadySignal, 'isNavReady').mockReturnValue(false);
    jest.spyOn(navReadySignal, 'onNavReady').mockImplementation(() => {
      return () => {}; // Return unsubscribe function
    });

    validator = new CoreFunctionalityValidator();
  });

  afterEach(() => {
    validator.stopValidation();
    jest.restoreAllMocks();
  });

  describe('Success Scenarios', () => {
    it('should validate navigation when navReady signal is already true', async () => {
      // Setup: Navigation is already ready
      jest.mocked(navReadySignal.isNavReady).mockReturnValue(true);

      // Act
      const result = await (validator as any).validateNavigation();

      // Assert
      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('[NavDiag] Navigation already ready');
    });

    it('should validate navigation when nav elements are found', async () => {
      // Setup: Mock finding navigation elements
      const mockNavElements = [
        { tagName: 'NAV', getAttribute: jest.fn().mockReturnValue('primary-nav') }
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

  describe('Degraded Timeout Scenarios', () => {
    it('should timeout after max attempts reached', async () => {
      // Setup: No navigation elements and max attempts
      mockQuerySelectorAll.mockReturnValue([]);
      const maxAttempts = 12; // Default value

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

      // Assert: Should log diagnostic only on first attempt
      expect(mockConsoleLog).toHaveBeenCalledWith('[NavDiag] Starting navigation validation...');
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
  });
});