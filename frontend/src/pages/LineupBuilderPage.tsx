import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  BarChart3,
  AlertTriangle,
  Calculator,
  Brain,
  Plus,
  X,
  Shield,
} from 'lucide-react';

// Types for parlay analytics
interface ParlayLeg {
  player: string;
  market: string;
  odds: number;
  ourFairOdds: number;
  team?: string;
  statType?: string;
}

interface CorrelationWarning {
  level: 'none' | 'low' | 'medium' | 'high' | 'extreme';
  message: string;
  affectedLegs: number[];
  riskFactor: number;
}

interface IndividualLegAnalysis {
  legIndex: number;
  player: string;
  market: string;
  odds: number;
  impliedProbability: number;
  fairProbability: number;
  individualEv: number;
}

interface ParlayAnalytics {
  totalPayout: number;
  impliedProbability: number;
  fairProbability: number;
  expectedValuePercent: number;
  rawExpectedValuePercent: number;
  correlationWarnings: CorrelationWarning[];
  riskAssessment: string;
  individualLegAnalysis: IndividualLegAnalysis[];
  numberOfLegs: number;
  correlationAdjustmentFactor: number;
}

const LineupBuilderPage: React.FC = () => {
  // Parlay state
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [parlayAnalytics, setParlayAnalytics] = useState<ParlayAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'parlay' | 'fantasy'>('parlay');

  // Form state for adding new legs
  const [newLeg, setNewLeg] = useState<Partial<ParlayLeg>>({
    player: '',
    market: '',
    odds: undefined,
    ourFairOdds: undefined,
    team: '',
  });

  // Sample markets for dropdown
  const popularMarkets = [
    'Points',
    'Rebounds',
    'Assists',
    'Three Pointers Made',
    'Field Goals Made',
    'Free Throws Made',
    'Steals',
    'Blocks',
    'Turnovers',
    'Minutes Played',
    'Double Double',
    'Triple Double',
  ];

  const addParlayLeg = () => {
    if (!newLeg.player || !newLeg.market || !newLeg.odds || !newLeg.ourFairOdds) {
      return;
    }

    const leg: ParlayLeg = {
      player: newLeg.player,
      market: newLeg.market,
      odds: newLeg.odds,
      ourFairOdds: newLeg.ourFairOdds,
      team: newLeg.team || undefined,
      statType: newLeg.market,
    };

    setParlayLegs([...parlayLegs, leg]);
    setNewLeg({
      player: '',
      market: '',
      odds: undefined,
      ourFairOdds: undefined,
      team: '',
    });
  };

  const removeParlayLeg = (index: number) => {
    setParlayLegs(parlayLegs.filter((_, i) => i !== index));
  };

  const analyzeParlayAsync = useCallback(async () => {
    if (parlayLegs.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/parlay/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          legs: parlayLegs.map(leg => ({
            player: leg.player,
            market: leg.market,
            odds: leg.odds,
            our_fair_odds: leg.ourFairOdds,
            team: leg.team,
            stat_type: leg.statType,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.message || 'Analysis failed');
      }

      setParlayAnalytics(result.data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  }, [parlayLegs]);

  const formatOdds = (odds: number) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const formatProbability = (probability: number) => {
    return `${(probability * 100).toFixed(1)}%`;
  };

  const getCorrelationColor = (level: string) => {
    switch (level) {
      case 'extreme':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/50';
    }
  };

  const getEVColor = (ev: number) => {
    if (ev > 5) return 'text-green-400';
    if (ev > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    if (risk.includes('HIGH')) return 'text-red-400';
    if (risk.includes('MEDIUM')) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Auto-analyze when legs change
  useEffect(() => {
    if (parlayLegs.length > 0) {
      const timeoutId = setTimeout(() => {
        analyzeParlayAsync();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setParlayAnalytics(null);
    }
  }, [parlayLegs, analyzeParlayAsync]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Lineup Builder</h1>
              <p className="text-gray-400 mt-1">
                Enhanced Parlay Analytics & Daily Fantasy Optimization
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setActiveView('parlay')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === 'parlay'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calculator className="w-4 h-4 inline mr-2" />
                Parlay Analytics
              </button>
              <button
                onClick={() => setActiveView('fantasy')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === 'fantasy'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Daily Fantasy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'parlay' ? (
          <div className="space-y-8">
            {/* Parlay Builder Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Parlay Builder</h2>
                  <p className="text-gray-400 text-sm">
                    Add legs and analyze correlations, EV, and risk
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Legs:</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">
                    {parlayLegs.length}
                  </span>
                </div>
              </div>

              {/* Add New Leg Form */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={newLeg.player || ''}
                    onChange={(e) => setNewLeg({ ...newLeg, player: e.target.value })}
                    placeholder="e.g. LeBron James"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Market
                  </label>
                  <select
                    value={newLeg.market || ''}
                    onChange={(e) => setNewLeg({ ...newLeg, market: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Select Market</option>
                    {popularMarkets.map((market) => (
                      <option key={market} value={market}>
                        {market}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Market Odds
                  </label>
                  <input
                    type="number"
                    value={newLeg.odds || ''}
                    onChange={(e) => setNewLeg({ ...newLeg, odds: parseInt(e.target.value) })}
                    placeholder="-110"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Fair Odds
                  </label>
                  <input
                    type="number"
                    value={newLeg.ourFairOdds || ''}
                    onChange={(e) => setNewLeg({ ...newLeg, ourFairOdds: parseInt(e.target.value) })}
                    placeholder="-105"
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={addParlayLeg}
                    disabled={!newLeg.player || !newLeg.market || !newLeg.odds || !newLeg.ourFairOdds}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Leg</span>
                  </button>
                </div>
              </div>

              {/* Current Parlay Legs */}
              {parlayLegs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Current Parlay</h3>
                  {parlayLegs.map((leg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-sm font-medium text-white">
                          {index + 1}.
                        </div>
                        <div>
                          <div className="font-medium text-white">{leg.player}</div>
                          <div className="text-sm text-gray-400">{leg.market}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-white">
                            Market: <span className="font-mono">{formatOdds(leg.odds)}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            Fair: <span className="font-mono">{formatOdds(leg.ourFairOdds)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeParlayLeg(index)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Analytics Results */}
            {(parlayAnalytics || isAnalyzing || analysisError) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6"
              >
                <div className="flex items-center space-x-2 mb-6">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-bold text-white">Parlay Analytics</h2>
                  {isAnalyzing && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>

                {analysisError && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6">
                    <div className="flex items-center space-x-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Analysis Error</span>
                    </div>
                    <p className="text-sm text-red-300 mt-1">{analysisError}</p>
                  </div>
                )}

                {parlayAnalytics && (
                  <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <div className="text-2xl font-bold text-purple-400">
                          {parlayAnalytics.totalPayout.toFixed(2)}x
                        </div>
                        <div className="text-sm text-gray-400">Total Payout</div>
                      </div>

                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <div className={`text-2xl font-bold ${getEVColor(parlayAnalytics.expectedValuePercent)}`}>
                          {parlayAnalytics.expectedValuePercent.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">Expected Value</div>
                      </div>

                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <div className="text-2xl font-bold text-cyan-400">
                          {formatProbability(parlayAnalytics.fairProbability)}
                        </div>
                        <div className="text-sm text-gray-400">Fair Probability</div>
                      </div>

                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                        <div className="text-2xl font-bold text-blue-400">
                          {formatProbability(parlayAnalytics.impliedProbability)}
                        </div>
                        <div className="text-sm text-gray-400">Implied Probability</div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="font-medium text-white">Risk Assessment</span>
                      </div>
                      <p className={`text-sm ${getRiskColor(parlayAnalytics.riskAssessment)}`}>
                        {parlayAnalytics.riskAssessment}
                      </p>
                      <div className="text-xs text-gray-400 mt-1">
                        Correlation adjustment factor: {parlayAnalytics.correlationAdjustmentFactor.toFixed(2)}x
                      </div>
                    </div>

                    {/* Correlation Warnings */}
                    {parlayAnalytics.correlationWarnings.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span>Correlation Warnings</span>
                        </h3>
                        {parlayAnalytics.correlationWarnings.map((warning, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${getCorrelationColor(warning.level)}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium uppercase text-xs">
                                {warning.level} Correlation
                              </span>
                              <span className="text-xs">
                                Risk Factor: {warning.riskFactor.toFixed(2)}x
                              </span>
                            </div>
                            <p className="text-sm">{warning.message}</p>
                            <div className="text-xs mt-1 opacity-75">
                              Affects legs: {warning.affectedLegs.map(i => i + 1).join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Individual Leg Analysis */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4 text-green-400" />
                        <span>Individual Leg Analysis</span>
                      </h3>
                      <div className="space-y-2">
                        {parlayAnalytics.individualLegAnalysis.map((leg, index) => (
                          <div key={index} className="p-3 bg-slate-700/20 rounded-lg border border-slate-600/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">
                                  {leg.player} - {leg.market}
                                </div>
                                <div className="text-sm text-gray-400">
                                  {formatOdds(leg.odds)} • Implied: {formatProbability(leg.impliedProbability)} • Fair: {formatProbability(leg.fairProbability)}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${getEVColor(leg.individualEv)}`}>
                                  {leg.individualEv.toFixed(1)}% EV
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          /* Daily Fantasy Content */
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Daily Fantasy Coming Soon</h2>
            <p className="text-gray-400">
              Daily fantasy optimization features will be available in a future update.
              <br />
              For now, enjoy the enhanced parlay analytics!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineupBuilderPage;
