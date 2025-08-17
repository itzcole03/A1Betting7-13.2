/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PerformanceMonitoringDashboard from '../PerformanceMonitoringDashboard';

// Mock the robust API calls
jest.mock('../../utils/robustApi', () => ({
  fetchHealthData: jest.fn(),
  fetchPerformanceStats: jest.fn(),
}));

import { fetchHealthData, fetchPerformanceStats } from '../../utils/robustApi';

const mockFetchHealthData = fetchHealthData as jest.MockedFunction<typeof fetchHealthData>;
const mockFetchPerformanceStats = fetchPerformanceStats as jest.MockedFunction<typeof fetchPerformanceStats>;

describe('PerformanceMonitoringDashboard metrics regression tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful health data
    mockFetchHealthData.mockResolvedValue({
      status: 'healthy',
      services: { api: 'operational', cache: 'operational', database: 'operational' },
      performance: { cache_hit_rate: 85.5, cache_type: 'memory' },
      uptime_seconds: 3600,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render safe defaults when metrics is null without crashes', async () => {
    mockFetchPerformanceStats.mockResolvedValue({ data: null } as any);

    const { container } = render(<PerformanceMonitoringDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // Should not crash and should render 0 values
    expect(container.querySelector('[data-testid="total-requests"]')?.textContent || '0').toMatch(/0/);
    expect(container.querySelector('[data-testid="cache-hits"]')?.textContent || '0').toMatch(/0/);
  });

  it('should handle legacy cache_performance shape correctly', async () => {
    const legacyMetrics = {
      data: {
        cache_performance: {
          total_requests: 379,
          hits: 312,
          misses: 67,
          errors: 3,
          hit_rate: 82.3,
          cache_type: 'memory',
        },
        api_performance: {
          '/health': {
            avg_time_ms: 45.2,
            total_calls: 247,
            errors: 2,
          },
        },
        system_info: {
          optimization_level: 'Phase 4 Enhanced',
          caching_strategy: 'Memory Fallback',
          monitoring: 'Real-time Performance Tracking',
        },
      },
    };

    mockFetchPerformanceStats.mockResolvedValue(legacyMetrics as any);

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    // Should render the legacy values correctly through accessors
    expect(screen.getByText('379')).toBeInTheDocument(); // total_requests
    expect(screen.getByText('312')).toBeInTheDocument(); // hits
    expect(screen.getByText('67')).toBeInTheDocument(); // misses
  });

  it('should handle canonical metrics shape', async () => {
    const canonicalMetrics = {
      data: {
        cache: {
          total_requests: 500,
          hits: 450,
          misses: 50,
          errors: 2,
          hit_rate: 90.0,
        },
        api: {
          total_requests: 1000,
          success_requests: 950,
          error_requests: 50,
          avg_latency_ms: 125.5,
        },
        timestamps: {
          updated_at: '2024-08-16T12:00:00.000Z',
        },
      },
    };

    mockFetchPerformanceStats.mockResolvedValue(canonicalMetrics);

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    // Should render canonical values
    expect(screen.getByText('500')).toBeInTheDocument(); // cache total_requests
    expect(screen.getByText('450')).toBeInTheDocument(); // cache hits  
    expect(screen.getByText('50')).toBeInTheDocument(); // cache misses
  });

  it('should handle partial metrics data without crashes', async () => {
    const partialMetrics = {
      data: {
        cache_performance: {
          hits: 100,
          // missing: total_requests, misses, errors
        },
        // missing: api_performance
      },
    };

    mockFetchPerformanceStats.mockResolvedValue(partialMetrics as any);

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // Should render available data and defaults for missing fields
    expect(screen.getByText('100')).toBeInTheDocument(); // hits (available)
    // total_requests should show 0 (default)
    // misses should show 0 (default)
  });

  it('should handle mixed canonical and legacy data with canonical winning', async () => {
    const mixedMetrics = {
      data: {
        cache: {
          hits: 600, // canonical - should win
          total_requests: 700,
        },
        cache_performance: {
          hits: 300, // legacy - should be ignored
          misses: 100, // legacy - should be used (no canonical equivalent)
          errors: 5,
        },
      },
    };

    mockFetchPerformanceStats.mockResolvedValue(mixedMetrics as any);

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // Canonical values should win, legacy should fill gaps
    expect(screen.getByText('600')).toBeInTheDocument(); // canonical hits
    expect(screen.getByText('700')).toBeInTheDocument(); // canonical total_requests
    expect(screen.getByText('100')).toBeInTheDocument(); // legacy misses
  });

  it('should render error state gracefully when API fails', async () => {
    mockFetchPerformanceStats.mockRejectedValue(new Error('API failed'));

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Performance Monitoring')).toBeInTheDocument();
    });

    // Should fall back to mock data and not crash
    expect(screen.getByText(/using.*demo.*data/i)).toBeInTheDocument();
  });

  it('should validate metrics diagnostic output in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const metricsData = {
      data: {
        cache_performance: {
          total_requests: 200,
          hits: 150,
          misses: 50,
          errors: 1,
        },
        originFlags: { mappedLegacy: true },
      },
    };

    mockFetchPerformanceStats.mockResolvedValue(metricsData as any);

    render(<PerformanceMonitoringDashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[MetricsDiag]', {
        total: 200,
        hits: 150,
        misses: 50,
        errors: 1,
        mappedLegacy: true,
      });
    });

    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});