# Betting Component Standards & Architecture Guide

## Table of Contents
1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [TypeScript Standards](#typescript-standards)
4. [Performance Guidelines](#performance-guidelines)
5. [Styling Conventions](#styling-conventions)
6. [State Management Patterns](#state-management-patterns)
7. [Testing Standards](#testing-standards)
8. [Code Quality & ESLint Rules](#code-quality--eslint-rules)
9. [Component Boundaries](#component-boundaries)
10. [Import System](#import-system)
11. [Error Handling](#error-handling)
12. [Accessibility Guidelines](#accessibility-guidelines)

## Overview

This document establishes comprehensive coding standards and architectural patterns for A1Betting components, ensuring maintainability, performance, and scalability across the application.

### Design Principles
- **PropFinder Competition**: All components must meet or exceed PropFinder's functionality
- **Performance First**: Sub-16ms render times, memory-efficient implementations
- **Quantum AI Integration**: Support for advanced AI features and real-time analytics
- **Scalability**: Handle 10,000+ data points with virtual scrolling
- **Type Safety**: Comprehensive TypeScript coverage with strict mode

## Component Architecture

### Standard Component Structure

#### 1. File Organization
```
src/components/
├── analysis/           # Statistical analysis components
├── betting/           # Core betting functionality
├── modern/            # PropFinder-killer dashboards
├── monitoring/        # System monitoring components
├── prediction/        # AI prediction components
└── shared/           # Reusable UI components
```

#### 2. Component Template
```typescript
/**
 * ComponentName - Brief description
 * 
 * @purpose Detailed explanation of component purpose
 * @features List of key features
 * @performance Expected performance characteristics
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon1, Icon2, Icon3 } from 'lucide-react';

// Performance optimization imports
import { usePerformanceOptimization } from '@/services/performance/PerformanceOptimizationService';

// Type definitions
interface ComponentProps {
  /** Primary data prop with detailed description */
  data: DataType[];
  /** Configuration object for component behavior */
  config?: ComponentConfig;
  /** Callback for user interactions */
  onAction?: (action: ActionType) => void;
  /** Optional styling overrides */
  className?: string;
  /** Performance optimization settings */
  performanceMode?: 'standard' | 'optimized' | 'maximum';
}

interface ComponentConfig {
  enableQuantumAI: boolean;
  virtualScrolling: boolean;
  realTimeUpdates: boolean;
  cacheEnabled: boolean;
}

interface ComponentState {
  loading: boolean;
  error: string | null;
  data: ProcessedData[];
}

/**
 * ComponentName - Quantum AI enhanced betting component
 * 
 * Provides PropFinder-style functionality with advanced features:
 * - Virtual scrolling for 10,000+ items
 * - Quantum AI integration with ensemble models
 * - Real-time performance monitoring
 * - Advanced caching and memory management
 * 
 * @param props - Component properties
 * @returns JSX.Element
 */
const ComponentName: React.FC<ComponentProps> = ({
  data,
  config = defaultConfig,
  onAction,
  className = '',
  performanceMode = 'standard'
}) => {
  // Performance optimization hooks
  const { measureRender, optimizeRender, startTransition } = usePerformanceOptimization();

  // State management (grouped logically)
  const [state, setState] = useState<ComponentState>({
    loading: false,
    error: null,
    data: []
  });

  // Memoized calculations (expensive operations)
  const processedData = useMemo(() => {
    return measureRender('ComponentName-processing', () => {
      return processDataWithQuantumAI(data, config);
    });
  }, [data, config]);

  // Optimized event handlers
  const handleUserAction = useCallback((action: ActionType) => {
    startTransition(() => {
      onAction?.(action);
    });
  }, [onAction]);

  // Effects (lifecycle and side effects)
  useEffect(() => {
    if (config.realTimeUpdates) {
      const cleanup = setupRealTimeUpdates(handleDataUpdate);
      return cleanup;
    }
  }, [config.realTimeUpdates]);

  // Conditional rendering for performance modes
  if (performanceMode === 'maximum' && data.length > 1000) {
    return <VirtualizedComponentName {...props} />;
  }

  // Main render
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`component-name ${className}`}
      data-testid="component-name"
    >
      {/* Component content */}
      <ComponentHeader />
      <ComponentBody data={processedData} onAction={handleUserAction} />
      <ComponentFooter />
    </motion.div>
  );
};

// Default configuration
const defaultConfig: ComponentConfig = {
  enableQuantumAI: true,
  virtualScrolling: true,
  realTimeUpdates: false,
  cacheEnabled: true
};

// Performance-optimized export
export default React.memo(ComponentName);

// Named exports for testing and composition
export { ComponentName, type ComponentProps, type ComponentConfig };
```

#### 3. Component Composition Patterns

**Container-Presentation Pattern**:
```typescript
// Container Component (logic and state)
const BettingDashboardContainer: React.FC = () => {
  const { data, loading, error } = useBettingData();
  const { filters, updateFilters } = useFilters();
  
  return (
    <BettingDashboardPresentation
      data={data}
      loading={loading}
      error={error}
      filters={filters}
      onFilterChange={updateFilters}
    />
  );
};

// Presentation Component (pure UI)
const BettingDashboardPresentation: React.FC<PresentationProps> = ({
  data,
  loading,
  error,
  filters,
  onFilterChange
}) => {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div className="betting-dashboard">
      <FilterPanel filters={filters} onChange={onFilterChange} />
      <DataGrid data={data} />
    </div>
  );
};
```

## TypeScript Standards

### 1. Interface Definitions

#### Betting Domain Types
```typescript
// Core betting interfaces
interface Player {
  readonly id: string;
  readonly name: string;
  readonly team: TeamCode;
  readonly position: Position;
  readonly stats: PlayerStats;
  readonly injuryStatus: InjuryStatus;
  readonly lastUpdated: Date;
}

interface Prop {
  readonly id: string;
  readonly player: Player;
  readonly market: Market;
  readonly line: number;
  readonly odds: Odds;
  readonly confidence: ConfidenceScore;
  readonly expectedValue: number;
  readonly kellySize: number;
  readonly quantumAnalysis?: QuantumAnalysis;
}

interface QuantumAnalysis {
  readonly superposition: number;
  readonly entanglement: number;
  readonly interference: number;
  readonly coherence: number;
  readonly modelEnsemble: ModelEnsemble;
  readonly riskFactors: readonly string[];
}

// Utility types for common patterns
type LoadingState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

type AsyncData<T> = Promise<LoadingState<T>>;

type EventHandler<T = void> = (event: T) => void;

type ComponentVariant = 'default' | 'compact' | 'expanded' | 'minimal';

type PerformanceMode = 'standard' | 'optimized' | 'maximum';
```

#### Generic Utility Types
```typescript
// Performance-optimized component props
interface OptimizedComponentProps<T> {
  data: readonly T[];
  virtualScrolling?: boolean;
  memoization?: boolean;
  batchSize?: number;
  cacheKey?: string;
}

// Quantum AI enhanced props
interface QuantumEnhancedProps {
  enableQuantumAI?: boolean;
  quantumThreshold?: number;
  modelEnsemble?: boolean;
  realTimeUpdates?: boolean;
}

// Monitoring and analytics props
interface MonitoredComponentProps {
  enableMonitoring?: boolean;
  performanceTracking?: boolean;
  errorReporting?: boolean;
  analyticsEvents?: string[];
}
```

### 2. Type Guards and Validation

```typescript
// Type guards for runtime validation
const isValidProp = (value: unknown): value is Prop => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'player' in value &&
    'line' in value &&
    typeof (value as any).line === 'number'
  );
};

const hasQuantumAnalysis = (prop: Prop): prop is Prop & { quantumAnalysis: QuantumAnalysis } => {
  return prop.quantumAnalysis !== undefined;
};

// Validation functions
const validatePlayerData = (player: Player): ValidationResult => {
  const errors: string[] = [];
  
  if (!player.id) errors.push('Player ID is required');
  if (!player.name) errors.push('Player name is required');
  if (!isValidTeamCode(player.team)) errors.push('Invalid team code');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 3. Generic Components

```typescript
// Generic data grid component
interface DataGridProps<T> {
  data: readonly T[];
  columns: ColumnDefinition<T>[];
  onRowClick?: (item: T) => void;
  virtualScrolling?: boolean;
  performanceMode?: PerformanceMode;
}

const DataGrid = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  virtualScrolling = false,
  performanceMode = 'standard'
}: DataGridProps<T>): JSX.Element => {
  // Implementation with full type safety
};

// Usage
<DataGrid<Prop>
  data={props}
  columns={propColumns}
  onRowClick={handlePropClick}
  virtualScrolling={true}
  performanceMode="optimized"
/>
```

## Performance Guidelines

### 1. React 19 Concurrent Features

```typescript
import { useTransition, useDeferredValue, startTransition } from 'react';

const OptimizedBettingComponent: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Defer non-urgent updates
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  // Mark non-urgent state updates
  const handleFilterChange = (newFilters: Filters) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  };
  
  // Show loading state for pending transitions
  return (
    <div>
      {isPending && <div>Updating...</div>}
      <SearchInput 
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <FilteredResults searchTerm={deferredSearchTerm} />
    </div>
  );
};
```

### 2. Memoization Strategies

```typescript
// Component memoization
const PropCard = React.memo<PropCardProps>(({ prop, onSelect }) => {
  return (
    <div className="prop-card" onClick={() => onSelect(prop)}>
      {/* Prop content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.prop.id === nextProps.prop.id &&
    prevProps.prop.confidence === nextProps.prop.confidence
  );
});

// Expensive calculations
const ExpensiveAnalysisComponent: React.FC<AnalysisProps> = ({ data }) => {
  const analysisResults = useMemo(() => {
    return performQuantumAnalysis(data);
  }, [data]); // Only recalculate when data changes
  
  const formattedResults = useMemo(() => {
    return formatAnalysisResults(analysisResults);
  }, [analysisResults]);
  
  return <AnalysisDisplay results={formattedResults} />;
};

// Event handlers
const BettingDashboard: React.FC = () => {
  const handlePropSelection = useCallback((prop: Prop) => {
    // Handle selection logic
    trackAnalyticsEvent('prop_selected', { propId: prop.id });
    onPropSelect(prop);
  }, [onPropSelect]); // Stable reference
  
  return (
    <PropList 
      props={props}
      onSelect={handlePropSelection}
    />
  );
};
```

### 3. Virtual Scrolling Implementation

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedPropList: React.FC<VirtualizedProps> = ({ props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: props.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 200, // Estimated item height
    overscan: 10, // Render extra items for smooth scrolling
  });
  
  return (
    <div 
      ref={containerRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }} // Performance optimization
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PropCard prop={props[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Performance Monitoring

```typescript
import { usePerformanceOptimization } from '@/services/performance/PerformanceOptimizationService';

const MonitoredComponent: React.FC = () => {
  const { measureRender, metrics } = usePerformanceOptimization();
  
  // Measure render performance
  const expensiveRender = measureRender('ComponentName', () => {
    return <ExpensiveComponent data={largeDataset} />;
  });
  
  // Monitor component lifecycle
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const componentLifetime = endTime - startTime;
      
      if (componentLifetime > 5000) { // 5 seconds
        console.warn(`Component lived for ${componentLifetime}ms`);
      }
    };
  }, []);
  
  return expensiveRender;
};
```

## Styling Conventions

### 1. TailwindCSS Patterns

#### Color System
```typescript
// Primary color palette
const colors = {
  primary: {
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    gradient: 'bg-gradient-to-r from-purple-400 to-blue-400'
  },
  status: {
    success: 'bg-green-500 text-green-100',
    warning: 'bg-yellow-500 text-yellow-100',
    error: 'bg-red-500 text-red-100',
    info: 'bg-blue-500 text-blue-100'
  },
  quantum: {
    superposition: 'bg-purple-500',
    entanglement: 'bg-blue-500',
    interference: 'bg-green-500',
    coherence: 'bg-yellow-500'
  }
};

// Component styling patterns
const cardStyles = {
  base: 'bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm',
  hover: 'hover:border-purple-500 transition-all duration-300',
  interactive: 'cursor-pointer transform hover:scale-[1.02]'
};
```

#### Responsive Design
```typescript
const BettingCard: React.FC = ({ prop }) => (
  <div className={`
    ${cardStyles.base}
    ${cardStyles.hover}
    ${cardStyles.interactive}
    p-4 md:p-6
    grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
    gap-4 md:gap-6
    text-sm md:text-base
  `}>
    {/* Card content with responsive layout */}
  </div>
);
```

#### Animation Patterns
```typescript
// Framer Motion variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
```

### 2. Component Styling Architecture

```typescript
// Styled component wrapper for complex styles
const StyledPropCard = styled(motion.div)<{ variant: CardVariant }>`
  ${({ variant }) => cardVariantStyles[variant]}
  
  /* Quantum AI indicator animations */
  .quantum-indicator {
    animation: pulse 2s ease-in-out infinite;
  }
  
  /* Performance optimizations */
  contain: layout style paint;
  will-change: transform, opacity;
`;

// CSS-in-JS for dynamic styles
const getDynamicStyles = (confidence: number, quantum: boolean) => ({
  background: quantum 
    ? `linear-gradient(135deg, 
        hsl(${confidence * 1.2}, 70%, 50%) 0%, 
        hsl(${confidence * 1.2 + 60}, 70%, 50%) 100%)`
    : `hsl(${confidence * 1.2}, 70%, 50%)`,
  transform: `scale(${1 + confidence * 0.05})`,
  opacity: Math.max(0.7, confidence / 100)
});
```

## State Management Patterns

### 1. Context API for Component Trees

```typescript
// Betting context for prop management
interface BettingContextValue {
  props: Prop[];
  selectedProps: Prop[];
  filters: FilterState;
  quantumMode: boolean;
  actions: {
    selectProp: (prop: Prop) => void;
    updateFilters: (filters: Partial<FilterState>) => void;
    toggleQuantumMode: () => void;
    clearSelection: () => void;
  };
}

const BettingContext = createContext<BettingContextValue | null>(null);

export const BettingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BettingState>(initialState);
  
  const value = useMemo(() => ({
    ...state,
    actions: {
      selectProp: (prop: Prop) => {
        setState(prev => ({
          ...prev,
          selectedProps: [...prev.selectedProps, prop]
        }));
      },
      updateFilters: (newFilters: Partial<FilterState>) => {
        setState(prev => ({
          ...prev,
          filters: { ...prev.filters, ...newFilters }
        }));
      },
      toggleQuantumMode: () => {
        setState(prev => ({
          ...prev,
          quantumMode: !prev.quantumMode
        }));
      },
      clearSelection: () => {
        setState(prev => ({
          ...prev,
          selectedProps: []
        }));
      }
    }
  }), [state]);
  
  return (
    <BettingContext.Provider value={value}>
      {children}
    </BettingContext.Provider>
  );
};

export const useBetting = () => {
  const context = useContext(BettingContext);
  if (!context) {
    throw new Error('useBetting must be used within BettingProvider');
  }
  return context;
};
```

### 2. Zustand for Global State

```typescript
// Performance-optimized Zustand store
interface AppStore {
  // State
  user: User | null;
  preferences: UserPreferences;
  cache: Map<string, CachedData>;
  performance: PerformanceMetrics;
  
  // Actions
  setUser: (user: User) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setCacheValue: (key: string, value: CachedData) => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  
  // Computed values
  isAuthenticated: boolean;
  cacheHitRate: number;
}

const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  preferences: defaultPreferences,
  cache: new Map(),
  performance: defaultMetrics,
  
  // Actions
  setUser: (user) => set({ user }),
  
  updatePreferences: (prefs) => set((state) => ({
    preferences: { ...state.preferences, ...prefs }
  })),
  
  setCacheValue: (key, value) => set((state) => {
    const newCache = new Map(state.cache);
    newCache.set(key, value);
    return { cache: newCache };
  }),
  
  updatePerformance: (metrics) => set((state) => ({
    performance: { ...state.performance, ...metrics }
  })),
  
  // Computed values
  get isAuthenticated() {
    return get().user !== null;
  },
  
  get cacheHitRate() {
    const cache = get().cache;
    const totalRequests = Array.from(cache.values())
      .reduce((sum, data) => sum + data.requests, 0);
    const cacheHits = Array.from(cache.values())
      .reduce((sum, data) => sum + data.hits, 0);
    return totalRequests > 0 ? cacheHits / totalRequests : 0;
  }
}));

// Selectors for performance optimization
export const useUser = () => useAppStore(state => state.user);
export const usePreferences = () => useAppStore(state => state.preferences);
export const usePerformanceMetrics = () => useAppStore(state => state.performance);
```

### 3. React Query for Server State

```typescript
// Betting data queries with caching
const useBettingProps = (filters: FilterState) => {
  return useQuery({
    queryKey: ['betting-props', filters],
    queryFn: async () => {
      const response = await fetchBettingProps(filters);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60000, // 1 minute
    select: (data) => {
      // Transform and filter data
      return data
        .filter(prop => prop.confidence >= filters.minConfidence)
        .sort((a, b) => b.confidence - a.confidence);
    }
  });
};

// Mutations with optimistic updates
const useSelectProp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (prop: Prop) => {
      return await selectProp(prop.id);
    },
    onMutate: async (prop) => {
      // Optimistically update UI
      await queryClient.cancelQueries({ queryKey: ['selected-props'] });
      
      const previousProps = queryClient.getQueryData(['selected-props']);
      
      queryClient.setQueryData(['selected-props'], (old: Prop[] = []) => [
        ...old,
        prop
      ]);
      
      return { previousProps };
    },
    onError: (err, prop, context) => {
      // Rollback on error
      queryClient.setQueryData(['selected-props'], context?.previousProps);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['selected-props'] });
    }
  });
};
```

## Testing Standards

### 1. Component Testing

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BettingProvider } from '@/contexts/BettingContext';
import BettingDashboard from './BettingDashboard';

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BettingProvider>
        {ui}
      </BettingProvider>
    </QueryClientProvider>
  );
};

// Mock data generators
const createMockProp = (overrides: Partial<Prop> = {}): Prop => ({
  id: 'prop-1',
  player: createMockPlayer(),
  market: 'hits',
  line: 1.5,
  odds: { over: -110, under: -110 },
  confidence: 75,
  expectedValue: 5.2,
  kellySize: 0.025,
  ...overrides
});

describe('BettingDashboard', () => {
  beforeEach(() => {
    // Reset any global state
    jest.clearAllMocks();
  });

  it('should render props list correctly', () => {
    const mockProps = [createMockProp(), createMockProp({ id: 'prop-2' })];
    
    renderWithProviders(
      <BettingDashboard initialProps={mockProps} />
    );
    
    expect(screen.getByTestId('props-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('prop-card')).toHaveLength(2);
  });

  it('should handle prop selection', async () => {
    const onPropSelect = jest.fn();
    const mockProp = createMockProp();
    
    renderWithProviders(
      <BettingDashboard 
        initialProps={[mockProp]} 
        onPropSelect={onPropSelect}
      />
    );
    
    fireEvent.click(screen.getByTestId('prop-card'));
    
    await waitFor(() => {
      expect(onPropSelect).toHaveBeenCalledWith(mockProp);
    });
  });

  it('should filter props correctly', async () => {
    const mockProps = [
      createMockProp({ confidence: 80 }),
      createMockProp({ id: 'prop-2', confidence: 60 })
    ];
    
    renderWithProviders(
      <BettingDashboard initialProps={mockProps} />
    );
    
    // Set confidence filter to 70
    fireEvent.change(screen.getByLabelText('Min Confidence'), {
      target: { value: '70' }
    });
    
    await waitFor(() => {
      expect(screen.getAllByTestId('prop-card')).toHaveLength(1);
    });
  });
});
```

