import React from 'react';
import { render } from '@testing-library/react';
import { performanceMonitor, withPerformanceTracking } from '../performance';
import { logger } from '../logger';
import { initWebVitals } from '../../perf/performanceMetrics';

// Mock dependencies
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../perf/performanceMetrics', () => ({
  initWebVitals: jest.fn(),
  getNavigationTiming: jest.fn(() => ({
    totalLoadTime: 1500,
    domContentLoaded: 1000,
    type: 'navigate',
    source: 'navigation-timing',
    startTime: 0,
    timestamp: Date.now(),
  })),
}));

describe('Performance Monitor', () => {
  let mockPerformanceNow: jest.SpyInstance;
  
  beforeEach(() => {
    // Mock performance.now to return predictable values
    mockPerformanceNow = jest.spyOn(performance, 'now')
      .mockImplementation(() => 1000); // Default to 1000, override in specific tests

    // Clear metrics before each test
    performanceMonitor.clear();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Performance Tracking', () => {
    it('should track component load times correctly', () => {
      const componentName = 'TestComponent';

      mockPerformanceNow.mockReturnValueOnce(1000); // startLoading
      performanceMonitor.startLoading(componentName);
      
      mockPerformanceNow.mockReturnValueOnce(1250); // endLoading
      performanceMonitor.endLoading(componentName);

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        componentName,
        loadTime: 250, // 1250 - 1000
        timestamp: expect.any(Number),
        userAgent: expect.any(String),
      });
    });

    it('should not record metrics for components without start time', () => {
      performanceMonitor.endLoading('UnknownComponent');

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveLength(0);
    });

    it('should track render performance with trackRender', () => {
      const renderFn = jest.fn(() => 'result');
      
      const result = performanceMonitor.trackRender('TestComponent', renderFn);

      expect(result).toBe('result');
      expect(renderFn).toHaveBeenCalledTimes(1);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].componentName).toBe('TestComponent');
    });

    it('should limit metrics storage to 100 entries', () => {
      // Add 150 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.startLoading(`Component${i}`);
        performanceMonitor.endLoading(`Component${i}`);
      }

      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveLength(100);
      // Should keep the most recent metrics
      expect(metrics[0].componentName).toBe('Component50');
      expect(metrics[99].componentName).toBe('Component149');
    });
  });

  describe('Performance Summary', () => {
    beforeEach(() => {
      // Clear any existing mocks
      jest.clearAllMocks();
      performanceMonitor.clear();
      
      // Add some test metrics with controlled timing
      mockPerformanceNow.mockReturnValueOnce(1000); // FastComponent start
      performanceMonitor.startLoading('FastComponent');
      mockPerformanceNow.mockReturnValueOnce(1100); // FastComponent end (100ms)
      performanceMonitor.endLoading('FastComponent');

      mockPerformanceNow.mockReturnValueOnce(1000); // SlowComponent start  
      performanceMonitor.startLoading('SlowComponent');
      mockPerformanceNow.mockReturnValueOnce(1500); // SlowComponent end (500ms)
      performanceMonitor.endLoading('SlowComponent');
    });

    it('should calculate summary statistics correctly', () => {
      const summary = performanceMonitor.getSummary();

      expect(summary).toMatchObject({
        totalComponents: 2,
        averageLoadTime: 300, // (100 + 500) / 2
        slowestComponent: expect.objectContaining({
          componentName: 'SlowComponent',
          loadTime: 500,
        }),
        fastestComponent: expect.objectContaining({
          componentName: 'FastComponent',
          loadTime: 100,
        }),
      });
    });

    it('should handle empty metrics gracefully', () => {
      performanceMonitor.clear();
      
      const summary = performanceMonitor.getSummary();

      expect(summary).toMatchObject({
        totalComponents: 0,
        averageLoadTime: 0,
        slowestComponent: null,
        fastestComponent: null,
      });
    });
  });

  describe('Performance Warnings', () => {
    it('should log warning for slow components', () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      
      mockPerformanceNow.mockReturnValueOnce(1000); // startLoading
      performanceMonitor.startLoading('SlowComponent');
      
      mockPerformanceNow.mockReturnValueOnce(3500); // endLoading (2500ms load time)
      performanceMonitor.endLoading('SlowComponent');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow component load: SlowComponent took 2500.00ms'),
        expect.any(Object),
        'Performance'
      );
    });

    it('should not log warning for fast components', () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      
      mockPerformanceNow.mockReturnValueOnce(1000); // startLoading
      performanceMonitor.startLoading('FastComponent');
      
      mockPerformanceNow.mockReturnValueOnce(1500); // endLoading (500ms load time)
      performanceMonitor.endLoading('FastComponent');

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Web Vitals Integration', () => {
    it('should initialize web vitals with correct configuration', () => {
      const mockInitWebVitals = initWebVitals as jest.MockedFunction<typeof initWebVitals>;
      
      performanceMonitor.trackWebVitals();

      expect(mockInitWebVitals).toHaveBeenCalledWith({
        onMetric: expect.any(Function),
        includeNavigationMetrics: true,
      });
    });

    it('should log web vital metrics through logger', () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      const mockInitWebVitals = initWebVitals as jest.MockedFunction<typeof initWebVitals>;
      
      performanceMonitor.trackWebVitals();

      // Get the onMetric callback and simulate a metric
      const callArgs = mockInitWebVitals.mock.calls[0][0];
      const onMetricCallback = callArgs?.onMetric;
      expect(onMetricCallback).toBeDefined();
      
      onMetricCallback!({
        name: 'LCP',
        value: 1234.5,
        rating: 'good',
        timestamp: Date.now(),
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        '📊 LCP: 1234.50ms',
        { metric: 'LCP', value: 1234.5, rating: 'good' },
        'WebVitals'
      );
    });

    it('should handle CLS metrics without ms suffix', () => {
      const mockLogger = logger as jest.Mocked<typeof logger>;
      const mockInitWebVitals = initWebVitals as jest.MockedFunction<typeof initWebVitals>;
      
      performanceMonitor.trackWebVitals();

      const callArgs = mockInitWebVitals.mock.calls[0][0];
      const onMetricCallback = callArgs?.onMetric;
      expect(onMetricCallback).toBeDefined();
      
      onMetricCallback!({
        name: 'CLS',
        value: 0.05,
        rating: 'good',
        timestamp: Date.now(),
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        '📊 CLS: 0.05', // No 'ms' suffix for CLS
        { metric: 'CLS', value: 0.05, rating: 'good' },
        'WebVitals'
      );
    });
  });
});

