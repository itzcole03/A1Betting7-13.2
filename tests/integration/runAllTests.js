#!/usr/bin/env node

// Integration Test Suite Runner for Phase 4.2
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const IntegrationTestFramework = require('./utils/TestFramework');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class IntegrationTestRunner {
  constructor() {
    this.startTime = Date.now();
    this.framework = new IntegrationTestFramework();
    this.results = {
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      performance: {},
      errors: [],
    };
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  logSection(title) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`${title.toUpperCase()}`, 'bright');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  async setupTestEnvironment() {
    this.logSection('Setting Up Integration Test Environment');
    
    try {
      this.log('🔧 Initializing test framework...', 'blue');
      
      // Setup authentication
      await this.framework.setupAuthentication();
      this.log('✅ Authentication setup completed', 'green');

      // Verify backend connectivity
      const healthResult = await this.framework.testEndpoint('unified',
        { method: 'GET', path: '/health', requiresAuth: false }
      );

      if (healthResult.success) {
        this.log('✅ Backend connectivity verified', 'green');
      } else {
        this.log('⚠️  Backend health check warning', 'yellow');
      }

      this.log('🚀 Test environment ready', 'green');
      
    } catch (error) {
      this.log(`❌ Environment setup failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async runTestSuite(suiteName, testFile) {
    this.log(`\n🧪 Running ${suiteName} tests...`, 'blue');
    
    const startTime = Date.now();
    
    try {
      // Run Jest for specific test file
      const command = `npx jest --config ./jest.config.basic.cjs ${testFile} --verbose --forceExit`;
      
      this.log(`   Command: ${command}`, 'cyan');
      
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minute timeout
      });

      const duration = Date.now() - startTime;
      
      // Parse Jest output (simplified)
      const passed = (output.match(/✓/g) || []).length;
      const failed = (output.match(/✕/g) || []).length;
      const skipped = (output.match(/○/g) || []).length;

      this.results.suites[suiteName] = {
        passed,
        failed,
        skipped,
        duration,
        status: failed === 0 ? 'PASSED' : 'FAILED',
        output: output.substring(0, 1000), // Truncate for summary
      };

      this.results.summary.total += passed + failed + skipped;
      this.results.summary.passed += passed;
      this.results.summary.failed += failed;
      this.results.summary.skipped += skipped;

      if (failed === 0) {
        this.log(`✅ ${suiteName} tests PASSED (${passed} tests, ${duration}ms)`, 'green');
      } else {
        this.log(`❌ ${suiteName} tests FAILED (${passed} passed, ${failed} failed, ${duration}ms)`, 'red');
        this.results.errors.push({
          suite: suiteName,
          error: `${failed} test(s) failed`,
          output: output.substring(output.length - 500), // Last 500 chars
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.suites[suiteName] = {
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        status: 'ERROR',
        error: error.message,
      };

      this.results.summary.total += 1;
      this.results.summary.failed += 1;

      this.log(`💥 ${suiteName} tests ERROR (${duration}ms)`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
      
      this.results.errors.push({
        suite: suiteName,
        error: error.message,
        output: error.stdout || error.stderr || '',
      });
    }
  }

  async runManualEndpointTests() {
    this.logSection('Running Manual Endpoint Tests');

    try {
      // Test critical endpoints directly with framework
      const criticalTests = [
        { group: 'unified', endpoint: { method: 'GET', path: '/health', requiresAuth: false } },
        { group: 'analytics', endpoint: { method: 'GET', path: '/health', requiresAuth: false } },
        { group: 'ai', endpoint: { method: 'GET', path: '/health', requiresAuth: false } },
      ];

      let manualPassed = 0;
      let manualFailed = 0;

      for (const test of criticalTests) {
        const result = await this.framework.testEndpoint(test.group, test.endpoint);
        
        if (result.success) {
          manualPassed++;
          this.log(`✅ ${test.group} ${test.endpoint.method} ${test.endpoint.path}`, 'green');
        } else {
          manualFailed++;
          this.log(`❌ ${test.group} ${test.endpoint.method} ${test.endpoint.path}`, 'red');
        }
      }

      this.results.suites['manual_endpoints'] = {
        passed: manualPassed,
        failed: manualFailed,
        skipped: 0,
        duration: 0,
        status: manualFailed === 0 ? 'PASSED' : 'FAILED',
      };

      this.results.summary.total += manualPassed + manualFailed;
      this.results.summary.passed += manualPassed;
      this.results.summary.failed += manualFailed;

    } catch (error) {
      this.log(`❌ Manual endpoint tests failed: ${error.message}`, 'red');
    }
  }

  generatePerformanceReport() {
    this.logSection('Performance Analysis');

    const frameworkPerf = this.framework.testResults.performance;
    
    if (Object.keys(frameworkPerf).length > 0) {
      this.log('📊 API Performance Summary:', 'bright');
      
      Object.entries(frameworkPerf).forEach(([endpoint, metrics]) => {
        const status = metrics.avgTime < 1000 ? '🟢' : metrics.avgTime < 3000 ? '🟡' : '🔴';
        this.log(`   ${status} ${endpoint}: ${metrics.avgTime.toFixed(0)}ms avg (${metrics.count} calls)`, 'cyan');
      });

      // Find slowest endpoints
      const sortedByTime = Object.entries(frameworkPerf)
        .sort((a, b) => b[1].avgTime - a[1].avgTime)
        .slice(0, 3);

      if (sortedByTime.length > 0) {
        this.log('\n⚠️  Slowest endpoints:', 'yellow');
        sortedByTime.forEach(([endpoint, metrics]) => {
          this.log(`   • ${endpoint}: ${metrics.avgTime.toFixed(0)}ms`, 'yellow');
        });
      }

    } else {
      this.log('⚠️  No performance data collected', 'yellow');
    }
  }

  generateCoverageReport() {
    this.logSection('API Coverage Analysis');

    const totalEndpoints = Object.values(this.framework.config.endpoints)
      .reduce((sum, group) => sum + group.endpoints.length, 0);

    const testedEndpoints = Object.keys(this.framework.testResults.performance).length;
    const coveragePercent = totalEndpoints > 0 ? (testedEndpoints / totalEndpoints * 100).toFixed(1) : 0;

    this.log(`📈 API Endpoint Coverage: ${testedEndpoints}/${totalEndpoints} (${coveragePercent}%)`, 'bright');

    if (coveragePercent < 70) {
      this.log('⚠️  Coverage below 70% - consider adding more integration tests', 'yellow');
    } else if (coveragePercent >= 90) {
      this.log('🎉 Excellent API coverage!', 'green');
    } else {
      this.log('✅ Good API coverage', 'green');
    }
  }

  generateFinalReport() {
    this.logSection('Integration Test Results Summary');

    const endTime = Date.now();
    this.results.summary.duration = endTime - this.startTime;

    const successRate = this.results.summary.total > 0 
      ? (this.results.summary.passed / this.results.summary.total * 100).toFixed(1)
      : 0;

    // Summary statistics
    this.log('📊 Test Execution Summary:', 'bright');
    this.log(`   Total Tests: ${this.results.summary.total}`, 'cyan');
    this.log(`   Passed: ${this.results.summary.passed}`, 'green');
    this.log(`   Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'red' : 'cyan');
    this.log(`   Skipped: ${this.results.summary.skipped}`, 'yellow');
    this.log(`   Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
    this.log(`   Total Duration: ${(this.results.summary.duration / 1000).toFixed(1)}s`, 'cyan');

    // Suite breakdown
    this.log('\n📋 Test Suite Results:', 'bright');
    Object.entries(this.results.suites).forEach(([suite, results]) => {
      const statusColor = results.status === 'PASSED' ? 'green' : 'red';
      const durationText = results.duration ? ` (${results.duration}ms)` : '';
      this.log(`   ${results.status === 'PASSED' ? '✅' : '❌'} ${suite}: ${results.status}${durationText}`, statusColor);
    });

    // Error summary
    if (this.results.errors.length > 0) {
      this.log('\n❌ Error Summary:', 'red');
      this.results.errors.forEach(error => {
        this.log(`   • ${error.suite}: ${error.error}`, 'red');
      });
    }

    // Final status
    const overallSuccess = this.results.summary.failed === 0;
    this.log(`\n🏆 Overall Status: ${overallSuccess ? 'SUCCESS' : 'FAILED'}`, overallSuccess ? 'green' : 'red');

    return overallSuccess;
  }

  async saveReports() {
    const reportsDir = path.join(__dirname, 'reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save JSON report
    const jsonReport = {
      ...this.results,
      timestamp: new Date().toISOString(),
      environment: {
        baseURL: this.framework.baseURL,
        nodeVersion: process.version,
      },
    };

    const jsonPath = path.join(reportsDir, `integration-test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    this.log(`\n💾 Report saved: ${jsonPath}`, 'cyan');
  }

  async cleanup() {
    this.log('\n🧹 Cleaning up test environment...', 'blue');
    
    try {
      await this.framework.cleanup();
      this.log('✅ Cleanup completed', 'green');
    } catch (error) {
      this.log(`⚠️  Cleanup warning: ${error.message}`, 'yellow');
    }
  }

  async run() {
    this.log('🚀 Starting A1Betting Integration Test Suite', 'bright');
    this.log(`📅 Started at: ${new Date().toISOString()}`, 'cyan');

    let success = false;

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Define test suites to run
      const testSuites = [
        { name: 'Authentication', file: 'tests/integration/auth/auth.test.js' },
        { name: 'Analytics', file: 'tests/integration/analytics/analytics.test.js' },
        { name: 'AI Services', file: 'tests/integration/ai/ai.test.js' },
      ];

      // Run all test suites
      for (const suite of testSuites) {
        await this.runTestSuite(suite.name, suite.file);
      }

      // Run manual endpoint tests
      await this.runManualEndpointTests();

      // Generate reports
      this.generatePerformanceReport();
      this.generateCoverageReport();
      success = this.generateFinalReport();

      // Save reports to file
      await this.saveReports();

    } catch (error) {
      this.log(`💥 Critical error: ${error.message}`, 'red');
      success = false;
    } finally {
      await this.cleanup();
    }

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🧪 A1Betting Integration Test Suite

Usage: node tests/integration/runAllTests.js [options]

Options:
  --help, -h          Show this help message
  --verbose           Enable verbose output
  --suite <name>      Run specific test suite only
  --skip-setup        Skip environment setup
  --save-only         Only save reports, don't run tests

Examples:
  node tests/integration/runAllTests.js                    # Run all integration tests
  node tests/integration/runAllTests.js --suite auth      # Run only auth tests
  node tests/integration/runAllTests.js --verbose         # Run with verbose output
`);
  process.exit(0);
}

// Run the integration test suite
const runner = new IntegrationTestRunner();
runner.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