### 2. Performance Testing

```typescript
import { measureRender } from '@/services/performance/PerformanceOptimizationService';

describe('Performance Tests', () => {
  it('should render large datasets within performance budget', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => 
      createMockProp({ id: `prop-${i}` })
    );
    
    const renderTime = measureRender('BettingDashboard-large', () => {
      render(<BettingDashboard initialProps={largeDataset} />);
    });
    
    expect(renderTime).toBeLessThan(16); // 60fps target
  });

  it('should maintain memory usage within limits', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const { unmount } = render(
      <BettingDashboard initialProps={createLargeDataset()} />
    );
    
    unmount();
    
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB limit
  });
});
```

### 3. Integration Testing

```typescript
describe('Betting Flow Integration', () => {
  it('should complete full betting workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<App />);
    
    // Navigate to betting dashboard
    await user.click(screen.getByRole('link', { name: /betting/i }));
    
    // Filter props
    await user.type(screen.getByPlaceholderText('Search props...'), 'Mookie Betts');
    
    // Select a prop
    await user.click(screen.getByTestId('prop-card'));
    
    // Verify selection
    expect(screen.getByTestId('selected-props-count')).toHaveTextContent('1');
    
    // Place bet
    await user.click(screen.getByRole('button', { name: /place bet/i }));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/bet placed successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Code Quality & ESLint Rules

### 1. ESLint Configuration

```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": [
    "betting-specific",
    "performance-rules"
  ],
  "rules": {
    // TypeScript rules
    "@typescript-eslint/no-any": "error",
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    
    // React rules
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-props-no-spreading": "warn",
    "react-hooks/exhaustive-deps": "error",
    
    // Performance rules
    "performance-rules/no-large-inline-objects": "error",
    "performance-rules/prefer-memo": "warn",
    "performance-rules/no-anonymous-functions-in-jsx": "error",
    
    // Betting-specific rules
    "betting-specific/prop-validation": "error",
    "betting-specific/quantum-ai-integration": "warn",
    "betting-specific/performance-monitoring": "warn",
    "betting-specific/cache-usage": "error"
  }
}
```

### 2. Custom ESLint Rules

```typescript
// Custom rule: betting-specific/prop-validation
const rule: TSESLint.RuleModule<string, []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure all betting props are properly validated',
      recommended: false,
    },
    schema: [],
    messages: {
      missingValidation: 'Betting prop {{propName}} requires validation',
      invalidPropStructure: 'Prop structure does not match Prop interface',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        // Check for prop variables without validation
        if (isPropVariable(node) && !hasValidation(node)) {
          context.report({
            node,
            messageId: 'missingValidation',
            data: { propName: getPropName(node) },
          });
        }
      },
    };
  },
};

