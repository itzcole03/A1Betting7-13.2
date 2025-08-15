/**
 * Lazy Component Types - Phase 3.2 Component Optimization
 */

export interface LazyComponentProps {
  [key: string]: unknown;
}

export interface LazyLoadingProps {
  message?: string;
  icon?: React.ComponentType;
  showProgress?: boolean;
}

export interface LazyErrorProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName?: string;
}

export type LazyComponentVariant = 'shap-dashboard' | 'shap-analysis' | 'ai-predictions' | 'prediction-display' | 'realtime' | 'advanced';

export default LazyComponentProps;
