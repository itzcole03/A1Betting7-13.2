import React from 'react';
import { BettingFiltersState } from '../../hooks/useUnifiedBettingState';

interface BettingFiltersProps {
  filters: BettingFiltersState;
  setFilters: (filters: BettingFiltersState) => void;
}

export const BettingFilters: React.FC<BettingFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className='bg-white rounded-lg shadow-md p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2'>
        <span>Filters</span>
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Sport</label>
          <select
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            value={filters.sport}
            onChange={e => setFilters({ ...filters, sport: e.target.value })}
          >
            <option value='all'>All Sports</option>
            <option value='MLB'>MLB</option>
            <option value='NBA'>NBA</option>
            <option value='NFL'>NFL</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Market</label>
          <select
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
            value={filters.market}
            onChange={e => setFilters({ ...filters, market: e.target.value })}
          >
            <option value='all'>All Markets</option>
            <option value='Player Hits'>Player Hits</option>
            <option value='Player RBIs'>Player RBIs</option>
            <option value='Team Total'>Team Total</option>
          </select>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Min Edge (%)</label>
          <input
            type='range'
            min='0'
            max='20'
            step='0.5'
            value={filters.minEdge}
            onChange={e => setFilters({ ...filters, minEdge: Number(e.target.value) })}
            className='w-full'
          />
          <span className='text-sm text-gray-500'>{filters.minEdge}%</span>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Min Confidence (%)</label>
          <input
            type='range'
            min='50'
            max='100'
            step='1'
            value={filters.minConfidence}
            onChange={e => setFilters({ ...filters, minConfidence: Number(e.target.value) })}
            className='w-full'
          />
          <span className='text-sm text-gray-500'>{filters.minConfidence}%</span>
        </div>
      </div>
    </div>
  );
};