// Custom rule: performance-rules/no-large-inline-objects
const performanceRule: TSESLint.RuleModule<string, []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent large inline objects that cause re-renders',
      recommended: true,
    },
    schema: [],
    messages: {
      largeInlineObject: 'Large inline object detected. Consider memoization.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ObjectExpression(node) {
        if (node.properties.length > 5 && isInJSXContext(node)) {
          context.report({
            node,
            messageId: 'largeInlineObject',
          });
        }
      },
    };
  },
};
```

## Component Boundaries

### 1. Domain Separation

```typescript
// Betting domain components
export namespace Betting {
  export interface PropCardProps {
    prop: Prop;
    onSelect: (prop: Prop) => void;
    variant?: 'default' | 'compact' | 'detailed';
  }
  
  export const PropCard: React.FC<PropCardProps> = ({ prop, onSelect, variant = 'default' }) => {
    // Implementation
  };
  
  export const PropList: React.FC<PropListProps> = (props) => {
    // Implementation
  };
  
  export const BettingFilters: React.FC<FiltersProps> = (props) => {
    // Implementation
  };
}

// Analytics domain components
export namespace Analytics {
  export const PerformanceChart: React.FC<ChartProps> = (props) => {
    // Implementation
  };
  
  export const QuantumAnalysisPanel: React.FC<AnalysisProps> = (props) => {
    // Implementation
  };
}

