// Enhanced Test Utilities for Phase 4 Testing Automation
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock Data Types
export interface MockPlayer {
  id: number;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  projections: Record<string, number>;
}

export interface MockGame {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  sport: string;
  status: 'scheduled' | 'live' | 'completed';
  score?: { home: number; away: number };
}

export interface MockOdds {
  id: number;
  gameId: number;
  sportsbook: string;
  marketType: string;
  odds: number;
  line?: number;
  lastUpdated: string;
}

export interface MockPrediction {
  id: number;
  playerId: number;
  gameId: number;
  prop: string;
  prediction: number;
  confidence: number;
  reasoning: string;
  createdAt: string;
}

export interface MockUser {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  settings: Record<string, any>;
}

// Data Factories
export class TestDataFactory {
  static createMockPlayer(overrides: Partial<MockPlayer> = {}): MockPlayer {
    return {
      id: Math.floor(Math.random() * 1000),
      name: `Player ${Math.floor(Math.random() * 100)}`,
      team: ['LAL', 'GSW', 'BOS', 'MIA', 'NYK'][Math.floor(Math.random() * 5)],
      position: ['PG', 'SG', 'SF', 'PF', 'C'][Math.floor(Math.random() * 5)],
      stats: {
        points: Math.floor(Math.random() * 30) + 10,
        rebounds: Math.floor(Math.random() * 15) + 3,
        assists: Math.floor(Math.random() * 12) + 2,
        field_goal_percentage: Math.random() * 0.6 + 0.3,
      },
      projections: {
        points: Math.floor(Math.random() * 35) + 8,
        rebounds: Math.floor(Math.random() * 18) + 2,
        assists: Math.floor(Math.random() * 15) + 1,
      },
      ...overrides,
    };
  }

  static createMockGame(overrides: Partial<MockGame> = {}): MockGame {
    const teams = ['LAL', 'GSW', 'BOS', 'MIA', 'NYK', 'CHI', 'PHX', 'DAL'];
    return {
      id: Math.floor(Math.random() * 1000),
      homeTeam: teams[Math.floor(Math.random() * teams.length)],
      awayTeam: teams[Math.floor(Math.random() * teams.length)],
      date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      sport: ['NBA', 'NFL', 'MLB', 'NHL'][Math.floor(Math.random() * 4)],
      status: ['scheduled', 'live', 'completed'][Math.floor(Math.random() * 3)] as any,
      score: Math.random() > 0.5 ? {
        home: Math.floor(Math.random() * 120) + 80,
        away: Math.floor(Math.random() * 120) + 80,
      } : undefined,
      ...overrides,
    };
  }

  static createMockOdds(overrides: Partial<MockOdds> = {}): MockOdds {
    return {
      id: Math.floor(Math.random() * 1000),
      gameId: Math.floor(Math.random() * 100),
      sportsbook: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'][Math.floor(Math.random() * 4)],
      marketType: ['moneyline', 'spread', 'total', 'player_props'][Math.floor(Math.random() * 4)],
      odds: Math.floor(Math.random() * 400) - 200,
      line: Math.random() > 0.5 ? Math.random() * 20 - 10 : undefined,
      lastUpdated: new Date().toISOString(),
      ...overrides,
    };
  }

  static createMockPrediction(overrides: Partial<MockPrediction> = {}): MockPrediction {
    return {
      id: Math.floor(Math.random() * 1000),
      playerId: Math.floor(Math.random() * 100),
      gameId: Math.floor(Math.random() * 50),
      prop: ['points', 'rebounds', 'assists', 'steals', 'blocks'][Math.floor(Math.random() * 5)],
      prediction: Math.floor(Math.random() * 50) + 5,
      confidence: Math.floor(Math.random() * 30) + 70,
      reasoning: 'AI-generated prediction based on historical data and current form.',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  static createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: Math.floor(Math.random() * 1000),
      username: `user${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      role: ['user', 'admin', 'premium'][Math.floor(Math.random() * 3)] as any,
      settings: {
        theme: 'dark',
        notifications: true,
        autoRefresh: true,
        defaultSport: 'NBA',
      },
      ...overrides,
    };
  }

  // Batch creation methods
  static createMockPlayers(count: number): MockPlayer[] {
    return Array.from({ length: count }, () => this.createMockPlayer());
  }

  static createMockGames(count: number): MockGame[] {
    return Array.from({ length: count }, () => this.createMockGame());
  }

  static createMockOddsArray(count: number): MockOdds[] {
    return Array.from({ length: count }, () => this.createMockOdds());
  }

  static createMockPredictions(count: number): MockPrediction[] {
    return Array.from({ length: count }, () => this.createMockPrediction());
  }
}

// Test Wrapper Components
interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export const TestWrapper = ({ children, queryClient }: TestWrapperProps) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient || defaultQueryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom Render Function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, initialEntries, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper queryClient={queryClient}>
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test Helpers
export class TestHelpers {
  // Wait for element to appear
  static async waitForElement(
    getElement: () => HTMLElement | null,
    timeout = 5000
  ): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        const element = getElement();
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(check, 100);
        } else {
          reject(new Error(`Element not found within ${timeout}ms`));
        }
      };
      
      check();
    });
  }

  // Simulate async delay
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Create mock API response
  static createMockApiResponse<T>(data: T, status = 200): Promise<{ data: T; status: number }> {
    return Promise.resolve({ data, status });
  }

  // Create mock error response
  static createMockApiError(message: string, status = 500): Promise<never> {
    return Promise.reject({
      response: {
        status,
        data: { error: message },
      },
      message,
    });
  }

  // Local storage helpers
  static mockLocalStorage() {
    const store: Record<string, string> = {};
    
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
  }

  // WebSocket mock
  static createMockWebSocket() {
    const eventHandlers: Record<string, Function[]> = {};
    
    return {
      send: jest.fn(),
      close: jest.fn(),
      readyState: 1,
      addEventListener: jest.fn((event: string, handler: Function) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
      }),
      removeEventListener: jest.fn((event: string, handler: Function) => {
        if (eventHandlers[event]) {
          eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
        }
      }),
      dispatchEvent: jest.fn((event: { type: string; data?: any }) => {
        if (eventHandlers[event.type]) {
          eventHandlers[event.type].forEach(handler => handler(event));
        }
      }),
      // Helper to trigger events
      triggerEvent: (type: string, data?: any) => {
        if (eventHandlers[type]) {
          eventHandlers[type].forEach(handler => handler({ type, data }));
        }
      },
    };
  }

  // Form input helpers
  static createMockChangeEvent(value: string) {
    return {
      target: { value },
      currentTarget: { value },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
  }

  static createMockClickEvent() {
    return {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      target: {},
      currentTarget: {},
    };
  }
}

// Performance Testing Helpers
export class PerformanceTestHelpers {
  static measureRenderTime(renderFn: () => void): number {
    const start = performance.now();
    renderFn();
    return performance.now() - start;
  }

  static async measureAsyncOperation<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  static createPerformanceBenchmark(name: string, threshold: number) {
    return {
      measure: (operation: () => void) => {
        const duration = this.measureRenderTime(operation);
        expect(duration).toBeLessThan(threshold);
        return duration;
      },
      measureAsync: async (operation: () => Promise<any>) => {
        const { duration } = await this.measureAsyncOperation(operation);
        expect(duration).toBeLessThan(threshold);
        return duration;
      },
    };
  }
}

// Export everything as named exports
export {
  customRender as render,
  TestWrapper,
  TestDataFactory,
  TestHelpers,
  PerformanceTestHelpers,
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';