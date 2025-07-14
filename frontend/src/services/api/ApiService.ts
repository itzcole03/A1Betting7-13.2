/**
 * Comprehensive API Service Layer for A1Betting Frontend
 * Provides typed interfaces to all backend endpoints with proper error handling.
 */
import axios, { AxiosError, AxiosResponse } from 'axios';

// Define base URL from environment variables
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
apiClient.interceptors.request.use(
  (config): typeof config => {
    // In a real app, you'd get the token from a state manager or local storage
    const token = localStorage.getItem('auth_token');
    if (token) {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (import.meta.env.DEV) {
      // console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error: any): Promise<never> => {
    // console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      // console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      // window.location.href = '/login';
    }
    // Return a structured error to be handled by the calling code
    return Promise.reject(error.response || error.message);
  }
);

/**
 * A generic and simplified API service for interacting with the backend.
 */
export class ApiService {
  /**
   * Generic GET method for fetching data from an endpoint.
   * @param endpoint - The API endpoint to call (e.g., '/api/v1/predictions').
   * @param params - Optional query parameters.
   * @returns A promise that resolves with the response data.
   */
  static async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await apiClient.get<T>(endpoint, { params });
    return response.data;
  }

  /**
   * Generic POST method for sending data to an endpoint.
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the request body.
   * @returns A promise that resolves with the response data.
   */
  static async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data);
    return response.data;
  }

  /**
   * Generic PUT method for updating data at an endpoint.
   * @param endpoint - The API endpoint to call.
   * @param data - The data to send in the request body.
   * @returns A promise that resolves with the response data.
   */
  static async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await apiClient.put<T>(endpoint, data);
    return response.data;
  }

  /**
   * Generic DELETE method for removing data from an endpoint.
   * @param endpoint - The API endpoint to call.
   * @returns A promise that resolves with the response data.
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<T>(endpoint);
    return response.data;
  }
}

// Export a singleton instance
export const api = ApiService;
export default ApiService;
