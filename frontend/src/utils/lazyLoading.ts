import * as React from 'react';
import { lazy, Suspense } from 'react';
import { enhancedLogger } from './enhancedLogger';

interface LazyComponentOptions {
  fallback?: React.ComponentType | (() => React.ReactElement);
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Creates a lazy-loaded component with error handling and retry logic
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  const {
    fallback = () => React.createElement('div', { className: 'text-white p-8' }, 'Loading...'),
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  // Create a wrapper around the import function to handle retries
  const importWithRetry = async (attempt = 1): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < maxRetries) {
        enhancedLogger.warn('lazyLoading', 'importWithRetry', `Failed to load component (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay}ms...`, { attempt, maxRetries }, error as unknown as Error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return importWithRetry(attempt + 1);
      }
      enhancedLogger.error('lazyLoading', 'importWithRetry', 'Failed to load component after maximum retries', undefined, error as unknown as Error);
      throw error;
    }
  };

  const LazyComponent = lazy(() => importWithRetry());

  const WrappedComponent: React.ComponentType<React.ComponentProps<T>> = (props) => {
    const [hasError, setHasError] = React.useState(false);

    // Reset error state when props change
    React.useEffect(() => {
      setHasError(false);
    }, [props]);

    if (hasError) {
      // Return a simple error fallback (createElement to avoid JSX in .ts file)
      return React.createElement(
        'div',
        { className: 'text-red-400 p-8 text-center' },
        'Failed to load component. Please refresh the page.'
      );
    }

    const FallbackComponent = typeof fallback === 'function' ? fallback : () => React.createElement(fallback);

    const LazyAsComponent = (LazyComponent as unknown) as React.ComponentType<React.ComponentProps<T>>;

    // Forward props to the lazy component with proper typing using a function component
    function Forwarder(p: React.ComponentProps<T>) {
      // cast to any for React.createElement to satisfy overloads
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return React.createElement(LazyAsComponent as any, p as any);
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        Suspense,
        { fallback: React.createElement(FallbackComponent) },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.createElement(Forwarder as any, props as any)
      )
    );
  };

  const lazyDisplayName = ((LazyComponent as unknown) as { displayName?: string }).displayName || 'Unknown';
  WrappedComponent.displayName = `LazyComponent(${lazyDisplayName})`;

  return WrappedComponent;
}

/**
 * Higher-order component for adding lazy loading to existing components
 */
export function withLazyLoading<T extends React.ComponentType<unknown>>(
  Component: T,
  options: LazyComponentOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(() => Promise.resolve({ default: Component }), options);
}

/**
 * Preload a lazy component
 */
export function preloadLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn().catch(error => {
  enhancedLogger.warn('lazyLoading', 'preloadLazyComponent', 'Failed to preload component', undefined, error as unknown as Error);
    throw error;
  });
}
