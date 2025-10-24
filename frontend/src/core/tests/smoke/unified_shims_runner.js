// Single-file CommonJS smoke runner for core shims
const path = require('path');
const fs = require('fs');

function tryRequire(...parts) {
  const target = path.join(...parts);
  const candidates = [
    target,
    `${target}.js`,
    `${target}.cjs`,
    path.join(target, 'index.js'),
    path.join(target, 'index.cjs'),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch (e) {
      // continue
    }
  }
  // If TS source exists, return marker so caller can skip runtime assert
  const tsCandidates = [`${target}.ts`, path.join(target, 'index.ts')];
  for (const t of tsCandidates) if (fs.existsSync(t)) return { __ts_source: t };
  return null;
}

function exitWith(code) {
  process.exitCode = code;
  if (code !== 0) console.error('[unified_shims_runner] exit', code);
}

async function main() {
  const base = path.resolve(__dirname, '..', '..');

  // Logger
  const loggerMod = tryRequire(base, 'UnifiedLogger');
  let logger = console;
  if (loggerMod && loggerMod.__ts_source) {
    console.log('UnifiedLogger TS source present; skipping runtime logger assertions');
  } else if (loggerMod) {
    const getLogger =
      typeof loggerMod.getLogger === 'function'
        ? loggerMod.getLogger
        : typeof loggerMod === 'function'
        ? loggerMod
        : null;
    if (!getLogger) {
      console.error('UnifiedLogger missing getLogger');
      return exitWith(2);
    }
    logger = getLogger('smoke');
  }

  logger.info && logger.info('Starting unified shims smoke runner');

  // Cache
  const cacheMod = tryRequire(base, 'UnifiedCache');
  if (cacheMod && cacheMod.__ts_source) {
    console.log('UnifiedCache TS source present; skipping runtime cache assertions');
  } else if (cacheMod) {
    try {
      const c = cacheMod.UnifiedCache || cacheMod.default || cacheMod;
      // If module exported a class, instantiate; else assume instance
      const instance = typeof c === 'function' ? new c() : c;
      if (typeof instance.set !== 'function' || typeof instance.get !== 'function') {
        console.error('UnifiedCache missing set/get');
        return exitWith(3);
      }
      instance.set('__qc_smoke', { ok: true }, 1000);
      const v = instance.get('__qc_smoke');
      if (!v || v.ok !== true) {
        console.error('UnifiedCache get returned unexpected value', v);
        return exitWith(4);
      }
      logger.info && logger.info('UnifiedCache runtime smoke OK');
    } catch (e) {
      console.error('UnifiedCache runtime error', e && e.stack ? e.stack : e);
      return exitWith(5);
    }
  }

  // GuardedImport
  const guarded = tryRequire(base, 'GuardedImport');
  if (guarded && guarded.__ts_source) {
    console.log('GuardedImport TS source present; skipping runtime guarded import assertions');
  } else if (guarded) {
    const guardFn = guarded.default || guarded.guard || guarded.guardedImport || guarded;
    if (typeof guardFn !== 'function') {
      console.error('GuardedImport missing function');
      return exitWith(6);
    }
    try {
      // Pass options object { fallback, timeoutMs } which the CJS shim expects
      const maybePromise = guardFn('./non_existent_module_xyz', {
        fallback: { ok: true },
        timeoutMs: 200,
      });
      const res = await Promise.resolve(maybePromise);
      // If the function returned an object with ok true, that's acceptable.
      const ok = res && (res.ok === true || (res.default && res.default.ok === true));
      if (!ok) {
        console.error('GuardedImport did not return expected fallback', res);
        return exitWith(7);
      }
      logger.info && logger.info('GuardedImport runtime smoke OK');
    } catch (err) {
      console.error('GuardedImport runtime error', err && err.stack ? err.stack : err);
      return exitWith(8);
    }
  }

  const telemetry = tryRequire(base, 'TelemetryGate');
  if (telemetry && telemetry.__ts_source) {
    console.log('TelemetryGate TS source present; skipping runtime telemetry assertions');
  } else if (telemetry) {
    const getGate = () => {
      if (telemetry.telemetryGate) return telemetry.telemetryGate;
      const GateClass = telemetry.TelemetryGate || telemetry.default;
      if (GateClass && typeof GateClass.getInstance === 'function') return GateClass.getInstance();
      return null;
    };

    const gate = getGate();
    const setConsent =
      telemetry.setTelemetryConsent || (gate && gate.setConsent && gate.setConsent.bind(gate));
    const resetGate = telemetry.resetTelemetryGate || (gate && gate.reset && gate.reset.bind(gate));

    if (!gate || typeof setConsent !== 'function' || typeof resetGate !== 'function') {
      console.error('TelemetryGate runtime export missing helpers');
      return exitWith(9);
    }

    const metricsMod = tryRequire(base, 'UnifiedMetrics');
    if (metricsMod && !metricsMod.__ts_source) {
      const Metrics = metricsMod.UnifiedMetrics || metricsMod.default || metricsMod;
      if (Metrics && typeof Metrics.getInstance === 'function') {
        const metrics = Metrics.getInstance();
        metrics.resetMetrics && metrics.resetMetrics();
        resetGate(true);
        setConsent(false);
        metrics.recordMetric && metrics.recordMetric('smoke.telemetry.blocked', 1);
        const values = metrics.getMetrics ? metrics.getMetrics() : {};
        if (values && values['smoke.telemetry.blocked'] !== undefined) {
          console.error('TelemetryGate failed to block metrics');
          return exitWith(11);
        }
        resetGate(true);
        metrics.resetMetrics && metrics.resetMetrics();
      }
    }
  }

  const unifiedStateMod = tryRequire(base, 'UnifiedState');
  if (unifiedStateMod && unifiedStateMod.__ts_source) {
    console.log('UnifiedState TS source present; skipping runtime state assertions');
  } else if (unifiedStateMod) {
    const createState = unifiedStateMod.createUnifiedState;
    const resetAll = unifiedStateMod.resetAllState;
    const teardownAll = unifiedStateMod.teardownAllState;

    if (typeof createState !== 'function' || typeof resetAll !== 'function') {
      console.error('UnifiedState runtime export missing helpers');
      return exitWith(12);
    }

    try {
      const state = createState('cjs-smoke-state', { initialState: { value: 0 } });
      if (!state || typeof state.getState !== 'function' || typeof state.setState !== 'function') {
        console.error('UnifiedState returned invalid instance');
        return exitWith(13);
      }

      state.setState({ value: 3 });
      const afterSet = state.getState();
      if (!afterSet || afterSet.value !== 3) {
        console.error('UnifiedState setState failed', afterSet);
        return exitWith(14);
      }

      await state.rehydrate(() => ({ value: 7 }));
      const afterRehydrate = state.getState();
      if (!afterRehydrate || afterRehydrate.value !== 7) {
        console.error('UnifiedState rehydrate failed', afterRehydrate);
        return exitWith(15);
      }

      state.resetState();
      const afterReset = state.getState();
      if (!afterReset || afterReset.value !== 0) {
        console.error('UnifiedState resetState failed', afterReset);
        return exitWith(16);
      }

      resetAll();
      teardownAll && teardownAll();
      logger.info && logger.info('UnifiedState runtime smoke OK');
    } catch (err) {
      console.error('UnifiedState runtime error', err && err.stack ? err.stack : err);
      return exitWith(17);
    }
  }

  const exporterMod = tryRequire(base, 'metrics', 'prometheus_exporter');
  if (exporterMod && exporterMod.__ts_source) {
    console.log('Prometheus exporter TS source present; skipping runtime exporter assertions');
  } else if (exporterMod) {
    const getText =
      exporterMod.getPrometheusText || exporterMod.default || exporterMod.render || exporterMod;
    if (typeof getText !== 'function') {
      console.error('Prometheus exporter missing function export');
      return exitWith(33);
    }

    const metricsMod = tryRequire(base, 'UnifiedMetrics');
    if (metricsMod && metricsMod.__ts_source) {
      console.log('UnifiedMetrics TS source present; skipping exporter runtime assertions');
    } else if (metricsMod) {
      const Metrics = metricsMod.UnifiedMetrics || metricsMod.default || metricsMod;
      if (!Metrics || typeof Metrics.getInstance !== 'function') {
        console.error('UnifiedMetrics runtime export missing getInstance');
        return exitWith(34);
      }

      try {
        const metrics = Metrics.getInstance();
        metrics.resetMetrics && metrics.resetMetrics();
        const counterHandle = metrics.counter ? metrics.counter('cjs_smoke_counter') : null;
        const gaugeHandle = metrics.gauge ? metrics.gauge('cjs_smoke_gauge') : null;
        const histogramHandle = metrics.histogram ? metrics.histogram('cjs_smoke_hist') : null;

        if (!counterHandle || !gaugeHandle || !histogramHandle) {
          console.error('UnifiedMetrics missing counter/gauge/histogram helpers');
          return exitWith(35);
        }

        counterHandle.inc(1, { env: 'smoke' });
        gaugeHandle.set(7.5);
        histogramHandle.observe(2.5, { bucket: 'smoke' });

        const text = getText({ timestampMs: 123 });
        const expectedFragments = [
          '# TYPE cjs_smoke_counter counter',
          'cjs_smoke_counter{env="smoke"} 1',
          '# TYPE cjs_smoke_gauge gauge',
          'cjs_smoke_gauge 7.5',
          '# TYPE cjs_smoke_hist histogram',
          'cjs_smoke_hist_count{bucket="smoke"} 1',
          'cjs_smoke_hist_sum{bucket="smoke"} 2.5',
        ];

        const missingFragment = expectedFragments.find(fragment => !text.includes(fragment));
        if (missingFragment) {
          console.error('Prometheus exporter output missing fragment', missingFragment, text);
          return exitWith(36);
        }

        logger.info && logger.info('Prometheus exporter runtime smoke OK');
      } catch (err) {
        console.error('Prometheus exporter runtime error', err && err.stack ? err.stack : err);
        return exitWith(37);
      }
    }
  }

  const workerPoolMod = tryRequire(base, 'LightweightWorkerPool');
  if (workerPoolMod && workerPoolMod.__ts_source) {
    console.log('LightweightWorkerPool TS source present; skipping runtime worker pool assertions');
  } else if (workerPoolMod) {
    const PoolClass = workerPoolMod.LightweightWorkerPool || workerPoolMod.default || workerPoolMod;

    if (typeof PoolClass !== 'function') {
      console.error('LightweightWorkerPool runtime export invalid');
      return exitWith(18);
    }

    try {
      const metricsEvents = [];
      const pool = new PoolClass({
        maxConcurrency: 2,
        idleTimeoutMs: 25,
        metricsCollector: event => metricsEvents.push(event),
      });

      let activeWorkers = 0;
      let peakWorkers = 0;

      const results = await Promise.all(
        [0, 1, 2].map(value =>
          pool.runTask(async payload => {
            activeWorkers += 1;
            peakWorkers = Math.max(peakWorkers, activeWorkers);
            await new Promise(resolve => setTimeout(resolve, payload === 0 ? 30 : 12));
            activeWorkers -= 1;
            return payload * 2;
          }, value)
        )
      );

      if (peakWorkers > 2) {
        console.error('LightweightWorkerPool exceeded concurrency limit', peakWorkers);
        pool.shutdown && pool.shutdown();
        return exitWith(19);
      }

      if (!results || results.join(',') !== '0,2,4') {
        console.error('LightweightWorkerPool returned unexpected results', results);
        pool.shutdown && pool.shutdown();
        return exitWith(20);
      }

      if (typeof pool.getStats === 'function') {
        const stats = pool.getStats();
        if (!stats || stats.completed < 3 || stats.failed !== 0) {
          console.error('LightweightWorkerPool stats unexpected', stats);
          pool.shutdown && pool.shutdown();
          return exitWith(21);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      if (!metricsEvents.some(event => event && event.type === 'task_start')) {
        console.error('LightweightWorkerPool missing task_start metrics');
        pool.shutdown && pool.shutdown();
        return exitWith(22);
      }

      if (!metricsEvents.some(event => event && event.type === 'task_complete')) {
        console.error('LightweightWorkerPool missing task_complete metrics');
        pool.shutdown && pool.shutdown();
        return exitWith(23);
      }

      let timeoutTriggered = false;
      try {
        await pool.runTask(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 40));
            return 'timeout-fail';
          },
          null,
          { timeoutMs: 5 }
        );
      } catch (err) {
        timeoutTriggered =
          err instanceof Error &&
          typeof err.message === 'string' &&
          err.message.toLowerCase().includes('timed out');
      }

      if (!timeoutTriggered) {
        console.error('LightweightWorkerPool timeout did not trigger');
        pool.shutdown && pool.shutdown();
        return exitWith(24);
      }

      pool.shutdown && pool.shutdown();
      logger.info && logger.info('LightweightWorkerPool runtime smoke OK');
    } catch (err) {
      console.error('LightweightWorkerPool runtime error', err && err.stack ? err.stack : err);
      return exitWith(25);
    }
  }

  const predictionValidatorMod = tryRequire(base, 'PredictionValidator');
  if (predictionValidatorMod && predictionValidatorMod.__ts_source) {
    console.log('PredictionValidator TS source present; skipping runtime validator assertions');
  } else if (predictionValidatorMod) {
    const validate =
      predictionValidatorMod.validatePrediction ||
      predictionValidatorMod.validate ||
      predictionValidatorMod.default ||
      predictionValidatorMod;
    const normalize =
      predictionValidatorMod.normalizePrediction || predictionValidatorMod.normalize || null;

    if (!validate || typeof validate !== 'function') {
      console.error('PredictionValidator missing validate function');
      return exitWith(26);
    }

    try {
      const sample = {
        value: '45.5',
        confidence: '90',
        timestamp: '2025-09-30T00:00:00Z',
        prediction: 'over',
        metadata: { provider: 'cjs-smoke' },
      };

      const validation = await Promise.resolve(validate(sample, { source: 'cjs-smoke' }));
      if (!validation || typeof validation !== 'object') {
        console.error('PredictionValidator validate returned unexpected value', validation);
        return exitWith(27);
      }

      const normalized = validation.normalized || (normalize && normalize(sample));
      if (!normalized || typeof normalized !== 'object') {
        console.error('PredictionValidator normalize returned unexpected value', normalized);
        return exitWith(28);
      }

      const conf = normalized.confidence;
      if (typeof normalized.value !== 'number' || Math.abs(normalized.value - 45.5) > 1e-6) {
        console.error('PredictionValidator normalize failed to coerce value', normalized);
        return exitWith(29);
      }
      if (typeof conf !== 'number' || Math.abs(conf - 0.9) > 1e-6) {
        console.error('PredictionValidator normalize failed to scale confidence', normalized);
        return exitWith(30);
      }
      if (!normalized.metadata || normalized.metadata.provider !== 'cjs-smoke') {
        console.error('PredictionValidator metadata missing provider', normalized);
        return exitWith(31);
      }
      logger.info && logger.info('PredictionValidator runtime smoke OK');
    } catch (err) {
      console.error('PredictionValidator runtime error', err && err.stack ? err.stack : err);
      return exitWith(32);
    }
  }

  const featureCompositionMod = tryRequire(base, 'FeatureComposition');
  if (featureCompositionMod && featureCompositionMod.__ts_source) {
    console.log(
      'FeatureComposition TS source present; skipping runtime feature composition assertions'
    );
  } else if (featureCompositionMod) {
    const merge =
      featureCompositionMod.mergeAlternativeProps ||
      (featureCompositionMod.default && featureCompositionMod.default.mergeAlternativeProps);
    const topConfidence =
      featureCompositionMod.computeTopConfidence ||
      (featureCompositionMod.default && featureCompositionMod.default.computeTopConfidence);

    if (typeof merge !== 'function' || typeof topConfidence !== 'function') {
      console.error('FeatureComposition runtime export missing helpers');
      return exitWith(39);
    }

    try {
      const baseFeature = Object.freeze({
        id: 'base-prop',
        stat: 'Points',
        line: 23.5,
        confidence: 79,
        alternativeProps: [
          { id: 'alt-existing', stat: 'Points', line: 24.5, confidence: 83 },
          { id: 'alt-low', stat: 'Assists', line: 5, confidence: '0.5' },
        ],
      });

      const merged = merge(baseFeature, [
        { id: 'alt-existing', stat: 'Points', line: '25.5', confidence: 0.91 },
        { stat: 'Rebounds', line: '9.5', confidence: 104 },
      ]);

      if (
        !merged ||
        !Array.isArray(merged.alternativeProps) ||
        merged.alternativeProps.length !== 3
      ) {
        console.error('FeatureComposition merge returned unexpected result', merged);
        return exitWith(40);
      }

      if (baseFeature.alternativeProps.length !== 2) {
        console.error('FeatureComposition merge mutated original array');
        return exitWith(41);
      }

      const altExisting = merged.alternativeProps.find(alt => alt.id === 'alt-existing');
      const altRebounds = merged.alternativeProps.find(alt => alt.stat === 'Rebounds');
      const altAssist = merged.alternativeProps.find(alt => alt.stat === 'Assists');

      if (
        !altExisting ||
        altExisting.confidence !== 91 ||
        altExisting.line !== 25.5 ||
        !altRebounds ||
        altRebounds.id !== 'base-prop:Rebounds' ||
        altRebounds.confidence !== 100 ||
        !altAssist ||
        altAssist.confidence !== 50
      ) {
        console.error('FeatureComposition merge normalized data unexpectedly', {
          altExisting,
          altRebounds,
          altAssist,
        });
        return exitWith(40);
      }

      const highest = topConfidence([
        { confidence: 0.3 },
        { confidence: '88' },
        96,
        { confidence: null },
      ]);

      if (highest !== 96) {
        console.error('FeatureComposition computeTopConfidence returned unexpected value', highest);
        return exitWith(42);
      }

      logger.info && logger.info('FeatureComposition runtime smoke OK');
    } catch (err) {
      console.error('FeatureComposition runtime error', err && err.stack ? err.stack : err);
      return exitWith(43);
    }
  }

  const unifiedMonitorMod = tryRequire(base, 'UnifiedMonitor');
  if (unifiedMonitorMod && unifiedMonitorMod.__ts_source) {
    console.log('UnifiedMonitor TS source present; skipping runtime monitor assertions');
  } else if (unifiedMonitorMod) {
    try {
      const resolveInstance = () => {
        if (unifiedMonitorMod.UnifiedMonitor && unifiedMonitorMod.UnifiedMonitor.getInstance) {
          return unifiedMonitorMod.UnifiedMonitor.getInstance();
        }
        if (typeof unifiedMonitorMod.getInstance === 'function') {
          return unifiedMonitorMod.getInstance();
        }
        if (unifiedMonitorMod._unifiedMonitor) {
          return unifiedMonitorMod._unifiedMonitor;
        }
        if (typeof unifiedMonitorMod === 'function' && unifiedMonitorMod.getInstance) {
          return unifiedMonitorMod.getInstance();
        }
        return null;
      };

      const monitor = resolveInstance();
      if (
        !monitor ||
        typeof monitor.recordMetric !== 'function' ||
        typeof monitor.exportPrometheus !== 'function'
      ) {
        console.error('UnifiedMonitor runtime export missing helpers');
        return exitWith(44);
      }

      if (typeof monitor.clearMetrics === 'function') monitor.clearMetrics();
      const traceId =
        typeof monitor.startTrace === 'function'
          ? monitor.startTrace('cjs-smoke-monitor', 'smoke', 'cjs unified monitor smoke')
          : null;
      if (traceId && typeof monitor.endTrace === 'function') {
        monitor.endTrace(traceId);
      }

      monitor.recordMetric('smoke_counter', 1, {
        type: 'counter',
        help: 'Smoke counter events',
        labels: { runner: 'cjs' },
      });
      monitor.recordMetric('smoke_counter', 2, {
        type: 'counter',
        labels: { runner: 'cjs' },
      });
      monitor.recordMetric('smoke_gauge', 10, { labels: { stage: 'cjs' } });
      monitor.recordMetric('smoke_gauge', 12, { labels: { stage: 'cjs' } });

      const counterSummary =
        typeof monitor.getMetricSummary === 'function'
          ? monitor.getMetricSummary('smoke_counter', { runner: 'cjs' })
          : null;
      const gaugeSummary =
        typeof monitor.getMetricSummary === 'function'
          ? monitor.getMetricSummary('smoke_gauge', { stage: 'cjs' })
          : null;

      if (
        !counterSummary ||
        counterSummary.sum !== 3 ||
        counterSummary.count < 2 ||
        counterSummary.type !== 'counter' ||
        !gaugeSummary ||
        gaugeSummary.lastValue !== 12 ||
        gaugeSummary.type !== 'gauge'
      ) {
        console.error('UnifiedMonitor aggregation unexpected', {
          counterSummary,
          gaugeSummary,
        });
        return exitWith(45);
      }

      const promOutput = monitor.exportPrometheus({ metricNamePrefix: 'cjs_smoke' });
      if (
        typeof promOutput !== 'string' ||
        promOutput.indexOf('# TYPE cjs_smoke_smoke_counter counter') === -1 ||
        promOutput.indexOf('cjs_smoke_smoke_counter{runner="cjs"} 3') === -1 ||
        promOutput.indexOf('cjs_smoke_smoke_gauge{stage="cjs"} 12') === -1
      ) {
        console.error('UnifiedMonitor Prometheus export unexpected', promOutput);
        return exitWith(46);
      }

      if (typeof monitor.clearMetrics === 'function') monitor.clearMetrics();
      logger.info && logger.info('UnifiedMonitor runtime smoke OK');
    } catch (err) {
      console.error('UnifiedMonitor runtime error', err && err.stack ? err.stack : err);
      return exitWith(47);
    }
  }

  const pluginSystemMod = tryRequire(base, 'PluginSystem');
  if (pluginSystemMod && pluginSystemMod.__ts_source) {
    console.log('PluginSystem TS source present; skipping runtime plugin assertions');
  } else if (pluginSystemMod) {
    const pluginAPI = pluginSystemMod.PluginSystem ? pluginSystemMod : pluginSystemMod;
    const register = pluginAPI.register || (pluginAPI.default && pluginAPI.default.register);
    const enable = pluginAPI.enable || (pluginAPI.default && pluginAPI.default.enable);
    const disable = pluginAPI.disable || (pluginAPI.default && pluginAPI.default.disable);
    const reset = pluginAPI.reset || (pluginAPI.default && pluginAPI.default.reset);
    const isEnabled = pluginAPI.isEnabled || (pluginAPI.default && pluginAPI.default.isEnabled);
    const getPlugin = pluginAPI.getPlugin || (pluginAPI.default && pluginAPI.default.getPlugin);
    const getRegisteredIds =
      pluginAPI.getRegisteredIds || (pluginAPI.default && pluginAPI.default.getRegisteredIds);

    if (
      !register ||
      !enable ||
      !disable ||
      !reset ||
      !isEnabled ||
      !getPlugin ||
      !getRegisteredIds
    ) {
      console.error('PluginSystem runtime export missing helpers');
      return exitWith(33);
    }

    try {
      reset({ reason: 'cjs-smoke-start', source: 'cjs-smoke' });
      const events = [];
      const plugin = register(
        {
          id: 'cjs-smoke-plugin',
          name: 'CJS Smoke Plugin',
          metadata: { version: '1.0.0' },
          setup: ctx => {
            events.push(`setup:${ctx.reason}`);
          },
          onEnable: ctx => {
            events.push(`enable:${ctx.reason}`);
          },
          onDisable: ctx => {
            events.push(`disable:${ctx.reason}`);
          },
          onReset: ctx => {
            events.push(`reset:${ctx.reason}`);
          },
          teardown: ctx => {
            events.push(`teardown:${ctx.reason}`);
          },
        },
        { source: 'cjs-smoke' }
      );

      if (!plugin || plugin.state !== 'ready' || events.indexOf('setup:register') === -1) {
        console.error('PluginSystem register failed', plugin, events);
        return exitWith(34);
      }

      const enabled = enable('cjs-smoke-plugin', { source: 'cjs-smoke' });
      if (!enabled || !isEnabled('cjs-smoke-plugin') || events.indexOf('enable:enable') === -1) {
        console.error('PluginSystem enable failed', getPlugin('cjs-smoke-plugin'), events);
        return exitWith(35);
      }

      const disabled = disable('cjs-smoke-plugin', { source: 'cjs-smoke' });
      if (
        disabled !== true ||
        isEnabled('cjs-smoke-plugin') ||
        events.indexOf('disable:disable') === -1
      ) {
        console.error('PluginSystem disable failed', getPlugin('cjs-smoke-plugin'), events);
        return exitWith(36);
      }

      reset({ reason: 'cjs-smoke-reset', source: 'cjs-smoke' });
      const ids = getRegisteredIds();
      if (
        (ids && ids.length) ||
        events.indexOf('reset:cjs-smoke-reset') === -1 ||
        events.indexOf('teardown:cjs-smoke-reset') === -1
      ) {
        console.error('PluginSystem reset failed', ids, events);
        return exitWith(37);
      }

      logger.info && logger.info('PluginSystem runtime smoke OK');
    } catch (err) {
      console.error('PluginSystem runtime error', err && err.stack ? err.stack : err);
      return exitWith(38);
    }
  }

  logger.info && logger.info('unified_shims_runner succeeded');
  exitWith(0);
}

main();
