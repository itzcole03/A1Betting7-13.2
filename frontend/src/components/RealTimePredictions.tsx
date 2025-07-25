/**
 * Real-Time Predictions Display Component
 * PHASE 6: END-TO-END INTEGRATION & TESTING
 *
 * Displays real-time predictions from the Phase 5 prediction engine.
 * Shows confidence levels, explanations, and recommendations.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  PredictionStats,
  RealTimePrediction,
  SystemHealth,
  realTimePredictionService,
} from '../services/realTimePredictionService';
import { safeNumber } from '../utils/UniversalUtils';
// @ts-expect-error TS(2307): Cannot find module '@/services/analytics/userPerso... Remove this comment to see the full error message
import { userPersonalizationService } from '@/services/analytics/userPersonalizationService';
// @ts-expect-error TS(2307): Cannot find module '@/auth/AuthContext' or its cor... Remove this comment to see the full error message
import { useAuth } from '../contexts/AuthContext';

interface RealTimePredictionsProps {
  sport?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const _RealTimePredictions: React.FC<RealTimePredictionsProps> = ({
  sport,
  limit = 10,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [predictions, setPredictions] = useState<RealTimePrediction[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { user } = useAuth();

  // Fetch predictions from the real-time API
  const _fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check API health first
      const _healthy = await realTimePredictionService.checkApiHealth();
      setApiHealthy(healthy);

      if (!healthy) {
        throw new Error(
          'Prediction API is not available. Please ensure the backend service is running on port 8003.'
        );
      }

      // Fetch predictions
      // Pass user.id to enable backend personalization
      const _predictionData = await realTimePredictionService.getLivePredictions(
        {
          sport,
          limit,
        },
        user && user.id
      );

      // Personalize predictions for the current user
      let _personalizedPredictions = predictionData;
      if (user && user.id) {
        personalizedPredictions = await Promise.all(
          predictionData.map(prediction =>
            userPersonalizationService.getPersonalizedPrediction(user.id, prediction)
          )
        );
      }

      setPredictions(personalizedPredictions);
      setLastUpdate(new Date());

      // Fetch system health and stats
      const [healthData, statsData] = await Promise.all([
        realTimePredictionService.getSystemHealth(),
        realTimePredictionService.getPredictionStats(),
      ]);

      setSystemHealth(healthData);
      setStats(statsData);
    } catch (err) {
      const _errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      //       console.error('❌ Error fetching predictions:', err);
    } finally {
      setLoading(false);
    }
  }, [sport, limit, user]);

  // Initial load
  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const _interval = setInterval(fetchPredictions, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPredictions]);

  // Format date/time for display
  const _formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format time ago
  const _formatTimeAgo = (dateString: string) => {
    const _date = new Date(dateString);
    const _now = new Date();
    const _diffMs = now.getTime() - date.getTime();
    const _diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const _diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const _diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Render prediction card
  const _renderPredictionCard = (prediction: RealTimePrediction) => {
    const _confidenceColor = realTimePredictionService.getConfidenceColor(
      prediction.confidence_level
    );
    const _recommendationColor = realTimePredictionService.getRecommendationColor(
      prediction.recommendation
    );

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        key={prediction.prop_id}
        className='bg-white rounded-lg shadow-md p-6 border border-gray-200'
      >
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex justify-between items-start mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-lg font-semibold text-gray-900'>{prediction.player_name}</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>
              {prediction.sport} • {prediction.league}
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-right'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div
              className='inline-block px-3 py-1 rounded-full text-white text-sm font-medium'
              style={{ backgroundColor: recommendationColor }}
            >
              {realTimePredictionService.formatRecommendation(prediction.recommendation)}
            </div>
          </div>
        </div>
        {/* Prediction Details */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-2 gap-4 mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Stat Type</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='font-medium'>{prediction.stat_type}</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Line</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='font-medium'>{prediction.line}</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Predicted Value</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='font-medium text-blue-600'>{safeNumber(prediction.predicted_value, 2)}</p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Probability</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='font-medium'>{(prediction.prediction_probability * 100).toFixed(1)}%</p>
          </div>
        </div>
        {/* Confidence and Risk */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-2 gap-4 mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Confidence</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: confidenceColor }}
              ></div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span className='font-medium'>
                {realTimePredictionService.formatConfidenceLevel(prediction.confidence_level)}
              </span>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span className='text-sm text-gray-500'>
                ({(prediction.confidence_score * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600'>Expected Value</p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p
              className={`font-medium ${
                prediction.expected_value >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {prediction.expected_value >= 0 ? '+' : ''}
              {safeNumber(prediction.expected_value, 3)}
            </p>
          </div>
        </div>
        {/* Reasoning */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-sm text-gray-600 mb-1'>AI Reasoning</p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-sm bg-gray-50 p-3 rounded'>{prediction.reasoning}</p>
        </div>
        {/* Key Factors */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-sm text-gray-600 mb-2'>Key Factors</p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex flex-wrap gap-2'>
            {prediction.key_factors.map((factor, index) => (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span
                key={index}
                className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
        {/* Model Information */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='border-t pt-3'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-2 gap-4 text-xs text-gray-500'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p>Primary Model: {prediction.primary_model}</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p>Model Agreement: {(prediction.model_agreement * 100).toFixed(1)}%</p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p>Game Time: {formatDateTime(prediction.game_time)}</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p>Data Freshness: {safeNumber(prediction.data_freshness, 1)}m</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='max-w-7xl mx-auto p-6'>
      {/* Header */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='mb-6'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='flex justify-between items-center mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h1 className='text-3xl font-bold text-gray-900'>Real-Time Predictions</h1>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-600'>
              Live predictions from trained ML models • Phase 6 Integration
            </p>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {/* System Status */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          {/* API Health */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='bg-white rounded-lg shadow-sm p-4 border'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div
                className={`w-3 h-3 rounded-full ${apiHealthy ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span className='font-medium'>API Status</span>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-sm text-gray-600 mt-1'>
              {apiHealthy ? 'Operational' : 'Unavailable'}
            </p>
          </div>
          {/* System Health */}
          {systemHealth && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='bg-white rounded-lg shadow-sm p-4 border'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div
                  className={`w-3 h-3 rounded-full ${
                    systemHealth.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                ></div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <span className='font-medium'>System Health</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-sm text-gray-600 mt-1'>
                {systemHealth.models_loaded} models loaded
              </p>
            </div>
          )}
          {/* Statistics */}
          {stats && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='bg-white rounded-lg shadow-sm p-4 border'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div className='w-3 h-3 rounded-full bg-blue-500'></div>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <span className='font-medium'>Statistics</span>
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-sm text-gray-600 mt-1'>
                {stats.total_predictions} predictions generated
              </p>
            </div>
          )}
        </div>
        {/* Last Update */}
        {lastUpdate && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <p className='text-sm text-gray-500 mb-4'>Last updated: {lastUpdate.toLocaleString()}</p>
        )}
      </div>
      {/* Error Display */}
      {error && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='w-5 h-5 text-red-500'>⚠️</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <span className='font-medium text-red-800'>Error</span>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-red-700 mt-1'>{error}</p>
          {!apiHealthy && (
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='mt-3 text-sm text-red-600'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p>To start the prediction API:</p>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <code className='bg-red-100 px-2 py-1 rounded'>
                cd backend && python prediction_api.py
              </code>
            </div>
          )}
        </div>
      )}
      {/* Loading State */}
      {loading && predictions.length === 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center py-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-gray-600'>Loading real-time predictions...</p>
        </div>
      )}
      {/* No Predictions */}
      {!loading && predictions.length === 0 && !error && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='text-center py-12'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-6xl mb-4'>🎯</div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Predictions Available</h3>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <p className='text-gray-600 mb-4'>
            No real-time predictions are currently available. This could be due to:
          </p>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <ul className='text-sm text-gray-500 text-left max-w-md mx-auto'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <li>• No current props from PrizePicks API</li>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <li>• Models are still training</li>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <li>• API rate limiting</li>
          </ul>
        </div>
      )}
      {/* Predictions Grid */}
      {predictions.length > 0 && (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex justify-between items-center mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h2 className='text-xl font-semibold text-gray-900'>
              Live Predictions ({predictions.length})
            </h2>
            {sport && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                {sport}
              </span>
            )}
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {predictions.map(renderPredictionCard)}
          </div>
        </div>
      )}
      {/* Footer */}
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500'>
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <p>
          Real-time predictions powered by trained ML models • Zero mock data • Phase 6 Integration
          Testing
        </p>
      </div>
    </div>
  );
};

export default RealTimePredictions;
