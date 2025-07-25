# Component Organization

This directory contains all React components organized by functionality and reusability.

## Structure

```
components/
├── README.md                    # This file
├── index.ts                     # Main exports for clean imports
│
├── features/                    # Main application features
│   ├── index.ts                # Feature exports
│   └── moneymaker/             # MoneyMaker feature directory
│
├── core/                       # Core app components (layout, navigation)
│   ├── index.ts                # Core component exports  
│   ├── ErrorBoundary/
│   ├── Layout/
│   └── Navbar/
│
├── ui/                         # Reusable UI components
│   ├── index.ts                # UI component exports
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
│
├── auth/                       # Authentication components
│   ├── AuthPage.tsx
│   └── PasswordChangeForm.tsx
│
└── user-friendly/              # Main app shell
    └── UserFriendlyApp.tsx     # Primary application component
```

## Usage

### Clean Imports
Instead of deep relative imports, use the organized structure:

```typescript
// ✅ Good - using organized exports
import { PropOllamaUnified, PredictionDisplay, MoneyMaker } from '@/components/features';
import { ErrorBoundary, Layout } from '@/components/core';
import { Button, Card, Input } from '@/components/ui';

// ❌ Avoid - deep relative imports  
import PropOllamaUnified from '../../features/PropOllamaUnified';
import ErrorBoundary from '../../../core/ErrorBoundary';
```

## Current Active Components

The application currently uses these main components:

1. **UserFriendlyApp** - Main application shell with tab navigation
2. **PropOllamaUnified** - AI chat interface for sports betting analysis  
3. **PredictionDisplay** - Sports predictions and betting recommendations
4. **MoneyMaker** (UltimateMoneyMaker) - Advanced betting strategies and AI analysis

## Guidelines

- **features/**: Large, complex components that represent main app functionality
- **core/**: Essential app infrastructure (layout, routing, error handling)
- **ui/**: Small, reusable components that don't contain business logic
- **auth/**: Authentication and user management components

Each directory should have an `index.ts` file for clean exports.
