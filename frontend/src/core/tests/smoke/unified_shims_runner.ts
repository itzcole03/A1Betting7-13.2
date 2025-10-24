import { computeTopConfidence, mergeAlternativeProps } from '../../FeatureComposition';
import guardedImport from '../../GuardedImport/index';
import { LightweightWorkerPool } from '../../LightweightWorkerPool';
import pluginSystem from '../../PluginSystem';
import {
  isPredictionResult,
  normalizePrediction,
  validatePrediction,
} from '../../PredictionValidator';
import { resetTelemetryGate, setTelemetryConsent } from '../../TelemetryGate/index';
import unifiedCache, { CacheCategory } from '../../UnifiedCache/index';
import { getLogger } from '../../UnifiedLogger/index';
import UnifiedMetrics from '../../UnifiedMetrics';
import { UnifiedMonitor } from '../../UnifiedMonitor';
import { createUnifiedState, resetAllState, teardownAllState } from '../../UnifiedState';
import { getPrometheusText } from '../../metrics/prometheus_exporter';

declare const process: { exitCode?: number } | undefined;

interface SmokeResult {
  step: string;
  ok: boolean;
  detail?: string;
}

function logResult(result: SmokeResult) {
  const prefix = result.ok ? '[OK]' : '[FAIL]';
  const detail = result.detail ? ` :: ${result.detail}` : '';
  // eslint-disable-next-line no-console
  console.log(`${prefix} ${result.step}${detail}`);
}

async function runGuardedImportCheck(): Promise<SmokeResult> {
  const fallback = { ok: true } as const;

  const resolved = await guardedImport('./__non_existent_module__', {
    fallback,
    timeoutMs: 50,
  });

  return {
    step: 'guardedImport returns fallback',
    ok: resolved === fallback,
    detail: resolved === fallback ? undefined : `received ${JSON.stringify(resolved)}`,
  };
}

