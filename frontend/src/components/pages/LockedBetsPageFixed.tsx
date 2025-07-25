import { DollarSign, RefreshCw, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
// ...existing code...
import PropOllamaChatBox from '../shared/PropOllamaChatBox';
import { LockedBet } from '../types/LockedBet';

const _LockedBetsPage: React.FC = () => {
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
      const sortedBets = Array.isArray(data)
        ? data.sort((a: LockedBet, b: LockedBet) => {
            return (
              (b.ensemble_confidence ?? 0) * (b.expected_value ?? 0) -
              (a.ensemble_confidence ?? 0) * (a.expected_value ?? 0)
            );
          })
        : [];

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
        // ...existing code...
        const _mockBets: LockedBet[] = [
          {
            id: 'mock-1',
            player_name: 'Luka Dončić',
            team: 'DAL',
            sport: 'NBA',
            stat_type: 'Points',
            line_score: 28.5,
            recommendation: 'OVER' as 'OVER',
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
            recommendation: 'OVER' as 'OVER',
            confidence: 82.1,
            ensemble_confidence: 82.1,
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
            value_rating: 8.2,
            kelly_percentage: 6.4,
          },
        ].filter(
          bet =>
            (selectedSport === 'ALL' || bet.sport === selectedSport) &&
            bet.ensemble_confidence >= minConfidence
        );

        setLockedBets(_mockBets);
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

  const _getBetCard = (bet: LockedBet) => {
    const _confidenceColor =
      (bet.ensemble_confidence ?? 0) >= 85
        ? 'text-green-400'
        : (bet.ensemble_confidence ?? 0) >= 75
        ? 'text-yellow-400'
        : 'text-orange-400';

    const _riskColor =
      (bet.risk_score ?? 0) <= 30
        ? 'text-green-400'
        : (bet.risk_score ?? 0) <= 50
        ? 'text-yellow-400'
        : 'text-red-400';

    return (
      // ...existing code...
      <div
        key={bet.id}
        className='bg-gray-800 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-300'
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-xl font-bold text-white'>{bet.player_name}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>({bet.team})</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-medium'>
              {bet.sport}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>{bet.source}</div>
            {(bet.ensemble_confidence ?? 0) >= 85 && (
              // ...existing code...
              <div className='px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold'>
                🔥 HOT
              </div>
            )}
          </div>
        </div>
        {/* Bet Details */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Stat Type</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-lg font-semibold text-white'>{bet.stat_type}</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Line</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-lg font-semibold text-white'>{bet.line_score}</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Recommendation</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div
              className={`text-lg font-bold ${
                bet.recommendation === 'OVER' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {bet.recommendation}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Expected Value</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-lg font-semibold text-cyan-400'>
              +{(bet.expected_value ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
        {/* Confidence and Analytics */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>ML Confidence</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className={`text-lg font-bold ${_confidenceColor}`}>
              {(bet.ensemble_confidence ?? 0).toFixed(1)}%
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Win Probability</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-lg font-semibold text-white'>
              {((bet.win_probability ?? 0) * 100).toFixed(1)}%
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Risk Score</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className={`text-lg font-semibold ${_riskColor}`}>
              {(bet.risk_score ?? 0).toFixed(0)}/100
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Kelly %</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-lg font-semibold text-purple-400'>
              {(bet.kelly_percentage ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>
        {/* AI Explanation */}
        {bet.ai_explanation && (
          // ...existing code...
          <div className='bg-gray-900/50 rounded-lg p-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-300 mb-2'>
              🤖 AI Analysis: {bet.ai_explanation.explanation}
            </div>
            {bet.ai_explanation.key_factors && bet.ai_explanation.key_factors.length > 0 && (
              // ...existing code...
              <div className='flex flex-wrap gap-2'>
                {bet.ai_explanation.key_factors.map((factor, index) => (
                  // ...existing code...
                  <span
                    key={index}
                    className='px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs'
                  >
                    {factor}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Match Info */}
        {(bet.opponent || bet.venue) && (
          // ...existing code...
          <div className='mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            {bet.opponent && <span>vs {bet.opponent}</span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            {bet.venue && bet.opponent && <span> • </span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            {bet.venue && <span>@ {bet.venue}</span>}
          </div>
        )}
      </div>
    );
  };

  const _uniqueSports = ['ALL', ...Array.from(new Set(lockedBets.map(bet => bet.sport)))];

  return (
    // ...existing code...
    <div className='min-h-screen bg-gray-900 p-6'>
      // ...existing code...
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        // ...existing code...
        <div className='mb-8'>
          // ...existing code...
          <div className='flex items-center justify-between mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <h1 className='text-4xl font-bold text-white mb-2'>🎯 Locked Bets</h1>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <p className='text-gray-400'>
                Most accurately predicted, real-time sports bets powered by advanced ML ensemble
              </p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label htmlFor='lockedbets-refresh-btn' className='sr-only'>
              Refresh locked bets
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              id='lockedbets-refresh-btn'
              onClick={fetchLockedBets}
              disabled={isLoading}
              className='flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors'
            >
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span>Refresh</span>
            </button>
          </div>
          {/* Stats Bar */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-gray-800 p-4 rounded-lg border border-cyan-500/30'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <Target className='w-5 h-5 text-cyan-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Total Bets</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xl font-bold text-white'>{lockedBets.length}</div>
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-gray-800 p-4 rounded-lg border border-green-500/30'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <TrendingUp className='w-5 h-5 text-green-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Avg Confidence</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xl font-bold text-white'>
                    {lockedBets.length > 0
                      ? (
                          lockedBets.reduce((sum, bet) => sum + (bet.ensemble_confidence ?? 0), 0) /
                          lockedBets.length
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-gray-800 p-4 rounded-lg border border-purple-500/30'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <Zap className='w-5 h-5 text-purple-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>High Confidence</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xl font-bold text-white'>
                    {lockedBets.filter(bet => (bet.ensemble_confidence ?? 0) >= 85).length}
                  </div>
                </div>
              </div>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='bg-gray-800 p-4 rounded-lg border border-yellow-500/30'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='flex items-center space-x-2'>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <DollarSign className='w-5 h-5 text-yellow-400' />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-sm text-gray-400'>Avg Expected Value</div>
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is
                  provided... Remove this comment to see the full error message
                  <div className='text-xl font-bold text-white'>
                    +
                    {lockedBets.length > 0
                      ? (
                          lockedBets.reduce((sum, bet) => sum + (bet.expected_value ?? 0), 0) /
                          lockedBets.length
                        ).toFixed(2)
                      : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Filters */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <div className='flex flex-wrap items-center gap-4 mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <label htmlFor='lockedbets-sport-select' className='text-sm text-gray-400'>
                Sport:
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <select
                id='lockedbets-sport-select'
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='bg-gray-800 border border-gray-600 text-white rounded px-3 py-1 text-sm'
              >
                {(_uniqueSports ?? [])
                  .filter((sport): sport is string => typeof sport === 'string')
                  .map((sport: string) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
              </select>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <label htmlFor='lockedbets-confidence-select' className='text-sm text-gray-400'>
                Min Confidence:
              </label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <select
                id='lockedbets-confidence-select'
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className='bg-gray-800 border border-gray-600 text-white rounded px-3 py-1 text-sm'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value={50}>50%+</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value={60}>60%+</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value={70}>70%+</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value={80}>80%+</option>
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <option value={85}>85%+</option>
              </select>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        {/* Loading State */}
        {isLoading && (
          // ...existing code...
          <div className='flex items-center justify-center py-12'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <div className='text-center'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <RefreshCw className='w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4' />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-gray-400'>Loading locked bets with ML predictions...</div>
            </div>
          </div>
        )}
        {/* Locked Bets Grid */}
        {!isLoading && lockedBets.length > 0 && (
          // ...existing code...
          <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
            {lockedBets.map(_getBetCard)}
          </div>
        )}
        {/* No Results */}
        {!isLoading && lockedBets.length === 0 && (
          // ...existing code...
          <div className='text-center py-12'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <Target className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-semibold text-gray-300 mb-2'>No locked bets found</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-400 mb-4'>
              Try adjusting your filters or check back later for new predictions
            </p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <label htmlFor='lockedbets-refresh-data-btn' className='sr-only'>
              Refresh locked bets data
            </label>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              id='lockedbets-refresh-data-btn'
              onClick={fetchLockedBets}
              className='px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
      {/* PropOllama AI Chat Box */}
      {isChatMinimized ? (
        // ...existing code...
        <PropOllamaChatBox
          isMinimized={true}
          onToggleMinimize={() => setIsChatMinimized(false)}
          className=''
        />
      ) : (
        // ...existing code...
        <div className='fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
          <PropOllamaChatBox
            isMinimized={false}
            onToggleMinimize={() => setIsChatMinimized(true)}
            className='shadow-2xl'
          />
        </div>
      )}
    </div>
  );
};

export default _LockedBetsPage;
