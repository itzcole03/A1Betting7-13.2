/**
 * Component tests for PerformanceMonitoringDashboard
 * Focus: Safe cache_hit_rate rendering without runtime errors
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceMonitoringDashboard from '../PerformanceMonitoringDashboard';

// Mock the robustApi functions
const mockFetchHealthData = jest.fn();
jest.mock('../../../utils/robustApi', () => ({
  fetchHealthData: mockFetchHealthData,
  fetchPerformanceStats: jest.fn(),
}));

describe('PerformanceMonitoringDashboard - Cache Hit Rate Safety', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for development diagnostics
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Safe cache_hit_rate rendering', () => {
    it('should render 0% when cache_hit_rate is undefined', async () => {
      // Mock API response with missing cache_hit_rate
      mockFetchHealthData.mockResolvedValue({
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

      await waitFor(() => {
        const cacheHitRate = screen.getByText(/Cache Hit Rate/);
        expect(cacheHitRate).toBeInTheDocument();
        
        // Should display 0% instead of crashing
        const percentage = screen.getByText('0%');
        expect(percentage).toBeInTheDocument();
      });
    });

    it('should render 0% when performance object is null', async () => {
      mockFetchHealthData.mockResolvedValue({
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
        const percentage = screen.getByText('0%');
        expect(percentage).toBeInTheDocument();
      });
    });

    it('should render 0% when entire health data is malformed', async () => {
      mockFetchHealthData.mockResolvedValue(null as any);

      render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        // Should still render something instead of crashing
        const percentage = screen.getByText('0%');
        expect(percentage).toBeInTheDocument();
      });
    });

    it('should format valid cache_hit_rate correctly', async () => {
      mockFetchHealthData.mockResolvedValue({
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
        const percentage = screen.getByText('87.7%');
        expect(percentage).toBeInTheDocument();
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

      mockFetchHealthData.mockResolvedValue(problematicApiResponse as any);

      // This should not throw any errors
      const { container } = render(<PerformanceMonitoringDashboard />);

      await waitFor(() => {
        expect(container).toBeInTheDocument();
        const percentage = screen.getByText('0%');
        expect(percentage).toBeInTheDocument();
      });
    });

    it('should work with hit_rate field mapping', async () => {
      mockFetchHealthData.mockResolvedValue({
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
        const percentage = screen.getByText('92.3%');
        expect(percentage).toBeInTheDocument();
      });
    });
  });
});