/**
 * Real-Time Predictions Display Component
 * PHASE 6: END-TO-END INTEGRATION & TESTING
 *
 * Displays real-time predictions from the Phase 5 prediction engine.
 * Shows confidence levels, explanations, and recommendations.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPersonalizationService } from '../services/analytics/userPersonalizationService';
import UnifiedPredictionService, {
  type RealTimePrediction,
  type RealTimePredictionRequest,
  type RealTimePredictionStats,
  type RealTimeSystemHealth,
} from '../services/unified/UnifiedPredictionService';
import { safeNumber } from '../utils/safeNumber';

const predictionService = UnifiedPredictionService.getInstance();

interface RealTimePredictionsProps {
  sport?: string;
  limit?: number;
  autoRefreshMs?: number;
}

const DEFAULT_LIMIT = 12;
const DEFAULT_REFRESH_MS = 120000;

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Unknown' : parsed.toLocaleString();
};

const formatRelativeTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }
  const diffMinutes = Math.floor((Date.now() - parsed.getTime()) / (60 * 1000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const RealTimePredictions: React.FC<RealTimePredictionsProps> = ({
  sport: initialSport,
  limit = DEFAULT_LIMIT,
  autoRefreshMs = DEFAULT_REFRESH_MS,
}) => {
  const { user } = useAuth();
  const personalizationService = useMemo(() => UserPersonalizationService.getInstance(), []);

  const [predictions, setPredictions] = useState<RealTimePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState<string | undefined>(initialSport);
  const [apiHealthy, setApiHealthy] = useState(true);
  const [systemHealth, setSystemHealth] = useState<RealTimeSystemHealth | null>(null);
  const [stats, setStats] = useState<RealTimePredictionStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const userId = user?.id;

  const refreshMeta = useCallback(async () => {
    const [systemHealthData, statsData] = await Promise.all([
      predictionService.getRealTimeSystemHealth().catch(() => null),
      predictionService.getRealTimePredictionStats().catch(() => null),
    ]);

    if (systemHealthData) {
      setSystemHealth(systemHealthData);
      setApiHealthy(systemHealthData.status === 'operational');
    } else {
      setSystemHealth(null);
    }

    if (statsData) {
      setStats(statsData);
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const request: RealTimePredictionRequest = {
        sport,
        limit,
        userId,
      };

      const predictionData = await predictionService.getRealTimePredictions(request);

      setPredictions(predictionData);
      setLastUpdate(new Date());
      setApiHealthy(true);

      if (!sport && predictionData.length > 0) {
        setSport(predictionData[0].sport);
      }

      await refreshMeta();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load real-time predictions.';
      setError(message);
      setApiHealthy(false);
    } finally {
      setLoading(false);
    }
  }, [limit, refreshMeta, sport, userId]);

  const handleSubscriptionUpdate = useCallback(
    (nextPredictions: RealTimePrediction[]) => {
      setPredictions(nextPredictions);
      setLastUpdate(new Date());
      setApiHealthy(true);
      setError(null);

      if (!sport && nextPredictions.length > 0) {
        setSport(nextPredictions[0].sport);
      }

      void refreshMeta();
    },
    [refreshMeta, sport]
  );

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  useEffect(() => {
    if (autoRefreshMs <= 0) {
      return;
    }

    const unsubscribe = predictionService.subscribeToRealTimePredictions(handleSubscriptionUpdate, {
      request: {
        sport,
        limit,
        userId,
      },
      intervalMs: autoRefreshMs,
    });

    return () => {
      unsubscribe();
    };
  }, [autoRefreshMs, handleSubscriptionUpdate, limit, sport, userId]);

  useEffect(() => {
    personalizationService.initialize().catch(() => undefined);

    const handleProfileUpdated = () => {
      fetchPredictions();
    };

    personalizationService.on('profileUpdated', handleProfileUpdated);

    return () => {
      personalizationService.off('profileUpdated', handleProfileUpdated);
    };
  }, [fetchPredictions, personalizationService]);

  const renderPredictionCard = useCallback((prediction: RealTimePrediction) => {
    const confidenceColor = predictionService.getConfidenceColor(prediction.confidence_level);
    const recommendationColor = predictionService.getRecommendationColor(prediction.recommendation);

    return (
      <div
        key={prediction.prop_id}
        className='bg-white rounded-lg shadow-md p-6 border border-gray-200'
      >
        <div className='flex justify-between items-start mb-4'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>{prediction.player_name}</h3>
            <p className='text-sm text-gray-600'>
              {prediction.sport} - {prediction.league}
            </p>
          </div>
          <div className='text-right'>
            <div
              className='inline-block px-3 py-1 rounded-full text-white text-sm font-medium'
              style={{ backgroundColor: recommendationColor }}
            >
              {predictionService.formatRecommendation(prediction.recommendation)}
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              {formatRelativeTime(prediction.prediction_time)}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div>
            <p className='text-sm text-gray-600'>Stat Type</p>
            <p className='font-medium'>{prediction.stat_type}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Line</p>
            <p className='font-medium'>{safeNumber(prediction.line, 1)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Predicted Value</p>
            <p className='font-medium text-blue-600'>{safeNumber(prediction.predicted_value, 2)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Probability</p>
            <p className='font-medium'>{safeNumber(prediction.prediction_probability * 100, 1)}%</p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div>
            <p className='text-sm text-gray-600'>Confidence</p>
            <div className='flex items-center space-x-2'>
              <span
                className='w-3 h-3 rounded-full'
                style={{ backgroundColor: confidenceColor }}
              ></span>
              <span className='font-medium'>
                {predictionService.formatConfidenceLevel(prediction.confidence_level)}
              </span>
              <span className='text-sm text-gray-500'>
                ({safeNumber(prediction.confidence_score * 100, 1)}%)
              </span>
            </div>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Expected Value</p>
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

        <div className='mb-4'>
          <p className='text-sm text-gray-600 mb-1'>AI Reasoning</p>
          <p className='text-sm bg-gray-50 p-3 rounded'>{prediction.reasoning}</p>
        </div>

        {prediction.key_factors.length > 0 && (
          <div className='mb-4'>
            <p className='text-sm text-gray-600 mb-2'>Key Factors</p>
            <div className='flex flex-wrap gap-2'>
              {prediction.key_factors.map((factor, index) => (
                <span
                  key={index}
                  className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className='border-t pt-3'>
          <div className='grid grid-cols-2 gap-4 text-xs text-gray-500'>
            <div>
              <p>Primary Model: {prediction.primary_model}</p>
              <p>Model Agreement: {safeNumber(prediction.model_agreement * 100, 1)}%</p>
            </div>
            <div>
              <p>Game Time: {formatDateTime(prediction.game_time)}</p>
              <p>Data Freshness: {safeNumber(prediction.data_freshness, 1)}m</p>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <div className='mb-6'>
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Real-Time Predictions</h1>
            <p className='text-gray-600'>
              Live predictions from trained ML models - Phase 6 Integration
            </p>
          </div>
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

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow-sm p-4 border'>
            <div className='flex items-center space-x-2'>
              <span
                className={`w-3 h-3 rounded-full ${apiHealthy ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className='font-medium'>API Status</span>
            </div>
            <p className='text-sm text-gray-600 mt-1'>
              {apiHealthy ? 'Operational' : 'Unavailable'}
            </p>
          </div>

          {systemHealth && (
            <div className='bg-white rounded-lg shadow-sm p-4 border'>
              <div className='flex items-center space-x-2'>
                <span
                  className={`w-3 h-3 rounded-full ${
                    systemHealth.status === 'operational' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                ></span>
                <span className='font-medium'>System Health</span>
              </div>
              <p className='text-sm text-gray-600 mt-1'>
                {systemHealth.models_loaded} models loaded
              </p>
            </div>
          )}

          {stats && (
            <div className='bg-white rounded-lg shadow-sm p-4 border'>
              <div className='flex items-center space-x-2'>
                <span className='w-3 h-3 rounded-full bg-blue-500'></span>
                <span className='font-medium'>Statistics</span>
              </div>
              <p className='text-sm text-gray-600 mt-1'>
                {stats.total_predictions} predictions generated
              </p>
            </div>
          )}
        </div>

        {lastUpdate && (
          <p className='text-sm text-gray-500 mb-4'>Last updated: {lastUpdate.toLocaleString()}</p>
        )}
      </div>

      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
          <div className='flex items-center space-x-2'>
            <span className='w-5 h-5 text-red-500'>⚠️</span>
            <span className='font-medium text-red-800'>Error</span>
          </div>
          <p className='text-red-700 mt-1'>{error}</p>
          {!apiHealthy && (
            <div className='mt-3 text-sm text-red-600'>
              <p>To start the prediction API:</p>
              <code className='bg-red-100 px-2 py-1 rounded'>
                cd backend && python prediction_api.py
              </code>
            </div>
          )}
        </div>
      )}

      {loading && predictions.length === 0 && (
        <div className='text-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading real-time predictions...</p>
        </div>
      )}

      {!loading && predictions.length === 0 && !error && (
        <div className='text-center py-12'>
          <div className='text-4xl mb-4'>TARGET</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No Predictions Available</h3>
          <p className='text-gray-600 mb-4'>
            No real-time predictions are currently available. This could be due to:
          </p>
          <ul className='text-sm text-gray-500 text-left max-w-md mx-auto'>
            <li>- No current props from PrizePicks API</li>
            <li>- Models are still training</li>
            <li>- API rate limiting</li>
          </ul>
        </div>
      )}

      {predictions.length > 0 && (
        <div>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Live Predictions ({predictions.length})
            </h2>
            {(sport ?? predictions[0]?.sport) && (
              <span className='px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm'>
                {sport ?? predictions[0].sport}
              </span>
            )}
          </div>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {predictions.map(renderPredictionCard)}
          </div>
        </div>
      )}

      <div className='mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500'>
        <p>
          Real-time predictions powered by trained ML models - Zero mock data - Phase 6 Integration
          Testing
        </p>
      </div>
    </div>
  );
};

export default RealTimePredictions;
