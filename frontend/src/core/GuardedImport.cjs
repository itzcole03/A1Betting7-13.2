// Minimal guardedImport shim for smoke tests (CommonJS)
const fs = require('fs');

async function guardedImport(modulePath, opts = {}) {
  const fallback = opts.fallback;
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 500;

  // Attempt require synchronously for local modules
  try {
    // Try relative require
    // eslint-disable-next-line node/no-extraneous-require
    const mod = require(modulePath);
    return mod;
  } catch (e) {
    // continue to fallback after timeout
  }

  // Wait the timeout then return fallback
  await new Promise(r => setTimeout(r, timeoutMs));
  return fallback;
}

module.exports = { guardedImport, default: guardedImport };