async function main() {
  const logger = getLogger('core-smoke/ts');
  logger.info('Starting TypeScript unified shims smoke run');

  unifiedCache.set(CacheCategory.API_RESPONSES, 'ts-smoke', { pass: true }, 200);
  const cached = unifiedCache.get(CacheCategory.API_RESPONSES, 'ts-smoke') as {
    pass: boolean;
  } | null;
  const cacheResult: SmokeResult = {
    step: 'UnifiedCache set/get',
    ok: Boolean(cached && cached.pass === true),
    detail: cached ? undefined : 'cache miss',
  };
  logResult(cacheResult);
  if (!cacheResult.ok) throw new Error(cacheResult.detail ?? 'cache failure');

  const hasKey = unifiedCache.has(CacheCategory.API_RESPONSES, 'ts-smoke');
  const hasResult: SmokeResult = {
    step: 'UnifiedCache has()',
    ok: hasKey === true,
    detail: hasKey ? undefined : 'has() returned false',
  };
  logResult(hasResult);
  if (!hasResult.ok) throw new Error(hasResult.detail ?? 'has failure');

  unifiedCache.delete(CacheCategory.API_RESPONSES, 'ts-smoke');
  const cleared = unifiedCache.get(CacheCategory.API_RESPONSES, 'ts-smoke');
  const deleteResult: SmokeResult = {
    step: 'UnifiedCache delete()',
    ok: cleared === null,
    detail: cleared === null ? undefined : 'value still present after delete()',
  };
  logResult(deleteResult);
  if (!deleteResult.ok) throw new Error(deleteResult.detail ?? 'delete failure');

  const guardedResult = await runGuardedImportCheck();
  logResult(guardedResult);
  if (!guardedResult.ok) throw new Error(guardedResult.detail ?? 'guardedImport failure');

  const metrics = UnifiedMetrics.getInstance();

  resetTelemetryGate(true);
  metrics.resetMetrics();
  setTelemetryConsent(false);
  metrics.recordMetric('smoke.telemetry.blocked', 1);
  const blockedMetrics = metrics.getMetrics();
  const telemetryBlocked: SmokeResult = {
    step: 'TelemetryGate blocks metrics when consent revoked',
    ok: blockedMetrics['smoke.telemetry.blocked'] === undefined,
    detail:
      blockedMetrics['smoke.telemetry.blocked'] === undefined
        ? undefined
        : `value recorded: ${blockedMetrics['smoke.telemetry.blocked']}`,
  };
  logResult(telemetryBlocked);
  if (!telemetryBlocked.ok) throw new Error(telemetryBlocked.detail ?? 'telemetry gate failure');

  metrics.resetMetrics();
  setTelemetryConsent(true);
  metrics.recordMetric('smoke.telemetry.allowed', 1);
  const allowedMetrics = metrics.getMetrics();
  const telemetryAllowed: SmokeResult = {
    step: 'TelemetryGate allows metrics when consent restored',
    ok: allowedMetrics['smoke.telemetry.allowed'] === 1,
    detail:
      allowedMetrics['smoke.telemetry.allowed'] === 1
        ? undefined
        : `unexpected value: ${allowedMetrics['smoke.telemetry.allowed']}`,
  };
  logResult(telemetryAllowed);
  if (!telemetryAllowed.ok) throw new Error(telemetryAllowed.detail ?? 'telemetry allow failure');

  // Clean up global state for subsequent tests.
  metrics.resetMetrics();
  resetTelemetryGate(true);

  metrics.resetMetrics();
  setTelemetryConsent(true);
  const exporterCounter = metrics.counter('ts_smoke_counter');
  exporterCounter.inc(2, { label: 'value' });
  const exporterGauge = metrics.gauge('ts_smoke_gauge');
  exporterGauge.set(3.14);
  const exporterHistogram = metrics.histogram('ts_smoke_hist');
  exporterHistogram.observe(4.2, { bucket: 'blue' });
  const prometheusText = getPrometheusText({ timestampMs: 42 });
  const prometheusResult: SmokeResult = {
    step: 'Prometheus exporter renders counters/gauges/histograms',
    ok:
      typeof prometheusText === 'string' &&
      prometheusText.includes('# TYPE ts_smoke_counter counter') &&
      prometheusText.includes('ts_smoke_counter{label="value"} 2') &&
      prometheusText.includes('# TYPE ts_smoke_gauge gauge') &&
      prometheusText.includes('ts_smoke_gauge 3.14') &&
      prometheusText.includes('# TYPE ts_smoke_hist histogram') &&
      prometheusText.includes('ts_smoke_hist_count{bucket="blue"} 1') &&
      prometheusText.includes('ts_smoke_hist_sum{bucket="blue"} 4.2'),
    detail: typeof prometheusText === 'string' ? prometheusText : 'exporter returned non-string',
  };
  logResult(prometheusResult);
  if (!prometheusResult.ok) throw new Error('Prometheus exporter failure');

  metrics.resetMetrics();

  let resetHookCalled = false;
  const state = createUnifiedState<{ count: number; flag: boolean }>('ts-smoke-state', {
    initialState: { count: 0, flag: false },
    onReset: () => {
      resetHookCalled = true;
    },
    rehydrate: stored => ({ ...stored, flag: true }),
  });

  let subscriptionCount = 0;
  state.subscribe(current => {
    subscriptionCount = current.count;
  });

  state.setState({ count: 2 });
  const stateAfterSet = state.getState();
  const stateMutation: SmokeResult = {
    step: 'UnifiedState setState applies updates',
    ok: stateAfterSet.count === 2 && subscriptionCount === 2,
    detail:
      stateAfterSet.count === 2 && subscriptionCount === 2
        ? undefined
        : `state=${JSON.stringify(stateAfterSet)}, subscription=${subscriptionCount}`,
  };
  logResult(stateMutation);
  if (!stateMutation.ok) throw new Error(stateMutation.detail ?? 'state set failure');

  state.resetState({ flag: true });
  const stateAfterReset = state.getState();
  const stateReset: SmokeResult = {
    step: 'UnifiedState resetState restores defaults and triggers hook',
    ok: stateAfterReset.count === 0 && stateAfterReset.flag === true && resetHookCalled,
    detail:
      stateAfterReset.count === 0 && stateAfterReset.flag === true && resetHookCalled
        ? undefined
        : `state=${JSON.stringify(stateAfterReset)}, resetHook=${resetHookCalled}`,
  };
  logResult(stateReset);
  if (!stateReset.ok) throw new Error(stateReset.detail ?? 'state reset failure');

  await state.rehydrate(async () => ({ count: 5 }));
  const stateAfterRehydrate = state.getState();
  const stateRehydrate: SmokeResult = {
    step: 'UnifiedState rehydrate merges stored state',
    ok: stateAfterRehydrate.count === 5 && stateAfterRehydrate.flag === true,
    detail:
      stateAfterRehydrate.count === 5 && stateAfterRehydrate.flag === true
        ? undefined
        : `state=${JSON.stringify(stateAfterRehydrate)}`,
  };
  logResult(stateRehydrate);
  if (!stateRehydrate.ok) throw new Error(stateRehydrate.detail ?? 'state rehydrate failure');

  const poolMetrics: Array<{ type: string; active: number; queued: number }> = [];
  const pool = new LightweightWorkerPool({
    maxConcurrency: 2,
    idleTimeoutMs: 25,
    metricsCollector: event => {
      poolMetrics.push({ type: event.type, active: event.active, queued: event.queued });
    },
  });

  let activeWorkers = 0;
  let peakWorkers = 0;
  const workerResults = await Promise.all(
    [0, 1, 2].map(value =>
      pool.runTask(async payload => {
        activeWorkers += 1;
        peakWorkers = Math.max(peakWorkers, activeWorkers);
        await new Promise(resolve => setTimeout(resolve, payload === 0 ? 25 : 10));
        activeWorkers -= 1;
        return payload * 2;
      }, value)
    )
  );

  const concurrencyResult: SmokeResult = {
    step: 'LightweightWorkerPool enforces concurrency limit',
    ok: peakWorkers <= 2 && workerResults.join(',') === '0,2,4',
    detail: peakWorkers <= 2 ? undefined : `peak workers = ${peakWorkers}`,
  };
  logResult(concurrencyResult);
  if (!concurrencyResult.ok)
    throw new Error(concurrencyResult.detail ?? 'worker pool concurrency failure');

  const statsAfterRun = pool.getStats();
  const statsResult: SmokeResult = {
    step: 'LightweightWorkerPool updates stats after completion',
    ok: statsAfterRun.completed >= 3 && statsAfterRun.failed === 0,
    detail:
      statsAfterRun.completed >= 3 && statsAfterRun.failed === 0
        ? undefined
        : `stats=${JSON.stringify(statsAfterRun)}`,
  };
  logResult(statsResult);
  if (!statsResult.ok) throw new Error(statsResult.detail ?? 'worker pool stats failure');

  await new Promise(resolve => setTimeout(resolve, 10));

  const metricsResult: SmokeResult = {
    step: 'LightweightWorkerPool emits metrics events',
    ok:
      poolMetrics.some(event => event.type === 'task_start') &&
      poolMetrics.some(event => event.type === 'task_complete'),
    detail: poolMetrics.length > 0 ? undefined : 'no metrics events captured',
  };
  logResult(metricsResult);
  if (!metricsResult.ok) throw new Error(metricsResult.detail ?? 'worker pool metrics failure');

  let timeoutTriggered = false;
  try {
    await pool.runTask(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 40));
        return 'no-timeout';
      },
      undefined,
      { timeoutMs: 5 }
    );
  } catch (err) {
    timeoutTriggered = err instanceof Error && err.message.toLowerCase().includes('timed out');
  }

  const timeoutResult: SmokeResult = {
    step: 'LightweightWorkerPool enforces timeout option',
    ok: timeoutTriggered,
    detail: timeoutTriggered ? undefined : 'timeout did not trigger as expected',
  };
  logResult(timeoutResult);
  if (!timeoutResult.ok) throw new Error(timeoutResult.detail ?? 'worker pool timeout failure');

  pool.shutdown();

  const predictionNow = () => 1_700_000_000_000;
  const rawPrediction = {
    value: '21.5',
    confidence: '82',
    timestamp: '2025-09-30T12:00:00Z',
    prediction: 'team-win',
    data: { market: 'MLB', team: 'NYM' },
    metadata: { provider: 'smoke-provider' },
    reasons: ['model-alignment'],
  };

  const validation = validatePrediction(rawPrediction, {
    source: 'smoke-test',
    defaultConfidence: 0.25,
    now: predictionNow,
  });

  const predictionNormalization: SmokeResult = {
    step: 'PredictionValidator normalizes prediction payloads',
    ok:
      validation.valid &&
      Math.abs(validation.normalized.value - 21.5) < 1e-6 &&
      Math.abs(validation.normalized.confidence - 0.82) < 1e-6 &&
      validation.normalized.timestamp === Date.parse('2025-09-30T12:00:00Z') &&
      validation.normalized.metadata.provider === 'smoke-provider' &&
      Array.isArray(
        (validation.normalized.metadata.validator as { warnings?: string[] | undefined })?.warnings
      ),
    detail: validation.valid ? undefined : JSON.stringify(validation.errors),
  };
  logResult(predictionNormalization);
  if (!predictionNormalization.ok)
    throw new Error(predictionNormalization.detail ?? 'prediction normalization failure');

  const invalidPayload = validatePrediction(
    { confidence: -5 },
    { source: 'smoke-test', defaultValue: -1, now: predictionNow }
  );
  const predictionValidation: SmokeResult = {
    step: 'PredictionValidator flags missing value',
    ok: !invalidPayload.valid && invalidPayload.errors.includes('value_missing_or_invalid'),
    detail: invalidPayload.valid ? 'expected invalid payload' : undefined,
  };
  logResult(predictionValidation);
  if (!predictionValidation.ok)
    throw new Error(predictionValidation.detail ?? 'prediction validator failure');

  const numericNormalization = normalizePrediction(12.34, {
    source: 'smoke-test',
    now: predictionNow,
  });
  const numericResult: SmokeResult = {
    step: 'PredictionValidator handles primitive payloads',
    ok:
      isPredictionResult(numericNormalization) &&
      Math.abs(numericNormalization.value - 12.34) < 1e-6 &&
      numericNormalization.confidence === 0,
    detail: JSON.stringify(numericNormalization),
  };
  logResult(numericResult);
  if (!numericResult.ok) throw new Error(numericResult.detail ?? 'prediction primitive failure');

  const baseFeature = Object.freeze({
    id: 'base-prop',
    stat: 'Points',
    line: 23.5,
    confidence: 76,
    alternativeProps: [
      { id: 'alt-existing', stat: 'Points', line: 24.5, confidence: 81 },
      { id: 'alt-low', stat: 'Assists', line: 5, confidence: '0.42' },
    ],
  });

  const mergedFeature = mergeAlternativeProps(baseFeature, [
    { id: 'alt-existing', stat: 'Points', line: '25.5', confidence: 0.92 },
    { stat: 'Rebounds', line: '10.5', confidence: 105 },
  ]);

  const altExisting = mergedFeature.alternativeProps.find(alt => alt.id === 'alt-existing');
  const altRebounds = mergedFeature.alternativeProps.find(alt => alt.stat === 'Rebounds');
  const altAssist = mergedFeature.alternativeProps.find(alt => alt.stat === 'Assists');

  const featureCompositionResult: SmokeResult = {
    step: 'FeatureComposition mergeAlternativeProps merges and normalizes alternatives',
    ok:
      baseFeature.alternativeProps?.length === 2 &&
      mergedFeature.alternativeProps.length === 3 &&
      altExisting?.confidence === 92 &&
      altExisting?.line === 25.5 &&
      altRebounds?.id === 'base-prop:Rebounds' &&
      altRebounds?.confidence === 100 &&
      altAssist?.confidence === 42,
    detail: JSON.stringify({
      mergedFeature,
      baseFeature,
    }),
  };
  logResult(featureCompositionResult);
  if (!featureCompositionResult.ok)
    throw new Error(featureCompositionResult.detail ?? 'feature merge failure');

  const topConfidence = computeTopConfidence([
    { confidence: 0.25 },
    { confidence: '88' },
    95,
    { confidence: undefined },
  ]);

  const featureConfidenceResult: SmokeResult = {
    step: 'FeatureComposition computeTopConfidence identifies highest normalized value',
    ok: topConfidence === 95,
    detail: String(topConfidence),
  };
  logResult(featureConfidenceResult);
  if (!featureConfidenceResult.ok)
    throw new Error(featureConfidenceResult.detail ?? 'feature top confidence failure');

  const monitor = UnifiedMonitor.getInstance();
  monitor.clearMetrics();

  const traceId = monitor.startTrace('ts-smoke-monitor', 'smoke', 'ts unified monitor smoke');
  monitor.endTrace(traceId);

  monitor.recordMetric('smoke_counter', 1, {
    type: 'counter',
    help: 'Smoke counter events',
    labels: { runner: 'ts' },
  });
  monitor.recordMetric('smoke_counter', 3, {
    type: 'counter',
    labels: { runner: 'ts' },
  });
  monitor.recordMetric('smoke_gauge', 42.5, { labels: { stage: 'ts' } });
  monitor.recordMetric('smoke_gauge', 45, { labels: { stage: 'ts' } });

  const counterSummary = monitor.getMetricSummary('smoke_counter', { runner: 'ts' });
  const gaugeSummary = monitor.getMetricSummary('smoke_gauge', { stage: 'ts' });

  const monitorAggregate: SmokeResult = {
    step: 'UnifiedMonitor aggregates metrics and statistics',
    ok:
      !!counterSummary &&
      !!gaugeSummary &&
      counterSummary.sum === 4 &&
      counterSummary.count === 2 &&
      counterSummary.max === 3 &&
      counterSummary.type === 'counter' &&
      gaugeSummary.lastValue === 45 &&
      Math.abs(gaugeSummary.min - 42.5) < 1e-6 &&
      gaugeSummary.type === 'gauge',
    detail: JSON.stringify({ counterSummary, gaugeSummary }),
  };
  logResult(monitorAggregate);
  if (!monitorAggregate.ok)
    throw new Error(monitorAggregate.detail ?? 'unified monitor aggregation failure');

  const promOutput = monitor.exportPrometheus({
    metricNamePrefix: 'ts_smoke',
  });

  const monitorProm: SmokeResult = {
    step: 'UnifiedMonitor exports Prometheus text format',
    ok:
      promOutput.includes('# TYPE ts_smoke_smoke_counter counter') &&
      promOutput.includes('ts_smoke_smoke_counter{runner="ts"} 4') &&
      promOutput.includes('ts_smoke_smoke_gauge{stage="ts"} 45'),
    detail: promOutput,
  };
  logResult(monitorProm);
  if (!monitorProm.ok)
    throw new Error(monitorProm.detail ?? 'unified monitor prometheus export failure');

  monitor.clearMetrics();

  pluginSystem.reset({ reason: 'smoke-setup' });
  const lifecycleEvents: string[] = [];
  const registeredPlugin = pluginSystem.register(
    {
      id: 'smoke-plugin',
      name: 'Smoke Plugin',
      metadata: { version: '1.0.0' },
      setup: context => {
        lifecycleEvents.push(`setup:${context.reason}`);
      },
      onEnable: context => {
        lifecycleEvents.push(`enable:${context.reason}`);
      },
      onDisable: context => {
        lifecycleEvents.push(`disable:${context.reason}`);
      },
      onReset: context => {
        lifecycleEvents.push(`reset:${context.reason}`);
      },
      teardown: context => {
        lifecycleEvents.push(`teardown:${context.reason}`);
      },
    },
    { source: 'ts-smoke' }
  );

  const pluginRegisterResult: SmokeResult = {
    step: 'PluginSystem registers plugin and runs setup',
    ok:
      Boolean(registeredPlugin) &&
      registeredPlugin?.state === 'ready' &&
      lifecycleEvents.includes('setup:register'),
    detail: JSON.stringify({
      plugin: registeredPlugin,
      events: lifecycleEvents,
    }),
  };
  logResult(pluginRegisterResult);
  if (!pluginRegisterResult.ok)
    throw new Error(pluginRegisterResult.detail ?? 'plugin registration failure');

  const pluginEnableResult: SmokeResult = {
    step: 'PluginSystem enables plugin and records lifecycle event',
    ok:
      pluginSystem.enable('smoke-plugin', { source: 'ts-smoke' }) &&
      pluginSystem.isEnabled('smoke-plugin') &&
      lifecycleEvents.includes('enable:enable'),
    detail: JSON.stringify({
      plugin: pluginSystem.getPlugin('smoke-plugin'),
      events: lifecycleEvents,
    }),
  };
  logResult(pluginEnableResult);
  if (!pluginEnableResult.ok) throw new Error(pluginEnableResult.detail ?? 'plugin enable failure');

  const pluginDisableResult: SmokeResult = {
    step: 'PluginSystem disables plugin and records lifecycle event',
    ok:
      pluginSystem.disable('smoke-plugin', { source: 'ts-smoke' }) &&
      !pluginSystem.isEnabled('smoke-plugin') &&
      lifecycleEvents.includes('disable:disable'),
    detail: JSON.stringify({
      plugin: pluginSystem.getPlugin('smoke-plugin'),
      events: lifecycleEvents,
    }),
  };
  logResult(pluginDisableResult);
  if (!pluginDisableResult.ok)
    throw new Error(pluginDisableResult.detail ?? 'plugin disable failure');

  pluginSystem.reset({ reason: 'smoke-reset', source: 'ts-smoke' });
  const pluginResetResult: SmokeResult = {
    step: 'PluginSystem reset clears registry and fires lifecycle hooks',
    ok:
      pluginSystem.getRegisteredIds().length === 0 &&
      lifecycleEvents.includes('reset:smoke-reset') &&
      lifecycleEvents.includes('teardown:smoke-reset'),
    detail: JSON.stringify({ events: lifecycleEvents }),
  };
  logResult(pluginResetResult);
  if (!pluginResetResult.ok) throw new Error(pluginResetResult.detail ?? 'plugin reset failure');

  resetAllState();
  teardownAllState();

  logger.info('Unified logger emitted structured message', { component: 'core-smoke/ts' });
  logger.info('TypeScript unified shims smoke succeeded');

  if (typeof process !== 'undefined') {
    process.exitCode = 0;
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error('[core-smoke/ts] failure', err instanceof Error ? err.stack : err);
  if (typeof process !== 'undefined') process.exitCode = process.exitCode ?? 1;
});
