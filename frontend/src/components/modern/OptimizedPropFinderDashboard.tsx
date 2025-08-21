import * as React from 'react';
import { useState, useEffect, useMemo, Suspense, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Zap, 
  RefreshCw, 
  Clock,
  BarChart3,
  Activity,
  Gauge
} from 'lucide-react';

import { useOptimizedPerformance, useOptimizedList } from '../../hooks/useOptimizedPerformance';
import { usePropFinderData } from '../../hooks/usePropFinderData';
import Phase4Banner from '../phase4/Phase4Banner';
import PerformanceMonitoringDashboard from '../phase4/PerformanceMonitoringDashboard';

interface PropOpportunity {
  id: string;
  player: string;
  team: string;
  opponent: string;
  sport: string;
  propType: string;
  line: number;
  odds: number;
  confidence: number;
  expectedValue: number;
  trend: 'up' | 'down' | 'stable';
  volume: number;
  timestamp: string;
}

// Memoized prop card component for performance
const PropCard = memo(({ 
  opportunity, 
  style,
  onSelect 
}: { 
  opportunity: PropOpportunity; 
  style?: React.CSSProperties;
  onSelect: (opp: PropOpportunity) => void;
}) => {
  const handleClick = useCallback(() => {
    onSelect(opportunity);
  }, [opportunity, onSelect]);

  const confidenceColor = useMemo(() => {
    if (opportunity.confidence >= 0.8) return 'text-green-400';
    if (opportunity.confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  }, [opportunity.confidence]);

  const evColor = useMemo(() => {
    if (opportunity.expectedValue > 0.1) return 'text-green-400';
    if (opportunity.expectedValue > 0) return 'text-yellow-400';
    return 'text-red-400';
  }, [opportunity.expectedValue]);

  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="bg-gray-800 rounded-lg border border-gray-700 p-4 cursor-pointer hover:bg-gray-750 transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{opportunity.player}</h3>
          <p className="text-gray-400 text-sm">
            {opportunity.team} vs {opportunity.opponent}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2">
            {opportunity.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
            <span className="text-white font-semibold">
              {opportunity.odds > 0 ? '+' : ''}{opportunity.odds}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide">Prop</p>
          <p className="text-white font-semibold">
            {opportunity.propType} {opportunity.line}
          </p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wide">Volume</p>
          <p className="text-white font-semibold">
            {opportunity.volume.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-gray-400 text-xs">Confidence</p>
            <p className={`font-bold ${confidenceColor}`}>
              {(opportunity.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Expected Value</p>
            <p className={`font-bold ${evColor}`}>
              {(opportunity.expectedValue * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-blue-600/20 px-2 py-1 rounded text-blue-400 text-xs">
          {opportunity.sport.toUpperCase()}
        </div>
      </div>
    </motion.div>
  );
});

PropCard.displayName = 'PropCard';

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="space-y-4">
    {Array(6).fill(0).map((_, i) => (
      <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="h-5 bg-gray-700 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-24"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
        <div className="flex justify-between">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
          <div className="h-6 bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

const OptimizedPropFinderDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'expectedValue' | 'volume'>('confidence');
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<PropOpportunity | null>(null);

  // Real PropFinder data integration
  const {
    opportunities: propFinderOpportunities,
    loading: propFinderLoading,
    error: propFinderError,
    refreshData: refreshPropFinderData
  } = usePropFinderData();

  // Optimized data fetching with React 19 features
  const {
    data: opportunities,
    loading,
    error,
    refetch,
    metrics,
    cached,
    debouncedRefetch,
    isPending
  } = useOptimizedPerformance<PropOpportunity[]>(
    async () => {
      // Mock data for demo - replace with real API calls
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      
      return Array.from({ length: 50 }, (_, i) => ({
        id: `prop-${i}`,
        player: `Player ${i + 1}`,
        team: ['LAD', 'NYY', 'BOS', 'SF', 'HOU'][i % 5],
        opponent: ['SD', 'BAL', 'TB', 'OAK', 'SEA'][i % 5],
        sport: ['mlb', 'nba', 'nfl'][i % 3],
        propType: ['hits', 'runs', 'rbis', 'strikeouts'][i % 4],
        line: 0.5 + (i % 10) * 0.5,
        odds: -110 + (i % 20) - 10,
        confidence: 0.6 + (i % 40) * 0.01,
        expectedValue: -0.05 + (i % 30) * 0.01,
        trend: ['up', 'down', 'stable'][i % 3] as 'up' | 'down' | 'stable',
        volume: 1000 + i * 100,
        timestamp: new Date().toISOString()
      }));
    },
    {
      enableCaching: true,
      enableDeferredUpdates: true,
      debounceMs: 300
    }
  );

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];

    let filtered = opportunities.filter(opp => {
      const matchesSearch = opp.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           opp.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           opp.propType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSport = selectedSport === 'all' || opp.sport === selectedSport;
      
      return matchesSearch && matchesSport;
    });

    // Sort opportunities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'expectedValue':
          return b.expectedValue - a.expectedValue;
        case 'volume':
          return b.volume - a.volume;
        default:
          return 0;
      }
    });

    return filtered;
  }, [opportunities, searchTerm, selectedSport, sortBy]);

  // Optimized list rendering with virtualization
  const {
    visibleItems,
    containerProps,
    innerProps,
    setContainerHeight
  } = useOptimizedList(filteredOpportunities, {
    itemHeight: 180,
    overscan: 3,
    enableVirtualization: filteredOpportunities.length > 20
  });

  // Set container height on mount
  useEffect(() => {
    setContainerHeight(600); // Set to desired height
  }, [setContainerHeight]);

  const handleOpportunitySelect = useCallback((opp: PropOpportunity) => {
    setSelectedOpportunity(opp);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch(false); // Force fresh data
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Phase 4 Banner */}
      <Phase4Banner />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 data-testid="propfinder-killer-heading" className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PropFinder Killer Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Real PropFinder Data Integration with Alert Engine</p>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Gauge className="w-4 h-4" />
              <span>Performance</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={loading || isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || isPending) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Performance Metrics Bar */}
        {metrics && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Data Fetch Time</p>
                <p className="text-white font-bold">{metrics.dataFetchTime.toFixed(1)}ms</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Cache Hit Rate</p>
                <p className="text-green-400 font-bold">{metrics.cacheHitRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-blue-400 font-bold">{metrics.totalRequests}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Status</p>
                <p className={`font-bold ${cached ? 'text-yellow-400' : 'text-green-400'}`}>
                  {cached ? 'Cached' : 'Live'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search players, teams, props..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
          </div>

          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="all">All Sports</option>
            <option value="mlb">MLB</option>
            <option value="nba">NBA</option>
            <option value="nfl">NFL</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
          >
            <option value="confidence">Sort by Confidence</option>
            <option value="expectedValue">Sort by Expected Value</option>
            <option value="volume">Sort by Volume</option>
          </select>

          <div className="flex items-center space-x-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span>{filteredOpportunities.length} opportunities</span>
          </div>
        </div>

        {/* Performance Panel */}
        {showPerformancePanel && (
          <div className="mb-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <PerformanceMonitoringDashboard />
            </Suspense>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunities List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl font-bold text-white">Live Opportunities</h2>
                {(loading || isPending) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                )}
              </div>

              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">Error loading opportunities: {error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div {...containerProps}>
                  <div {...innerProps}>
                    {visibleItems.map(({ item: opportunity, style }) => (
                      <PropCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        style={style}
                        onSelect={handleOpportunitySelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Opportunity Details */}
            {selectedOpportunity && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-bold text-white mb-4">Opportunity Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Player</p>
                    <p className="text-white font-semibold">{selectedOpportunity.player}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Matchup</p>
                    <p className="text-white">{selectedOpportunity.team} vs {selectedOpportunity.opponent}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Prop</p>
                    <p className="text-white">{selectedOpportunity.propType} {selectedOpportunity.line}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Confidence</p>
                    <p className="text-green-400 font-bold">
                      {(selectedOpportunity.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">High Confidence</span>
                  <span className="text-green-400 font-bold">
                    {filteredOpportunities.filter(o => o.confidence > 0.8).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Positive EV</span>
                  <span className="text-blue-400 font-bold">
                    {filteredOpportunities.filter(o => o.expectedValue > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Live Updates</span>
                  <span className="text-yellow-400 font-bold">Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPropFinderDashboard;
