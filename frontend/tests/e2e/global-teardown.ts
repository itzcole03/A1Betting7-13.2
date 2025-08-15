// Global teardown for Playwright tests
// Cleans up test environment and data

async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log('🧹 Starting Playwright global teardown...');

  try {
    // Clean up any test data
    await cleanupTestData();

    // Reset environment
    delete process.env.VITE_TESTING;
    delete process.env.VITE_BACKEND_URL;

    // eslint-disable-next-line no-console
    console.log('✅ Playwright global teardown complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error during teardown:', error);
  }
}

async function cleanupTestData() {
  try {
    // Add any cleanup operations here
    // For example: clear test database, reset caches, etc.
    
    // eslint-disable-next-line no-console
    console.log('🗑️  Test data cleanup complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Test data cleanup failed:', error);
  }
}

export default globalTeardown;
