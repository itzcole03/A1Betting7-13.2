import { 
  getNavigationTiming, 
  initWebVitals, 
  __resetPerformanceGuardsForTests,
  NavigationTimingMetrics,
  WebVitalMetricRecord 
} from '../performanceMetrics';

// Mock web-vitals module
jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onINP: jest.fn(), 
  onLCP: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

describe('Performance Metrics', () => {
  let mockPerformance: jest.Mocked<Performance>;

  beforeEach(() => {
    // Reset guards before each test
    __resetPerformanceGuardsForTests();

    // Create mock performance object
    mockPerformance = {
      getEntriesByType: jest.fn(),
      now: jest.fn(),
    } as any;

    // Replace global performance
    Object.defineProperty(window, 'performance', {
      value: mockPerformance,
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getNavigationTiming', () => {
    it('should return positive totalLoadTime from PerformanceNavigationTiming', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: 1234.5,
        domContentLoadedEventEnd: 800,
        type: 'navigate'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      const result = getNavigationTiming();

      expect(result).toEqual({
        startTime: 0,
        domContentLoaded: 800,
        firstPaint: undefined,
        firstContentfulPaint: undefined,
        totalLoadTime: 1234.5,
        type: 'navigate',
        timestamp: expect.any(Number),
        source: 'navigation-timing'
      });
      expect(result!.totalLoadTime).toBeGreaterThan(0);
    });

    it('should clamp negative duration to 0', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: -1000, // This should never happen, but let's test robustness
        domContentLoadedEventEnd: 500,
        type: 'navigate'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      const result = getNavigationTiming();

      expect(result!.totalLoadTime).toBe(0);
      expect(result!.source).toBe('navigation-timing');
    });

    it('should fallback to legacy timing when modern API unavailable', () => {
      // Mock no modern navigation entries
      mockPerformance.getEntriesByType.mockReturnValue([]);

      // Mock legacy timing
      const mockTiming = {
        navigationStart: 1000000,
        domContentLoadedEventEnd: 1001000,
        loadEventEnd: 1001500,
      };

      Object.defineProperty(mockPerformance, 'timing', {
        value: mockTiming,
        writable: true,
      });

      const result = getNavigationTiming();

      expect(result).toEqual({
        startTime: 0,
        domContentLoaded: 1000,
        firstPaint: undefined,
        firstContentfulPaint: undefined,
        totalLoadTime: 1500,
        type: 'navigate',
        timestamp: expect.any(Number),
        source: 'legacy-timing'
      });
    });

    it('should return null when no timing APIs available', () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);
      
      const result = getNavigationTiming();

      expect(result).toBeNull();
    });

    it('should handle exceptions gracefully', () => {
      mockPerformance.getEntriesByType.mockImplementation(() => {
        throw new Error('API error');
      });

      const result = getNavigationTiming();

      expect(result).toBeNull();
    });
  });

  describe('initWebVitals', () => {
    const { onCLS, onINP, onLCP, onFCP, onTTFB } = require('web-vitals');
    let mockOnMetric: jest.Mock;

    beforeEach(() => {
      mockOnMetric = jest.fn();
      onCLS.mockClear();
      onINP.mockClear();
      onLCP.mockClear();
      onFCP.mockClear();
      onTTFB.mockClear();
    });

    it('should initialize web vitals only once by default', () => {
      const result1 = initWebVitals({ onMetric: mockOnMetric });
      const result2 = initWebVitals({ onMetric: mockOnMetric });

      expect(result1).toBe(true);  // First initialization
      expect(result2).toBe(false); // Second call should be ignored

      // Should only register listeners once
      expect(onLCP).toHaveBeenCalledTimes(1);
      expect(onCLS).toHaveBeenCalledTimes(1);
    });

    it('should allow re-initialization when force=true', () => {
      initWebVitals({ onMetric: mockOnMetric });
      const result = initWebVitals({ onMetric: mockOnMetric, force: true });

      expect(result).toBe(true);
      expect(onLCP).toHaveBeenCalledTimes(2);
    });

    it('should prevent duplicate LCP emissions', () => {
      initWebVitals({ onMetric: mockOnMetric });

      // Simulate LCP callbacks
      const lcpCallback = onLCP.mock.calls[0][0];
      
      lcpCallback({ name: 'LCP', value: 1000, rating: 'good' });
      lcpCallback({ name: 'LCP', value: 1200, rating: 'needs-improvement' });

      // Should only call onMetric once for LCP
      const lcpCalls = mockOnMetric.mock.calls.filter(call => call[0].name === 'LCP');
      expect(lcpCalls).toHaveLength(1);
      expect(lcpCalls[0][0].value).toBe(1000);
    });

    it('should clamp negative metric values to 0', () => {
      initWebVitals({ onMetric: mockOnMetric });

      const clsCallback = onCLS.mock.calls[0][0];
      clsCallback({ name: 'CLS', value: -0.5 }); // Negative CLS shouldn't happen but test robustness

      expect(mockOnMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CLS',
          value: 0,
        })
      );
    });

    it('should include navigation metrics when requested', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: 1500,
        domContentLoadedEventEnd: 1000,
        type: 'navigate'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      initWebVitals({ 
        onMetric: mockOnMetric, 
        includeNavigationMetrics: true 
      });

      // Should emit navigation metrics
      expect(mockOnMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'navigation-total-load-time',
          value: 1500,
        })
      );

      expect(mockOnMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'navigation-dom-content-loaded',
          value: 1000,
        })
      );
    });

    it('should work without onMetric callback', () => {
      expect(() => {
        initWebVitals({});
      }).not.toThrow();
    });

    it('should add navigation type to web vital records', () => {
      const mockNavEntry = {
        type: 'reload'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      initWebVitals({ onMetric: mockOnMetric });

      // Trigger a metric callback
      const fcpCallback = onFCP.mock.calls[0][0];
      fcpCallback({ name: 'FCP', value: 800 });

      expect(mockOnMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          navigationType: 'reload',
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('Performance timing edge cases', () => {
    it('should handle undefined/null duration values', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: undefined,
        domContentLoadedEventEnd: 500,
        type: 'navigate'
      } as any;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      const result = getNavigationTiming();

      expect(result!.totalLoadTime).toBe(0);
    });

    it('should handle infinite duration values', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: Infinity,
        domContentLoadedEventEnd: 500,
        type: 'navigate'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      const result = getNavigationTiming();

      expect(result!.totalLoadTime).toBe(0);
    });

    it('should handle NaN duration values', () => {
      const mockNavEntry = {
        startTime: 0,
        duration: NaN,
        domContentLoadedEventEnd: 500,
        type: 'navigate'
      } as PerformanceNavigationTiming;

      mockPerformance.getEntriesByType.mockReturnValue([mockNavEntry]);

      const result = getNavigationTiming();

      expect(result!.totalLoadTime).toBe(0);
    });
  });
});
