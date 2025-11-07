/**
 * Data pipeline utilities for processing, transforming, and caching data streams.
 *
 * Includes pipeline metrics, stages, sinks, and a generic cache for data processing workflows.
 *
 * @module utils/DataPipeline
 */
import { EventBus } from '@/core/EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { DataSource } from './PredictionEngine';

/**
 * Metrics for pipeline processing performance.
 */
export interface PipelineMetrics {
  /** Number of items processed */
  processedCount: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Average processing latency (ms) */
  averageLatency: number;
  /** Timestamp of last processed item */
  lastProcessed: number;
  /** Throughput (items/sec) */
  throughput: number;
}

/**
 * A stage in the data pipeline, responsible for transforming and optionally validating or cleaning up data.
 */
export interface PipelineStage<T, U> {
  /** Unique stage identifier */
  id: string;
  /** Transform function for this stage */
  transform(data: T): Promise<U>;
  /** Optional validation function */
  validate?(data: T): Promise<boolean>;
  /** Optional cleanup function */
  cleanup?(data: T): Promise<void>;
}

/**
 * A sink for writing processed data from the pipeline.
 */
export interface DataSink<T> {
  /** Unique sink identifier */
  id: string;
  /** Write function for processed data */
  write(data: T): Promise<void>;
  /** Optional flush function */
  flush?(): Promise<void>;
}

/**
 * Generic cache for storing data with time-to-live (TTL) support.
 */
export class DataCache<T> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }>;

  /**
   * @param defaultTtl Default time-to-live for cache entries (ms)
   */
  constructor(private defaultTtl: number = 5 * 60 * 1000) {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache.
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Optional TTL (ms)
   */
  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });
  }

  get(key: string): T | undefined {
    const _entry = this.cache.get(key);
    if (!_entry) return undefined;

    if (Date.now() - _entry.timestamp > _entry.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return _entry.data;
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
    private readonly stages: PipelineStage<unknown, unknown>[],
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
    const _traceId = this.performanceMonitor.startTrace('pipeline-processing');

    try {
      // Fetch data from source
      const _data = await this.source.fetch();
      let _duration = 0;
      if (this.options.cacheEnabled) {
        const _cached = this.cache.get(this.generateCacheKey(_data as T));
        if (_cached) {
          this.performanceMonitor.endTrace(_traceId);
          return;
        }
        this.cache.set(this.generateCacheKey(_data as T), _data as T);
      }

      let _transformed = _data;
      for (const _stage of this.stages) {
        let _stageTraceId: string | undefined;
        try {
          let _isValid = true;
          _stageTraceId = this.performanceMonitor.startTrace('stage-processing');
          if (_stage.validate) {
            _isValid = await _stage.validate(_transformed);
            if (!_isValid) {
              throw new Error(`Validation failed at stage ${_stage.id}`);
            }
          }

          _transformed = await _stage.transform(_transformed);
          this.performanceMonitor.endTrace(_stageTraceId);
        } catch (error) {
          this.performanceMonitor.endTrace(_stageTraceId as string, error as Error);
          throw error;
        }
      }

      const _start = Date.now();
      await this.sink.write(_transformed as U);
      _duration = Date.now() - _start;

      this.updateMetrics(_duration);

      // Commented out eventBus.publish if not available
      if (typeof this.eventBus.publish === 'function') {
        this.eventBus.publish('pipeline:processed', {
          sourceId: this.source.id,
          sinkId: this.sink.id,
          duration: _duration,
          timestamp: Date.now(),
        });
      }

      this.performanceMonitor.endTrace(_traceId);
    } catch (error) {
      this.metrics.errorCount++;
      this.performanceMonitor.endTrace(_traceId, error as Error);
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
