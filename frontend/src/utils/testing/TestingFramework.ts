// Testing utilities and framework for A1Betting
import * as React from 'react';
export interface TestSuite {
  name: string;
  description: string;
  tests: Test[];
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
  timeout?: number;
}

export interface Test {
  name: string;
  description: string;
  testFn: () => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
}

export interface TestResult {
  suiteName: string;
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
  timestamp: number;
}

export interface TestRunner {
  run(): Promise<TestReport>;
  addSuite(suite: TestSuite): void;
  addTest(suiteName: string, test: Test): void;
}

export interface TestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: TestResult[];
  coverage?: CoverageReport;
}

export interface CoverageReport {
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

// Mock data generator for testing
export class MockDataGenerator {
  static generatePlayer(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      name: this.generatePlayerName(),
      team: this.generateTeam(),
      position: this.generatePosition(),
      sport: 'MLB',
      stats: {
        avg: this.generateNumber(0.2, 0.4, 3),
        hr: this.generateNumber(0, 50),
        rbi: this.generateNumber(0, 150),
        ops: this.generateNumber(0.6, 1.2, 3),
      },
      ...overrides,
    };
  }

  static generatePrediction(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      player: this.generatePlayerName(),
      market: this.generateMarket(),
      line: this.generateNumber(0.5, 50, 1),
      pick: this.generatePick(),
      confidence: this.generateNumber(60, 99),
      edge: this.generateNumber(0, 25, 1),
      reasoning: this.generateReasoning(),
      ...overrides,
    };
  }

  static generateGame(overrides: Partial<any> = {}): any {
    return {
      id: this.generateId(),
      homeTeam: this.generateTeam(),
      awayTeam: this.generateTeam(),
      date: this.generateDate(),
      sport: 'MLB',
      status: 'scheduled',
      ...overrides,
    };
  }

  private static generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generatePlayerName(): string {
    const firstNames = ['Mike', 'John', 'David', 'Chris', 'Matt', 'Ryan', 'Alex', 'Josh'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];

    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
      lastNames[Math.floor(Math.random() * lastNames.length)]
    }`;
  }

  private static generateTeam(): string {
    const teams = ['LAD', 'NYY', 'HOU', 'ATL', 'SF', 'BOS', 'TB', 'SD'];
    return teams[Math.floor(Math.random() * teams.length)];
  }

  private static generatePosition(): string {
    const positions = ['1B', '2B', '3B', 'SS', 'OF', 'C', 'DH', 'P'];
    return positions[Math.floor(Math.random() * positions.length)];
  }

  private static generateMarket(): string {
    const markets = ['Total Bases', 'Hits', 'Home Runs', 'RBIs', 'Runs', 'Strikeouts'];
    return markets[Math.floor(Math.random() * markets.length)];
  }

  private static generatePick(): 'OVER' | 'UNDER' {
    return Math.random() > 0.5 ? 'OVER' : 'UNDER';
  }

  private static generateReasoning(): string[] {
    const reasons = [
      'Strong recent performance vs opposing pitcher type',
      'Favorable ballpark factors for this prop',
      'Historical matchup data suggests value',
      'Weather conditions favor offensive production',
      'Team implied run total supports this play',
    ];

    const count = Math.floor(Math.random() * 3) + 1;
    return reasons.slice(0, count);
  }

  private static generateNumber(min: number, max: number, decimals = 0): number {
    const num = Math.random() * (max - min) + min;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  private static generateDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 7));
    return date.toISOString().split('T')[0];
  }
}

// Test utilities for DOM manipulation and assertions
export class TestUtils {
  static async waitFor(condition: () => boolean, timeout = 5000, interval = 100): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return;
      }
      await this.sleep(interval);
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static fireEvent(element: Element, eventType: string, eventInit?: EventInit): void {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...eventInit });
    element.dispatchEvent(event);
  }

  static mockFetch(responses: Record<string, any>): void {
    const originalFetch = global.fetch;
    global.fetch = jest.fn((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      const response = responses[url];
      if (!response) {
        return Promise.reject(new Error(`No mock response for ${url}`));
      }
      return Promise.resolve({
        ok: response.ok !== false,
        status: response.status || 200,
        json: () => Promise.resolve(response.data || response),
        text: () => Promise.resolve(JSON.stringify(response.data || response)),
      } as Response);
    }) as typeof global.fetch;
    // Store original for cleanup
    (global.fetch as any).__original = originalFetch;
  }

  static restoreFetch(): void {
    if ((global.fetch as any).__original) {
      global.fetch = (global.fetch as any).__original;
    }
  }

  static mockLocalStorage(): void {
    const localStorage: {
      store: Record<string, string>;
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
      clear: () => void;
    } = {
      store: {} as Record<string, string>,
      getItem: jest.fn((key: string): string | null => localStorage.store[key] || null),
      setItem: jest.fn((key: string, value: string): void => {
        localStorage.store[key] = value;
      }),
      removeItem: jest.fn((key: string): void => {
        delete localStorage.store[key];
      }),
      clear: jest.fn((): void => {
        localStorage.store = {};
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorage,
      writable: true,
    });
  }

  static createMockComponent(name: string): React.ComponentType<any> {
    const MockComponent: React.FC<any> = props => {
      return React.createElement(
        'div',
        {
          'data-testid': `mock-${name.toLowerCase()}`,
          ...props,
        },
        `Mock ${name}`
      );
    };

    MockComponent.displayName = `Mock${name}`;
    return MockComponent;
  }

  static assertElementExists(selector: string): Element {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    return element;
  }

  static assertElementCount(selector: string, expectedCount: number): void {
    const elements = document.querySelectorAll(selector);
    if (elements.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} elements with selector "${selector}", found ${elements.length}`
      );
    }
  }

  static assertElementText(selector: string, expectedText: string): void {
    const element = this.assertElementExists(selector);
    const actualText = element.textContent?.trim();
    if (actualText !== expectedText) {
      throw new Error(
        `Expected element "${selector}" to have text "${expectedText}", found "${actualText}"`
      );
    }
  }

  static assertElementClass(selector: string, className: string): void {
    const element = this.assertElementExists(selector);
    if (!element.classList.contains(className)) {
      throw new Error(`Expected element "${selector}" to have class "${className}"`);
    }
  }
}

