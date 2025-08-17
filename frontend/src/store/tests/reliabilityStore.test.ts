/**
 * Tests for Reliability Store
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import useReliabilityStore, { reliabilitySelectors, selectCriticalAnomalies, selectWarningAnomalies } from '../reliabilityStore';

// Mock the DiagnosticsService
const mockDiagnosticsService = {
  fetchReliability: jest.fn(),
};

jest.mock('../../services/diagnostics/DiagnosticsService', () => ({
  DiagnosticsService: {
    getInstance: jest.fn(() => mockDiagnosticsService),
  },
}));

// Mock valid reliability data
const mockReliabilityData = {
  overall_status: 'ok' as const,
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
    {
      code: 'CACHE_MISS_SPIKE',
      severity: 'info' as const,
      message: 'Cache miss rate increased',
      category: 'infrastructure',
    },
  ],
  timestamp: '2024-01-01T12:00:00Z',
  prediction_accuracy: 85.2,
  system_stability: 92.1,
  data_quality_score: 88.5,
  metric_trends: [
    {
      metric: 'response_time',
      current_value: 120,
      trend: 'improving' as const,
      change_percent: -5.2,
    },
    {
      metric: 'error_rate',
      current_value: 2.1,
      trend: 'degrading' as const,
      change_percent: 15.3,
    },
  ],
  __validated: true as const,
};

describe('useReliabilityStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useReliabilityStore.setState({
      report: null,
      loading: false,
      error: null,
      anomalies: [],
      lastFetched: null,
    });
    
    // Reset mock
    jest.clearAllMocks();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useReliabilityStore());
    
    expect(result.current.report).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.anomalies).toEqual([]);
    expect(result.current.lastFetched).toBeNull();
  });

  it('should handle successful reliability fetch', async () => {
    mockDiagnosticsService.fetchReliability.mockResolvedValue(mockReliabilityData);

    const { result } = renderHook(() => useReliabilityStore());

    await act(async () => {
      await result.current.fetchReport();
    });

    expect(result.current.report).toEqual(mockReliabilityData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.anomalies).toEqual(mockReliabilityData.anomalies);
    expect(result.current.lastFetched).toBeDefined();
    expect(mockDiagnosticsService.fetchReliability).toHaveBeenCalledWith({});
  });

  it('should handle reliability fetch with options', async () => {
    mockDiagnosticsService.fetchReliability.mockResolvedValue(mockReliabilityData);

    const { result } = renderHook(() => useReliabilityStore());

    await act(async () => {
      await result.current.fetchReport({ includeTraces: true, force: true });
    });

    expect(mockDiagnosticsService.fetchReliability).toHaveBeenCalledWith({
      includeTraces: true,
      force: true,
    });
  });

  it('should handle reliability fetch error', async () => {
    const mockError = new Error('Network error');
    mockDiagnosticsService.fetchReliability.mockRejectedValue(mockError);

    const { result } = renderHook(() => useReliabilityStore());

    await act(async () => {
      await result.current.fetchReport();
    });

    expect(result.current.report).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Network error');
    expect(result.current.lastFetched).toBeDefined();
  });

  it('should handle DiagnosticsError with code', async () => {
    const mockError = new Error('Reliability fetch failed') as any;
    mockError.code = 'RELIABILITY_FETCH_FAILED';
    mockDiagnosticsService.fetchReliability.mockRejectedValue(mockError);

    const { result } = renderHook(() => useReliabilityStore());

    await act(async () => {
      await result.current.fetchReport();
    });

    expect(result.current.error).toBe('RELIABILITY_FETCH_FAILED: Reliability fetch failed');
  });

  it('should skip fetch if already loading', async () => {
    const { result } = renderHook(() => useReliabilityStore());

    // Set loading state
    act(() => {
      useReliabilityStore.setState({ loading: true });
    });

    await act(async () => {
      await result.current.fetchReport();
    });

    expect(mockDiagnosticsService.fetchReliability).not.toHaveBeenCalled();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useReliabilityStore());

    // Set error state
    act(() => {
      useReliabilityStore.setState({ error: 'Test error' });
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset store', () => {
    const { result } = renderHook(() => useReliabilityStore());

    // Set some state
    act(() => {
      useReliabilityStore.setState({
        report: mockReliabilityData,
        loading: true,
        error: 'Test error',
        anomalies: mockReliabilityData.anomalies,
        lastFetched: Date.now(),
      });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.report).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.anomalies).toEqual([]);
    expect(result.current.lastFetched).toBeNull();
  });
});

describe('reliabilitySelectors', () => {
  const stateWithReport = { 
    report: mockReliabilityData, 
    anomalies: mockReliabilityData.anomalies,
    lastFetched: Date.now()
  } as any;

  it('should select reliability status correctly', () => {
    expect(reliabilitySelectors.isReliable(stateWithReport)).toBe(true);
    expect(reliabilitySelectors.isDegraded(stateWithReport)).toBe(false);
    expect(reliabilitySelectors.isDown(stateWithReport)).toBe(false);
  });

  it('should filter anomalies by severity', () => {
    const criticalAnomalies = reliabilitySelectors.criticalAnomalies(stateWithReport);
    const warningAnomalies = reliabilitySelectors.warningAnomalies(stateWithReport);
    const infoAnomalies = reliabilitySelectors.infoAnomalies(stateWithReport);

    expect(criticalAnomalies).toHaveLength(1);
    expect(criticalAnomalies[0].code).toBe('PREDICTION_ACCURACY_DROP');
    
    expect(warningAnomalies).toHaveLength(1);
    expect(warningAnomalies[0].code).toBe('HIGH_CPU_USAGE');
    
    expect(infoAnomalies).toHaveLength(1);
    expect(infoAnomalies[0].code).toBe('CACHE_MISS_SPIKE');
  });

  it('should count anomalies correctly', () => {
    expect(reliabilitySelectors.totalAnomalies(stateWithReport)).toBe(3);
    expect(reliabilitySelectors.criticalCount(stateWithReport)).toBe(1);
    expect(reliabilitySelectors.warningCount(stateWithReport)).toBe(1);
  });

  it('should select metrics correctly', () => {
    expect(reliabilitySelectors.predictionAccuracy(stateWithReport)).toBe(85.2);
    expect(reliabilitySelectors.systemStability(stateWithReport)).toBe(92.1);
    expect(reliabilitySelectors.dataQualityScore(stateWithReport)).toBe(88.5);
  });

  it('should filter trends correctly', () => {
    const improvingTrends = reliabilitySelectors.improvingTrends(stateWithReport);
    const degradingTrends = reliabilitySelectors.degradingTrends(stateWithReport);

    expect(improvingTrends).toHaveLength(1);
    expect(improvingTrends[0].metric).toBe('response_time');
    
    expect(degradingTrends).toHaveLength(1);
    expect(degradingTrends[0].metric).toBe('error_rate');
  });

  it('should handle missing report data', () => {
    const emptyState = { report: null, anomalies: [], lastFetched: null } as any;

    expect(reliabilitySelectors.isReliable(emptyState)).toBe(false);
    expect(reliabilitySelectors.predictionAccuracy(emptyState)).toBe(0);
    expect(reliabilitySelectors.totalAnomalies(emptyState)).toBe(0);
    expect(reliabilitySelectors.metricTrends(emptyState)).toEqual([]);
  });

  it('should determine if data is stale', () => {
    const freshState = { lastFetched: Date.now() - 120000 } as any; // 2 minutes ago
    const staleState = { lastFetched: Date.now() - 360000 } as any; // 6 minutes ago

    expect(reliabilitySelectors.isStale(freshState)).toBe(false);
    expect(reliabilitySelectors.isStale(staleState)).toBe(true);
  });
});

describe('named selectors', () => {
  const stateWithAnomalies = { 
    anomalies: mockReliabilityData.anomalies 
  } as any;

  it('should export selectCriticalAnomalies', () => {
    const critical = selectCriticalAnomalies(stateWithAnomalies);
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe('critical');
  });

  it('should export selectWarningAnomalies', () => {
    const warnings = selectWarningAnomalies(stateWithAnomalies);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe('warning');
  });
});