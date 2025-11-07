import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Brain, Calculator, Plus, Shield, Trophy, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

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
  const [stakeAmount, setStakeAmount] = useState<number>(50);
  const [bankrollAmount, setBankrollAmount] = useState<number>(2000);

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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

  const clampFraction = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), 1);
  };

  const handleApplyStakeSuggestion = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) return;
    setStakeAmount(Number(value.toFixed(2)));
  }, []);

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

  const summaryMetrics = useMemo(() => {
    if (!parlayAnalytics) return null;

    const decimalPayout = parlayAnalytics.totalPayout;
    const impliedProb = parlayAnalytics.impliedProbability;
    const fairProb = parlayAnalytics.fairProbability;
    const evPercent = parlayAnalytics.expectedValuePercent;
    const rawEvPercent = parlayAnalytics.rawExpectedValuePercent;
    const totalReturn = stakeAmount * decimalPayout;
    const expectedProfit = stakeAmount * (evPercent / 100);

    return {
      decimalPayout,
      impliedProb,
      fairProb,
      evPercent,
      rawEvPercent,
      totalReturn,
      expectedProfit,
      correlationAdjustment: parlayAnalytics.correlationAdjustmentFactor,
    };
  }, [parlayAnalytics, stakeAmount]);

  const legEvChartData = useMemo(() => {
    if (!parlayAnalytics) return [];
    return parlayAnalytics.individualLegAnalysis.map(leg => ({
      name: `Leg ${leg.legIndex + 1}`,
      player: leg.player,
      ev: leg.individualEv,
      implied: leg.impliedProbability * 100,
      fair: leg.fairProbability * 100,
    }));
  }, [parlayAnalytics]);

  const correlationChartData = useMemo(() => {
    if (!parlayAnalytics) return [];
    return parlayAnalytics.correlationWarnings.map(warning => ({
      level: warning.level.toUpperCase(),
      risk: warning.riskFactor,
      legsInvolved: warning.affectedLegs.length,
      message: warning.message,
    }));
  }, [parlayAnalytics]);

  const stakeStrategy = useMemo(() => {
    if (!summaryMetrics) return null;
    const { decimalPayout, fairProb, correlationAdjustment, evPercent, rawEvPercent } =
      summaryMetrics;
    const netOdds = decimalPayout - 1;
    if (netOdds <= 0) return null;
    const p = fairProb;
    const q = 1 - p;
    const rawKellyFraction = clampFraction((netOdds * p - q) / netOdds);
    const adjustedKellyFraction = clampFraction(rawKellyFraction / correlationAdjustment);
    const conservativeFraction = clampFraction(adjustedKellyFraction / 2);
    const quarterFraction = clampFraction(adjustedKellyFraction / 4);
    return {
      rawKellyFraction,
      adjustedKellyFraction,
      conservativeFraction,
      quarterFraction,
      evPercent,
      rawEvPercent,
    };
  }, [summaryMetrics]);

  const stakeSuggestions = useMemo(() => {
    if (!summaryMetrics || !stakeStrategy || bankrollAmount <= 0) return [];
    const { evPercent } = summaryMetrics;

    const buildSuggestion = (
      label: string,
      fraction: number,
      description: string,
      highlight = false
    ) => {
      const clampedFraction = clampFraction(fraction);
      if (clampedFraction <= 0) return null;
      const amount = bankrollAmount * clampedFraction;
      return {
        label,
        description,
        fraction: clampedFraction,
        amount,
        expectedProfit: amount * (evPercent / 100),
        highlight,
      };
    };

    const userStakeFraction = bankrollAmount > 0 ? clampFraction(stakeAmount / bankrollAmount) : 0;

    return [
      buildSuggestion(
        'Aggressive (Adj. Kelly)',
        stakeStrategy.adjustedKellyFraction,
        'Applies correlation haircut to classic Kelly sizing',
        true
      ),
      buildSuggestion(
        'Balanced (Half Kelly)',
        stakeStrategy.conservativeFraction,
        'Balances upside with drawdown control'
      ),
      buildSuggestion(
        'Cautious (Quarter Kelly)',
        stakeStrategy.quarterFraction,
        'Stability-focused stake for volatile parlays'
      ),
      buildSuggestion(
        'Flat Stake (Current Input)',
        userStakeFraction,
        'Mirrors the stake amount entered above'
      ),
    ].filter(Boolean) as {
      label: string;
      description: string;
      fraction: number;
      amount: number;
      expectedProfit: number;
      highlight: boolean;
    }[];
  }, [summaryMetrics, stakeStrategy, bankrollAmount, stakeAmount]);

  const bankrollProjectionData = useMemo(() => {
    if (!summaryMetrics || bankrollAmount <= 0) return [];
    const { evPercent } = summaryMetrics;
    const baselineFractions = [0, 0.005, 0.01, 0.02, 0.03, 0.05, 0.075, 0.1];
    const strategicFractions = stakeStrategy
      ? [
          stakeStrategy.adjustedKellyFraction,
          stakeStrategy.conservativeFraction,
          stakeStrategy.quarterFraction,
        ]
      : [];
    const uniqueFractions = Array.from(
      new Set([...baselineFractions, ...strategicFractions.map(clampFraction)])
    )
      .filter(fraction => fraction >= 0 && fraction <= 0.15)
      .sort((a, b) => a - b);

    return uniqueFractions.map(fraction => {
      const stakeValue = bankrollAmount * fraction;
      return {
        fractionLabel: `${(fraction * 100).toFixed(1)}%`,
        stakeValue,
        expectedProfit: stakeValue * (evPercent / 100),
        downside: -stakeValue,
      };
    });
  }, [summaryMetrics, bankrollAmount, stakeStrategy]);

  const edgeSensitivityData = useMemo(() => {
    if (!stakeStrategy || !summaryMetrics) return [];
    const baseFactors = [1, 1.1, 1.25, 1.5, 1.75, 2];
    const factors = Array.from(new Set([...baseFactors, summaryMetrics.correlationAdjustment]))
      .filter(factor => factor >= 1)
      .sort((a, b) => a - b);

    return factors.map(factor => ({
      factor,
      factorLabel: `${factor.toFixed(2)}x`,
      adjustedEv: stakeStrategy.rawEvPercent / factor,
      rawEv: stakeStrategy.rawEvPercent,
    }));
  }, [stakeStrategy, summaryMetrics]);

  const stakeDiagnostics = useMemo(() => {
    if (!stakeStrategy || bankrollAmount <= 0) return null;
    const recommendedStake = bankrollAmount * stakeStrategy.adjustedKellyFraction;
    const diff = stakeAmount - recommendedStake;
    const diffPct = recommendedStake > 0 ? (diff / recommendedStake) * 100 : null;
    return {
      recommendedStake,
      diff,
      diffPct,
      recommendedFraction: stakeStrategy.adjustedKellyFraction,
    };
  }, [stakeStrategy, bankrollAmount, stakeAmount]);

  const outcomeMatrix = useMemo(() => {
    if (!summaryMetrics || stakeAmount <= 0) return null;
    const winProfit = stakeAmount * (summaryMetrics.decimalPayout - 1);
    const lossAmount = -stakeAmount;
    const roiPercent = (winProfit / stakeAmount) * 100;
    const fairWinProbability = summaryMetrics.fairProb;
    return {
      win: {
        probability: fairWinProbability,
        net: winProfit,
        roi: roiPercent,
      },
      loss: {
        probability: 1 - fairWinProbability,
        net: lossAmount,
        roi: -100,
      },
      expected: {
        net: summaryMetrics.expectedProfit,
      },
      breakEvenHitRate: 1 / summaryMetrics.decimalPayout,
      marketImplied: parlayAnalytics?.impliedProbability ?? null,
    };
  }, [summaryMetrics, stakeAmount, parlayAnalytics]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
      {/* Header */}
      <div className='bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white'>Lineup Builder</h1>
              <p className='text-gray-400 mt-1'>
                Enhanced Parlay Analytics & Daily Fantasy Optimization
              </p>
            </div>

            {/* View Toggle */}
            <div className='flex items-center bg-slate-700/50 rounded-lg p-1'>
              <button
                onClick={() => setActiveView('parlay')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeView === 'parlay'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Calculator className='w-4 h-4 inline mr-2' />
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
                <Trophy className='w-4 h-4 inline mr-2' />
                Daily Fantasy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {activeView === 'parlay' ? (
          <div className='space-y-8'>
            {/* Parlay Builder Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
            >
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-xl font-bold text-white'>Parlay Builder</h2>
                  <p className='text-gray-400 text-sm'>
                    Add legs and analyze correlations, EV, and risk
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-400'>Legs:</span>
                  <span className='px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium'>
                    {parlayLegs.length}
                  </span>
                </div>
              </div>

              {/* Add New Leg Form */}
              <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30'>
                <div>
                  <label className='block text-xs font-medium text-gray-400 mb-1'>
                    Player Name
                  </label>
                  <input
                    type='text'
                    value={newLeg.player || ''}
                    onChange={e => setNewLeg({ ...newLeg, player: e.target.value })}
                    placeholder='e.g. LeBron James'
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-400 mb-1'>Market</label>
                  <select
                    value={newLeg.market || ''}
                    onChange={e => setNewLeg({ ...newLeg, market: e.target.value })}
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                  >
                    <option value=''>Select Market</option>
                    {popularMarkets.map(market => (
                      <option key={market} value={market}>
                        {market}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-400 mb-1'>
                    Market Odds
                  </label>
                  <input
                    type='number'
                    value={newLeg.odds || ''}
                    onChange={e => setNewLeg({ ...newLeg, odds: parseInt(e.target.value) })}
                    placeholder='-110'
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-400 mb-1'>Fair Odds</label>
                  <input
                    type='number'
                    value={newLeg.ourFairOdds || ''}
                    onChange={e => setNewLeg({ ...newLeg, ourFairOdds: parseInt(e.target.value) })}
                    placeholder='-105'
                    className='w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                  />
                </div>

                <div className='flex items-end'>
                  <button
                    onClick={addParlayLeg}
                    disabled={
                      !newLeg.player || !newLeg.market || !newLeg.odds || !newLeg.ourFairOdds
                    }
                    className='w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-all'
                  >
                    <Plus className='w-4 h-4' />
                    <span>Add Leg</span>
                  </button>
                </div>
              </div>

              {/* Current Parlay Legs */}
              {parlayLegs.length > 0 && (
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-white'>Current Parlay</h3>
                  {parlayLegs.map((leg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/30'
                    >
                      <div className='flex items-center space-x-4 flex-1'>
                        <div className='text-sm font-medium text-white'>{index + 1}.</div>
                        <div>
                          <div className='font-medium text-white'>{leg.player}</div>
                          <div className='text-sm text-gray-400'>{leg.market}</div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm text-white'>
                            Market: <span className='font-mono'>{formatOdds(leg.odds)}</span>
                          </div>
                          <div className='text-sm text-gray-400'>
                            Fair: <span className='font-mono'>{formatOdds(leg.ourFairOdds)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeParlayLeg(index)}
                        className='p-2 text-gray-400 hover:text-red-400 transition-colors'
                      >
                        <X className='w-4 h-4' />
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
                className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6'
              >
                <div className='flex items-center space-x-2 mb-6'>
                  <Brain className='w-5 h-5 text-purple-400' />
                  <h2 className='text-xl font-bold text-white'>Parlay Analytics</h2>
                  {isAnalyzing && (
                    <div className='flex items-center space-x-2 text-sm text-gray-400'>
                      <div className='w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin' />
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>

                {analysisError && (
                  <div className='p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6'>
                    <div className='flex items-center space-x-2 text-red-400'>
                      <AlertTriangle className='w-4 h-4' />
                      <span className='font-medium'>Analysis Error</span>
                    </div>
                    <p className='text-sm text-red-300 mt-1'>{analysisError}</p>
                  </div>
                )}

                {parlayAnalytics && (
                  <div className='space-y-8'>
                    <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
                      <div className='lg:col-span-1 bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                        <label className='block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide'>
                          Stake Amount
                        </label>
                        <div className='flex items-center space-x-2'>
                          <input
                            type='number'
                            min={1}
                            value={stakeAmount}
                            onChange={e => setStakeAmount(Math.max(1, Number(e.target.value)))}
                            className='flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                          />
                          <span className='text-sm text-gray-500'>USD</span>
                        </div>
                        {summaryMetrics && (
                          <p className='text-xs text-gray-500 mt-2'>
                            EV profit:{' '}
                            <span
                              className={`font-semibold ${
                                summaryMetrics.evPercent >= 0 ? 'text-green-300' : 'text-red-300'
                              }`}
                            >
                              {formatCurrency(summaryMetrics.expectedProfit)}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                        <p className='text-xs text-gray-400 uppercase'>Total Payout</p>
                        <p className='text-2xl font-semibold text-white mt-1'>
                          {parlayAnalytics.totalPayout.toFixed(2)}x
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Potential return:{' '}
                          {summaryMetrics ? formatCurrency(summaryMetrics.totalReturn) : '—'}
                        </p>
                      </div>

                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                        <p className='text-xs text-gray-400 uppercase'>Fair Probability</p>
                        <p className='text-2xl font-semibold text-white mt-1'>
                          {formatProbability(parlayAnalytics.fairProbability)}
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Market implied: {formatProbability(parlayAnalytics.impliedProbability)}
                        </p>
                      </div>

                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                        <p className='text-xs text-gray-400 uppercase'>Expected Value</p>
                        <p
                          className={`text-2xl font-semibold mt-1 ${getEVColor(
                            parlayAnalytics.expectedValuePercent
                          )}`}
                        >
                          {parlayAnalytics.expectedValuePercent.toFixed(2)}%
                        </p>
                        <p className='text-xs text-gray-500 mt-1'>
                          Correlation adj: {parlayAnalytics.correlationAdjustmentFactor.toFixed(2)}x
                        </p>
                      </div>
                    </div>

                    {summaryMetrics && outcomeMatrix && (
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                          <p className='text-xs text-gray-400 uppercase'>Break-even Hit Rate</p>
                          <p className='text-2xl font-semibold text-white mt-1'>
                            {formatProbability(outcomeMatrix.breakEvenHitRate)}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            Market implied: {formatProbability(parlayAnalytics.impliedProbability)}
                          </p>
                        </div>

                        <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                          <p className='text-xs text-gray-400 uppercase'>Profit on Win</p>
                          <p className='text-2xl font-semibold text-green-300 mt-1'>
                            {formatCurrency(outcomeMatrix.win.net)}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            ROI per win: {outcomeMatrix.win.roi.toFixed(1)}%
                          </p>
                        </div>

                        <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-4'>
                          <p className='text-xs text-gray-400 uppercase'>
                            Adj. Kelly Recommendation
                          </p>
                          <p className='text-2xl font-semibold text-white mt-1'>
                            {stakeDiagnostics
                              ? formatCurrency(stakeDiagnostics.recommendedStake)
                              : '—'}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {stakeDiagnostics
                              ? `${(stakeDiagnostics.recommendedFraction * 100).toFixed(
                                  2
                                )}% of bankroll`
                              : 'Set bankroll for sizing guidance'}
                          </p>
                        </div>
                      </div>
                    )}

                    {stakeStrategy && summaryMetrics && (
                      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                        <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                          <div className='flex items-center justify-between mb-3'>
                            <div>
                              <h3 className='text-lg font-semibold text-white'>Stake Strategy</h3>
                              <p className='text-xs text-gray-400'>
                                Kelly sizing with correlation-aware trims
                              </p>
                            </div>
                            <Calculator className='w-4 h-4 text-purple-300' />
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                              <label className='block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide'>
                                Bankroll
                              </label>
                              <div className='flex items-center space-x-2'>
                                <input
                                  type='number'
                                  min={0}
                                  value={bankrollAmount}
                                  onChange={e => {
                                    const nextValue = Number(e.target.value);
                                    setBankrollAmount(
                                      Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0
                                    );
                                  }}
                                  className='w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400'
                                />
                                <span className='text-sm text-gray-500'>USD</span>
                              </div>
                            </div>

                            <div className='bg-slate-800/60 border border-slate-700 rounded-lg p-3'>
                              <p className='text-xs text-gray-400 uppercase'>Edge Haircut</p>
                              <p className='text-sm text-gray-300 mt-1'>
                                Raw EV:{' '}
                                <span className={getEVColor(stakeStrategy.rawEvPercent)}>
                                  {stakeStrategy.rawEvPercent.toFixed(2)}%
                                </span>
                              </p>
                              <p className='text-sm text-gray-300'>
                                Adjusted EV:{' '}
                                <span className={getEVColor(stakeStrategy.evPercent)}>
                                  {stakeStrategy.evPercent.toFixed(2)}%
                                </span>
                              </p>
                              <p className='text-xs text-gray-500 mt-1'>
                                Correlation factor:{' '}
                                {summaryMetrics.correlationAdjustment.toFixed(2)}x
                              </p>
                            </div>
                          </div>

                          <div className='space-y-3 mt-4'>
                            {stakeSuggestions.length === 0 && (
                              <p className='text-sm text-gray-400'>
                                Set a bankroll above zero to unlock sizing guidance.
                              </p>
                            )}
                            {stakeSuggestions.map(suggestion => (
                              <div
                                key={suggestion.label}
                                className={`p-3 rounded-lg border ${
                                  suggestion.highlight
                                    ? 'border-purple-500/60 bg-purple-500/10'
                                    : 'border-slate-700/40 bg-slate-800/40'
                                }`}
                              >
                                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                                  <div>
                                    <div className='flex items-center space-x-2'>
                                      <span className='font-medium text-white'>
                                        {suggestion.label}
                                      </span>
                                      <span className='text-xs text-gray-400'>
                                        {(suggestion.fraction * 100).toFixed(2)}% of bankroll
                                      </span>
                                    </div>
                                    <p className='text-xs text-gray-400 mt-1'>
                                      {suggestion.description}
                                    </p>
                                  </div>
                                  <div className='flex items-center gap-4'>
                                    <div className='text-right'>
                                      <p className='text-sm text-white'>
                                        {formatCurrency(suggestion.amount)}
                                      </p>
                                      <p
                                        className={`text-xs ${
                                          suggestion.expectedProfit >= 0
                                            ? 'text-green-300'
                                            : 'text-red-300'
                                        }`}
                                      >
                                        EV: {formatCurrency(suggestion.expectedProfit)}
                                      </p>
                                    </div>
                                    <button
                                      type='button'
                                      onClick={() => handleApplyStakeSuggestion(suggestion.amount)}
                                      className='px-3 py-1 bg-purple-500/20 text-purple-200 border border-purple-500/40 rounded-md text-xs font-medium hover:bg-purple-500/30 transition-colors'
                                    >
                                      Use stake
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {stakeDiagnostics && (
                              <p className='text-xs text-gray-400'>
                                Current stake is
                                <span
                                  className={`mx-1 font-medium ${
                                    stakeDiagnostics.diff > 0 ? 'text-red-300' : 'text-green-300'
                                  }`}
                                >
                                  {formatCurrency(Math.abs(stakeDiagnostics.diff))}
                                </span>
                                {stakeDiagnostics.diff > 0 ? 'above' : 'below'} the adjusted Kelly
                                suggestion
                                {stakeDiagnostics.diffPct !== null
                                  ? ` (${
                                      stakeDiagnostics.diffPct > 0 ? '+' : ''
                                    }${stakeDiagnostics.diffPct.toFixed(1)}%)`
                                  : ''}
                                .
                              </p>
                            )}
                          </div>
                        </div>

                        <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                          <div className='flex items-center justify-between mb-3'>
                            <div>
                              <h3 className='text-lg font-semibold text-white'>
                                Bankroll Scenarios
                              </h3>
                              <p className='text-xs text-gray-400'>
                                Projected EV vs. downside across stake fractions
                              </p>
                            </div>
                            <Brain className='w-4 h-4 text-purple-300' />
                          </div>
                          <div className='h-64' data-testid='stake-scenarios-chart'>
                            <ResponsiveContainer width='100%' height='100%'>
                              <LineChart
                                data={bankrollProjectionData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid
                                  strokeDasharray='3 3'
                                  stroke='rgba(148,163,184,0.2)'
                                />
                                <XAxis dataKey='fractionLabel' tick={{ fill: '#cbd5f5' }} />
                                <YAxis
                                  tick={{ fill: '#cbd5f5' }}
                                  tickFormatter={value => formatCurrency(value)}
                                />
                                <Tooltip
                                  formatter={(value: number, key: string) => [
                                    formatCurrency(value),
                                    key === 'expectedProfit' ? 'Expected Profit' : 'Max Loss',
                                  ]}
                                  labelFormatter={label => `${label} stake`}
                                  cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                                />
                                <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                                <Line
                                  type='monotone'
                                  dataKey='expectedProfit'
                                  name='Expected Profit'
                                  stroke='#8b5cf6'
                                  strokeWidth={2}
                                  dot={false}
                                />
                                <Line
                                  type='monotone'
                                  dataKey='downside'
                                  name='Max Loss'
                                  stroke='#f87171'
                                  strokeWidth={2}
                                  strokeDasharray='6 4'
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    {edgeSensitivityData.length > 0 && summaryMetrics && (
                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                        <div className='flex items-center justify-between mb-3'>
                          <div>
                            <h3 className='text-lg font-semibold text-white'>Edge Sensitivity</h3>
                            <p className='text-xs text-gray-400'>
                              How correlation haircuts impact EV
                            </p>
                          </div>
                          <Shield className='w-4 h-4 text-purple-300' />
                        </div>
                        <div className='h-64' data-testid='edge-sensitivity-chart'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <LineChart
                              data={edgeSensitivityData}
                              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.2)' />
                              <XAxis dataKey='factorLabel' tick={{ fill: '#cbd5f5' }} />
                              <YAxis
                                tick={{ fill: '#cbd5f5' }}
                                tickFormatter={value => `${value.toFixed(2)}%`}
                              />
                              <Tooltip
                                formatter={(value: number) => `${value.toFixed(2)}%`}
                                cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                              />
                              <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                              <ReferenceLine
                                x={`${summaryMetrics.correlationAdjustment.toFixed(2)}x`}
                                stroke='#facc15'
                                strokeDasharray='5 5'
                                label={{
                                  value: 'Current',
                                  position: 'insideTop',
                                  fill: '#facc15',
                                  fontSize: 12,
                                }}
                              />
                              <Line
                                type='monotone'
                                dataKey='rawEv'
                                name='Raw EV'
                                stroke='#34d399'
                                strokeWidth={2}
                                dot={false}
                              />
                              <Line
                                type='monotone'
                                dataKey='adjustedEv'
                                name='Adjusted EV'
                                stroke='#22d3ee'
                                strokeWidth={2}
                                dot
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {outcomeMatrix && (
                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                        <h3 className='text-lg font-semibold text-white mb-3'>Outcome Matrix</h3>
                        <div className='overflow-x-auto'>
                          <table className='min-w-full divide-y divide-slate-700 text-sm'>
                            <thead>
                              <tr className='text-left text-gray-400 uppercase tracking-wide text-xs'>
                                <th className='py-2 pr-4'>Outcome</th>
                                <th className='py-2 pr-4'>Fair Probability</th>
                                <th className='py-2 pr-4'>Net Result</th>
                                <th className='py-2 pr-4'>ROI</th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-800 text-gray-200'>
                              <tr>
                                <td className='py-3 pr-4 font-medium text-green-300'>Win</td>
                                <td className='py-3 pr-4'>
                                  {formatProbability(outcomeMatrix.win.probability)}
                                </td>
                                <td className='py-3 pr-4 text-green-300'>
                                  {formatCurrency(outcomeMatrix.win.net)}
                                </td>
                                <td className='py-3 pr-4 text-green-300'>
                                  {outcomeMatrix.win.roi.toFixed(1)}%
                                </td>
                              </tr>
                              <tr>
                                <td className='py-3 pr-4 font-medium text-red-300'>Loss</td>
                                <td className='py-3 pr-4'>
                                  {formatProbability(outcomeMatrix.loss.probability)}
                                </td>
                                <td className='py-3 pr-4 text-red-300'>
                                  {formatCurrency(outcomeMatrix.loss.net)}
                                </td>
                                <td className='py-3 pr-4 text-red-300'>-100%</td>
                              </tr>
                              <tr>
                                <td className='py-3 pr-4 font-medium text-white'>Expected</td>
                                <td className='py-3 pr-4'>—</td>
                                <td
                                  className={`py-3 pr-4 ${
                                    outcomeMatrix.expected.net >= 0
                                      ? 'text-green-300'
                                      : 'text-red-300'
                                  }`}
                                >
                                  {formatCurrency(outcomeMatrix.expected.net)}
                                </td>
                                <td className='py-3 pr-4'>—</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                        <div className='flex items-center justify-between mb-3'>
                          <div>
                            <h3 className='text-lg font-semibold text-white'>
                              Probability Outlook
                            </h3>
                            <p className='text-xs text-gray-400'>Market vs. fair win probability</p>
                          </div>
                          <Shield className='w-4 h-4 text-purple-300' />
                        </div>
                        <div className='h-64' data-testid='parlay-probability-chart'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <AreaChart
                              data={[
                                {
                                  name: 'Parlay',
                                  Market: parlayAnalytics.impliedProbability * 100,
                                  Fair: parlayAnalytics.fairProbability * 100,
                                },
                              ]}
                              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id='probFair' x1='0' y1='0' x2='0' y2='1'>
                                  <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.8} />
                                  <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id='probMarket' x1='0' y1='0' x2='0' y2='1'>
                                  <stop offset='5%' stopColor='#38bdf8' stopOpacity={0.8} />
                                  <stop offset='95%' stopColor='#38bdf8' stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.2)' />
                              <XAxis dataKey='name' tick={{ fill: '#cbd5f5' }} />
                              <YAxis
                                domain={[0, 100]}
                                tickFormatter={value => `${value.toFixed(1)}%`}
                                tick={{ fill: '#cbd5f5' }}
                              />
                              <Tooltip
                                formatter={(value: number) => `${value.toFixed(2)}%`}
                                cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                              />
                              <Area
                                type='monotone'
                                dataKey='Fair'
                                stroke='#8b5cf6'
                                fill='url(#probFair)'
                              />
                              <Area
                                type='monotone'
                                dataKey='Market'
                                stroke='#38bdf8'
                                fill='url(#probMarket)'
                              />
                              <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                        <div className='flex items-center justify-between mb-3'>
                          <div>
                            <h3 className='text-lg font-semibold text-white'>
                              Leg EV Contribution
                            </h3>
                            <p className='text-xs text-gray-400'>
                              Identify which legs carry the value
                            </p>
                          </div>
                          <BarChart3 className='w-4 h-4 text-purple-300' />
                        </div>
                        <div className='h-64' data-testid='leg-ev-chart'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <BarChart
                              data={legEvChartData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.2)' />
                              <XAxis dataKey='name' tick={{ fill: '#cbd5f5' }} />
                              <YAxis
                                tick={{ fill: '#cbd5f5' }}
                                tickFormatter={value => `${value.toFixed(1)}%`}
                              />
                              <Tooltip
                                labelFormatter={label => {
                                  const dataPoint = legEvChartData.find(
                                    item => item.name === label
                                  );
                                  return dataPoint ? `${label}: ${dataPoint.player}` : label;
                                }}
                                formatter={(value: number, key: string) => {
                                  if (key === 'ev') return [`${value.toFixed(2)}%`, 'EV'];
                                  return [`${value.toFixed(2)}%`, key];
                                }}
                                cursor={{ fill: 'rgba(148,163,184,0.1)' }}
                              />
                              <Bar
                                dataKey='ev'
                                name='Expected Value'
                                fill='#8b5cf6'
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className='p-4 bg-slate-900/40 rounded-lg border border-slate-700/40'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center space-x-2'>
                          <Shield className='w-4 h-4 text-yellow-400' />
                          <span className='font-medium text-white'>Risk Assessment</span>
                        </div>
                        <span className='text-xs text-gray-500'>
                          {summaryMetrics
                            ? `Adj. factor ${summaryMetrics.correlationAdjustment.toFixed(2)}x`
                            : ''}
                        </span>
                      </div>
                      <p className={`text-sm ${getRiskColor(parlayAnalytics.riskAssessment)}`}>
                        {parlayAnalytics.riskAssessment}
                      </p>
                    </div>

                    {parlayAnalytics.correlationWarnings.length > 0 && (
                      <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-white flex items-center space-x-2'>
                          <AlertTriangle className='w-4 h-4 text-yellow-400' />
                          <span>Correlation Warnings</span>
                        </h3>
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                          {parlayAnalytics.correlationWarnings.map((warning, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${getCorrelationColor(
                                warning.level
                              )}`}
                            >
                              <div className='flex items-center justify-between mb-2'>
                                <span className='font-medium uppercase text-xs'>
                                  {warning.level} Correlation
                                </span>
                                <span className='text-xs'>
                                  Risk: {warning.riskFactor.toFixed(2)}x
                                </span>
                              </div>
                              <p className='text-sm'>{warning.message}</p>
                              <div className='text-xs mt-1 opacity-75'>
                                Legs impacted: {warning.affectedLegs.map(i => i + 1).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {correlationChartData.length > 0 && (
                      <div className='bg-slate-900/40 border border-slate-700/40 rounded-lg p-5'>
                        <h3 className='text-lg font-semibold text-white mb-3'>
                          Correlation Summary
                        </h3>
                        <div className='h-64' data-testid='correlation-chart'>
                          <ResponsiveContainer width='100%' height='100%'>
                            <BarChart
                              data={correlationChartData}
                              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                            >
                              <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.2)' />
                              <XAxis dataKey='level' tick={{ fill: '#cbd5f5' }} />
                              <YAxis
                                tick={{ fill: '#cbd5f5' }}
                                tickFormatter={value => value.toFixed(1)}
                              />
                              <Tooltip
                                formatter={(value: number, key: string) => [
                                  `${value.toFixed(2)}`,
                                  key === 'risk' ? 'Risk factor' : 'Legs',
                                ]}
                              />
                              <Legend wrapperStyle={{ color: '#cbd5f5' }} />
                              <Bar
                                dataKey='risk'
                                name='Risk Factor'
                                fill='#f97316'
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey='legsInvolved'
                                name='Legs Involved'
                                fill='#22d3ee'
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <div className='space-y-3'>
                      <h3 className='text-lg font-semibold text-white flex items-center space-x-2'>
                        <BarChart3 className='w-4 h-4 text-green-400' />
                        <span>Individual Leg Analysis</span>
                      </h3>
                      <div className='space-y-2'>
                        {parlayAnalytics.individualLegAnalysis.map((leg, index) => (
                          <div
                            key={index}
                            className='p-3 bg-slate-700/20 rounded-lg border border-slate-600/20'
                          >
                            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                              <div>
                                <div className='font-medium text-white'>
                                  {leg.player} - {leg.market}
                                </div>
                                <div className='text-sm text-gray-400'>
                                  {formatOdds(leg.odds)} • Implied{' '}
                                  {formatProbability(leg.impliedProbability)} • Fair{' '}
                                  {formatProbability(leg.fairProbability)}
                                </div>
                              </div>
                              <div className='text-right'>
                                <div className={`font-medium ${getEVColor(leg.individualEv)}`}>
                                  {leg.individualEv.toFixed(2)}% EV
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
          <div className='text-center py-16'>
            <Trophy className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h2 className='text-xl font-bold text-white mb-2'>Daily Fantasy Coming Soon</h2>
            <p className='text-gray-400'>
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
