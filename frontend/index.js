const fs = require('fs');
const path = require('path');

// Ultra-early diagnostics
const logPath = path.join(process.cwd(), 'minimal-entry.log');

try {
  fs.appendFileSync(logPath, '\n==== NEW RUN ====\n');
  fs.appendFileSync(logPath, `[DIAG] process.cwd(): ${process.cwd()}\n`);
  fs.appendFileSync(logPath, `[DIAG] __dirname: ${__dirname}\n`);
  fs.appendFileSync(logPath, `[DIAG] __filename: ${__filename}\n`);
  
  // List files in current directory
  const files = fs.readdirSync(__dirname);
  fs.appendFileSync(logPath, `[DIAG] Files in __dirname: ${files.join(', ')}\n`);
  
  // Check if knexfile.js exists
  const knexfilePath = path.join(__dirname, 'knexfile.js');
  fs.appendFileSync(logPath, `[DIAG] knexfile.js exists: ${fs.existsSync(knexfilePath)}\n`);
  
  // Check if utils directory exists
  const utilsPath = path.join(__dirname, 'utils');
  fs.appendFileSync(logPath, `[DIAG] utils directory exists: ${fs.existsSync(utilsPath)}\n`);
} catch (e) {
  // If even basic logging fails, try console
  console.error('Failed to write diagnostics:', e);
}

// Restore main process logic incrementally
fs.appendFileSync(
  logPath,
  `[STEP 1] index.js executed at ${new Date().toISOString()}\n`
);

try {
  fs.appendFileSync(
    logPath,
    `[STEP 2] Requiring main-sportsbook-api.cjs at ${new Date().toISOString()}\n`
  );
  require('./main-sportsbook-api.cjs');
  fs.appendFileSync(
    logPath,
    `[STEP 3] main-sportsbook-api.cjs required successfully at ${new Date().toISOString()}\n`
  );
} catch (err) {
  fs.appendFileSync(
    logPath,
    `[ERROR] Failed to require main-sportsbook-api.cjs: ${err.stack}\n`
  );
  process.exit(1);
}
