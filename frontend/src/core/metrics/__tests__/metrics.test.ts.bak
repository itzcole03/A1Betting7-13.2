import { exportPrometheus, getMetrics } from '../metrics';

describe('core/metrics/metrics', () => {
  const metrics = getMetrics();

  beforeEach(() => {
    metrics.reset();
  });

  it('records counter increments with labels and aggregates totals', () => {
    metrics.increment('requests_total', 2, { route: '/health' });
    metrics.increment('requests_total', undefined, { route: '/health' });

    const snapshot = metrics.getSnapshot();
    expect(snapshot.totals.requests_total).toBe(3);
    expect(snapshot.counters.requests_total).toBeDefined();
    expect(snapshot.counters.requests_total['route=/health']).toBe(3);
  });

  it('captures timing using the high-resolution clock when available', () => {
    const hasPerformance = typeof globalThis.performance !== 'undefined';
    if (!hasPerformance) {
      (globalThis as { performance?: Performance }).performance = {
        now: () => Date.now(),
      } as Performance;
    }

    const nowSpy = jest
      .spyOn(globalThis.performance, 'now')
      .mockReturnValueOnce(50)
      .mockReturnValueOnce(125);

    const result = metrics.time('timed_operation', () => 'done', { method: 'GET' });
    expect(result).toBe('done');

    const snapshot = metrics.getSnapshot();
    const entry = snapshot.histograms.timed_operation['method=GET'];
    expect(entry.count).toBe(1);
    expect(entry.sum).toBeCloseTo(75, 5);

    nowSpy.mockRestore();

    if (!hasPerformance) {
      delete (globalThis as { performance?: Performance }).performance;
    }
  });

  it('creates defensive copies for snapshots and supports reset', () => {
    metrics.gauge('memory_usage', 42, { host: 'web' });
    metrics.histogram('latency_ms', 12);

    const snapshot = metrics.getSnapshot();
    snapshot.gauges.memory_usage['host=web'] = 0;
    snapshot.histograms.latency_ms.__no_labels__.sum = 0;

    const fresh = metrics.getSnapshot();
    expect(fresh.gauges.memory_usage['host=web']).toBe(42);
    expect(fresh.histograms.latency_ms.__no_labels__.sum).toBe(12);

    metrics.reset();
    const cleared = metrics.getSnapshot();
    expect(cleared.totals).toEqual({});
    expect(cleared.counters).toEqual({});
  });

  it('exports empty string for Prometheus text in browser-like environments', () => {
    expect(exportPrometheus()).toBe('');
  });
});
