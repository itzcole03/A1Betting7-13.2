# A1Betting Component Coding Standards

## Overview
This document establishes consistent coding standards for all betting-related components in the A1Betting application to ensure maintainability, readability, and developer efficiency.

## 🏗️ File Structure Standards

### Directory Organization
```
src/components/betting/
├── core/              # Basic betting components (BetSlip, BetForm)
├── advanced/          # ML/AI enhanced components (PropFinder, MoneyMaker)
├── forms/            # Input forms and controls
├── display/          # Read-only display components
├── analysis/         # Analysis and prediction components
��── shared/           # Shared betting utilities
```

### File Naming Conventions
- **Components**: PascalCase with descriptive suffixes
  - ✅ `BettingForm.tsx`, `PropFinderDashboard.tsx`
  - ❌ `betForm.tsx`, `propfinder.tsx`
- **Hooks**: camelCase with `use` prefix
  - ✅ `useBettingState.ts`, `useMoneyMaker.ts`
- **Types**: PascalCase in dedicated files
  - ✅ `BettingTypes.ts`, `PropOpportunity.ts`

## 🔤 Naming Conventions

### Component Names
```typescript
// ✅ Good - Descriptive and domain-specific
export const BettingOpportunityCard: React.FC<BettingOpportunityCardProps> = ({ ... });
export const MoneyMakerDashboard: React.FC<MoneyMakerDashboardProps> = ({ ... });

// ❌ Bad - Too generic or unclear
export const Card: React.FC<CardProps> = ({ ... });
export const Component: React.FC<Props> = ({ ... });
```

### Interface Naming
```typescript
// ✅ Standard pattern - {ComponentName}Props
interface BettingOpportunityCardProps {
  opportunity: BettingOpportunity;
  onSelect: (id: string) => void;
  isSelected?: boolean;
}

// ✅ Domain-specific data interfaces
interface BettingOpportunity {
  id: string;
  confidence: number;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
}
```

### Event Handler Naming
```typescript
// ✅ Standard pattern - handle{Action}
const handlePlaceBet = useCallback((betData: BetSubmission) => {
  // Implementation
}, []);

const handleRemoveOpportunity = useCallback((opportunityId: string) => {
  // Implementation
}, []);

// ❌ Avoid underscore prefixes or unclear names
const _onBet = () => { ... };
const clickHandler = () => { ... };
```

## 🏛️ Component Architecture Standards

### Component Structure Template
```typescript
import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from './types';

interface ComponentNameProps {
  // Required props first
  data: RequiredDataType;
  onAction: (param: string) => void;
  
  // Optional props with defaults
  className?: string;
  variant?: 'default' | 'compact' | 'expanded';
  isDisabled?: boolean;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  data,
  onAction,
  className,
  variant = 'default',
  isDisabled = false
}) => {
  // 1. State declarations
  const [localState, setLocalState] = useState<StateType>(initialValue);
  
  // 2. Memoized calculations
  const calculatedValue = useMemo(() => {
    return complexCalculation(data);
  }, [data]);
  
  // 3. Event handlers
  const handleAction = useCallback((param: string) => {
    if (isDisabled) return;
    onAction(param);
  }, [onAction, isDisabled]);
  
  // 4. Early returns for loading/error states
  if (!data) {
    return <div className="text-gray-400">No data available</div>;
  }
  
  // 5. Render
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('default-classes', className)}
    >
      {/* Component content */}
    </motion.div>
  );
};

export default ComponentName;
```

## 📦 Export Standards

### Component Exports
```typescript
// ✅ Preferred - Default export for components
export default BettingOpportunityCard;

// ✅ Also export as named for flexibility
export { BettingOpportunityCard };

// ✅ Index file pattern
// components/betting/core/index.ts
export { default as BetSlip } from './BetSlip';
export { default as BetForm } from './BetForm';
export type { BetSlipProps, BetFormProps } from './types';
```

## 🎯 TypeScript Standards

### Strict Typing Requirements
```typescript
// ✅ All props must be typed
interface BettingDashboardProps {
  opportunities: BettingOpportunity[];
  onOpportunitySelect: (opportunity: BettingOpportunity) => void;
  filters: BettingFilters;
  isLoading?: boolean;
}

// ✅ Generic types for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowSelect?: (item: T) => void;
}

// ✅ Union types for controlled variants
type DashboardVariant = 'compact' | 'standard' | 'expanded';
type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
```

### Error Handling Patterns
```typescript
// ✅ Consistent error boundary usage
const BettingComponent: React.FC<Props> = ({ ... }) => {
  try {
    // Component logic
    return <div>...</div>;
  } catch (error) {
    console.error('BettingComponent error:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Failed to load betting data</p>
      </div>
    );
  }
};
```

## 🎨 Styling Standards

