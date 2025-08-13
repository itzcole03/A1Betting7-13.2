import React, { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Example: Lazy load a heavy analytics component
const HeavyAnalytics = React.lazy(() => import('./HeavyAnalytics'));

/**
 * SuspenseLazyExample - Demonstrates Suspense and ErrorBoundary for lazy-loaded components.
 */
export const SuspenseLazyExample: React.FC = () => (
  <ErrorBoundary
    fallback={<div className='p-4 bg-yellow-100 text-yellow-800'>Error loading analytics.</div>}
  >
    <Suspense fallback={<div className='p-4 bg-blue-100 text-blue-800'>Loading analytics...</div>}>
      <HeavyAnalytics />
    </Suspense>
  </ErrorBoundary>
);

export default SuspenseLazyExample;
