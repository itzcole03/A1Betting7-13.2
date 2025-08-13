import React from 'react';
import PlayerAvatar from './PlayerAvatar';
import StatcastMetrics from './StatcastMetrics';

interface CondensedPropCardProps {
  player: string;
  team: string;
  stat: string;
  line: number;
  confidence: number;
  grade?: string;
  logoUrl?: string;
  accentColor?: string;
  bookmarked?: boolean;
  matchup?: string;
  espnPlayerId?: string;
  onClick: () => void;
  isExpanded: boolean;
  showStatcastMetrics?: boolean;
  statcastData?: any;
  alternativeProps?: Array<{
    stat: string;
    line: number;
    confidence: number;
    overOdds?: number;
    underOdds?: number;
  }>;
}

const CondensedPropCard: React.FC<CondensedPropCardProps> = ({
  player,
  team,
  stat,
  line,
  confidence,
  grade,
  logoUrl,
  accentColor = '#222',
  bookmarked = false,
  matchup = '',
  espnPlayerId,
  onClick,
  isExpanded,
  showStatcastMetrics = false,
  statcastData,
  alternativeProps = [],
}) => {
  const confidenceScore = Math.round(confidence || 0);

  // Calculate grade based on confidence
  const getGrade = (score: number) => {
    if (score >= 80) return 'A+';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    return 'D';
  };
  const calculatedGrade = grade || getGrade(confidenceScore);

  // Format matchup as 'vs TEAM xTIME' (if available)
  const getMatchup = () => {
    if (!matchup) return '';
    // Example: 'vs HOU x18.45' from 'HOU @ LAC x18.45'
    const parts = matchup.split(' ');
    if (parts.length >= 2) {
      return `vs ${parts[1]} ${parts.length > 2 ? parts[2] : ''}`;
    }
    return `vs ${matchup}`;
  };

  // Local state for analysis node
  const [showAnalysis, setShowAnalysis] = React.useState(false);
  // Simulate AI analysis/fallback
  const aiAnalysis = `AI's Take: ${player} is projected for ${line} ${stat}. Confidence: ${confidenceScore}%.`;
  const fallbackAnalysis = 'No analysis available.';

  return (
    <div
      data-testid='condensed-prop-card'
      data-testid-alt='prop-card'
      className={
        `relative rounded-xl p-0 mb-4 cursor-pointer transition-all duration-300 border border-gray-700 overflow-hidden shadow-lg flex items-center` +
        (isExpanded ? ' ring-2 ring-blue-500' : '')
      }
      style={{ backgroundColor: accentColor }}
      onClick={e => {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.log(`[DEBUG] CondensedPropCard clicked: player=${player}, stat=${stat}`);
        }
        onClick();
      }}
    >
      {/* Team logo background */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt='Team Logo'
          className='absolute right-4 top-1/2 transform -translate-y-1/2 opacity-20 w-32 h-32 object-contain pointer-events-none select-none'
          style={{ zIndex: 0 }}
        />
      )}
      {/* Card content */}
      <div className='flex items-center justify-between relative z-10 w-full p-4'>
        {/* Left: Avatar, player info */}
        <div className='flex items-center gap-3'>
          <PlayerAvatar playerName={player} playerId={espnPlayerId} size='md' className='mr-2' />
          <div>
            <div className='text-white font-bold text-lg leading-tight'>{player}</div>
            <div className='text-gray-300 text-xs font-medium'>{getMatchup()}</div>
            {/* Stat text for testability */}
            <div className='text-gray-400 text-xs' data-testid='stat-text'>
              {stat}
            </div>
          </div>
        </div>
        {/* Right: Grade, bookmark */}
        <div className='flex flex-col items-end gap-2'>
          <div className='flex items-center gap-2'>
            <span className='bg-black text-green-400 font-bold px-2 py-1 rounded-lg text-xs shadow-md'>
              {calculatedGrade}
            </span>
            <button
              className='bg-transparent border-none p-0 m-0 cursor-pointer'
              tabIndex={-1}
              aria-label={bookmarked ? 'Bookmarked' : 'Bookmark'}
              onClick={e => {
                e.stopPropagation();
              }}
            >
              <svg
                className={`w-5 h-5 ${bookmarked ? 'text-yellow-400' : 'text-gray-400'}`}
                fill={bookmarked ? 'currentColor' : 'none'}
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 5v16l7-5 7 5V5a2 2 0 00-2-2H7a2 2 0 00-2 2z'
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Expand indicator */}
      <div className='flex justify-center pb-2'>
        <div
          className={`transition-all duration-300 flex items-center gap-1 ${
            isExpanded ? 'text-blue-400' : 'text-gray-500'
          }`}
        >
          <div
            className={`w-6 h-1 rounded-full transition-transform duration-300 ${
              isExpanded ? 'bg-blue-500 rotate-90' : 'bg-gray-600'
            }`}
          ></div>
          <div className='text-xs'>{isExpanded ? 'Click to collapse' : 'Click for details'}</div>
        </div>
      </div>

      {/* Expanded card output for test compatibility */}
      {isExpanded && (
        <div data-testid='prop-card-expanded' className='w-full p-4 bg-gray-900 rounded-xl mt-2'>
          <div className='text-white font-bold'>Expanded Card for {player}</div>
          <div className='text-gray-400'>Stat: {stat}</div>
          <button
            aria-label='Deep AI Analysis'
            className='mt-2 px-3 py-1 bg-blue-700 text-white rounded'
            onClick={e => {
              e.stopPropagation();
              setShowAnalysis(true);
            }}
          >
            Deep AI Analysis
          </button>
          {/* Analysis node for test compatibility */}
          {showAnalysis &&
            (confidenceScore >= 50 ? (
              <div data-testid='ai-take' className='mt-4 p-3 bg-gray-800 rounded'>
                AI's Take: {player} is projected for {line} {stat}. Confidence: {confidenceScore}%.
              </div>
            ) : (
              <div data-testid='no-analysis' className='mt-4 p-3 bg-gray-800 rounded'>
                No analysis available.
              </div>
            ))}
        </div>
      )}

      {/* Statcast Metrics - Only show when expanded and for MLB */}
      {isExpanded && showStatcastMetrics && (
        <StatcastMetrics
          prop={{
            id: `${player}-${stat}`,
            player,
            stat,
            line,
            confidence,
            matchup: matchup || '',
            sport: 'MLB',
            overOdds: 0,
            underOdds: 0,
            gameTime: '',
            pickType: 'player',
            espnPlayerId,
            _originalData: statcastData,
          }}
          isVisible={true}
        />
      )}
    </div>
  );
};

export default CondensedPropCard;
