export type DataSourcePriority = 'low' | 'normal' | 'high';

export type DataSourceStatus = 'unknown' | 'disconnected' | 'connecting' | 'ready' | 'error';

export interface DataSourceRequestOptions {
  signal?: AbortSignal;
  refresh?: boolean;
  [key: string]: unknown;
}

export interface DataSourceMetadata {
  id: string;
  type: string;
  priority: DataSourcePriority;
  labels?: Record<string, string>;
  region?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DataSourceHealth {
  status: DataSourceStatus;
  latencyMs?: number;
  lastChecked: number;
  lastError?: string;
  details?: Record<string, unknown>;
}

export interface DataSource<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly priority?: DataSourcePriority;
  fetchData?(options?: DataSourceRequestOptions): Promise<T>;
  fetch?(options?: DataSourceRequestOptions): Promise<T>;
  connect?(): Promise<boolean | void>;
  disconnect?(): Promise<boolean | void>;
  refresh?(): Promise<T>;
  ping?(): Promise<number>;
  getHealth?(): Promise<DataSourceHealth>;
  isConnected?(): boolean;
  getMetadata?(): Record<string, unknown>;
}

export interface NormalizedDataSource<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly priority: DataSourcePriority;
  fetchData(options?: DataSourceRequestOptions): Promise<T>;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  refresh(): Promise<T>;
  ping(): Promise<number>;
  getHealth(): Promise<DataSourceHealth>;
  isConnected(): boolean;
  getMetadata(): DataSourceMetadata;
}

export declare const normalizeDataSource: <T>(source: DataSource<T>) => NormalizedDataSource<T>;

export type CoreNormalizedDataSource<T = unknown> = NormalizedDataSource<T>;
