/**
 * PropFilters Component
 *
 * Handles all filtering UI for props including sport selection,
 * prop type, stat type, date selection, and search functionality.
 */

import React from 'react';
import { PropFilters as PropFiltersType } from '../shared/PropOllamaTypes';

interface PropFiltersProps {
  filters: PropFiltersType;
  onFiltersChange: (filters: Partial<PropFiltersType>) => void;
  sports: string[];
  statTypes: string[];
  upcomingGames: Array<{
    game_id?: number;
    home: string;
    away: string;
    time: string;
    event_name: string;
    status?: string;
    venue?: string;
  }>;
  selectedGame: { game_id: number; home: string; away: string } | null;
  onGameSelect: (game: { game_id: number; home: string; away: string } | null) => void;
  className?: string;
}

export const PropFilters: React.FC<PropFiltersProps> = ({
  filters,
  onFiltersChange,
  sports,
  statTypes,
  upcomingGames,
  selectedGame,
  onGameSelect,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-wrap gap-4 p-4 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-600 mb-4 space-y-4 ${className}`}
    >
      {/* Sport Selection */}
      <div className='filter-group'>
        <label htmlFor='sport-select' className='block text-sm font-medium text-gray-200 mb-2'>
          Sport:
        </label>
        <select
          id='sport-select'
          value={filters.selectedSport}
          onChange={e => onFiltersChange({ selectedSport: e.target.value })}
          className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500'
        >
          {sports.map(sport => (
            <option key={sport} value={sport} className='bg-slate-700 text-white'>
              {sport}
            </option>
          ))}
        </select>
      </div>

      {/* Prop Type Selection */}
      <div className='filter-group'>
        <label className='block text-sm font-medium text-gray-200 mb-2'>Prop Type:</label>
        <div className='flex space-x-4'>
          <label className='flex items-center text-gray-200'>
            <input
              type='radio'
              name='propType'
              value='player'
              checked={filters.propType === 'player'}
              onChange={e => onFiltersChange({ propType: e.target.value as 'player' | 'team' })}
              className='mr-2 text-purple-600 focus:ring-purple-500'
            />
            Player
          </label>
          <label className='flex items-center text-gray-200'>
            <input
              type='radio'
              name='propType'
              value='team'
              checked={filters.propType === 'team'}
              onChange={e => onFiltersChange({ propType: e.target.value as 'player' | 'team' })}
              className='mr-2 text-purple-600 focus:ring-purple-500'
            />
            Team
          </label>
        </div>
      </div>

      {/* Stat Type Selection */}
      <div className='filter-group'>
        <label htmlFor='stat-type-select' className='block text-sm font-medium text-gray-200 mb-2'>
          Stat Type:
        </label>
        <select
          id='stat-type-select'
          value={filters.selectedStatType}
          onChange={e => onFiltersChange({ selectedStatType: e.target.value })}
          className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500'
        >
          {statTypes.map(statType => (
            <option key={statType} value={statType} className='bg-slate-700 text-white'>
              {statType}
            </option>
          ))}
        </select>
      </div>

      {/* Date Selection */}
      <div className='filter-group'>
        <label htmlFor='date-select' className='block text-sm font-medium text-gray-200 mb-2'>
          Date:
        </label>
        <input
          id='date-select'
          type='date'
          value={filters.selectedDate}
          onChange={e => onFiltersChange({ selectedDate: e.target.value })}
          className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500'
        />
      </div>

      {/* Search Input */}
      <div className='filter-group'>
        <label htmlFor='search-input' className='block text-sm font-medium text-gray-200 mb-2'>
          Search:
        </label>
        <input
          id='search-input'
          type='text'
          placeholder='Search players, teams, or stats...'
          value={filters.searchTerm}
          onChange={e => onFiltersChange({ searchTerm: e.target.value })}
          className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
        />
      </div>

      {/* Upcoming Games Toggle */}
      <div className='filter-group'>
        <label className='flex items-center text-gray-200'>
          <input
            type='checkbox'
            checked={filters.showUpcomingGames}
            onChange={e => onFiltersChange({ showUpcomingGames: e.target.checked })}
            className='mr-2 text-purple-600 focus:ring-purple-500'
          />
          Show Upcoming Games
        </label>
      </div>

      {/* Game Selection (shown when upcoming games is enabled) */}
      {filters.showUpcomingGames && upcomingGames.length > 0 && (
        <div className='filter-group'>
          <label htmlFor='game-select' className='block text-sm font-medium text-gray-200 mb-2'>
            Select Game:
          </label>
          <select
            id='game-select'
            value={selectedGame?.game_id || ''}
            onChange={e => {
              const gameId = e.target.value;
              if (gameId) {
                const game = upcomingGames.find(g => g.game_id?.toString() === gameId);
                if (game) {
                  onGameSelect({
                    game_id: game.game_id!,
                    home: game.home,
                    away: game.away,
                  });
                }
              } else {
                onGameSelect(null);
              }
            }}
            className='w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500'
          >
            <option value=''>All Games</option>
            {upcomingGames.map(game => (
              <option key={game.game_id} value={game.game_id} className='text-white bg-slate-700'>
                {game.event_name} - {new Date(game.time).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <style>{`
        .filter-group {
          display: flex;
          flex-direction: column;
          min-width: 150px;
        }

        .radio-group {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .prop-filters {
            flex-direction: column;
          }

          .filter-group {
            min-width: unset;
          }

          .radio-group {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