// Monitoring domain components
export namespace Monitoring {
  export const SystemHealthDashboard: React.FC<HealthProps> = (props) => {
    // Implementation
  };
  
  export const AlertsPanel: React.FC<AlertsProps> = (props) => {
    // Implementation
  };
}
```

### 2. Interface Contracts

```typescript
// Shared interfaces between domains
export interface CrossDomainInterfaces {
  // Data contracts
  Prop: Prop;
  Player: Player;
  PerformanceMetrics: PerformanceMetrics;
  
  // Event contracts
  PropSelectionEvent: {
    type: 'prop-selected';
    payload: { prop: Prop; timestamp: Date };
  };
  
  FilterChangeEvent: {
    type: 'filter-changed';
    payload: { filters: FilterState; timestamp: Date };
  };
  
  // Service contracts
  BettingService: {
    selectProp: (propId: string) => Promise<void>;
    getProps: (filters: FilterState) => Promise<Prop[]>;
    calculateKellySize: (prop: Prop) => number;
  };
}

// Dependency injection for cross-domain communication
export interface ServiceContainer {
  bettingService: CrossDomainInterfaces['BettingService'];
  analyticsService: AnalyticsService;
  monitoringService: MonitoringService;
  performanceService: PerformanceOptimizationService;
}

export const useServices = (): ServiceContainer => {
  return {
    bettingService: BettingService.getInstance(),
    analyticsService: AnalyticsService.getInstance(),
    monitoringService: MonitoringService.getInstance(),
    performanceService: PerformanceOptimizationService.getInstance(),
  };
};
```

## Import System

### 1. Absolute Path Aliases

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/stores': path.resolve(__dirname, './src/stores'),
    }
  }
});

// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/services/*": ["src/services/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/contexts/*": ["src/contexts/*"],
      "@/stores/*": ["src/stores/*"]
    }
  }
}
```

