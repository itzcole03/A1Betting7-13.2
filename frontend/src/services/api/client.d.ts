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
declare class ApiClient {
  private baseUrl;
  private defaultHeaders;
  constructor();
  private request;
  get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, data?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
}
export declare const apiClient: ApiClient;
export declare const get: <T>(
  endpoint: string,
  config?: ApiRequestConfig
) => Promise<ApiResponse<T>>;
export declare const post: <T>(
  endpoint: string,
  data?: unknown,
  config?: ApiRequestConfig
) => Promise<ApiResponse<T>>;
