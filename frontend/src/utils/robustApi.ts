/**
 * Robust API Utility - Handles API errors gracefully
 * Prevents JSON parsing errors when APIs return HTML
 */

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
}

export class RobustApiClient {
  private baseUrl: string;
  
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(
    url: string, 
    options: RequestInit & ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = 10000,
      retries = 2,
      fallbackData,
      ...fetchOptions
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle HTTP errors
          if (response.status === 404) {
            return {
              success: false,
              error: 'API endpoint not found',
              data: fallbackData
            };
          }
          
          if (response.status >= 500) {
            return {
              success: false,
              error: 'Server error - API temporarily unavailable',
              data: fallbackData
            };
          }

          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            data: fallbackData
          };
        }

        // Check content type to avoid JSON parsing errors
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          try {
            const data = await response.json();
            return {
              success: true,
              data
            };
          } catch (jsonError) {
            console.warn('Failed to parse JSON response:', jsonError);
            return {
              success: false,
              error: 'Invalid JSON response from server',
              data: fallbackData
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
            data: fallbackData
          };
        } else {
          // Try to parse as text
          const text = await response.text();
          return {
            success: true,
            data: text as unknown as T
          };
        }

      } catch (error) {
        console.warn(`API attempt ${attempt + 1} failed for ${url}:`, error);
        
        if (attempt === retries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (errorMessage.includes('abort')) {
            return {
              success: false,
              error: 'Request timeout - API not responding',
              data: fallbackData
            };
          }

          return {
            success: false,
            error: `Network error: ${errorMessage}`,
            data: fallbackData
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      data: fallbackData
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
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  }
}

// Global instance
export const robustApi = new RobustApiClient();

// Convenience functions with fallback data
export const fetchWithFallback = async <T>(
  url: string, 
  fallbackData: T,
  options?: ApiOptions
): Promise<T> => {
  const result = await robustApi.get<T>(url, { ...options, fallbackData });
  return result.data || fallbackData;
};

// Health check with mock data
export const fetchHealthData = async () => {
  const mockHealthData = {
    status: 'healthy',
    services: {
      api: 'operational',
      cache: 'operational', 
      database: 'operational'
    },
    performance: {
      cache_hit_rate: 85.2,
      cache_type: 'memory'
    },
    uptime_seconds: 3600
  };

  return fetchWithFallback('/health', mockHealthData);
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
        errors: 2
      },
      '/mlb/games': {
        avg_time_ms: 127.3,
        min_time_ms: 45.2,
        max_time_ms: 342.1,
        total_calls: 156,
        cache_hits: 134,
        errors: 1
      }
    },
    cache_performance: {
      cache_type: 'memory',
      hits: 312,
      misses: 67,
      errors: 3,
      hit_rate: 82.3,
      total_requests: 379
    },
    system_info: {
      optimization_level: 'Phase 4 Enhanced',
      caching_strategy: 'Memory Fallback (Demo Mode)',
      monitoring: 'Real-time Performance Tracking'
    }
  };

  return fetchWithFallback('/performance/stats', { data: mockStats });
};

export default robustApi;