### 2. Import Organization

```typescript
// Standard import order
// 1. React and React-related imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, TrendingUp } from 'lucide-react';

// 3. Internal imports (absolute paths)
import { usePerformanceOptimization } from '@/services/performance/PerformanceOptimizationService';
import { useBetting } from '@/contexts/BettingContext';
import { Prop, FilterState } from '@/types/betting';

// 4. Relative imports (same directory)
import './ComponentName.css';
import { ComponentHelper } from './ComponentHelper';

// 5. Type-only imports (separate)
import type { ComponentProps, ComponentConfig } from './types';
```

### 3. Barrel Exports

```typescript
// src/components/index.ts
export { default as EnhancedPropFinderKillerDashboard } from './modern/EnhancedPropFinderKillerDashboard';
export { default as OptimizedPropFinderKillerDashboard } from './modern/OptimizedPropFinderKillerDashboard';
export { default as AdvancedMatchupAnalysisTools } from './analysis/AdvancedMatchupAnalysisTools';
export { default as ComprehensiveMonitoringDashboard } from './monitoring/ComprehensiveMonitoringDashboard';

// Re-export types
export type { PropCardProps } from './betting/PropCard';
export type { DashboardConfig } from './modern/types';

// src/hooks/index.ts
export { usePerformanceOptimization } from './usePerformanceOptimization';
export { useCache } from './useCache';
export { useVirtualization } from './useVirtualization';
export { useBettingData } from './useBettingData';

// src/services/index.ts
export { default as PerformanceOptimizationService } from './performance/PerformanceOptimizationService';
export { BettingService } from './betting/BettingService';
export { AnalyticsService } from './analytics/AnalyticsService';
```

