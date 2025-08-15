/**
 * Lazy-loaded Predictions Components - Phase 3.2 Component Optimization
 * High-performance lazy loading wrapper for heavy prediction dashboard components
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner, ErrorDisplay } from '../shared';

// Lazy load heavy prediction components that actually exist
const UnifiedAIPredictionsDashboard = React.lazy(() => 
  import('../ai/UnifiedAIPredictionsDashboard')
);

const PredictionDisplay = React.lazy(() => 
  import('../PredictionDisplay')
);

const RealTimePredictions = React.lazy(() => 
  import('../RealTimePredictions')
);

const AdvancedPredictions = React.lazy(() => 
  import('../phase3/AdvancedPredictions')
);

// Loading component for predictions
const PredictionsLoadingComponent: React.FC = () => (
  <LoadingSpinner
    variant="chart"
    size="xl"
    color="success"
    message="Initializing AI-powered prediction engines and real-time data streams..."
    showProgress={true}
    className="py-16"
  />
);

// Error fallback for predictions
const PredictionsErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <ErrorDisplay
    variant="default"
    title="Predictions Failed to Load"
    message={error.message}
    error={error}
    showDetails={true}
    onRetry={resetErrorBoundary}
    className="max-w-lg mx-auto"
  />
);

// Props interfaces for different prediction components
interface LazyPredictionsProps {
  variant?: 'ai-dashboard' | 'prediction-display' | 'realtime' | 'advanced';
  // Allow any props to be passed through to the underlying components
  [key: string]: unknown;
}

/**
 * Lazy-loaded Predictions wrapper with performance optimizations
 * Automatically selects the appropriate component based on variant prop
 */
export const LazyPredictions: React.FC<LazyPredictionsProps> = ({
  variant = 'ai-dashboard',
  ...props
}) => {
  const renderComponent = () => {
    switch (variant) {
      case 'prediction-display':
        return <PredictionDisplay {...props} />;
      case 'realtime':
        return <RealTimePredictions {...props} />;
      case 'advanced':
        return <AdvancedPredictions {...props} />;
      case 'ai-dashboard':
      default:
        return <UnifiedAIPredictionsDashboard {...props} />;
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={PredictionsErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<PredictionsLoadingComponent />}>
        {renderComponent()}
      </Suspense>
    </ErrorBoundary>
  );
};

// Individual component wrappers for more granular control
export const LazyAIDashboard: React.FC = (props) => (
  <LazyPredictions variant="ai-dashboard" {...props} />
);

export const LazyPredictionDisplay: React.FC = (props) => (
  <LazyPredictions variant="prediction-display" {...props} />
);

export const LazyRealtimePredictions: React.FC = (props) => (
  <LazyPredictions variant="realtime" {...props} />
);

export const LazyAdvancedPredictions: React.FC = (props) => (
  <LazyPredictions variant="advanced" {...props} />
);

export default LazyPredictions;
