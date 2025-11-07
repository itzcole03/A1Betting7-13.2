const fs = require('fs');
const path = require('path');
const child = require('child_process');

function tryRequire(...p) {
  const target = path.join(...p);

  // Try common JS module paths first
  const tryPaths = [
    target,
    `${target}.js`,
    `${target}.cjs`,
    `${target}.mjs`,
    path.join(target, 'index.js'),
    path.join(target, 'index.cjs'),
    path.join(target, 'index.mjs'),
  ];
  for (const t of tryPaths) {
    try {
      // Node requires in ESM context will throw; handle in caller
      // eslint-disable-next-line node/no-extraneous-require
      return require(t);
    } catch (err) {
      // continue trying other extensions
    }
  }

  // If JS require failed, treat presence of TS source as success marker.
  const tsCandidates = [
    `${target}.ts`,
    `${target}.cts`,
    path.join(target, 'index.ts'),
    path.join(target, 'index.cts'),
  ];
  for (const ts of tsCandidates) {
    if (fs.existsSync(ts)) {
      return { __ts_source: ts };
    }
  }

  return { __require_error: `module not found (checked js and ts paths for ${target})` };
}

const start = Date.now();
const checks = [];

function record(name, ok, info) {
  checks.push({ name, ok, info });
}

// Attempt to load a few canonical facades with safe fallbacks
const base = path.resolve(__dirname, '..', '..');

// UnifiedCache
try {
  const cache = tryRequire(base, 'UnifiedCache');
  const hasSet = cache && typeof cache.set === 'function';
  const hasGet = cache && typeof cache.get === 'function';
  if (hasSet && hasGet) {
    try {
      cache.set('__qc_test_key', 'v', 1000);
      const v = cache.get('__qc_test_key');
      record('UnifiedCache.set/get', v === 'v', { got: v });
    } catch (e) {
      record('UnifiedCache.set/get', false, String(e));
    }
  } else {
    record(
      'UnifiedCache',
      false,
      cache && cache.__require_error ? cache.__require_error : 'missing set/get'
    );
  }
} catch (e) {
  record('UnifiedCache', false, String(e));
}

// UnifiedLogger
try {
  const loggerMod = tryRequire(base, 'UnifiedLogger');
  const getLogger =
    loggerMod &&
    (typeof loggerMod.getLogger === 'function'
      ? loggerMod.getLogger
      : typeof loggerMod === 'function'
      ? loggerMod
      : null);
  if (getLogger) {
    try {
      const l =
        typeof loggerMod.getLogger === 'function'
          ? loggerMod.getLogger('smoke')
          : loggerMod('smoke');
      record('UnifiedLogger.getLogger', !!(l && typeof l.info === 'function'), {});
    } catch (e) {
      record('UnifiedLogger.getLogger', false, String(e));
    }
  } else {
    record(
      'UnifiedLogger',
      false,
      loggerMod && loggerMod.__require_error ? loggerMod.__require_error : 'missing getLogger'
    );
  }
} catch (e) {
  record('UnifiedLogger', false, String(e));
}

// GuardedImport (expect function or object)
try {
  const guarded = tryRequire(base, 'GuardedImport');
  const ok =
    guarded &&
    (typeof guarded === 'function' ||
      typeof guarded.guard === 'function' ||
      typeof guarded.default === 'function');
  record(
    'GuardedImport',
    !!ok,
    guarded && guarded.__require_error ? guarded.__require_error : null
  );
} catch (e) {
  record('GuardedImport', false, String(e));
}

// ClientHealthProbe
try {
  const probe = tryRequire(base, 'ClientHealthProbe');
  if (probe && typeof probe.getSnapshot === 'function') {
    try {
      const snap = probe.getSnapshot();
      record('ClientHealthProbe.getSnapshot', !!snap && typeof snap === 'object', {
        keys: snap && Object.keys(snap),
      });
    } catch (e) {
      record('ClientHealthProbe.getSnapshot', false, String(e));
    }
  } else {
    record(
      'ClientHealthProbe',
      false,
      probe && probe.__require_error ? probe.__require_error : 'missing getSnapshot'
    );
  }
} catch (e) {
  record('ClientHealthProbe', false, String(e));
}

// Summary and write report
const duration = Date.now() - start;
const allOk = checks.every(c => c.ok);

let sha = 'unknown';
try {
  sha = child.execSync('git rev-parse --short HEAD').toString('utf8').trim();
} catch (e) {
  // ignore
}

const out = {
  ok: allOk,
  git_sha: sha,
  runtime: { node: process.version },
  duration_ms: duration,
  checks,
};

const reportsDir = path.resolve(process.cwd(), 'reports', 'shims_quickcheck');
try {
  fs.mkdirSync(reportsDir, { recursive: true });
  const outPath = path.join(reportsDir, `${sha || 'unknown'}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote quickcheck report to', outPath);
} catch (e) {
  console.error('Failed to write quickcheck report:', e && e.stack ? e.stack : String(e));
}

if (!allOk) {
  console.error('shims_quickcheck: one or more checks failed');
  checks.filter(c => !c.ok).forEach(c => console.error('-', c.name, c.info || ''));
  process.exit(2);
}

console.log('shims_quickcheck: all checks passed in', duration, 'ms');
process.exit(0);
