/**
 * PropSorting Component
 *
 * Handles sorting controls for props including sort criteria and direction.
 */

import React from 'react';
import { PropSorting as PropSortingType, SortByType } from '../shared/PropOllamaTypes';

interface PropSortingProps {
  sorting: PropSortingType;
  onSortingChange: (sorting: Partial<PropSortingType>) => void;
  className?: string;
}

const sortOptions: { value: SortByType; label: string }[] = [
  { value: 'confidence', label: 'Confidence' },
  { value: 'odds', label: 'Odds' },
  { value: 'impact', label: 'Impact' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'recent', label: 'Recent' },
  { value: 'manual', label: 'Manual' },
  { value: 'analytics_score', label: 'Analytics Score' },
];

const PropSortingComponent: React.FC<PropSortingProps> = ({
  sorting,
  onSortingChange,
  className = '',
}) => {
  console.count('[PropSorting] RENDER');
  return (
    <div
      className={`flex items-center gap-8 p-3 bg-slate-800/50 backdrop-blur-sm border border-slate-600 rounded-lg mb-4 text-white ${className}`}
    >
      <div className='flex items-center gap-2'>
        <label
          htmlFor='sort-by-select'
          className='font-medium text-gray-200 text-sm whitespace-nowrap'
        >
          Sort by:
        </label>
        <select
          id='sort-by-select'
          value={sorting.sortBy}
          onChange={e => onSortingChange({ sortBy: e.target.value as SortByType })}
          className='px-3 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-sm min-w-36 focus:ring-purple-500 focus:border-purple-500'
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value} className='bg-slate-700 text-white'>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='flex items-center gap-2'>
        <label className='font-medium text-gray-200 text-sm'>Order:</label>
        <div className='flex gap-4'>
          <label className='flex items-center gap-1 text-sm text-gray-200 cursor-pointer whitespace-nowrap'>
            <input
              type='radio'
              name='sortOrder'
              value='desc'
              checked={sorting.sortOrder === 'desc'}
              onChange={e => onSortingChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
              className='text-purple-600 focus:ring-purple-500'
            />
            Descending
          </label>
          <label className='flex items-center gap-1 text-sm text-gray-200 cursor-pointer whitespace-nowrap'>
            <input
              type='radio'
              name='sortOrder'
              value='asc'
              checked={sorting.sortOrder === 'asc'}
              onChange={e => onSortingChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
              className='text-purple-600 focus:ring-purple-500'
            />
            Ascending
          </label>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .prop-sorting {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .sorting-group {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export const PropSorting = React.memo(PropSortingComponent);
