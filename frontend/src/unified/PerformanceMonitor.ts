import { ComponentMetrics, PerformanceMetrics } from '../../types/core';
import { ErrorHandler } from './ErrorHandler.js';

interface MetricData {
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class PerformanceMonitor {
  /**
   * Start a new performance trace (using browser Performance API)
   */
  public startTrace(name: string, metadata?: Record<string, unknown>): string {
    const _mark = `${name}-start-${Date.now()}`;
    performance.mark(_mark);
    return _mark;
  }

  /**
   * Start a new span within a trace;
   */
  public startSpan(traceId: string, name: string, metadata?: Record<string, unknown>): string {
    const _mark = `${traceId}-${name}-span-${Date.now()}`;
    performance.mark(_mark);
    return _mark;
  }

  /**
   * End a span and log duration;
   */
  public endSpan(spanId: string, error?: Error): void {
    const _endMark = `${spanId}-end-${Date.now()}`;
    performance.mark(_endMark);
    performance.measure(spanId, spanId, _endMark);
    if (error) {
      // Optionally log error
    }
  }

  /**
   * End a trace and log duration;
   */
  public endTrace(traceId: string, error?: Error): void {
    const _endMark = `${traceId}-end-${Date.now()}`;
    performance.mark(_endMark);
    performance.measure(traceId, traceId, _endMark);
    if (error) {
      // Optionally log error
    }
  }

  private static instance: PerformanceMonitor;
  private readonly errorHandler: ErrorHandler;
  private metrics: Map<string, MetricData[]>;
  private readonly maxMetricsPerType: number;
  private componentMetrics: Map<string, ComponentMetrics>;
  private readonly maxHistorySize: number;
  private history: PerformanceMetrics[];

  private constructor() {
    this.errorHandler = ErrorHandler.getInstance();
    this.metrics = new Map();
    this.maxMetricsPerType = 1000; // Keep last 1000 metrics per type
    this.componentMetrics = new Map();
    this.maxHistorySize = 1000;
    this.history = [];
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public trackMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    try {
      const _metricData: MetricData = {
        value,
        timestamp: Date.now(),
        // metadata
      };

      let _metricsArr = this.metrics.get(name);
      if (!_metricsArr) {
        _metricsArr = [];
        this.metrics.set(name, _metricsArr);
      }

      _metricsArr.push(_metricData);

      // Keep only the last maxMetricsPerType metrics;
      if (_metricsArr.length > this.maxMetricsPerType) {
        _metricsArr.shift();
      }
    } catch (error) {
      this.errorHandler.handleError(error as Error, 'performance_monitoring');
    }
  }

  public getMetrics(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  public getAverageMetric(name: string, timeWindow?: number): number {
    const _metricsArr = this.metrics.get(name) || [];
    if (_metricsArr.length === 0) return 0;
    const _now = Date.now();
    const _relevantMetrics = timeWindow
      ? _metricsArr.filter(m => _now - m.timestamp <= timeWindow)
      : _metricsArr;
    if (_relevantMetrics.length === 0) return 0;
    const _sum = _relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return _sum / _relevantMetrics.length;
  }

  public clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      timestamp: Date.now(),
      cpu: {
        usage: 0,
        cores: navigator.hardwareConcurrency || 4,
        temperature: 0,
      },
      memory: {
        total: 0,
        used: 0,
        free: 0,
        swap: 0,
      },
      network: {
        bytesIn: 0,
        bytesOut: 0,
        connections: 0,
        latency: 0,
      },
      disk: {
        total: 0,
        used: 0,
        free: 0,
        iops: 0,
      },
      responseTime: {
        avg: 0,
        p95: 0,
        p99: 0,
      },
      throughput: {
        requestsPerSecond: 0,
        transactionsPerSecond: 0,
      },
      errorRate: 0,
      uptime: 0,
    };
  }

  public startMonitoring(): void {
    // Start collecting metrics;
    this.collectMetrics();
    setInterval(() => this.collectMetrics(), 1000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const _metrics = await this.gatherMetrics();
      this.updateMetrics(_metrics);
      this.addToHistory(_metrics);
    } catch (error) {
      // console statement removed
    }
  }

