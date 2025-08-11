// Global Setup for End-to-End Tests
import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');
  
  const baseURL = config.projects[0].use.baseURL;
  console.log(`📍 Testing against: ${baseURL}`);
  
  // Create reports directory
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Create browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Verify application is accessible
    console.log('🔍 Verifying application accessibility...');
    await page.goto(baseURL || 'http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-container"], #root', { 
      timeout: 10000 
    });
    
    console.log('✅ Application is accessible');
    
    // Check for API health indicator
    try {
      const apiIndicator = await page.locator('[data-testid="api-health-indicator"]').first();
      if (await apiIndicator.isVisible()) {
        const status = await apiIndicator.textContent();
        console.log(`📊 API Status: ${status}`);
      }
    } catch (error) {
      console.log('⚠️  API health indicator not found (this is OK)');
    }
    
    // Setup authentication tokens if needed
    await setupAuthTokens(page, baseURL);
    
    // Save application state
    await saveApplicationState(context);
    
    console.log('✅ E2E test environment setup completed');
    
  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupAuthTokens(page: any, baseURL: string) {
  try {
    console.log('🔑 Setting up authentication for E2E tests...');
    
    // Try to create test user and get auth token
    const response = await page.evaluate(async (base) => {
      try {
        const registerResponse = await fetch(`${base}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'e2e_test_user',
            email: 'e2e_test@a1betting.com',
            password: 'E2ETestPassword123!'
          })
        });
        
        // Try to login (user might already exist)
        const loginResponse = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'e2e_test_user',
            password: 'E2ETestPassword123!'
          })
        });
        
        if (loginResponse.ok) {
          const data = await loginResponse.json();
          return { success: true, token: data.access_token };
        }
        
        return { success: false, error: 'Login failed' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, baseURL);
    
    if (response.success) {
      // Store auth token in localStorage
      await page.evaluate((token) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('e2e_test_mode', 'true');
      }, response.token);
      
      console.log('✅ Authentication tokens set up');
    } else {
      console.log('⚠️  Authentication setup skipped:', response.error);
    }
    
  } catch (error) {
    console.log('⚠️  Authentication setup failed (continuing without auth):', error.message);
  }
}

async function saveApplicationState(context: any) {
  try {
    // Save storage state for reuse in tests
    await context.storageState({ path: 'tests/e2e/auth.json' });
    console.log('💾 Application state saved');
  } catch (error) {
    console.log('⚠️  Could not save application state:', error.message);
  }
}

export default globalSetup;
