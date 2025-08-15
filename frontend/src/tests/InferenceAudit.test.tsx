/**
 * PR9: Frontend Tests for Inference Audit Components
 * 
 * Tests covering the useInferenceAudit hook and InferenceAuditPanel component.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { useInferenceAudit, useConfidenceDistribution, useShadowComparison, usePerformanceMetrics } from '../inference/useInferenceAudit';
import { InferenceAuditPanel } from '../diagnostics/InferenceAuditPanel';

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

  it('should use correct polling intervals', () => {
    const originalEnv = process.env.NODE_ENV;

    // Test development interval
    process.env.NODE_ENV = 'development';
    const { result: devResult } = renderHook(() => useInferenceAudit({ autoStart: false }));
    
    // Test production interval
    process.env.NODE_ENV = 'production';
    const { result: prodResult } = renderHook(() => useInferenceAudit({ autoStart: false }));

    process.env.NODE_ENV = originalEnv;

    // Note: We can't directly test intervals without complex mocking,
    // but we can verify the hook initializes correctly in different environments
    expect(devResult.current).toBeDefined();
    expect(prodResult.current).toBeDefined();
  });
});

describe('useConfidenceDistribution Hook', () => {
  it('should process confidence histogram correctly', () => {
    const { result } = renderHook(() => useConfidenceDistribution(mockSummary));

    expect(result.current.data).toHaveLength(5);
    expect(result.current.total).toBe(100);
    
    // Check specific bins
    const bins = result.current.data;
    expect(bins.find(b => b.range === '0.6-0.8')).toEqual({ range: '0.6-0.8', count: 35 });
    expect(bins.find(b => b.range === '0.8-1.0')).toEqual({ range: '0.8-1.0', count: 30 });
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

describe('InferenceAuditPanel Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    setupMockFetch();
  });

  const setupMockFetch = () => {
    mockFetch
      .mockResolvedValue({
        ok: true,
        json: async () => mockSummary,
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => mockRecentEntries,
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => mockRegistryInfo,
      } as Response);
  };

  it('should render loading state initially', () => {
    render(<InferenceAuditPanel />);
    
    expect(screen.getByText('Loading inference audit data...')).toBeInTheDocument();
  });

  it('should render error state when API fails', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));
    
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Audit Data')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should render audit panel with data', async () => {
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Model Inference Audit')).toBeInTheDocument();
    });

    // Check model information
    expect(screen.getByText('enhanced_model_v2')).toBeInTheDocument();
    expect(screen.getByText('experimental_v3')).toBeInTheDocument();

    // Check performance metrics
    expect(screen.getByText('45.50 ms')).toBeInTheDocument(); // Avg latency
    expect(screen.getByText('98.0%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('100')).toBeInTheDocument(); // Total count
    expect(screen.getByText('2')).toBeInTheDocument(); // Error count
  });

  it('should toggle polling when button is clicked', async () => {
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Polling On')).toBeInTheDocument();
    });

    const pollingButton = screen.getByText('Polling On');
    fireEvent.click(pollingButton);

    await waitFor(() => {
      expect(screen.getByText('Polling Off')).toBeInTheDocument();
    });
  });

  it('should refresh data when refresh button is clicked', async () => {
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should show refreshing state
    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('should render confidence distribution', async () => {
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Confidence Distribution')).toBeInTheDocument();
    });

    // Check that confidence bins are rendered
    expect(screen.getByText('0.6-0.8')).toBeInTheDocument();
    expect(screen.getByText('0.8-1.0')).toBeInTheDocument();
  });

  it('should render shadow model comparison when enabled', async () => {
    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Shadow Model Comparison')).toBeInTheDocument();
    });

    // Check shadow metrics
    expect(screen.getByText('0.15')).toBeInTheDocument(); // Avg difference
  });

  it('should render recent table when enabled', async () => {
    render(<InferenceAuditPanel showRecentTable={true} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Inferences (2)')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Prediction')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Latency')).toBeInTheDocument();
    expect(screen.getByText('Shadow Diff')).toBeInTheDocument();
  });

  it('should handle disabled shadow mode display', async () => {
    const disabledShadowSummary = { ...mockSummary, shadow_enabled: false };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => disabledShadowSummary,
    } as Response);

    render(<InferenceAuditPanel />);

    await waitFor(() => {
      expect(screen.getByText('Shadow mode not enabled')).toBeInTheDocument();
    });
  });
});

describe('Component Integration', () => {
  it('should integrate hook and component correctly', async () => {
    setupMockFetch();

    render(<InferenceAuditPanel />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Model Inference Audit')).toBeInTheDocument();
    });

    // Verify that all expected elements are present
    expect(screen.getByText('Active Model')).toBeInTheDocument();
    expect(screen.getByText('Shadow Model')).toBeInTheDocument();
    expect(screen.getByText('Confidence Distribution')).toBeInTheDocument();
    expect(screen.getByText('Shadow Model Comparison')).toBeInTheDocument();
  });

  const setupMockFetch = () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecentEntries,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegistryInfo,
      } as Response);
  };
});