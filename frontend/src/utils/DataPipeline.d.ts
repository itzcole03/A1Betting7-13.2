import { DataSource } from './PredictionEngine.ts';
export interface PipelineMetrics {
  processedCount: number;
  errorCount: number;
  averageLatency: number;
  lastProcessed: number;
  throughput: number;
}
export interface PipelineStage<T, U> {
  id: string;
  transform(data: T): Promise<U>;
  validate?(data: T): Promise<boolean>;
  cleanup?(data: T): Promise<void>;
}
export interface DataSink<T> {
  id: string;
  write(data: T): Promise<void>;
  flush?(): Promise<void>;
}
export declare class DataCache<T> {
  private defaultTtl;
  private cache;
  constructor(defaultTtl?: number);
  set(key: string, data: T, ttl?: number): void;
  get(key: string): T | undefined;
  clear(): void;
}
export declare class StreamingDataPipeline<T, U> {
  private readonly source;
  private readonly stages;
  private readonly sink;
  private readonly options;
  private readonly metrics;
  private readonly cache;
  private readonly eventBus;
  private readonly performanceMonitor;
  private isRunning;
  private processInterval;
  constructor(
    source: DataSource,
    stages: PipelineStage<any, any>[],
    sink: DataSink<U>,
    options?: {
      cacheEnabled: boolean;
      cacheTtl?: number;
      processingInterval?: number;
      retryAttempts?: number;
      batchSize?: number;
    }
  );
  start(): Promise<void>;
  stop(): Promise<void>;
  private process;
  private generateCacheKey;
  private updateMetrics;
  getMetrics(): PipelineMetrics;
}
