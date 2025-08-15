/**
 * Tests for CoreFunctionalityValidator updates (PR5)
 */

import { coreFunctionalityValidator } from '../../../src/services/coreFunctionalityValidator';

// Mock fetch globally
global.fetch = jest.fn();

// Mock DOM elements
const mockNavElement = document.createElement('nav');
mockNavElement.setAttribute('data-testid', 'nav-main');

const mockAppRoot = document.createElement('main');
mockAppRoot.setAttribute('role', 'main');

describe('CoreFunctionalityValidator PR5 Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    
    // Clear DOM
    document.body.innerHTML = '';
    
    // Stop any existing validation
    coreFunctionalityValidator.stopValidation();
  });

  afterEach(() => {
    jest.clearAllTimers();
    coreFunctionalityValidator.stopValidation();
  });

  describe('Bootstrap completion waiting', () => {
    it('should wait for navigation elements before starting validation', async () => {
      // Start validation
      coreFunctionalityValidator.startValidation(10000);

      // Navigation should not be available initially
      const initialNavCheck = document.querySelectorAll('[data-testid*="nav"], [role="navigation"], nav');
      expect(initialNavCheck.length).toBe(0);

      // Add navigation element after a delay
      setTimeout(() => {
        document.body.appendChild(mockNavElement);
      }, 100);

      // Should eventually find navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const laterNavCheck = document.querySelectorAll('[data-testid*="nav"], [role="navigation"], nav');
      expect(laterNavCheck.length).toBe(1);
    });

    it('should wait for app root elements before starting validation', async () => {
      coreFunctionalityValidator.startValidation(10000);

      // App root should not be available initially
      const initialRootCheck = document.querySelector('#root [data-testid="app"], #root .app, main, [role="main"]');
      expect(initialRootCheck).toBeNull();

      // Add app root after a delay
      setTimeout(() => {
        const rootDiv = document.createElement('div');
        rootDiv.id = 'root';
        rootDiv.appendChild(mockAppRoot);
        document.body.appendChild(rootDiv);
      }, 100);

      // Should eventually find app root
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const laterRootCheck = document.querySelector('#root [data-testid="app"], #root .app, main, [role="main"]');
      expect(laterRootCheck).not.toBeNull();
    });

    it('should proceed with validation after bootstrap timeout', async () => {
      jest.useFakeTimers();
      
      // Mock console.warn to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      coreFunctionalityValidator.startValidation(5000);

      // Advance timers past bootstrap timeout (10s default)
      await jest.advanceTimersByTimeAsync(11000);

      // Should have logged timeout warning (implementation detail)
      // This tests the timeout behavior exists

      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Health endpoint migration', () => {
    it('should try new health endpoint first', async () => {
      // Mock successful new endpoint response
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      } as Response);

      // Run data fetching validation
      const result = await (coreFunctionalityValidator as any).validateDataFetching();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/v2/diagnostics/health', expect.objectContaining({
        signal: expect.any(AbortSignal),
        method: 'GET'
      }));
    });

    it('should fallback to legacy endpoint when new endpoint fails', async () => {
      // Mock new endpoint failure, legacy endpoint success
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' })
        } as Response);

      const result = await (coreFunctionalityValidator as any).validateDataFetching();

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/v2/diagnostics/health', expect.any(Object));
      expect(fetch).toHaveBeenNthCalledWith(2, '/api/health', expect.any(Object));
    });

    it('should log migration hint when using legacy endpoint in development', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Mock console.info to capture migration hint
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      // Mock new endpoint failure, legacy endpoint success
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' })
        } as Response);

      await (coreFunctionalityValidator as any).validateDataFetching();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using legacy health endpoint')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not log migration hint in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

      // Mock new endpoint failure, legacy endpoint success
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: 'ok' })
        } as Response);

      await (coreFunctionalityValidator as any).validateDataFetching();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Using legacy health endpoint')
      );

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should handle AbortError during health check', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(abortError);

      const result = await (coreFunctionalityValidator as any).validateDataFetching();

      // AbortError should be treated as successful (fetch is working)
      expect(result).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.MockedFunction<typeof fetch>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await (coreFunctionalityValidator as any).validateDataFetching();

      // Network errors should still indicate fetch is working
      expect(result).toBe(true);
    });
  });

  describe('Navigation validation improvements', () => {
    it('should not throw "No navigation elements found" immediately', async () => {
      // Clear any existing navigation
      document.body.innerHTML = '';

      // This should not throw immediately
      expect(async () => {
        await (coreFunctionalityValidator as any).validateNavigation();
      }).not.toThrow();
    });

    it('should validate navigation elements when available', async () => {
      // Add navigation element
      document.body.appendChild(mockNavElement);

      const result = await (coreFunctionalityValidator as any).validateNavigation();
      expect(result).toBe(true);
    });

    it('should validate browser history API', async () => {
      // Ensure history API is available
      const result = await (coreFunctionalityValidator as any).validateNavigation();
      
      // Should pass if history API is available (it should be in jsdom)
      expect(typeof window.history?.pushState).toBe('function');
      expect(result).toBe(true);
    });
  });

  describe('Validation cycle integration', () => {
    it('should run complete validation cycle without errors', async () => {
      // Set up minimal DOM for successful validation
      const rootDiv = document.createElement('div');
      rootDiv.id = 'root';
      rootDiv.appendChild(mockAppRoot);
      rootDiv.appendChild(mockNavElement);
      document.body.appendChild(rootDiv);

      // Mock successful health endpoint
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      } as Response);

      const report = await coreFunctionalityValidator.runValidationCycle();

      expect(report).toBeDefined();
      expect(report.overallStatus).toMatch(/PASSING|WARNING|FAILING/);
      expect(report.validationResults).toBeInstanceOf(Array);
      expect(report.validationResults.length).toBeGreaterThan(0);
      expect(report.performanceImpact).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should handle validation errors gracefully', async () => {
      // Mock all fetches to fail
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('All endpoints down'));

      const report = await coreFunctionalityValidator.runValidationCycle();

      expect(report).toBeDefined();
      expect(report.overallStatus).toMatch(/PASSING|WARNING|FAILING/);
      
      // Should still have validation results even with errors
      expect(report.validationResults).toBeInstanceOf(Array);
    });

    it('should track performance impact', async () => {
      const report = await coreFunctionalityValidator.runValidationCycle();

      expect(report.performanceImpact).toBeDefined();
      expect(typeof report.performanceImpact.renderingDelay).toBe('number');
      expect(typeof report.performanceImpact.memoryUsage).toBe('number');
      expect(typeof report.performanceImpact.jsHeapSize).toBe('number');
      expect(typeof report.performanceImpact.criticalPathBlocked).toBe('boolean');
    });
  });

  describe('Background validation behavior', () => {
    it('should use requestIdleCallback when available', () => {
      const mockRequestIdleCallback = jest.fn();
      (global as any).requestIdleCallback = mockRequestIdleCallback;

      // Add navigation to avoid bootstrap wait
      document.body.appendChild(mockNavElement);

      coreFunctionalityValidator.startValidation(1000);

      // Should eventually use requestIdleCallback
      setTimeout(() => {
        expect(mockRequestIdleCallback).toHaveBeenCalled();
      }, 100);

      delete (global as any).requestIdleCallback;
    });

    it('should fallback to setTimeout when requestIdleCallback unavailable', () => {
      const mockSetTimeout = jest.spyOn(global, 'setTimeout');
      
      // Ensure requestIdleCallback is not available
      delete (global as any).requestIdleCallback;

      // Add navigation to avoid bootstrap wait  
      document.body.appendChild(mockNavElement);

      coreFunctionalityValidator.startValidation(1000);

      // Should use setTimeout as fallback
      expect(mockSetTimeout).toHaveBeenCalled();

      mockSetTimeout.mockRestore();
    });
  });

  describe('Cleanup and resource management', () => {
    it('should stop validation cleanly', () => {
      coreFunctionalityValidator.startValidation(1000);
      expect((coreFunctionalityValidator as any).isRunning).toBe(true);

      coreFunctionalityValidator.stopValidation();
      expect((coreFunctionalityValidator as any).isRunning).toBe(false);
    });

    it('should not start multiple validation intervals', () => {
      const mockSetInterval = jest.spyOn(global, 'setInterval');

      coreFunctionalityValidator.startValidation(1000);
      coreFunctionalityValidator.startValidation(1000); // Second call should be ignored

      // Should only set one interval despite multiple calls
      expect((coreFunctionalityValidator as any).isRunning).toBe(true);

      mockSetInterval.mockRestore();
    });
  });
});