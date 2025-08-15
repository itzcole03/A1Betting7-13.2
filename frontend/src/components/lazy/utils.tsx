/**
 * Lazy Component Utilities - Phase 3.2 Component Optimization
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Loader } from 'lucide-react';
import type { LazyLoadingProps, LazyErrorProps } from './types';

// Generic loading component
const DefaultLoadingComponent: React.FC<LazyLoadingProps> = ({ 
  message = 'Loading component...', 
  showProgress = false 
}) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
    <p className="text-gray-400">{message}</p>
    {showProgress && (
      <div className="w-32 bg-slate-800/50 rounded-lg h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
      </div>
    )}
  </div>
);

// Generic error fallback component
const DefaultErrorFallback: React.FC<LazyErrorProps> = ({ 
  error, 
  resetErrorBoundary, 
  componentName = 'Component' 
}) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
    <h3 className="text-lg font-bold text-red-400 mb-2">{componentName} Failed to Load</h3>
    <p className="text-gray-400 mb-4">Error: {error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
    >
      Retry Loading
    </button>
  </div>
);

// Higher-order component to wrap lazy components with error boundary and suspense
export const withLazyErrorBoundary = <P extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<P>>,
  options: {
    componentName?: string;
    loadingMessage?: string;
    showProgress?: boolean;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary
      FallbackComponent={(errorProps) => 
        <DefaultErrorFallback 
          {...errorProps} 
          componentName={options.componentName} 
        />
      }
      onReset={() => window.location.reload()}
    >
      <Suspense 
        fallback={
          <DefaultLoadingComponent 
            message={options.loadingMessage}
            showProgress={options.showProgress}
          />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withLazyErrorBoundary(${options.componentName || 'LazyComponent'})`;
  
  return WrappedComponent;
};
