import UnifiedMetricsRuntime, {
  CounterHandle,
  GaugeHandle,
  HistogramHandle,
  HistogramValue,
} from '../UnifiedMetrics';
import getPrometheusText, { PrometheusExportOptions } from './prometheus_exporter';
import type { MetricTags, UnifiedMetrics as MetricsContract, MetricsSnapshot } from './types';

type TimerResult<T> = T | Promise<T>;

const isBrowser = () => typeof window !== 'undefined' && typeof window.document !== 'undefined';

class MetricsRegistry implements MetricsContract {
  private readonly runtime = UnifiedMetricsRuntime.getInstance();
  private readonly counters = new Map<string, CounterHandle>();
  private readonly gauges = new Map<string, GaugeHandle>();
  private readonly histograms = new Map<string, HistogramHandle>();

  public track(name: string, value = 1, tags?: MetricTags): void {
    this.increment(name, value, tags);
  }

  public increment(name: string, value = 1, tags?: MetricTags): void {
    this.getCounter(name).inc(value, this.normalizeTags(tags));
  }

  public gauge(name: string, value: number, tags?: MetricTags): void {
    this.getGauge(name).set(value, this.normalizeTags(tags));
  }

  public timing(name: string, value: number, tags?: MetricTags): void {
    this.getHistogram(name).observe(value, this.normalizeTags(tags));
  }

  public histogram(name: string, value: number, tags?: MetricTags): void {
    this.getHistogram(name).observe(value, this.normalizeTags(tags));
  }

  public time<T>(name: string, fn: () => TimerResult<T>, tags?: MetricTags): TimerResult<T> {
    const start = this.now();
    const finalize = () => {
      const duration = Math.max(this.now() - start, 0);
      this.timing(name, duration, tags);
    };

    try {
      const result = fn();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        return (result as Promise<T>)
          .then(value => {
            finalize();
            return value;
          })
          .catch(error => {
            finalize();
            throw error;
          });
      }

      finalize();
      return result as T;
    } catch (error) {
      finalize();
      throw error;
    }
  }

  public getSnapshot(): MetricsSnapshot {
    return {
      totals: { ...this.runtime.getMetrics() },
      counters: this.cloneNumericSnapshot(this.runtime.getCountersSnapshot()),
      gauges: this.cloneNumericSnapshot(this.runtime.getGaugesSnapshot()),
      histograms: this.cloneHistogramSnapshot(this.runtime.getHistogramsSnapshot()),
    };
  }

  public reset(): void {
    this.runtime.resetMetrics();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  public exportPrometheus(options: PrometheusExportOptions = {}): string {
    if (isBrowser()) return '';
    return getPrometheusText(options);
  }

  private getCounter(name: string): CounterHandle {
    if (!this.counters.has(name)) {
      this.counters.set(name, this.runtime.counter(name));
    }
    return this.counters.get(name)!;
  }

  private getGauge(name: string): GaugeHandle {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, this.runtime.gauge(name));
    }
    return this.gauges.get(name)!;
  }

  private getHistogram(name: string): HistogramHandle {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, this.runtime.histogram(name));
    }
    return this.histograms.get(name)!;
  }

  private normalizeTags(tags?: MetricTags): Record<string, string | number | boolean> {
    if (!tags) return {};
    return { ...tags };
  }

  private now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  private cloneNumericSnapshot(
    source: Record<string, Record<string, number>>
  ): Record<string, Record<string, number>> {
    const clone: Record<string, Record<string, number>> = {};
    for (const [metricName, labelMap] of Object.entries(source)) {
      clone[metricName] = { ...labelMap };
    }
    return clone;
  }

  private cloneHistogramSnapshot(
    source: Record<string, Record<string, HistogramValue>>
  ): Record<string, Record<string, { count: number; sum: number }>> {
    const clone: Record<string, Record<string, { count: number; sum: number }>> = {};
    for (const [metricName, labelMap] of Object.entries(source)) {
      clone[metricName] = {};
      for (const [labelKey, value] of Object.entries(labelMap)) {
        clone[metricName][labelKey] = { count: value.count, sum: value.sum };
      }
    }
    return clone;
  }
}

const registry = new MetricsRegistry();

export function getMetrics(): MetricsRegistry {
  return registry;
}

export function getSnapshot(): MetricsSnapshot {
  return registry.getSnapshot();
}

export function reset(): void {
  registry.reset();
}

export function exportPrometheus(options?: PrometheusExportOptions): string {
  return registry.exportPrometheus(options ?? {});
}

export type { MetricsSnapshot, PrometheusExportOptions } from './types';

export default getMetrics;
