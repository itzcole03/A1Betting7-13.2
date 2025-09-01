import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, Star, DollarSign, BarChart3, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { enhancedLogger } from '../../services/EnhancedLogger';

interface CheatsheetProp {
  id: string;
  player: {
    name: string;
    team: string;
    position: string;
  };
  prop: string;
  line: number;
  odds: number;
  pfRating: number;
  confidence: number;
  valueRating: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  recentHits: string;
  keyStats: {
    l5avg: number;
    l10avg: number;
    vs_opponent: number;
    at_venue: number;
  };
  reasonsToPlay: string[];
  reasonsToAvoid: string[];
  projectedValue: number;
  recommendedStake: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CheatsheetViewProps {
  data?: CheatsheetProp[];
  selectedSport?: string;
}

const CheatsheetView: React.FC<CheatsheetViewProps> = ({ 
  data = [],
  selectedSport = 'MLB'
}) => {
  const [filterByValue, setFilterByValue] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'confidence' | 'value'>('rating');
  const [cheatsheets, setCheatsheets] = useState<CheatsheetProp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cheatsheets data from API
  const loadCheatsheetsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cheatsheets?sport=${selectedSport}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cheatsheets: ${response.status}`);
      }
      
      const result = await response.json();
      setCheatsheets(result.cheatsheets || []);
    } catch (err) {
      enhancedLogger.error(
        'CheatsheetView',
        'loadCheatsheetsData',
        'Failed to load cheatsheets data',
        { selectedSport, error: err instanceof Error ? err.message : 'Unknown error' },
        err instanceof Error ? err : undefined
      );
      setError(err instanceof Error ? err.message : 'Failed to load cheatsheets');
      // Set empty array instead of falling back to mock data
      setCheatsheets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  // Load data on mount and when sport changes
  useEffect(() => {
    loadCheatsheetsData();
  }, [selectedSport, loadCheatsheetsData]);

  // Use provided data or loaded data
  const currentData = data.length > 0 ? data : cheatsheets;

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = currentData;
    
    if (filterByValue !== 'ALL') {
      filtered = filtered.filter(item => item.valueRating === filterByValue);
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.pfRating - a.pfRating;
        case 'confidence':
          return b.confidence - a.confidence;
        case 'value':
          return b.projectedValue - a.projectedValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [currentData, filterByValue, sortBy]);

  const getValueColor = (rating: string) => {
    switch (rating) {
      case 'HIGH': return 'bg-green-600 text-white';
      case 'MEDIUM': return 'bg-yellow-600 text-black';
      case 'LOW': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'DOWN': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStakeColor = (stake: string) => {
    switch (stake) {
      case 'HIGH': return 'text-green-400 font-bold';
      case 'MEDIUM': return 'text-yellow-400 font-medium';
      case 'LOW': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">PropFinder Cheatsheets</h1>
            <p className="text-gray-400">Quick insights for high-value betting opportunities</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadCheatsheetsData}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <select
              value={filterByValue}
              onChange={(e) => setFilterByValue(e.target.value as 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW')}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="ALL">All Value</option>
              <option value="HIGH">High Value</option>
              <option value="MEDIUM">Medium Value</option>
              <option value="LOW">Low Value</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'confidence' | 'value')}
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2"
            >
              <option value="rating">PF Rating</option>
              <option value="confidence">Confidence</option>
              <option value="value">Projected Value</option>
            </select>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>Error: {error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-gray-400">Loading cheatsheets...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cheatsheet Cards */}
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <div className="text-xl mb-2">No cheatsheets available</div>
              <div className="text-sm">Try adjusting your filters or check back later</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredData.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">
                            {item.player.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.player.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <span>{item.player.team} {item.player.position}</span>
                            <span>•</span>
                            <span className="text-yellow-400 font-medium">
                              {item.prop} O/U {item.line}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getValueColor(item.valueRating)}`}>
                          {item.valueRating} VALUE
                        </div>
                        <div className="mt-1 flex items-center justify-end space-x-2">
                          <span className="text-2xl font-bold text-white">
                            {item.odds > 0 ? `+${item.odds}` : item.odds}
                          </span>
                          {getTrendIcon(item.trend)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{item.pfRating}</div>
                        <div className="text-xs text-gray-400">PF Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{item.confidence}%</div>
                        <div className="text-xs text-gray-400">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{item.recentHits}</div>
                        <div className="text-xs text-gray-400">Recent Hits</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getStakeColor(item.recommendedStake)}`}>
                          {item.recommendedStake}
                        </div>
                        <div className="text-xs text-gray-400">Rec. Stake</div>
                      </div>
                    </div>

                    {/* Key Stats */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-white font-medium">{item.keyStats.l5avg}</div>
                          <div className="text-xs text-gray-400">L5 Avg</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-white font-medium">{item.keyStats.l10avg}</div>
                          <div className="text-xs text-gray-400">L10 Avg</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-white font-medium">{item.keyStats.vs_opponent}</div>
                          <div className="text-xs text-gray-400">vs OPP</div>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <div className="text-white font-medium">{item.keyStats.at_venue}</div>
                          <div className="text-xs text-gray-400">At Venue</div>
                        </div>
                      </div>
                    </div>

                    {/* Reasons Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reasons to Play */}
                      <div>
                        <h4 className="flex items-center text-sm font-semibold text-green-400 mb-2">
                          <Target className="w-4 h-4 mr-1" />
                          Reasons to Play
                        </h4>
                        <ul className="space-y-1">
                          {item.reasonsToPlay.map((reason, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start">
                              <span className="text-green-400 mr-2">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Reasons to Avoid */}
                      <div>
                        <h4 className="flex items-center text-sm font-semibold text-red-400 mb-2">
                          <Eye className="w-4 h-4 mr-1" />
                          Caution Points
                        </h4>
                        <ul className="space-y-1">
                          {item.reasonsToAvoid.map((reason, idx) => (
                            <li key={idx} className="text-xs text-gray-300 flex items-start">
                              <span className="text-red-400 mr-2">•</span>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-gray-400">Proj. Value:</span>
                          <span className="ml-1 font-bold text-blue-400">
                            {(item.projectedValue * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Updated:</span>
                          <span className="ml-1 text-gray-300">2 mins ago</span>
                        </div>
                      </div>
                      <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Star className="w-4 h-4" />
                        <span>Track Bet</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Showing</span>
            <span className="ml-2 font-semibold text-white">{filteredData.length}</span>
            <span className="text-gray-400"> cheatsheets</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-gray-400">High Value:</span>
              <span className="ml-2 font-semibold text-green-400">
                {filteredData.filter(item => item.valueRating === 'HIGH').length}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Avg Confidence:</span>
              <span className="ml-2 font-semibold text-blue-400">
                {filteredData.length > 0 ? Math.round(filteredData.reduce((sum, item) => sum + item.confidence, 0) / filteredData.length) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheatsheetView;