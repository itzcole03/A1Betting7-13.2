const fs = require('fs');
const path = require('path');

function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function resolveThresholds(thresholdsPath) {
  const defaults = { quickcheck_max_time_ms: 2000 };
  const resolved = thresholdsPath || path.resolve(__dirname, '..', 'ci_thresholds.baseline.json');
  if (!fs.existsSync(resolved)) return defaults;
  const loaded = loadJsonFile(resolved);
  if (!loaded || typeof loaded !== 'object') return defaults;
  return {
    quickcheck_max_time_ms:
      typeof loaded.quickcheck_max_time_ms === 'number'
        ? loaded.quickcheck_max_time_ms
        : defaults.quickcheck_max_time_ms,
    cache_hit_rate_min:
      typeof loaded.cache_hit_rate_min === 'number' ? loaded.cache_hit_rate_min : undefined,
    logger_flush_max_time_ms:
      typeof loaded.logger_flush_max_time_ms === 'number'
        ? loaded.logger_flush_max_time_ms
        : undefined,
  };
}

function readJsQuickcheckDuration(report) {
  const jsQuickcheck = report.results && report.results.js_quickcheck;
  if (!jsQuickcheck) return null;
  if (typeof jsQuickcheck.durationMs === 'number') return jsQuickcheck.durationMs;
  if (typeof jsQuickcheck.durationSeconds === 'number') return jsQuickcheck.durationSeconds * 1000;
  return null;
}

function extractMetric(report, key) {
  if (!report.metrics || typeof report.metrics !== 'object') return null;
  const raw = report.metrics[key];
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'value' in raw && typeof raw.value === 'number') {
    return raw.value;
  }
  return null;
}

function evaluateReport(file, report, thresholds) {
  const checks = [];

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
    };
  }

  const jsQuickcheck = report.results ? report.results.js_quickcheck : null;
  if (!jsQuickcheck || typeof jsQuickcheck.exitCode !== 'number') {
    checks.push({ name: 'js_quickcheck.exit_code', ok: false, reason: 'missing' });
  } else {
    const exitOk = jsQuickcheck.exitCode === 0;
    checks.push({
      name: 'js_quickcheck.exit_code',
      ok: exitOk,
      value: jsQuickcheck.exitCode,
      reason: exitOk ? undefined : 'non-zero-exit',
    });
  }

  const duration = readJsQuickcheckDuration(report);
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
    checks.push({ name: 'js_quickcheck.duration_ms', ok: false, reason: 'missing' });
  }

  const cacheHitRate = extractMetric(report, 'cache_hit_rate');
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
    checks.push({ name: 'metrics.cache_hit_rate', ok: true, value: cacheHitRate });
  }

  const loggerFlush = extractMetric(report, 'logger_flush_time_ms');
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
    checks.push({ name: 'metrics.logger_flush_time_ms', ok: true, value: loggerFlush });
  }

  if (Array.isArray(report.checks)) {
    for (const raw of report.checks) {
      if (!raw || typeof raw.name !== 'string') continue;
      checks.push({ name: `report.checks.${raw.name}`, ok: Boolean(raw.ok) });
    }
  }

  const ok = checks.every(check => check.ok !== false);
  return { file, ok, checks, rawReport: report };
}

function checkMetricsReports(files, options = {}) {
  const thresholds = resolveThresholds(options.thresholdsPath);
  const results = [];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      results.push({
        file,
        ok: false,
        checks: [{ name: 'report.exists', ok: false, reason: 'missing' }],
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

function runCli(argv) {
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

module.exports = {
  checkMetricsReports,
  evaluateReport,
  runCli,
};