## Error Handling

### 1. Error Boundaries

```typescript
// Generic error boundary for betting components
interface BettingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class BettingErrorBoundary extends Component<
  PropsWithChildren<{ fallback?: ComponentType<ErrorFallbackProps> }>,
  BettingErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{ fallback?: ComponentType<ErrorFallbackProps> }>) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<BettingErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Report to monitoring service
    const monitoringService = MonitoringService.getInstance();
    monitoringService.reportError({
      error,
      errorInfo,
      component: 'BettingErrorBoundary',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => (
  <div className="error-fallback bg-red-900/20 border border-red-500/30 rounded-lg p-6">
    <h2 className="text-xl font-semibold text-red-400 mb-4">
      Something went wrong
    </h2>
    <details className="mb-4">
      <summary className="cursor-pointer text-red-300">
        Error details
      </summary>
      <pre className="mt-2 text-sm text-gray-300 overflow-auto">
        {error?.message}
      </pre>
    </details>
    <button
      onClick={onRetry}
      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      Try again
    </button>
  </div>
);
```

### 2. Async Error Handling

```typescript
// Hook for handling async operations with error states
const useAsyncOperation = <T, E = Error>() => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: E | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorObject = error as E;
      setState({ data: null, loading: false, error: errorObject });
      
      // Report error to monitoring
      const monitoringService = MonitoringService.getInstance();
      monitoringService.reportAsyncError({
        error: errorObject,
        operation: asyncFunction.name || 'unknown',
        timestamp: new Date()
      });
      
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
};

// Usage in components
const BettingComponent: React.FC = () => {
  const { data: props, loading, error, execute } = useAsyncOperation<Prop[]>();
  
  const loadProps = useCallback(async () => {
    return execute(() => fetchBettingProps());
  }, [execute]);
  
  useEffect(() => {
    loadProps().catch(error => {
      console.error('Failed to load props:', error);
    });
  }, [loadProps]);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={loadProps} />;
  
  return <PropsList props={props || []} />;
};
```

