/**
 * PR9: Frontend Tests for Inference Audit Hook
 * 
 * Tests covering the useInferenceAudit hook functionality.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useInferenceAudit, useConfidenceDistribution, useShadowComparison, usePerformanceMetrics } from '../inference/useInferenceAudit';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockSummary = {
  rolling_count: 100,
  avg_latency_ms: 45.5,
  shadow_avg_diff: 0.15,
  prediction_mean: 0.65,
  confidence_histogram: {
    '0.0-0.2': 5,
    '0.2-0.4': 10,
    '0.4-0.6': 20,
    '0.6-0.8': 35,
    '0.8-1.0': 30,
  },
  shadow_enabled: true,
  active_model: 'enhanced_model_v2',
  shadow_model: 'experimental_v3',
  success_rate: 0.98,
  error_count: 2,
};

const mockRecentEntries = [
  {
    request_id: 'req-123',
    timestamp: Date.now() / 1000,
    model_version: 'enhanced_model_v2',
    feature_hash: 'abc123def',
    latency_ms: 42.5,
    prediction: 0.75,
    confidence: 0.85,
    shadow_version: 'experimental_v3',
    shadow_prediction: 0.72,
    shadow_diff: 0.03,
    shadow_latency_ms: 48.2,
    status: 'success',
  },
  {
    request_id: 'req-124',
    timestamp: (Date.now() / 1000) - 30,
    model_version: 'enhanced_model_v2',
    feature_hash: 'def456ghi',
    latency_ms: 38.1,
    prediction: 0.62,
    confidence: 0.78,
    shadow_version: 'experimental_v3',
    shadow_prediction: 0.59,
    shadow_diff: 0.03,
    shadow_latency_ms: 41.7,
    status: 'success',
  },
];

const mockRegistryInfo = {
  available_versions: ['default_model_v1', 'enhanced_model_v2', 'experimental_v3'],
  active_version: 'enhanced_model_v2',
  shadow_version: 'experimental_v3',
  shadow_enabled: true,
};

describe('useInferenceAudit Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setupMockFetch = (responses: any[] = [mockSummary, mockRecentEntries, mockRegistryInfo]) => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responses[0], // summary
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responses[1], // recent entries
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => responses[2], // registry info
      } as Response);
  };

  it('should initialize with correct default state', () => {
    setupMockFetch();
    
    const { result } = renderHook(() => useInferenceAudit({ autoStart: false }));

    expect(result.current.summary).toBeNull();
    expect(result.current.recentEntries).toEqual([]);
    expect(result.current.registryInfo).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isPolling).toBe(false);
  });

  it('should fetch data on mount when autoStart is true', async () => {
    setupMockFetch();
    
    const { result } = renderHook(() => useInferenceAudit({ autoStart: true }));

    // Should start polling immediately
    expect(result.current.isPolling).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.recentEntries).toEqual(mockRecentEntries);
    expect(result.current.registryInfo).toEqual(mockRegistryInfo);
    expect(result.current.error).toBeNull();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useInferenceAudit());

    await waitFor(() => {
      expect(result.current.error).toBe('API Error');
    });

    expect(result.current.summary).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should toggle polling correctly', async () => {
    setupMockFetch();
    
    const { result } = renderHook(() => useInferenceAudit({ autoStart: false }));

    expect(result.current.isPolling).toBe(false);

    // Toggle polling on
    result.current.togglePolling();
    expect(result.current.isPolling).toBe(true);

    // Toggle polling off
    result.current.togglePolling();
    expect(result.current.isPolling).toBe(false);
  });

  it('should refresh data manually', async () => {
    setupMockFetch();
    
    const { result } = renderHook(() => useInferenceAudit({ autoStart: false }));

    await result.current.refresh();

    await waitFor(() => {
      expect(result.current.summary).toEqual(mockSummary);
    });
  });
});

describe('useConfidenceDistribution Hook', () => {
  it('should process confidence histogram correctly', () => {
    const { result } = renderHook(() => useConfidenceDistribution(mockSummary));

    expect(result.current.data).toHaveLength(5);
    expect(result.current.total).toBe(100);
    
    // Check specific bins
    const bins = result.current.data;
    expect(bins.find((b: any) => b.range === '0.6-0.8')).toEqual({ range: '0.6-0.8', count: 35 });
    expect(bins.find((b: any) => b.range === '0.8-1.0')).toEqual({ range: '0.8-1.0', count: 30 });
  });

  it('should handle null summary', () => {
    const { result } = renderHook(() => useConfidenceDistribution(null));

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});

describe('useShadowComparison Hook', () => {
  it('should calculate shadow metrics correctly', () => {
    const { result } = renderHook(() => useShadowComparison(mockSummary, mockRecentEntries));

    expect(result.current.enabled).toBe(true);
    expect(result.current.avgDiff).toBe(0.15);
    expect(result.current.maxDiff).toBe(0.03); // Max from recent entries
    expect(result.current.minDiff).toBe(0.03); // Min from recent entries (both are 0.03)
    expect(result.current.entryCount).toBe(2);
    expect(result.current.shadowModel).toBe('experimental_v3');
  });

  it('should handle disabled shadow mode', () => {
    const disabledSummary = { ...mockSummary, shadow_enabled: false };
    const { result } = renderHook(() => useShadowComparison(disabledSummary, mockRecentEntries));

    expect(result.current.enabled).toBe(false);
  });
});

describe('usePerformanceMetrics Hook', () => {
  it('should calculate performance metrics correctly', () => {
    const { result } = renderHook(() => usePerformanceMetrics(mockSummary, mockRecentEntries));

    expect(result.current.avgLatency).toBe(45.5);
    expect(result.current.maxLatency).toBe(42.5); // Max from recent entries
    expect(result.current.minLatency).toBe(38.1); // Min from recent entries
    expect(result.current.successRate).toBe(0.98);
    expect(result.current.errorCount).toBe(2);
    expect(result.current.totalCount).toBe(100);
  });
});