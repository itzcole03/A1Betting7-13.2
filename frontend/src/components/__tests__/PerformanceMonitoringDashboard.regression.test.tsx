/**
 * Regression tests for hit_rate runtime error fixes
 * Ensures components handle various hit_rate data structures safely
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import PerformanceMonitoringDashboard from '../phase4/PerformanceMonitoringDashboard';
import { fetchHealthData, fetchPerformanceStats } from '../../utils/robustApi';

// Mock the API calls
jest.mock('../../utils/robustApi');
const mockFetchHealthData = fetchHealthData as jest.MockedFunction<typeof fetchHealthData>;
const mockFetchPerformanceStats = fetchPerformanceStats as jest.MockedFunction<typeof fetchPerformanceStats>;

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => <div {...props} />,
    button: (props: any) => <button {...props} />
  }
}));

describe('PerformanceMonitoringDashboard - hit_rate regression tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle health data with performance.hit_rate only', async () => {
    const mockHealth = {
      status: 'healthy',
      services: { api: 'operational', cache: 'operational', database: 'operational' },
      performance: { hit_rate: 75.5, cache_type: 'memory' },
      uptime_seconds: 3600
    };

    const mockMetrics = {
      api_performance: {},
      cache_performance: {
        cache_type: 'memory',
        hits: 100,
        misses: 25,
        errors: 0,
        hit_rate: 80.0,
        total_requests: 125
      },
      system_info: {
        optimization_level: 'Test',
        caching_strategy: 'Test Mode',
        monitoring: 'Test'
      }
    };

    mockFetchHealthData.mockResolvedValue(mockHealth as any);
    mockFetchPerformanceStats.mockResolvedValue({ data: mockMetrics });

    render(<PerformanceMonitoringDashboard />);

    // Wait for data to load and check that percentages are displayed
    await screen.findByText('75.5%'); // Health cache hit rate
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Metrics cache hit rate
  });

  it('should handle health data with flat hit_rate structure', async () => {
    const mockHealth = {
      status: 'healthy',
      services: { api: 'operational', cache: 'operational', database: 'operational' },
      hit_rate: 66.0, // Flat structure
      uptime_seconds: 3600
    };

    const mockMetrics = {
      api_performance: {},
      cache_performance: {
        cache_type: 'memory',
        hits: 100,
        misses: 51,
        errors: 0,
        hit_rate: 66.0,
        total_requests: 151
      },
      system_info: {
        optimization_level: 'Test',
        caching_strategy: 'Test Mode',
        monitoring: 'Test'
      }
    };

    mockFetchHealthData.mockResolvedValue(mockHealth as any);
    mockFetchPerformanceStats.mockResolvedValue({ data: mockMetrics });

    render(<PerformanceMonitoringDashboard />);

    // Should not crash and should display the hit rates
    const hitRateElements = await screen.findAllByText('66.0%');
    expect(hitRateElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Cannot read properties of undefined')).not.toBeInTheDocument();
  });

  it('should handle empty health data gracefully', async () => {
    const mockHealth = {
      status: 'healthy',
      services: { api: 'operational', cache: 'operational', database: 'operational' },
      uptime_seconds: 3600
      // No performance or hit_rate data
    };

    const mockMetrics = {
      api_performance: {},
      cache_performance: {
        cache_type: 'memory',
        hits: 0,
        misses: 1,
        errors: 0,
        total_requests: 1
        // No hit_rate field
      },
      system_info: {
        optimization_level: 'Test',
        caching_strategy: 'Test Mode',
        monitoring: 'Test'
      }
    };

    mockFetchHealthData.mockResolvedValue(mockHealth as any);
    mockFetchPerformanceStats.mockResolvedValue({ data: mockMetrics });

    render(<PerformanceMonitoringDashboard />);

    // Should display 0.0% instead of crashing
    const zeroRateElements = await screen.findAllByText('0.0%');
    expect(zeroRateElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Cannot read properties of undefined')).not.toBeInTheDocument();
  });

  it('should handle infrastructure cache structure (Phase 3)', async () => {
    const mockHealth = {
      status: 'healthy',
      services: { api: 'operational', cache: 'operational', database: 'operational' },
      infrastructure: {
        cache: { hit_rate_percent: 89.2 }
      },
      uptime_seconds: 3600
    };

    const mockMetrics = {
      api_performance: {},
      cache_performance: {
        cache_type: 'memory',
        hits: 892,
        misses: 108,
        errors: 0,
        hit_rate: 89.2,
        total_requests: 1000
      },
      system_info: {
        optimization_level: 'Phase 3',
        caching_strategy: 'Infrastructure Mode',
        monitoring: 'Phase 3'
      }
    };

    mockFetchHealthData.mockResolvedValue(mockHealth as any);
    mockFetchPerformanceStats.mockResolvedValue({ data: mockMetrics });

    render(<PerformanceMonitoringDashboard />);

    // Should correctly map infrastructure.cache.hit_rate_percent
    const infraRateElements = await screen.findAllByText('89.2%');
    expect(infraRateElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Cannot read properties of undefined')).not.toBeInTheDocument();
  });
});