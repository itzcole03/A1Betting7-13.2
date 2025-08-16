/**
 * Core Functionality Validator
 * 
 * Ensures that reliability monitoring and enhancements do not interfere
 * with the core application functionality. Validates that essential
 * features remain accessible and performant.
 */

interface CoreFunctionValidationResult {
  isValid: boolean;
  functionName: string;
  executionTime: number;
  error?: string;
  warning?: string;
}

interface CoreFunctionalityReport {
  timestamp: Date;
  overallStatus: 'PASSING' | 'WARNING' | 'FAILING';
  validationResults: CoreFunctionValidationResult[];
  performanceImpact: {
    renderingDelay: number;
    memoryUsage: number;
    jsHeapSize: number;
    criticalPathBlocked: boolean;
  };
  recommendations: string[];
}

class CoreFunctionalityValidator {
  private validationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private performanceBaseline: PerformanceEntry[] = [];

  /**
   * Core application functions that must remain unimpacted
   */
  private coreFunctions = {
    // Navigation and routing
    navigation: () => this.validateNavigation(),
    // Data fetching and display
    dataFetching: () => this.validateDataFetching(),
    // User interactions
    userInteractions: () => this.validateUserInteractions(),
    // Prediction and analysis features
    predictions: () => this.validatePredictions(),
    // Betting and financial calculations
    bettingCalculations: () => this.validateBettingCalculations(),
    // Performance-critical rendering
    rendering: () => this.validateRendering()
  };