// Performance testing utilities
export class PerformanceTestUtils {
  static async measureRenderTime(renderFn: () => void): Promise<number> {
    const startTime = performance.now();
    renderFn();
    await TestUtils.sleep(0); // Allow render to complete
    return performance.now() - startTime;
  }

  static async measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{
    result: T;
    duration: number;
  }> {
    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;
    return { result, duration };
  }

  static createPerformanceTest(
    name: string,
    operation: () => void | Promise<void>,
    maxDuration: number
  ): Test {
    return {
      name: `Performance: ${name}`,
      description: `Should complete within ${maxDuration}ms`,
      testFn: async () => {
        const startTime = performance.now();
        await operation();
        const duration = performance.now() - startTime;

        if (duration > maxDuration) {
          throw new Error(`Operation took ${duration.toFixed(2)}ms, expected < ${maxDuration}ms`);
        }
      },
    };
  }

  static memoryLeakTest(name: string, operation: () => void, iterations = 100): Test {
    return {
      name: `Memory Leak: ${name}`,
      description: 'Should not leak memory over multiple iterations',
      testFn: async () => {
        if (!(performance as any).memory) {
          console.warn('Memory testing not available in this environment');
          return;
        }

        const initialMemory = (performance as any).memory.usedJSHeapSize;

        for (let i = 0; i < iterations; i++) {
          operation();

          // Force garbage collection every 10 iterations
          if (i % 10 === 0 && (global as any).gc) {
            (global as any).gc();
          }
        }

        const finalMemory = (performance as any).memory.usedJSHeapSize;
        const memoryIncrease = finalMemory - initialMemory;
        const threshold = 5 * 1024 * 1024; // 5MB threshold

        if (memoryIncrease > threshold) {
          throw new Error(
            `Memory leak detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`
          );
        }
      },
    };
  }
}

