import React from 'react';
import LiveGameStats from '../LiveGameStats';

export interface GameStatsPanelProps {
  selectedGameId: string | null;
  onGameSelect: (gameId: string) => void;
  games: Array<{
    game_id?: string;
    home: string;
    away: string;
    time: string;
    event_name: string;
    status?: string;
    venue?: string;
    start_time?: string;
  }>;
  loading: boolean;
}

/**
 * GameStatsPanel Component - Displays game selection and live stats
 */
export const GameStatsPanel: React.FC<GameStatsPanelProps> = ({
  selectedGameId,
  onGameSelect,
  games,
  loading,
}) => {
  return (
    <div className='bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-600 p-4 text-white'>
      <h3 className='text-lg font-semibold mb-4 text-white'>Live Game Stats</h3>

      {/* Game Selection */}
      {games && games.length > 0 && (
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-200 mb-2'>Select Game:</label>
          <select
            value={selectedGameId || ''}
            onChange={e => {
              const gameId = e.target.value;
              if (gameId) {
                onGameSelect(gameId);
              }
            }}
            className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500'
            disabled={loading}
          >
            <option value=''>Select a game...</option>
            {games
              .filter(game => Boolean(game.game_id))
              .map(game => {
                const optionId = game.game_id as string;
                const scheduledTime = game.start_time || game.time;
                return (
                  <option key={optionId} value={optionId} className='bg-slate-700 text-white'>
                    {game.event_name} - {scheduledTime}
                  </option>
                );
              })}
          </select>
        </div>
      )}

      {/* Live Stats Display */}
      {selectedGameId && (
        <div className='live-stats-container'>
          <LiveGameStats gameId={selectedGameId} />
        </div>
      )}

      {/* No Games Message */}
      {!loading && (!games || games.length === 0) && (
        <div className='text-center text-gray-400 py-4'>No games available</div>
      )}

      {/* Loading State */}
      {loading && <div className='text-center text-gray-400 py-4'>Loading games...</div>}
    </div>
  );
};
