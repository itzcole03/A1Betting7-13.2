import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Play,
  Pause,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  ExternalLink
} from 'lucide-react';

interface LiveOdds {
  odds_id: string;
  sportsbook: string;
  game_id: string;
  sport: string;
  market_type: string;
  selection: string;
  odds_american: number;
  odds_decimal: number;
  line?: number;
  timestamp: string;
  is_available: boolean;
}

interface BettingOpportunity {
  opportunity_id: string;
  game_id: string;
  market_type: string;
  sportsbook: string;
  selection: string;
  recommended_odds: number;
  edge_percentage: number;
  confidence_score: number;
  max_stake: number;
  time_sensitivity: number;
  reasoning: string;
  created_at: string;
}

interface LiveGame {
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  current_period: string;
  time_remaining: string;
  home_score: number;
  away_score: number;
  game_state: string;
}

interface LineMovement {
  movement_id: string;
  odds_id: string;
  previous_odds: number;
  new_odds: number;
  direction: string;
  movement_amount: number;
  timestamp: string;
  volume_indicator: number;
}

export const LiveBettingDashboard: React.FC = () => {
  const [liveOdds, setLiveOdds] = useState<LiveOdds[]>([]);
  const [opportunities, setOpportunities] = useState<BettingOpportunity[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [lineMovements, setLineMovements] = useState<LineMovement[]>([]);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState('opportunities');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all live betting data
  const fetchLiveBettingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [oddsRes, oppsRes, gamesRes, movementsRes, statusRes] = await Promise.all([
        fetch(`/api/live-betting/odds${selectedSport !== 'all' ? `?sport=${selectedSport}` : ''}`),
        fetch(`/api/live-betting/opportunities${selectedSport !== 'all' ? `?sport=${selectedSport}` : ''}?min_edge=1.0`),
        fetch(`/api/live-betting/games${selectedSport !== 'all' ? `?sport=${selectedSport}` : ''}`),
        fetch('/api/live-betting/line-movements?hours_back=2&limit=20'),
        fetch('/api/live-betting/status')
      ]);

      if (oddsRes.ok) {
        const oddsData = await oddsRes.json();
        setLiveOdds(oddsData.odds || []);
      }

      if (oppsRes.ok) {
        const oppsData = await oppsRes.json();
        setOpportunities(oppsData.opportunities || []);
      }

      if (gamesRes.ok) {
        const gamesData = await gamesRes.json();
        setLiveGames(gamesData.games || []);
      }

      if (movementsRes.ok) {
        const movementsData = await movementsRes.json();
        setLineMovements(movementsData.movements || []);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setEngineStatus(statusData);
      }

      setLastUpdated(new Date());
      
      // Set mock data if APIs fail
      if (!oddsRes.ok && !oppsRes.ok) {
        setMockData();
      }

    } catch (err) {
      console.error('Failed to fetch live betting data:', err);
      setError('Failed to load live betting data. Showing mock data.');
      setMockData();
    } finally {
      setLoading(false);
    }
  }, [selectedSport]);

  const setMockData = () => {
    setLiveGames([
      {
        game_id: 'nba_lal_gsw_001',
        sport: 'NBA',
        home_team: 'Golden State Warriors',
        away_team: 'Los Angeles Lakers',
        current_period: '2nd Quarter',
        time_remaining: '8:42',
        home_score: 58,
        away_score: 62,
        game_state: 'live'
      },
      {
        game_id: 'nfl_buf_kc_001',
        sport: 'NFL',
        home_team: 'Kansas City Chiefs',
        away_team: 'Buffalo Bills',
        current_period: '3rd Quarter',
        time_remaining: '12:15',
        home_score: 21,
        away_score: 17,
        game_state: 'live'
      }
    ]);

    setOpportunities([
      {
        opportunity_id: 'opp_001',
        game_id: 'nba_lal_gsw_001',
        market_type: 'moneyline',
        sportsbook: 'DraftKings',
        selection: 'Los Angeles Lakers',
        recommended_odds: 135,
        edge_percentage: 4.2,
        confidence_score: 0.87,
        max_stake: 2500,
        time_sensitivity: 180,
        reasoning: 'Significant edge detected (4.2%). High confidence based on market analysis',
        created_at: new Date().toISOString()
      },
      {
        opportunity_id: 'opp_002',
        game_id: 'nfl_buf_kc_001',
        market_type: 'spread',
        sportsbook: 'FanDuel',
        selection: 'Buffalo Bills +3.5',
        recommended_odds: -105,
        edge_percentage: 3.1,
        confidence_score: 0.72,
        max_stake: 3000,
        time_sensitivity: 240,
        reasoning: 'Good edge identified (3.1%). Sharp money indicators suggest professional interest',
        created_at: new Date().toISOString()
      }
    ]);

    setEngineStatus({
      is_running: true,
      total_odds_tracked: 1247,
      active_opportunities: 8,
      line_movements_24h: 156,
      live_games: 4,
      uptime_seconds: 14580
    });
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchLiveBettingData();
  }, [fetchLiveBettingData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLiveBettingData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchLiveBettingData]);

  const formatOdds = (americanOdds: number) => {
    return americanOdds > 0 ? `+${americanOdds}` : americanOdds.toString();
  };

  const getMovementIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getGameStateColor = (state: string) => {
    switch (state) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'halftime':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'final':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="w-8 h-8 text-orange-400" />
                Live Betting Engine
                <span className="ml-3 px-2 py-1 bg-orange-600 text-white text-sm rounded">Phase 4.1</span>
              </h1>
              <p className="text-slate-300">
                Real-time odds tracking and betting opportunities across 15+ sportsbooks
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2"
              >
                <option value="all">All Sports</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="NHL">NHL</option>
                <option value="MLB">MLB</option>
              </select>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                Auto Refresh
              </button>
              
              <button
                onClick={fetchLiveBettingData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Engine Status</p>
                  <p className="text-lg font-bold text-white">
                    {engineStatus?.is_running ? 'Running' : 'Stopped'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Opportunities</p>
                  <p className="text-lg font-bold text-white">
                    {opportunities.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Live Games</p>
                  <p className="text-lg font-bold text-white">
                    {liveGames.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Odds Tracked</p>
                  <p className="text-lg font-bold text-white">
                    {engineStatus?.total_odds_tracked || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
            {[
              { id: 'opportunities', label: 'Opportunities', icon: Target },
              { id: 'live-games', label: 'Live Games', icon: Activity },
              { id: 'line-movements', label: 'Line Movements', icon: TrendingUp },
              { id: 'odds-comparison', label: 'Odds Comparison', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Betting Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Live Betting Opportunities</h2>
                <p className="text-sm text-slate-400">
                  Showing {opportunities.length} opportunities with positive edge
                </p>
              </div>
              
              {opportunities.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 text-lg">No betting opportunities currently available</p>
                  <p className="text-sm text-slate-500 mt-2">Check back in a few moments</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <div key={opp.opportunity_id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded font-medium">
                              {opp.market_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-slate-400 text-sm">{opp.sportsbook}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{opp.selection}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">
                            {opp.edge_percentage.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">Edge</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-400">
                            {formatOdds(opp.recommended_odds)}
                          </p>
                          <p className="text-xs text-slate-400">Odds</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-400">
                            {(opp.confidence_score * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-400">Confidence</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-orange-400">
                            ${opp.max_stake.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">Max Stake</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-slate-300">{opp.reasoning}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{Math.floor(opp.time_sensitivity / 60)}m {opp.time_sensitivity % 60}s remaining</span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm">
                          <ExternalLink className="w-3 h-3" />
                          Place Bet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Games Tab */}
          {activeTab === 'live-games' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Live Games</h2>
                <p className="text-sm text-slate-400">
                  {liveGames.length} games currently live
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liveGames.map((game) => (
                  <div key={game.game_id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                          {game.sport}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getGameStateColor(game.game_state)}`}>
                          {game.game_state.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <p>{game.current_period}</p>
                        <p>{game.time_remaining}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{game.away_team}</p>
                        <p className="text-2xl font-bold text-blue-400">{game.away_score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{game.home_team}</p>
                        <p className="text-2xl font-bold text-green-400">{game.home_score}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
                        <Eye className="w-4 h-4" />
                        View Live Odds
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Movements Tab */}
          {activeTab === 'line-movements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Line Movements</h2>
                <p className="text-sm text-slate-400">
                  Last {lineMovements.length} movements
                </p>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700/50">
                      <tr>
                        <th className="text-left p-3 text-slate-300">Time</th>
                        <th className="text-left p-3 text-slate-300">Market</th>
                        <th className="text-center p-3 text-slate-300">Movement</th>
                        <th className="text-right p-3 text-slate-300">Amount</th>
                        <th className="text-right p-3 text-slate-300">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineMovements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8 text-slate-400">
                            No recent line movements
                          </td>
                        </tr>
                      ) : (
                        lineMovements.map((movement) => (
                          <tr key={movement.movement_id} className="border-b border-slate-700/50">
                            <td className="p-3 text-slate-300">
                              {new Date(movement.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-3 text-white">{movement.odds_id.split('_').slice(-2).join(' ')}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {getMovementIcon(movement.direction)}
                                <span className="text-white">
                                  {formatOdds(movement.previous_odds)} → {formatOdds(movement.new_odds)}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right text-orange-400 font-medium">
                              {movement.movement_amount.toFixed(0)} pts
                            </td>
                            <td className="p-3 text-right">
                              <div className="w-full bg-slate-600 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${movement.volume_indicator * 100}%` }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="mt-8 p-4 bg-slate-800/30 backdrop-blur rounded-lg border border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${engineStatus?.is_running ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-slate-300">
                  Live Betting Engine {engineStatus?.is_running ? 'Active' : 'Inactive'}
                </span>
              </div>
              {lastUpdated && (
                <span className="text-slate-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Phase 4.1: Live Betting Engine</span>
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBettingDashboard;
