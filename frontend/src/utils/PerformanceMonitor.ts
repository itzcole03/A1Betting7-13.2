// Performance monitoring utility for Jest/RTL

import { PerformanceSpan, PerformanceTrace } from '../types/global';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private traces: Map<string, PerformanceTrace> = new Map();
  private spans: Map<string, PerformanceSpan> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startTrace(label: string, metadata?: Record<string, unknown>): string {
    const traceId = `${label}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const trace: PerformanceTrace = {
      id: traceId,
      name: label,
      startTime: Date.now(),
      metadata,
    };
    this.traces.set(traceId, trace);
    return traceId;
  }

  public endTrace(traceId: string, error?: Error): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.endTime = Date.now();
      if (error) {
        trace.metadata = { ...trace.metadata, error: error.message };
      }
      // In a real app, you would log/report the completed trace
      this.traces.delete(traceId);
    }
  }

  public startSpan(traceId: string, label: string, metadata?: Record<string, unknown>): string {
    const spanId = `${label}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const span: PerformanceSpan = {
      id: spanId,
      traceId,
      name: label,
      startTime: Date.now(),
      metadata,
    };
    this.spans.set(spanId, span);
    return spanId;
  }

  public endSpan(spanId: string, error?: Error): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      if (error) {
        span.metadata = { ...span.metadata, error: error.message };
      }
      // In a real app, you would log/report the completed span
      this.spans.delete(spanId);
    }
  }
}

export async function measurePerformance(fn: () => Promise<void>, label: string) {
  const monitor = PerformanceMonitor.getInstance();
  const traceId = monitor.startTrace(label);
  try {
    await fn();
    monitor.endTrace(traceId);
  } catch (error) {
    monitor.endTrace(traceId, error as Error);
    throw error;
  }
}
