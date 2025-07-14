import { EventBus } from '@/core/EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { DataSource } from './PredictionEngine';

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

export class DataCache<T> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }>;

  constructor(private defaultTtl: number = 5 * 60 * 1000) {
    this.cache = new Map();
  }

  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export class StreamingDataPipeline<T, U> {
  private readonly metrics: PipelineMetrics;
  private readonly cache: DataCache<T>;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private isRunning: boolean = false;
  private processInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly source: DataSource,
    private readonly stages: PipelineStage<any, any>[],
    private readonly sink: DataSink<U>,
    private readonly options: {
      cacheEnabled: boolean;
      cacheTtl?: number;
      processingInterval?: number;
      retryAttempts?: number;
      batchSize?: number;
    } = {
      cacheEnabled: true,
      cacheTtl: 5 * 60 * 1000,
      processingInterval: 1000,
      retryAttempts: 3,
      batchSize: 100,
    }
  ) {
    this.metrics = {
      processedCount: 0,
      errorCount: 0,
      averageLatency: 0,
      lastProcessed: 0,
      throughput: 0,
    };
    this.cache = new DataCache<T>(options.cacheTtl);
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.processInterval = setInterval(() => this.process(), this.options.processingInterval);

    this.eventBus.publish('pipeline:started', {
      sourceId: this.source.id,
      sinkId: this.sink.id,
      timestamp: Date.now(),
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    if (this.sink.flush) {
      await this.sink.flush();
    }

    this.eventBus.publish('pipeline:stopped', {
      sourceId: this.source.id,
      sinkId: this.sink.id,
      timestamp: Date.now(),
      metrics: this.metrics,
    });
  }

  private async process(): Promise<void> {
    const traceId = this.performanceMonitor.startTrace('pipeline-processing');

    try {
      // Fetch data from source
      const data = await this.source.fetch();
      let duration = 0;
      if (this.options.cacheEnabled) {
        const cached = this.cache.get(this.generateCacheKey(data as T));
        if (cached) {
          this.performanceMonitor.endTrace(traceId);
          return;
        }
        this.cache.set(this.generateCacheKey(data as T), data as T);
      }

      let transformed = data;
      for (const stage of this.stages) {
        try {
          let isValid = true;
          const stageTraceId = this.performanceMonitor.startTrace('stage-processing');
          if (stage.validate) {
            isValid = await stage.validate(transformed);
            if (!isValid) {
              throw new Error(`Validation failed at stage ${stage.id}`);
            }
          }

          transformed = await stage.transform(transformed);
          this.performanceMonitor.endTrace(stageTraceId);
        } catch (error) {
          this.performanceMonitor.endTrace(stageTraceId, error as Error);
          throw error;
        }
      }

      const start = Date.now();
      await this.sink.write(transformed as U);
      duration = Date.now() - start;

      this.updateMetrics(duration);

      // Commented out eventBus.publish if not available
      if (typeof this.eventBus.publish === 'function') {
        this.eventBus.publish('pipeline:processed', {
          sourceId: this.source.id,
          sinkId: this.sink.id,
          duration,
          timestamp: Date.now(),
        });
      }

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.metrics.errorCount++;
      this.performanceMonitor.endTrace(traceId, error as Error);
      if (typeof this.eventBus.publish === 'function') {
        this.eventBus.publish('pipeline:error', {
          sourceId: this.source.id,
          sinkId: this.sink.id,
          error: error as Error,
          timestamp: Date.now(),
        });
      }
    }
  }

  private generateCacheKey(data: T): string {
    return `${this.source.id}-${JSON.stringify(data)}`;
  }

  private updateMetrics(duration: number): void {
    this.metrics.processedCount++;
    this.metrics.lastProcessed = Date.now();
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.processedCount - 1) + duration) /
      this.metrics.processedCount;
    this.metrics.throughput =
      this.metrics.processedCount / ((Date.now() - this.metrics.lastProcessed) / 1000);
  }

  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }
}
