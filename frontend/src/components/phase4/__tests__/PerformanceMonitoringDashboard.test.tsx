/**
 * Component tests for PerformanceMonitoringDashboard
 * Focus: Safe cache_hit_rate rendering without runtime errors
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as robustApi from '../../../utils/robustApi';
import PerformanceMonitoringDashboard from '../PerformanceMonitoringDashboard';

describe('PerformanceMonitoringDashboard - Cache Hit Rate Safety', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for development diagnostics
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Default: stub fetchPerformanceStats to resolve to undefined (component handles missing perf)
    jest.spyOn(robustApi, 'fetchPerformanceStats').mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Safe cache_hit_rate rendering', () => {
    it('should render 0% when cache_hit_rate is undefined', async () => {
  // Mock API response with missing cache_hit_rate
  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue({
        status: 'healthy',
        services: {
          api: 'healthy',
          cache: 'healthy', 
          database: 'healthy'
        },
        performance: {
          // cache_hit_rate is missing/undefined
          cache_type: 'redis'
        },
        uptime_seconds: 3600
  } as any);

      render(<PerformanceMonitoringDashboard />);

      // Ensure the component invoked the health API mock
      await waitFor(() => expect(robustApi.fetchHealthData).toHaveBeenCalled());

      await waitFor(() => {
        const cacheHitRate = screen.getByText(/Cache Hit Rate/);
        expect(cacheHitRate).toBeInTheDocument();

        // Should display 0% instead of crashing (allow multiple matching nodes)
        const percentages = screen.getAllByText('0%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });

    it('should render 0% when performance object is null', async () => {
  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue({
        status: 'healthy',
        services: {
          api: 'healthy',
          cache: 'healthy',
          database: 'healthy'
        },
        performance: null, // Null performance object
        uptime_seconds: 3600
  } as any);

      render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        const percentages = screen.getAllByText('0%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });

    it('should render 0% when entire health data is malformed', async () => {
  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue(null as any);

      render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        // Should still render something instead of crashing
        const percentages = screen.getAllByText('0%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });

    it('should format valid cache_hit_rate correctly', async () => {
  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue({
        status: 'healthy',
        services: {
          api: 'healthy',
          cache: 'healthy',
          database: 'healthy'
        },
        performance: {
          cache_hit_rate: 87.654,
          cache_type: 'redis'
        },
        uptime_seconds: 3600
  });

      render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        // Should format to 1 decimal place
        const percentages = screen.getAllByText('87.7%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Regression prevention', () => {
    it('should prevent "Cannot read properties of undefined" errors', async () => {
      // Test the exact error condition that was reported
      const problematicApiResponse = {
        status: 'healthy',
        services: {
          api: 'healthy',
          cache: 'degraded',
          database: 'healthy'
        },
        // performance object exists but cache_hit_rate is undefined
        performance: {
          cache_type: 'redis'
          // cache_hit_rate is missing
        },
        uptime_seconds: 3600
      };

  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue(problematicApiResponse as any);

      // This should not throw any errors
      const { container } = render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        expect(container).toBeInTheDocument();
        const percentages = screen.getAllByText('0%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });

    it('should work with hit_rate field mapping', async () => {
  jest.spyOn(robustApi, 'fetchHealthData').mockResolvedValue({
        status: 'healthy',
        services: {
          api: 'healthy',
          cache: 'healthy',
          database: 'healthy'
        },
        performance: {
          hit_rate: 92.3, // Old field name
          cache_type: 'redis'
        },
        uptime_seconds: 3600
  } as any);

      render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        // Should map hit_rate to cache_hit_rate
        const percentages = screen.getAllByText('92.3%');
        expect(percentages.length).toBeGreaterThan(0);
      });
    });
  });
});