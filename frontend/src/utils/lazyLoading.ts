import * as React from 'react';
import { lazy, Suspense } from 'react';

interface LazyComponentOptions {
  fallback?: React.ComponentType | (() => React.ReactElement);
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Creates a lazy-loaded component with error handling and retry logic
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
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
        console.warn(`Failed to load component (attempt ${attempt}/${maxRetries}). Retrying in ${retryDelay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return importWithRetry(attempt + 1);
      }
      console.error('Failed to load component after maximum retries:', error);
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
      // Return a simple error fallback
      return React.createElement('div', 
        { className: 'text-red-400 p-8 text-center' }, 
        'Failed to load component. Please refresh the page.'
      );
    }

    const FallbackComponent = typeof fallback === 'function' ? fallback : () => React.createElement(fallback);

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        Suspense,
        { fallback: React.createElement(FallbackComponent) },
        React.createElement(LazyComponent, props)
      )
    );
  };

  WrappedComponent.displayName = `LazyComponent(${LazyComponent.displayName || 'Unknown'})`;

  return WrappedComponent;
}

/**
 * Higher-order component for adding lazy loading to existing components
 */
export function withLazyLoading<T extends React.ComponentType<any>>(
  Component: T,
  options: LazyComponentOptions = {}
): React.ComponentType<React.ComponentProps<T>> {
  return createLazyComponent(() => Promise.resolve({ default: Component }), options);
}

/**
 * Preload a lazy component
 */
export function preloadLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn().catch(error => {
    console.warn('Failed to preload component:', error);
    throw error;
  });
}
