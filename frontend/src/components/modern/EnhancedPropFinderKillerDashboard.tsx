import React, { Suspense, lazy } from 'react';
import { RefreshCw } from 'lucide-react';

// Lazy load the optimized dashboard for better performance
const OptimizedPropFinderKillerDashboard = lazy(() => import('./OptimizedPropFinderKillerDashboard'));

/**
 * Enhanced PropFinder Killer Dashboard - Performance Optimized Version
 *
 * This component now uses the OptimizedPropFinderKillerDashboard for better:
 * - Virtual scrolling for large datasets
 * - Component memoization and React concurrent features
 * - Advanced caching and performance monitoring
 * - Lazy loading and code splitting
 * - Memory optimization strategies
 */

const EnhancedPropFinderKillerDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
              <h2 className="text-xl font-bold text-white mb-2">Loading PropFinder Killer</h2>
              <p className="text-gray-400">Initializing performance optimizations...</p>
              <div className="mt-4 bg-slate-800/50 rounded-lg p-4 max-w-md mx-auto">
                <div className="text-sm text-gray-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Virtual Scrolling</span>
                    <span className="text-green-400">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Component Memoization</span>
                    <span className="text-green-400">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Performance Monitoring</span>
                    <span className="text-green-400">✓ Ready</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lazy Loading</span>
                    <span className="text-green-400">✓ Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <OptimizedPropFinderKillerDashboard />
      </Suspense>
    </div>
  );
};

export default EnhancedPropFinderKillerDashboard;
