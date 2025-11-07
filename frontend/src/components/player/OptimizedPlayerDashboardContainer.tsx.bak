/**
 * OptimizedPlayerDashboardContainer - Enhanced version with real-time data optimization
 * Integrates with the optimized real-time data service for improved performance
 * 
 * Key Features:
 * - Real-time WebSocket updates
 * - Intelligent caching and fallback
 * - Performance monitoring
 * - Data quality indicators
 * - Circuit breaker pattern
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { 
  useOptimizedPlayerData, 
  useOptimizedPlayerSearch, 
  useOptimizedServiceHealth 
} from '../../hooks/useOptimizedPlayerData';
import { 
  Brain, TrendingUp, History, User, Search, AlertCircle, 
  CheckCircle, WifiOff, Wifi, RefreshCw, Activity, Zap,
  Clock, Server, Eye, X
} from 'lucide-react';
import PlayerOverview from './PlayerOverview';
import PlayerPropHistory from './PlayerPropHistory';
import PlayerStatTrends from './PlayerStatTrends';
import AIExplanationPanel from '../ai/AIExplanationPanel';
import { Player } from './PlayerDashboardContainer';

interface OptimizedPlayerDashboardContainerProps {
  playerId?: string;
  sport?: string;
  onPlayerChange?: (playerId: string) => void;
  onClose?: () => void;
  enableRealTimeUpdates?: boolean;
  showPerformanceMetrics?: boolean;
}

export const OptimizedPlayerDashboardContainer: React.FC<OptimizedPlayerDashboardContainerProps> = ({
  playerId: initialPlayerId,
  sport = 'MLB',
  onPlayerChange,
  onClose,
  enableRealTimeUpdates = true,
  showPerformanceMetrics = false,
}) => {
  const [playerId, setPlayerId] = useState<string>(initialPlayerId || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'history' | 'ai'>('overview');
  const [showPerformancePanel, setShowPerformancePanel] = useState(showPerformanceMetrics);
  const [showDataQualityInfo, setShowDataQualityInfo] = useState(false);

  // Optimized player data hook
  const {
    player,
    loading,
    error,
    isStale,
    isRealTime,
    lastUpdated,
    dataQuality,
    dataSources,
    refresh,
    clearError,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    responseTime,
    cacheHit
  } = useOptimizedPlayerData({
    playerId,
    sport,
    enableRealTimeUpdates,
    fallbackToCache: true
  });

  // Optimized search hook
  const {
    searchResults,
    searchLoading,
    searchError,
    searchPlayers,
    clearSearch
  } = useOptimizedPlayerSearch();

  // Service health monitoring
  const { healthMetrics, overallHealth } = useOptimizedServiceHealth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(!playerId);

  // Create stable references to prevent infinite loops
  const searchPlayersRef = useRef(optimizedSearch.searchPlayers);
  searchPlayersRef.current = optimizedSearch.searchPlayers;

  const clearSearchRef = useRef(optimizedSearch.clearSearch);
  clearSearchRef.current = optimizedSearch.clearSearch;

  // Handle player selection
  const handlePlayerSelect = useCallback(
    (selectedPlayerId: string) => {
      setPlayerId(selectedPlayerId);
      setShowSearch(false);
      setSearchQuery('');
      clearSearchRef.current();
      onPlayerChange?.(selectedPlayerId);
    },
    [onPlayerChange]
  );

  // Search effect
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const debounceTimeout = setTimeout(() => {
        searchPlayersRef.current(searchQuery, sport, 10);
      }, 300);
      return () => clearTimeout(debounceTimeout);
    } else {
      clearSearchRef.current();
    }
  }, [searchQuery, sport]);

  // Data quality color indicator
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-orange-400';
      default: return 'text-slate-400';
    }
  };

  // Health status indicator
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  // Show search interface when no playerId is provided
  if (!playerId || playerId.trim() === '') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <div className='max-w-4xl mx-auto px-4 py-8'>
          {/* Header with service status */}
          <div className='flex items-center justify-between mb-8'>
            <div className='text-center flex-1'>
              <h1 className='text-3xl font-bold text-white mb-4'>Optimized Player Research</h1>
              <p className='text-slate-300'>Enhanced with real-time data and intelligent caching</p>
            </div>
            
            {/* Service health indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 ${getHealthColor(overallHealth)}`}>
              {overallHealth === 'healthy' ? <Wifi className="w-4 h-4" /> : 
               overallHealth === 'degraded' ? <Activity className="w-4 h-4" /> : 
               <WifiOff className="w-4 h-4" />}
              <span className='text-sm font-medium capitalize'>{overallHealth}</span>
            </div>
          </div>

          {/* Search Interface */}
          <div className='bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-8'>
            <div className='relative'>
              <div className='relative'>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type='text'
                  placeholder='Search for players... (optimized with real-time data)'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full bg-slate-700 text-white border border-slate-600 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Error */}
              {searchError && (
                <div className='mt-2 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-300 text-sm'>
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {searchError}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className='absolute top-full left-0 right-0 bg-slate-700 border border-slate-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10 shadow-lg'>
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handlePlayerSelect(result.id)}
                      className='w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors text-white border-b border-slate-600 last:border-b-0'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>{result.name}</div>
                          <div className='text-sm text-slate-300'>{result.team} • {result.position}</div>
                        </div>
                        <div className='text-xs text-slate-400'>
                          {result.active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search stats */}
            {searchQuery.length >= 2 && (
              <div className='mt-4 text-sm text-slate-400'>
                {searchLoading ? 'Searching...' : `Found ${searchResults.length} players`}
              </div>
            )}
          </div>

          {/* Service Status Panel */}
          {showPerformancePanel && (
            <div className='bg-slate-800/30 rounded-lg p-4 mb-6'>
              <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                <Server className="w-5 h-5" />
                Service Health
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {Array.from(healthMetrics.entries()).map(([service, metrics]) => (
                  <div key={service} className='bg-slate-700/50 rounded p-3'>
                    <div className='font-medium text-white'>{service}</div>
                    <div className='text-sm text-slate-300'>
                      Response: {metrics.responseTime || 'N/A'}ms
                    </div>
                    <div className='text-sm text-slate-300'>
                      Success: {((metrics.successRate || 0) * 100).toFixed(1)}%
                    </div>
                    <div className='text-sm text-slate-300'>
                      Failures: {metrics.consecutiveFailures || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Access */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div className='bg-slate-800/30 rounded-lg p-4 text-center'>
              <div className='text-slate-400 text-sm mb-2'>Real-Time Features</div>
              <div className='text-white'>Live updates, intelligent caching, performance monitoring</div>
            </div>
            <div className='bg-slate-800/30 rounded-lg p-4 text-center'>
              <div className='text-slate-400 text-sm mb-2'>Data Quality</div>
              <div className='text-white'>Multi-source aggregation with validation</div>
            </div>
            <div className='bg-slate-800/30 rounded-lg p-4 text-center'>
              <div className='text-slate-400 text-sm mb-2'>Performance</div>
              <div className='text-white'>Circuit breakers and fallback systems</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with enhanced information
  if (error) {
    return (
      <div className='flex items-center justify-center min-h-96 bg-slate-900'>
        <div className='text-center max-w-md'>
          <div className='text-red-400 text-2xl mb-4'>⚠️</div>
          <h3 className='text-xl font-semibold text-white mb-2'>Dashboard Error</h3>
          <p className='text-slate-300 mb-4'>{error}</p>
          
          {/* Additional error context */}
          <div className='bg-slate-800/50 rounded-lg p-4 mb-6 text-left'>
            <div className='text-sm text-slate-400 space-y-1'>
              <div>Data Quality: <span className={`font-medium ${getQualityColor(dataQuality)}`}>{dataQuality}</span></div>
              <div>Service Health: <span className={`font-medium ${getHealthColor(overallHealth)}`}>{overallHealth}</span></div>
              {responseTime && <div>Last Response: {responseTime}ms</div>}
              {dataSources.length > 0 && <div>Sources: {dataSources.join(', ')}</div>}
            </div>
          </div>

          <div className='flex gap-3 justify-center'>
            <button
              onClick={refresh}
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2'
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <button
              onClick={clearError}
              className='bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors'
            >
              Clear Error
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
      {/* Enhanced Header with real-time indicators */}
      <div className='bg-slate-800 border-b border-slate-700 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <h1 className='text-xl font-bold text-white'>Optimized Player Dashboard</h1>
            
            {/* Real-time status indicators */}
            <div className='flex items-center gap-3'>
              {/* Real-time status */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                isRealTime ? 'bg-green-900/50 text-green-300' : 'bg-slate-700 text-slate-400'
              }`}>
                {isRealTime ? <Zap className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isRealTime ? 'Live' : 'Cached'}
              </div>

              {/* Data quality indicator */}
              <button
                onClick={() => setShowDataQualityInfo(!showDataQualityInfo)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${getQualityColor(dataQuality)} bg-slate-700 hover:bg-slate-600`}
              >
                <Eye className="w-3 h-3" />
                {dataQuality} quality
              </button>

              {/* Staleness indicator */}
              {isStale && (
                <div className='flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-900/50 text-yellow-300'>
                  <AlertCircle className="w-3 h-3" />
                  Stale
                </div>
              )}

              {/* Cache hit indicator */}
              {cacheHit && (
                <div className='flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300'>
                  <Zap className="w-3 h-3" />
                  Fast
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-3'>
            {/* Performance metrics toggle */}
            <button
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              className='text-slate-400 hover:text-white transition-colors'
              title="Toggle performance metrics"
            >
              <Activity className="w-5 h-5" />
            </button>

            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={loading}
              className='text-slate-400 hover:text-white transition-colors disabled:opacity-50'
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close button */}
            {onClose && (
              <button
                onClick={onClose}
                className='text-slate-400 hover:text-white transition-colors'
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Data quality info panel */}
        {showDataQualityInfo && (
          <div className='mt-4 p-4 bg-slate-700/50 rounded-lg'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <div className='text-slate-400'>Last Updated</div>
                <div className='text-white'>{lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}</div>
              </div>
              <div>
                <div className='text-slate-400'>Response Time</div>
                <div className='text-white'>{responseTime ? `${responseTime}ms` : 'N/A'}</div>
              </div>
              <div>
                <div className='text-slate-400'>Data Sources</div>
                <div className='text-white'>{dataSources.length > 0 ? dataSources.join(', ') : 'Unknown'}</div>
              </div>
              <div>
                <div className='text-slate-400'>Service Health</div>
                <div className={`font-medium ${getHealthColor(overallHealth)}`}>{overallHealth}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance metrics panel */}
      {showPerformancePanel && (
        <div className='bg-slate-800/30 border-b border-slate-700 px-6 py-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-slate-700/50 rounded p-3'>
              <div className='text-slate-400 text-sm'>Response Time</div>
              <div className='text-xl font-bold text-white'>{responseTime || 0}ms</div>
            </div>
            <div className='bg-slate-700/50 rounded p-3'>
              <div className='text-slate-400 text-sm'>Cache Status</div>
              <div className='text-xl font-bold text-white'>{cacheHit ? 'Hit' : 'Miss'}</div>
            </div>
            <div className='bg-slate-700/50 rounded p-3'>
              <div className='text-slate-400 text-sm'>Data Quality</div>
              <div className={`text-xl font-bold ${getQualityColor(dataQuality)}`}>{dataQuality}</div>
            </div>
            <div className='bg-slate-700/50 rounded p-3'>
              <div className='text-slate-400 text-sm'>Real-time</div>
              <div className='text-xl font-bold text-white'>{isRealTime ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='max-w-5xl mx-auto px-4 py-8' aria-busy={loading} aria-live='polite'>
        {/* Player Overview - always shown */}
        <PlayerOverview player={player || undefined} loading={loading} />

        {/* Tab Navigation */}
        <div className='bg-slate-800/50 backdrop-blur rounded-lg border border-slate-700 mb-6'>
          <div className='border-b border-slate-700'>
            <nav className='flex space-x-8 px-6'>
              {[
                { id: 'overview', label: 'Stats & Performance', icon: User },
                { id: 'trends', label: 'Trends & Analysis', icon: TrendingUp },
                { id: 'history', label: 'Prop History', icon: History },
                { id: 'ai', label: 'AI Insights', icon: Brain },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {/* Real-time indicator for active tab */}
                    {activeTab === tab.id && isRealTime && (
                      <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className='p-6'>
            {activeTab === 'overview' && (
              <div className='space-y-6'>
                <div className='text-slate-300'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-white'>Season Statistics & Recent Performance</h3>
                    {/* Data freshness indicator */}
                    <div className='text-sm text-slate-400'>
                      {lastUpdated && `Updated: ${lastUpdated.toLocaleTimeString()}`}
                    </div>
                  </div>
                  
                  {player ? (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Games Played</div>
                        <div className='text-xl font-bold text-white'>{player.season_stats?.games_played || 0}</div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Batting Avg</div>
                        <div className='text-xl font-bold text-white'>{player.season_stats?.batting_average?.toFixed(3) || '.000'}</div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>Home Runs</div>
                        <div className='text-xl font-bold text-white'>{player.season_stats?.home_runs || 0}</div>
                      </div>
                      <div className='bg-slate-700/50 rounded-lg p-4'>
                        <div className='text-slate-400 text-sm'>RBIs</div>
                        <div className='text-xl font-bold text-white'>{player.season_stats?.rbis || 0}</div>
                      </div>
                    </div>
                  ) : (
                    <div className='text-slate-400'>No player data available</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'trends' && (
              <PlayerStatTrends player={player || undefined} loading={loading} />
            )}

            {activeTab === 'history' && (
              <PlayerPropHistory player={player || undefined} loading={loading} />
            )}

            {activeTab === 'ai' && (
              <AIExplanationPanel
                context={player ? `Player: ${player.name} (${player.position}, ${player.team})
Season Stats: ${JSON.stringify(player.season_stats, null, 2)}
Sport: ${player.sport}
Active: ${player.active}
Data Quality: ${dataQuality}
Real-time: ${isRealTime}
Data Sources: ${dataSources.join(', ')}
${player.injury_status ? `Injury Status: ${player.injury_status}` : ''}` : 'No player data available'}
                question="Please analyze this player's performance, trends, and potential prop opportunities. Include insights about recent form, matchup considerations, data quality, and any notable patterns from the real-time data."
                playerIds={player ? [player.id] : undefined}
                sport={sport}
                className="min-h-[500px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedPlayerDashboardContainer;
