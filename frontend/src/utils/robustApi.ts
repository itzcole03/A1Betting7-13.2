/**
 * Robust API Utility - Handles API errors gracefully
 * Prevents JSON parsing errors when APIs return HTML
 */

import { ensureHealthShape } from './ensureHealthShape';
import { ensureMetricsShape } from './ensureMetricsShape';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isHtml?: boolean;
}

interface ApiOptions {
  timeout?: number;
  retries?: number;
  fallbackData?: any;
  headers?: Record<string, string>;
}

export class RobustApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(url: string, options: RequestInit & ApiOptions = {}): Promise<ApiResponse<T>> {
    const { timeout = 10000, retries = 2, fallbackData, ...fetchOptions } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status === 404) {
            return {
              success: false,
              error: 'API endpoint not found',
              data: fallbackData,
            };
          }

          if (response.status >= 500) {
            return {
              success: false,
              error: 'Server error - API temporarily unavailable',
              data: fallbackData,
            };
          }

          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            data: fallbackData,
          };
        }

        // Check content type to avoid JSON parsing errors
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          try {
            const data = await response.json();
            return {
              success: true,
              data,
            };
          } catch (jsonError) {
            console.warn('Failed to parse JSON response:', jsonError);
            return {
              success: false,
              error: 'Invalid JSON response from server',
              data: fallbackData,
            };
          }
        } else if (contentType.includes('text/html')) {
          // Server returned HTML (likely an error page)
          const html = await response.text();
          console.warn('API returned HTML instead of JSON:', url);

          return {
            success: false,
            error: 'API returned HTML instead of JSON - service may be down',
            isHtml: true,
            data: fallbackData,
          };
        } else {
          // Try to parse as text
          const text = await response.text();
          return {
            success: true,
            data: text as unknown as T,
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Reduce console noise for expected network errors
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
          // Only log on last attempt to reduce noise
          if (attempt === retries) {
            console.warn(`API unavailable after ${retries + 1} attempts for ${url} - using fallback data`);
          }
        } else {
          // Log other errors normally
          console.warn(`API attempt ${attempt + 1} failed for ${url}:`, error);
        }

        if (attempt === retries) {
          if (errorMessage.includes('abort')) {
            return {
              success: false,
              error: 'Request timeout - API not responding',
              data: fallbackData,
            };
          }

          if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
            return {
              success: false,
              error: 'Backend unavailable - using demo data',
              data: fallbackData,
            };
          }

          return {
            success: false,
            error: `Network error: ${errorMessage}`,
            data: fallbackData,
          };
        }

        // Wait before retry (shorter delay for network errors)
        const delay = errorMessage.includes('Failed to fetch') ? 500 : 1000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      data: fallbackData,
    };
  }

  async get<T>(url: string, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options?: ApiOptions): Promise<ApiResponse<T>> {
    return this.fetch<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : null,
    });
  }
}

// Detect backend URL based on environment
const getBackendUrl = () => {
  // Check if we're in a cloud environment (like fly.dev, vercel, netlify, etc.)
  const hostname = window.location.hostname;
  const port = window.location.port;

  // For development on non-standard ports (like 48752), use proxy through current origin
  const isNonStandardPort = port && port !== '80' && port !== '443' && port !== '5173' && port !== '5174';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // If on localhost with non-standard port, try proxy through current origin first
  if (isLocalhost && isNonStandardPort) {
    // Use relative URLs which will proxy through the current server
    return '';
  }

  const isCloudEnv =
    hostname.includes('.fly.dev') ||
    hostname.includes('.vercel.app') ||
    hostname.includes('.netlify.app') ||
    hostname.includes('.herokuapp.com') ||
    hostname.includes('.builder.io') ||
    (!isLocalhost && !hostname.includes('192.168.') && !hostname.includes('10.') && !hostname.includes('172.'));

  if (isCloudEnv) {
    // In cloud environments, use relative URLs for proxy or disable API calls
    return null; // This will trigger mock data mode
  }

  // For standard localhost development, try direct connection
  if (isLocalhost && (port === '5173' || port === '5174' || !port)) {
    return 'http://localhost:8000';
  }

  // Default to relative URLs for proxy
  return '';
};

// Global instance - handle null vs empty string properly
const backendUrl = getBackendUrl();
export const robustApi = backendUrl !== null ? new RobustApiClient(backendUrl || '') : null;

