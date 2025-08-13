/**
 * Unified API Service - Centralized HTTP client for A1Betting Platform
 * Consolidates all API functionality with authentication, retries, and error management
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
import { withRequestCorrelation } from './withRequestCorrelation';

/**
 * ApiServiceEvents - Event signatures for API service
 * @template T - Type of API response data
 */
export interface ApiServiceEvents<T = any> {
  error: (error: Error) => void;
  request: (endpoint: string) => void;
  response: (response: ApiResponse<T>) => void;
}

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * ApiResponse - Standardized API response
 * @template T - Type of response data
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  timestamp?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
}

// Abstract base class for API services
export abstract class BaseApiService<T = any> extends EventEmitter<ApiServiceEvents<T>> {
  protected readonly client: AxiosInstance;
  protected readonly config: ApiConfig;

  constructor(config: ApiConfig = {}) {
    super();
    this.config = {
      baseURL: config.baseURL || 'http://localhost:8000',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config,
    };
    this.client = this.initializeClient();
  }

  protected initializeClient(): AxiosInstance {
    const client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    client.interceptors.request.use(
      config => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        this.emit('request', config.url || '');
        return config;
      },
      error => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      response => {
        const apiResponse: ApiResponse<T> = {
          data: response.data as T,
          status: response.status,
          statusText: response.statusText,
          timestamp: Date.now(),
        };
        this.handleResponse(apiResponse);
        return response;
      },
      error => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );

    return client;
  }

  protected handleError(error: Error | AxiosError): void {
    this.emit('error', error);
    console.error('API Error:', error);
  }

  protected handleResponse(response: ApiResponse<T>): void {
    this.emit('response', response);
  }

  abstract get<U = T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | null>
  ): Promise<U>;
  abstract post<U = T>(endpoint: string, data: U): Promise<U>;
  abstract put<U = T>(endpoint: string, data: U): Promise<U>;
  abstract delete<U = T>(endpoint: string): Promise<U>;
}

// Concrete implementation
export class ApiService<T = any> extends BaseApiService<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();

  get = withRequestCorrelation(
    async <U = T>(
      endpoint: string,
      params?: Record<string, string | number | boolean | null>
    ): Promise<U> => {
      try {
        const response = await this.client.get<U>(endpoint, { params });
        return response.data;
      } catch (error) {
        this.handleError(error as Error);
        throw error;
      }
    }
  );

  post = withRequestCorrelation(async <U = T>(endpoint: string, data: U): Promise<U> => {
    try {
      const response = await this.client.post<U>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  });

  put = withRequestCorrelation(async <U = T>(endpoint: string, data: U): Promise<U> => {
    try {
      const response = await this.client.put<U>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  });

  delete = withRequestCorrelation(async <U = T>(endpoint: string): Promise<U> => {
    try {
      const response = await this.client.delete<U>(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  });

  // Cached get method
  /**
   * Cached GET method with runtime type guard
   * @template U - Type of response data
   */
  async getCached(
    endpoint: string,
    params?: Record<string, string | number | boolean | null>,
    cacheTime = 5 * 60 * 1000
  ): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(params || {})}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cacheTime) {
      if (cached.data !== null && typeof cached.data !== 'undefined') {
        return cached.data;
      }
    }

    const data = await this.get(endpoint, params);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const apiService = new ApiService();

// Export types for use by other services
