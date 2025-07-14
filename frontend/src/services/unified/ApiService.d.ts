// import type { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
export interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: number;
}
export interface ApiServiceConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
}
export interface ApiServiceEvents {
  error: (error: Error) => void;
  request: (endpoint: string) => void;
  response: (response: ApiResponse<unknown>) => void;
}
export declare abstract class BaseApiService extends EventEmitter<ApiServiceEvents> {
  protected readonly client: any;
  protected readonly config: ApiServiceConfig;
  constructor(config: ApiServiceConfig);
  protected abstract initializeClient(): any;
  protected abstract handleError(error: Error): void;
  protected abstract handleResponse<T>(response: ApiResponse<T>): void;
  abstract get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T>;
  abstract post<T>(endpoint: string, data: unknown): Promise<T>;
}
