import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LineupEntry,
  OptimizedLineup,
  PrizePicksProjection,
  PrizePicksProUnifiedProps,
} from '../types/prizePicksUnified';

export const PrizePicksProUnified: React.FC<PrizePicksProUnifiedProps> = ({
  variant = 'cyber',
  className = '',
  maxSelections = 6,
  enableMLPredictions = true,
  enableShapExplanations = true,
  enableKellyOptimization = true,
  enableCorrelationAnalysis = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onLineupGenerated,
  onBetPlaced,
}) => {
  // State management
  const [projections, setProjections] = useState<PrizePicksProjection[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<LineupEntry[]>([]);
  const [optimizedLineup, setOptimizedLineup] = useState<OptimizedLineup | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    sport: 'All',
    league: 'All',
    team: 'All',
    statType: 'All',
    minConfidence: 70,
    maxRisk: 'high' as 'low' | 'medium' | 'high',
    minValue: 0,
    playerSearch: '',
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'confidence' as keyof PrizePicksProjection,
    direction: 'desc' as 'asc' | 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedProjection, setSelectedProjection] = useState<PrizePicksProjection | null>(null);
  const [showShapModal, setShowShapModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Explanation state
  const [aiExplanations, setAiExplanations] = useState<Record<string, any>>({});
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedPropForAi, setSelectedPropForAi] = useState<PrizePicksProjection | null>(null);
  const [loadingAiExplanation, setLoadingAiExplanation] = useState(false);

  // AI Explanation functions
  const fetchAiExplanation = async (projection: PrizePicksProjection) => {
    if (aiExplanations[projection.id]) {
      setSelectedPropForAi(projection);
      setShowAiModal(true);
      return;
    }

    setLoadingAiExplanation(true);
    try {
      const response = await fetch(`/api/prizepicks/props/${projection.id}/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAiExplanations(prev => ({ ...prev, [projection.id]: data }));
        setSelectedPropForAi(projection);
        setShowAiModal(true);
      } else {
        console.error('Failed to fetch AI explanation');
        setError('Failed to fetch AI explanation');
      }
    } catch (error) {
      console.error('Error fetching AI explanation:', error);
      setError('Error fetching AI explanation');
    } finally {
      setLoadingAiExplanation(false);
    }
  };

  // Fetch projections from backend
  const fetchProjections = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prizepicks/props/enhanced', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched enhanced props:', data.length);

        // Transform backend data to match frontend expectations
        const transformedData = data.map((prop: any) => ({
          id: prop.id || `prop_${Math.random()}`,
          player_id: prop.id || `player_${Math.random()}`,
          player_name: prop.player_name || 'Unknown Player',
          team: prop.team || 'Unknown Team',
          position: prop.position || '',
          league: prop.league || '',
          sport: prop.sport || '',
          stat_type: prop.stat_type || '',
          line_score: prop.line || 0,
          over_odds: prop.over_odds || -110,
          under_odds: prop.under_odds || -110,
          start_time: prop.game_time || new Date().toISOString(),
          status: prop.status || 'active',
          description: `${prop.player_name} ${prop.stat_type}`,
          rank: 1,
          is_promo: false,
          confidence: prop.confidence || 75,
          market_efficiency: 0.15,
          value_rating: prop.value || 0,
          kelly_percentage: prop.kelly || 0,
          ml_prediction: {
            prediction: prop.prediction || prop.line || 0,
            confidence: prop.confidence || 75,
            ensemble_score: 0.8,
            model_weights: { ensemble: 1.0 },
            factors: { overall: 0.8 },
            risk_assessment: {
              level: prop.risk_level || 'medium',
              score: 50,
              factors: ['General risk assessment'],
            },
          },
        }));

        setProjections(transformedData);
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching projections:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch projections');

      // Fallback to mock data
      const mockData = generateMockData();
      setProjections(mockData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate mock data for fallback
  const generateMockData = (): PrizePicksProjection[] => {
    const mockPlayers = [
      { name: 'LeBron James', team: 'LAL', position: 'F', sport: 'NBA', league: 'NBA' },
      { name: 'Stephen Curry', team: 'GSW', position: 'G', sport: 'NBA', league: 'NBA' },
      { name: 'Shohei Ohtani', team: 'LAD', position: 'DH', sport: 'MLB', league: 'MLB' },
      { name: 'Mookie Betts', team: 'LAD', position: 'OF', sport: 'MLB', league: 'MLB' },
      { name: 'Connor McDavid', team: 'EDM', position: 'C', sport: 'NHL', league: 'NHL' },
    ];

    const statTypes = {
      NBA: ['Points', 'Assists', 'Rebounds', '3-Pointers'],
      MLB: ['Hits', 'Home Runs', 'RBIs', 'Strikeouts'],
      NHL: ['Goals', 'Assists', 'Points', 'Shots'],
    };

    return mockPlayers.map((player, index) => {
      const availableStats = statTypes[player.sport as keyof typeof statTypes] || ['Points'];
      const statType = availableStats[index % availableStats.length];
      const line = 15 + Math.random() * 10;
      const confidence = 70 + Math.random() * 25;

      return {
        id: `mock_${index}`,
        player_id: `player_${index}`,
        player_name: player.name,
        team: player.team,
        position: player.position,
        league: player.league,
        sport: player.sport,
        stat_type: statType,
        line_score: Math.round(line * 2) / 2,
        over_odds: -110,
        under_odds: -110,
        start_time: new Date().toISOString(),
        status: 'active',
        description: `${player.name} ${statType}`,
        rank: index + 1,
        is_promo: false,
        confidence: Math.round(confidence),
        market_efficiency: 0.15,
        value_rating: Math.random() * 10,
        kelly_percentage: Math.random() * 8,
        ml_prediction: {
          prediction: line + (Math.random() - 0.5) * 3,
          confidence: Math.round(confidence),
          ensemble_score: 0.8,
          model_weights: { ensemble: 1.0 },
          factors: { overall: 0.8 },
          risk_assessment: {
            level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
            score: 50,
            factors: ['Mock assessment'],
          },
        },
      };
    });
  };

  // Filter and sort projections
  const filteredProjections = useMemo(() => {
    let filtered = projections.filter(projection => {
      const matchesSport =
        activeFilters.sport === 'All' || projection.sport === activeFilters.sport;
      const matchesLeague =
        activeFilters.league === 'All' || projection.league === activeFilters.league;
      const matchesTeam = activeFilters.team === 'All' || projection.team === activeFilters.team;
      const matchesStatType =
        activeFilters.statType === 'All' || projection.stat_type === activeFilters.statType;
      const matchesConfidence = projection.confidence >= activeFilters.minConfidence;
      const matchesSearch =
        !activeFilters.playerSearch ||
        projection.player_name.toLowerCase().includes(activeFilters.playerSearch.toLowerCase());

      return (
        matchesSport &&
        matchesLeague &&
        matchesTeam &&
        matchesStatType &&
        matchesConfidence &&
        matchesSearch
      );
    });

    // Sort projections
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    });

    return filtered;
  }, [projections, activeFilters, sortConfig]);

  // Handle projection selection
  const handleProjectionSelect = (
    projection: PrizePicksProjection,
    selection: 'over' | 'under'
  ) => {
    if (selectedEntries.length >= maxSelections) {
      setError(`Maximum ${maxSelections} selections allowed`);
      return;
    }

    const existingIndex = selectedEntries.findIndex(entry => entry.projection.id === projection.id);

    if (existingIndex >= 0) {
      const updated = [...selectedEntries];
      updated[existingIndex] = { ...updated[existingIndex], selection };
      setSelectedEntries(updated);
    } else {
      const newEntry: LineupEntry = {
        id: `entry_${Date.now()}_${Math.random()}`,
        projection,
        selection,
        confidence: projection.confidence,
        expected_value: projection.value_rating || 0,
        kelly_percentage: projection.kelly_percentage || 0,
      };
      setSelectedEntries(prev => [...prev, newEntry]);
    }
    setError(null);
  };

  // Optimize lineup
  const optimizeLineup = async () => {
    if (selectedEntries.length < 2) return;
    setIsOptimizing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const totalConfidence =
        selectedEntries.reduce((sum, entry) => sum + entry.confidence, 0) / selectedEntries.length;
      const multiplier =
        selectedEntries.length === 2
          ? 3.0
          : selectedEntries.length === 3
            ? 5.0
            : selectedEntries.length === 4
              ? 10.0
              : selectedEntries.length === 5
                ? 20.0
                : 25.0;

      const optimized: OptimizedLineup = {
        entries: selectedEntries,
        total_confidence: totalConfidence,
        expected_payout: multiplier,
        kelly_optimization:
          selectedEntries.reduce((sum, entry) => sum + entry.kelly_percentage, 0) /
          selectedEntries.length,
        risk_score: 100 - totalConfidence,
        value_score:
          selectedEntries.reduce((sum, entry) => sum + entry.expected_value, 0) /
          selectedEntries.length,
        correlation_matrix: selectedEntries.map(() =>
          selectedEntries.map(() => Math.random() * 0.3)
        ),
      };

      setOptimizedLineup(optimized);
      onLineupGenerated?.(optimized);
    } catch (error) {
      console.error('Optimization failed:', error);
      setError('Failed to optimize lineup');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchProjections();
    if (autoRefresh) {
      const interval = setInterval(fetchProjections, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchProjections, autoRefresh, refreshInterval]);

  const baseClasses = `
    w-full min-h-screen rounded-lg border transition-all duration-200
    ${
      variant === 'cyber'
        ? 'bg-black border-cyan-400/30 text-cyan-300'
        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
    }
    ${className}
  `;

  return (
    <div className={baseClasses}>
      <div className='p-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1
            className={`text-3xl font-bold mb-2 ${
              variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
            }`}
          >
            {variant === 'cyber' ? 'PRIZEPICKS PRO NEURAL INTERFACE' : 'PrizePicks Pro Analytics'}
          </h1>
          <p
            className={`${
              variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Advanced AI-powered prop analysis with live in-season data
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              variant === 'cyber'
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-red-100 border-red-500 text-red-700'
            }`}
          >
            {error}
          </div>
        )}

        {/* Filters */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <input
            type='text'
            placeholder='Search players...'
            value={activeFilters.playerSearch}
            onChange={e => setActiveFilters(prev => ({ ...prev, playerSearch: e.target.value }))}
            className={`p-3 rounded-lg border ${
              variant === 'cyber'
                ? 'bg-gray-900 border-cyan-400/30 text-cyan-300'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          />

          <select
            value={activeFilters.sport}
            onChange={e => setActiveFilters(prev => ({ ...prev, sport: e.target.value }))}
            className={`p-3 rounded-lg border ${
              variant === 'cyber'
                ? 'bg-gray-900 border-cyan-400/30 text-cyan-300'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value='All'>All Sports</option>
            <option value='NBA'>NBA</option>
            <option value='MLB'>MLB</option>
            <option value='NHL'>NHL</option>
            <option value='WNBA'>WNBA</option>
            <option value='MLS'>MLS</option>
          </select>

          <input
            type='range'
            min='50'
            max='100'
            value={activeFilters.minConfidence}
            onChange={e =>
              setActiveFilters(prev => ({ ...prev, minConfidence: Number(e.target.value) }))
            }
            className='p-3'
          />
          <span className={`text-sm ${variant === 'cyber' ? 'text-cyan-400' : 'text-gray-600'}`}>
            Min Confidence: {activeFilters.minConfidence}%
          </span>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Projections Grid */}
          <div className='lg:col-span-2'>
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[800px] overflow-y-auto'>
              <AnimatePresence>
                {isLoading ? (
                  <div className='col-span-full flex items-center justify-center h-64'>
                    <div
                      className={`animate-spin rounded-full h-12 w-12 border-4 border-transparent ${
                        variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
                      }`}
                    />
                  </div>
                ) : filteredProjections.length === 0 ? (
                  <div className='col-span-full text-center py-16'>
                    <div
                      className={`text-6xl mb-4 ${
                        variant === 'cyber' ? 'text-cyan-400/50' : 'text-gray-400'
                      }`}
                    >
                      📊
                    </div>
                    <p
                      className={`text-xl ${
                        variant === 'cyber'
                          ? 'text-cyan-300/70'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      No projections match your filters
                    </p>
                  </div>
                ) : (
                  filteredProjections.map((projection, index) => (
                    <motion.div
                      key={projection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-6 rounded-xl border cursor-pointer transition-all ${
                        selectedEntries.some(entry => entry.projection.id === projection.id)
                          ? variant === 'cyber'
                            ? 'bg-cyan-400/20 border-cyan-400/50'
                            : 'bg-blue-100 border-blue-500 dark:bg-blue-900/30'
                          : variant === 'cyber'
                            ? 'bg-gray-900/50 border-cyan-400/30 hover:border-cyan-400/50'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Player Header */}
                      <div className='flex items-start justify-between mb-4'>
                        <div className='space-y-1'>
                          <h3
                            className={`text-lg font-bold ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {projection.player_name}
                          </h3>
                          <p
                            className={`text-sm ${
                              variant === 'cyber'
                                ? 'text-cyan-400/70'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {projection.team} • {projection.position} • {projection.sport}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            projection.confidence >= 80
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : projection.confidence >= 70
                                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}
                        >
                          {projection.confidence.toFixed(1)}%
                        </div>
                      </div>

                      {/* Stat Line */}
                      <div className='mb-4'>
                        <div
                          className={`text-center p-4 rounded-lg ${
                            variant === 'cyber'
                              ? 'bg-black/50 border border-cyan-400/20'
                              : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div
                            className={`text-base font-semibold ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {projection.stat_type}
                          </div>
                          <div
                            className={`text-3xl font-bold my-2 ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {projection.line_score}
                          </div>
                          {projection.ml_prediction && (
                            <div
                              className={`text-sm ${
                                variant === 'cyber'
                                  ? 'text-cyan-400/70'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              AI Predicts: {projection.ml_prediction.prediction.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Over/Under Buttons */}
                      <div className='grid grid-cols-2 gap-3 mb-4'>
                        <button
                          onClick={() => handleProjectionSelect(projection, 'over')}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            selectedEntries.some(
                              entry =>
                                entry.projection.id === projection.id && entry.selection === 'over'
                            )
                              ? variant === 'cyber'
                                ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                                : 'bg-green-100 text-green-700 border border-green-500'
                              : variant === 'cyber'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          }`}
                        >
                          OVER {projection.line_score}
                        </button>
                        <button
                          onClick={() => handleProjectionSelect(projection, 'under')}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            selectedEntries.some(
                              entry =>
                                entry.projection.id === projection.id && entry.selection === 'under'
                            )
                              ? variant === 'cyber'
                                ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                                : 'bg-red-100 text-red-700 border border-red-500'
                              : variant === 'cyber'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30'
                                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                          }`}
                        >
                          UNDER {projection.line_score}
                        </button>
                      </div>

                      {/* Stats Row */}
                      <div className='grid grid-cols-3 gap-3 text-xs mb-4'>
                        <div className='text-center'>
                          <div
                            className={`font-medium ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Value
                          </div>
                          <div
                            className={`font-bold ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {projection.value_rating?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <div className='text-center'>
                          <div
                            className={`font-medium ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Kelly %
                          </div>
                          <div
                            className={`font-bold ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {projection.kelly_percentage?.toFixed(1) || 'N/A'}%
                          </div>
                        </div>
                        <div className='text-center'>
                          <div
                            className={`font-medium ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Risk
                          </div>
                          <div
                            className={`font-bold ${
                              projection.ml_prediction?.risk_assessment.level === 'low'
                                ? 'text-green-400'
                                : projection.ml_prediction?.risk_assessment.level === 'medium'
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {projection.ml_prediction?.risk_assessment.level.toUpperCase() || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* AI Explanation Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          fetchAiExplanation(projection);
                        }}
                        disabled={loadingAiExplanation}
                        className={`w-full p-2 rounded-lg text-sm font-medium transition-all ${
                          variant === 'cyber'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30'
                            : 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
                        }`}
                      >
                        {loadingAiExplanation ? (
                          <div className='flex items-center justify-center space-x-2'>
                            <div className='animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-current' />
                            <span>Getting AI Analysis...</span>
                          </div>
                        ) : (
                          '🤖 AI Explanation'
                        )}
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Lineup Builder */}
          <div className='lg:col-span-1'>
            <div
              className={`p-6 rounded-xl border sticky top-0 ${
                variant === 'cyber'
                  ? 'bg-gray-900/50 border-cyan-400/30'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <h3
                className={`text-xl font-bold mb-4 ${
                  variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                }`}
              >
                Lineup Builder ({selectedEntries.length}/{maxSelections})
              </h3>

              <div className='space-y-3 mb-6 max-h-64 overflow-y-auto'>
                {selectedEntries.length === 0 ? (
                  <p
                    className={`text-center py-8 ${
                      variant === 'cyber' ? 'text-cyan-400/70' : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Select props to build your lineup
                  </p>
                ) : (
                  selectedEntries.map(entry => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border ${
                        variant === 'cyber'
                          ? 'bg-black/50 border-cyan-400/20'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-300'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div
                            className={`font-medium ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {entry.projection.player_name}
                          </div>
                          <div
                            className={`text-xs ${
                              variant === 'cyber'
                                ? 'text-cyan-400/70'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {entry.selection.toUpperCase()} {entry.projection.line_score}{' '}
                            {entry.projection.stat_type}
                          </div>
                          <div
                            className={`text-xs mt-1 ${
                              variant === 'cyber' ? 'text-cyan-300/70' : 'text-gray-500'
                            }`}
                          >
                            Confidence: {entry.confidence.toFixed(1)}%
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setSelectedEntries(prev => prev.filter(e => e.id !== entry.id))
                          }
                          className={`ml-3 p-1 rounded text-sm font-bold ${
                            variant === 'cyber'
                              ? 'text-red-400 hover:bg-red-500/20'
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Optimize Button */}
              <button
                onClick={optimizeLineup}
                disabled={selectedEntries.length < 2 || isOptimizing}
                className={`w-full p-4 rounded-lg font-bold text-lg transition-all ${
                  selectedEntries.length >= 2 && !isOptimizing
                    ? variant === 'cyber'
                      ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/40'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                {isOptimizing ? (
                  <div className='flex items-center justify-center space-x-3'>
                    <div className='animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-current' />
                    <span>Optimizing...</span>
                  </div>
                ) : variant === 'cyber' ? (
                  'OPTIMIZE LINEUP'
                ) : (
                  'Optimize Lineup'
                )}
              </button>

              {/* Optimized Lineup Display */}
              {optimizedLineup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-6 rounded-lg border ${
                    variant === 'cyber'
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-green-100 border-green-500 dark:bg-green-900/30'
                  }`}
                >
                  <h4
                    className={`font-bold text-lg mb-4 ${
                      variant === 'cyber' ? 'text-green-400' : 'text-green-800 dark:text-green-400'
                    }`}
                  >
                    Optimized Lineup
                  </h4>
                  <div className='space-y-3 text-sm'>
                    <div className='flex justify-between'>
                      <span>Total Confidence:</span>
                      <span className='font-bold'>
                        {optimizedLineup.total_confidence.toFixed(1)}%
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Expected Payout:</span>
                      <span className='font-bold'>
                        {optimizedLineup.expected_payout.toFixed(2)}x
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Value Score:</span>
                      <span className='font-bold'>{optimizedLineup.value_score.toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Explanation Modal */}
      <AnimatePresence>
        {showAiModal && selectedPropForAi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
            onClick={() => setShowAiModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border ${
                variant === 'cyber'
                  ? 'bg-gray-900 border-cyan-400/50'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`p-6 border-b ${
                  variant === 'cyber'
                    ? 'border-cyan-400/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <div>
                    <h3
                      className={`text-xl font-bold ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      🤖 AI Analysis
                    </h3>
                    <p
                      className={`text-sm ${
                        variant === 'cyber'
                          ? 'text-cyan-400/70'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {selectedPropForAi.player_name} - {selectedPropForAi.stat_type}{' '}
                      {selectedPropForAi.line_score}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAiModal(false)}
                    className={`p-2 rounded-lg ${
                      variant === 'cyber'
                        ? 'text-cyan-400 hover:bg-cyan-400/10'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className='p-6'>
                {aiExplanations[selectedPropForAi.id] ? (
                  <div className='space-y-6'>
                    {/* AI Recommendation */}
                    <div
                      className={`p-4 rounded-lg ${
                        variant === 'cyber'
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      }`}
                    >
                      <h4
                        className={`font-bold mb-2 ${
                          variant === 'cyber' ? 'text-cyan-300' : 'text-blue-800 dark:text-blue-400'
                        }`}
                      >
                        📊 AI Recommendation
                      </h4>
                      <p
                        className={`${
                          variant === 'cyber' ? 'text-cyan-100' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {aiExplanations[selectedPropForAi.id].recommendation ||
                          'No recommendation available'}
                      </p>
                    </div>

                    {/* Key Factors */}
                    <div>
                      <h4
                        className={`font-bold mb-3 ${
                          variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        🔍 Key Analysis Factors
                      </h4>
                      <div className='space-y-2'>
                        {aiExplanations[selectedPropForAi.id].factors?.map(
                          (factor: string, index: number) => (
                            <div
                              key={index}
                              className={`p-3 rounded ${
                                variant === 'cyber'
                                  ? 'bg-gray-800/50 border-l-2 border-cyan-400'
                                  : 'bg-gray-50 border-l-2 border-blue-400 dark:bg-gray-700'
                              }`}
                            >
                              <p
                                className={`${
                                  variant === 'cyber'
                                    ? 'text-cyan-100'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                • {factor}
                              </p>
                            </div>
                          )
                        ) || (
                          <p
                            className={`${
                              variant === 'cyber'
                                ? 'text-cyan-400/70'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            No specific factors available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Confidence Breakdown */}
                    <div>
                      <h4
                        className={`font-bold mb-3 ${
                          variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        📈 Confidence Breakdown
                      </h4>
                      <div className='grid grid-cols-2 gap-4'>
                        <div
                          className={`p-3 rounded ${
                            variant === 'cyber' ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div
                            className={`text-sm ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Overall Confidence
                          </div>
                          <div
                            className={`text-xl font-bold ${
                              variant === 'cyber'
                                ? 'text-cyan-300'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {aiExplanations[selectedPropForAi.id].confidence ||
                              selectedPropForAi.confidence.toFixed(1)}
                            %
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded ${
                            variant === 'cyber' ? 'bg-gray-800/50' : 'bg-gray-50 dark:bg-gray-700'
                          }`}
                        >
                          <div
                            className={`text-sm ${
                              variant === 'cyber'
                                ? 'text-cyan-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            Risk Level
                          </div>
                          <div
                            className={`text-xl font-bold ${
                              aiExplanations[selectedPropForAi.id].risk_level === 'low'
                                ? 'text-green-400'
                                : aiExplanations[selectedPropForAi.id].risk_level === 'medium'
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {aiExplanations[selectedPropForAi.id].risk_level?.toUpperCase() ||
                              'UNKNOWN'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full AI Analysis */}
                    <div>
                      <h4
                        className={`font-bold mb-3 ${
                          variant === 'cyber' ? 'text-cyan-300' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        🧠 Detailed AI Analysis
                      </h4>
                      <div
                        className={`p-4 rounded-lg ${
                          variant === 'cyber'
                            ? 'bg-gray-800/50 border border-gray-700'
                            : 'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600'
                        }`}
                      >
                        <p
                          className={`whitespace-pre-wrap ${
                            variant === 'cyber'
                              ? 'text-cyan-100'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {aiExplanations[selectedPropForAi.id].analysis ||
                            'No detailed analysis available'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-center py-12'>
                    <div
                      className={`animate-spin rounded-full h-8 w-8 border-2 border-transparent ${
                        variant === 'cyber' ? 'border-t-cyan-400' : 'border-t-blue-500'
                      }`}
                    />
                    <span
                      className={`ml-3 ${
                        variant === 'cyber' ? 'text-cyan-300' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      Loading AI analysis...
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
