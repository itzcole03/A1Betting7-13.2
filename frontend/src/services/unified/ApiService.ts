/**
 * Unified API Service - Centralized HTTP client for A1Betting Platform
 * Handles authentication, retries, caching, and error management
 */

import { backendDiscovery } from '../backendDiscovery';

interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
}

class ApiService {
  private config: ApiConfig;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = [];
  private responseInterceptors: Array<(response: ApiResponse) => ApiResponse> = [];

  constructor() {
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
      return await backendDiscovery.getBackendUrl();
    } catch (error) {
      console.warn('Failed to discover backend, using configured baseURL:', error);
      return this.config.baseURL;
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
    data?: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const baseURL = await this.getBaseURL();
    const fullUrl = `${baseURL}${url}`;
    const cacheKey = `${method}:${fullUrl}:${JSON.stringify(data || {})}`;

    // Check cache for GET requests
    if (method === 'GET' && config.cache !== false) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.data;
      }
    }

    // Apply request interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = interceptor(finalConfig);
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...finalConfig.headers,
      },
      signal: AbortSignal.timeout(finalConfig.timeout || this.config.timeout),
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    const maxRetries = finalConfig.retries || this.config.retryAttempts;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(fullUrl, requestOptions);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        const apiResponse: ApiResponse<T> = {
          data: responseData,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        };

        // Apply response interceptors
        let finalResponse = apiResponse;
        for (const interceptor of this.responseInterceptors) {
          finalResponse = interceptor(finalResponse);
        }

        // Cache successful GET requests
        if (method === 'GET' && config.cache !== false) {
          const cacheTime = config.cacheTime || 300000; // 5 minutes default
          this.cache.set(cacheKey, {
            data: finalResponse,
            expires: Date.now() + cacheTime,
          });
        }

        return finalResponse;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  async get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PUT', url, data, config);
  }

  async delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', url, undefined, config);
  }

  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PATCH', url, data, config);
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { timeout: 5000, retries: 1 });
      return response.status === 200;
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

export default new ApiService();
