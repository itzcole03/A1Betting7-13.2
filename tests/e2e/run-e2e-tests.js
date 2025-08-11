#!/usr/bin/env node

// End-to-End Test Runner for Phase 4.3
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

class E2ETestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
      },
      screenshots: [],
      videos: [],
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

  async checkEnvironment() {
    this.logSection('Environment Check');
    
    try {
      // Check if Playwright is installed
      this.log('🔍 Checking Playwright installation...', 'blue');
      
      try {
        execSync('npx playwright --version', { stdio: 'pipe' });
        this.log('✅ Playwright is installed', 'green');
      } catch (error) {
        this.log('❌ Playwright not found. Installing...', 'yellow');
        execSync('npm install @playwright/test', { stdio: 'inherit' });
        this.log('✅ Playwright installed', 'green');
      }
      
      // Check browsers
      this.log('🌐 Installing/updating browsers...', 'blue');
      try {
        execSync('npx playwright install', { stdio: 'inherit' });
        this.log('✅ Browsers ready', 'green');
      } catch (error) {
        this.log('⚠️  Browser installation warning:', 'yellow');
        this.log(`   ${error.message}`, 'yellow');
      }
      
      // Check test files
      this.log('📁 Checking test files...', 'blue');
      const testDir = path.join(__dirname);
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.spec.ts'));
      
      if (testFiles.length === 0) {
        throw new Error('No test files found in tests/e2e directory');
      }
      
      this.log(`✅ Found ${testFiles.length} test file(s):`, 'green');
      testFiles.forEach(file => {
        this.log(`   • ${file}`, 'cyan');
      });
      
      // Check base URL accessibility
      this.log('🔗 Checking application accessibility...', 'blue');
      const baseURL = process.env.E2E_BASE_URL || 'https://56516de19ade4606b4959f15366b615b-159ad93eec194a67a29e416e3.fly.dev';
      
      try {
        const response = await fetch(baseURL, { 
          method: 'HEAD',
          timeout: 10000 
        });
        
        if (response.ok) {
          this.log(`✅ Application accessible at ${baseURL}`, 'green');
        } else {
          this.log(`⚠️  Application returned status ${response.status}`, 'yellow');
        }
      } catch (error) {
        this.log(`⚠️  Application accessibility check failed: ${error.message}`, 'yellow');
        this.log('   Tests will continue but may fail', 'yellow');
      }
      
    } catch (error) {
      this.log(`❌ Environment check failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async runTestSuite(suiteName, options = {}) {
    this.log(`\n🧪 Running ${suiteName} tests...`, 'blue');
    
    const startTime = Date.now();
    
    try {
      // Build Playwright command
      const baseCommand = 'npx playwright test';
      const configFlag = '--config=tests/e2e/playwright.config.ts';
      const projectFlag = options.browser ? `--project=${options.browser}` : '';
      const testFileFlag = options.testFile ? options.testFile : '';
      const headedFlag = options.headed ? '--headed' : '';
      const debugFlag = options.debug ? '--debug' : '';
      const retryFlag = options.retry !== undefined ? `--retries=${options.retry}` : '';
      const workersFlag = options.workers ? `--workers=${options.workers}` : '';
      const reporterFlag = '--reporter=list,html,json';
      
      const command = [
        baseCommand,
        configFlag,
        projectFlag,
        testFileFlag,
        headedFlag,
        debugFlag,
        retryFlag,
        workersFlag,
        reporterFlag
      ].filter(Boolean).join(' ');
      
      this.log(`   Command: ${command}`, 'cyan');
      
      // Execute tests
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 600000, // 10 minute timeout
        cwd: process.cwd(),
      });

      const duration = Date.now() - startTime;
      
      // Parse output for results
      const results = this.parsePlaywrightOutput(output);
      
      this.results.suites[suiteName] = {
        ...results,
        duration,
        status: results.failed === 0 ? 'PASSED' : 'FAILED',
        output: output.substring(0, 1000), // Truncate for summary
      };

      this.results.summary.total += results.total;
      this.results.summary.passed += results.passed;
      this.results.summary.failed += results.failed;
      this.results.summary.skipped += results.skipped;

      if (results.failed === 0) {
        this.log(`✅ ${suiteName} tests PASSED (${results.passed} tests, ${duration}ms)`, 'green');
      } else {
        this.log(`❌ ${suiteName} tests FAILED (${results.passed} passed, ${results.failed} failed, ${duration}ms)`, 'red');
        this.results.errors.push({
          suite: suiteName,
          error: `${results.failed} test(s) failed`,
          output: output.substring(output.length - 500),
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.suites[suiteName] = {
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
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

  parsePlaywrightOutput(output) {
    // Parse Playwright test output
    const lines = output.split('\n');
    let passed = 0, failed = 0, skipped = 0;
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('passed')) {
        const match = line.match(/(\d+)/);
        if (match) passed += parseInt(match[1]);
      }
      if (line.includes('✗') || line.includes('failed')) {
        const match = line.match(/(\d+)/);
        if (match) failed += parseInt(match[1]);
      }
      if (line.includes('○') || line.includes('skipped')) {
        const match = line.match(/(\d+)/);
        if (match) skipped += parseInt(match[1]);
      }
    }
    
    // Fallback: count test results from output
    if (passed === 0 && failed === 0) {
      passed = (output.match(/✓/g) || []).length;
      failed = (output.match(/✗/g) || []).length;
      skipped = (output.match(/○/g) || []).length;
    }
    
    return {
      passed,
      failed,
      skipped,
      total: passed + failed + skipped,
    };
  }

  async collectArtifacts() {
    this.logSection('Collecting Test Artifacts');
    
    try {
      const artifactDirs = [
        'tests/e2e/test-results',
        'tests/e2e/screenshots',
        'tests/e2e/reports',
      ];
      
      for (const dir of artifactDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir, { recursive: true });
          
          this.log(`📁 ${dir}: ${files.length} file(s)`, 'cyan');
          
          // Collect screenshots
          const screenshots = files.filter(file => 
            file.toString().endsWith('.png') || file.toString().endsWith('.jpg')
          );
          this.results.screenshots.push(...screenshots.map(file => path.join(dir, file.toString())));
          
          // Collect videos
          const videos = files.filter(file => 
            file.toString().endsWith('.webm') || file.toString().endsWith('.mp4')
          );
          this.results.videos.push(...videos.map(file => path.join(dir, file.toString())));
        }
      }
      
      this.log(`📸 Screenshots: ${this.results.screenshots.length}`, 'cyan');
      this.log(`🎥 Videos: ${this.results.videos.length}`, 'cyan');
      
    } catch (error) {
      this.log(`⚠️  Artifact collection warning: ${error.message}`, 'yellow');
    }
  }

  generateReport() {
    this.logSection('E2E Test Results Summary');

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

    // Artifacts summary
    if (this.results.screenshots.length > 0 || this.results.videos.length > 0) {
      this.log('\n📁 Test Artifacts:', 'bright');
      this.log(`   Screenshots: ${this.results.screenshots.length}`, 'cyan');
      this.log(`   Videos: ${this.results.videos.length}`, 'cyan');
    }

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
    try {
      const reportsDir = path.join(__dirname, 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Save JSON report
      const jsonReport = {
        ...this.results,
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          baseURL: process.env.E2E_BASE_URL || 'default',
        },
      };

      const jsonPath = path.join(reportsDir, `e2e-test-report-${Date.now()}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

      this.log(`\n💾 Report saved: ${jsonPath}`, 'cyan');
      
      // Check for Playwright HTML report
      const htmlReportPath = path.join(reportsDir, 'html', 'index.html');
      if (fs.existsSync(htmlReportPath)) {
        this.log(`🌐 HTML Report: ${htmlReportPath}`, 'cyan');
      }
      
    } catch (error) {
      this.log(`⚠️  Report saving warning: ${error.message}`, 'yellow');
    }
  }

  async run() {
    const args = process.argv.slice(2);
    
    this.log('🎭 Starting A1Betting End-to-End Test Suite', 'bright');
    this.log(`📅 Started at: ${new Date().toISOString()}`, 'cyan');

    let success = false;

    try {
      // Environment setup
      await this.checkEnvironment();

      // Parse command line options
      const options = {
        browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1],
        headed: args.includes('--headed'),
        debug: args.includes('--debug'),
        retry: args.find(arg => arg.startsWith('--retries='))?.split('=')[1],
        workers: args.find(arg => arg.startsWith('--workers='))?.split('=')[1],
      };

      // Define test suites
      const testSuites = [
        { name: 'Navigation Tests', testFile: 'tests/e2e/navigation.spec.ts' },
        { name: 'Matchup Analysis Tests', testFile: 'tests/e2e/matchup-analysis.spec.ts' },
      ];

      // Run test suites
      for (const suite of testSuites) {
        await this.runTestSuite(suite.name, { ...options, testFile: suite.testFile });
      }

      // Collect artifacts
      await this.collectArtifacts();

      // Generate final report
      success = this.generateReport();

      // Save reports
      await this.saveReports();

    } catch (error) {
      this.log(`💥 Critical error: ${error.message}`, 'red');
      success = false;
    }

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🎭 A1Betting End-to-End Test Suite

Usage: node tests/e2e/run-e2e-tests.js [options]

Options:
  --browser=<name>        Run tests on specific browser (chromium, firefox, webkit)
  --headed               Run tests in headed mode (visible browser)
  --debug                Run tests in debug mode
  --retries=<number>     Number of retries for failed tests
  --workers=<number>     Number of parallel workers
  --help, -h             Show this help message

Examples:
  node tests/e2e/run-e2e-tests.js                           # Run all tests
  node tests/e2e/run-e2e-tests.js --browser=chromium       # Run on Chrome only
  node tests/e2e/run-e2e-tests.js --headed --debug         # Run with visible browser and debug
  node tests/e2e/run-e2e-tests.js --workers=1 --retries=2  # Single worker with retries
`);
  process.exit(0);
}

// Run the E2E test suite
const runner = new E2ETestRunner();
runner.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
