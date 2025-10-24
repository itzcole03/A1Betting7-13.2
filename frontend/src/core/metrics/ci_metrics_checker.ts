import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

export interface Thresholds {
  quickcheck_max_time_ms?: number;
  cache_hit_rate_min?: number;
  logger_flush_max_time_ms?: number;
}

export interface CheckOutcome {
  name: string;
  ok: boolean;
  value?: number | string | boolean | null;
  threshold?: number;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface ReportEvaluation {
  file: string;
  ok: boolean;
  checks: CheckOutcome[];
  rawReport?: unknown;
}

export interface CheckerSummary {
  ok: boolean;
  results: ReportEvaluation[];
  thresholds: Thresholds;
}

interface MetricsReportShape {
  results?: Record<string, { exitCode?: number; durationSeconds?: number; durationMs?: number }>;
  metrics?: Record<string, unknown>;
  checks?: Array<{ name?: string; ok?: boolean }>;
}

function loadJsonFile(filePath: string): unknown {
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function resolveThresholds(thresholdsPath?: string): Thresholds {
  const defaultThresholds: Thresholds = {
    quickcheck_max_time_ms: 2000,
  };

  const resolvedPath =
    thresholdsPath ?? path.resolve(__dirname, '..', 'ci_thresholds.baseline.json');
  if (!existsSync(resolvedPath)) {
    return defaultThresholds;
  }

  const loaded = loadJsonFile(resolvedPath);
  if (!loaded || typeof loaded !== 'object') {
    return defaultThresholds;
  }

  return {
    quickcheck_max_time_ms:
      typeof (loaded as Record<string, unknown>).quickcheck_max_time_ms === 'number'
        ? (loaded as Record<string, number>).quickcheck_max_time_ms
        : defaultThresholds.quickcheck_max_time_ms,
    cache_hit_rate_min:
      typeof (loaded as Record<string, unknown>).cache_hit_rate_min === 'number'
        ? (loaded as Record<string, number>).cache_hit_rate_min
        : undefined,
    logger_flush_max_time_ms:
      typeof (loaded as Record<string, unknown>).logger_flush_max_time_ms === 'number'
        ? (loaded as Record<string, number>).logger_flush_max_time_ms
        : undefined,
  };
}

function toMs(value?: number | null): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function fromSeconds(seconds?: number | null): number | null {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return null;
  return seconds * 1000;
}

function readJsQuickcheckDuration(report: MetricsReportShape): number | null {
  const jsQuickcheck = report.results?.js_quickcheck;
  if (!jsQuickcheck) return null;
  if (typeof jsQuickcheck.durationMs === 'number') {
    return toMs(jsQuickcheck.durationMs);
  }
  return fromSeconds(jsQuickcheck.durationSeconds);
}

function extractMetric(report: MetricsReportShape, key: string): number | null {
  if (!report.metrics || typeof report.metrics !== 'object') return null;
  const direct = (report.metrics as Record<string, unknown>)[key];
  if (typeof direct === 'number') {
    return direct;
  }

  if (typeof direct === 'object' && direct !== null && 'value' in direct) {
    const nestedValue = (direct as Record<string, unknown>).value;
    if (typeof nestedValue === 'number') {
      return nestedValue;
    }
  }

  return null;
}

export function evaluateReport(
  file: string,
  report: unknown,
  thresholds: Thresholds
): ReportEvaluation {
  const checks: CheckOutcome[] = [];

  if (!report || typeof report !== 'object') {
    return {
      file,
      ok: false,
      checks: [
        {
          name: 'report.parse',
          ok: false,
          reason: 'invalid-json',
        },
      ],
      rawReport: report,
    };
  }

  const shape = report as MetricsReportShape;
  const jsQuickcheck = shape.results?.js_quickcheck;
  if (!jsQuickcheck || typeof jsQuickcheck.exitCode !== 'number') {
    checks.push({
      name: 'js_quickcheck.exit_code',
      ok: false,
      reason: 'missing',
    });
  } else {
    const exitOk = jsQuickcheck.exitCode === 0;
    checks.push({
      name: 'js_quickcheck.exit_code',
      ok: exitOk,
      value: jsQuickcheck.exitCode,
      reason: exitOk ? undefined : 'non-zero-exit',
    });
  }

  const duration = readJsQuickcheckDuration(shape);
  if (duration !== null) {
    const threshold = thresholds.quickcheck_max_time_ms;
    const ok = typeof threshold === 'number' ? duration <= threshold : true;
    checks.push({
      name: 'js_quickcheck.duration_ms',
      ok,
      value: duration,
      threshold,
      reason: ok ? undefined : 'duration-exceeded',
    });
  } else {
    checks.push({
      name: 'js_quickcheck.duration_ms',
      ok: false,
      reason: 'missing',
    });
  }

  const cacheHitRate = extractMetric(shape, 'cache_hit_rate');
  if (thresholds.cache_hit_rate_min !== undefined) {
    const ok = cacheHitRate !== null ? cacheHitRate >= thresholds.cache_hit_rate_min : false;
    checks.push({
      name: 'metrics.cache_hit_rate',
      ok,
      value: cacheHitRate,
      threshold: thresholds.cache_hit_rate_min,
      reason: ok ? undefined : cacheHitRate === null ? 'metric-missing' : 'below-threshold',
    });
  } else if (cacheHitRate !== null) {
    checks.push({
      name: 'metrics.cache_hit_rate',
      ok: true,
      value: cacheHitRate,
    });
  }

  const loggerFlush = extractMetric(shape, 'logger_flush_time_ms');
  if (thresholds.logger_flush_max_time_ms !== undefined) {
    const ok = loggerFlush !== null ? loggerFlush <= thresholds.logger_flush_max_time_ms : false;
    checks.push({
      name: 'metrics.logger_flush_time_ms',
      ok,
      value: loggerFlush,
      threshold: thresholds.logger_flush_max_time_ms,
      reason: ok ? undefined : loggerFlush === null ? 'metric-missing' : 'above-threshold',
    });
  } else if (loggerFlush !== null) {
    checks.push({
      name: 'metrics.logger_flush_time_ms',
      ok: true,
      value: loggerFlush,
    });
  }

  if (Array.isArray(shape.checks)) {
    for (const raw of shape.checks) {
      if (!raw || typeof raw.name !== 'string') continue;
      checks.push({
        name: `report.checks.${raw.name}`,
        ok: Boolean(raw.ok),
      });
    }
  }

  const ok = checks.every(check => check.ok !== false);
  return { file, ok, checks, rawReport: report };
}

export function checkMetricsReports(
  files: string[],
  options: { thresholdsPath?: string } = {}
): CheckerSummary {
  const thresholds = resolveThresholds(options.thresholdsPath);
  const results: ReportEvaluation[] = [];

  for (const file of files) {
    if (!existsSync(file)) {
      results.push({
        file,
        ok: false,
        checks: [
          {
            name: 'report.exists',
            ok: false,
            reason: 'missing',
          },
        ],
      });
      continue;
    }

    const parsed = loadJsonFile(file);
    results.push(evaluateReport(file, parsed, thresholds));
  }

  return {
    ok: results.every(result => result.ok),
    results,
    thresholds,
  };
}

export function runCli(argv: string[]): number {
  const args = argv.slice(2).filter(Boolean);
  if (args.length === 0) {
    console.error('Usage: node ci_metrics_checker.js <report1.json> [report2.json ...]');
    return 2;
  }

  const summary = checkMetricsReports(args);
  console.log('ci_metrics_checker results:', JSON.stringify(summary, null, 2));
  return summary.ok ? 0 : 3;
}

if (require.main === module) {
  const exitCode = runCli(process.argv);
  process.exit(exitCode);
}
