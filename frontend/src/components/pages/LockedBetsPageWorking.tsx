import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Target, Zap, DollarSign, MessageCircle, Brain } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PropOllamaChatBox from '../shared/PropOllamaChatBox';

interface LockedBet {
  id: string;
  player_name: string;
  team: string;
  sport: string;
  stat_type: string;
  line_score: number;
  recommendation: 'OVER' | 'UNDER';
  confidence: number;
  ensemble_confidence: number;
  win_probability: number;
  expected_value: number;
  kelly_fraction: number;
  risk_score: number;
  source: string;
  opponent?: string;
  venue?: string;
  ai_explanation?: {
    explanation: string;
    key_factors: string[];
    risk_level: string;
  };
  value_rating: number;
  kelly_percentage: number;
}

const LockedBetsPageWorking: React.FC = () => {
  const [lockedBets, setLockedBets] = useState<LockedBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  const fetchLockedBets = async () => {
    try {
      setIsLoading(true);

      // Build API URL with filters
      const params = new URLSearchParams();
      if (selectedSport !== 'ALL') {
        params.append('sport', selectedSport);
      }
      params.append('min_confidence', minConfidence.toString());
      params.append('enhanced', 'true');

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://localhost:8000/api/prizepicks/props?${params}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Sort by confidence and expected value
      const sortedBets = data.sort((a: LockedBet, b: LockedBet) => {
        return b.ensemble_confidence * b.expected_value - a.ensemble_confidence * a.expected_value;
      });

      setLockedBets(sortedBets);
      setLastUpdate(new Date());
      toast.success(`🎯 Loaded ${sortedBets.length} locked bets with ML predictions`);
    } catch (error) {
      console.error('Error fetching locked bets:', error);

      // If backend is unavailable, show mock data
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.message.includes('fetch'))
      ) {
        console.log('Backend unavailable, using mock data...');
        toast.error('🔌 Backend offline - Using demo data');

        // Generate mock data for demonstration
        const mockBets: LockedBet[] = [
          {
            id: 'mock-1',
            player_name: 'Luka Dončić',
            team: 'DAL',
            sport: 'NBA',
            stat_type: 'Points',
            line_score: 28.5,
            recommendation: 'OVER',
            confidence: 87.5,
            ensemble_confidence: 87.5,
            win_probability: 0.765,
            expected_value: 2.34,
            kelly_fraction: 0.08,
            risk_score: 24,
            source: 'PrizePicks',
            opponent: 'LAL',
            venue: 'American Airlines Center',
            ai_explanation: {
              explanation: 'Strong offensive matchup with high pace game expected',
              key_factors: ['Recent form', 'Defensive ranking', 'Pace differential'],
              risk_level: 'Low',
            },
            value_rating: 8.7,
            kelly_percentage: 8.2,
          },
          {
            id: 'mock-2',
            player_name: 'Josh Allen',
            team: 'BUF',
            sport: 'NFL',
            stat_type: 'Passing Yards',
            line_score: 267.5,
            recommendation: 'OVER',
            confidence: 88.3,
            ensemble_confidence: 88.3,
            win_probability: 0.721,
            expected_value: 1.89,
            kelly_fraction: 0.06,
            risk_score: 31,
            source: 'PrizePicks',
            opponent: 'MIA',
            venue: 'Highmark Stadium',
            ai_explanation: {
              explanation: 'Weather conditions favor passing game, weak secondary matchup',
              key_factors: ['Weather', 'Pass defense rank', 'Recent targets'],
              risk_level: 'Medium',
            },
            value_rating: 8.8,
            kelly_percentage: 9.1,
          },
          {
            id: 'mock-3',
            player_name: 'Connor McDavid',
            team: 'EDM',
            sport: 'NHL',
            stat_type: 'Points',
            line_score: 1.5,
            recommendation: 'OVER',
            confidence: 91.2,
            ensemble_confidence: 91.2,
            win_probability: 0.856,
            expected_value: 3.15,
            kelly_fraction: 0.14,
            risk_score: 19,
            source: 'PrizePicks',
            opponent: 'CGY',
            venue: 'Rogers Place',
            ai_explanation: {
              explanation:
                'McDavid has recorded 2+ points in 8 of last 10 games vs Calgary. Power play opportunities expected in this rivalry matchup.',
              key_factors: [
                'Historical performance',
                'Power play upside',
                'Home ice advantage',
                'Line chemistry',
              ],
              risk_level: 'Low',
            },
            value_rating: 9.1,
            kelly_percentage: 13.8,
          },
        ].filter(
          bet =>
            (selectedSport === 'ALL' || bet.sport === selectedSport) &&
            bet.ensemble_confidence >= minConfidence
        );

        setLockedBets(mockBets);
        setLastUpdate(new Date());
      } else {
        toast.error('Failed to load locked bets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLockedBets();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLockedBets, 30000);
    return () => clearInterval(interval);
  }, [selectedSport, minConfidence]);

  const getBetCard = (bet: LockedBet) => {
    const confidenceColor =
      bet.ensemble_confidence >= 85
        ? 'text-green-400'
        : bet.ensemble_confidence >= 75
          ? 'text-yellow-400'
          : 'text-orange-400';

    const riskColor =
      bet.risk_score <= 30
        ? 'text-green-400'
        : bet.risk_score <= 50
          ? 'text-yellow-400'
          : 'text-red-400';

    return (
      <div
        key={bet.id}
        className='relative bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-500 hover:-translate-y-1'
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <div className='text-xl font-bold text-white'>{bet.player_name}</div>
            <div className='text-sm text-gray-400'>({bet.team})</div>
            <div className='px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-medium'>
              {bet.sport}
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='text-sm text-gray-400'>{bet.source}</div>
            {/* Premium Indicator */}
            {bet.ensemble_confidence >= 85 && (
              <div className='bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg border border-orange-400/20 animate-pulse backdrop-blur-sm'>
                🔥 HOT
              </div>
            )}
          </div>
        </div>

        {/* Bet Details */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Stat Type</div>
            <div className='text-lg font-semibold text-white'>{bet.stat_type}</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Line</div>
            <div className='text-lg font-semibold text-white'>{bet.line_score}</div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Recommendation</div>
            <div
              className={`text-lg font-bold ${bet.recommendation === 'OVER' ? 'text-green-400' : 'text-red-400'}`}
            >
              {bet.recommendation}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Expected Value</div>
            <div className='text-lg font-semibold text-cyan-400'>
              +{bet.expected_value.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Confidence and Analytics */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg'>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>ML Confidence</div>
            <div className={`text-lg font-bold ${confidenceColor}`}>
              {bet.ensemble_confidence.toFixed(1)}%
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Win Probability</div>
            <div className='text-lg font-semibold text-white'>
              {(bet.win_probability * 100).toFixed(1)}%
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Risk Score</div>
            <div className={`text-lg font-semibold ${riskColor}`}>
              {bet.risk_score.toFixed(0)}/100
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-400'>Kelly %</div>
            <div className='text-lg font-semibold text-purple-400'>
              {bet.kelly_percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        {bet.ai_explanation && (
          <div className='bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-lg p-4'>
            <div className='flex items-start space-x-3'>
              <div className='p-2 bg-blue-500/20 rounded-lg'>
                <Brain className='w-4 h-4 text-blue-400' />
              </div>
              <div className='flex-1'>
                <h4 className='text-sm font-semibold text-blue-400 mb-2'>AI Analysis</h4>
                <p className='text-sm text-gray-300 mb-3'>{bet.ai_explanation.explanation}</p>

                {bet.ai_explanation.key_factors && bet.ai_explanation.key_factors.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {bet.ai_explanation.key_factors.map((factor, index) => (
                      <span
                        key={index}
                        className='px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20'
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Match Info */}
        {(bet.opponent || bet.venue) && (
          <div className='mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400'>
            {bet.opponent && <span>vs {bet.opponent}</span>}
            {bet.venue && bet.opponent && <span> • </span>}
            {bet.venue && <span>@ {bet.venue}</span>}
          </div>
        )}
      </div>
    );
  };

  const uniqueSports = ['ALL', ...Array.from(new Set(lockedBets.map(bet => bet.sport)))];

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Enhanced Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-2'>
                🎯 Elite Locked Bets
              </h1>
              <p className='text-gray-400 mb-3'>
                Most accurately predicted, real-time sports bets powered by advanced ML ensemble
              </p>
              <div className='flex items-center space-x-2'>
                <div className='px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm font-medium flex items-center space-x-2'>
                  <Brain className='w-4 h-4' />
                  <span>PropOllama AI Available</span>
                </div>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => setIsChatMinimized(!isChatMinimized)}
                className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25'
              >
                <Brain className='w-4 h-4' />
                <span>{isChatMinimized ? 'Ask PropOllama' : 'Hide Chat'}</span>
                <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
              </button>
              <button
                onClick={fetchLockedBets}
                disabled={isLoading}
                className='flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25'
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            <div className='bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4'>
              <div className='flex items-center space-x-2'>
                <Target className='w-5 h-5 text-cyan-400' />
                <div>
                  <div className='text-sm text-gray-400'>Total Bets</div>
                  <div className='text-xl font-bold text-white'>{lockedBets.length}</div>
                </div>
              </div>
            </div>
            <div className='bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4'>
              <div className='flex items-center space-x-2'>
                <TrendingUp className='w-5 h-5 text-green-400' />
                <div>
                  <div className='text-sm text-gray-400'>Avg Confidence</div>
                  <div className='text-xl font-bold text-white'>
                    {lockedBets.length > 0
                      ? (
                          lockedBets.reduce((sum, bet) => sum + bet.ensemble_confidence, 0) /
                          lockedBets.length
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
            <div className='bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-4'>
              <div className='flex items-center space-x-2'>
                <Zap className='w-5 h-5 text-purple-400' />
                <div>
                  <div className='text-sm text-gray-400'>High Confidence</div>
                  <div className='text-xl font-bold text-white'>
                    {lockedBets.filter(bet => bet.ensemble_confidence >= 85).length}
                  </div>
                </div>
              </div>
            </div>
            <div className='bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4'>
              <div className='flex items-center space-x-2'>
                <DollarSign className='w-5 h-5 text-yellow-400' />
                <div>
                  <div className='text-sm text-gray-400'>Avg Expected Value</div>
                  <div className='text-xl font-bold text-white'>
                    +
                    {lockedBets.length > 0
                      ? (
                          lockedBets.reduce((sum, bet) => sum + bet.expected_value, 0) /
                          lockedBets.length
                        ).toFixed(2)
                      : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className='flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl'>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Sport:</label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
              >
                {uniqueSports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Min Confidence:</label>
              <select
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className='bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2'
              >
                <option value={50}>50%+</option>
                <option value={60}>60%+</option>
                <option value={70}>70%+</option>
                <option value={80}>80%+</option>
                <option value={85}>85%+</option>
              </select>
            </div>
            <div className='text-sm text-gray-400'>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='relative'>
                <div className='w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4'></div>
                <div
                  className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto'
                  style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                ></div>
              </div>
              <div className='text-xl font-semibold text-white mb-2'>Loading Elite Bets</div>
              <div className='text-gray-400'>Analyzing ML predictions and market data...</div>
            </div>
          </div>
        )}

        {/* Locked Bets Grid */}
        {!isLoading && lockedBets.length > 0 && (
          <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
            {lockedBets.map(getBetCard)}
          </div>
        )}

        {/* No Results */}
        {!isLoading && lockedBets.length === 0 && (
          <div className='text-center py-12'>
            <Target className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-300 mb-2'>No locked bets found</h3>
            <p className='text-gray-400 mb-4'>
              Try adjusting your filters or check back later for new predictions
            </p>
            <button
              onClick={fetchLockedBets}
              className='px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-cyan-500/25'
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>

      {/* PropOllama AI Chat Box - Only show when not minimized */}
      {!isChatMinimized && (
        <div className='fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] z-50'>
          <div className='bg-gray-800/95 backdrop-blur-sm border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/10 transform transition-all duration-300'>
            <PropOllamaChatBox
              isMinimized={false}
              onToggleMinimize={() => setIsChatMinimized(true)}
              className='bg-transparent border-0 shadow-none'
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LockedBetsPageWorking;
