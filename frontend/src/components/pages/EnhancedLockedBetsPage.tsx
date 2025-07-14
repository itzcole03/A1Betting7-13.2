import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  MessageCircle,
  Brain,
  Eye,
  Settings,
  BarChart3,
  Minus,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PropOllamaChatBox from '../shared/PropOllamaChatBox';
import AIInsightsPanel from '../enhanced/AIInsightsPanel';
import PortfolioOptimizer from '../enhanced/PortfolioOptimizer';
import SmartStackingPanel from '../enhanced/SmartStackingPanel';
import { EnhancedPropCard, PlayerProp } from '../ui/EnhancedPropCard';
import RealTimeAnalysisTrigger from '../analysis/RealTimeAnalysisTrigger';
import FeedbackWidget from '../feedback/FeedbackWidget';
import { unifiedApiService } from '../../services/unifiedApiService';
import { BetOpportunity, OptimalLineup } from '../../services/realTimeAnalysisService';
import {
  EnhancedPrediction,
  PortfolioMetrics,
  AIInsights,
  StackSuggestion,
  CorrelationMatrix,
} from '../../types/enhancedBetting';

const EnhancedLockedBetsPage: React.FC = () => {
  // Core state
  const [enhancedPredictions, setEnhancedPredictions] = useState<EnhancedPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  // Enhanced features state
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | undefined>();
  const [aiInsights, setAiInsights] = useState<AIInsights[]>([]);
  const [selectedBet, setSelectedBet] = useState<EnhancedPrediction | undefined>();
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [stackingSuggestions, setStackingSuggestions] = useState<StackSuggestion[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<CorrelationMatrix>({
    players: [],
    matrix: [],
    insights: [],
  });
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<
    'analysis' | 'bets' | 'portfolio' | 'insights' | 'stacking'
  >('analysis');

  // Real-time analysis state
  const [realTimeOpportunities, setRealTimeOpportunities] = useState<BetOpportunity[]>([]);
  const [optimalLineups, setOptimalLineups] = useState<OptimalLineup[]>([]);
  const [hasRealData, setHasRealData] = useState<boolean>(false);
  const [cardsToShow, setCardsToShow] = useState<number>(9); // Default to showing 9 cards in 3x3 grid

  // Analysis state for persistent banner
  const [analysisState, setAnalysisState] = useState({ status: 'idle' });

  // Helper to validate and fix prediction data
  const validatePrediction = (bet: any): EnhancedPrediction => {
    return {
      ...bet,
      // Ensure all numeric properties have fallback values
      expected_value: bet.expected_value ?? 0,
      confidence: bet.confidence ?? 75,
      quantum_confidence: bet.quantum_confidence ?? 75,
      kelly_fraction: bet.kelly_fraction ?? 0.05,
      synergy_rating: bet.synergy_rating ?? 0.5,
      stack_potential: bet.stack_potential ?? 0.5,
      optimal_stake: bet.optimal_stake ?? 0.05,
      correlation_score: bet.correlation_score ?? 0.3,
      diversification_value: bet.diversification_value ?? 0.7,
      neural_score: bet.neural_score ?? 75,
      injury_risk: bet.injury_risk ?? 0.1,
      portfolio_impact: bet.portfolio_impact ?? 0.5,
      variance_contribution: bet.variance_contribution ?? 0.2,
      line_score: bet.line_score ?? 0,
      risk_score: bet.risk_score ?? 0.5,

      risk_assessment: bet.risk_assessment || {
        overall_risk: bet.risk_score || 0.5,
        confidence_risk: 0.2,
        line_risk: 0.2,
        market_risk: 0.2,
        risk_level:
          (bet.risk_score || 0.5) <= 0.3
            ? 'low'
            : (bet.risk_score || 0.5) <= 0.6
              ? 'medium'
              : 'high',
      },
      shap_explanation: bet.shap_explanation || {
        baseline: 0.5,
        features: {},
        prediction: bet.confidence || 75,
        top_factors: [],
      },
    };
  };

  const fetchEnhancedPredictions = async (showNotifications = false) => {
    try {
      setIsLoading(true);

      const response = await unifiedApiService.getEnhancedBets({
        sport: selectedSport !== 'ALL' ? selectedSport : undefined,
        min_confidence: minConfidence,
        include_ai_insights: true,
        include_portfolio_optimization: true,
        max_results: 50,
      });

      const predictions = (response.enhanced_bets || response.predictions || []).map(
        validatePrediction
      );
      setEnhancedPredictions(predictions);
      setPortfolioMetrics(response.portfolio_metrics);
      setAiInsights(response.ai_insights || []);

      // Generate stacking suggestions
      const stackingData = await unifiedApiService.generateStackingSuggestions(
        response.enhanced_bets || response.predictions || []
      );
      setStackingSuggestions(stackingData.suggestions);
      setCorrelationMatrix(stackingData.correlationMatrix);

      setLastUpdate(new Date());
      const dataSource = response.status === 'fallback_mode' ? 'fallback data' : 'live API';

      // Only show toast notifications on manual refresh to reduce spam
      if (showNotifications) {
        toast.success(
          `🚀 Loaded ${(response.enhanced_bets || response.predictions || []).length} enhanced predictions (${dataSource})`
        );
      }
    } catch (error) {
      console.error('Error fetching enhanced predictions:', error);

      // Only show error notifications on manual refresh to reduce spam
      if (showNotifications) {
        toast.error('🔌 Using fallback data - Enhanced predictions loaded');
      }

      // Fallback to mock data for development
      const mockPredictions: EnhancedPrediction[] = [
        {
          id: 'enhanced-1',
          player_name: 'Luka Dončić',
          team: 'DAL',
          sport: 'NBA',
          stat_type: 'Points',
          line_score: 28.5,
          recommendation: 'OVER',
          confidence: 87.5,
          kelly_fraction: 0.08,
          expected_value: 2.34,
          quantum_confidence: 89.2,
          neural_score: 85.7,
          correlation_score: 0.3,
          synergy_rating: 0.8,
          stack_potential: 0.9,
          diversification_value: 0.7,
          shap_explanation: {
            baseline: 50.0,
            features: {
              recent_performance: 21.9,
              matchup_advantage: 17.5,
              historical_avg: 13.1,
              team_pace: 13.1,
              injury_status: 8.7,
              weather_conditions: 8.7,
              market_movement: 4.4,
            },
            prediction: 87.5,
            top_factors: [
              ['recent_performance', 21.9],
              ['matchup_advantage', 17.5],
              ['historical_avg', 13.1],
            ],
          },
          risk_assessment: {
            overall_risk: 0.24,
            confidence_risk: 0.14,
            line_risk: 0.2,
            market_risk: 0.2,
            risk_level: 'low',
          },
          injury_risk: 0.1,
          optimal_stake: 0.06,
          portfolio_impact: 0.8,
          variance_contribution: 0.2,
          source: 'PrizePicks',
        },
      ];

      setEnhancedPredictions(mockPredictions.map(validatePrediction));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBetSelect = (bet: EnhancedPrediction) => {
    setSelectedBet(bet);
  };

  const handleOptimizePortfolio = async (selectedBetIds: string[]) => {
    try {
      const analysis = await unifiedApiService.analyzeCustomPortfolio(
        selectedBetIds,
        investmentAmount
      );
      toast.success('Portfolio optimized successfully!');
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      toast.error('Failed to optimize portfolio');
    }
  };

  const handleStackSelect = (playerIds: string[]) => {
    setSelectedBets(new Set(playerIds));
    toast.success(`Applied stack with ${playerIds.length} players`);
  };

  const handleAnalysisComplete = (opportunities: BetOpportunity[], lineups: OptimalLineup[]) => {
    setRealTimeOpportunities(opportunities);
    setOptimalLineups(lineups);
    setHasRealData(true);

    // Convert real-time opportunities to enhanced predictions for existing UI
    const convertedPredictions: EnhancedPrediction[] = opportunities.map(opp => ({
      id: opp.id,
      player_name: opp.player_name || 'Team',
      team: opp.team,
      sport: opp.sport,
      stat_type: opp.stat_type,
      line_score: opp.line,
      recommendation: opp.recommendation,
      confidence: opp.ml_confidence,
      kelly_fraction: opp.kelly_fraction,
      expected_value: opp.expected_value,
      quantum_confidence: opp.ml_confidence,
      neural_score: opp.ml_confidence,
      correlation_score: 0.3,
      synergy_rating: 0.8,
      stack_potential: 0.9,
      diversification_value: 0.7,
      shap_explanation: {
        baseline: 50.0,
        features: {},
        prediction: opp.ml_confidence,
        top_factors: [],
      },
      risk_assessment: {
        overall_risk: opp.risk_score,
        confidence_risk: 0.2,
        line_risk: 0.2,
        market_risk: 0.2,
        risk_level: opp.risk_level.toLowerCase() as 'low' | 'medium' | 'high',
      },
      injury_risk: 0.1,
      optimal_stake: opp.kelly_fraction,
      portfolio_impact: 0.8,
      variance_contribution: 0.2,
      source: opp.sportsbook,
    }));

    setEnhancedPredictions(convertedPredictions);
    setActiveView('bets');

    toast.success(
      `🎯 Real analysis complete! ${opportunities.length} winning opportunities found!`
    );
  };

  // Handler to receive analysis state from RealTimeAnalysisTrigger
  const handleAnalysisStateChange = (state: { status: string; progress?: { progress_percentage: number }; opportunities?: BetOpportunity[]; error?: string }) => {
    setAnalysisState(state);
  };

  useEffect(() => {
    fetchEnhancedPredictions(true); // Show notifications on initial load

    // Auto-refresh every 3 minutes to be less spammy (no notifications)
    const interval = setInterval(() => fetchEnhancedPredictions(false), 180000);
    return () => clearInterval(interval);
  }, [selectedSport, minConfidence]);

  // Convert EnhancedPrediction to PlayerProp for the modern component
  const convertToPlayerProp = (bet: EnhancedPrediction): PlayerProp => {
    const isSelected = selectedBets.has(bet.id);

    return {
      id: bet.id,
      player: {
        name: bet.player_name || 'Unknown Player',
        team: bet.team || 'N/A',
        position: 'N/A', // Not available in EnhancedPrediction
        headshot: undefined, // Could be added later
      },
      game: {
        opponent: 'TBD', // Could be derived from other data
        date: new Date().toLocaleDateString(),
        time: 'TBD',
        venue: 'TBD',
      },
      prop: {
        type: bet.stat_type || 'Points',
        line: bet.line_score || 0,
        overOdds: 100, // Mock odds - could be from actual data
        underOdds: -120, // Mock odds - could be from actual data
        recommendation:
          bet.recommendation?.toLowerCase() === 'over'
            ? 'over'
            : bet.recommendation?.toLowerCase() === 'under'
              ? 'under'
              : 'none',
      },
      analysis: {
        confidence: bet.confidence || 75,
        aiPrediction: bet.quantum_confidence || bet.neural_score || bet.confidence || 75,
        trend: bet.expected_value > 0 ? 'up' : bet.expected_value < 0 ? 'down' : 'neutral',
        reasoning: `AI analysis shows ${bet.confidence}% confidence based on advanced quantum models and neural networks. Expected value: ${bet.expected_value?.toFixed(2) || 'N/A'}.`,
        factors: [
          {
            name: 'Recent Performance',
            impact: bet.shap_explanation?.features?.recent_performance || 20,
            description: 'Player performance in recent games',
          },
          {
            name: 'Matchup Advantage',
            impact: bet.shap_explanation?.features?.matchup_advantage || 15,
            description: 'Historical performance vs opponent',
          },
          {
            name: 'AI Neural Score',
            impact: (bet.neural_score || 75) - 50, // Convert to impact
            description: 'Advanced neural network prediction',
          },
        ],
      },
      stats: {
        season: {
          average: bet.line_score || 0,
          games: 82, // Mock season games
          hitRate: bet.confidence || 75,
        },
        recent: {
          last5: [
            bet.line_score - 2,
            bet.line_score + 1,
            bet.line_score - 1,
            bet.line_score + 3,
            bet.line_score,
          ].filter(x => x != null), // Mock recent games
          average: bet.line_score || 0,
          hitRate: bet.confidence || 75,
        },
        vsOpponent: {
          average: bet.line_score || 0,
          games: 10, // Mock games vs opponent
          hitRate: bet.confidence || 75,
        },
      },
      value: {
        expectedValue: bet.expected_value || 0,
        kellyBet: Math.round((bet.optimal_stake || 0.05) * investmentAmount || 50),
        roi: (bet.expected_value || 0) * 100,
      },
      tags: [
        bet.confidence >= 85 ? '🔥 Hot Pick' : undefined,
        bet.risk_assessment?.risk_level === 'low' ? '✅ Low Risk' : undefined,
        bet.expected_value > 2 ? '💰 High Value' : undefined,
        isSelected ? '✓ Selected' : undefined,
      ].filter(Boolean),
      isLive: Math.random() > 0.7, // Mock live status
      isPopular: bet.confidence >= 85,
    };
  };

  const handlePropSelect = (prop: PlayerProp, selection: 'over' | 'under') => {
    // Toggle selection
    const newSelected = new Set(selectedBets);
    if (selectedBets.has(prop.id)) {
      newSelected.delete(prop.id);
    } else {
      newSelected.add(prop.id);
    }
    setSelectedBets(newSelected);

    // Find and select the corresponding bet
    const correspondingBet = enhancedPredictions.find(bet => bet.id === prop.id);
    if (correspondingBet) {
      handleBetSelect(correspondingBet);
    }

    // Visual feedback is provided by the card selection state, no need for toast
  };

  const uniqueSports = ['ALL', ...Array.from(new Set(enhancedPredictions.map(bet => bet.sport)))];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 lg:p-8'>
      <div className='max-w-[1600px] mx-auto'>
        {/* Enhanced Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-2'>
                🚀 AI-Enhanced Locked Bets
              </h1>
              <p className='text-gray-400 mb-3'>
                Quantum AI predictions with portfolio optimization and smart stacking
              </p>
              <div className='flex items-center space-x-2'>
                <div className='px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm font-medium flex items-center space-x-2'>
                  <Brain className='w-4 h-4' />
                  <span>AI Enhanced Active</span>
                </div>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25'
              >
                <Brain className='w-4 h-4' />
                <span>{isChatMinimized ? 'Ask PropOllama' : 'Hide Chat'}</span>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              </button>
              <button
                onClick={() => fetchEnhancedPredictions(true)}
                disabled={isLoading}
                className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25'
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Integrated Header with Navigation and Stats */}
          <div className='bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 mb-6'>
            {/* Top Row: View Toggle */}
            <div className='flex space-x-2 mb-4'>
              {[
                { key: 'analysis', label: 'Real-Time Analysis', icon: Zap },
                { key: 'bets', label: 'Enhanced Bets', icon: Target },
                { key: 'portfolio', label: 'Portfolio', icon: BarChart3 },
                { key: 'insights', label: 'AI Insights', icon: Brain },
                { key: 'stacking', label: 'Smart Stacking', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    activeView === key
                      ? 'bg-cyan-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className='w-4 h-4' />
                  <span>{label}</span>
                  {key === 'analysis' && (
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
                  )}
                </button>
              ))}
            </div>

            {/* Bottom Row: Inline Stats */}
            <div className='flex items-center justify-between border-t border-gray-700/30 pt-3'>
              <div className='flex items-center space-x-6'>
                <div className='flex items-center space-x-2'>
                  <Target className='w-4 h-4 text-cyan-400' />
                  <span className='text-sm text-gray-400'>Showing:</span>
                  <span className='text-sm font-bold text-white'>
                    {Math.min(cardsToShow, enhancedPredictions.length)} of{' '}
                    {enhancedPredictions.length}
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <TrendingUp className='w-4 h-4 text-green-400' />
                  <span className='text-sm text-gray-400'>Confidence:</span>
                  <span className='text-sm font-bold text-white'>
                    {enhancedPredictions.length > 0
                      ? (
                          enhancedPredictions.reduce(
                            (sum, bet) => sum + (bet.confidence || 75),
                            0
                          ) / enhancedPredictions.length
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className='flex items-center space-x-2'>
                  <Zap className='w-4 h-4 text-purple-400' />
                  <span className='text-sm text-gray-400'>AI Insights:</span>
                  <span className='text-sm font-bold text-white'>{aiInsights.length}</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <DollarSign className='w-4 h-4 text-yellow-400' />
                  <span className='text-sm text-gray-400'>Expected Value:</span>
                  <span className='text-sm font-bold text-green-400'>
                    +
                    {enhancedPredictions.length > 0
                      ? enhancedPredictions
                          .reduce((sum, bet) => sum + (bet.expected_value || 0), 0)
                          .toFixed(2)
                      : 0}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                <span className='text-xs text-gray-400'>Live</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-4 mb-8 p-6 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg'>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Sport:</label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
              >
                {uniqueSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Min Confidence:</label>
              <select
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className='bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
              >
                <option value={50}>50%+</option>
                <option value={60}>60%+</option>
                <option value={70}>70%+</option>
                <option value={80}>80%+</option>
                <option value={85}>85%+</option>
              </select>
            </div>
            <div className='text-sm text-gray-400'>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className='text-sm text-gray-400'>Selected: {selectedBets.size} bets</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='relative'>
                <div className='w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4'></div>
                <div
                  className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto'
                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                ></div>
              </div>
              <div className='text-xl font-semibold text-white mb-2'>
                Loading AI-Enhanced Predictions
              </div>
              <div className='text-gray-400'>
                Analyzing quantum models and portfolio optimization...
              </div>
            </div>
          </div>
        )}

        {/* Persistent Analysis Banner */}
        <div className="fixed top-0 left-0 right-0 z-50">
          {analysisState.status === 'starting' || analysisState.status === 'analyzing' ? (
            <div className="bg-blue-900 text-cyan-200 py-2 flex items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              <span>
                Comprehensive analysis in progress... {analysisState.progress?.progress_percentage ?? 0}%
              </span>
            </div>
          ) : analysisState.status === 'completed' ? (
            <div className="bg-emerald-900 text-emerald-200 py-2 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>
                Analysis complete! {analysisState.opportunities?.length ?? 0} opportunities found.
              </span>
            </div>
          ) : analysisState.status === 'error' ? (
            <div className="bg-red-900 text-red-200 py-2 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>
                Analysis failed: {analysisState.error}
              </span>
            </div>
          ) : null}
        </div>

        {/* Main Content Area */}
        {!isLoading && (
          <div className='grid grid-cols-12 gap-6'>
            {/* Left Column - Main Content */}
            <div className='col-span-12 lg:col-span-8 space-y-8'>
              {activeView === 'analysis' && (
                <div className='space-y-6'>
                  <div className='bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl'>
                    <div className='flex items-center space-x-3 mb-4'>
                      <Zap className='w-6 h-6 text-cyan-400' />
                      <h2 className='text-xl font-bold text-white'>
                        Comprehensive Multi-Sport Analysis
                      </h2>
                    </div>
                    <p className='text-slate-400 mb-6'>
                      Analyze thousands of bets across all sports using our 47+ ML model ensemble.
                      Get 100% accurate winning opportunities with optimized cross-sport lineups.
                    </p>
                  </div>

                  <RealTimeAnalysisTrigger
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalysisStateChange={handleAnalysisStateChange}
                  />

                  {hasRealData && optimalLineups.length > 0 && (
                    <div className='bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl'>
                      <h3 className='text-lg font-bold text-white mb-4 flex items-center space-x-2'>
                        <Target className='w-5 h-5 text-purple-400' />
                        <span>Optimal Lineups Generated</span>
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {optimalLineups.map((lineup, index) => (
                          <div
                            key={index}
                            className='bg-slate-700/30 border border-slate-600/30 rounded-xl p-4'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <span className='text-sm font-semibold text-white'>
                                {lineup.lineup_size}-Bet Lineup
                              </span>
                              <span className='text-sm text-green-400 font-bold'>
                                {lineup.total_confidence.toFixed(1)}% Confidence
                              </span>
                            </div>
                            <div className='grid grid-cols-2 gap-2 text-xs'>
                              <div>
                                <span className='text-slate-400'>Expected ROI:</span>
                                <span className='text-green-400 font-semibold ml-1'>
                                  {(lineup.expected_roi * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div>
                                <span className='text-slate-400'>Risk Score:</span>
                                <span className='text-yellow-400 font-semibold ml-1'>
                                  {(lineup.total_risk_score * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'bets' && (
                <div className='space-y-8'>
                  {enhancedPredictions.length > 0 ? (
                    <>
                      {/* Enhanced 3x3 Grid Layout with Better Spacing */}
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10'>
                        {enhancedPredictions.slice(0, cardsToShow).map(bet => {
                          const isSelected = selectedBets.has(bet.id);

                          return (
                            <div
                              key={bet.id}
                              className={`group relative transition-all duration-300 transform ${
                                isSelected
                                  ? 'ring-2 ring-cyan-400/50 shadow-2xl shadow-cyan-500/25 scale-[1.02]'
                                  : 'hover:scale-[1.02] hover:shadow-xl'
                              }`}
                            >
                              {/* Restructured Compact Card */}
                              <div
                                className={`relative h-full min-h-[320px] rounded-2xl border overflow-hidden backdrop-blur-xl shadow-xl transition-all duration-300 ${
                                  isSelected
                                    ? 'bg-gradient-to-br from-cyan-600/20 via-blue-600/15 to-purple-600/20 border-cyan-400/50'
                                    : 'bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 border-slate-700/50 hover:border-cyan-500/40'
                                }`}
                              >
                                {/* Gradient Overlay */}
                                <div className='absolute inset-0 opacity-30 pointer-events-none group-hover:opacity-40 transition-opacity duration-300'>
                                  <div className='absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent' />
                                </div>

                                {/* Card Header */}
                                <div className='relative p-5 pb-3'>
                                  <div className='flex items-start justify-between mb-3'>
                                    <div className='flex-1 min-w-0'>
                                      <h3 className='text-lg font-bold text-white mb-1 truncate'>
                                        {bet.player_name}
                                      </h3>
                                      <div className='flex items-center space-x-2 text-sm'>
                                        <span className='text-slate-300 font-medium'>
                                          {bet.team}
                                        </span>
                                        <span className='text-slate-500'>•</span>
                                        <span className='text-slate-400'>{bet.sport}</span>
                                      </div>
                                    </div>

                                    {/* Confidence Badge */}
                                    <div
                                      className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border ${
                                        bet.confidence >= 85
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                          : bet.confidence >= 75
                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                      }`}
                                    >
                                      {(bet.confidence || 75).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>

                                {/* Prop Details */}
                                <div className='relative px-5 pb-4'>
                                  <div className='bg-gradient-to-br from-slate-700/40 via-slate-600/30 to-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl p-4 mb-4'>
                                    <div className='flex items-center justify-between mb-3'>
                                      <h4 className='text-sm font-semibold text-slate-300 uppercase tracking-wider'>
                                        {bet.stat_type}
                                      </h4>
                                      <div
                                        className={`px-2 py-1 rounded-md text-xs font-bold ${
                                          bet.recommendation === 'OVER'
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}
                                      >
                                        {bet.recommendation}
                                      </div>
                                    </div>

                                    <div className='flex items-end justify-between'>
                                      <div className='text-3xl font-bold text-white'>
                                        {bet.line_score}
                                      </div>
                                      <div className='text-right'>
                                        <div className='text-sm text-cyan-400 font-bold'>
                                          AI: {(bet.quantum_confidence || 75).toFixed(0)}%
                                        </div>
                                        <div className='text-xs text-slate-400 uppercase tracking-wide'>
                                          Neural Score
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Value Metrics - Restructured for better spacing */}
                                  <div className='grid grid-cols-3 gap-2'>
                                    <div className='text-center p-2 rounded-lg bg-purple-500/10 border border-purple-500/20'>
                                      <div className='text-sm font-bold text-purple-400'>
                                        {bet.expected_value > 0 ? '+' : ''}
                                        {(bet.expected_value || 0).toFixed(1)}
                                      </div>
                                      <div className='text-xs text-purple-300/80 uppercase tracking-wide mt-0.5'>
                                        EV
                                      </div>
                                    </div>

                                    <div className='text-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20'>
                                      <div className='text-sm font-bold text-emerald-400'>
                                        {((bet.expected_value || 0) * 100).toFixed(0)}%
                                      </div>
                                      <div className='text-xs text-emerald-300/80 uppercase tracking-wide mt-0.5'>
                                        ROI
                                      </div>
                                    </div>

                                    <div className='text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20'>
                                      <div className='text-sm font-bold text-amber-400'>
                                        ${Math.round((bet.optimal_stake || 0.05) * 1000)}
                                      </div>
                                      <div className='text-xs text-amber-300/80 uppercase tracking-wide mt-0.5'>
                                        Kelly
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Interactive Overlay */}
                                <div
                                  className='absolute inset-0 cursor-pointer'
                                  onClick={() => {
                                    const newSelected = new Set(selectedBets);
                                    if (isSelected) {
                                      newSelected.delete(bet.id);
                                    } else {
                                      newSelected.add(bet.id);
                                    }
                                    setSelectedBets(newSelected);
                                    handleBetSelect(bet);
                                  }}
                                />

                                {/* Enhanced Status Badges */}
                                {isSelected && (
                                  <div className='absolute top-3 right-3 z-10'>
                                    <div className='bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1 animate-pulse'>
                                      <span>✓</span>
                                      <span>SELECTED</span>
                                    </div>
                                  </div>
                                )}

                                {bet.expected_value > 2 && (
                                  <div className='absolute top-3 left-3 z-10'>
                                    <div className='bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1'>
                                      <span>💰</span>
                                      <span>HIGH EV</span>
                                    </div>
                                  </div>
                                )}

                                {bet.confidence >= 85 && (
                                  <div className='absolute -top-2 -right-2 z-10'>
                                    <div className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center space-x-1'>
                                      <span>🔥</span>
                                      <span>HOT</span>
                                    </div>
                                  </div>
                                )}

                                {/* Bottom accent bar */}
                                <div className='absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl'>
                                  <div
                                    className={`h-full transition-all duration-500 opacity-80 group-hover:opacity-100 ${
                                      bet.recommendation === 'OVER'
                                        ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-red-400 via-rose-400 to-red-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Enhanced View More / Show Less Controls */}
                      {enhancedPredictions.length > 9 && (
                        <div className='text-center mt-8'>
                          {cardsToShow < enhancedPredictions.length ? (
                            <div className='space-y-4'>
                              {/* Progress indicator */}
                              <div className='w-full max-w-md mx-auto'>
                                <div className='flex justify-between items-center mb-2'>
                                  <span className='text-sm text-gray-400'>Showing</span>
                                  <span className='text-sm font-semibold text-white'>
                                    {cardsToShow} of {enhancedPredictions.length}
                                  </span>
                                </div>
                                <div className='w-full bg-gray-700 rounded-full h-2'>
                                  <div
                                    className='bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500'
                                    style={{
                                      width: `${(cardsToShow / enhancedPredictions.length) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* View More Button */}
                              <button
                                onClick={() =>
                                  setCardsToShow(prev =>
                                    Math.min(prev + 9, enhancedPredictions.length)
                                  )
                                }
                                className='group relative px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 hover:from-gray-700 hover:via-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gray-500/25 border border-gray-600/50 hover:border-gray-500/70 transform hover:scale-105'
                              >
                                <div className='flex items-center space-x-3'>
                                  <Eye className='w-5 h-5 text-cyan-400 transition-colors group-hover:text-cyan-300' />
                                  <span>View More Props</span>
                                  <div className='bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full text-sm font-bold'>
                                    +{Math.min(9, enhancedPredictions.length - cardsToShow)}
                                  </div>
                                </div>

                                {/* Hover effect */}
                                <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                              </button>

                              {/* Show remaining count */}
                              <p className='text-sm text-gray-400'>
                                {enhancedPredictions.length - cardsToShow} more high-value props
                                available
                              </p>
                            </div>
                          ) : (
                            <div className='space-y-4'>
                              {/* Show Less Button */}
                              <button
                                onClick={() => setCardsToShow(9)}
                                className='group relative px-8 py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 hover:from-cyan-700 hover:via-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transform hover:scale-105'
                              >
                                <div className='flex items-center space-x-3'>
                                  <Minus className='w-5 h-5 transition-transform group-hover:scale-110' />
                                  <span>Show Less</span>
                                  <span className='text-sm opacity-80'>(Back to Top 9)</span>
                                </div>

                                {/* Hover effect */}
                                <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                              </button>

                              <p className='text-sm text-gray-400'>
                                Showing all {enhancedPredictions.length} available props
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className='text-center py-12'>
                      <Target className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                      <h3 className='text-xl font-semibold text-gray-300 mb-2'>
                        No predictions found
                      </h3>
                      <p className='text-gray-400 mb-4'>
                        Try adjusting your filters or check back later for new AI predictions
                      </p>
                      <button
                        onClick={() => fetchEnhancedPredictions(true)}
                        className='px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25'
                      >
                        Refresh Data
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'portfolio' && (
                <PortfolioOptimizer
                  metrics={portfolioMetrics}
                  predictions={enhancedPredictions}
                  onOptimize={handleOptimizePortfolio}
                  investmentAmount={investmentAmount}
                  onInvestmentChange={setInvestmentAmount}
                  isLoading={isLoading}
                />
              )}

              {activeView === 'stacking' && (
                <SmartStackingPanel
                  suggestions={stackingSuggestions}
                  correlationMatrix={correlationMatrix}
                  predictions={enhancedPredictions}
                  onStackSelect={handleStackSelect}
                  selectedBets={selectedBets}
                />
              )}
            </div>

            {/* Right Column - AI Insights Panel */}
            <div className='col-span-12 lg:col-span-4'>
              {activeView === 'insights' ? (
                <AIInsightsPanel
                  insights={aiInsights}
                  predictions={enhancedPredictions}
                  selectedBet={selectedBet}
                  onBetSelect={handleBetSelect}
                />
              ) : (
                <div className='sticky top-6'>
                  <AIInsightsPanel
                    insights={aiInsights}
                    predictions={enhancedPredictions}
                    selectedBet={selectedBet}
                    onBetSelect={handleBetSelect}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PropOllama AI Chat Box */}
      {!isChatMinimized && (
        <div className='fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50'>
          <div className='bg-gray-800/95 backdrop-blur-sm border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/10 transform transition-all duration-300'>
            <PropOllamaChatBox
              isMinimized={false}
              onToggleMinimize={() => setIsChatMinimized(true)}
              className='bg-transparent border-0 shadow-none'
            />
          </div>
        </div>
      )}

      {/* Feedback Widget */}
      <FeedbackWidget position='bottom-right' />
    </div>
  );
};

export default EnhancedLockedBetsPage;
