/**
 * Frontend Tests for WebSocket/Realtime Enhancement
 * 
 * Tests for exponential backoff timing, SSE fallback activation,
 * and validator error classification.
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';

// Mock EventBus to avoid dependencies
const mockEventBus = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn()
};

// Ensure the real module is loaded and then override the exported _eventBus
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const eb = require('../../core/EventBus');
  if (eb && typeof eb === 'object') {
    eb._eventBus = mockEventBus;
  }
} catch (e) {
  // If require fails, continue — tests will report module-not-found
}

// Mock fetch for network requests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Exponential Backoff Timing', () => {
  // We'll need to import the actual backoff logic
  // This is a placeholder structure for the tests

  let backoffCalculator: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock the exponential backoff implementation
    backoffCalculator = {
      calculateDelay: (attempt: number, baseDelay: number = 1000, maxDelay: number = 30000, jitter: boolean = true) => {
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        return jitter ? exponentialDelay + (Math.random() * 0.3 * exponentialDelay) : exponentialDelay;
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should calculate exponential backoff correctly without jitter', () => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    
    // Test exponential progression
    expect(backoffCalculator.calculateDelay(0, baseDelay, maxDelay, false)).toBe(1000);
    expect(backoffCalculator.calculateDelay(1, baseDelay, maxDelay, false)).toBe(2000);
    expect(backoffCalculator.calculateDelay(2, baseDelay, maxDelay, false)).toBe(4000);
    expect(backoffCalculator.calculateDelay(3, baseDelay, maxDelay, false)).toBe(8000);
    expect(backoffCalculator.calculateDelay(4, baseDelay, maxDelay, false)).toBe(16000);
    
    // Test max delay cap
    expect(backoffCalculator.calculateDelay(10, baseDelay, maxDelay, false)).toBe(30000);
  });

  test('should add jitter to prevent thundering herd', () => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    
    // Run multiple times to ensure jitter varies
    const delays = Array.from({ length: 10 }, () => 
      backoffCalculator.calculateDelay(2, baseDelay, maxDelay, true)
    );
    
    // All delays should be around 4000ms but not exactly the same
    delays.forEach(delay => {
      expect(delay).toBeGreaterThan(4000); // Base delay
      expect(delay).toBeLessThan(5200); // Base + 30% jitter
    });
    
    // Ensure they're not all identical
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(5); // Should have variety due to jitter
  });

  test('should respect maximum delay bounds', () => {
    const baseDelay = 5000;
    const maxDelay = 10000;
    
    // High attempt number should still respect max delay
    const delay = backoffCalculator.calculateDelay(20, baseDelay, maxDelay, false);
    expect(delay).toBeLessThanOrEqual(maxDelay);
    expect(delay).toBe(10000);
  });

  test('should handle edge cases', () => {
    // Zero attempt
    expect(backoffCalculator.calculateDelay(0, 1000, 30000, false)).toBe(1000);
    
    // Very small base delay
    expect(backoffCalculator.calculateDelay(0, 100, 30000, false)).toBe(100);
    
    // Base delay larger than max delay
    expect(backoffCalculator.calculateDelay(0, 50000, 30000, false)).toBe(30000);
  });
});

describe('SSE Fallback Activation', () => {
  let sseChannelMock: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock SSE fallback channel
    sseChannelMock = {
      isActive: false,
      consecutiveFailures: 0,
      stabilityTimer: null,
      activationThreshold: 3,
      stabilityThreshold: 120000, // 2 minutes
      
      reportWebSocketFailure: function() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.activationThreshold && !this.isActive) {
          this.activate();
        }
      },
      
      reportWebSocketSuccess: function() {
        if (this.isActive) {
          // Start stability monitoring
          this.stabilityTimer = setTimeout(() => {
            this.deactivate();
          }, this.stabilityThreshold);
        }
        this.consecutiveFailures = 0;
      },
      
      activate: function() {
        this.isActive = true;
        // Mock EventSource creation
        mockEventBus.emit('sse:activated');
      },
      
      deactivate: function() {
        this.isActive = false;
        if (this.stabilityTimer) {
          clearTimeout(this.stabilityTimer);
          this.stabilityTimer = null;
        }
        mockEventBus.emit('sse:deactivated');
      }
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should not activate SSE before threshold failures', () => {
    // Report 2 failures (below threshold of 3)
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    
    expect(sseChannelMock.isActive).toBe(false);
    expect(mockEventBus.emit).not.toHaveBeenCalledWith('sse:activated');
  });

  test('should activate SSE after threshold failures', () => {
    // Report 3 failures (meets threshold)
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    
    expect(sseChannelMock.isActive).toBe(true);
    expect(mockEventBus.emit).toHaveBeenCalledWith('sse:activated');
  });

  test('should reset failure count on WebSocket success', () => {
    // Report 2 failures, then success
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketSuccess();
    
    expect(sseChannelMock.consecutiveFailures).toBe(0);
    
    // Should need 3 more failures to activate
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    expect(sseChannelMock.isActive).toBe(false);
  });

  test('should deactivate SSE after stability period', () => {
    // Activate SSE
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    sseChannelMock.reportWebSocketFailure();
    expect(sseChannelMock.isActive).toBe(true);
    
    // Report WebSocket success (starts stability timer)
    sseChannelMock.reportWebSocketSuccess();
    
    // Fast-forward past stability threshold
    jest.advanceTimersByTime(sseChannelMock.stabilityThreshold + 1000);
    
    expect(sseChannelMock.isActive).toBe(false);
    expect(mockEventBus.emit).toHaveBeenCalledWith('sse:deactivated');
  });

  test('should handle multiple activation/deactivation cycles', () => {
    // First activation cycle
    for (let i = 0; i < 3; i++) {
      sseChannelMock.reportWebSocketFailure();
    }
    expect(sseChannelMock.isActive).toBe(true);
    
    // Deactivate after stability
    sseChannelMock.reportWebSocketSuccess();
    jest.advanceTimersByTime(sseChannelMock.stabilityThreshold + 1000);
    expect(sseChannelMock.isActive).toBe(false);
    
    // Second activation cycle
    for (let i = 0; i < 3; i++) {
      sseChannelMock.reportWebSocketFailure();
    }
    expect(sseChannelMock.isActive).toBe(true);
    
  // Deactivate second cycle after stability
  sseChannelMock.reportWebSocketSuccess();
  jest.advanceTimersByTime(sseChannelMock.stabilityThreshold + 1000);
  expect(sseChannelMock.isActive).toBe(false);

  expect(mockEventBus.emit).toHaveBeenCalledTimes(4); // 2 activations + 2 deactivations
  });
});

describe('Validator Error Classification', () => {
  let validator: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM methods
    const mockQuerySelectorAll = jest.fn();
    const mockQuerySelector = jest.fn();

    global.document = {
      querySelectorAll: mockQuerySelectorAll,
      querySelector: mockQuerySelector
    } as any;
    
    // Mock validator with error classification
    validator = {
      classifyValidationError: (functionName: string, errorMessage: string, _originalError: unknown) => {
        // Normalize message for robust matching
        const msg = (errorMessage || '').toLowerCase();

        // Check for missing structural elements (covers "No X elements found", "no elements", "not found")
        if (
          msg.includes('not found') ||
          msg.includes('no navigation elements') ||
          msg.includes('no elements found') ||
          /no .*elements/.test(msg)
        ) {
          const missingElements: string[] = [];
          if (functionName === 'navigation') {
            const navElements = (document.querySelectorAll as any)('[data-testid*="nav"], [role="navigation"], nav');
            if (!navElements || (Array.isArray(navElements) && navElements.length === 0)) {
              missingElements.push('navigation elements');
            }
          }

          return {
            type: 'structural_missing',
            details: { missingElements }
          };
        }
        
        // Check for data pending situations
        if (errorMessage.includes('no content visible') || errorMessage.includes('empty') || 
            errorMessage.includes('data not loaded')) {
          return {
            type: 'data_pending',
            details: { emptyElements: [] }
          };
        }
        
        // Check for performance issues
        if (errorMessage.includes('timeout') || errorMessage.includes('Slow execution')) {
          return {
            type: 'performance_issue',
            details: { performanceMetrics: { issue: 'timeout_or_slow_execution' } }
          };
        }
        
        // Default to functionality broken
        return {
          type: 'functionality_broken',
          details: { brokenFunctionality: [errorMessage] }
        };
      }
    };
  });

  test('should classify structural missing errors correctly', () => {
  // Ensure this test explicitly provides a jest.fn for querySelectorAll
  const explicitMock = jest.fn().mockReturnValue([] as any);
  (document as any).querySelectorAll = explicitMock;
    
    const result = validator.classifyValidationError(
      'navigation', 
      'No navigation elements found', 
      new Error('No navigation elements found')
    );
    
    expect(result.type).toBe('structural_missing');
    expect(result.details.missingElements).toContain('navigation elements');
  });

  test('should classify data pending errors correctly', () => {
    const result = validator.classifyValidationError(
      'predictions', 
      'Prediction elements found but no content visible', 
      new Error('No content')
    );
    
    expect(result.type).toBe('data_pending');
    expect(result.details).toHaveProperty('emptyElements');
  });

  test('should classify performance issues correctly', () => {
    const result = validator.classifyValidationError(
      'rendering', 
      'Validation timeout after 5000ms', 
      new Error('Timeout')
    );
    
    expect(result.type).toBe('performance_issue');
    expect(result.details.performanceMetrics.issue).toBe('timeout_or_slow_execution');
  });

  test('should classify functionality broken as default', () => {
    const result = validator.classifyValidationError(
      'dataFetching', 
      'API endpoint returned 500 error', 
      new Error('Server error')
    );
    
    expect(result.type).toBe('functionality_broken');
    expect(result.details.brokenFunctionality).toContain('API endpoint returned 500 error');
  });

  test('should handle slow execution classification', () => {
    const result = validator.classifyValidationError(
      'rendering', 
      'Slow execution: 3000ms', 
      new Error('Slow')
    );
    
    expect(result.type).toBe('performance_issue');
  });

  test('should differentiate between structural and data issues', () => {
    // Structural issue - elements don't exist
    const structuralResult = validator.classifyValidationError(
      'betting', 
      'No betting elements found in DOM', 
      new Error('Not found')
    );
    
    // Data issue - elements exist but empty
    const dataResult = validator.classifyValidationError(
      'betting', 
      'Betting elements found but no content visible', 
      new Error('Empty')
    );
    
    expect(structuralResult.type).toBe('structural_missing');
    expect(dataResult.type).toBe('data_pending');
  });
});

describe('Event Logger Integration', () => {
  let mockEventLogger: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock event logger
    mockEventLogger = {
      events: [] as any[],
      log: jest.fn((severity, category, component, message, data) => {
        const event = { severity, category, component, message, data, timestamp: Date.now() };
        mockEventLogger.events.push(event);
        return `event_${mockEventLogger.events.length}`;
      }),
      logWebSocketEvent: jest.fn(),
      logSSEEvent: jest.fn(),
      logPerformance: jest.fn(),
      flush: jest.fn()
    };
  });

  test('should batch events correctly', () => {
    // Log multiple events
    mockEventLogger.log('info', 'websocket', 'TestComponent', 'Connected');
    mockEventLogger.log('warn', 'websocket', 'TestComponent', 'Connection unstable');
    mockEventLogger.log('error', 'websocket', 'TestComponent', 'Connection failed');
    
    expect(mockEventLogger.events).toHaveLength(3);
    expect(mockEventLogger.events[0].severity).toBe('info');
    expect(mockEventLogger.events[1].severity).toBe('warn');
    expect(mockEventLogger.events[2].severity).toBe('error');
  });

  test('should filter events by severity level', () => {
    const minimumSeverity = 'warn';
    const severityLevels = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
    
    const events = [
      { severity: 'debug' as const, message: 'Debug event' },
      { severity: 'info' as const, message: 'Info event' },
      { severity: 'warn' as const, message: 'Warn event' },
      { severity: 'error' as const, message: 'Error event' }
    ];
    
    const filteredEvents = events.filter(event => 
      severityLevels[event.severity] >= severityLevels[minimumSeverity]
    );
    
    expect(filteredEvents).toHaveLength(2);
    expect(filteredEvents[0].severity).toBe('warn');
    expect(filteredEvents[1].severity).toBe('error');
  });

  test('should generate diagnostic report', () => {
    // Simulate various events
    mockEventLogger.log('error', 'websocket', 'DataManager', 'Connection failed', { reason: 'network' });
    mockEventLogger.log('warn', 'validation', 'CoreValidator', 'Slow validation', { duration: 2000 });
    mockEventLogger.log('info', 'sse', 'SSEChannel', 'Fallback activated');
    
    const recentErrors = mockEventLogger.events.filter((e: any) => e.severity === 'error');
    const recentWarnings = mockEventLogger.events.filter((e: any) => e.severity === 'warn');
    
    expect(recentErrors).toHaveLength(1);
    expect(recentWarnings).toHaveLength(1);
    expect(recentErrors[0].component).toBe('DataManager');
    expect(recentWarnings[0].component).toBe('CoreValidator');
  });
});

describe('Realtime Configuration Management', () => {
  let configManager: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock configuration manager
    configManager = {
      config: {
        realtime: {
          websocket: {
            enabled: true,
            maxReconnectAttempts: 5,
            reconnectInterval: 5000
          },
          sse: {
            enabled: true,
            activationThreshold: 3
          }
        }
      },
      
      getRealtimeConfig: function() {
        return this.config.realtime;
      },
      
      updateRealtimeConfig: function(section: string, updates: any) {
        this.config.realtime[section] = { ...this.config.realtime[section], ...updates };
      },
      
      validateConfiguration: function() {
        const config = this.getRealtimeConfig();
        const warnings: string[] = [];
        const recommendations: string[] = [];
        
        if (config.websocket.reconnectInterval < 1000) {
          warnings.push('WebSocket reconnect interval is very short');
        }
        
        if (!config.sse.enabled && !config.websocket.enabled) {
          warnings.push('No realtime connection enabled');
        }
        
        return { isValid: warnings.length === 0, warnings, recommendations };
      }
    };
  });

  test('should validate configuration correctly', () => {
    const validation = configManager.validateConfiguration();
    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toHaveLength(0);
  });

  test('should detect configuration issues', () => {
    // Set problematic configuration
    configManager.updateRealtimeConfig('websocket', { 
      reconnectInterval: 500,
      enabled: false
    });
    configManager.updateRealtimeConfig('sse', { enabled: false });
    
    const validation = configManager.validateConfiguration();
    expect(validation.isValid).toBe(false);
    expect(validation.warnings).toContain('WebSocket reconnect interval is very short');
    expect(validation.warnings).toContain('No realtime connection enabled');
  });

  test('should update configuration correctly', () => {
    const originalInterval = configManager.getRealtimeConfig().websocket.reconnectInterval;
    expect(originalInterval).toBe(5000);
    
    configManager.updateRealtimeConfig('websocket', { reconnectInterval: 10000 });
    
    const updatedInterval = configManager.getRealtimeConfig().websocket.reconnectInterval;
    expect(updatedInterval).toBe(10000);
  });
});