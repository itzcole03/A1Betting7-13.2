/**
 * Smart Signals Page - Intelligent betting signal detection and analysis
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, TrendingUp, DollarSign, Target, Plus, Eye, BarChart3, Filter, RefreshCw } from 'lucide-react';

// Types
interface SmartSignal {
  id: string;
  sport: string;
  game_id: string;
  player_name: string;
  team?: string;
  opponent?: string;
  market_type: string;
  stat_type: string;
  line: number;
  over_odds: number;
  under_odds: number;
  sportsbook: string;
  overall_score: number;
  signal_strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
  signal_types: string[];
  ev_score: number;
  trend_score: number;
  juice_score: number;
  line_movement_score: number;
  expected_value_percent: number;
  hit_rate_trend: number;
  juice_percent: number;
  line_movement: number;
  rationales: string[];
  component_breakdown: Record<string, unknown>;
  is_qualified: boolean;
  strength_level: string;
  created_at: string;
}

interface SmartSignalsResponse {
  status: string;
  data: {
    signals: SmartSignal[];
    total_count: number;
    qualified_count: number;
    avg_score: number;
    strongest_signal: SmartSignal | null;
    metadata: Record<string, unknown>;
  };
  request_params: Record<string, unknown>;
}

// Utility functions
const getStrengthColor = (strength: string) => {
  switch (strength) {
    case 'very_strong': return 'text-green-600 bg-green-50 border-green-200';
    case 'strong': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-gray-600';
};

const formatOdds = (odds: number) => {
  return odds > 0 ? `+${odds}` : `${odds}`;
};

// Signal Card Component
const SignalCard: React.FC<{ signal: SmartSignal; onAddToParlay: (signal: SmartSignal) => void; onTrackLine: (signal: SmartSignal) => void }> = ({ 
  signal, 
  onAddToParlay, 
  onTrackLine 
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${getStrengthColor(signal.signal_strength)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{signal.player_name}</h3>
            <span className="text-sm text-gray-600">{signal.team} vs {signal.opponent}</span>
          </div>
          <div className="text-sm text-gray-700">
            {signal.stat_type} {signal.market_type === 'over_under' ? 'O/U' : ''} {signal.line}
          </div>
          <div className="text-xs text-gray-500">{signal.sportsbook}</div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(signal.overall_score)}`}>
            {signal.overall_score}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {signal.strength_level}
          </div>
        </div>
      </div>

      {/* Odds */}
      <div className="flex gap-4 mb-3">
        <div className="flex-1 text-center p-2 bg-white rounded border">
          <div className="text-xs text-gray-500">OVER</div>
          <div className="font-medium">{formatOdds(signal.over_odds)}</div>
        </div>
        <div className="flex-1 text-center p-2 bg-white rounded border">
          <div className="text-xs text-gray-500">UNDER</div>
          <div className="font-medium">{formatOdds(signal.under_odds)}</div>
        </div>
      </div>

      {/* Rationales */}
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-700 mb-1">Why this qualifies:</div>
        <div className="flex flex-wrap gap-1">
          {signal.rationales.map((rationale, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-1 text-xs bg-white rounded border text-gray-700"
            >
              {rationale}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onAddToParlay(signal)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          <Plus size={14} />
          Add to Parlay
        </button>
        <button
          onClick={() => onTrackLine(signal)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
        >
          <Eye size={14} />
          Track Line
        </button>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-center text-sm text-gray-600 hover:text-gray-800 py-1 border-t"
      >
        {expanded ? 'Less Details' : 'More Details'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {/* Component Scores */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">EV Score: <span className="font-medium">{signal.ev_score}</span></div>
              <div className="text-gray-600">Expected Value: <span className="font-medium">{signal.expected_value_percent}%</span></div>
            </div>
            <div>
              <div className="text-gray-600">Trend Score: <span className="font-medium">{signal.trend_score}</span></div>
              <div className="text-gray-600">Hit Rate: <span className="font-medium">{(signal.hit_rate_trend * 100).toFixed(1)}%</span></div>
            </div>
            <div>
              <div className="text-gray-600">Juice Score: <span className="font-medium">{signal.juice_score}</span></div>
              <div className="text-gray-600">Vig: <span className="font-medium">{signal.juice_percent}%</span></div>
            </div>
            <div>
              <div className="text-gray-600">Movement Score: <span className="font-medium">{signal.line_movement_score}</span></div>
              <div className="text-gray-600">Line Movement: <span className="font-medium">{signal.line_movement > 0 ? '+' : ''}{signal.line_movement}</span></div>
            </div>
          </div>

          {/* Signal Types */}
          <div>
            <div className="text-gray-600 text-sm mb-1">Signal Types:</div>
            <div className="flex flex-wrap gap-1">
              {signal.signal_types.map((type, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 rounded text-gray-700">
                  {type.replace('_', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
const SmartSignalsPage: React.FC = () => {
  const [signals, setSignals] = useState<SmartSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    sport: 'MLB',
    min_score: 70,
    strength: 'all',
    signal_type: 'all',
    player_search: ''
  });
  const [parlay, setParlay] = useState<SmartSignal[]>([]);
  const [trackedLines, setTrackedLines] = useState<SmartSignal[]>([]);

  // Fetch signals from API
  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        sport: filters.sport,
        min_score: filters.min_score.toString(),
        limit: '50'
      });

      const response = await fetch(`/api/signals/smart?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SmartSignalsResponse = await response.json();
      
      if (data.status === 'success') {
        setSignals(data.data.signals || []);
      } else {
        throw new Error('Failed to fetch signals');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching smart signals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  }, [filters.sport, filters.min_score]);

  // Initial load
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  // Filter signals based on UI filters
  const filteredSignals = useMemo(() => {
    return signals.filter(signal => {
      // Strength filter
      if (filters.strength !== 'all' && signal.strength_level !== filters.strength) {
        return false;
      }

      // Signal type filter
      if (filters.signal_type !== 'all' && !signal.signal_types.includes(filters.signal_type)) {
        return false;
      }

      // Player search
      if (filters.player_search && !signal.player_name.toLowerCase().includes(filters.player_search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [signals, filters]);

  // Event handlers
  const handleAddToParlay = (signal: SmartSignal) => {
    if (!parlay.find(p => p.id === signal.id)) {
      setParlay([...parlay, signal]);
    }
  };

  const handleTrackLine = (signal: SmartSignal) => {
    if (!trackedLines.find(t => t.id === signal.id)) {
      setTrackedLines([...trackedLines, signal]);
    }
  };

  const handleRemoveFromParlay = (signalId: string) => {
    setParlay(parlay.filter(p => p.id !== signalId));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin mr-2" size={24} />
          <span>Loading smart signals...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <h3 className="font-medium text-red-800">Error Loading Signals</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchSignals}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Signals</h1>
        <p className="text-gray-600">Intelligent betting opportunities with comprehensive scoring and analysis</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Target className="text-blue-600" size={20} />
            <div>
              <div className="text-sm text-gray-600">Total Signals</div>
              <div className="text-xl font-bold">{signals.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            <div>
              <div className="text-sm text-gray-600">Qualified (&gt;70)</div>
              <div className="text-xl font-bold">{signals.filter(s => s.overall_score >= 70).length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="text-yellow-600" size={20} />
            <div>
              <div className="text-sm text-gray-600">Avg Score</div>
              <div className="text-xl font-bold">
                {signals.length > 0 ? (signals.reduce((sum, s) => sum + s.overall_score, 0) / signals.length).toFixed(1) : '0'}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-purple-600" size={20} />
            <div>
              <div className="text-sm text-gray-600">In Parlay</div>
              <div className="text-xl font-bold">{parlay.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <span className="font-medium">Filters:</span>
          </div>
          
          <select
            value={filters.sport}
            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
            className="px-3 py-1 border rounded"
          >
            <option value="MLB">MLB</option>
            <option value="NBA">NBA</option>
            <option value="NFL">NFL</option>
          </select>

          <select
            value={filters.strength}
            onChange={(e) => setFilters({ ...filters, strength: e.target.value })}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Strengths</option>
            <option value="very_strong">Very Strong</option>
            <option value="strong">Strong</option>
            <option value="moderate">Moderate</option>
          </select>

          <input
            type="range"
            min="40"
            max="100"
            value={filters.min_score}
            onChange={(e) => setFilters({ ...filters, min_score: parseInt(e.target.value) })}
            className="w-24"
          />
          <span className="text-sm">Min Score: {filters.min_score}</span>

          <input
            type="text"
            placeholder="Search players..."
            value={filters.player_search}
            onChange={(e) => setFilters({ ...filters, player_search: e.target.value })}
            className="px-3 py-1 border rounded"
          />

          <button
            onClick={fetchSignals}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Signals List */}
        <div className="flex-1">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Target className="mx-auto mb-3 text-gray-400" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Signals Found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSignals.map(signal => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  onAddToParlay={handleAddToParlay}
                  onTrackLine={handleTrackLine}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Parlay & Tracked Lines */}
        <div className="w-80 space-y-4">
          {/* Parlay */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Plus size={16} />
              Parlay Builder ({parlay.length})
            </h3>
            {parlay.length === 0 ? (
              <p className="text-gray-500 text-sm">Add signals to build a parlay</p>
            ) : (
              <div className="space-y-2">
                {parlay.map(signal => (
                  <div key={signal.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <div className="font-medium">{signal.player_name}</div>
                      <div className="text-gray-600">{signal.stat_type} {signal.line}</div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromParlay(signal.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Place Parlay
                </button>
              </div>
            )}
          </div>

          {/* Tracked Lines */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Eye size={16} />
              Tracked Lines ({trackedLines.length})
            </h3>
            {trackedLines.length === 0 ? (
              <p className="text-gray-500 text-sm">Track line movements here</p>
            ) : (
              <div className="space-y-2">
                {trackedLines.map(signal => (
                  <div key={signal.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium">{signal.player_name}</div>
                    <div className="text-gray-600">{signal.stat_type} {signal.line}</div>
                    <div className="text-xs text-gray-500">Tracking since {new Date(signal.created_at).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSignalsPage;