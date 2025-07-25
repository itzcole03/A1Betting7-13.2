// Set the global flag for E2E empty state before MSW loads
// This ensures MSW handlers see the correct flag
// Only used for the empty state E2E test
if (process.env.JEST_WORKER_ID && process.env.JEST_WORKER_ID === "1") {
  globalThis.__JEST_E2E_EMPTY__ = true;
}
