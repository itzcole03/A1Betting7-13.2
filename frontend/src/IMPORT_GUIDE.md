# Import Optimization Guide

This guide establishes consistent import patterns for the A1Betting frontend application.

## 🎯 Import Standards

### ✅ **PREFERRED** - Use @ path mappings
```typescript
// Components
import { Button, Card, Modal } from '@/components';
import { ErrorBoundary, Layout } from '@/components/core';
import { UserFriendlyApp } from '@/components';

// Services & Utilities  
import { discoverBackend } from '@/services/backendDiscovery';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Types
import type { BettingOpportunity } from '@/types/betting';
```

### ⚠️ **ACCEPTABLE** - Relative imports for close files
```typescript
// Same directory or one level up
import { SomeComponent } from './SomeComponent';
import { ParentComponent } from '../ParentComponent';
```

### ❌ **AVOID** - Deep relative imports
```typescript
// Don't do this - hard to maintain
import { ErrorBoundary } from '../../components/core/ErrorBoundary';
import { SomeUtil } from '../../../utils/someUtil';
```

## 📁 Import Categories & Patterns

### **1. React & External Libraries** (First)
```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, BarChart3 } from 'lucide-react';
```

### **2. Internal Components** (Second)
```typescript
import { Button, Card } from '@/components';
import { ErrorBoundary } from '@/components/core';
import { AuthPage } from '@/components/auth';
```

### **3. Services & Hooks** (Third)
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { discoverBackend } from '@/services/backendDiscovery';
import { useAIInsights } from '@/hooks/useAIInsights';
```

### **4. Utils & Helpers** (Fourth)  
```typescript
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatting';
```

### **5. Types** (Last)
```typescript
import type { BettingOpportunity } from '@/types/betting';
import type { ApiResponse } from '@/types/api';
```

## 🔧 Component Export Patterns

### **Default Exports** (for components)
```typescript
// ComponentName.tsx
const ComponentName: React.FC = () => {
  return <div>Component</div>;
};

export default ComponentName;
```

### **Named Exports** (for utilities/hooks)
```typescript
// utils.ts
export const formatCurrency = (amount: number) => { ... };
export const calculateROI = (profit: number, cost: number) => { ... };
```

### **Mixed Exports** (for complex modules)
```typescript
// context.tsx
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
```

## 📋 Index File Strategy

### **components/index.ts** (Main barrel export)
```typescript
// === MAIN APPLICATION ===
export { default as UserFriendlyApp } from './user-friendly/UserFriendlyApp';

// === CORE FEATURES ===
export { default as PropOllamaUnified } from './PropOllamaUnified';

// === UI COMPONENTS ===
export * from './ui';
```

### **Subdirectory index files**
```typescript
// components/ui/index.ts
export { default as Button } from '../Button';
export { default as Card } from '../Card';
export * from './input';
```

## 🚨 Common Issues Fixed

### **1. Circular Dependencies**
- ❌ Component A imports Component B, Component B imports Component A
- ✅ Move shared logic to separate utility module

### **2. Deep Import Chains**
- ❌ `import Button from '../../../ui/components/base/Button';`
- ✅ `import { Button } from '@/components';`

### **3. Inconsistent ErrorBoundary Imports**
- ❌ Mix of `import ErrorBoundary` vs `import { ErrorBoundary }`
- ✅ Standardized on `import { ErrorBoundary } from '@/components/core';`

### **4. Broken Lazy Imports**
- ❌ `lazy(() => import('../features').then(module => ({ default: module.Component })))`
- ✅ `lazy(() => import('@/components/Component'))`

## 🎯 Path Resolution Setup

The project is configured with:
- **TypeScript**: `@/*` maps to `src/*` in `tsconfig.json`
- **Vite**: `viteTsconfigPaths()` plugin enables path mapping
- **ESLint**: Should recognize path mappings automatically

## 📊 Import Performance

### **Lazy Loading Pattern**
```typescript
// For large components that aren't immediately needed
const HeavyComponent = lazy(() => import('@/components/HeavyComponent'));

// Usage
<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>
```

### **Tree Shaking Optimization**
```typescript
// ✅ Good - specific imports
import { Button } from '@/components/ui';

// ❌ Avoid - imports entire library
import * as AllComponents from '@/components';
```

## 🔄 Migration Checklist

- [x] Fixed ErrorBoundary import paths
- [x] Fixed Layout import in UltimateMoneyMaker 
- [x] Standardized component export patterns
- [x] Created barrel exports in index files
- [x] Established @ path mapping standards
- [ ] Update all components to use @ imports (ongoing)
- [ ] Remove remaining deep relative imports
- [ ] Add ESLint rules for import ordering

This guide ensures consistent, maintainable, and performant import patterns across the A1Betting application.
