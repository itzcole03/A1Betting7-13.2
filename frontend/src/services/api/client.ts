// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedError.js' or its... Remove this comment to see the full error message
import { APIError, AppError } from '@/core/UnifiedError.js';
// @ts-expect-error TS(2307): Cannot find module '@/core/UnifiedMonitor.js' or i... Remove this comment to see the full error message
import { unifiedMonitor } from '@/core/UnifiedMonitor.js';

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
    this.baseUrl =
      // @ts-expect-error TS(1343): The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
      (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';
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
        url.searchParams.append(key, value);
      });
    }
    const _headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };
    try {
      const _response = await fetch(url.toString(), {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        // @ts-expect-error TS(2339): Property 'timeout' does not exist on type '{ new (... Remove this comment to see the full error message
        signal: config.timeout ? AbortSignal.timeout(config.timeout) : undefined,
      });
      const _responseData = await response.json();
      // Utility to safely convert Headers to Record<string, string>
      const _headersToObject = (headers: Headers): Record<string, string> => {
        const _result: Record<string, string> = {};
        headers.forEach((value, key) => {
          result[key] = value;
        });
        return result;
      };
      if (trace) {
        (trace as unknown).httpStatus = response.status;
        unifiedMonitor.endTrace(trace);
      }
      if (!response.ok) {
        throw new APIError(
          responseData.message || 'API request failed',
          response.status,
          responseData
        );
      }
      return {
        data: responseData,
        status: response.status,
        headers: headersToObject(response.headers),
      };
    } catch (error: unknown) {
      if (trace) {
        let _errStatus = 500;
        if (
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as Record<string, unknown>).response === 'object' &&
          (error as { response?: { status?: number } }).response?.status
        ) {
          errStatus = (error as { response?: { status?: number } }).response!.status!;
        }
        (trace as unknown).httpStatus = errStatus;
        unifiedMonitor.endTrace(trace);
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
      function hasResponseStatus(_err: unknown): err is { response: { status: number } } {
        return (
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: unknown }).response === 'object' &&
          (err as { response?: { status?: unknown } }).response?.status !== undefined &&
          typeof (err as { response: { status: unknown } }).response.status === 'number'
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

// Export a singleton instance;
export const _apiClient = new ApiClient();

// Export get and post for compatibility with legacy imports;
export const _get = apiClient.get.bind(apiClient);
export const _post = apiClient.post.bind(apiClient);
