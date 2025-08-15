/**
 * Tests for useHealthStatus hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useHealthStatus, type HealthStatus } from '../../../src/health/useHealthStatus';

// Mock fetch globally
global.fetch = jest.fn();

const mockHealthResponse: HealthStatus = {
  status: 'ok',
  uptime_seconds: 3600,
  version: 'v2',
  timestamp: '2025-08-15T10:00:00.000Z',
  components: {
    websocket: {
      status: 'up',
      last_check: '2025-08-15T10:00:00.000Z',
      response_time_ms: 15,
      details: { active_connections: 0 }
    },
    cache: {
      status: 'up', 
      last_check: '2025-08-15T10:00:00.000Z',
      response_time_ms: 8,
      details: { cache_type: 'memory' }
    },
    model_inference: {
      status: 'degraded',
      last_check: '2025-08-15T10:00:00.000Z', 
      response_time_ms: 120,
      details: { model_loaded: true, inference_queue_size: 2 }
    }
  },
  build_info: {
    version: '1.0.0',
    environment: 'test'
  }
};

const mockLegacyResponse = {
  success: true,
  data: { status: 'ok' },
  error: null
};

describe('useHealthStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  afterEach(() => {
    // Clean up any pending timeouts
    jest.clearAllTimers();
  });

  it('should fetch health status on mount', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHealthResponse)
    } as Response);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/v2/diagnostics/health', {
      signal: expect.any(AbortSignal),
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  });

  it('should fallback to legacy endpoint when new endpoint fails', async () => {
    // First call to new endpoint fails
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockRejectedValueOnce(new Error('404 Not Found'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLegacyResponse)
      } as Response);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: 'ok',
      uptime_seconds: 0,
      version: 'legacy',
      timestamp: expect.any(String),
      components: {},
      build_info: {
        deprecated: 'true',
        message: 'Using legacy health endpoint'
      }
    });
    
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('/api/v2/diagnostics/health', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error');
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useHealthStatus({ 
      enablePolling: false,
      maxRetries: 1 
    }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(networkError);
    expect(result.current.data).toBeNull();
  });

  it('should implement exponential backoff on retries', async () => {
    jest.useFakeTimers();
    
    const networkError = new Error('Service unavailable');
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

    const { result } = renderHook(() => useHealthStatus({ 
      enablePolling: false,
      maxRetries: 3,
      baseBackoffMs: 1000
    }));

    // Initial fetch should fail
    await act(async () => {
      jest.advanceTimersByTime(100);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toEqual(networkError);
    expect(result.current.retryCount).toBe(1);

    // Should retry after backoff delay
    await act(async () => {
      jest.advanceTimersByTime(1000); // First retry after ~1s
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.retryCount).toBe(2);

    // Should retry again with longer delay
    await act(async () => {
      jest.advanceTimersByTime(2000); // Second retry after ~2s
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.retryCount).toBe(3);

    jest.useRealTimers();
  });

  it('should validate response structure', async () => {
    const invalidResponse = { invalid: 'response' };
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(invalidResponse)
    } as Response);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Invalid health response structure');
  });

  it('should handle AbortController cancellation', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Abort errors should still be treated as errors
    expect(result.current.error).toEqual(abortError);
  });

  it('should support manual refresh', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHealthResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockHealthResponse, uptime_seconds: 7200 })
      } as Response);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.uptime_seconds).toBe(3600);

    // Manually refresh
    act(() => {
      (result.current as any).refresh();
    });

    await waitFor(() => {
      expect(result.current.data?.uptime_seconds).toBe(7200);
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle polling when enabled', async () => {
    jest.useFakeTimers();

    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHealthResponse)
    } as Response);

    const { result } = renderHook(() => useHealthStatus({ 
      enablePolling: true,
      pollInterval: 30000 
    }));

    // Initial fetch
    await act(async () => {
      jest.advanceTimersByTime(100);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(fetch).toHaveBeenCalledTimes(1);

    // Should poll after interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should handle different response status codes', async () => {
    // Test 503 Service Unavailable
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable'
    } as Response);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('503');
  });

  it('should cleanup properly on unmount', async () => {
    const { unmount } = renderHook(() => useHealthStatus({ enablePolling: false }));

    // Spy on AbortController
    const mockAbort = jest.fn();
    const originalAbortController = global.AbortController;
    
    global.AbortController = jest.fn().mockImplementation(() => ({
      abort: mockAbort,
      signal: {}
    }));

    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    // Start another hook instance
    const { unmount: unmount2 } = renderHook(() => useHealthStatus({ enablePolling: false }));

    // Unmount should call abort
    unmount2();

    // Clean up the first one too
    unmount();

    // Restore original
    global.AbortController = originalAbortController;
  });

  it('should respect maxRetries limit', async () => {
    const networkError = new Error('Connection failed');
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

    const { result } = renderHook(() => useHealthStatus({ 
      enablePolling: false,
      maxRetries: 2
    }));

    // Wait for all retries to complete
    await waitFor(() => {
      expect(result.current.retryCount).toBe(2);
    }, { timeout: 5000 });

    expect(result.current.error).toEqual(networkError);
    // Should not exceed maxRetries
    expect(result.current.retryCount).toBe(2);
  });
});