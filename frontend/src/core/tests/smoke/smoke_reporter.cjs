const { execSync } = require('child_process');
const { writeFileSync, mkdirSync, readFileSync } = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  const start = Date.now();
  try {
    const out = execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
    return { code: 0, out, durationMs: Date.now() - start };
  } catch (err) {
    const e = err || {};
    return {
      code: e.status || 1,
      out: (e.stdout || '') + (e.stderr || ''),
      durationMs: Date.now() - start,
    };
  }
}

// Ensure report dirs relative to repo root
const repoRoot = path.resolve(__dirname, '../../../../..');
const reportsDir = path.join(repoRoot, 'reports');
const shimsDir = path.join(reportsDir, 'shims_quickcheck');
const tsDir = path.join(reportsDir, 'ts_triage');
mkdirSync(shimsDir, { recursive: true });
mkdirSync(tsDir, { recursive: true });

const nodeSmokePath = path.join(__dirname, 'unified_shims_runner.js');
const smokeOutPath = path.join(shimsDir, 'unified_shims_runner.txt');
const tscOutPath = path.join(tsDir, 'frontend-guarded-import-smoke.txt');
const summaryPath = path.join(reportsDir, 'shims_quickcheck_summary.json');

console.log('[smoke-reporter] running node smoke runner...');
const nodeCmd = `node "${nodeSmokePath}"`;
const nodeRes = run(nodeCmd, { cwd: path.join(repoRoot, 'frontend') });
writeFileSync(smokeOutPath, nodeRes.out || `Exit code ${nodeRes.code}\n`);

console.log('[smoke-reporter] running focused tsc...');
const tscCmd = `npx -y tsc -p "src/core/tsconfig.smoke.json"`;
const tscRes = run(tscCmd, { cwd: path.join(repoRoot, 'frontend') });
writeFileSync(tscOutPath, tscRes.out || `Exit code ${tscRes.code}\n`);

// Count tsc errors by scanning for 'error TS' in output
const tscOutputText = tscRes.out || '';
const tscErrorCount = (tscOutputText.match(/error TS\d+/g) || []).length;

const summary = {
  nodeSmoke: {
    exitCode: nodeRes.code,
    durationMs: nodeRes.durationMs,
  },
  tscSmoke: {
    exitCode: tscRes.code,
    durationMs: tscRes.durationMs,
    errorCount: tscErrorCount,
  },
  timestamp: new Date().toISOString(),
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log('[smoke-reporter] summary written to', summaryPath);
if (nodeRes.code !== 0 || tscRes.code !== 0) process.exit(1);
process.exit(0);
