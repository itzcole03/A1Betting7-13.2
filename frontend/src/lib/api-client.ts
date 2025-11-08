/**
 * Production-grade API client for Next.js.
 * 
 * Best Practices:
 * - Type-safe requests and responses
 * - Error handling with custom errors
 * - Request/response interceptors
 * - Automatic retry logic
 * - Request cancellation
 * - Loading states
 */

import type { ApiResponse, ApiError } from '@/types'

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_TIMEOUT = 30000 // 30 seconds

// ============================================================================
// Custom Errors
// ============================================================================

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: ApiError
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export class NetworkError extends ApiClientError {
  constructor(message: string = 'Network error occurred') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends ApiClientError {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class ValidationError extends ApiClientError {
  constructor(message: string, public errors?: Record<string, string[]>) {
    super(message, 422)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// Types
// ============================================================================

interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: number
  retryDelay?: number
}

interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onResponse?: <T>(response: Response, data: T) => T | Promise<T>
  onError?: (error: Error) => void | Promise<void>
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseURL: string
  private defaultHeaders: HeadersInit
  private interceptors: RequestInterceptor[] = []
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  /**
   * Add request/response interceptor
   */
  use(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor)
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    }
  }

  /**
   * Clear authorization token
   */
  clearAuthToken(): void {
    const { Authorization, ...rest } = this.defaultHeaders as Record<string, string>
    this.defaultHeaders = rest
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    return url
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let modifiedConfig = config

    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        modifiedConfig = await interceptor.onRequest(modifiedConfig)
      }
    }

    return modifiedConfig
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: Response, data: T): Promise<T> {
    let modifiedData = data

    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        modifiedData = await interceptor.onResponse(response, modifiedData)
      }
    }

    return modifiedData
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<void> {
    for (const interceptor of this.interceptors) {
      if (interceptor.onError) {
        await interceptor.onError(error)
      }
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  private async requestWithRetry<T>(
    endpoint: string,
    config: RequestConfig = {},
    attempt: number = 1
  ): Promise<T> {
    const {
      timeout = API_TIMEOUT,
      retry = 3,
      retryDelay = 1000,
      ...fetchConfig
    } = config

    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const requestId = `${endpoint}-${Date.now()}`
      this.abortControllers.set(requestId, controller)

      // Set timeout
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        // Apply interceptors
        const modifiedConfig = await this.applyRequestInterceptors({
          ...fetchConfig,
          signal: controller.signal,
        })

        // Make request
        const url = this.buildURL(endpoint)
        const response = await fetch(url, {
          ...modifiedConfig,
          headers: {
            ...this.defaultHeaders,
            ...modifiedConfig.headers,
          },
        })

        clearTimeout(timeoutId)
        this.abortControllers.delete(requestId)

        // Handle response
        return await this.handleResponse<T>(response)
      } catch (error) {
        clearTimeout(timeoutId)
        this.abortControllers.delete(requestId)
        throw error
      }
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new TimeoutError()
        await this.applyErrorInterceptors(timeoutError)
        throw timeoutError
      }

      // Retry logic for network errors
      if (attempt < retry && this.shouldRetry(error)) {
        await this.delay(retryDelay * attempt)
        return this.requestWithRetry<T>(endpoint, config, attempt + 1)
      }

      // Apply error interceptors
      if (error instanceof Error) {
        await this.applyErrorInterceptors(error)
      }

      throw error
    }
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    const isJSON = contentType?.includes('application/json')

    // Parse response body
    let data: unknown
    if (isJSON) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    // Handle error responses
    if (!response.ok) {
      const apiError: ApiError = isJSON && typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error: ApiError }).error
        : {
            message: typeof data === 'string' ? data : 'An error occurred',
            type: 'UnknownError',
          }

      const error = new ApiClientError(
        apiError.message,
        response.status,
        apiError
      )

      await this.applyErrorInterceptors(error)
      throw error
    }

    // Apply response interceptors
    const modifiedData = await this.applyResponseInterceptors(response, data as T)

    return modifiedData
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      // Retry on 5xx errors and network errors
      return !error.statusCode || error.statusCode >= 500
    }
    return true
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cancel request by endpoint
   */
  cancelRequest(endpoint: string): void {
    for (const [key, controller] of this.abortControllers.entries()) {
      if (key.startsWith(endpoint)) {
        controller.abort()
        this.abortControllers.delete(key)
      }
    }
  }

  /**
   * Cancel all requests
   */
  cancelAllRequests(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort()
    }
    this.abortControllers.clear()
  }

  // ============================================================================
  // HTTP Methods
  // ============================================================================

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...config,
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>(endpoint, {
      ...config,
      method: 'DELETE',
    })
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const apiClient = new ApiClient()

// ============================================================================
// Default Interceptors
// ============================================================================

// Add request ID to all requests
apiClient.use({
  onRequest: (config) => {
    return {
      ...config,
      headers: {
        ...config.headers,
        'X-Request-ID': crypto.randomUUID(),
      },
    }
  },
})

// Log errors in development
if (process.env.NODE_ENV === 'development') {
  apiClient.use({
    onError: (error) => {
      console.error('API Error:', error)
    },
  })
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Unwrap API response
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new ApiClientError(
      response.error?.message || 'Request failed',
      undefined,
      response.error
    )
  }
  return response.data
}

/**
 * Check if error is API client error
 */
export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}
