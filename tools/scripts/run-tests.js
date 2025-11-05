#!/usr/bin/env node

// Enhanced Test Runner Script for Phase 4 Testing Automation
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

class TestRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      unit: null,
      integration: null,
      e2e: null,
      performance: null,
      coverage: null,
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

  async runCommand(command, description) {
    this.log(`\n🚀 ${description}...`, 'blue');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      
      this.log(`✅ ${description} completed successfully`, 'green');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} failed`, 'red');
      this.log(`Error: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  async runUnitTests() {
    this.logSection('Unit Tests');
    const result = await this.runCommand(
      'npm run test:unit -- --passWithNoTests',
      'Running unit tests'
    );
    this.results.unit = result;
    return result;
  }

  async runIntegrationTests() {
    this.logSection('Integration Tests');
    const result = await this.runCommand(
      'npm run test:integration -- --passWithNoTests',
      'Running integration tests'
    );
    this.results.integration = result;
    return result;
  }

  async runE2ETests() {
    this.logSection('End-to-End Tests');
    const result = await this.runCommand(
      'npm run test:e2e -- --passWithNoTests',
      'Running E2E tests'
    );
    this.results.e2e = result;
    return result;
  }

  async runPerformanceTests() {
    this.logSection('Performance Tests');
    const result = await this.runCommand(
      'npm run test:performance -- --passWithNoTests',
      'Running performance tests'
    );
    this.results.performance = result;
    return result;
  }

  async generateCoverageReport() {
    this.logSection('Coverage Report');
    const result = await this.runCommand(
      'npm run test:coverage -- --passWithNoTests',
      'Generating coverage report'
    );
    this.results.coverage = result;
    
    if (result.success) {
      await this.displayCoverageReport();
    }
    
    return result;
  }

  async displayCoverageReport() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      try {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const total = coverage.total;
        
        this.log('\n📊 Coverage Summary:', 'bright');
        this.log(`Lines: ${this.formatCoverage(total.lines)}`, 'cyan');
        this.log(`Functions: ${this.formatCoverage(total.functions)}`, 'cyan');
        this.log(`Branches: ${this.formatCoverage(total.branches)}`, 'cyan');
        this.log(`Statements: ${this.formatCoverage(total.statements)}`, 'cyan');
        
        // Check if coverage meets thresholds
        const thresholds = {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        };
        
        const failedThresholds = [];
        Object.keys(thresholds).forEach(key => {
          if (total[key].pct < thresholds[key]) {
            failedThresholds.push(`${key}: ${total[key].pct}% < ${thresholds[key]}%`);
          }
        });
        
        if (failedThresholds.length > 0) {
          this.log('\n⚠️  Coverage thresholds not met:', 'yellow');
          failedThresholds.forEach(threshold => {
            this.log(`  • ${threshold}`, 'red');
          });
        } else {
          this.log('\n✅ All coverage thresholds met!', 'green');
        }
        
      } catch (error) {
        this.log(`Error reading coverage report: ${error.message}`, 'red');
      }
    }
  }

  formatCoverage(coverage) {
    const percentage = coverage.pct;
    const color = percentage >= 90 ? 'green' : percentage >= 80 ? 'yellow' : 'red';
    return `${COLORS[color]}${percentage}%${COLORS.reset} (${coverage.covered}/${coverage.total})`;
  }

  async runLinting() {
    this.logSection('Code Quality');
    const lintResult = await this.runCommand(
      'npm run lint',
      'Running ESLint'
    );
    
    const typeCheckResult = await this.runCommand(
      'npm run type-check',
      'Running TypeScript type check'
    );
    
    return lintResult.success && typeCheckResult.success;
  }

  generateReport() {
    this.logSection('Test Results Summary');
    
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000).toFixed(2);
    
    this.log(`⏱️  Total execution time: ${duration}s`, 'bright');
    
    const testTypes = ['unit', 'integration', 'e2e', 'performance', 'coverage'];
    const results = testTypes.map(type => {
      const result = this.results[type];
      if (!result) return { type, status: '⏭️  Skipped', color: 'yellow' };
      
      return {
        type,
        status: result.success ? '✅ Passed' : '❌ Failed',
        color: result.success ? 'green' : 'red',
      };
    });
    
    this.log('\n📋 Results:', 'bright');
    results.forEach(({ type, status, color }) => {
      this.log(`  ${type.padEnd(12)}: ${status}`, color);
    });
    
    const totalPassed = results.filter(r => r.status.includes('Passed')).length;
    const totalFailed = results.filter(r => r.status.includes('Failed')).length;
    const totalSkipped = results.filter(r => r.status.includes('Skipped')).length;
    
    this.log(`\n📊 Summary: ${totalPassed} passed, ${totalFailed} failed, ${totalSkipped} skipped`, 'bright');
    
    if (totalFailed > 0) {
      this.log('\n❌ Some tests failed. Please review the output above.', 'red');
      process.exit(1);
    } else {
      this.log('\n🎉 All tests passed successfully!', 'green');
      process.exit(0);
    }
  }

  async run() {
    this.log('🧪 Starting Phase 4 Test Suite', 'bright');
    this.log(`Started at: ${new Date().toISOString()}`, 'cyan');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const runAll = args.length === 0 || args.includes('--all');
    const runUnit = runAll || args.includes('--unit');
    const runIntegration = runAll || args.includes('--integration');
    const runE2E = runAll || args.includes('--e2e');
    const runPerformance = runAll || args.includes('--performance');
    const runCoverage = runAll || args.includes('--coverage');
    const runLint = runAll || args.includes('--lint');
    const skipLint = args.includes('--skip-lint');
    
    try {
      // Run linting first (unless skipped)
      if (runLint && !skipLint) {
        const lintSuccess = await this.runLinting();
        if (!lintSuccess && !args.includes('--ignore-lint')) {
          this.log('\n❌ Linting failed. Fix issues before running tests.', 'red');
          process.exit(1);
        }
      }
      
      // Run test suites
      if (runUnit) await this.runUnitTests();
      if (runIntegration) await this.runIntegrationTests();
      if (runE2E) await this.runE2ETests();
      if (runPerformance) await this.runPerformanceTests();
      if (runCoverage) await this.generateCoverageReport();
      
    } catch (error) {
      this.log(`\n💥 Unexpected error: ${error.message}`, 'red');
      process.exit(1);
    }
    
    this.generateReport();
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 Phase 4 Test Runner

Usage: node scripts/run-tests.js [options]

Options:
  --all                Run all test suites (default)
  --unit              Run only unit tests
  --integration       Run only integration tests
  --e2e               Run only end-to-end tests
  --performance       Run only performance tests
  --coverage          Generate coverage report only
  --lint              Run linting only
  --skip-lint         Skip linting checks
  --ignore-lint       Continue even if linting fails
  --help, -h          Show this help message

Examples:
  node scripts/run-tests.js                    # Run all tests
  node scripts/run-tests.js --unit --coverage  # Run unit tests with coverage
  node scripts/run-tests.js --lint             # Run linting only
  node scripts/run-tests.js --skip-lint        # Run tests without linting
`);
  process.exit(0);
}

// Run the test suite
const runner = new TestRunner();
runner.run().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
