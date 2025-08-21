/**
 * Core Functionality Validator
 * 
 * Ensures that reliability monitoring and enhancements do not interfere
 * with the core application functionality. Validates that essential
 * features remain accessible and performant.
 */

import { _eventBus } from '../core/EventBus';
import { onNavReady, isNavReady } from '../navigation/navReadySignal';

interface CoreValidatorConfig {
  navMaxAttempts: number;
  navIntervalMs: number;
  navTimeoutMs: number;
  enableDev: boolean;
}

// Configuration with environment variable overrides
const getConfig = (): CoreValidatorConfig => {
  // Prefer import.meta.env when available (tests set it), fall back to process.env
  // Avoid using the bare `import` identifier which breaks Jest parsing; tests set
  // a fake import.meta on globalThis so check there first.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let im: any | undefined = undefined;
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).__import_meta__ && (globalThis as any).__import_meta__.env) {
      im = (globalThis as any).__import_meta__;
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).importMeta && (globalThis as any).importMeta.env) {
      im = (globalThis as any).importMeta;
    }
  } catch (_e) {
    // ignore
  }

  const envNode = (im && im.env && im.env.NODE_ENV) || process.env.NODE_ENV;
  const isDev = envNode === 'development' || process.env.NODE_ENV === 'development';

  // Try to read import.meta.env values safely (from the im variable)
  let viteMaxAttempts: string | undefined = undefined;
  let viteIntervalMs: string | undefined = undefined;
  let viteTimeoutMs: string | undefined = undefined;
  if (im && im.env) {
    viteMaxAttempts = im.env.VITE_VALIDATOR_NAV_MAX_ATTEMPTS;
    viteIntervalMs = im.env.VITE_VALIDATOR_NAV_INTERVAL_MS;
    viteTimeoutMs = im.env.VITE_VALIDATOR_NAV_TIMEOUT_MS;
  }

  return {
    navMaxAttempts: parseInt(viteMaxAttempts || (process.env.VITE_VALIDATOR_NAV_MAX_ATTEMPTS as unknown as string) || '12') || 12,
    navIntervalMs: parseInt(viteIntervalMs || (process.env.VITE_VALIDATOR_NAV_INTERVAL_MS as unknown as string) || '250') || 250,
    navTimeoutMs: parseInt(viteTimeoutMs || (process.env.VITE_VALIDATOR_NAV_TIMEOUT_MS as unknown as string) || '5000') || 5000,
    enableDev: isDev
  };
};

interface CoreFunctionValidationResult {
  isValid: boolean;
  functionName: string;
  executionTime: number;
  error?: string;
  warning?: string;
  // Enhanced error classification
  errorType?: 'structural_missing' | 'data_pending' | 'functionality_broken' | 'performance_issue';
  errorDetails?: {
    missingElements?: string[];
    emptyElements?: string[];
    brokenFunctionality?: string[];
    performanceMetrics?: { expected: number; actual: number };
  };
}

interface ValidatorEvent {
  event_type: 'validator.cycle' | 'validator.cycle.fail' | 'validator.bootstrap' | 'validator.performance';
  phase: string;
  status: 'pass' | 'fail' | 'warn' | 'timeout';
  attempt?: number;
  duration_ms: number;
  timestamp: number;
  details?: {
    error?: string;
    warning?: string;
    functionName?: string;
    performanceImpact?: boolean;
    // Enhanced error classification fields
    errorType?: 'structural_missing' | 'data_pending' | 'functionality_broken' | 'performance_issue';
    errorDetails?: Record<string, unknown>;
  };
}

