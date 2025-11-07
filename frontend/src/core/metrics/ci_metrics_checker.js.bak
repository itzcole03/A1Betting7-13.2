const runtime = require('./ci_metrics_checker.cjs');

if (require.main === module) {
  const exitCode = runtime.runCli(process.argv);
  process.exit(exitCode);
}

module.exports = runtime;
