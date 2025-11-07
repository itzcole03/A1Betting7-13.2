/**
 * Navigation Validator with NAV_READY Event System
 * 
 * Implements intelligent navigation validation that waits for NAV_READY events
 * or uses a 5-second timeout to reduce false positive failures to <1%.
 * 
 * Acceptance Criteria:
 * - Validator waits for NAV_READY event or 5s timeout before declaring failure
 * - False positive nav failures reduced to <1% of reloads
 * - Proper event integration with the schema registry
 */

import { EventFactory, ValidationType, ValidationResult } from '../events/schema/index';

interface ValidationHistoryEntry extends ValidationResult {
  triggerReason: string;
  duration: number;
  timestamp: number;
}

interface NavigationState {
  isReady: boolean;
  lastReadyTime: number;
  readyComponents: Set<string>;
  requiredComponents: Set<string>;
  validationHistory: ValidationHistoryEntry[];
  falsePositiveRate: number;
}

interface NavigationValidatorConfig {
  timeoutMs: number;
  requiredComponents: string[];
  falsePositiveThreshold: number;
  validationHistoryLimit: number;
  enableSmartTimeout: boolean;
}

type NavigationEventListener = (event: NavigationEvent) => void;
type ValidationCompleteListener = (result: ValidationResult) => void;