  private async gatherMetrics(): Promise<PerformanceMetrics> {
    const _metrics = this.initializeMetrics();
    _metrics.timestamp = Date.now();
    // Collect CPU metrics;
    if (performance.now) {
      const _start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 0));
      const _end = performance.now();
      _metrics.cpu.usage = (_end - _start) / 1000;
    }
    // Collect memory metrics;
    if (performance.memory) {
      _metrics.memory = {
        total: performance.memory.totalJSHeapSize,
        used: performance.memory.usedJSHeapSize,
        free: performance.memory.totalJSHeapSize - performance.memory.usedJSHeapSize,
        swap: 0,
      };
    }
    // Collect network metrics;
    if (navigator.connection) {
      _metrics.network.latency = navigator.connection.rtt || 0;
    }
    return _metrics;
  }

  private updateMetrics(metrics: PerformanceMetrics): void {
    this.metrics.set('system', [
      { value: metrics.cpu.usage, timestamp: metrics.timestamp },
      { value: metrics.memory.used, timestamp: metrics.timestamp },
      { value: metrics.network.latency, timestamp: metrics.timestamp },
    ]);
  }

  private addToHistory(metrics: PerformanceMetrics): void {
    this.history.push(metrics);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  public updateComponentMetrics(componentId: string, metrics: Partial<ComponentMetrics>): void {
    const _currentMetrics = this.componentMetrics.get(componentId) || {
      renderCount: 0,
      renderTime: 0,
      memoryUsage: 0,
      errorCount: 0,
      lastUpdate: Date.now(),
    };

    this.componentMetrics.set(componentId, {
      ..._currentMetrics,
      ...metrics,
      lastUpdate: Date.now(),
    });
  }

  public getComponentMetrics(componentId: string): ComponentMetrics | undefined {
    return this.componentMetrics.get(componentId);
  }

  public getHistory(): PerformanceMetrics[] {
    return [...this.history];
  }

  public getAverageMetrics(minutes: number = 5): PerformanceMetrics {
    const _now = Date.now();
    const _msWindow = minutes * 60 * 1000;
    const _recentMetrics = this.history.filter(m => _now - m.timestamp <= _msWindow);
    if (_recentMetrics.length === 0) {
      return this.initializeMetrics();
    }
    return {
      timestamp: Date.now(),
      cpu: {
        usage: this.average(_recentMetrics.map(m => m.cpu.usage)),
        cores: this.metrics.get('system')?.find(m => m.metadata?.type === 'cpu')?.value || 4,
        temperature: this.average(_recentMetrics.map(m => m.cpu.temperature)),
      },
      memory: {
        total: this.average(_recentMetrics.map(m => m.memory.total)),
        used: this.average(_recentMetrics.map(m => m.memory.used)),
        free: this.average(_recentMetrics.map(m => m.memory.free)),
        swap: this.average(_recentMetrics.map(m => m.memory.swap)),
      },
      network: {
        bytesIn: this.average(_recentMetrics.map(m => m.network.bytesIn)),
        bytesOut: this.average(_recentMetrics.map(m => m.network.bytesOut)),
        connections: this.average(_recentMetrics.map(m => m.network.connections)),
        latency: this.average(_recentMetrics.map(m => m.network.latency)),
      },
      disk: {
        total: this.average(_recentMetrics.map(m => m.disk.total)),
        used: this.average(_recentMetrics.map(m => m.disk.used)),
        free: this.average(_recentMetrics.map(m => m.disk.free)),
        iops: this.average(_recentMetrics.map(m => m.disk.iops)),
      },
      responseTime: {
        avg: this.average(_recentMetrics.map(m => m.responseTime.avg)),
        p95: this.average(_recentMetrics.map(m => m.responseTime.p95)),
        p99: this.average(_recentMetrics.map(m => m.responseTime.p99)),
      },
      throughput: {
        requestsPerSecond: this.average(_recentMetrics.map(m => m.throughput.requestsPerSecond)),
        transactionsPerSecond: this.average(
          _recentMetrics.map(m => m.throughput.transactionsPerSecond)
        ),
      },
      errorRate: this.average(_recentMetrics.map(m => m.errorRate)),
      uptime: this.average(_recentMetrics.map(m => m.uptime)),
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  public clearHistory(): void {
    this.history = [];
    this.componentMetrics.clear();
  }
}

export default PerformanceMonitor;
