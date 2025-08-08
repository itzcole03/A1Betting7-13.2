/**
 * Unified API Service - Centralized HTTP client for A1Betting Platform
 * Handles authentication, retries, caching, and error management
 */

import EventEmitter from 'eventemitter3';
import { discoverBackend } from '../backendDiscovery';

// Add missing ApiConfig interface
type ApiConfig = {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
};

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

export class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;
  private cache: Map<string, { data: unknown; expires: number }> = new Map();
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = [];

  private constructor() {
    // Use getEnvVar for robust env access
    // @ts-ignore
    const getEnvVar = (() => {
      try {
        // Use environment variable or fallback
        return (key: string, fallback?: string) => {
          // Try to access Vite environment variables first
          if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key] || fallback;
          }
          return fallback;
        };
      } catch (e) {
        return (_key: string, fallback?: string) => fallback;
      }
    })();
    this.config = {
      baseURL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:8000'),
      timeout: 3000,  // 3 second timeout for faster fallback to mock data
      retryAttempts: 0, // No retries for faster fallback
      retryDelay: 1000,
    };
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
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
        let _finalResponse: ApiResponse<T> = _apiResponse;
        for (const _interceptor of this.responseInterceptors) {
          _finalResponse = _interceptor(_finalResponse) as ApiResponse<T>;
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
      // Use shorter timeout and no retries for health checks to fail fast
      const _response = await this.get('/health', {
        timeout: 2000, // 2 second timeout
        retries: 0,     // No retries for health checks
        cache: false    // Don't cache health check results
      });
      return _response.status === 200;
    } catch (error) {
      // Silently fail health checks - they're non-critical
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

export default ApiService.getInstance();
