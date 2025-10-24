# Prometheus Exporter (Frontend Core)

This helper produces a Prometheus text exposition payload for the in-memory metrics stored by `UnifiedMetrics`. It is intended for local development, smoke tests, and lightweight diagnostics where you want to capture client-side counters, gauges, and histograms without adding a full metrics stack.

## API

```ts
import { getPrometheusText } from '@/core/metrics/prometheus_exporter';

const body = getPrometheusText({
  includeTotals: true,
  timestampMs: Date.now(),
});
```

### Options

| Option          | Type      | Default     | Description                                                                                                                                                                                         |
| --------------- | --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `includeTotals` | `boolean` | `true`      | When enabled, the exporter emits the aggregated totals recorded via `UnifiedMetrics.recordMetric` as standalone counter samples. Disable if you only want per-label counter/gauge/histogram output. |
| `timestampMs`   | `number`  | `undefined` | Optional epoch timestamp appended to each sample. Useful when exposing the exporter through an HTTP handler that adds scrape timestamps.                                                            |

## Output

The exporter emits one `# TYPE` line per metric name followed by samples. Histograms are emitted in a bucket-less format that records `_count` and `_sum` for each label set:

```
# TYPE example_counter counter
example_counter{env="dev"} 4 1696166400000
# TYPE example_gauge gauge
example_gauge 18.5 1696166400000
# TYPE example_histogram histogram
example_histogram_count{stage="beta"} 3 1696166400000
example_histogram_sum{stage="beta"} 7.35 1696166400000
```

## Usage Patterns

1. **Local HTTP endpoint** – add a minimal Vite dev server or Express handler that calls `getPrometheusText()` and returns `text/plain; version=0.0.4` for local scraping.
2. **Smoke / CI checks** – capture the returned string and assert the presence of critical metric names to ensure instrumentation remains healthy.
3. **Ad-hoc debugging** – log the output to the console when investigating client-side performance regressions.

## Notes

- `UnifiedMetrics` respects `TelemetryGate`; ensure telemetry consent is enabled before expecting counters to appear.
- The exporter performs no sampling or redaction. Avoid exposing it in production environments without additional filtering.
- For environments without `UnifiedMetrics` (for example, unit tests that stub the module), guard calls to `getPrometheusText()` behind feature detection.