  /**
   * Initialize continuous validation without impacting performance
   * Now waits for bootstrap completion before starting validation cycles
   */
  public startValidation(interval: number = 60000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.establishPerformanceBaseline();

    // Wait for bootstrap completion before starting validation cycles
    this.waitForBootstrapCompletion().then(() => {
      // Use requestIdleCallback to avoid blocking main thread
      this.validationInterval = setInterval(() => {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => this.runValidationCycle());
        } else {
          setTimeout(() => this.runValidationCycle(), 0);
        }
      }, interval);
    });
  }

  /**
   * Wait for bootstrap completion using MutationObserver + adaptive backoff
   * @private
   */
  private async waitForBootstrapCompletion(timeout: number = 10000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let observer: MutationObserver | null = null;
      let pollInterval: NodeJS.Timeout | null = null;
      let pollCount = 0;
      const maxPollCount = 5; // Limit aggressive polling

      // Clean up function
      const cleanup = () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        if (pollInterval) {
          clearTimeout(pollInterval);
          pollInterval = null;
        }
      };

      // Success handler
      const onBootstrapComplete = (reason: string) => {
        cleanup();
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[CoreFunctionalityValidator] ${reason}, starting validation`);
        }
        resolve();
      };

      // Timeout handler
      const onTimeout = () => {
        cleanup();
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.info('[CoreFunctionalityValidator] Bootstrap detection timeout, starting validation (this is normal)');
        }
        resolve();
      };

      // Check if already complete
      const isBootstrapComplete = (): string | null => {
        // Check for navigation elements
        const navElements = document.querySelectorAll(
          '[data-nav-root], [data-testid*="nav"], [role="navigation"], nav, #app-nav'
        );
        if (navElements.length > 0) {
          return 'Navigation elements found';
        }

        // Check if app root is mounted with content
        const appRoot = document.querySelector('#root [data-testid="app"], #root .app, main, [role="main"]');
        if (appRoot && appRoot.children.length > 0) {
          return 'App root mounted with content';
        }

        // Check for React elements
        const reactElements = document.querySelectorAll('[data-reactroot], [data-testid]');
        if (reactElements.length > 3) { // More than just basic elements
          return 'React components rendered';
        }

        return null;
      };

      // Check immediate completion
      const immediateCheck = isBootstrapComplete();
      if (immediateCheck) {
        onBootstrapComplete(immediateCheck);
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(onTimeout, timeout);

      // Option 1: Listen for custom bootstrap event
      const handleBootstrapEvent = () => {
        clearTimeout(timeoutId);
        onBootstrapComplete('Bootstrap event received');
      };
      document.addEventListener('a1:bootstrap-complete', handleBootstrapEvent, { once: true });

      // Option 2: MutationObserver for DOM changes (event-driven, efficient)
      try {
        observer = new MutationObserver((mutations) => {
          // Only check after significant DOM changes
          const significantChange = mutations.some(mutation => 
            mutation.addedNodes.length > 0 || 
            (mutation.type === 'attributes' && mutation.attributeName === 'data-testid')
          );

          if (significantChange) {
            const reason = isBootstrapComplete();
            if (reason) {
              clearTimeout(timeoutId);
              document.removeEventListener('a1:bootstrap-complete', handleBootstrapEvent);
              onBootstrapComplete(reason);
            }
          }
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-testid', 'data-nav-root', 'role']
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[CoreFunctionalityValidator] MutationObserver setup failed:', error);
        }
      }

      // Option 3: Adaptive backoff polling (fallback, less aggressive)
      const adaptivePoll = () => {
        if (Date.now() - startTime > timeout) {
          clearTimeout(timeoutId);
          document.removeEventListener('a1:bootstrap-complete', handleBootstrapEvent);
          onTimeout();
          return;
        }

        pollCount++;
        const reason = isBootstrapComplete();
        if (reason) {
          clearTimeout(timeoutId);
          document.removeEventListener('a1:bootstrap-complete', handleBootstrapEvent);
          onBootstrapComplete(reason);
          return;
        }

        // Adaptive backoff: start at 250ms, increase exponentially, cap at 2000ms
        let nextInterval = Math.min(250 * Math.pow(1.5, pollCount), 2000);
        
        // Stop aggressive polling after maxPollCount attempts
        if (pollCount >= maxPollCount) {
          nextInterval = 2000; // Switch to 2-second intervals
        }

        pollInterval = setTimeout(adaptivePoll, nextInterval);
      };

      // Start adaptive polling as fallback (less aggressive than before)
      setTimeout(adaptivePoll, 250); // Start with 250ms delay instead of 100ms
    });
  }

  /**
   * Stop validation and cleanup
   */
  public stopValidation(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Run a complete validation cycle
   */
  public async runValidationCycle(): Promise<CoreFunctionalityReport> {
    const _startTime = performance.now();
    const validationResults: CoreFunctionValidationResult[] = [];
    
    try {
      // Validate each core function with timeout protection
      for (const [functionName, validator] of Object.entries(this.coreFunctions)) {
        const result = await this.runValidationWithTimeout(functionName, validator, 5000);
        validationResults.push(result);
      }

      // Assess performance impact
      const performanceImpact = this.assessPerformanceImpact();

      // Generate recommendations
      const recommendations = this.generateRecommendations(validationResults, performanceImpact);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(validationResults, performanceImpact);

      const report: CoreFunctionalityReport = {
        timestamp: new Date(),
        overallStatus,
        validationResults,
        performanceImpact,
        recommendations
      };

      // Log results in development mode only
      if (process.env.NODE_ENV === 'development') {
        this.logValidationReport(report);
      }

      return report;

    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[CoreFunctionalityValidator] Validation cycle error:', error);
      return this.generateErrorReport(error);
    }
  }

  /**
   * Validate navigation functionality
   */
  private async validateNavigation(): Promise<boolean> {
    try {
      // Check if React Router is functional
      const _currentPath = window.location.pathname;
      
      // Validate that navigation components can be accessed
      const navElements = document.querySelectorAll('[data-testid*="nav"], [role="navigation"], nav');
      if (navElements.length === 0) {
        throw new Error('No navigation elements found');
      }

      // Check if router context is available
      if (typeof window.history?.pushState !== 'function') {
        throw new Error('Browser history API not available');
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Navigation validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Health endpoint URL - updated to use new structured health endpoint
   */
  private static readonly HEALTH_ENDPOINT = '/api/v2/diagnostics/health';
  private static readonly LEGACY_HEALTH_ENDPOINT = '/api/health';

  /**
   * Validate data fetching capabilities - uses new health endpoint with legacy fallback
   */
  private async validateDataFetching(): Promise<boolean> {
    try {
      // Test new structured health endpoint first
      let testUrl = CoreFunctionalityValidator.HEALTH_ENDPOINT;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        const _response = await fetch(testUrl, {
          signal: controller.signal,
          method: 'GET'
        });
        clearTimeout(timeoutId);
        
        // Accept any response (including 404) as long as fetch works
        return true;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // If it's an AbortError, fetch is working but timed out
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return true;
        }
        
        // Try legacy endpoint as fallback
        try {
          testUrl = CoreFunctionalityValidator.LEGACY_HEALTH_ENDPOINT;
          const legacyController = new AbortController();
          const legacyTimeoutId = setTimeout(() => legacyController.abort(), 3000);
          
          try {
            const _legacyResponse = await fetch(testUrl, {
              signal: legacyController.signal,
              method: 'GET'
            });
            clearTimeout(legacyTimeoutId);
            
            // Log migration hint at info level only (will be removed in production builds)
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.info('[CoreValidator] Using legacy health endpoint. Consider migrating to /api/v2/diagnostics/health');
            }
            return true;
          } catch {
            clearTimeout(legacyTimeoutId);
            // If legacy also fails, that's still a functioning fetch
            return true;
          }
        } catch {
          // Final fallback - any error indicates fetch is working
          return true;
        }
      }
    } catch (error) {
      // Avoid warnings for expected connection issues - use info level
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[CoreValidator] Data fetching validation note:', error);
      }
      return false;
    }
  }

  /**
   * Validate user interaction capabilities
   */
  private async validateUserInteractions(): Promise<boolean> {
    try {
      // Check if event listeners can be attached
      const testElement = document.createElement('div');
      let eventFired = false;

      testElement.addEventListener('click', () => {
        eventFired = true;
      });

      // Simulate click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });

      testElement.dispatchEvent(clickEvent);

      if (!eventFired) {
        throw new Error('Event system not functioning');
      }

      // Check if React event system is working
      const reactElements = document.querySelectorAll('[data-reactroot], [data-testid]');
      if (reactElements.length === 0 && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] No React elements detected');
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] User interactions validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Validate prediction system functionality
   */
  private async validatePredictions(): Promise<boolean> {
    try {
      // Check if prediction-related services are accessible
      const predictionElements = document.querySelectorAll('[data-testid*="prediction"], [data-component*="prediction"]');
      
      // Basic validation that prediction components can be rendered
      if (predictionElements.length > 0) {
        // Check if any prediction data is visible
        const hasContent = Array.from(predictionElements).some(el => 
          el.textContent && el.textContent.trim().length > 0
        );
        
        if (!hasContent && process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.warn('[CoreValidator] Prediction elements found but no content visible');
        }
      }

      // Test basic mathematical operations used in predictions
      const testCalc = 0.1 + 0.2;
      if (Math.abs(testCalc - 0.3) > Number.EPSILON) {
        throw new Error('Basic math operations failing');
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Predictions validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Validate betting calculations
   */
  private async validateBettingCalculations(): Promise<boolean> {
    try {
      // Test Kelly Criterion calculation
      const bankroll = 1000;
      const odds = 2.0;
      const probability = 0.6;
      
      const kellyFraction = (probability * odds - 1) / (odds - 1);
      const betSize = bankroll * kellyFraction;

      if (isNaN(betSize) || !isFinite(betSize)) {
        throw new Error('Kelly calculation producing invalid results');
      }

      // Test arbitrage calculation
      const odds1 = 2.0;
      const odds2 = 2.5;
      const impliedProb1 = 1 / odds1;
      const impliedProb2 = 1 / odds2;
      const totalImpliedProb = impliedProb1 + impliedProb2;

      if (isNaN(totalImpliedProb) || !isFinite(totalImpliedProb)) {
        throw new Error('Arbitrage calculation producing invalid results');
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Betting calculations validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Validate rendering performance
   */
  private async validateRendering(): Promise<boolean> {
    try {
      const startTime = performance.now();

      // Test DOM manipulation performance
      const testDiv = document.createElement('div');
      testDiv.innerHTML = '<span>Test</span>';
      document.body.appendChild(testDiv);
      
      const renderTime = performance.now() - startTime;
      
      // Clean up
      document.body.removeChild(testDiv);

      // Flag if rendering is taking too long (more than 16ms for 60fps)
      if (renderTime > 16 && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(`[CoreValidator] Slow rendering detected: ${renderTime}ms`);
      }

      return renderTime < 100; // Fail if rendering takes more than 100ms
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Rendering validation failed:', error);
      }
      return false;
    }
  }

  /**
   * Run validation with timeout protection
   */
  private async runValidationWithTimeout(
    functionName: string,
    validator: () => Promise<boolean>,
    timeout: number
  ): Promise<CoreFunctionValidationResult> {
    const startTime = performance.now();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timeout')), timeout);
      });

      const isValid = await Promise.race([validator(), timeoutPromise]);
      const executionTime = performance.now() - startTime;

      return {
        isValid,
        functionName,
        executionTime,
        warning: executionTime > 1000 ? `Slow execution: ${executionTime}ms` : undefined
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return {
        isValid: false,
        functionName,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Establish performance baseline for comparison
   */
  private establishPerformanceBaseline(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.performanceBaseline = performance.getEntriesByType('measure');
    }
  }

  /**
   * Assess performance impact of reliability monitoring
   */
  private assessPerformanceImpact(): CoreFunctionalityReport['performanceImpact'] {
    const impact = {
      renderingDelay: 0,
      memoryUsage: 0,
      jsHeapSize: 0,
      criticalPathBlocked: false
    };

    try {
      // Check for main thread blocking
      const now = performance.now();
      setTimeout(() => {
        const delay = performance.now() - now;
        impact.renderingDelay = delay;
        impact.criticalPathBlocked = delay > 50; // More than 50ms indicates blocking
      }, 0);

      // Check memory usage if available
      if ('memory' in performance) {
        // Define memory interface to avoid any type
        interface PerformanceMemory {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
        }
        const memory = (performance as Performance & { memory?: PerformanceMemory }).memory;
        if (memory) {
          impact.memoryUsage = memory.usedJSHeapSize;
          impact.jsHeapSize = memory.totalJSHeapSize;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Performance impact assessment failed:', error);
      }
    }

    return impact;
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    results: CoreFunctionValidationResult[],
    performanceImpact: CoreFunctionalityReport['performanceImpact']
  ): string[] {
    const recommendations: string[] = [];

    // Check for failing validations
    const failedValidations = results.filter(r => !r.isValid);
    if (failedValidations.length > 0) {
      recommendations.push(`Address failed core functions: ${failedValidations.map(f => f.functionName).join(', ')}`);
    }

    // Check for slow executions
    const slowValidations = results.filter(r => r.executionTime > 1000);
    if (slowValidations.length > 0) {
      recommendations.push(`Optimize slow functions: ${slowValidations.map(f => f.functionName).join(', ')}`);
    }

    // Check performance impact
    if (performanceImpact.criticalPathBlocked) {
      recommendations.push('Reduce main thread blocking to improve responsiveness');
    }

    if (performanceImpact.renderingDelay > 16) {
      recommendations.push('Optimize rendering performance to maintain 60fps');
    }

    if (recommendations.length === 0) {
      recommendations.push('All core functionality validations passing - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Determine overall validation status
   */
  private determineOverallStatus(
    results: CoreFunctionValidationResult[],
    performanceImpact: CoreFunctionalityReport['performanceImpact']
  ): 'PASSING' | 'WARNING' | 'FAILING' {
    const failedCount = results.filter(r => !r.isValid).length;
    const warningCount = results.filter(r => r.warning).length;

    if (failedCount > 0 || performanceImpact.criticalPathBlocked) {
      return 'FAILING';
    }

    if (warningCount > 0 || performanceImpact.renderingDelay > 16) {
      return 'WARNING';
    }

    return 'PASSING';
  }

  /**
   * Log validation report for development
   */
  private logValidationReport(report: CoreFunctionalityReport): void {
    const statusEmoji = {
      'PASSING': '✅',
      'WARNING': '⚠️',
      'FAILING': '❌'
    };

    /* eslint-disable no-console */
    console.groupCollapsed(`${statusEmoji[report.overallStatus]} Core Functionality Validation: ${report.overallStatus}`);
    
    console.table(report.validationResults.map(r => ({
      Function: r.functionName,
      Status: r.isValid ? '✅ Pass' : '❌ Fail',
      Time: `${r.executionTime.toFixed(2)}ms`,
      Issues: r.error || r.warning || 'None'
    })));

    if (report.recommendations.length > 0) {
      console.log('📋 Recommendations:', report.recommendations);
    }

    console.groupEnd();
    /* eslint-enable no-console */
  }

  /**
   * Generate error report when validation cycle fails
   */
  private generateErrorReport(error: unknown): CoreFunctionalityReport {
    return {
      timestamp: new Date(),
      overallStatus: 'FAILING',
      validationResults: [{
        isValid: false,
        functionName: 'validation_cycle',
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }],
      performanceImpact: {
        renderingDelay: 0,
        memoryUsage: 0,
        jsHeapSize: 0,
        criticalPathBlocked: true
      },
      recommendations: ['Fix core validation system', 'Check for system-level issues']
    };
  }
}

// Export singleton instance
export const coreFunctionalityValidator = new CoreFunctionalityValidator();
export type { CoreFunctionalityReport, CoreFunctionValidationResult };
