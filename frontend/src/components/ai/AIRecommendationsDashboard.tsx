/**
 * AI Recommendations Dashboard - Smart betting insights with ML-powered recommendations
 * Provides personalized prop recommendations with confidence intervals and detailed analysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  Zap,
  Eye,
  Settings,
  Bookmark,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw,
  Filter,
  Star,
  Shield,
  Activity
} from 'lucide-react';

interface SmartRecommendation {
  id: string;
  prop_id: string;
  player_name: string;
  stat_type: string;
  line: number;
  recommended_side: string;
  ai_score: number;
  confidence_interval: [number, number];
  reasoning: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  expected_value: number;
  recommendation_type: string;
  sportsbook: string;
  odds: number;
  implied_probability: number;
  fair_probability: number;
  edge_percentage: number;
  market_efficiency: number;
  kelly_fraction: number;
  created_at: string;
  expires_at: string;
}

interface UserProfile {
  user_id: string;
  risk_tolerance: number;
  bankroll_size: number;
  preferred_sports: string[];
  kelly_multiplier: number;
  max_bet_percentage: number;
}

interface RecommendationFilters {
  sport: string;
  min_edge: number;
  max_risk_level: string;
  min_ai_score: number;
  max_recommendations: number;
}

const DEFAULT_PROFILE: UserProfile = {
  user_id: 'demo_user',
  risk_tolerance: 0.5,
  bankroll_size: 1000,
  preferred_sports: ['MLB'],
  kelly_multiplier: 0.25,
  max_bet_percentage: 0.05
};

const DEFAULT_FILTERS: RecommendationFilters = {
  sport: 'MLB',
  min_edge: 2.0,
  max_risk_level: 'MEDIUM',
  min_ai_score: 75,
  max_recommendations: 10
};

export const AIRecommendationsDashboard: React.FC = () => {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [filters, setFilters] = useState<RecommendationFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<SmartRecommendation | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch AI recommendations
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[AIRecommendations] Fetching AI recommendations...');
      
      const response = await fetch('/v1/ai-recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_profile: userProfile,
          filters: filters
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        setLastUpdated(new Date());
        console.log('[AIRecommendations] Successfully loaded', data.recommendations?.length, 'recommendations');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[AIRecommendations] API fetch failed:', err);
      setError('Failed to load AI recommendations. Using demo data.');
      
      // Fallback to mock data
      setRecommendations(generateMockRecommendations());
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, [userProfile, filters]);

  // Load recommendations on mount and filter changes
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchRecommendations, 300000);
    return () => clearInterval(interval);
  }, [fetchRecommendations]);

  // Generate mock recommendations for demo
  const generateMockRecommendations = (): SmartRecommendation[] => {
    const players = ['Aaron Judge', 'Mookie Betts', 'Ronald Acuna Jr.', 'Juan Soto', 'Freddie Freeman'];
    const statTypes = ['hits', 'total_bases', 'runs_scored', 'rbis', 'home_runs'];
    const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];
    const sides = ['over', 'under'];
    const riskLevels: Array<'LOW' | 'MEDIUM' | 'HIGH'> = ['LOW', 'MEDIUM', 'HIGH'];

    return Array.from({ length: 8 }, (_, i) => ({
      id: `ai_rec_${i}`,
      prop_id: `${players[i % players.length]}_${statTypes[i % statTypes.length]}`,
      player_name: players[i % players.length],
      stat_type: statTypes[i % statTypes.length],
      line: 1.5 + (i * 0.3),
      recommended_side: sides[i % sides.length],
      ai_score: 75 + Math.random() * 20,
      confidence_interval: [0.45 + Math.random() * 0.1, 0.55 + Math.random() * 0.1] as [number, number],
      reasoning: `AI model identifies strong value based on recent performance trends and matchup analysis. Player showing ${Math.floor(10 + Math.random() * 20)}% improvement over last 10 games.`,
      risk_level: riskLevels[i % riskLevels.length],
      expected_value: 0.05 + Math.random() * 0.15,
      recommendation_type: 'value_bet',
      sportsbook: books[i % books.length],
      odds: -110 + Math.floor(Math.random() * 40),
      implied_probability: 0.48 + Math.random() * 0.08,
      fair_probability: 0.52 + Math.random() * 0.1,
      edge_percentage: 2 + Math.random() * 6,
      market_efficiency: 0.7 + Math.random() * 0.25,
      kelly_fraction: 0.01 + Math.random() * 0.03,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }));
  };

  // Get risk level styling
  const getRiskLevelStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'EXTREME':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get recommendation type icon
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'arbitrage':
        return <Target className="w-4 h-4" />;
      case 'value_bet':
        return <TrendingUp className="w-4 h-4" />;
      case 'trend_play':
        return <Activity className="w-4 h-4" />;
      case 'model_edge':
        return <Brain className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-blue-400" />
                AI Betting Recommendations
              </h1>
              <p className="text-slate-300">
                Smart prop recommendations powered by advanced ML models and real-time market analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={fetchRecommendations}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center justify-between bg-slate-800/50 backdrop-blur rounded-lg p-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-slate-400">Active Recommendations:</span>
                <span className="text-white font-semibold ml-2">{recommendations.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Avg AI Score:</span>
                <span className="text-white font-semibold ml-2">
                  {recommendations.length > 0 
                    ? (recommendations.reduce((sum, rec) => sum + rec.ai_score, 0) / recommendations.length).toFixed(1)
                    : '0.0'
                  }
                </span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400">Avg Edge:</span>
                <span className="text-white font-semibold ml-2">
                  {recommendations.length > 0 
                    ? (recommendations.reduce((sum, rec) => sum + rec.edge_percentage, 0) / recommendations.length).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
              {lastUpdated && (
                <div className="text-sm">
                  <span className="text-slate-400">Last Updated:</span>
                  <span className="text-white font-semibold ml-2">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-slate-300">AI Models Active</span>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">AI Recommendation Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Minimum Edge */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum Edge: {filters.min_edge}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={filters.min_edge}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_edge: parseFloat(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* AI Score Threshold */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Min AI Score: {filters.min_ai_score}
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={filters.min_ai_score}
                  onChange={(e) => setFilters(prev => ({ ...prev, min_ai_score: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max Risk Level</label>
                <select
                  value={filters.max_risk_level}
                  onChange={(e) => setFilters(prev => ({ ...prev, max_risk_level: e.target.value }))}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                  <option value="EXTREME">Extreme Risk</option>
                </select>
              </div>

              {/* Max Results */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Results: {filters.max_recommendations}
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="5"
                  value={filters.max_recommendations}
                  onChange={(e) => setFilters(prev => ({ ...prev, max_recommendations: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded mb-3"></div>
                  <div className="h-6 bg-slate-700 rounded mb-4"></div>
                  <div className="h-3 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-700 rounded flex-1"></div>
                    <div className="h-8 bg-slate-700 rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))
          ) : recommendations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 text-lg">No AI recommendations match your current criteria</p>
              <p className="text-sm text-slate-500 mt-2">Try adjusting your filters to see more opportunities</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {rec.player_name}
                    </h3>
                    <p className="text-slate-300 text-sm">
                      {rec.stat_type.replace('_', ' ').toUpperCase()} {rec.recommended_side.toUpperCase()} {rec.line}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelStyle(rec.risk_level)}`}>
                      {rec.risk_level}
                    </div>
                    <div className="text-xs text-slate-400">
                      {getRecommendationIcon(rec.recommendation_type)}
                    </div>
                  </div>
                </div>

                {/* AI Score & Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{rec.ai_score.toFixed(0)}</div>
                    <div className="text-xs text-slate-400">AI Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{rec.edge_percentage.toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">Edge</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{(rec.expected_value * 100).toFixed(1)}%</div>
                    <div className="text-xs text-slate-400">EV</div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="mb-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {rec.reasoning}
                  </p>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span>{rec.sportsbook}</span>
                  <span>{rec.odds > 0 ? '+' : ''}{rec.odds}</span>
                  <span>Kelly: {(rec.kelly_fraction * 100).toFixed(1)}%</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRecommendation(rec)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recommendation Detail Modal */}
        {selectedRecommendation && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={() => setSelectedRecommendation(null)}></div>
              
              <div className="inline-block align-bottom bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      {selectedRecommendation.player_name} - Detailed Analysis
                    </h3>
                    <button
                      onClick={() => setSelectedRecommendation(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-800 px-6 py-4 space-y-4">
                  {/* Confidence Interval */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Confidence Interval</h4>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Lower Bound:</span>
                        <span className="text-white">{(selectedRecommendation.confidence_interval[0] * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Upper Bound:</span>
                        <span className="text-white">{(selectedRecommendation.confidence_interval[1] * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Market Analysis</h4>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Fair Probability:</span>
                          <span className="text-white ml-2">{(selectedRecommendation.fair_probability * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Implied Probability:</span>
                          <span className="text-white ml-2">{(selectedRecommendation.implied_probability * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Market Efficiency:</span>
                          <span className="text-white ml-2">{(selectedRecommendation.market_efficiency * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Recommended Bet:</span>
                          <span className="text-white ml-2">{(selectedRecommendation.kelly_fraction * userProfile.bankroll_size).toFixed(0)} units</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Timing</h4>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">Expires:</span>
                        <span className="text-white">{new Date(selectedRecommendation.expires_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendationsDashboard;
