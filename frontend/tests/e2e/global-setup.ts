// Global setup for Playwright tests
// Sets up test environment and mock data

import { FullConfig } from '@playwright/test';

async function globalSetup(_config: FullConfig) {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting Playwright global setup...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_TESTING = 'true';
  process.env.VITE_BACKEND_URL = 'http://127.0.0.1:8000';

  // Wait for services to be ready
  await waitForServices();

  // Setup test data
  await setupTestData();

  // eslint-disable-next-line no-console
  console.log('✅ Playwright global setup complete');
}

async function waitForServices() {
  const maxRetries = 30;
  const retryDelay = 1000;

  // Wait for backend
  // eslint-disable-next-line no-console
  console.log('⏳ Waiting for backend service...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:8000/health');
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Backend service ready');
        break;
      }
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error('Backend service failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Wait for frontend
  // eslint-disable-next-line no-console
  console.log('⏳ Waiting for frontend service...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://127.0.0.1:5173');
      if (response.ok) {
        // eslint-disable-next-line no-console
        console.log('✅ Frontend service ready');
        break;
      }
    } catch (_error) {
      if (i === maxRetries - 1) {
        throw new Error('Frontend service failed to start');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

async function setupTestData() {
  // eslint-disable-next-line no-console
  console.log('📊 Setting up test data...');

  try {
    // Activate MLB sport
    await fetch('http://127.0.0.1:8000/api/sports/activate/MLB', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    // Setup test user preferences (if applicable)
    // Add any other test data setup here

    // eslint-disable-next-line no-console
    console.log('✅ Test data setup complete');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Test data setup failed, continuing with defaults:', error);
  }
}

export default globalSetup;
