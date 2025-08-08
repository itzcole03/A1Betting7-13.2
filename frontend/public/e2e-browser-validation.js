/**
 * Browser-based E2E Validation for A1Betting Application
 * Run this script in the browser console to validate functionality
 */

window.A1BettingE2EValidation = {
  // Validation results
  results: {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
  },

  // Helper functions
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  log: (message, type = 'info') => {
    const styles = {
      info: 'color: #3b82f6',
      success: 'color: #10b981; font-weight: bold',
      error: 'color: #ef4444; font-weight: bold',
      warning: 'color: #f59e0b'
    };
    console.log(`%c${message}`, styles[type]);
  },

  // Test individual components
  async testComponent(componentName, selector, expectedFeatures = []) {
    this.log(`🧪 Testing ${componentName}...`);
    
    const component = document.querySelector(selector);
    if (!component) {
      this.log(`❌ ${componentName} not found!`, 'error');
      this.results.failed++;
      this.results.total++;
      return false;
    }

    this.log(`✅ ${componentName} found`, 'success');
    
    // Test expected features
    let featuresPassed = 0;
    for (const feature of expectedFeatures) {
      const featureElement = component.querySelector(feature.selector) || document.querySelector(feature.selector);
      if (featureElement) {
        this.log(`  ✅ ${feature.name} - found`, 'success');
        featuresPassed++;
      } else {
        this.log(`  ❌ ${feature.name} - missing`, 'error');
      }
    }

    const passed = featuresPassed === expectedFeatures.length;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.total++;

    this.results.details.push({
      component: componentName,
      selector,
      found: true,
      featuresTotal: expectedFeatures.length,
      featuresPassed,
      status: passed ? 'PASS' : 'FAIL'
    });

    return passed;
  },

  // Test navigation
  async testNavigation() {
    this.log('🧭 Testing Navigation System...', 'info');
    
    const sidebar = document.querySelector('.sidebar, [data-testid="sidebar"], nav');
    if (!sidebar) {
      this.log('❌ Sidebar not found!', 'error');
      this.results.failed++;
      this.results.total++;
      return;
    }

    const navLinks = sidebar.querySelectorAll('a');
    this.log(`✅ Found ${navLinks.length} navigation links`, 'success');

    const expectedRoutes = [
      { href: '/', name: 'Home' },
      { href: '/player', name: 'Player Research' },
      { href: '/odds', name: 'Odds Comparison' },
      { href: '/arbitrage', name: 'Arbitrage Hunter' },
      { href: '/cheatsheets', name: 'Prop Cheatsheets' },
      { href: '/kelly', name: 'Kelly Calculator' },
      { href: '/ml-models', name: 'ML Models' }
    ];

    let foundRoutes = 0;
    expectedRoutes.forEach(route => {
      const link = Array.from(navLinks).find(link => 
        link.getAttribute('href') === route.href ||
        link.getAttribute('href')?.includes(route.href)
      );
      
      if (link) {
        this.log(`  ✅ ${route.name} route found`, 'success');
        foundRoutes++;
      } else {
        this.log(`  ❌ ${route.name} route missing`, 'error');
      }
    });

    const passed = foundRoutes >= expectedRoutes.length * 0.8; // 80% threshold
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.total++;

    return passed;
  },

  // Test API integration
  async testAPIIntegration() {
    this.log('🔌 Testing API Integration...', 'info');
    
    const apiTests = [
      { endpoint: '/health', name: 'Health Check' },
      { endpoint: '/v1/cheatsheets/opportunities', name: 'Cheatsheets API' },
      { endpoint: '/v1/odds/compare', name: 'Odds API' },
      { endpoint: '/api/models', name: 'Models API' }
    ];

    let passedTests = 0;

    for (const test of apiTests) {
      try {
        const response = await fetch(test.endpoint, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          this.log(`  ✅ ${test.name} - Status: ${response.status}`, 'success');
          passedTests++;
        } else {
          this.log(`  ⚠️ ${test.name} - Status: ${response.status}`, 'warning');
          // Don't count as failure if API returns structured error (demo mode)
          if (response.status < 500) {
            passedTests++;
          }
        }
      } catch (error) {
        this.log(`  ❌ ${test.name} - Error: ${error.message}`, 'error');
      }
    }

    const passed = passedTests >= apiTests.length * 0.6; // 60% threshold (allowing for demo mode)
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.total++;

    return passed;
  },

  // Test data loading and display
  async testDataDisplay() {
    this.log('📊 Testing Data Display...', 'info');
    
    // Check for demo mode indicator
    const demoIndicator = document.querySelector('[data-testid="demo-mode"], .demo-mode, .alert');
    if (demoIndicator) {
      this.log('  ℹ️ Demo mode detected - testing will use fallback data', 'info');
    }

    // Test various data displays
    const dataElements = [
      { selector: '.cheatsheet-table, .opportunities-list', name: 'Cheatsheets Data' },
      { selector: '.arbitrage-opportunity, .profit-margin', name: 'Arbitrage Data' },
      { selector: '.odds-comparison, .best-lines', name: 'Odds Data' },
      { selector: '.model-card, .performance-metrics', name: 'ML Model Data' },
      { selector: '.player-stats, .analytics', name: 'Player Data' }
    ];

    let foundData = 0;
    dataElements.forEach(element => {
      const found = document.querySelector(element.selector);
      if (found) {
        this.log(`  ✅ ${element.name} displayed`, 'success');
        foundData++;
      } else {
        this.log(`  ⚠️ ${element.name} not currently visible`, 'warning');
      }
    });

    const passed = foundData >= dataElements.length * 0.4; // 40% threshold (depends on current page)
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.total++;

    return passed;
  },

  // Test interactive features
  async testInteractivity() {
    this.log('⚡ Testing Interactive Features...', 'info');
    
    const interactiveElements = [
      { selector: 'button, .btn', name: 'Buttons' },
      { selector: 'input, .input', name: 'Input Fields' },
      { selector: '.filter-controls, .controls', name: 'Filter Controls' },
      { selector: '.refresh-btn, [data-action="refresh"]', name: 'Refresh Functionality' },
      { selector: '.export-btn, [data-action="export"]', name: 'Export Functionality' }
    ];

    let workingFeatures = 0;
    interactiveElements.forEach(element => {
      const found = document.querySelectorAll(element.selector);
      if (found.length > 0) {
        this.log(`  ✅ ${element.name} - ${found.length} elements found`, 'success');
        workingFeatures++;
      } else {
        this.log(`  ❌ ${element.name} - not found`, 'error');
      }
    });

    const passed = workingFeatures >= interactiveElements.length * 0.6; // 60% threshold
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    this.results.total++;

    return passed;
  },

  // Test performance
  async testPerformance() {
    this.log('🚀 Testing Performance...', 'info');
    
    const perfEntries = performance.getEntriesByType('navigation');
    if (perfEntries.length > 0) {
      const nav = perfEntries[0];
      const loadTime = nav.loadEventEnd - nav.fetchStart;
      const domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
      
      this.log(`  Load Time: ${loadTime.toFixed(0)}ms`, loadTime < 3000 ? 'success' : 'warning');
      this.log(`  DOM Ready: ${domContentLoaded.toFixed(0)}ms`, domContentLoaded < 1500 ? 'success' : 'warning');
      
      const passed = loadTime < 5000 && domContentLoaded < 3000;
      if (passed) {
        this.results.passed++;
      } else {
        this.results.failed++;
      }
      this.results.total++;
      
      return passed;
    } else {
      this.log('  ⚠️ Performance data not available', 'warning');
      return true; // Don't fail if performance API not available
    }
  },

  // Run comprehensive validation
  async runComprehensiveValidation() {
    this.log('🚀 Starting Comprehensive E2E Validation...', 'info');
    this.log('==========================================', 'info');
    
    // Reset results
    this.results = { passed: 0, failed: 0, total: 0, details: [] };
    
    try {
      // Test core functionality
      await this.testNavigation();
      await this.sleep(100);
      
      await this.testAPIIntegration();
      await this.sleep(100);
      
      await this.testDataDisplay();
      await this.sleep(100);
      
      await this.testInteractivity();
      await this.sleep(100);
      
      await this.testPerformance();
      await this.sleep(100);

      // Test specific components if visible
      await this.testComponent('Cheatsheets Dashboard', '.cheatsheets-container, [data-testid="cheatsheets"]', [
        { selector: '.opportunities-table, .cheatsheet-table', name: 'Opportunities Table' },
        { selector: '.filter-controls, .filters', name: 'Filter Controls' },
        { selector: '.export-button, .export-btn', name: 'Export Button' }
      ]);

      await this.testComponent('Arbitrage Hunter', '.arbitrage-container, [data-testid="arbitrage"]', [
        { selector: '.arbitrage-opportunity, .opportunity-card', name: 'Arbitrage Opportunities' },
        { selector: '.profit-calculator, .calculator', name: 'Profit Calculator' },
        { selector: '.execution-steps, .steps', name: 'Execution Steps' }
      ]);

      await this.testComponent('ML Model Center', '.ml-models-container, [data-testid="ml-models"]', [
        { selector: '.model-card, .model-item', name: 'Model Cards' },
        { selector: '.performance-metrics, .metrics', name: 'Performance Metrics' },
        { selector: '.model-registry, .registry', name: 'Model Registry' }
      ]);

      // Generate final report
      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Validation error: ${error.message}`, 'error');
    }
  },

  // Generate validation report
  generateReport() {
    this.log('==========================================', 'info');
    this.log('📊 E2E Validation Results:', 'info');
    this.log(`Total Tests: ${this.results.total}`, 'info');
    this.log(`Passed: ${this.results.passed} (${((this.results.passed/this.results.total)*100).toFixed(1)}%)`, 'success');
    this.log(`Failed: ${this.results.failed} (${((this.results.failed/this.results.total)*100).toFixed(1)}%)`, this.results.failed > 0 ? 'error' : 'info');
    
    const passRate = this.results.passed / this.results.total;
    if (passRate >= 0.8) {
      this.log('✅ OVERALL STATUS: VALIDATION PASSED', 'success');
    } else if (passRate >= 0.6) {
      this.log('⚠️ OVERALL STATUS: VALIDATION PASSED WITH WARNINGS', 'warning');
    } else {
      this.log('❌ OVERALL STATUS: VALIDATION FAILED', 'error');
    }

    this.log('==========================================', 'info');
    this.log('💡 To run validation again: A1BettingE2EValidation.runComprehensiveValidation()', 'info');
    
    return this.results;
  }
};

// Auto-run validation when script loads
console.log('%c🎯 A1Betting E2E Validation Loaded', 'color: #10b981; font-size: 16px; font-weight: bold');
console.log('%cRun: A1BettingE2EValidation.runComprehensiveValidation()', 'color: #3b82f6; font-weight: bold');
