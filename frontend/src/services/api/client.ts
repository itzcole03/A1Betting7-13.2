// Note: These imports may need adjustment based on actual file locations
// For now, using mock implementations to prevent build errors
class APIError extends Error {
  constructor(message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

class AppError extends Error {
  constructor(message: string, public context?: any, public originalError?: any) {
    super(message);
    this.name = 'AppError';
  }
}

// Mock monitor for now
const unifiedMonitor = {
  startTrace: (name: string, options: any) => ({ name, options, startTime: Date.now() }),
  endTrace: (trace: any) => ({ ...trace, endTime: Date.now() })
};

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers?: Record<string, string>;
}

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = (process.env.VITE_API_URL || 'http://localhost:8000') + '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.defaultTimeout = 30000; // 30 seconds;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    config: ApiRequestConfig = {} as ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    const _trace = unifiedMonitor.startTrace('api-client-request', {
      category: 'api.client',
      description: 'API client request',
    });
    // Add query parameters;
    const _url = new URL(this.baseUrl + endpoint);
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        _url.searchParams.append(key, value);
      });
    }
    const _headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };
    try {
      const _response = await fetch(_url.toString(), {
        method,
        headers: _headers,
        body: data ? JSON.stringify(data) : undefined,
        // @ts-expect-error TS(2339): Property 'timeout' does not exist on type '{ new (... Remove this comment to see the full error message
        signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined,
      });
      const _responseData = await _response.json();
      // Utility to safely convert Headers to Record<string, string>
      const _headersToObject = (headers: Headers): Record<string, string> => {
        const _result: Record<string, string> = {};
        headers.forEach((value, key) => {
          _result[key] = value;
        });
        return _result;
      };
      if (_trace) {
        (_trace as any).httpStatus = _response.status;
        unifiedMonitor.endTrace(_trace);
      }
      if (!_response.ok) {
        throw new APIError(
          _responseData.message || 'API request failed',
          _response.status,
          _responseData
        );
      }
      return {
        data: _responseData,
        status: _response.status,
        headers: _headersToObject(_response.headers),
      };
    } catch (error: unknown) {
      if (_trace) {
        let _errStatus = 500;
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as Record<string, unknown>).response === 'object' &&
          (error as { response?: { status?: number } }).response?.status
        ) {
          _errStatus = (error as { response?: { status?: number } }).response!.status!;
        }
        (_trace as any).httpStatus = _errStatus;
        unifiedMonitor.endTrace(_trace);
      }
      if (error instanceof APIError) throw error;
      // If error is an AbortError;
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'AbortError'
      ) {
        throw new AppError('Request timeout', { status: 408 }, error);
      }
      // Type guard for error with response.status;
      function hasResponseStatus(_err: unknown): _err is { response: { status: number } } {
        return (
          typeof _err === 'object' &&
          _err !== null &&
          'response' in _err &&
          typeof (_err as { response?: unknown }).response === 'object' &&
          (_err as { response?: { status?: unknown } }).response?.status !== undefined &&
          typeof (_err as { response: { status: unknown } }).response.status === 'number'
        );
      }
      throw new AppError('API request failed', { status: 500, endpoint, method }, error);
    }
  }

  async get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  async delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export get and post for compatibility with legacy imports
export const get = apiClient.get.bind(apiClient);
export const post = apiClient.post.bind(apiClient);
