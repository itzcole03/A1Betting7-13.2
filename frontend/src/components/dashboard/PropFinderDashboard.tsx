import React, { useState, useMemo, useRef } from 'react';
import { enhancedLogger } from '../../utils/enhancedLogger';
import { Search, Filter, Heart, Star, DollarSign, Target, Zap, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePropFinderData, PropOpportunity } from '../../hooks/usePropFinderData';

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility functions
const formatOdds = (odds: number): string => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 70) return 'bg-blue-500';
  if (confidence >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getEdgeColor = (edge: number): string => {
  if (edge >= 8) return 'text-green-400';
  if (edge >= 5) return 'text-blue-400';
  if (edge >= 0) return 'text-yellow-400';
  return 'text-red-400';
};

const getSportIcon = (sport: string): string => {
  switch (sport) {
    case 'NBA': return '🏀';
    case 'MLB': return '⚾';
    case 'NFL': return '🏈';
    case 'NHL': return '🏒';
    default: return '🎯';
  }
};

// Main PropFinder Dashboard Component
const PropFinderDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['NBA', 'MLB']);
  const [confidenceRange, setConfidenceRange] = useState([60, 100]);
  const [edgeRange, setEdgeRange] = useState([0, 20]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');

  // Phase 1.2 specific filters
  const [showArbitrageOnly, setShowArbitrageOnly] = useState(false);
  const [minBookmakers, setMinBookmakers] = useState(1);
  const [selectedSharpMoney, setSelectedSharpMoney] = useState<string[]>([]);

  // Real data integration using our enhanced hook
  const {
    opportunities,
    stats,
    loading,
    error,
    bookmarkOpportunity,
    refreshData,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  } = usePropFinderData({
    autoRefresh: true,
    refreshInterval: 30,
    initialFilters: {
      sports: selectedSports,
      confidence_min: confidenceRange[0],
      confidence_max: confidenceRange[1],
      edge_min: edgeRange[0],
      edge_max: edgeRange[1]
    }
  });

  // Quick filter presets for Phase 4.1
  const filterPresets = [
    { 
      name: 'High Value', 
      icon: Star, 
      confidenceMin: 80, 
      edgeMin: 8,
      description: 'Elite opportunities' 
    },
    { 
      name: 'Premium Only', 
      icon: DollarSign, 
      confidenceMin: 70, 
      edgeMin: 5,
      description: 'Premium confidence' 
    },
    { 
      name: 'Value Plays', 
      icon: Target, 
      confidenceMin: 60, 
      edgeMin: 2,
      description: 'Value opportunities' 
    },
    { 
      name: 'Arbitrage', 
      icon: TrendingUp, 
      confidenceMin: 50, 
      edgeMin: 0,
      description: 'Arbitrage opportunities',
      arbitrageOnly: true 
    }
  ];

  // Debounced search query for Phase 4.1
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter opportunities based on current filters
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const matchesSearch = !debouncedSearchQuery || 
        opp.player.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.market.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        opp.team.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      const matchesSports = selectedSports.length === 0 || selectedSports.includes(opp.sport);
      const matchesConfidence = opp.confidence >= confidenceRange[0] && opp.confidence <= confidenceRange[1];
      const matchesEdge = opp.edge >= edgeRange[0] && opp.edge <= edgeRange[1];
      const matchesArbitrage = !showArbitrageOnly || opp.hasArbitrage;
      const matchesBookmakers = !opp.numBookmakers || opp.numBookmakers >= minBookmakers;
      const matchesSharpMoney = selectedSharpMoney.length === 0 || selectedSharpMoney.includes(opp.sharpMoney);
      
      return matchesSearch && matchesSports && matchesConfidence && matchesEdge && 
             matchesArbitrage && matchesBookmakers && matchesSharpMoney;
    });
  }, [opportunities, debouncedSearchQuery, selectedSports, confidenceRange, edgeRange, 
      showArbitrageOnly, minBookmakers, selectedSharpMoney]);

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const VIRTUALIZATION_THRESHOLD = 20;
  const shouldVirtualize = filteredOpportunities.length > VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: filteredOpportunities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    enabled: shouldVirtualize,
  });

  // Handle preset application
  const applyPreset = (preset: typeof filterPresets[0]) => {
    setSelectedPreset(preset.name);
    setConfidenceRange([preset.confidenceMin, 100]);
    setEdgeRange([preset.edgeMin, 20]);
    if ('arbitrageOnly' in preset && preset.arbitrageOnly) {
      setShowArbitrageOnly(true);
    }
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (opportunityId: string, isBookmarked: boolean) => {
    try {
      const opportunity = opportunities.find(o => o.id === opportunityId);
      if (!opportunity) return;
      await bookmarkOpportunity(opportunityId, opportunity, !isBookmarked);
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        enhancedLogger.error('PropFinderDashboard', 'handleBookmarkToggle', 'Failed to toggle bookmark', undefined, error as Error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading PropFinder opportunities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-400 text-xl mb-4">Error: {error}</div>
        <button 
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header with Stats */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                PropFinder 
                <span className="text-2xl">🎯</span>
                {isAutoRefreshEnabled && (
                  <span className="text-sm bg-green-600 px-2 py-1 rounded-full">LIVE</span>
                )}
              </h1>
              <p className="text-gray-400">Elite prop betting opportunities with multi-bookmaker best lines</p>
            </div>
            
            {stats && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{stats.total_opportunities}</div>
                  <div className="text-xs text-gray-400">Total Opps</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{stats.avg_confidence.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Avg Confidence</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{stats.max_edge.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Max Edge</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search players, markets, or teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={toggleAutoRefresh}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isAutoRefreshEnabled 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              🔄 Auto Refresh
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-6">
              {/* Quick Filter Presets */}
              <div>
                <label className="block text-sm font-medium mb-3">Quick Filters</label>
                <div className="flex flex-wrap gap-3">
                  {filterPresets.map((preset) => {
                    const IconComponent = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          selectedPreset === preset.name
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm font-medium">{preset.name}</span>
                        <span className="text-xs text-gray-400">({preset.description})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Sports Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sports</label>
                  <div className="space-y-2">
                    {['NBA', 'MLB', 'NFL', 'NHL'].map(sport => (
                      <label key={sport} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSports.includes(sport)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSports([...selectedSports, sport]);
                            } else {
                              setSelectedSports(selectedSports.filter(s => s !== sport));
                            }
                          }}
                          className="rounded bg-gray-700 border-gray-600"
                        />
                        <span className="text-sm">{getSportIcon(sport)} {sport}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Confidence Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confidence: {confidenceRange[0]}% - {confidenceRange[1]}%
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={confidenceRange[0]}
                      onChange={(e) => setConfidenceRange([Number(e.target.value), confidenceRange[1]])}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={confidenceRange[1]}
                      onChange={(e) => setConfidenceRange([confidenceRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Edge Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Edge: {edgeRange[0]}% - {edgeRange[1]}%
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="-5"
                      max="20"
                      step="1"
                      value={edgeRange[0]}
                      onChange={(e) => setEdgeRange([Number(e.target.value), edgeRange[1]])}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="range"
                      min="-5"
                      max="20"
                      step="1"
                      value={edgeRange[1]}
                      onChange={(e) => setEdgeRange([edgeRange[0], Number(e.target.value)])}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Phase 1.2 Enhanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-700">
                {/* Arbitrage Filter */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showArbitrageOnly}
                      onChange={(e) => setShowArbitrageOnly(e.target.checked)}
                      className="rounded bg-gray-700 border-gray-600"
                    />
                    <span className="text-sm font-medium">🎯 Arbitrage Opportunities Only</span>
                  </label>
                </div>

                {/* Minimum Bookmakers */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min Bookmakers: {minBookmakers}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={minBookmakers}
                    onChange={(e) => setMinBookmakers(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sharp Money Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sharp Money</label>
                  <div className="space-y-1">
                    {['heavy', 'moderate', 'light'].map(level => (
                      <label key={level} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSharpMoney.includes(level)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSharpMoney([...selectedSharpMoney, level]);
                            } else {
                              setSelectedSharpMoney(selectedSharpMoney.filter(l => l !== level));
                            }
                          }}
                          className="rounded bg-gray-700 border-gray-600"
                        />
                        <span className="text-xs capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-400">
            Showing {filteredOpportunities.length} of {opportunities.length} opportunities
          </p>
          {shouldVirtualize && (
            <div className="text-sm text-blue-400 flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Virtualized rendering active
            </div>
          )}
        </div>

        {/* Enhanced Data Table */}
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <div className="text-xl mb-2">No opportunities match your current filters</div>
            <div className="text-sm">Try adjusting your filters or search criteria</div>
          </div>
        ) : (
          <>
            {/* Enhanced Table Header */}
            <div className="grid grid-cols-8 gap-4 px-4 py-3 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-300">
              <div>Player</div>
              <div>Market & Line</div>
              <div>Best Odds</div>
              <div>Confidence</div>
              <div>Edge/Value</div>
              <div>Bookmakers</div>
              <div>Insights</div>
              <div>Actions</div>
            </div>
            
            {/* Enhanced Table Body */}
            {shouldVirtualize ? (
              <div
                ref={parentRef}
                className="h-96 overflow-auto"
                style={{ contain: 'strict' }}
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const opportunity = filteredOpportunities[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="grid grid-cols-8 gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center border-b border-gray-700"
                      >
                        <OpportunityRow 
                          opportunity={opportunity} 
                          onBookmarkToggle={handleBookmarkToggle}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="grid grid-cols-8 gap-4 px-4 py-3 hover:bg-gray-800 transition-colors items-center">
                    <OpportunityRow 
                      opportunity={opportunity} 
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Enhanced Opportunity row component with Phase 1.2 features
const OpportunityRow: React.FC<{ 
  opportunity: PropOpportunity; 
  onBookmarkToggle: (id: string, isBookmarked: boolean) => void;
}> = ({ opportunity, onBookmarkToggle }) => {
  const [isFavorited, setIsFavorited] = useState(opportunity.isBookmarked || false);

  const handleBookmarkClick = () => {
    const newState = !isFavorited;
    setIsFavorited(newState);
    onBookmarkToggle(opportunity.id, opportunity.isBookmarked);
  };

  return (
    <>
      {/* Enhanced Player Column with Avatar and Team */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {opportunity.player.split(' ').map(n => n[0]).join('')}
          </div>
          {opportunity.alertTriggered && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div>
          <div className="font-medium text-white">{opportunity.player}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span>{getSportIcon(opportunity.sport)}</span>
            <span>{opportunity.team}</span>
            <span className="mx-1">vs</span>
            <span>{opportunity.opponent}</span>
          </div>
        </div>
      </div>
      
      {/* Enhanced Market & Line Column */}
      <div className="space-y-1">
        <div className="font-medium text-white">{opportunity.market}</div>
        <div className="text-sm text-blue-400">
          {opportunity.pick.toUpperCase()} {opportunity.line}
        </div>
        <div className="text-xs text-gray-400">
          {opportunity.timeToGame}
        </div>
      </div>
      
      {/* Best Odds Column with Best Book */}
      <div className="space-y-1">
        <div className="font-bold text-lg text-white">
          {formatOdds(opportunity.odds)}
        </div>
        {opportunity.bestBookmaker && (
          <div className="text-xs text-green-400">
            Best: {opportunity.bestBookmaker}
          </div>
        )}
        {opportunity.oddsSpread && opportunity.oddsSpread > 10 && (
          <div className="text-xs text-yellow-400">
            Spread: {opportunity.oddsSpread}
          </div>
        )}
      </div>
      
      {/* Enhanced Confidence Column */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${getConfidenceColor(opportunity.confidence)}`}>
            {Math.round(opportunity.confidence)}%
          </div>
        </div>
        <div className="text-xs text-gray-400">
          AI: {opportunity.aiProbability.toFixed(1)}%
        </div>
      </div>
      
      {/* Enhanced Edge/Value Column */}
      <div className="space-y-1">
        <div className={`font-bold text-lg ${getEdgeColor(opportunity.edge)}`}>
          {opportunity.edge > 0 ? '+' : ''}{opportunity.edge.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400">
          Value: ${opportunity.projectedValue.toFixed(2)}
        </div>
        {opportunity.hasArbitrage && (
          <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold">
            ARB {opportunity.arbitrageProfitPct?.toFixed(1)}%
          </div>
        )}
      </div>
      
      {/* Phase 1.2 - Bookmakers Column */}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium">
            {opportunity.numBookmakers || opportunity.bookmakers?.length || 1}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {opportunity.bookmakers?.slice(0, 2).map(book => book.name).join(', ')}
          {(opportunity.bookmakers?.length || 0) > 2 && '...'}
        </div>
        {opportunity.lineSpread && opportunity.lineSpread > 0.5 && (
          <div className="text-xs text-yellow-400">
            Line Spread: {opportunity.lineSpread.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Insights Column */}
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1">
          {opportunity.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-xs text-gray-400">
          Sharp: {opportunity.sharpMoney}
        </div>
      </div>
      
      {/* Enhanced Actions Column */}
      <div className="flex items-center gap-2">
        <Heart
          onClick={handleBookmarkClick}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        />
        {opportunity.edge > 10 && (
          <div className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full font-bold">
            🔥 HOT
          </div>
        )}
        {opportunity.hasArbitrage && (
          <div className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-bold">
            💎 ARB
          </div>
        )}
      </div>
    </>
  );
};

export default PropFinderDashboard;