describe('withPerformanceTracking HOC', () => {
  let mockPerformanceNow: jest.SpyInstance;

  beforeEach(() => {
    mockPerformanceNow = jest.spyOn(performance, 'now')
      .mockImplementation(() => 1000); // Default value
    
    performanceMonitor.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should wrap component with performance tracking', () => {
    const TestComponent = ({ text }: { text: string }) => React.createElement('div', {}, text);
    const WrappedComponent = withPerformanceTracking(TestComponent, 'CustomTestComponent');

    const { unmount } = render(React.createElement(WrappedComponent, { text: 'Hello' }));

    // Should start tracking on mount
    expect(performance.now).toHaveBeenCalled();

    // Simulate unmount with different time
    mockPerformanceNow.mockReturnValue(1250);
    unmount();

    // Should record performance metrics
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0].componentName).toBe('CustomTestComponent');
  });

  it('should use component name when custom name not provided', () => {
    const TestComponent = ({ text }: { text: string }) => React.createElement('div', {}, text);
    const WrappedComponent = withPerformanceTracking(TestComponent);

    const { unmount } = render(React.createElement(WrappedComponent, { text: 'Hello' }));
    mockPerformanceNow.mockReturnValue(1250);
    unmount();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics[0].componentName).toBe('TestComponent');
  });

  it('should handle anonymous components gracefully', () => {
    const AnonymousComponent = ({ text }: { text: string }) => React.createElement('div', {}, text);
    // Remove the name property to simulate anonymous component
    Object.defineProperty(AnonymousComponent, 'name', { value: '' });
    
    const WrappedComponent = withPerformanceTracking(AnonymousComponent);

    const { unmount } = render(React.createElement(WrappedComponent, { text: 'Hello' }));
    mockPerformanceNow.mockReturnValue(1250);
    unmount();

    const metrics = performanceMonitor.getMetrics();
    expect(metrics[0].componentName).toBe('UnknownComponent');
  });

  it('should set correct displayName for wrapped component', () => {
    const TestComponent = () => React.createElement('div', {}, 'Test');
    const WrappedComponent = withPerformanceTracking(TestComponent);

    expect(WrappedComponent.displayName).toBe('withPerformanceTracking(TestComponent)');
  });
});
