/**
 * Unified API Service - Centralized HTTP client for A1Betting Platform
 * Consolidates all API functionality with authentication, retries, and error management
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import EventEmitter from 'eventemitter3';
import { discoverBackend } from './backendDiscovery';

export interface ApiServiceEvents {
  error: (error: Error) => void;
  request: (endpoint: string) => void;
  response: (response: ApiResponse<unknown>) => void;
}

export interface ApiConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  timestamp?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTime?: number;
}

// Abstract base class for API services
export abstract class BaseApiService extends EventEmitter<ApiServiceEvents> {
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
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        this.emit('request', config.url || '');
        return config;
      },
      (error) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    client.interceptors.response.use(
      (response) => {
        const apiResponse: ApiResponse<any> = {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          timestamp: Date.now(),
        };
        this.handleResponse(apiResponse);
        return response;
      },
      (error) => {
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

  protected handleResponse<T>(response: ApiResponse<T>): void {
    this.emit('response', response);
  }

  abstract get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  abstract post<T>(endpoint: string, data: unknown): Promise<T>;
  abstract put<T>(endpoint: string, data: unknown): Promise<T>;
  abstract delete<T>(endpoint: string): Promise<T>;
}

// Concrete implementation
export class ApiService extends BaseApiService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const response = await this.client.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  // Cached get method
  async getCached<T>(endpoint: string, params?: Record<string, unknown>, cacheTime = 5 * 60 * 1000): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(params || {})}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    const data = await this.get<T>(endpoint, params);
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
export type { ApiServiceEvents, ApiConfig, ApiResponse, RequestConfig };