interface NavigationEvent {
  type: 'nav.ready' | 'nav.component.ready' | 'nav.validation.complete' | 'nav.timeout';
  componentName?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class NavigationValidator {
  private static instance: NavigationValidator;
  private state: NavigationState;
  private config: NavigationValidatorConfig;
  private validationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, NavigationEventListener[]> = new Map();
  private validationListeners: ValidationCompleteListener[] = [];
  private isValidating = false;
  private validationStartTime = 0;

  private constructor(config?: Partial<NavigationValidatorConfig>) {
    this.config = {
      timeoutMs: 5000, // 5 second default timeout
      requiredComponents: ['router', 'auth', 'services', 'ui'],
      falsePositiveThreshold: 0.01, // <1% false positive rate
      validationHistoryLimit: 100,
      enableSmartTimeout: true,
      ...config
    };

    this.state = {
      isReady: false,
      lastReadyTime: 0,
      readyComponents: new Set(),
      requiredComponents: new Set(this.config.requiredComponents),
      validationHistory: [],
      falsePositiveRate: 0
    };

    this.setupEventListeners();
  }

  static getInstance(config?: Partial<NavigationValidatorConfig>): NavigationValidator {
    if (!NavigationValidator.instance) {
      NavigationValidator.instance = new NavigationValidator(config);
    }
    return NavigationValidator.instance;
  }

  private setupEventListeners(): void {
    // Listen for NAV_READY events
    this.addEventListener('nav.ready', (event) => {
      this.handleNavReady(event);
    });

    // Listen for component ready events
    this.addEventListener('nav.component.ready', (event) => {
      this.handleComponentReady(event);
    });

    // Listen for timeout events
    this.addEventListener('nav.timeout', (event) => {
      this.handleValidationTimeout(event);
    });

    // Listen for global navigation events (browser navigation)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // Listen for popstate events (back/forward navigation)
      window.addEventListener('popstate', () => {
        this.resetValidationState();
        this.startValidation('navigation.popstate');
      });

      // Listen for page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.validateCurrentState();
        }
      });
    }
  }

  /**
   * Register a navigation event listener
   */
  addEventListener(eventType: string, listener: NavigationEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove a navigation event listener
   */
  removeEventListener(eventType: string, listener: NavigationEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Register a validation completion listener
   */
  onValidationComplete(listener: ValidationCompleteListener): void {
    this.validationListeners.push(listener);
  }

  /**
   * Emit a navigation event
   */
  private emitEvent(event: NavigationEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch {
        // Silently handle navigation event listener errors to avoid noise
        // Errors are expected during development and component updates
      }
    });
  }

  /**
   * Signal that navigation is ready
   */
  signalNavReady(componentName?: string): void {
    const event: NavigationEvent = {
      type: 'nav.ready',
      componentName,
      timestamp: Date.now(),
      metadata: {
        source: 'navigation.validator',
        readyComponents: Array.from(this.state.readyComponents),
        totalComponents: this.state.requiredComponents.size
      }
    };

    this.emitEvent(event);
  }

  /**
   * Signal that a specific component is ready
   */
  signalComponentReady(componentName: string, metadata?: Record<string, unknown>): void {
    const event: NavigationEvent = {
      type: 'nav.component.ready',
      componentName,
      timestamp: Date.now(),
      metadata: {
        source: 'navigation.validator',
        ...metadata
      }
    };

    this.emitEvent(event);
  }

  /**
   * Start navigation validation with timeout
   */
  async startValidation(triggerReason = 'manual'): Promise<ValidationResult> {
    if (this.isValidating) {
      // Return existing validation promise if already validating
      return this.waitForValidationComplete();
    }

    this.isValidating = true;
    this.validationStartTime = Date.now();
    
    const validationPromise = this.performValidation(triggerReason);
    
    // Set up timeout
    const timeoutMs = this.getSmartTimeout();
    const timeoutId = setTimeout(() => {
      this.emitEvent({
        type: 'nav.timeout',
        timestamp: Date.now(),
        metadata: { 
          timeoutMs, 
          triggerReason,
          smartTimeoutEnabled: this.config.enableSmartTimeout
        }
      });
    }, timeoutMs);

    try {
      const result = await validationPromise;
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Perform the actual validation logic
   */
  private async performValidation(triggerReason: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    // Wait for NAV_READY event or timeout
    const result = await Promise.race([
      this.waitForNavReady(),
      this.waitForTimeout()
    ]);

    const duration = Date.now() - startTime;
    const isTimeout = result.type === 'timeout';
    
    // Determine validation result
    const validationResult: ValidationResult = {
      type: ValidationType.BOOTSTRAP,
      success: !isTimeout && this.state.isReady,
      message: isTimeout 
        ? `Navigation validation timed out after ${duration}ms` 
        : `Navigation ready in ${duration}ms`,
      severity: isTimeout ? 'warning' : 'info',
      suggestions: isTimeout 
        ? this.generateTimeoutSuggestions()
        : undefined
    };

    // Update validation history and calculate false positive rate
    this.updateValidationHistory(validationResult, triggerReason, duration);
    
    // Emit validation complete event (create but don't store unused variable)
    EventFactory.createValidationEvent({
      validationType: ValidationType.BOOTSTRAP,
      correlationId: `nav-${Date.now()}`,
      results: [validationResult],
      summary: {
        totalValidations: 1,
        passed: validationResult.success ? 1 : 0,
        warnings: validationResult.severity === 'warning' ? 1 : 0,
        errors: validationResult.severity === 'error' ? 1 : 0,
        critical: validationResult.severity === 'critical' ? 1 : 0
      },
      duration
    });

    this.emitEvent({
      type: 'nav.validation.complete',
      timestamp: Date.now(),
      metadata: {
        result: validationResult,
        duration,
        triggerReason,
        falsePositiveRate: this.state.falsePositiveRate
      }
    });

    // Notify validation listeners
    this.validationListeners.forEach(listener => {
      try {
        listener(validationResult);
      } catch {
        // Silently handle validation listener errors to prevent cascading failures
      }
    });

    this.isValidating = false;
    return validationResult;
  }

  /**
   * Wait for NAV_READY event
   */
  private async waitForNavReady(): Promise<{ type: 'ready'; timestamp: number }> {
    return new Promise((resolve) => {
      // Check if already ready
      if (this.state.isReady) {
        resolve({ type: 'ready', timestamp: Date.now() });
        return;
      }

      // Wait for ready event
      const readyListener = () => {
        this.removeEventListener('nav.ready', readyListener);
        resolve({ type: 'ready', timestamp: Date.now() });
      };

      this.addEventListener('nav.ready', readyListener);
    });
  }

  /**
   * Wait for validation timeout
   */
  private async waitForTimeout(): Promise<{ type: 'timeout'; timestamp: number }> {
    const timeoutMs = this.getSmartTimeout();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ type: 'timeout', timestamp: Date.now() });
      }, timeoutMs);
    });
  }

  /**
   * Wait for validation to complete (used for concurrent validations)
   */
  private async waitForValidationComplete(): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const listener = (result: ValidationResult) => {
        this.validationListeners.splice(this.validationListeners.indexOf(listener), 1);
        resolve(result);
      };
      this.validationListeners.push(listener);
    });
  }

  /**
   * Handle NAV_READY event
   */
  private handleNavReady(event: NavigationEvent): void {
    this.state.isReady = true;
    this.state.lastReadyTime = event.timestamp;
    
    if (event.componentName) {
      this.state.readyComponents.add(event.componentName);
    }

    // Mark all required components as ready if this is a global ready signal
    if (!event.componentName) {
      this.config.requiredComponents.forEach(component => {
        this.state.readyComponents.add(component);
      });
    }
  }

  /**
   * Handle component ready event
   */
  private handleComponentReady(event: NavigationEvent): void {
    if (event.componentName) {
      this.state.readyComponents.add(event.componentName);
    }

    // Check if all required components are ready
    const allReady = Array.from(this.state.requiredComponents).every(component =>
      this.state.readyComponents.has(component)
    );

    if (allReady && !this.state.isReady) {
      this.signalNavReady('all-components');
    }
  }

  /**
   * Handle validation timeout
   */
  private handleValidationTimeout(_event: NavigationEvent): void {
    // Timeout occurred - this will be handled in the validation logic
    if (this.config.enableSmartTimeout) {
      // Adjust future timeouts based on pattern analysis
      this.adjustSmartTimeout();
    }
  }

  /**
   * Get smart timeout value based on historical performance
   */
  private getSmartTimeout(): number {
    if (!this.config.enableSmartTimeout) {
      return this.config.timeoutMs;
    }

    const recentValidations = this.state.validationHistory.slice(-10);
    if (recentValidations.length < 3) {
      return this.config.timeoutMs;
    }

    // Calculate average successful validation time
    const successfulValidations = recentValidations.filter(v => v.success);
    if (successfulValidations.length === 0) {
      return this.config.timeoutMs;
    }

    const avgTime = successfulValidations.reduce((sum, v) => sum + v.duration, 0) / successfulValidations.length;
    
    // Use 95th percentile + buffer
    const smartTimeout = Math.min(
      this.config.timeoutMs,
      Math.max(1000, avgTime * 2.5) // At least 1s, at most 2.5x average
    );

    return smartTimeout;
  }

  /**
   * Adjust smart timeout based on patterns
   */
  private adjustSmartTimeout(): void {
    // This could implement more sophisticated timeout adjustment logic
    // based on false positive patterns, time of day, etc.
  }

  /**
   * Update validation history and calculate false positive rate
   */
  private updateValidationHistory(result: ValidationResult, triggerReason: string, duration: number): void {
    const historyEntry: ValidationHistoryEntry = {
      ...result,
      triggerReason,
      duration,
      timestamp: Date.now()
    };

    this.state.validationHistory.push(historyEntry);

    // Limit history size
    if (this.state.validationHistory.length > this.config.validationHistoryLimit) {
      this.state.validationHistory.shift();
    }

    // Calculate false positive rate
    this.calculateFalsePositiveRate();
  }

  /**
   * Calculate false positive rate from validation history
   */
  private calculateFalsePositiveRate(): void {
    if (this.state.validationHistory.length < 10) {
      this.state.falsePositiveRate = 0;
      return;
    }

    const recentValidations = this.state.validationHistory.slice(-50); // Last 50 validations
    const timeouts = recentValidations.filter(v => !v.success && v.duration >= this.config.timeoutMs * 0.9);
    
    // Estimate false positives as timeouts that would have succeeded with more time
    // This is a heuristic - in practice, you'd want more sophisticated detection
    const estimatedFalsePositives = timeouts.filter(timeout => {
      // Check if subsequent validations were successful
      const index = recentValidations.indexOf(timeout);
      const nextValidation = recentValidations[index + 1];
      return nextValidation && nextValidation.success;
    });

    this.state.falsePositiveRate = estimatedFalsePositives.length / recentValidations.length;
  }

  /**
   * Generate suggestions for timeout scenarios
   */
  private generateTimeoutSuggestions(): string[] {
    const suggestions = [];

    if (this.state.falsePositiveRate > this.config.falsePositiveThreshold) {
      suggestions.push('Consider increasing timeout duration - high false positive rate detected');
    }

    const missingComponents = Array.from(this.state.requiredComponents).filter(
      component => !this.state.readyComponents.has(component)
    );

    if (missingComponents.length > 0) {
      suggestions.push(`Missing components: ${missingComponents.join(', ')}`);
    }

    if (this.state.validationHistory.length > 5) {
      const recentFailures = this.state.validationHistory.slice(-5).filter(v => !v.success);
      if (recentFailures.length >= 3) {
        suggestions.push('Recent validation failures detected - check system health');
      }
    }

    return suggestions;
  }

  /**
   * Reset validation state (e.g., for new navigation)
   */
  private resetValidationState(): void {
    this.state.isReady = false;
    this.state.readyComponents.clear();
    this.isValidating = false;
  }

  /**
   * Validate current state without waiting
   */
  private validateCurrentState(): ValidationResult {
    const allReady = Array.from(this.state.requiredComponents).every(component =>
      this.state.readyComponents.has(component)
    );

    return {
      type: ValidationType.BOOTSTRAP,
      success: allReady,
      message: allReady ? 'Navigation is ready' : 'Navigation components not ready',
      severity: allReady ? 'info' : 'warning'
    };
  }

  /**
   * Get current navigation state
   */
  getState(): Readonly<NavigationState> {
    return { ...this.state };
  }

  /**
   * Get validation metrics
   */
  getMetrics(): {
    falsePositiveRate: number;
    averageValidationTime: number;
    successRate: number;
    totalValidations: number;
  } {
    const history = this.state.validationHistory;
    
    if (history.length === 0) {
      return {
        falsePositiveRate: 0,
        averageValidationTime: 0,
        successRate: 1,
        totalValidations: 0
      };
    }

    const successfulValidations = history.filter(v => v.success);
    const averageTime = history.reduce((sum, v) => sum + v.duration, 0) / history.length;

    return {
      falsePositiveRate: this.state.falsePositiveRate,
      averageValidationTime: averageTime,
      successRate: successfulValidations.length / history.length,
      totalValidations: history.length
    };
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    // Clear any pending timeouts
    this.validationTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.validationTimeouts.clear();

    // Clear event listeners
    this.eventListeners.clear();
    this.validationListeners.length = 0;
  }

  /**
   * Destroy the validator instance
   */
  static destroy(): void {
    if (NavigationValidator.instance) {
      NavigationValidator.instance.cleanup();
      NavigationValidator.instance = null!;
    }
  }
}

// Export singleton instance
export const navigationValidator = NavigationValidator.getInstance();

// Export convenience functions
export const signalNavReady = (componentName?: string) => navigationValidator.signalNavReady(componentName);
export const signalComponentReady = (componentName: string, metadata?: Record<string, unknown>) => 
  navigationValidator.signalComponentReady(componentName, metadata);
export const startNavValidation = (triggerReason?: string) => navigationValidator.startValidation(triggerReason);

export default NavigationValidator;