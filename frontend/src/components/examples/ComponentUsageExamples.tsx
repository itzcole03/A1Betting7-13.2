/**
 * Component Usage Examples - Phase 3.2 Component Optimization
 * Demonstrates proper usage of lazy-loaded and shared components
 */

import React, { useState } from 'react';
import { GlassCard, LoadingSpinner, ErrorDisplay, StatusBadge, ConfidenceBadge, TrendBadge } from '../shared';
import { LazySHAPDashboard } from '../lazy/LazySHAPDashboard';
import { LazyPredictions } from '../lazy/LazyPredictions';

const ComponentUsageExamples: React.FC = () => {
  const [currentExample, setCurrentExample] = useState<'lazy' | 'shared'>('lazy');

  return (
    <div className="space-y-8 p-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setCurrentExample('lazy')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentExample === 'lazy' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'bg-slate-700/50 text-gray-400 border border-slate-600/30'
          }`}
        >
          Lazy Components
        </button>
        <button
          onClick={() => setCurrentExample('shared')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentExample === 'shared' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'bg-slate-700/50 text-gray-400 border border-slate-600/30'
          }`}
        >
          Shared Components
        </button>
      </div>

      {currentExample === 'lazy' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">Lazy-Loaded Components</h2>
          
          <GlassCard variant="featured" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">SHAP Analysis Dashboard</h3>
            <p className="text-gray-400 mb-4">
              Heavy ML explainability component with Chart.js visualizations, lazy-loaded for optimal performance.
            </p>
            <LazySHAPDashboard
              variant="dashboard"
              explanation={{
                predictionId: 'demo-001',
                modelName: 'XGBoost Ensemble',
                predictedValue: 0.87,
                baseValue: 0.52,
                confidence: 0.94,
                timestamp: new Date().toISOString(),
                metadata: { gameId: 'Lakers vs Warriors', betType: 'Over/Under' },
                shapValues: [
                  { feature: 'Team Pace', value: 108.5, baseValue: 102.3, shapValue: 0.23, confidence: 0.95, importance: 0.18 },
                  { feature: 'Player Health', value: 0.9, baseValue: 0.8, shapValue: -0.12, confidence: 0.88, importance: 0.15 }
                ]
              }}
            />
          </GlassCard>

          <GlassCard variant="featured" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">AI Predictions Dashboard</h3>
            <p className="text-gray-400 mb-4">
              Complex prediction interface with real-time data, lazy-loaded to prevent blocking the main thread.
            </p>
            <LazyPredictions variant="ai-dashboard" />
          </GlassCard>
        </div>
      )}

      {currentExample === 'shared' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4">Shared UI Components</h2>
          
          <GlassCard variant="compact" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">Glass Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard variant="default" padding="md">
                <h4 className="font-medium text-white mb-2">Default Card</h4>
                <p className="text-gray-400">Standard glass morphism styling</p>
              </GlassCard>
              <GlassCard variant="minimal" padding="md">
                <h4 className="font-medium text-white mb-2">Minimal Card</h4>
                <p className="text-gray-400">Subtle background styling</p>
              </GlassCard>
              <GlassCard variant="featured" padding="md">
                <h4 className="font-medium text-white mb-2">Featured Card</h4>
                <p className="text-gray-400">Gradient background for emphasis</p>
              </GlassCard>
              <GlassCard variant="compact" padding="md">
                <h4 className="font-medium text-white mb-2">Compact Card</h4>
                <p className="text-gray-400">Darker styling for density</p>
              </GlassCard>
            </div>
          </GlassCard>

          <GlassCard variant="default" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">Status Badges</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge variant="success">Success</StatusBadge>
                <StatusBadge variant="warning">Warning</StatusBadge>
                <StatusBadge variant="error">Error</StatusBadge>
                <StatusBadge variant="info">Info</StatusBadge>
                <StatusBadge variant="pending">Pending</StatusBadge>
                <StatusBadge variant="active" pulse>Active</StatusBadge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <ConfidenceBadge confidence={94.5} />
                <ConfidenceBadge confidence={76.2} />
                <ConfidenceBadge confidence={58.1} />
                <TrendBadge trend="up" value="+12.3%" />
                <TrendBadge trend="down" value="-5.7%" />
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="default" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">Loading Spinners</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LoadingSpinner variant="brain" size="lg" color="primary" message="Loading AI analysis..." />
              <LoadingSpinner variant="chart" size="lg" color="success" message="Loading predictions..." showProgress />
            </div>
          </GlassCard>

          <GlassCard variant="default" padding="lg">
            <h3 className="text-xl font-semibold text-white mb-4">Error Displays</h3>
            <div className="space-y-4">
              <ErrorDisplay
                variant="warning"
                title="Warning Example"
                message="This is a sample warning message"
                onRetry={() => alert('Retry functionality would be implemented here')}
              />
              <ErrorDisplay
                variant="minimal"
                title="Minimal Error"
                message="Clean error display for subtle feedback"
                showHomeButton
                onHome={() => window.location.href = '/'}
              />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ComponentUsageExamples;