### Tailwind CSS Patterns
```typescript
// ✅ Consistent spacing and color patterns
const baseClasses = 'p-6 bg-slate-800/50 backdrop-blur-lg rounded-xl border border-slate-700/50';
const hoverClasses = 'hover:border-cyan-500/30 transition-all duration-200';
const textClasses = 'text-white font-medium';

// ✅ Use cn() utility for conditional classes
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'compact' && 'compact-classes',
  className
)}>
```

### Color Scheme Consistency
```typescript
// Standard color palette for betting components
const BETTING_COLORS = {
  // Confidence levels
  high: 'text-green-400 bg-green-500/20',
  medium: 'text-yellow-400 bg-yellow-500/20', 
  low: 'text-orange-400 bg-orange-500/20',
  
  // Risk levels
  safe: 'text-emerald-400',
  moderate: 'text-amber-400',
  risky: 'text-red-400',
  
  // AI/ML features
  ai: 'text-cyan-400 bg-cyan-500/20',
  quantum: 'text-purple-400 bg-purple-500/20',
  
  // Status indicators
  live: 'text-green-400 animate-pulse',
  processing: 'text-blue-400',
  error: 'text-red-400'
} as const;
```

## 🪝 Hook Standards

### Custom Hook Patterns
```typescript
// ✅ Betting-specific hooks pattern
export const useBettingOpportunities = (filters: BettingFilters) => {
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await bettingService.getOpportunities(filters);
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);
  
  return {
    opportunities,
    isLoading,
    error,
    refetch: fetchOpportunities
  };
};
```

## 🧪 Testing Standards

### Component Testing Pattern
```typescript
// BettingComponent.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BettingOpportunityCard } from './BettingOpportunityCard';
import type { BettingOpportunity } from './types';

const mockOpportunity: BettingOpportunity = {
  id: '1',
  confidence: 85,
  expectedValue: 12.5,
  riskLevel: 'medium'
};

describe('BettingOpportunityCard', () => {
  it('renders opportunity data correctly', () => {
    render(
      <BettingOpportunityCard 
        opportunity={mockOpportunity}
        onSelect={jest.fn()}
      />
    );
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });
  
  it('calls onSelect when clicked', async () => {
    const onSelect = jest.fn();
    
    render(
      <BettingOpportunityCard 
        opportunity={mockOpportunity}
        onSelect={onSelect}
      />
    );
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockOpportunity);
    });
  });
});
```

## 📊 Performance Standards

### React 19 Concurrent Features
```typescript
// ✅ Use modern React patterns for better performance
import { useTransition, useDeferredValue, startTransition } from 'react';

const BettingDashboard: React.FC<Props> = ({ searchQuery, ...props }) => {
  const [isPending, startTransition] = useTransition();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  // Non-urgent updates
  const handleFilterChange = (filters: BettingFilters) => {
    startTransition(() => {
      setFilters(filters);
    });
  };
  
  // Use deferred values for expensive operations
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => 
      opp.description.toLowerCase().includes(deferredSearchQuery.toLowerCase())
    );
  }, [opportunities, deferredSearchQuery]);
};
```

### Memoization Guidelines
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpectedValue(opportunities, modelWeights);
}, [opportunities, modelWeights]);

// ✅ Memoize callback functions
const handleOpportunitySelect = useCallback((opportunity: BettingOpportunity) => {
  onOpportunitySelect?.(opportunity);
  analytics.track('opportunity_selected', { id: opportunity.id });
}, [onOpportunitySelect]);

// ✅ Component memoization for expensive renders
export const BettingOpportunityCard = memo<BettingOpportunityCardProps>(({ 
  opportunity, 
  onSelect 
}) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.opportunity.id === nextProps.opportunity.id &&
         prevProps.opportunity.confidence === nextProps.opportunity.confidence;
});
```

## 🔧 Development Tools Integration

### ESLint Rules for Betting Components
```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "error",
    "react/jsx-key": "error",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### VSCode Settings
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 📚 Documentation Standards

### Component Documentation Template
```typescript
/**
 * BettingOpportunityCard - Displays a single betting opportunity with AI-enhanced metrics
 * 
 * @description A card component that shows betting opportunity details including confidence
 * scores, expected values, and risk assessments. Supports interactive selection and
 * real-time updates.
 * 
 * @example
 * ```tsx
 * <BettingOpportunityCard
 *   opportunity={opportunity}
 *   onSelect={handleOpportunitySelect}
 *   variant="expanded"
 *   className="mb-4"
 * />
 * ```
 * 
 * @see {@link BettingOpportunity} for opportunity data structure
 * @see {@link useBettingOpportunities} for data fetching hook
 */
export const BettingOpportunityCard: React.FC<BettingOpportunityCardProps> = ({ ... });
```

This standards document should be followed for all new betting components and existing components should be gradually migrated to follow these patterns.
