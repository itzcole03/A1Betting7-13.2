/**
 * Lazy-loaded SHAP Dashboard - Phase 3.2 Component Optimization
 * High-performance lazy loading wrapper for heavy SHAP visualization components
 */

import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { LoadingSpinner, ErrorDisplay } from '../shared';

// Lazy load the heavy SHAP components
const InteractiveSHAPDashboard = React.lazy(() => 
  import('../enhanced/InteractiveSHAPDashboard').then(module => ({
    default: module.default || module
  }))
);

const SHAPAnalysis = React.lazy(() => 
  import('../features/shap/SHAPAnalysis').then(module => ({
    default: module.default || module
  }))
);

// Loading component
const SHAPLoadingComponent: React.FC = () => (
  <LoadingSpinner
    variant="brain"
    size="xl"
    color="primary"
    message="Initializing ML explainability dashboard with interactive visualizations..."
    showProgress={true}
    className="py-16"
  />
);

// Error fallback component
const SHAPErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <ErrorDisplay
    variant="default"
    title="SHAP Analysis Failed to Load"
    message={error.message}
    error={error}
    showDetails={true}
    onRetry={resetErrorBoundary}
    className="max-w-lg mx-auto"
  />
);

// Props interfaces
interface PredictionExplanation {
  predictionId: string;
  modelName: string;
  predictedValue: number;
  baseValue: number;
  shapValues: Array<{
    feature: string;
    value: number;
    baseValue: number;
    shapValue: number;
    confidence: number;
    importance: number;
  }>;
  confidence: number;
  timestamp: string;
  metadata: {
    gameId?: string;
    betType?: string;
    context?: string;
  };
}

interface LazySHAPDashboardProps {
  explanation?: PredictionExplanation;
  onFeatureSelect?: (feature: string) => void;
  onExportData?: () => void;
  realTimeUpdates?: boolean;
  variant?: 'dashboard' | 'analysis';
}

/**
 * Lazy-loaded SHAP Dashboard wrapper with performance optimizations
 * Automatically selects the appropriate component based on variant prop
 */
export const LazySHAPDashboard: React.FC<LazySHAPDashboardProps> = ({
  variant = 'dashboard',
  ...props
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={SHAPErrorFallback}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<SHAPLoadingComponent />}>
        {variant === 'analysis' ? (
          <SHAPAnalysis />
        ) : (
          <InteractiveSHAPDashboard {...props} />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazySHAPDashboard;