// Integration test utilities
export class IntegrationTestUtils {
  static createApiTest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    payload?: any
  ): Test {
    return {
      name: `API: ${method} ${endpoint}`,
      description: `Should successfully call ${method} ${endpoint}`,
      testFn: async () => {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (payload && method !== 'GET') {
          options.body = JSON.stringify(payload);
        }

        const response = await fetch(endpoint, options);

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      },
    };
  }

  static createE2ETest(
    name: string,
    steps: Array<{
      description: string;
      action: () => void | Promise<void>;
      assertion?: () => void;
    }>
  ): Test {
    return {
      name: `E2E: ${name}`,
      description: 'End-to-end user journey test',
      testFn: async () => {
        for (const step of steps) {
          try {
            await step.action();
            if (step.assertion) {
              step.assertion();
            }
          } catch (error) {
            throw new Error(`E2E test failed at step "${step.description}": ${error}`);
          }
        }
      },
    };
  }
}

// Accessibility testing utilities
export class A11yTestUtils {
  static checkAriaLabels(container: Element): string[] {
    const issues: string[] = [];
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [role="link"]'
    );

    interactiveElements.forEach((element, index) => {
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
      const hasTitle = element.hasAttribute('title');
      const hasTextContent = element.textContent?.trim();

      if (!hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !hasTextContent) {
        issues.push(`Interactive element at index ${index} lacks accessible name`);
      }
    });

    return issues;
  }

  static checkColorContrast(element: Element): boolean {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // Basic contrast check (simplified)
    // In a real implementation, you'd use a proper contrast calculation
    return backgroundColor !== color;
  }

  static checkKeyboardNavigation(container: Element): string[] {
    const issues: string[] = [];
    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push(`Element at index ${index} has positive tabindex (${tabIndex})`);
      }
    });

    return issues;
  }

  static createA11yTest(name: string, getContainer: () => Element): Test {
    return {
      name: `A11y: ${name}`,
      description: 'Accessibility compliance test',
      testFn: () => {
        const container = getContainer();
        const issues: string[] = [];

        issues.push(...this.checkAriaLabels(container));
        issues.push(...this.checkKeyboardNavigation(container));

        if (issues.length > 0) {
          throw new Error(`Accessibility issues found:\n${issues.join('\n')}`);
        }
      },
    };
  }
}

// Export all utilities

// Example test suites for A1Betting components
export const createA1BettingTestSuites = (): TestSuite[] => [
  {
    name: 'PlayerDashboard',
    description: 'Tests for player dashboard functionality',
    tests: [
      {
        name: 'Should render player information',
        description: 'Player dashboard displays basic player info correctly',
        testFn: () => {
          const mockPlayer = MockDataGenerator.generatePlayer();
          // Test implementation would go here
          console.log('Testing player dashboard with:', mockPlayer);
        },
      },
      PerformanceTestUtils.createPerformanceTest(
        'Player dashboard render',
        () => {
          // Render player dashboard
        },
        100 // 100ms max
      ),
    ],
  },
  {
    name: 'AIPredictions',
    description: 'Tests for AI predictions functionality',
    tests: [
      {
        name: 'Should display prediction confidence',
        description: 'AI predictions show confidence scores correctly',
        testFn: () => {
          const mockPrediction = MockDataGenerator.generatePrediction();
          // Test implementation would go here
          console.log('Testing AI predictions with:', mockPrediction);
        },
      },
      IntegrationTestUtils.createApiTest('/api/predictions', 'GET'),
    ],
  },
];