### 3. Form Validation

```typescript
// Form validation with error handling
interface FormErrors {
  [key: string]: string | undefined;
}

const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const validate = useCallback((fieldName?: keyof T) => {
    const newErrors: FormErrors = {};
    
    const fieldsToValidate = fieldName ? [fieldName] : Object.keys(values) as (keyof T)[];
    
    fieldsToValidate.forEach(field => {
      const rule = validationRules[field];
      if (rule) {
        const error = rule(values[field], values);
        if (error) {
          newErrors[field as string] = error;
        }
      }
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field);
  }, [validate]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    isValid: Object.keys(errors).length === 0
  };
};
```

## Accessibility Guidelines

### 1. ARIA Labels and Roles

```typescript
const AccessiblePropCard: React.FC<PropCardProps> = ({ prop, onSelect }) => (
  <div
    role="button"
    tabIndex={0}
    aria-label={`Select ${prop.player.name} ${prop.market} prop, line ${prop.line}, confidence ${prop.confidence}%`}
    aria-describedby={`prop-details-${prop.id}`}
    onClick={() => onSelect(prop)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(prop);
      }
    }}
    className="prop-card focus:ring-2 focus:ring-purple-500 focus:outline-none"
  >
    <div id={`prop-details-${prop.id}`} className="sr-only">
      {prop.player.name} playing for {prop.player.team} 
      against {prop.matchup.opponent}. 
      Confidence level: {prop.confidence}%.
      Expected value: {prop.expectedValue}%.
    </div>
    
    {/* Visible content */}
    <div className="prop-content">
      <h3 className="prop-title">{prop.player.name}</h3>
      <div className="prop-details" aria-hidden="true">
        {/* Visual details */}
      </div>
    </div>
  </div>
);
```

