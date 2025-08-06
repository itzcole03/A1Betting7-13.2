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
  grade = 'A+',
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

  // Determine the confidence color based on score
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'border-green-500 text-green-400';
    if (score >= 60) return 'border-yellow-500 text-yellow-400';
    return 'border-red-500 text-red-400';
  };

  // Format odds for display
  const formatOdds = (odds: number) => {
    if (!odds) return '';
    return odds > 0 ? `+${odds}` : odds.toString();
  };

  // Format recommended bet line
  const getRecommendation = () => {
    // Example: Use UNDER if confidence < 65, else OVER
    const rec = confidence < 65 ? 'UNDER' : 'OVER';
    return `${rec} ${stat} ${line}`;
  };

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

  return (
    <div
      data-testid='prop-card'
      className={
        `relative rounded-xl p-0 mb-4 cursor-pointer transition-all duration-300 border border-gray-700 overflow-hidden shadow-lg flex items-center` +
        (isExpanded ? ' ring-2 ring-blue-500' : '')
      }
      style={{ backgroundColor: accentColor }}
      onClick={onClick}
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
            <div className='text-white text-base font-semibold mt-1'>{getRecommendation()}</div>
          </div>
        </div>
        {/* Right: Grade, bookmark */}
        <div className='flex flex-col items-end gap-2'>
          <div className='flex items-center gap-2'>
            <span className='bg-black text-green-400 font-bold px-2 py-1 rounded-lg text-xs shadow-md'>
              {grade}
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
