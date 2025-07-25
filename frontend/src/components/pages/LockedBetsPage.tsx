import { RefreshCw, Target } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LockedBet } from '../types/LockedBet';
import PropOllamaChatBox from '../shared/PropOllamaChatBox';

const _LockedBetsPage: React.FC = () => {
  const [lockedBets, setLockedBets] = useState<LockedBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  return (
    <div className='min-h-screen bg-gray-900 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-4xl font-bold text-white mb-2'>🎯 Locked Bets</h1>
              <p className='text-gray-400'>
                Most accurately predicted, real-time sports bets powered by advanced ML ensemble
              </p>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-sm text-gray-400'>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              <button
                onClick={_fetchLockedBets}
                disabled={isLoading}
                className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg flex items-center space-x-2 transition-colors'
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
          {/* Filters */}
          <div className='flex flex-wrap items-center gap-4 mb-6'>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Sport:</label>
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-cyan-500 focus:outline-none'
              >
                {uniqueSports.map((sport: string) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center space-x-2'>
              <label className='text-sm text-gray-400'>Min Confidence:</label>
              <input
                type='range'
                min='50'
                max='95'
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className='w-32'
              />
              <span className='text-sm text-cyan-400 w-12'>{minConfidence}%</span>
            </div>
          </div>
        </div>
        {/* Bets Grid */}
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500'></div>
          </div>
        ) : filteredBets.length > 0 ? (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {filteredBets.map((bet: LockedBet) => _getBetCard(bet))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Target className='w-16 h-16 text-gray-600 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-gray-400 mb-2'>No locked bets found</h3>
            <p className='text-gray-500 mb-4'>
              Try adjusting your filters or refresh the data to see available bets.
            </p>
            <button
              onClick={_fetchLockedBets}
              className='px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
            >
              Refresh Data
            </button>
          </div>
        )}
      </div>
      {/* PropOllama AI Chat Box */}
      {isChatMinimized ? (
        <PropOllamaChatBox
          isMinimized={true}
          onToggleMinimize={() => setIsChatMinimized(false)}
          className=''
        />
      ) : (
        <div className='fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50'>
          <PropOllamaChatBox
            isMinimized={false}
            onToggleMinimize={() => setIsChatMinimized(true)}
            className='shadow-2xl'
          />
        </div>
      )}
    </div>
      ) : (
        <div className='fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50'>
          <PropOllamaChatBox
            isMinimized={false}
            onToggleMinimize={() => setIsChatMinimized(true)}
            className='shadow-2xl'
          />
        </div>
      )}
    </div>
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

  const uniqueSports: string[] = ['ALL', ...Array.from(new Set(lockedBets.map(bet => bet.sport ?? '')))].filter(Boolean);
  const filteredBets: LockedBet[] = lockedBets.filter(
    bet =>
      (selectedSport === 'ALL' || bet.sport === selectedSport) &&
      (bet.ensemble_confidence ?? 0) >= minConfidence
  );

  return (
    // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <div className='min-h-screen bg-gray-900 p-6'>
      // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
      this comment to see the full error message
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove
        this comment to see the full error message
        <div className='mb-8'>
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
          Remove this comment to see the full error message
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
            <div className='flex items-center space-x-4'>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <div className='text-sm text-gray-400'>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <button
                onClick={fetchLockedBets}
                disabled={isLoading}
                className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg flex items-center space-x-2 transition-colors'
              >
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
                Remove this comment to see the full error message
                <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
              </button>
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
              <label className='text-sm text-gray-400'>Sport:</label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <select
                value={selectedSport}
                onChange={e => setSelectedSport(e.target.value)}
                className='px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-cyan-500 focus:outline-none'
              >
                {uniqueSports.map(sport => (
                  // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
              <label className='text-sm text-gray-400'>Min Confidence:</label>
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <input
                type='range'
                min='50'
                max='95'
                value={minConfidence}
                onChange={e => setMinConfidence(Number(e.target.value))}
                className='w-32'
              />
              // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
              Remove this comment to see the full error message
              <span className='text-sm text-cyan-400 w-12'>{minConfidence}%</span>
            </div>
          </div>
        </div>
        {/* Bets Grid */}
        {isLoading ? (
          // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <div className='flex items-center justify-center py-12'>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
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
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <Target className='w-16 h-16 text-gray-600 mx-auto mb-4' />
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <h3 className='text-xl font-semibold text-gray-400 mb-2'>No locked bets found</h3>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <p className='text-gray-500 mb-4'>
              Try adjusting your filters or refresh the data to see available bets.
            </p>
            // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided...
            Remove this comment to see the full error message
            <button
              onClick={fetchLockedBets}
              className='px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors'
            >
              Refresh Data
        )}
      </div>
      {/* PropOllama AI Chat Box */}
      {isChatMinimized ? (
        // @ts-expect-error TS(17004): Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          onToggleMinimize={() => setIsChatMinimized(false)}
      ) : (
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

export default LockedBetsPage;
