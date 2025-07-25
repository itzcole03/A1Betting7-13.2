/**
 * Unified API Service - Centralized HTTP client for A1Betting Platform
 * Handles authentication, retries, caching, and error management
 */

import EventEmitter from 'eventemitter3';
import { discoverBackend } from '../backendDiscovery';
// Abstract base class for API services (matches .d.ts)
export interface ApiServiceEvents {
  error: (error: Error) => void;
  request: (endpoint: string) => void;
  response: (response: ApiResponse<unknown>) => void;
}

export abstract class BaseApiService extends EventEmitter<ApiServiceEvents> {
  protected readonly client: unknown;
  protected readonly config: any;
  constructor(config: any) {
    super();
    this.config = config;
    this.client = this.initializeClient();
  }
  protected abstract initializeClient(): unknown;
  protected abstract handleError(error: Error): void;
  protected abstract handleResponse<T>(response: ApiResponse<T>): void;
  abstract get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  abstract post<T>(endpoint: string, data: unknown): Promise<T>;
}

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
}

class ApiService {
  private config: ApiConfig;
  private cache: Map<string, { data: unknown; expires: number }> = new Map();
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = [];

  constructor() {
    // @ts-expect-error TS(1343): The 'import.meta' meta-property is only allowed wh... Remove this comment to see the full error message
    this.config = {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    };
  }

  /**
   * Get the current backend URL using discovery service
   */
  private async getBaseURL(): Promise<string> {
    try {
      const _url = await discoverBackend();
      if (!_url) throw new Error('No backend discovered');
      return _url;
    } catch (error) {
      console.warn('Failed to discover backend, using configured baseURL:', error);
      return this.config.baseURL; // or a fallback URL
    }
  }

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse): void {
    this.responseInterceptors.push(interceptor);
  }

  private async executeRequest<T>(
    method: string,
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const _baseURL = await this.getBaseURL();
    const _fullUrl = `${_baseURL}${url}`;
    const _cacheKey = `${method}:${_fullUrl}:${JSON.stringify(data || {})}`;

    // Check cache for GET requests
    if (method === 'GET' && config.cache !== false) {
      const _cached = this.cache.get(_cacheKey);
      if (_cached && _cached.expires > Date.now()) {
        // @ts-ignore: TS2322 - Type 'unknown' is not assignable to type 'T'.
        return _cached.data;
      }
    }

    // Apply request interceptors
    let _finalConfig = { ...config };
    for (const _interceptor of this.requestInterceptors) {
      _finalConfig = _interceptor(_finalConfig);
    }

    const _requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ..._finalConfig.headers,
      },
      signal: AbortSignal.timeout(_finalConfig.timeout || this.config.timeout),
    };

    if (data) {
      _requestOptions.body = JSON.stringify(data);
    }

    const _maxRetries = _finalConfig.retries || this.config.retryAttempts;
    let _lastError: Error | undefined;

    for (let _attempt = 0; _attempt <= _maxRetries; _attempt++) {
      try {
        const _response = await fetch(_fullUrl, _requestOptions);

        if (!_response.ok) {
          throw new Error(`HTTP ${_response.status}: ${_response.statusText}`);
        }

        const _responseData = await _response.json();
        const _apiResponse: ApiResponse<T> = {
          data: _responseData,
          status: _response.status,
          statusText: _response.statusText,
          headers: Object.fromEntries(_response.headers.entries()),
        };

        // Apply response interceptors
        let _finalResponse = _apiResponse;
        for (const _interceptor of this.responseInterceptors) {
          _finalResponse = _interceptor(_finalResponse);
        }

        // Cache successful GET requests
        if (method === 'GET' && config.cache !== false) {
          const _cacheTime = config.cacheTime || 300000; // 5 minutes default
          this.cache.set(_cacheKey, {
            data: _finalResponse,
            expires: Date.now() + _cacheTime,
          });
        }

        return _finalResponse;
      } catch (error) {
        _lastError = error as Error;

        if (_attempt < _maxRetries) {
          const _delay = this.config.retryDelay * Math.pow(2, _attempt);
          await new Promise(resolve => setTimeout(resolve, _delay));
        }
      }
    }

    throw _lastError!;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PUT', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', url, undefined, config);
  }

  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PATCH', url, data, config);
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      for (const _key of this.cache.keys()) {
        if (_key.includes(pattern)) {
          this.cache.delete(_key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const _response = await this.get('/health', { timeout: 5000, retries: 1 });
      return _response.status === 200;
    } catch {
      return false;
    }
  }

  getStats(): {
    cacheSize: number;
    interceptors: { request: number; response: number };
  } {
    return {
      cacheSize: this.cache.size,
      interceptors: {
        request: this.requestInterceptors.length,
        response: this.responseInterceptors.length,
      },
    };
  }
}

// (Removed duplicate export of BaseApiService and ApiResponse)
export default new ApiService();
