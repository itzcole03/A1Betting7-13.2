/**
 * Tests for Health Store
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import useHealthStore, { healthSelectors } from '../healthStore';

// Mock the DiagnosticsService
const mockDiagnosticsService = {
  fetchHealth: jest.fn(),
};

jest.mock('../../services/diagnostics/DiagnosticsService', () => ({
  DiagnosticsService: {
    getInstance: jest.fn(() => mockDiagnosticsService),
  },
}));

// Mock valid health data
const mockHealthData = {
  overall_status: 'ok' as const,
  services: [
    { name: 'api', status: 'ok' as const, latency_ms: 50 },
    { name: 'database', status: 'degraded' as const, latency_ms: 200 },
  ],
  performance: {
    cpu_percent: 45.2,
    p95_latency_ms: 120,
    cache_hit_rate: 85.5,
    active_connections: 150,
  },
  cache: {
    hit_rate: 85.5,
    miss_rate: 14.5,
    total_keys: 1000,
  },
  infrastructure: {
    active_edges: 3,
    database: { name: 'database', status: 'ok' as const },
    cache: { name: 'cache', status: 'ok' as const },
  },
  timestamp: '2024-01-01T12:00:00Z',
  uptime_seconds: 3600,
  __validated: true as const,
};

describe('useHealthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useHealthStore.setState({
      health: null,
      loading: false,
      error: null,
      lastFetched: null,
    });
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useHealthStore());
    
    expect(result.current.health).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetched).toBeNull();
  });

  it('should handle successful health fetch', async () => {
    mockDiagnosticsService.fetchHealth.mockResolvedValue(mockHealthData);

    const { result } = renderHook(() => useHealthStore());

    await act(async () => {
      await result.current.fetchHealth();
    });

    expect(result.current.health).toEqual(mockHealthData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetched).toBeDefined();
    expect(mockDiagnosticsService.fetchHealth).toHaveBeenCalled();
  });

  it('should handle health fetch error', async () => {
    const mockError = new Error('Network error');
    mockDiagnosticsService.fetchHealth.mockRejectedValue(mockError);

    const { result } = renderHook(() => useHealthStore());

    await act(async () => {
      await result.current.fetchHealth();
    });

    expect(result.current.health).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Network error');
    expect(result.current.lastFetched).toBeDefined();
  });

  it('should handle DiagnosticsError with code', async () => {
    const mockError = new Error('Health shape mismatch') as any;
    mockError.code = 'HEALTH_SHAPE_MISMATCH';
    mockDiagnosticsService.fetchHealth.mockRejectedValue(mockError);

    const { result } = renderHook(() => useHealthStore());

    await act(async () => {
      await result.current.fetchHealth();
    });

    expect(result.current.error).toBe('HEALTH_SHAPE_MISMATCH: Health shape mismatch');
  });

  it('should skip fetch if already loading', async () => {
    const { result } = renderHook(() => useHealthStore());

    // Set loading state
    act(() => {
      useHealthStore.setState({ loading: true });
    });

    await act(async () => {
      await result.current.fetchHealth();
    });

    expect(mockDiagnosticsService.fetchHealth).not.toHaveBeenCalled();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useHealthStore());

    // Set error state
    act(() => {
      result.current.clearError();
      useHealthStore.setState({ error: 'Test error' });
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should reset store', () => {
    const { result } = renderHook(() => useHealthStore());

    // Set some state
    act(() => {
      useHealthStore.setState({
        health: mockHealthData,
        loading: true,
        error: 'Test error',
        lastFetched: Date.now(),
      });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.health).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetched).toBeNull();
  });
});

describe('healthSelectors', () => {
  it('should select health status correctly', () => {
    const state = { health: mockHealthData } as any;

    expect(healthSelectors.isHealthy(state)).toBe(true);
    expect(healthSelectors.isDegraded(state)).toBe(false);
    expect(healthSelectors.isDown(state)).toBe(false);
  });

  it('should select performance metrics', () => {
    const state = { health: mockHealthData } as any;

    expect(healthSelectors.cacheHitRate(state)).toBe(85.5);
    expect(healthSelectors.cpuPercent(state)).toBe(45.2);
    expect(healthSelectors.p95Latency(state)).toBe(120);
    expect(healthSelectors.activeConnections(state)).toBe(150);
  });

  it('should handle missing health data', () => {
    const state = { health: null } as any;

    expect(healthSelectors.isHealthy(state)).toBe(false);
    expect(healthSelectors.cacheHitRate(state)).toBe(0);
    expect(healthSelectors.cpuPercent(state)).toBe(0);
  });

  it('should filter services by status', () => {
    const state = { health: mockHealthData } as any;

    const healthyServices = healthSelectors.healthyServices(state);
    const degradedServices = healthSelectors.degradedServices(state);

    expect(healthyServices).toHaveLength(1);
    expect(healthyServices[0].name).toBe('api');
    expect(degradedServices).toHaveLength(1);
    expect(degradedServices[0].name).toBe('database');
  });

  it('should determine if data is stale', () => {
    const freshState = { lastFetched: Date.now() - 60000 } as any; // 1 minute ago
    const staleState = { lastFetched: Date.now() - 180000 } as any; // 3 minutes ago

    expect(healthSelectors.isStale(freshState)).toBe(false);
    expect(healthSelectors.isStale(staleState)).toBe(true);
  });
});