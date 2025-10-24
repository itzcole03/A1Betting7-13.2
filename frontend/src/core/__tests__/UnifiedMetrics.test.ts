import { resetTelemetryGate, setTelemetryConsent } from '../TelemetryGate';
import UnifiedMetrics, { CounterMetricEvent, MetricsEvent } from '../UnifiedMetrics';

const getMetricsInstance = () => UnifiedMetrics.getInstance();

describe('UnifiedMetrics runtime', () => {
  beforeEach(() => {
    getMetricsInstance().resetMetrics();
    resetTelemetryGate(true);
  });

  afterEach(() => {
    getMetricsInstance().resetMetrics();
    resetTelemetryGate(true);
  });

  it('records counters, gauges, and histograms with label-aware snapshots', () => {
    const metrics = getMetricsInstance();
    const counter = metrics.counter('test_counter');
    counter.inc(2, { region: 'us' });
    counter.inc(3, { region: 'us' });

    const gauge = metrics.gauge('test_gauge');
    gauge.set(5);
    gauge.inc(4);

    const histogram = metrics.histogram('test_hist');
    histogram.observe(2, { bucket: 'fast' });
    histogram.observe(6, { bucket: 'fast' });

    const countersSnapshot = metrics.getCountersSnapshot();
    expect(countersSnapshot.test_counter).toBeDefined();
    expect(countersSnapshot.test_counter['region=us']).toBe(5);

    const gaugesSnapshot = metrics.getGaugesSnapshot();
    expect(gaugesSnapshot.test_gauge['__no_labels__']).toBe(9);

    const histSnapshot = metrics.getHistogramsSnapshot();
    expect(histSnapshot.test_hist['bucket=fast']).toEqual({ count: 2, sum: 8 });

    // mutating the snapshot should not affect internal state
    countersSnapshot.test_counter['region=us'] = 0;
    expect(metrics.getCountersSnapshot().test_counter['region=us']).toBe(5);
  });

  it('skips metric collection when telemetry consent is disabled', () => {
    const metrics = getMetricsInstance();
    setTelemetryConsent(false);

    metrics.counter('blocked').inc();
    metrics.gauge('blocked_gauge').set(42);
    metrics.histogram('blocked_hist').observe(3);

    expect(metrics.getMetrics()).toEqual({});
    const countersSnapshot = metrics.getCountersSnapshot();
    const gaugesSnapshot = metrics.getGaugesSnapshot();
    const histSnapshot = metrics.getHistogramsSnapshot();

    expect(Object.values(countersSnapshot).every(entry => Object.keys(entry).length === 0)).toBe(
      true
    );
    expect(Object.values(gaugesSnapshot).every(entry => Object.keys(entry).length === 0)).toBe(
      true
    );
    expect(Object.values(histSnapshot).every(entry => Object.keys(entry).length === 0)).toBe(true);

    setTelemetryConsent(true);
  });

  it('records operation durations and error counts', () => {
    const metrics = getMetricsInstance();

    metrics.startOperation('load_data');
    metrics.endOperation('load_data', new Error('boom'));

    const totals = metrics.getMetrics();
    expect(Object.prototype.hasOwnProperty.call(totals, 'load_data.duration_ticks')).toBe(true);
    expect(totals['load_data.errors']).toBe(1);
  });

  it('notifies bound exporters and supports unbinding', () => {
    const metrics = getMetricsInstance();
    const seen: MetricsEvent[] = [];

    const unbind = metrics.bindExporter({
      onEvent: event => {
        if (event.type !== 'total') {
          seen.push(event);
        }
      },
    });

    metrics.counter('exported').inc(3, { env: 'test' });

    expect(seen).toHaveLength(1);
    const event = seen[0] as CounterMetricEvent;
    expect(event.type).toBe('counter');
    expect(event.delta).toBe(3);
    expect(event.total).toBe(3);
    expect(event.labels).toEqual({ env: 'test' });

    unbind();
    metrics.counter('exported').inc(1);
    expect(seen).toHaveLength(1);
  });

  it('exposes a safe Prometheus binding hook respecting enablement flags', () => {
    const metrics = getMetricsInstance();

    const disabledUnbind = metrics.bindPrometheusExporter(
      {
        onCounter: jest.fn(),
      },
      { enabled: false }
    );
    expect(typeof disabledUnbind).toBe('function');
    metrics.counter('ignored').inc();
    disabledUnbind();

    const names: string[] = [];
    const enabledUnbind = UnifiedMetrics.bindPrometheusExporter(
      () => ({
        onCounter: event => names.push(event.name),
      }),
      { enabled: true }
    );

    metrics.counter('prometheus').inc(1);
    expect(names).toEqual(['prometheus']);

    enabledUnbind();
    metrics.counter('prometheus').inc(1);
    expect(names).toEqual(['prometheus']);
  });
});
