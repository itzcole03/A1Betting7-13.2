/**
 * Modern React 18+ Concurrent Features Implementation
 *
 * This file implements React 18's concurrent features including:
 * - Suspense boundaries for data loading
 * - useTransition for non-blocking updates
 * - useDeferredValue for expensive computations
 * - Concurrent rendering patterns
 */

import React, { Suspense, useDeferredValue, useMemo, useTransition } from 'react';
import { enhancedLogger } from '../../utils/enhancedLogger';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

// =============================================================================
// SUSPENSE WRAPPERS
// =============================================================================

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<any>;
}

/**
 * Higher-order component that wraps components with Suspense
 */
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  errorFallback?: React.ComponentType<any>
) => {
  const SuspendedComponent = (props: P) => (
    <ErrorBoundary
      FallbackComponent={errorFallback || DefaultErrorFallback}
      onError={(error: Error, errorInfo: any) => {
        enhancedLogger.error('ConcurrentFeaturesProvider', 'withSuspense', 'Suspense Error', { errorInfo }, error as unknown as Error);
      }}
    >
      <Suspense fallback={fallback || <DefaultSuspenseFallback />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  SuspendedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`;
  return SuspendedComponent;
};

/**
 * Suspense wrapper component
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
}) => (
  <ErrorBoundary
    FallbackComponent={errorFallback || DefaultErrorFallback}
    onError={(error: Error, errorInfo: any) => {
      enhancedLogger.error('ConcurrentFeaturesProvider', 'SuspenseWrapper', 'Suspense Wrapper Error', { errorInfo }, error as unknown as Error);
    }}
  >
    <Suspense fallback={fallback || <DefaultSuspenseFallback />}>{children}</Suspense>
  </ErrorBoundary>
);

// =============================================================================
// DEFAULT FALLBACK COMPONENTS
// =============================================================================

const DefaultSuspenseFallback: React.FC = () => (
  <div className='flex items-center justify-center p-8'>
    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
    <span className='ml-3 text-gray-600'>Loading...</span>
  </div>
);

const DefaultErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <div className='p-6 bg-red-50 border border-red-200 rounded-lg'>
    <h3 className='text-lg font-semibold text-red-800 mb-2'>Something went wrong</h3>
    <p className='text-red-600 mb-4'>{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700'
    >
      Try again
    </button>
  </div>
);

// =============================================================================
// CONCURRENT HOOKS
// =============================================================================

/**
 * Hook for non-blocking state updates using useTransition
 */
export const useNonBlockingUpdate = () => {
  const [isPending, startTransition] = useTransition();

  const updateWithTransition = React.useCallback((updateFn: () => void) => {
    startTransition(() => {
      updateFn();
    });
  }, []);

  return {
    isPending,
    updateWithTransition,
    startTransition,
  };
};

/**
 * Hook for deferred expensive computations
 */
export const useDeferredSearch = (
  searchQuery: string,
  data: any[],
  searchFn: (item: any, query: string) => boolean
) => {
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredData = useMemo(() => {
    if (!deferredQuery) return data;
    return data.filter(item => searchFn(item, deferredQuery));
  }, [data, deferredQuery, searchFn]);

  const isStale = searchQuery !== deferredQuery;

  return {
    filteredData,
    isStale,
    deferredQuery,
  };
};

/**
 * Hook for concurrent filtering with performance optimization
 */
export const useConcurrentFilter = <T,>(
  items: T[],
  filters: Record<string, any>,
  filterFunctions: Record<string, (item: T, value: any) => boolean>
) => {
  const deferredFilters = useDeferredValue(filters);

  const filteredItems = useMemo(() => {
    let result = items;

    Object.entries(deferredFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const filterFn = filterFunctions[key];
        if (filterFn) {
          result = result.filter(item => filterFn(item, value));
        }
      }
    });

    return result;
  }, [items, deferredFilters, filterFunctions]);

  const isFiltering = Object.keys(filters).some(key => filters[key] !== deferredFilters[key]);

  return {
    filteredItems,
    isFiltering,
    activeFilters: deferredFilters,
  };
};

// =============================================================================
// CONCURRENT DATA LOADING PATTERNS
// =============================================================================

/**
 * Suspense-compatible data fetcher hook
 */
export const useSuspenseData = <T,>(
  fetcher: () => Promise<T>,
  key: string,
  deps: React.DependencyList = []
) => {
  const suspenseCache = React.useRef<Map<string, Promise<T>>>(new Map());

  const cacheKey = React.useMemo(() => {
    return `${key}-${JSON.stringify(deps)}`;
  }, [key, deps]);

  if (!suspenseCache.current.has(cacheKey)) {
    const promise = fetcher().catch(error => {
      suspenseCache.current.delete(cacheKey);
      throw error;
    });

    suspenseCache.current.set(cacheKey, promise);
  }

  const cachedPromise = suspenseCache.current.get(cacheKey)!;

  // This will suspend the component until the promise resolves
  if (cachedPromise instanceof Promise) {
    throw cachedPromise;
  }

  return cachedPromise;
};

/**
 * Concurrent data loading with Suspense
 */
export interface ConcurrentDataLoaderProps<T> {
  fetcher: () => Promise<T>;
  cacheKey: string;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<any>;
}

export const ConcurrentDataLoader = <T,>({
  fetcher,
  cacheKey,
  children,
  fallback,
  errorFallback,
}: ConcurrentDataLoaderProps<T>) => {
  const DataComponent = () => {
    const data = useSuspenseData(fetcher, cacheKey);
    return <>{children(data)}</>;
  };

  return (
    <SuspenseWrapper fallback={fallback} errorFallback={errorFallback}>
      <DataComponent />
    </SuspenseWrapper>
  );
};

// =============================================================================
// PERFORMANCE OPTIMIZED COMPONENTS
// =============================================================================

/**
 * Performance optimized list component with concurrent features
 */
interface ConcurrentListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  searchQuery?: string;
  searchFn?: (item: T, query: string) => boolean;
  filters?: Record<string, any>;
  filterFunctions?: Record<string, (item: T, value: any) => boolean>;
  className?: string;
}

export const ConcurrentList = <T,>({
  items,
  renderItem,
  keyExtractor,
  searchQuery = '',
  searchFn = () => true,
  filters = {},
  filterFunctions = {},
  className = '',
}: ConcurrentListProps<T>) => {
  // Use concurrent filtering
  const { filteredItems: filteredByFilters, isFiltering } = useConcurrentFilter(
    items,
    filters,
    filterFunctions
  );

  // Use deferred search
  const { filteredData: finalItems, isStale } = useDeferredSearch(
    searchQuery,
    filteredByFilters,
    searchFn
  );

  const isProcessing = isFiltering || isStale;

  return (
    <div className={`${className} ${isProcessing ? 'opacity-75' : ''}`}>
      {isProcessing && (
        <div className='absolute top-2 right-2 z-10'>
          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
        </div>
      )}
      {finalItems.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>{renderItem(item, index)}</React.Fragment>
      ))}
    </div>
  );
};

// =============================================================================
// CONCURRENT FORM PATTERNS
// =============================================================================

/**
 * Form with non-blocking updates
 */
export const useConcurrentForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) => {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const { isPending, updateWithTransition } = useNonBlockingUpdate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const updateField = React.useCallback(
    (field: keyof T, value: any) => {
      updateWithTransition(() => {
        setValues(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
          setErrors(prev => ({ ...prev, [field]: undefined }));
        }
      });
    },
    [updateWithTransition, errors]
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (error) {
        enhancedLogger.error('ConcurrentFeaturesProvider', 'useConcurrentForm', 'Form submission error', undefined, error as unknown as Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  const setFieldError = React.useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    updateField,
    handleSubmit,
    setFieldError,
    clearErrors,
    isPending,
    isSubmitting,
  };
};

// =============================================================================
// CONCURRENT ROUTING PATTERNS
// =============================================================================

/**
 * Route component with Suspense
 */
export interface SuspenseRouteProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<any>;
  [key: string]: any;
}

export const SuspenseRoute: React.FC<SuspenseRouteProps> = ({
  component: Component,
  fallback,
  errorFallback,
  ...props
}) => (
  <SuspenseWrapper fallback={fallback} errorFallback={errorFallback}>
    <Component {...props} />
  </SuspenseWrapper>
);

// =============================================================================
// EXPORT ALL CONCURRENT FEATURES
// =============================================================================

export { startTransition, Suspense, useDeferredValue, useTransition } from 'react';