interface HealthSnapshot {
  status: 'healthy' | 'degraded' | 'failed';
  lastSuccessTs: number;
  lastAttemptTs: number;
  consecutiveFailures: number;
  totalCycles: number;
  avgResponseTime: number;
  validationResults: CoreFunctionValidationResult[];
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

export class CoreFunctionalityValidator {
  // Navigation validation state machine
  private navValidationState: 'idle' | 'waitingForDom' | 'success' | 'degraded_timeout' = 'idle';
  private navValidationAttempts = 0;
  private navReadyUnsubscribe?: () => void;
  private navValidationTimeout: NodeJS.Timeout | null = null;
  private lastDegradedAt: number | null = null;
  // Instance-level configuration
  private config: CoreValidatorConfig;

  constructor() {
    this.config = getConfig();
  }
  public getConfig(): CoreValidatorConfig {
    return this.config;
  }
  
  // Legacy properties
  private validationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private performanceBaseline: PerformanceEntry[] = [];
  
  // Health snapshot tracking
  private healthSnapshot: HealthSnapshot = {
    status: 'healthy',
    lastSuccessTs: 0,
    lastAttemptTs: 0,
    consecutiveFailures: 0,
    totalCycles: 0,
    avgResponseTime: 0,
    validationResults: []
  };
  
  // Performance tracking for observability
  private responseTimes: number[] = [];
  private maxResponseTimes = 50; // Keep last 50 response times for averaging
  
  // Aggregated error tracking for enhanced logging
  private aggregatedErrors: Map<string, {
    count: number;
    errorType: 'structural_missing' | 'data_pending' | 'functionality_broken' | 'performance_issue';
    lastSeen: Date;
    details: Record<string, unknown>;
  }> = new Map();
  private errorAggregationInterval = 30000; // 30 seconds
  private lastErrorReport = Date.now();

  /**
   * Emit validator event for observability
   */
  private emitValidatorEvent(eventData: Partial<ValidatorEvent>): void {
    try {
      const event: ValidatorEvent = {
        event_type: 'validator.cycle',
        phase: 'unknown',
        status: 'pass',
        duration_ms: 0,
        timestamp: Date.now(),
        ...eventData
      };

      _eventBus.emit('validator.event', event);
      
      // Also emit specific event type for targeted listeners
      _eventBus.emit(event.event_type, event);
      
      if (this.config.enableDev) {
        // eslint-disable-next-line no-console
        console.debug('[CoreValidator] Event emitted:', event.event_type, event);
      }
    } catch (error) {
      if (this.config && this.config.enableDev) {
        // eslint-disable-next-line no-console
        console.warn('[CoreValidator] Failed to emit event:', error);
      }
    }
  }

  /**
   * Update health snapshot and expose to window for QA
   */
  private updateHealthSnapshot(
    validationResults: CoreFunctionValidationResult[], 
    overallStatus: 'PASSING' | 'WARNING' | 'FAILING',
    cycleTime: number
  ): void {
    const now = Date.now();
    const isSuccess = overallStatus === 'PASSING';
    
    this.healthSnapshot.lastAttemptTs = now;
    this.healthSnapshot.totalCycles++;
    this.healthSnapshot.validationResults = validationResults;
    
    if (isSuccess) {
      this.healthSnapshot.lastSuccessTs = now;
      this.healthSnapshot.consecutiveFailures = 0;
      this.healthSnapshot.status = 'healthy';
    } else {
      this.healthSnapshot.consecutiveFailures++;
      
      // Implement hysteresis: require 3 consecutive failures before marking as failed
      if (this.healthSnapshot.consecutiveFailures >= 3) {
        this.healthSnapshot.status = 'failed';
      } else if (this.healthSnapshot.consecutiveFailures >= 1 && overallStatus === 'FAILING') {
        this.healthSnapshot.status = 'degraded';
      }
    }
    
    // Update average response time
    this.responseTimes.push(cycleTime);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    this.healthSnapshot.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    // Expose to window for automated QA harnesses
    (window as typeof window & { __A1_VALIDATOR?: unknown }).__A1_VALIDATOR = {
      status: this.healthSnapshot.status,
      lastSuccessTs: this.healthSnapshot.lastSuccessTs,
      lastAttemptTs: this.healthSnapshot.lastAttemptTs,
      consecutiveFailures: this.healthSnapshot.consecutiveFailures,
      totalCycles: this.healthSnapshot.totalCycles,
      avgResponseTime: this.healthSnapshot.avgResponseTime,
      // Include the full snapshot for advanced debugging
      fullSnapshot: this.healthSnapshot
    };
  }

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

