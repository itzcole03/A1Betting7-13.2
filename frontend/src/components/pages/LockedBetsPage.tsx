import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Target, Zap, DollarSign, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
// @ts-expect-error TS(6142): Module '../shared/PropOllamaChatBox' was resolved ... Remove this comment to see the full error message
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

const LockedBetsPage: React.FC = () => {
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

      // Mock data for development - replace with actual API call
      const mockBets: LockedBet[] = [
        {
          id: '1',
          player_name: 'LeBron James',
          team: 'Lakers',
          sport: 'NBA',
          stat_type: 'Points',
          line_score: 25.5,
          recommendation: 'OVER',
          confidence: 87,
          ensemble_confidence: 89,
          win_probability: 0.68,
          expected_value: 1.15,
          kelly_fraction: 0.08,
          risk_score: 25,
          source: 'PrizePicks',
          opponent: 'Warriors',
          venue: 'Crypto.com Arena',
          value_rating: 4.2,
          kelly_percentage: 8.5,
          ai_explanation: {
            explanation: 'Strong historical performance against Warriors defense',
            key_factors: ['Matchup advantage', 'Home court', 'Recent form'],
            risk_level: 'Low'
          }
        }
      ];
      
      setLockedBets(mockBets);
      setLastUpdate(new Date());
      toast.success('Locked bets updated successfully');
    } catch (error) {
      console.error('Error fetching locked bets:', error);
      toast.error('Failed to load locked bets. Please check your connection or try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLockedBets();
  }, [selectedSport, minConfidence]);

  const getBetCard = (bet: LockedBet) => {
    const confidenceColor =
      bet.ensemble_confidence >= 85
        ? 'text-green-400'
        : bet.ensemble_confidence >= 70
          ? 'text-yellow-400'
          : 'text-orange-400';

    const riskColor =
      bet.risk_score <= 30
        ? 'text-green-400'
        : bet.risk_score <= 50
          ? 'text-yellow-400'
          : 'text-red-400';

    return (
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div
        key={bet.id}
        className='bg-gray-800 border border-cyan-500/30 rounded-lg p-6 hover:border-cyan-400/50 transition-all duration-300'
      >
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='flex items-center justify-between mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-3'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-xl font-bold text-white'>{bet.player_name}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>({bet.team})</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='px-2 py-1 bg-cyan-600/20 text-cyan-400 rounded text-xs font-medium'>
              {bet.sport}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center space-x-2'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>{bet.source}</div>
            {bet.ensemble_confidence >= 85 && (
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-bold'>
                🔥 HOT
              </div>
            )}
          </div>
        </div>

        {/* Bet Details */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Stat Type</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-lg font-semibold text-white'>{bet.stat_type}</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Line</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-lg font-semibold text-white'>{bet.line_score}</div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Recommendation</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`text-lg font-bold ${bet.recommendation === 'OVER' ? 'text-green-400' : 'text-red-400'}`}>
              {bet.recommendation}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Confidence</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`text-lg font-bold ${confidenceColor}`}>
              {bet.ensemble_confidence}%
            </div>
          </div>
        </div>

        {/* Advanced Metrics */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-700'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Win Probability</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-md font-semibold text-cyan-400'>
              {(bet.win_probability * 100).toFixed(1)}%
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Expected Value</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-md font-semibold text-green-400'>
              {bet.expected_value.toFixed(2)}
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Kelly %</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-md font-semibold text-purple-400'>
              {bet.kelly_percentage.toFixed(1)}%
            </div>
          </div>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-400'>Risk Score</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className={`text-md font-semibold ${riskColor}`}>
              {bet.risk_score}
            </div>
          </div>
        </div>

        {/* AI Explanation */}
        {bet.ai_explanation && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mt-4 p-4 bg-gray-700/50 rounded-lg'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='text-sm text-gray-300 mb-2'>{bet.ai_explanation.explanation}</div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex flex-wrap gap-2'>
              {bet.ai_explanation.key_factors.map((factor, index) => (
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span
                  key={index}
                  className='px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs'
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Match Info */}
        {(bet.opponent || bet.venue) && (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {bet.opponent && <span>vs {bet.opponent}</span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {bet.venue && bet.opponent && <span> • </span>}
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            {bet.venue && <span>@ {bet.venue}</span>}
          </div>
        )}
      </div>
    );
  };

  const uniqueSports = ['ALL', ...Array.from(new Set(lockedBets.map(bet => bet.sport)))];
  const filteredBets = lockedBets.filter(bet => 
    (selectedSport === 'ALL' || bet.sport === selectedSport) &&
    bet.ensemble_confidence >= minConfidence
  );

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gray-900 p-6'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='mb-8'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-between mb-4'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <h1 className='text-4xl font-bold text-white mb-2'>🎯 Locked Bets</h1>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <p className='text-gray-400'>
                Most accurately predicted, real-time sports bets powered by advanced ML ensemble
              </p>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <div className='text-sm text-gray-400'>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <button
                onClick={fetchLockedBets}
                disabled={isLoading}
                className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg flex items-center space-x-2 transition-colors'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex flex-wrap items-center gap-4 mb-6'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label className='text-sm text-gray-400'>Sport:</label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className='px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-cyan-500 focus:outline-none'
              >
                {uniqueSports.map(sport => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='flex items-center space-x-2'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <label className='text-sm text-gray-400'>Min Confidence:</label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <input
                type='range'
                min='50'
                max='95'
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className='w-32'
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <span className='text-sm text-cyan-400 w-12'>{minConfidence}%</span>
            </div>
          </div>
        </div>

        {/* Bets Grid */}
        {isLoading ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center py-12'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500'></div>
          </div>
        ) : filteredBets.length > 0 ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {filteredBets.map(bet => getBetCard(bet))}
          </div>
        ) : (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='text-center py-12'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Target className='w-16 h-16 text-gray-600 mx-auto mb-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <h3 className='text-xl font-semibold text-gray-400 mb-2'>No locked bets found</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <p className='text-gray-500 mb-4'>
              Try adjusting your filters or refresh the data to see available bets.
            </p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <button
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
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <PropOllamaChatBox
          isMinimized={true}
          onToggleMinimize={() => setIsChatMinimized(false)}
          className=''
        />
      ) : (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <div className='fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

export default LockedBetsPage;
