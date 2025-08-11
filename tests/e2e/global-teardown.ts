// Global Teardown for End-to-End Tests
import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    // Clean up temporary files
    const authFile = path.join(__dirname, 'auth.json');
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('🗑️  Cleaned up auth state file');
    }
    
    // Generate test summary
    await generateTestSummary();
    
    console.log('✅ E2E test environment cleanup completed');
    
  } catch (error) {
    console.error('⚠️  E2E teardown warning:', error.message);
  }
}

async function generateTestSummary() {
  try {
    const reportsDir = path.join(__dirname, 'reports');
    const summaryFile = path.join(reportsDir, 'test-summary.json');
    
    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      testRun: {
        completed: true,
        duration: Date.now(), // Will be updated by test runner
      },
    };
    
    if (fs.existsSync(reportsDir)) {
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
      console.log('📊 Test summary generated');
    }
    
  } catch (error) {
    console.log('⚠️  Could not generate test summary:', error.message);
  }
}

export default globalTeardown;
