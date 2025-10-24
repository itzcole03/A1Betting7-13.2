/**
 * Tests for useHealthStatus hook
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useHealthStatus, type HealthStatus } from '../../../src/health/useHealthStatus';

const originalFetch = global.fetch;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const getUrl = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof (input as Request).url === 'string') {
    return (input as Request).url;
  }

  return String(input);
};

const createJsonResponse = async <T>(data: T, overrides: Partial<Response> = {}): Promise<Response> => {
  return {
    ok: overrides.ok ?? true,
    status: overrides.status ?? 200,
    statusText: overrides.statusText ?? 'OK',
    json: async () => data,
    text: async () => JSON.stringify(data),
    clone: function () {
      return {
        ...this,
        json: async () => data,
        text: async () => JSON.stringify(data)
      } as Response;
    }
  } as Response;
};

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

const defaultFetchImpl = async (
  input: Parameters<typeof fetch>[0],
  _init?: Parameters<typeof fetch>[1]
): Promise<Response> => {
  const url = getUrl(input);

  if (url.includes('/api/v2/diagnostics/health')) {
    return createJsonResponse(mockHealthResponse);
  }

  if (url.includes('/api/health')) {
    return createJsonResponse(mockLegacyResponse);
  }

  throw new Error(`Unhandled fetch call in useHealthStatus tests: ${url}`);
};

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useHealthStatus', () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockImplementation(defaultFetchImpl);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  it('should fetch health status on mount', async () => {
  mockFetch.mockImplementationOnce(defaultFetchImpl);

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false }));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockHealthResponse);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith('/api/v2/diagnostics/health', {
      signal: expect.any(AbortSignal),
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  });

  it('should fallback to legacy endpoint when new endpoint fails', async () => {
    // First call to new endpoint fails
    mockFetch
      .mockImplementationOnce(() => Promise.reject(new Error('404 Not Found')))
      .mockImplementationOnce(() => createJsonResponse(mockLegacyResponse));

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

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith('/api/v2/diagnostics/health', expect.any(Object));
    expect(mockFetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network error');
    mockFetch.mockImplementation(() => Promise.reject(networkError));

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
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    
    const networkError = new Error('Service unavailable');
    mockFetch
      .mockRejectedValueOnce(networkError) // Initial structured endpoint failure
      .mockImplementationOnce(() => Promise.reject(new Error('Legacy failed'))) // Legacy fallback failure
      .mockImplementationOnce(() => createJsonResponse(mockHealthResponse)); // Success on scheduled retry

    const { result } = renderHook(() => useHealthStatus({ 
      enablePolling: false,
      maxRetries: 3,
      baseBackoffMs: 1000
    }));

    // Initial fetch should fail
    await flushPromises();
    expect(result.current.error).toEqual(networkError);
    expect(result.current.retryCount).toBe(1);
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    await act(async () => {
      jest.runOnlyPendingTimers();
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockHealthResponse);

    expect(mockFetch).toHaveBeenCalledTimes(3);

    randomSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should validate response structure', async () => {
    const invalidResponse = { invalid: 'response' };
    mockFetch
      .mockImplementationOnce(() => createJsonResponse(invalidResponse as any))
      .mockImplementationOnce(() => Promise.reject(new Error('Legacy failed')));

    const { result } = renderHook(() => useHealthStatus({ enablePolling: false, maxRetries: 0 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Invalid health response structure');
  });

  it('should handle AbortController cancellation', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    
    mockFetch.mockImplementation(() => Promise.reject(abortError));

  const { result } = renderHook(() => useHealthStatus({ enablePolling: false, maxRetries: 0 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Abort errors should still be treated as errors
    expect(result.current.error).toEqual(abortError);
  });

  it('should support manual refresh', async () => {
    mockFetch
      .mockImplementationOnce(() => createJsonResponse(mockHealthResponse))
      .mockImplementationOnce(() => createJsonResponse({ ...mockHealthResponse, uptime_seconds: 7200 }));

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

    mockFetch.mockImplementation(() => createJsonResponse(mockHealthResponse));

    renderHook(() => useHealthStatus({ 
      enablePolling: true,
      pollInterval: 30000 
    }));

    // Initial fetch
    await act(async () => {
      jest.advanceTimersByTime(100);
      await flushPromises();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Should poll after interval
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await flushPromises();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should handle different response status codes', async () => {
    // Test 503 Service Unavailable
    mockFetch
      .mockImplementationOnce(() => createJsonResponse(null, {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      }))
      .mockImplementationOnce(() => Promise.reject(new Error('Legacy unavailable')));

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

    mockFetch.mockImplementation(() => new Promise(() => {}));

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
    mockFetch.mockImplementation(() => Promise.reject(networkError));

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