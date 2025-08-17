/**
 * Tests for ReliabilityPanel Component
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReliabilityPanel from '../ReliabilityPanel';
import useReliabilityStore from '../../../store/reliabilityStore';
import useHealthStore from '../../../store/healthStore';

// Mock the stores
jest.mock('../../../store/reliabilityStore');
jest.mock('../../../store/healthStore');

const mockUseReliabilityStore = jest.mocked(useReliabilityStore);
const mockUseHealthStore = jest.mocked(useHealthStore);

// Mock the store state
const mockReliabilityState = {
  report: {
    overall_status: 'ok' as const,
    timestamp: '2024-01-01T12:00:00Z',
    prediction_accuracy: 85.2,
    system_stability: 92.1,
    data_quality_score: 88.5,
    anomalies: [
      {
        code: 'HIGH_CPU_USAGE',
        severity: 'warning' as const,
        message: 'CPU usage is above 80%',
        category: 'performance',
      },
      {
        code: 'PREDICTION_ACCURACY_DROP', 
        severity: 'critical' as const,
        message: 'Prediction accuracy has dropped below 70%',
        category: 'model',
      },
    ],
  },
  loading: false,
  error: null,
  anomalies: [
    {
      code: 'HIGH_CPU_USAGE',
      severity: 'warning' as const,
      message: 'CPU usage is above 80%',
      category: 'performance',
    },
    {
      code: 'PREDICTION_ACCURACY_DROP',
      severity: 'critical' as const,
      message: 'Prediction accuracy has dropped below 70%',
      category: 'model',
    },
  ],
  lastFetched: Date.now() - 60000, // 1 minute ago
  fetchReport: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

const mockHealthState = {
  health: null,
  loading: false,
  error: null,
  lastFetched: null,
  fetchHealth: jest.fn(),
  clearError: jest.fn(),
  reset: jest.fn(),
};

// Mock store getState for selectors
const mockReliabilitySelectors = {
  isReliable: jest.fn(() => true),
  isDegraded: jest.fn(() => false),
  isDown: jest.fn(() => false),
  criticalAnomalies: jest.fn(() => [mockReliabilityState.anomalies[1]]),
  warningAnomalies: jest.fn(() => [mockReliabilityState.anomalies[0]]),
  predictionAccuracy: jest.fn(() => 85.2),
  systemStability: jest.fn(() => 92.1),
  dataQualityScore: jest.fn(() => 88.5),
};

const mockHealthSelectors = {
  cpuPercent: jest.fn(() => 45.2),
  p95Latency: jest.fn(() => 120),
  cacheHitRate: jest.fn(() => 85.5),
  activeEdges: jest.fn(() => 3),
};

// Mock the store's getState methods
mockUseReliabilityStore.getState = jest.fn(() => mockReliabilityState as any);
mockUseHealthStore.getState = jest.fn(() => mockHealthState as any);

describe('ReliabilityPanel', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseReliabilityStore.mockReturnValue(mockReliabilityState as any);
    mockUseHealthStore.mockReturnValue(mockHealthState as any);
    
    // Mock selectors
    Object.entries(mockReliabilitySelectors).forEach(([_key, fn]) => {
      (fn as jest.Mock).mockClear();
    });
    
    Object.entries(mockHealthSelectors).forEach(([_key, fn]) => {
      (fn as jest.Mock).mockClear();
    });
  });

  it('should render system reliability panel', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('System Reliability')).toBeInTheDocument();
    expect(screen.getByText('Real-time diagnostic monitoring')).toBeInTheDocument();
  });

  it('should display overall status as healthy', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Healthy')).toBeInTheDocument();
  });

  it('should display key metrics', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('P95 Latency')).toBeInTheDocument();
    expect(screen.getByText('Cache Hit Rate')).toBeInTheDocument();
    expect(screen.getByText('Active Edges')).toBeInTheDocument();
  });

  it('should display reliability metrics when report is available', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Prediction Accuracy')).toBeInTheDocument();
    expect(screen.getByText('System Stability')).toBeInTheDocument();
    expect(screen.getByText('Data Quality')).toBeInTheDocument();
  });

  it('should display anomalies section', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Active Anomalies')).toBeInTheDocument();
    expect(screen.getByText('1 Critical')).toBeInTheDocument();
    expect(screen.getByText('1 Warning')).toBeInTheDocument();
  });

  it('should display anomaly details', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('HIGH_CPU_USAGE')).toBeInTheDocument();
    expect(screen.getByText('CPU usage is above 80%')).toBeInTheDocument();
    expect(screen.getByText('PREDICTION_ACCURACY_DROP')).toBeInTheDocument();
    expect(screen.getByText('Prediction accuracy has dropped below 70%')).toBeInTheDocument();
  });

  it('should handle refetch button click', async () => {
    render(<ReliabilityPanel />);
    
    const refetchButton = screen.getByText('Refetch');
    fireEvent.click(refetchButton);
    
    await waitFor(() => {
      expect(mockReliabilityState.clearError).toHaveBeenCalled();
      expect(mockReliabilityState.fetchReport).toHaveBeenCalledWith({ 
        force: true, 
        includeTraces: false 
      });
    });
  });

  it('should display loading state', () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      loading: true,
    } as any);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Loading reliability data...')).toBeInTheDocument();
    
    // Should disable refetch button when loading
    const refetchButton = screen.getByText('Refetch');
    expect(refetchButton).toBeDisabled();
  });

  it('should display error state', () => {
    const errorMessage = 'RELIABILITY_FETCH_FAILED: Network error';
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      error: errorMessage,
    } as any);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Reliability Check Failed')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Retry Now')).toBeInTheDocument();
  });

  it('should handle retry from error state', async () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      error: 'Network error',
    } as any);
    
    render(<ReliabilityPanel />);
    
    const retryButton = screen.getByText('Retry Now');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockReliabilityState.fetchReport).toHaveBeenCalledWith({ 
        force: true, 
        includeTraces: false 
      });
    });
  });

  it('should display no anomalies state', () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      anomalies: [],
    } as any);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('No active anomalies detected')).toBeInTheDocument();
  });

  it('should display degraded status correctly', () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      report: {
        ...mockReliabilityState.report!,
        overall_status: 'degraded' as const,
      },
    } as any);
    
    // Update selector mocks for degraded state
    mockReliabilitySelectors.isReliable.mockReturnValue(false);
    mockReliabilitySelectors.isDegraded.mockReturnValue(true);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('should display down status correctly', () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      report: {
        ...mockReliabilityState.report!,
        overall_status: 'down' as const,
      },
    } as any);
    
    // Update selector mocks for down state
    mockReliabilitySelectors.isReliable.mockReturnValue(false);
    mockReliabilitySelectors.isDegraded.mockReturnValue(false);
    mockReliabilitySelectors.isDown.mockReturnValue(true);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('Down')).toBeInTheDocument();
  });

  it('should display last updated timestamp', () => {
    render(<ReliabilityPanel />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('should handle missing report gracefully', () => {
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      report: null,
    } as any);
    
    render(<ReliabilityPanel />);
    
    // Should not display reliability metrics section
    expect(screen.queryByText('Prediction Accuracy')).not.toBeInTheDocument();
  });

  it('should limit anomaly display to 5 items', () => {
    const manyAnomalies = Array.from({ length: 8 }, (_, i) => ({
      code: `ANOMALY_${i}`,
      severity: 'warning' as const,
      message: `Anomaly ${i}`,
    }));
    
    mockUseReliabilityStore.mockReturnValue({
      ...mockReliabilityState,
      anomalies: manyAnomalies,
    } as any);
    
    render(<ReliabilityPanel />);
    
    expect(screen.getByText('... and 3 more anomalies')).toBeInTheDocument();
  });
});