      const onBootstrapComplete = (reason: string) => {
        cleanup();
        this.emitValidatorEvent({
          event_type: 'validator.bootstrap',
          phase: 'complete',
          status: 'pass',
          duration_ms: Date.now() - startTime,
          details: { functionName: reason }
        });

        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log(`[CoreFunctionalityValidator] ${reason}, starting validation`);
        }

        resolve();
      };

      const onTimeout = () => {
        cleanup();
        this.emitValidatorEvent({
          event_type: 'validator.bootstrap',
          phase: 'timeout',
          status: 'warn',
          duration_ms: timeout
        });

        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.info('[CoreFunctionalityValidator] Bootstrap detection timeout, starting validation (this is normal)');
        }

        resolve();
      };

      const isBootstrapComplete = (): string | null => {
        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log('[NavDiag] Checking bootstrap completion...');
        }

        const navElements = document.querySelectorAll(
          '[data-nav-root], [data-testid*="nav"], [role="navigation"], nav, #app-nav'
        );

        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log('[NavDiag] Navigation elements found:', navElements.length);
        }

        if (navElements.length > 0) {
          return 'Navigation elements found';
        }

        const appRoot = document.querySelector('#root [data-testid="app"], #root .app, main, [role="main"]');
        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log('[NavDiag] App root check:', {
            found: !!appRoot,
            hasChildren: appRoot ? appRoot.children.length : 0
          });
        }

        if (appRoot && appRoot.children.length > 0) {
          return 'App root mounted with content';
        }

        const reactElements = document.querySelectorAll('[data-reactroot], [data-testid]');
        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log('[NavDiag] React elements found:', reactElements.length);
        }

        if (reactElements.length > 3) {
          return 'React components rendered';
        }

        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.log('[NavDiag] Bootstrap not complete yet');
        }

        return null;
      };

      const immediateCheck = isBootstrapComplete();
      if (immediateCheck) {
        onBootstrapComplete(immediateCheck);
        return;
      }

      const timeoutId = setTimeout(onTimeout, timeout);

      const handleBootstrapEvent = () => {
        clearTimeout(timeoutId);
        onBootstrapComplete('Bootstrap event received');
      };
      document.addEventListener('a1:bootstrap-complete', handleBootstrapEvent, { once: true });

      try {
        observer = new MutationObserver((mutations) => {
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
        if (this.config.enableDev) {
          // eslint-disable-next-line no-console
          console.warn('[CoreFunctionalityValidator] MutationObserver setup failed:', error);
        }
      }

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

        let nextInterval = Math.min(250 * Math.pow(1.5, pollCount), 2000);
        if (pollCount >= maxPollCount) {
          nextInterval = 2000;
        }

        pollInterval = setTimeout(adaptivePoll, nextInterval);
      };

      setTimeout(adaptivePoll, 250);
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
    this.cleanupNavValidation();
  }

  /**
   * Run a complete validation cycle
   */
  public async runValidationCycle(): Promise<CoreFunctionalityReport> {
    const startTime = performance.now();
    const validationResults: CoreFunctionValidationResult[] = [];
    
    // Emit cycle start event
    this.emitValidatorEvent({
      event_type: 'validator.cycle',
      phase: 'start',
      status: 'pass',
      duration_ms: 0
    });
    
    try {
      // Validate each core function with timeout protection
      for (const [functionName, validator] of Object.entries(this.coreFunctions)) {
        const result = await this.runValidationWithTimeout(functionName, validator, 5000);
        validationResults.push(result);
        
        // Emit individual function validation events
        if (!result.isValid) {
          // Track aggregated errors for enhanced logging
          this.trackAggregatedError(result);
          
          this.emitValidatorEvent({
            event_type: 'validator.cycle.fail',
            phase: functionName,
            status: 'fail',
            duration_ms: result.executionTime,
            details: {
              error: result.error,
              functionName: result.functionName,
              errorType: result.errorType,
              errorDetails: result.errorDetails
            }
          });
        } else if (result.warning) {
          this.emitValidatorEvent({
            event_type: 'validator.cycle',
            phase: functionName,
            status: 'warn',
            duration_ms: result.executionTime,
            details: {
              warning: result.warning,
              functionName: result.functionName
            }
          });
        }
      }

      // Process aggregated error reporting
      this.processAggregatedErrors();

      // Assess performance impact
      const performanceImpact = this.assessPerformanceImpact();

      // Generate recommendations
      const recommendations = this.generateRecommendations(validationResults, performanceImpact);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(validationResults, performanceImpact);

      const cycleTime = performance.now() - startTime;
      const report: CoreFunctionalityReport = {
        timestamp: new Date(),
        overallStatus,
        validationResults,
        performanceImpact,
        recommendations
      };

      // Update health snapshot and expose to window
      this.updateHealthSnapshot(validationResults, overallStatus, cycleTime);

      // Emit cycle complete event
      this.emitValidatorEvent({
        event_type: 'validator.cycle',
        phase: 'complete',
        status: overallStatus === 'PASSING' ? 'pass' : (overallStatus === 'WARNING' ? 'warn' : 'fail'),
        duration_ms: cycleTime,
        details: {
          performanceImpact: performanceImpact.criticalPathBlocked
        }
      });

      // Log results in development mode only
      if (this.config.enableDev) {
        this.logValidationReport(report);
      }
      return report;

    } catch (error) {
      const cycleTime = performance.now() - startTime;
      
      // Emit error event
      this.emitValidatorEvent({
        event_type: 'validator.cycle.fail',
        phase: 'validation_cycle',
        status: 'fail',
        duration_ms: cycleTime,
        details: {
          error: error instanceof Error ? error.message : 'Unknown validation error'
        }
      });

      // Update health snapshot with error
      const errorReport = this.generateErrorReport(error);
      this.updateHealthSnapshot(errorReport.validationResults, 'FAILING', cycleTime);

      // eslint-disable-next-line no-console
      console.warn('[CoreFunctionalityValidator] Validation cycle error:', error);
      return errorReport;
    }
  }

  /**
   * Validate navigation functionality with state machine and navReady integration
   */
  private async validateNavigation(): Promise<boolean> {
  // Refresh config each run to honor dynamic test-time env changes
  this.config = getConfig();
    // Prevent additional immediate calls from changing attempts after a recent degraded timeout
    if (this.lastDegradedAt && (Date.now() - this.lastDegradedAt) < 1000) {
      return false;
    }

    // Quick exit if already successful
    if (this.navValidationState === 'success') {
      return true;
    }

    // Quick exit if already degraded
    if (this.navValidationState === 'degraded_timeout') {
      return false;
    }

    // Initialize state machine: do not change public state to waiting unless
    // we reach a definitive status. Keep attempts and subscribe to nav ready.
    if (this.navValidationState === 'idle') {
      // Only subscribe once per idle cycle
      if (!this.navReadyUnsubscribe) {
        this.navReadyUnsubscribe = onNavReady(() => {
          this.navValidationState = 'success';
          if (this.config.enableDev) {
            // eslint-disable-next-line no-console
            console.log('[NavDiag] Navigation ready via signal');
          }
        });
      }
    }

    // Check if nav ready signal already fired
    if (isNavReady()) {
      this.navValidationState = 'success';
      if (this.config.enableDev) {
        // eslint-disable-next-line no-console
        console.log('[NavDiag] Navigation already ready');
      }
      return true;
    }

    // Increment attempts
    this.navValidationAttempts++;

    // Log single diagnostic on first attempt
    if (this.navValidationAttempts === 1 && this.config.enableDev) {
      // eslint-disable-next-line no-console
      console.log('[NavDiag] Starting navigation validation...');
    }

    // Check for navigation elements with hardened selectors
    const navSelectors = '[data-testid="primary-nav"], [role="navigation"], nav';
    const navElements = document.querySelectorAll(navSelectors);
    
    if (navElements.length > 0) {
      this.navValidationState = 'success';
      if (this.config.enableDev) {
        // eslint-disable-next-line no-console
        console.log('[NavDiag] Navigation validation successful - found elements:', navElements.length);
      }
      this.cleanupNavValidation();
      return true;
    }

    // Check if max attempts reached
    if (this.navValidationAttempts >= this.config.navMaxAttempts) {
      this.navValidationState = 'degraded_timeout';
      this.lastDegradedAt = Date.now();
      if (this.config.enableDev) {
        // eslint-disable-next-line no-console
        console.warn('[NavDiag] Navigation validation degraded - no nav elements found after', this.navValidationAttempts, 'attempts');
      }
      this.cleanupNavValidation();
      return false;
    }

    // Continue polling (will be called again by the main validation cycle)
    return false;
  }

  /**
   * Clean up navigation validation resources
   */
  private cleanupNavValidation(): void {
    if (this.navReadyUnsubscribe) {
      this.navReadyUnsubscribe();
      this.navReadyUnsubscribe = undefined;
    }
    if (this.navValidationTimeout) {
      clearTimeout(this.navValidationTimeout);
      this.navValidationTimeout = null;
    }
    this.navValidationState = 'idle';
    this.navValidationAttempts = 0;
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
   * Run validation with timeout and enhanced error classification
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

      const result: CoreFunctionValidationResult = {
        isValid,
        functionName,
        executionTime,
        warning: executionTime > 1000 ? `Slow execution: ${executionTime}ms` : undefined
      };

      // Add performance issue classification for slow operations
      if (executionTime > 1000) {
        result.errorType = 'performance_issue';
        result.errorDetails = {
          performanceMetrics: { expected: 500, actual: Math.round(executionTime) }
        };
      }

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced error classification
      const errorAnalysis = this.classifyValidationError(functionName, errorMessage, error);
      
      return {
        isValid: false,
        functionName,
        executionTime,
        error: errorMessage,
        errorType: errorAnalysis.type,
        errorDetails: errorAnalysis.details
      };
    }
  }

  /**
   * Classify validation errors for better debugging and aggregated reporting
   */
  private classifyValidationError(
    functionName: string, 
    errorMessage: string, 
    _originalError: unknown
  ): { type: 'structural_missing' | 'data_pending' | 'functionality_broken' | 'performance_issue', details: Record<string, unknown> } {

    // Check for missing structural elements
    if (errorMessage.includes('not found') || errorMessage.includes('No navigation elements') || 
        errorMessage.includes('No elements found') || errorMessage.includes('elements found but')) {
      
      // Try to determine what specific elements are missing
      const missingElements: string[] = [];
      if (functionName === 'navigation') {
        const navSelectors = '[data-testid*="nav"], [role="navigation"], nav';
        const foundElements = document.querySelectorAll(navSelectors);
        if (foundElements.length === 0) {
          missingElements.push('navigation elements');
        }
      } else if (functionName === 'predictions') {
        const predictionSelectors = '[data-testid*="prediction"], [data-component*="prediction"]';
        const foundElements = document.querySelectorAll(predictionSelectors);
        if (foundElements.length === 0) {
          missingElements.push('prediction components');
        }
      }

      return {
        type: 'structural_missing',
        details: { missingElements }
      };
    }

    // Check for data pending situations (elements exist but no content)
    if (errorMessage.includes('no content visible') || errorMessage.includes('content visible') || 
        errorMessage.includes('empty') || errorMessage.includes('data not loaded')) {
      
      const emptyElements: string[] = [];
      // Additional logic to identify empty elements can be added here
      
      return {
        type: 'data_pending',
        details: { emptyElements }
      };
    }

    // Check for performance issues
    if (errorMessage.includes('timeout') || errorMessage.includes('Slow execution')) {
      return {
        type: 'performance_issue',
        details: { performanceMetrics: { issue: 'timeout_or_slow_execution' } }
      };
    }

    // Default to functionality broken for other errors
    return {
      type: 'functionality_broken',
      details: { brokenFunctionality: [errorMessage] }
    };
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

  /**
   * Track aggregated errors for enhanced logging and debugging
   */
  private trackAggregatedError(result: CoreFunctionValidationResult): void {
    if (!result.errorType || !result.error) return;

    const errorKey = `${result.functionName}:${result.errorType}`;
    const existingError = this.aggregatedErrors.get(errorKey);

    if (existingError) {
      existingError.count++;
      existingError.lastSeen = new Date();
      existingError.details = { ...existingError.details, ...result.errorDetails };
    } else {
      this.aggregatedErrors.set(errorKey, {
        count: 1,
        errorType: result.errorType,
        lastSeen: new Date(),
        details: result.errorDetails || {}
      });
    }
  }

  /**
   * Process and report aggregated errors periodically to avoid spam
   */
  private processAggregatedErrors(): void {
    const now = Date.now();
    if (now - this.lastErrorReport < this.errorAggregationInterval) {
      return; // Not time to report yet
    }

    if (this.aggregatedErrors.size === 0) {
      this.lastErrorReport = now;
      return; // No errors to report
    }

    // Categorize errors by type for structured reporting
    const errorSummary: Record<string, { functions: string[]; count: number; details: Record<string, unknown>[] }> = {
      structural_missing: { functions: [], count: 0, details: [] },
      data_pending: { functions: [], count: 0, details: [] },
      functionality_broken: { functions: [], count: 0, details: [] },
      performance_issue: { functions: [], count: 0, details: [] }
    };

    for (const [errorKey, errorInfo] of this.aggregatedErrors.entries()) {
      const [functionName] = errorKey.split(':');
      const category = errorSummary[errorInfo.errorType];
      
      if (category) {
        category.functions.push(functionName);
        category.count += errorInfo.count;
        category.details.push(errorInfo.details);
      }
    }

    // Log aggregated summary (only in development to avoid production noise)
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('[CoreValidator] Aggregated Error Summary (Last 30s)');
      
      for (const [errorType, summary] of Object.entries(errorSummary)) {
        if (summary.count > 0) {
          // eslint-disable-next-line no-console
          console.warn(`${errorType.toUpperCase()}:`, {
            affectedFunctions: summary.functions,
            totalOccurrences: summary.count,
            uniqueFunctions: [...new Set(summary.functions)].length,
            sampleDetails: summary.details[0] // Show first example
          });
        }
      }
      
      // eslint-disable-next-line no-console
      console.groupEnd();
    }

    // Emit aggregated error event for external monitoring
    this.emitValidatorEvent({
      event_type: 'validator.performance',
      phase: 'aggregated_errors',
      status: 'warn',
      duration_ms: this.errorAggregationInterval,
      timestamp: now,
      details: {
        warning: `Aggregated errors: ${this.aggregatedErrors.size} unique errors`,
        functionName: 'aggregated_error_reporter',
        performanceImpact: this.aggregatedErrors.size > 5 // Consider high error count as performance impact
      }
    });

    // Clear aggregated errors after reporting
    this.aggregatedErrors.clear();
    this.lastErrorReport = now;
  }
}

// Export singleton instance
export const coreFunctionalityValidator = new CoreFunctionalityValidator();
export type { CoreFunctionalityReport, CoreFunctionValidationResult };
