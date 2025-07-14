import { UnifiedLogger } from './UnifiedLogger';
import { UnifiedCache } from './UnifiedCache';
import { UnifiedConfig } from './UnifiedConfig';
import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { UnifiedServiceRegistry } from './UnifiedServiceRegistry';

// Browser-compatible EventEmitter;
class EventEmitter {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface ServiceError {
  code: string;
  source: string;
  details?: any;
}

export abstract class BaseService extends EventEmitter {
  protected config: UnifiedConfig;
  protected logger: UnifiedLogger;
  protected api: AxiosInstance;
  protected cache: UnifiedCache;

  constructor(
    protected readonly name: string,
    protected readonly serviceRegistry: UnifiedServiceRegistry
  ) {
    super();
    this.config = UnifiedConfig.getInstance();
    this.logger = new UnifiedLogger(this.name);
    this.cache = UnifiedCache.getInstance();

    // Initialize API client;
    this.api = axios.create({
      baseURL: this.config.getApiUrl(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        this.logger.error('Response error:', error);
        return Promise.reject(error);
      }
    );
  }

  protected handleError(error: any, serviceError: ServiceError): void {
    this.logger.error(`Error in ${serviceError.source}: ${error.message}`, this.name, {
      error,
      //       serviceError
    });

    // Emit error event;
    this.serviceRegistry.emit('error', {
      ...serviceError,
      error: error.message,
      timestamp: Date.now(),
    });
  }

  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }
    throw lastError;
  }

  protected getCacheKey(...parts: (string | number)[]): string {
    return `${this.name}:${parts.join(':')}`;
  }

  protected async withCache<T>(key: string, operation: () => Promise<T>, ttl?: number): Promise<T> {
    if (cached) return cached;

    this.cache.set(key, result, ttl);
    return result;
  }

  // Lifecycle methods;
  async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.name} service`, this.name);
    // Override in derived classes if needed;
  }

  async cleanup(): Promise<void> {
    this.logger.info(`Cleaning up ${this.name} service`, this.name);
    // Override in derived classes if needed;
  }

  protected async handleRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      this.logger.error('Request failed:', error);
      throw error;
    }
  }
}
