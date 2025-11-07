/**
 * Lazy Loading Utilities for A1Betting Frontend
 *
 * Provides centralized lazy loading with loading states, error boundaries,
 * and preloading capabilities for better performance.
 */

import React from 'react';

/**
 * Enhanced lazy loading with retry capability and custom loading states
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ComponentType;
    maxRetries?: number;
    retryDelay?: number;
  }
) => {
  const { fallback: Fallback, maxRetries = 3, retryDelay = 1000 } = options || {};

  let retryCount = 0;

  const retryImport = async (): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.warn(`Failed to load component, retrying (${retryCount}/${maxRetries})...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
        return retryImport();
      }
      throw error;
    }
  };

  const LazyComponent = React.lazy(retryImport);

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <React.Suspense fallback={Fallback ? <Fallback /> : <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );

  return WrappedComponent;
};

/**
 * Default loading fallback component
 */
export const DefaultLoadingFallback: React.FC = () => (
  <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
    <div className='text-center'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4'></div>
      <p className='text-slate-300 text-lg'>Loading A1Betting...</p>
      <p className='text-slate-400 text-sm mt-2'>Preparing your sports analytics dashboard</p>
    </div>
  </div>
);

/**
 * Loading fallback for smaller components
 */
export const ComponentLoadingFallback: React.FC = () => (
  <div className='flex items-center justify-center p-8'>
    <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400'></div>
    <span className='ml-2 text-slate-300'>Loading...</span>
  </div>
);

/**
 * Error fallback for lazy loading failures
 */
export const LazyLoadErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({
  error,
  retry,
}) => (
  <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
    <div className='text-center p-8 max-w-md'>
      <div className='text-red-400 mb-4'>
        <svg className='h-16 w-16 mx-auto' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z'
          />
        </svg>
      </div>
      <h3 className='text-xl font-bold text-white mb-2'>Failed to Load Component</h3>
      <p className='text-slate-300 mb-4'>
        {error?.message || 'There was an error loading this part of the application.'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className='bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors'
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

/**
 * Preload components for better performance
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  const componentImport = importFn();
  componentImport.catch(error => {
    console.warn('Failed to preload component:', error);
  });
  return componentImport;
};

/**
 * Hook for preloading components on hover or focus
 */
export const usePreloadOnHover = (importFn: () => Promise<any>) => {
  const preload = React.useCallback(() => {
    preloadComponent(importFn);
  }, [importFn]);

  return {
    onMouseEnter: preload,
    onFocus: preload,
  };
};

/**
 * Lazy loaded components with predefined configurations
 */
export const LazyComponents = {
  // Main application components
  UserFriendlyApp: createLazyComponent(
    () => import('../components/user-friendly/UserFriendlyApp'),
    { fallback: DefaultLoadingFallback }
  ),

  // Authentication components
  AuthPage: createLazyComponent(() => import('../components/auth/AuthPage'), {
    fallback: ComponentLoadingFallback,
  }),

  PasswordChangeForm: createLazyComponent(() => import('../components/auth/PasswordChangeForm'), {
    fallback: ComponentLoadingFallback,
  }),

  // Onboarding
  OnboardingFlow: createLazyComponent(
    () =>
      import('../onboarding/OnboardingFlow').then(module => ({ default: module.OnboardingFlow })),
    { fallback: DefaultLoadingFallback }
  ),

  // Sports analytics components (for future use)
  PropOllamaUnified: createLazyComponent(() => import('../components/PropOllamaUnified'), {
    fallback: ComponentLoadingFallback,
  }),

  PredictionDisplay: createLazyComponent(() => import('../components/PredictionDisplay'), {
    fallback: ComponentLoadingFallback,
  }),
};