### 2. Keyboard Navigation

```typescript
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && items[focusedIndex]) {
          onSelect(items[focusedIndex]);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return { focusedIndex, setFocusedIndex };
};
```

### 3. Screen Reader Support

```typescript
const ScreenReaderAnnouncements: React.FC = ({ announcements }) => {
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');
  
  useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[announcements.length - 1];
      setCurrentAnnouncement(latest);
      
      // Clear after announcement
      const timeout = setTimeout(() => {
        setCurrentAnnouncement('');
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [announcements]);
  
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {currentAnnouncement}
    </div>
  );
};

// Usage in components
const BettingDashboard: React.FC = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  
  const handlePropSelect = (prop: Prop) => {
    // Select prop logic
    selectProp(prop);
    
    // Announce to screen readers
    setAnnouncements(prev => [
      ...prev,
      `Selected ${prop.player.name} ${prop.market} prop with ${prop.confidence}% confidence`
    ]);
  };
  
  return (
    <div>
      <ScreenReaderAnnouncements announcements={announcements} />
      {/* Dashboard content */}
    </div>
  );
};
```

---

**Version**: 8.0.0  
**Last Updated**: January 2025  
**Maintainer**: A1Betting Development Team  
**License**: MIT

This document serves as the authoritative guide for A1Betting component development, ensuring consistency, performance, and maintainability across the entire application.
