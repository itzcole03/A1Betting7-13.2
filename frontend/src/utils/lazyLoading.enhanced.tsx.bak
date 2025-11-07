/**
 * Enhanced Lazy Loading Utility for Bundle Size Optimization
 *
 * This utility provides advanced lazy loading capabilities to support
 * the bundle size optimization from ~1.2MB to <500KB target.
 *
 * Features:
 * - Route-based code splitting
 * - Component-level lazy loading
 * - Preloading strategies
 * - Loading states and error boundaries
 * - Progressive enhancement
 * - Resource hints for critical paths
 */

import React, { ComponentType, ReactNode, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Loading component types
interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

interface LazyComponentOptions {
  fallback?: ReactNode;
  errorFallback?: ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  preload?: boolean;
  retryCount?: number;
}

interface PreloadOptions {
  priority?: 'low' | 'high';
  delay?: number;
}

// Enhanced loading components
const SmallLoader: React.FC<LoadingProps> = ({ message = 'Loading...' }) => (
  <div className='inline-flex items-center space-x-2'>
    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
    <span className='text-sm text-gray-600'>{message}</span>
  </div>
);

const MediumLoader: React.FC<LoadingProps> = ({ message = 'Loading component...' }) => (
  <div className='flex flex-col items-center justify-center py-8 space-y-4'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
    <p className='text-gray-600'>{message}</p>
  </div>
);

const LargeLoader: React.FC<LoadingProps> = ({ message = 'Loading application...' }) => (
  <div className='flex flex-col items-center justify-center min-h-screen space-y-6'>
    <div className='animate-pulse flex space-x-4'>
      <div className='rounded-full bg-blue-400 h-10 w-10'></div>
      <div className='flex-1 space-y-2 py-1'>
        <div className='h-4 bg-blue-400 rounded w-3/4'></div>
        <div className='space-y-2'>
          <div className='h-4 bg-blue-400 rounded'></div>
          <div className='h-4 bg-blue-400 rounded w-5/6'></div>
        </div>
      </div>
    </div>
    <p className='text-lg text-gray-600'>{message}</p>
  </div>
);

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary,
}) => (
  <div className='flex flex-col items-center justify-center py-8 space-y-4 border border-red-200 rounded-lg bg-red-50'>
    <div className='text-red-600'>
      <svg className='w-12 h-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
        />
      </svg>
    </div>
    <div className='text-center'>
      <h3 className='text-lg font-semibold text-red-800'>Component Failed to Load</h3>
      <p className='text-red-600 mt-1'>{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className='mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
      >
        Try Again
      </button>
    </div>
  </div>
);

// Preloading mechanism
const preloadedComponents = new Map<string, Promise<{ default: ComponentType<any> }>>();

/**
 * Create a lazy component with enhanced loading and error handling
 */
export function createLazyComponent<T = any>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
) {
  const {
    fallback = <MediumLoader />,
    errorFallback = DefaultErrorFallback,
    preload = false,
    retryCount = 2,
  } = options;

  // Create retry wrapper for import function
  const retryableImport = async (): Promise<{ default: ComponentType<T> }> => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        return await importFunction();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Lazy load attempt ${attempt} failed:`, error);

        if (attempt <= retryCount) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw lastError;
  };

  const LazyComponent = lazy(retryableImport);

  // Preload if requested
  if (preload) {
    retryableImport().catch(console.error);
  }

  const WrappedComponent: React.FC<T> = props => (
    <ErrorBoundary FallbackComponent={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  // Add preload method to component
  (WrappedComponent as any).preload = () => retryableImport();

  return WrappedComponent;
}

/**
 * Preload a component for future use
 */
export function preloadComponent(
  key: string,
  importFunction: () => Promise<{ default: ComponentType<any> }>,
  options: PreloadOptions = {}
) {
  const { priority = 'low', delay = 0 } = options;

  if (preloadedComponents.has(key)) {
    return preloadedComponents.get(key)!;
  }

  const preloadPromise = new Promise<{ default: ComponentType<any> }>((resolve, reject) => {
    const doPreload = () => {
      importFunction().then(resolve).catch(reject);
    };

    if (delay > 0) {
      setTimeout(doPreload, delay);
    } else {
      // Use scheduler if available for better performance
      if (typeof requestIdleCallback !== 'undefined' && priority === 'low') {
        requestIdleCallback(doPreload);
      } else {
        doPreload();
      }
    }
  });

  preloadedComponents.set(key, preloadPromise);
  return preloadPromise;
}

/**
 * Enhanced lazy loading for route-level components
 */
export const createLazyRoute = <T = any,>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  routeName: string
) =>
  createLazyComponent(importFunction, {
    fallback: <LargeLoader message={`Loading ${routeName}...`} />,
    preload: false,
    retryCount: 3,
  });

/**
 * Create lazy component with small loading indicator (for inline components)
 */
export const createLazyInline = <T = any,>(
  importFunction: () => Promise<{ default: ComponentType<T> }>
) =>
  createLazyComponent(importFunction, {
    fallback: <SmallLoader />,
    retryCount: 1,
  });

/**
 * Optimized lazy loading for large feature modules
 */
export const createLazyFeature = <T = any,>(
  importFunction: () => Promise<{ default: ComponentType<T> }>,
  featureName: string
) =>
  createLazyComponent(importFunction, {
    fallback: <MediumLoader message={`Loading ${featureName}...`} />,
    retryCount: 2,
  });

// Pre-defined lazy-loaded components for major application features
export const LazyComponents = {
  // Authentication & User

  // Player Dashboard (Large feature)

  // Betting Features

  // Analytics & ML

  // Predictions

  // Admin

  // Settings

  // Help & Support
  AuthPage: createLazyRoute(() => import('../components/auth/AuthPage'), 'Authentication'),
  UserProfile: createLazyFeature(
    () => import('../components/features/user/UserProfile'),
    'User Profile'
  ),
  BetSlip: createLazyFeature(() => import('../components/betting/BetSlip'), 'Bet Slip'),
  ArbitrageOpportunities: createLazyFeature(
    () => import('../components/features/betting/ArbitrageOpportunities'),
    'Arbitrage'
  ),
  OddsComparison: createLazyFeature(
    () => import('../components/features/odds/OddsComparison'),
    'Odds Comparison'
  ),
  AnalyticsDashboard: createLazyFeature(
    () => import('../components/features/analytics/Analytics'),
    'Analytics'
  ),
  CheatsheetsDashboard: createLazyFeature(
    () => import('../components/features/cheatsheets/CheatsheetsDashboard'),
    'Cheatsheets'
  ),
  PredictionDisplay: createLazyFeature(
    () =>
      import('../components/prediction/PredictionDisplay').then(mod => ({
        default: mod.PredictionDisplay,
      })),
    'Predictions'
  ),
  Settings: createLazyFeature(() => import('../components/features/settings/Settings'), 'Settings'),
  OnboardingFlow: createLazyFeature(() => import('../onboarding/OnboardingFlow'), 'Onboarding'),
};

/**
 * Preload critical components based on user behavior
 */
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  const criticalComponents = ['PlayerDashboard', 'BetSlip', 'PredictionDisplay'];

  criticalComponents.forEach(componentName => {
    if (LazyComponents[componentName as keyof typeof LazyComponents]) {
      const component = LazyComponents[componentName as keyof typeof LazyComponents] as any;
      if (component.preload) {
        component.preload().catch(console.error);
      }
    }
  });
};

/**
 * Preload components based on route anticipation
 */
export const preloadForRoute = (currentRoute: string) => {
  const routePreloadMap: Record<string, string[]> = {
    '/': ['PlayerDashboard', 'BetSlip'],
    '/player': ['MLModelCenter', 'AnalyticsDashboard'],
    '/betting': ['OddsComparison', 'ArbitrageOpportunities'],
    '/analytics': ['CheatsheetsDashboard', 'PredictionDisplay'],
    '/admin': ['Settings'],
  };

  const componentsToPreload = routePreloadMap[currentRoute] || [];

  componentsToPreload.forEach(componentName => {
    if (LazyComponents[componentName as keyof typeof LazyComponents]) {
      const component = LazyComponents[componentName as keyof typeof LazyComponents] as any;
      if (component.preload) {
        component.preload().catch(console.error);
      }
    }
  });
};

/**
 * Progressive enhancement hook for lazy loading
 */
export const useProgressiveEnhancement = (shouldEnhance: boolean = true) => {
  React.useEffect(() => {
    if (!shouldEnhance) return;

    // Preload critical components after initial load
    const timer = setTimeout(() => {
      preloadCriticalComponents();
    }, 2000); // Wait 2 seconds after initial load

    return () => clearTimeout(timer);
  }, [shouldEnhance]);
};

/**
 * Resource hints utility for better loading performance
 */
export const addResourceHints = () => {
  if (typeof document === 'undefined') return;

  // Add preload hints for critical chunks
  const head = document.head;

  // Preload critical CSS
  const linkCSS = document.createElement('link');
  linkCSS.rel = 'preload';
  linkCSS.as = 'style';
  linkCSS.href = '/assets/index.css';
  head.appendChild(linkCSS);

  // DNS prefetch for external resources
  const domains = ['fonts.googleapis.com', 'fonts.gstatic.com'];
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    head.appendChild(link);
  });
};

// Initialize resource hints
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', addResourceHints);
}

export default {
  createLazyComponent,
  createLazyRoute,
  createLazyInline,
  createLazyFeature,
  preloadComponent,
  preloadCriticalComponents,
  preloadForRoute,
  useProgressiveEnhancement,
  LazyComponents,
};
