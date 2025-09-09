/**
 * Positive EV Feed Component
 * 
 * Professional interface for displaying positive expected value betting opportunities.
 * Features real-time updates, filtering, and EV tier badge coloring.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Filter, 
  RefreshCw, 
  Search, 
  AlertCircle,
  BarChart3,
  Clock,
  Target,
  Zap
} from 'lucide-react';

import { 
  EVOpportunity, 
  EVFeedResponse, 
  EVFeedStats,
  SportType, 
  MarketType,
  EVTier,
  EVFeedFilters,
  EV_TIER_COLORS,
  SPORT_INFO,
  MARKET_TYPE_INFO,
  formatOdds,
  formatEVPercent
} from '../types/ev-types';

import { evWebSocketService } from '../services/EVWebSocketService';

interface PositiveEVFeedProps {
  className?: string;
}

const PositiveEVFeed: React.FC<PositiveEVFeedProps> = ({ className = '' }) => {
  // State management
  const [opportunities, setOpportunities] = useState<EVOpportunity[]>([]);
  const [stats, setStats] = useState<EVFeedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<EVFeedFilters>({
    minEV: 3.0,
    sport: SportType.ALL,
    marketType: undefined,
    sourceBook: undefined
  });
  
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  
  // Auto-refresh timer
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch opportunities from API
  const fetchOpportunities = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('min_ev', filters.minEV.toString());
      params.append('sport', filters.sport);
      if (filters.marketType) params.append('market_type', filters.marketType);
      if (filters.sourceBook) params.append('source_book', filters.sourceBook);
      params.append('limit', '200');

      const response = await fetch(`/api/ev/feed?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
      }

      const data: EVFeedResponse = await response.json();
      setOpportunities(data.opportunities);

      // Fetch stats separately
      const statsResponse = await fetch('/api/ev/feed/stats');
      if (statsResponse.ok) {
        const statsData: EVFeedStats = await statsResponse.json();
        setStats(statsData);
      }

    } catch (err) {
      // Log error for debugging
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [filters]);

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isWebSocketConnected) {
        // Use WebSocket for immediate update
        evWebSocketService.forceRefresh();
        // Wait a moment for the update
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Fallback to HTTP refresh
        await fetch('/api/ev/feed/refresh', { method: 'POST' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchOpportunities(false);
      }
    } catch (err) {
      // Handle refresh error silently or show toast notification
      setError(err instanceof Error ? err.message : 'Failed to refresh feed');
    } finally {
      setRefreshing(false);
    }
  }, [fetchOpportunities, isWebSocketConnected]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchOpportunities(false);
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, fetchOpportunities, refreshInterval]);

  // Initial load and WebSocket setup
  useEffect(() => {
    fetchOpportunities();

    // Set up WebSocket connection for real-time updates
    evWebSocketService.connect({
      onOpportunitiesUpdate: (newOpportunities) => {
        setOpportunities(newOpportunities);
      },
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onNewOpportunity: (opportunity) => {
        setOpportunities(prev => [opportunity, ...prev]);
      },
      onOpportunityRemoved: (opportunityId) => {
        setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
      },
      onConnectionChange: (connected) => {
        setIsWebSocketConnected(connected);
      },
      onError: (error) => {
        // Handle WebSocket errors gracefully
        setError(`Connection error: ${error.message}`);
      }
    });

    return () => {
      evWebSocketService.disconnect();
    };
  }, [fetchOpportunities]);

  // Filter opportunities by search query
  const filteredOpportunities = useMemo(() => {
    if (!searchQuery.trim()) return opportunities;
    
    const query = searchQuery.toLowerCase();
    return opportunities.filter(opp => 
      opp.player.toLowerCase().includes(query) ||
      opp.market.toLowerCase().includes(query) ||
      opp.source_book.toLowerCase().includes(query) ||
      opp.game_info.toLowerCase().includes(query)
    );
  }, [opportunities, searchQuery]);

  // EV Badge Component
  const EVBadge: React.FC<{ tier: EVTier; evPercent: number }> = ({ tier, evPercent }) => {
    const colors = EV_TIER_COLORS[tier];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
        <TrendingUp className="w-3 h-3 mr-1" />
        {formatEVPercent(evPercent)}
      </span>
    );
  };

  // Opportunity Card Component
  const OpportunityCard: React.FC<{ opportunity: EVOpportunity }> = ({ opportunity }) => {
    const isExpanded = expandedOpportunity === opportunity.id;
    const sportInfo = SPORT_INFO[opportunity.sport];
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedOpportunity(isExpanded ? null : opportunity.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-2">
                <span className={`text-sm font-medium ${sportInfo.color}`}>
                  {sportInfo.icon} {sportInfo.name}
                </span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{opportunity.source_book}</span>
              </div>
              
              {/* Player and Market */}
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {opportunity.player}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {opportunity.market}
              </p>
              
              {/* Game Info */}
              <p className="text-xs text-gray-500 mb-3">
                {opportunity.game_info}
              </p>
              
              {/* Odds and EV */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Odds:</span>
                    <span className="ml-1 font-medium">{formatOdds(opportunity.market_odds)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Fair:</span>
                    <span className="ml-1 font-medium">{formatOdds(opportunity.our_fair_odds)}</span>
                  </div>
                </div>
                
                <EVBadge tier={opportunity.ev_tier} evPercent={opportunity.ev_percent} />
              </div>
            </div>
          </div>
          
          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-gray-100"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Market Probability:</span>
                    <span className="ml-2 font-medium">{(opportunity.implied_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fair Probability:</span>
                    <span className="ml-2 font-medium">{(opportunity.fair_implied_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>
                    <span className="ml-2 font-medium">{((opportunity.confidence_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume:</span>
                    <span className="ml-2 font-medium">{opportunity.volume_indicator || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Add to Bet Slip
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Filter Panel Component
  const FilterPanel: React.FC = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gray-50 border-b border-gray-200 p-4 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Minimum EV */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min EV %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={filters.minEV}
                onChange={(e) => setFilters(prev => ({ ...prev, minEV: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value as SportType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.values(SportType).map(sport => (
                  <option key={sport} value={sport}>
                    {SPORT_INFO[sport].icon} {SPORT_INFO[sport].name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Market Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Market Type
              </label>
              <select
                value={filters.marketType || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  marketType: e.target.value ? e.target.value as MarketType : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Markets</option>
                {Object.values(MarketType).map(market => (
                  <option key={market} value={market}>
                    {MARKET_TYPE_INFO[market].name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sportsbook Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sportsbook
              </label>
              <select
                value={filters.sourceBook || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  sourceBook: e.target.value || undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Books</option>
                <option value="DraftKings">DraftKings</option>
                <option value="FanDuel">FanDuel</option>
                <option value="BetMGM">BetMGM</option>
                <option value="Caesars">Caesars</option>
                <option value="PointsBet">PointsBet</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">+EV Feed</h1>
                <p className="text-sm text-gray-500">Positive Expected Value Opportunities</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Stats */}
              {stats && (
                <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {stats.total_opportunities} opportunities
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    {formatEVPercent(stats.avg_ev_percent)} avg EV
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Updated {new Date(stats.last_generation_time).toLocaleTimeString()}
                  </div>
                </div>
              )}
              
              {/* Controls */}
              <div className="flex items-center space-x-2">
                {/* Connection Status */}
                <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                  isWebSocketConnected 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1 ${
                    isWebSocketConnected ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  {isWebSocketConnected ? 'Live' : 'Polling'}
                </div>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-md transition-colors ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
                >
                  <Zap className="h-4 w-4" />
                </button>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
                  title="Manual refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md transition-colors ${
                    showFilters 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Toggle filters"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities by player, market, or sportsbook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <FilterPanel />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading opportunities...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Feed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchOpportunities()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Opportunities Found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default PositiveEVFeed;