// Convenience functions with fallback data
export const fetchWithFallback = async <T>(
  url: string,
  fallbackData: T,
  options?: ApiOptions
): Promise<T> => {
  // If no API client available, return fallback immediately
  if (!robustApi) {
    console.info(`No API client available for ${url}, using fallback data`);
    return fallbackData;
  }

  try {
    const result = await robustApi.get<T>(url, { ...options, fallbackData });
    return result.data || fallbackData;
  } catch (error) {
    console.warn(`API call to ${url} failed, using fallback data:`, error);
    return fallbackData;
  }
};

// Health check with mock data
export const fetchHealthData = async () => {
  const mockHealthData = {
    status: 'healthy',
    services: {
      api: 'operational',
      cache: 'operational',
      database: 'operational',
    },
    performance: {
      cache_hit_rate: 85.2,
      cache_type: 'memory',
    },
    uptime_seconds: 3600,
  };

  // If no backend URL configured (cloud environment), use mock data immediately
  if (!robustApi) {
    // eslint-disable-next-line no-console
    console.info('Running in cloud environment - using mock health data');
    return ensureHealthShape(mockHealthData, { usedMock: true });
  }

  try {
    // Try health endpoints starting with v2
    const result1 = await robustApi.get('/api/v2/diagnostics/health', {
      fallbackData: mockHealthData,
      timeout: 2000,
      retries: 1
    });
    if (result1.success) {
      // V2 endpoint returns structured data
      return ensureHealthShape(result1.data);
    }

    // Fallback to legacy health endpoint
    const result2 = await robustApi.get('/api/health', {
      fallbackData: mockHealthData,
      timeout: 2000,
      retries: 1
    });
    if (result2.success) {
      // Legacy endpoint has nested data structure
      if (result2.data && typeof result2.data === 'object' && 'data' in result2.data) {
        return ensureHealthShape((result2.data as Record<string, unknown>).data || result2.data);
      }
      return ensureHealthShape(result2.data);
    }

    // If both fail, don't log error - just fall through to mock data
  } catch (error) {
    // Reduce noise - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Health API unavailable, using mock data');
    }
  }

  return ensureHealthShape(mockHealthData, { usedMock: true });
};

// Performance stats with mock data
export const fetchPerformanceStats = async () => {
  const mockStats = {
    api_performance: {
      '/health': {
        avg_time_ms: 45.2,
        min_time_ms: 23.1,
        max_time_ms: 156.8,
        total_calls: 247,
        cache_hits: 89,
        errors: 2,
      },
      '/mlb/games': {
        avg_time_ms: 127.3,
        min_time_ms: 45.2,
        max_time_ms: 342.1,
        total_calls: 156,
        cache_hits: 134,
        errors: 1,
      },
    },
    cache_performance: {
      cache_type: 'memory',
      hits: 312,
      misses: 67,
      errors: 3,
      hit_rate: 82.3,
      total_requests: 379,
    },
    system_info: {
      optimization_level: 'Phase 4 Enhanced',
      caching_strategy: 'Cloud Demo Mode',
      monitoring: 'Real-time Performance Tracking',
    },
  };

  // If no backend URL configured (cloud environment), use mock data immediately
  if (!robustApi) {
    console.info('Running in cloud environment - using mock performance data');
    return { data: mockStats };
  }

  try {
    // Try multiple performance endpoints
    let result = await robustApi.get('/api/performance-metrics', {
      fallbackData: { data: mockStats },
      timeout: 2000,
      retries: 1
    });

    // If first endpoint fails, try alternative
    if (!result.success) {
      result = await robustApi.get('/api/v1/performance-stats', {
        fallbackData: { data: mockStats },
        timeout: 2000,
        retries: 1
      });
    }

    if (result.success) {
      // Apply metrics normalization to prevent total_requests errors
      const rawData = result.data && typeof result.data === 'object' && 'data' in result.data
        ? (result.data as { data: unknown }).data
        : result.data;
      const normalizedMetrics = ensureMetricsShape(rawData);
      return { data: normalizedMetrics };
    }
  } catch (error) {
    // Reduce noise - only log in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Performance stats API unavailable, using mock data');
    }
  }

  // Apply normalization to mock data as well
  const normalizedMockStats = ensureMetricsShape(mockStats);
  return { data: normalizedMockStats };
};

export default robustApi;
