#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const runner = path.join(__dirname, 'unified_shims_runner.js');
const quickcheck = path.join(__dirname, 'shims_quickcheck.cjs');
const logPath = path.join(__dirname, 'unified_shims_runner.log');

function writeLog(data) {
  try {
    fs.appendFileSync(logPath, data);
  } catch (e) {
    // best-effort
  }
}

// Clear existing log
try {
  fs.unlinkSync(logPath);
} catch (e) {}

writeLog(`=== unified_shims_runner run: ${new Date().toISOString()} ===\n`);

// Run the smoke runner (node) and capture output
const res = spawnSync(process.execPath, [runner], { encoding: 'utf8' });
writeLog('--- stdout ---\n');
writeLog(res.stdout || '');
writeLog('\n--- stderr ---\n');
writeLog(res.stderr || '');
writeLog(`--- exit code: ${res.status} ---\n`);

// Run the shims_quickcheck reporter to produce JSON reports (best-effort)
try {
  writeLog('\n=== running shims_quickcheck reporter ===\n');
  const q = spawnSync(process.execPath, [quickcheck], { encoding: 'utf8' });
  writeLog(q.stdout || '');
  writeLog('\n--- reporter stderr ---\n');
  writeLog(q.stderr || '');
  writeLog(`\n--- reporter exit code: ${q.status} ---\n`);
} catch (e) {
  writeLog('\nshims_quickcheck reporter failed to run: ' + String(e) + '\n');
}

// Exit with the smoke runner's exit code (non-zero indicates failure)
process.exit(res.status || 0);
