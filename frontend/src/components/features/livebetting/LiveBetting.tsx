import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Activity,
  Play,
  Pause,
  BarChart3,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Timer,
  Volume2,
} from 'lucide-react';
import { Layout } from '../../core/Layout';

interface LiveGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: string;
  timeRemaining: string;
  status: 'live' | 'halftime' | 'quarter_break' | 'final';
  odds: {
    homeMoneyline: number;
    awayMoneyline: number;
    spread: number;
    total: number;
    overOdds: number;
    underOdds: number;
  };
  liveStats: {
    momentum: 'home' | 'away' | 'neutral';
    pace: number;
    lastPlay: string;
    keyPlayers: Array<{
      name: string;
      stats: string;
    }>;
  };
  opportunities: LiveOpportunity[];
}

interface LiveOpportunity {
  id: string;
  type: string;
  description: string;
  odds: number;
  confidence: number;
  value: number;
  timeWindow: number;
  reasoning: string[];
  suggestedStake: number;
  expectedReturn: number;
  isFlash: boolean;
}

interface LiveAlert {
  id: string;
  gameId: string;
  type: 'opportunity' | 'line_movement' | 'injury' | 'momentum_shift';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: Date;
  dismissed: boolean;
}

const LiveBetting: React.FC = () => {
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filters, setFilters] = useState({
    sport: 'all',
    minConfidence: 70,
    showFlashOpps: true,
  });

  useEffect(() => {
    loadLiveData();

    let interval: NodeJS.Timeout;
    if (isAutoRefresh) {
      interval = setInterval(loadLiveData, 5000); // Update every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefresh, filters]);

  const loadLiveData = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockGames: LiveGame[] = [
        {
          id: 'live-001',
          sport: 'Basketball',
          league: 'NBA',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
          homeScore: 78,
          awayScore: 84,
          quarter: '3rd',
          timeRemaining: '07:23',
          status: 'live',
          odds: {
            homeMoneyline: 2.1,
            awayMoneyline: 1.75,
            spread: -2.5,
            total: 225.5,
            overOdds: 1.9,
            underOdds: 1.95,
          },
          liveStats: {
            momentum: 'away',
            pace: 102.4,
            lastPlay: 'Curry 3-pointer',
            keyPlayers: [
              { name: 'LeBron James', stats: '22 pts, 8 reb, 6 ast' },
              { name: 'Stephen Curry', stats: '28 pts, 4 reb, 7 ast' },
            ],
          },
          opportunities: [
            {
              id: 'opp-001',
              type: 'Live Total',
              description: 'Under 225.5 Total Points',
              odds: 1.95,
              confidence: 87.3,
              value: 2.4,
              timeWindow: 3,
              reasoning: [
                'Pace has slowed significantly in 3rd quarter',
                'Both teams shooting below average from 3-point line',
                'Defensive intensity has increased',
              ],
              suggestedStake: 500,
              expectedReturn: 475,
              isFlash: false,
            },
            {
              id: 'opp-002',
              type: 'Next Score',
              description: 'Warriors to score next',
              odds: 1.85,
              confidence: 92.1,
              value: 3.7,
              timeWindow: 1,
              reasoning: [
                'Warriors have possession',
                'Curry is hot from 3-point range',
                'Lakers in transition defense',
              ],
              suggestedStake: 200,
              expectedReturn: 170,
              isFlash: true,
            },
          ],
        },
        {
          id: 'live-002',
          sport: 'Football',
          league: 'NFL',
          homeTeam: 'Chiefs',
          awayTeam: 'Bills',
          homeScore: 14,
          awayScore: 10,
          quarter: '2nd',
          timeRemaining: '04:15',
          status: 'live',
          odds: {
            homeMoneyline: 1.65,
            awayMoneyline: 2.25,
            spread: -3.5,
            total: 52.5,
            overOdds: 1.92,
            underOdds: 1.92,
          },
          liveStats: {
            momentum: 'home',
            pace: 65.2,
            lastPlay: 'Mahomes 25-yard pass',
            keyPlayers: [
              { name: 'Patrick Mahomes', stats: '185 yds, 2 TD' },
              { name: 'Josh Allen', stats: '142 yds, 1 TD' },
            ],
          },
          opportunities: [
            {
              id: 'opp-003',
              type: 'Live Spread',
              description: 'Chiefs -3.5',
              odds: 1.9,
              confidence: 79.5,
              value: 1.8,
              timeWindow: 5,
              reasoning: [
                'Chiefs have momentum in red zone',
                'Bills offense has stalled',
                'Home field advantage in playoff atmosphere',
              ],
              suggestedStake: 300,
              expectedReturn: 270,
              isFlash: false,
            },
          ],
        },
      ];

      const mockAlerts: LiveAlert[] = [
        {
          id: 'alert-001',
          gameId: 'live-001',
          type: 'opportunity',
          message: 'Flash opportunity: Warriors next score at 1.85 odds',
          urgency: 'high',
          timestamp: new Date(),
          dismissed: false,
        },
        {
          id: 'alert-002',
          gameId: 'live-001',
          type: 'line_movement',
          message: 'Total line moved from 228.5 to 225.5 (-3 points)',
          urgency: 'medium',
          timestamp: new Date(Date.now() - 60000),
          dismissed: false,
        },
      ];

      setLiveGames(mockGames);
      setAlerts(mockAlerts);

      // Play sound for new high urgency alerts
      if (soundEnabled) {
        const newHighAlerts = mockAlerts.filter(
          a => a.urgency === 'high' && !a.dismissed && Date.now() - a.timestamp.getTime() < 10000
        );
        if (newHighAlerts.length > 0) {
          // Would play sound notification here
        }
      }
    } catch (error) {
      console.error('Failed to load live data:', error);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.map(alert => (alert.id === alertId ? { ...alert, dismissed: true } : alert)));
  };

  const getAlertColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-500/50 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low':
        return 'border-blue-500/50 bg-blue-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'home':
        return 'text-green-400';
      case 'away':
        return 'text-red-400';
      case 'neutral':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400';
    if (confidence >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Layout
      title='Live Betting'
      subtitle='Real-Time In-Game Opportunities • AI-Powered Analysis'
      headerActions={
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-gray-400'
            }`}
          >
            <Volume2 className='w-4 h-4' />
          </button>

          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isAutoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-gray-400'
            }`}
          >
            {isAutoRefresh ? <Play className='w-4 h-4' /> : <Pause className='w-4 h-4' />}
            <span>Auto</span>
          </button>

          <button
            onClick={loadLiveData}
            className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-lg text-white font-medium transition-all'
          >
            <RefreshCw className='w-4 h-4' />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      {/* Live Alerts */}
      {alerts.filter(a => !a.dismissed).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-6'
        >
          <div className='space-y-2'>
            {alerts
              .filter(a => !a.dismissed)
              .map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getAlertColor(alert.urgency)}`}
                >
                  <div className='flex items-center space-x-3'>
                    <AlertTriangle className='w-5 h-5' />
                    <div>
                      <div className='font-medium text-white'>{alert.message}</div>
                      <div className='text-sm text-gray-400'>
                        {alert.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className='text-gray-400 hover:text-white'
                  >
                    ×
                  </button>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 mb-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Sport</label>
            <select
              value={filters.sport}
              onChange={e => setFilters({ ...filters, sport: e.target.value })}
              className='w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400'
            >
              <option value='all'>All Sports</option>
              <option value='basketball'>Basketball</option>
              <option value='football'>Football</option>
              <option value='baseball'>Baseball</option>
              <option value='hockey'>Hockey</option>
            </select>
          </div>

          <div>
            <label className='text-sm text-gray-400 mb-1 block'>Min Confidence (%)</label>
            <input
              type='range'
              min='50'
              max='95'
              value={filters.minConfidence}
              onChange={e => setFilters({ ...filters, minConfidence: parseInt(e.target.value) })}
              className='w-full'
            />
            <div className='text-xs text-gray-400 text-center'>{filters.minConfidence}%</div>
          </div>

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='flashOpps'
              checked={filters.showFlashOpps}
              onChange={e => setFilters({ ...filters, showFlashOpps: e.target.checked })}
              className='rounded'
            />
            <label htmlFor='flashOpps' className='text-sm text-gray-400'>
              Show Flash Opportunities
            </label>
          </div>
        </div>
      </motion.div>

      {/* Live Games */}
      <div className='space-y-6'>
        {liveGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className='bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden'
          >
            {/* Game Header */}
            <div className='p-6 border-b border-slate-700/50'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-xl font-bold text-white'>
                    {game.awayTeam} @ {game.homeTeam}
                  </h3>
                  <div className='flex items-center space-x-4 text-sm text-gray-400'>
                    <span>
                      {game.sport} • {game.league}
                    </span>
                    <span className='flex items-center space-x-1'>
                      <Radio className='w-4 h-4 text-red-400' />
                      <span className='text-red-400'>LIVE</span>
                    </span>
                    <span>
                      {game.quarter} • {game.timeRemaining}
                    </span>
                  </div>
                </div>

                <div className='text-right'>
                  <div className='text-3xl font-bold text-white'>
                    {game.awayScore} - {game.homeScore}
                  </div>
                  <div className={`text-sm ${getMomentumColor(game.liveStats.momentum)}`}>
                    Momentum: {game.liveStats.momentum}
                  </div>
                </div>
              </div>

              {/* Live Stats */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <div className='text-sm text-gray-400'>Last Play</div>
                  <div className='font-medium text-white'>{game.liveStats.lastPlay}</div>
                </div>
                <div>
                  <div className='text-sm text-gray-400'>Pace</div>
                  <div className='font-medium text-white'>{game.liveStats.pace}</div>
                </div>
                <div>
                  <div className='text-sm text-gray-400'>Key Players</div>
                  <div className='space-y-1'>
                    {game.liveStats.keyPlayers.map((player, idx) => (
                      <div key={idx} className='text-sm'>
                        <span className='text-white'>{player.name}:</span>{' '}
                        <span className='text-gray-400'>{player.stats}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Opportunities */}
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h4 className='text-lg font-bold text-white'>Live Opportunities</h4>
                <div className='flex items-center space-x-2'>
                  <Zap className='w-5 h-5 text-yellow-400' />
                  <span className='text-yellow-400 text-sm font-medium'>
                    {game.opportunities.length} Active
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                {game.opportunities.map(opp => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-lg border transition-all ${
                      opp.isFlash
                        ? 'border-yellow-500/50 bg-yellow-500/10 animate-pulse'
                        : 'border-slate-700/50 bg-slate-900/50'
                    }`}
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div>
                        <div className='flex items-center space-x-2'>
                          <h5 className='font-bold text-white'>{opp.description}</h5>
                          {opp.isFlash && (
                            <span className='px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium'>
                              FLASH
                            </span>
                          )}
                        </div>
                        <div className='text-sm text-gray-400'>{opp.type}</div>
                      </div>
                      <div className='text-right'>
                        <div className='text-xl font-bold text-white'>{opp.odds.toFixed(2)}</div>
                        <div className='text-sm text-gray-400'>odds</div>
                      </div>
                    </div>

                    <div className='grid grid-cols-3 gap-3 mb-3'>
                      <div>
                        <div className='text-xs text-gray-400'>Confidence</div>
                        <div className={`font-bold ${getConfidenceColor(opp.confidence)}`}>
                          {opp.confidence.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Value</div>
                        <div className='font-bold text-green-400'>{opp.value.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className='text-xs text-gray-400'>Time Window</div>
                        <div className='font-bold text-orange-400'>{opp.timeWindow}min</div>
                      </div>
                    </div>

                    <div className='mb-3'>
                      <div className='text-xs text-gray-400 mb-1'>AI Reasoning:</div>
                      <ul className='text-xs text-gray-300 space-y-1'>
                        {opp.reasoning.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className='flex items-center justify-between pt-3 border-t border-slate-700/50'>
                      <div className='text-sm'>
                        <span className='text-gray-400'>Suggested: </span>
                        <span className='text-white font-medium'>${opp.suggestedStake}</span>
                        <span className='text-gray-400'> → </span>
                        <span className='text-green-400 font-medium'>+${opp.expectedReturn}</span>
                      </div>
                      <button className='px-3 py-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 rounded-lg text-white text-sm font-medium transition-all'>
                        Place Bet
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {liveGames.length === 0 && (
        <div className='text-center py-12'>
          <Radio className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-xl font-bold text-gray-400 mb-2'>No Live Games</h3>
          <p className='text-gray-500'>Live betting opportunities will appear here during games</p>
        </div>
      )}
    </Layout>
  );
};

export default LiveBetting;
