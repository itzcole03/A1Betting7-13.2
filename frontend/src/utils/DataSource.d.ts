export interface DataSource<T> {
  id: string;
  fetch(): Promise<T>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getData(): Promise<T>;
  isConnected(): boolean;
  getMetadata(): Record<string, unknown>;
}
export interface DataSourceConfig {
  url: string;
  apiKey?: string;
  options?: Record<string, unknown>;
}
export interface DataSourceMetrics {
  latency: number;
  errorRate: number;
  lastUpdate: number;
  dataQuality: number;
}
