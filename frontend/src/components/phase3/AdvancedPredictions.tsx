/**
 * Advanced Predictions Interface for Phase 3
 * Showcases unified prediction domain with SHAP explanations
 */

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { unifiedApiService, type PredictionRequest, type PredictionResponse } from '../../services/unifiedApiService';

export const AdvancedPredictions: React.FC = () => {
  const [predictionRequest, setPredictionRequest] = useState<PredictionRequest>({
    player_name: 'Aaron Judge',
    sport: 'mlb',
    prop_type: 'home_runs',
    line_score: 0.5
  });
  
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentPredictions, setRecentPredictions] = useState<PredictionResponse[]>([]);

  useEffect(() => {
    loadRecentPredictions();
  }, []);

  const loadRecentPredictions = async () => {
    try {
      const response = await unifiedApiService.getRecentPredictions({ limit: 3 });
      setRecentPredictions(response.predictions || []);
    } catch (error) {
      console.error('Failed to load recent predictions:', error);
    }
  };

  const handlePredictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await unifiedApiService.createPrediction(predictionRequest);
      setPrediction(result);
      await loadRecentPredictions();
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationStyle = (recommendation: string) => {
    if (recommendation.toLowerCase().includes('strong')) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    if (recommendation.toLowerCase().includes('moderate')) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Advanced ML Predictions</h1>
        <p className="text-purple-300 max-w-3xl mx-auto">
          Leverage our unified prediction domain with ensemble ML models, SHAP explainability, 
          and quantum-inspired optimization for superior betting insights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prediction Form */}
        <div className="lg:col-span-1">
          <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <SparklesIcon className="h-6 w-6 text-purple-400 mr-2" />
              Generate Prediction
            </h2>
            
            <form onSubmit={handlePredictionSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm mb-2">Player Name</label>
                <input
                  type="text"
                  value={predictionRequest.player_name}
                  onChange={(e) => setPredictionRequest({
                    ...predictionRequest,
                    player_name: e.target.value
                  })}
                  className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  placeholder="Enter player name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm mb-2">Sport</label>
                <select
                  value={predictionRequest.sport}
                  onChange={(e) => setPredictionRequest({
                    ...predictionRequest,
                    sport: e.target.value as 'mlb' | 'nba' | 'nfl' | 'nhl'
                  })}
                  className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="mlb">MLB</option>
                  <option value="nba">NBA</option>
                  <option value="nfl">NFL</option>
                  <option value="nhl">NHL</option>
                </select>
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm mb-2">Prop Type</label>
                <input
                  type="text"
                  value={predictionRequest.prop_type}
                  onChange={(e) => setPredictionRequest({
                    ...predictionRequest,
                    prop_type: e.target.value
                  })}
                  className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  placeholder="e.g., home_runs, points, passing_yards"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm mb-2">Line Score</label>
                <input
                  type="number"
                  step="0.1"
                  value={predictionRequest.line_score}
                  onChange={(e) => setPredictionRequest({
                    ...predictionRequest,
                    line_score: parseFloat(e.target.value) || 0
                  })}
                  className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-purple-300 text-sm mb-2">Opponent (Optional)</label>
                <input
                  type="text"
                  value={predictionRequest.opponent || ''}
                  onChange={(e) => setPredictionRequest({
                    ...predictionRequest,
                    opponent: e.target.value
                  })}
                  className="w-full p-3 bg-black/50 border border-purple-500/30 rounded-lg text-white placeholder-purple-400 focus:border-purple-400 focus:outline-none"
                  placeholder="Opponent team"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Generate Prediction
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Prediction Results */}
        <div className="lg:col-span-2">
          {prediction ? (
            <div className="space-y-6">
              {/* Main Prediction */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{prediction.player_name}</h3>
                    <p className="text-purple-300">
                      {prediction.prop_type} ({prediction.sport.toUpperCase()}) - Line: {prediction.line_score}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getConfidenceColor(prediction.prediction.confidence)}`}>
                      {(prediction.prediction.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-purple-300 text-sm">Confidence</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${
                      prediction.prediction.recommended_bet === 'over' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {prediction.prediction.recommended_bet.toUpperCase()}
                    </div>
                    <div className="text-purple-300 text-sm">Recommendation</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {(prediction.prediction.probability * 100).toFixed(1)}%
                    </div>
                    <div className="text-purple-300 text-sm">Probability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">
                      {(prediction.prediction.expected_value * 100).toFixed(1)}%
                    </div>
                    <div className="text-purple-300 text-sm">Expected Value</div>
                  </div>
                </div>

                <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getRecommendationStyle(prediction.betting_recommendation.recommendation)}`}>
                  <TrophyIcon className="h-4 w-4 mr-2" />
                  {prediction.betting_recommendation.recommendation}
                </div>
              </div>

              {/* SHAP Explanation */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <LightBulbIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  AI Explanation (SHAP Analysis)
                </h4>
                
                <div className="mb-4">
                  <p className="text-purple-300 leading-relaxed">
                    {prediction.explanation.reasoning}
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-white font-semibold">Key Factors:</h5>
                  {prediction.explanation.key_factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{factor.factor}</span>
                        <p className="text-purple-300 text-sm">{factor.value}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {(factor.impact * 100).toFixed(1)}%
                        </div>
                        <div className="text-purple-400 text-xs">Impact</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Betting Recommendation */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-400 mr-2" />
                  Betting Recommendation
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-purple-300 text-sm">Kelly %</div>
                    <div className="text-white font-bold">
                      {(prediction.betting_recommendation.kelly_percentage * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-sm">Unit Size</div>
                    <div className="text-white font-bold">
                      {prediction.betting_recommendation.suggested_unit_size}
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-sm">Expected ROI</div>
                    <div className="text-green-400 font-bold">
                      {prediction.betting_recommendation.expected_roi}
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-sm">Risk Level</div>
                    <div className={`font-bold capitalize ${
                      prediction.betting_recommendation.risk_level === 'low' ? 'text-green-400' :
                      prediction.betting_recommendation.risk_level === 'medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {prediction.betting_recommendation.risk_level}
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h4 className="text-lg font-bold text-white mb-4">Model Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-purple-300 text-sm">Model Type</div>
                    <div className="text-white font-medium capitalize">
                      {prediction.model_info.model_type}
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-sm">Version</div>
                    <div className="text-white font-medium">
                      {prediction.model_info.version}
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 text-sm">Accuracy</div>
                    <div className="text-green-400 font-bold">
                      {(prediction.model_info.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-12 text-center">
              <SparklesIcon className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Generate Your First Prediction</h3>
              <p className="text-purple-300">
                Use the form on the left to create an advanced ML prediction with SHAP explanations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Predictions */}
      {recentPredictions.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <ClockIcon className="h-6 w-6 text-purple-400 mr-2" />
            Recent Predictions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentPredictions.map((pred, index) => (
              <div key={index} className="bg-black/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">{pred.player_name}</h4>
                    <p className="text-purple-300 text-sm">
                      {pred.prop_type} ({pred.sport.toUpperCase()})
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${getConfidenceColor(pred.prediction.confidence)}`}>
                    {(pred.prediction.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${
                    pred.prediction.recommended_bet === 'over' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pred.prediction.recommended_bet.toUpperCase()}
                  </span>
                  <span className="text-purple-300 text-sm">
                    EV: {(pred.prediction.expected_value * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedPredictions;
