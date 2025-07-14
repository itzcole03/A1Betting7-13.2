import { AxiosInstance, AxiosRequestConfig } from 'axios.ts';
export declare abstract class ApiBase {
  protected client: AxiosInstance;
  protected baseUrl: string;
  protected apiKey?: string;
  protected maxRetries: number;
  protected retryDelay: number;
  constructor(baseUrl: string, apiKey?: string);
  protected request<T>(config: AxiosRequestConfig, attempt?: number): Promise<T>;
  protected logError(error: any, config: AxiosRequestConfig): void;
}
