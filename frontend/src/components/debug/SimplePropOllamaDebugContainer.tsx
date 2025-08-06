/**
 * Simple PropOllama Debug Container
 * Uses the simple data fetching to isolate the data loading issue
 */

import React from 'react';
import { usePropOllamaState } from '../hooks/usePropOllamaState';
import { useSimplePropOllamaData } from '../hooks/useSimplePropOllamaData';

const SimplePropOllamaDebugContainer: React.FC = () => {
  const [state, actions] = usePropOllamaState();

  // Use the simple data fetching hook
  const { fetchData } = useSimplePropOllamaData({ state, actions });

  console.log('[SimplePropOllamaDebugContainer] Rendering with state:', {
    selectedSport: state.filters.selectedSport,
    isLoading: state.isLoading,
    propsCount: state.projections.length,
    error: state.error,
  });

  return (
    <div className='simple-prop-ollama-debug bg-indigo-900/20 p-6 rounded-lg border border-indigo-500'>
      <h2 className='text-xl font-bold text-indigo-400 mb-4'>
        🧩 Simple PropOllama Debug Container
      </h2>

      {/* Sport Selector */}
      <div className='mb-4'>
        <label className='block text-white font-medium mb-2'>Select Sport:</label>
        <select
          value={state.filters.selectedSport}
          onChange={e => actions.updateFilters({ selectedSport: e.target.value })}
          className='bg-slate-800 text-white border border-slate-600 rounded px-3 py-2'
        >
          <option value='All'>All Sports</option>
          <option value='MLB'>MLB</option>
          <option value='NBA'>NBA</option>
          <option value='NFL'>NFL</option>
          <option value='NHL'>NHL</option>
        </select>
      </div>

      {/* Manual Fetch Button */}
      <button
        onClick={fetchData}
        disabled={state.isLoading}
        className='bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white px-4 py-2 rounded mb-4'
      >
        {state.isLoading ? '🔄 Loading...' : '🔄 Manual Fetch Data'}
      </button>

      {/* Loading State */}
      {state.isLoading && (
        <div className='bg-yellow-900/20 border border-yellow-500 p-3 rounded mb-4'>
          <div className='flex items-center gap-2'>
            <div className='animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full'></div>
            <span className='text-yellow-400'>Loading: {state.loadingMessage}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className='bg-red-900/20 border border-red-500 p-3 rounded mb-4'>
          <h3 className='text-red-400 font-medium'>❌ Error</h3>
          <p className='text-red-300 text-sm'>{state.error}</p>
        </div>
      )}

      {/* Success State */}
      {state.projections.length > 0 && (
        <div className='bg-green-900/20 border border-green-500 p-4 rounded mb-4'>
          <h3 className='text-green-400 font-medium mb-3'>
            ✅ Success - {state.projections.length} Props Loaded
          </h3>

          <div className='grid gap-3 max-h-96 overflow-y-auto'>
            {state.projections.slice(0, 10).map((prop, index) => (
              <div key={prop.id} className='bg-slate-800/50 p-3 rounded'>
                <div className='text-white font-medium'>
                  {prop.player} - {prop.stat}
                </div>
                <div className='text-gray-300 text-sm'>
                  Line: {prop.line} | Confidence: {prop.confidence}% | Sport: {prop.sport}
                </div>
                <div className='text-gray-400 text-xs'>{prop.matchup}</div>
                <div className='text-gray-500 text-xs'>ID: {prop.id}</div>
              </div>
            ))}
            {state.projections.length > 10 && (
              <div className='text-gray-400 text-center text-sm'>
                ... and {state.projections.length - 10} more props
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!state.isLoading && !state.error && state.projections.length === 0 && (
        <div className='bg-gray-900/20 border border-gray-500 p-4 rounded text-center'>
          <p className='text-gray-400'>No props loaded yet. Select a sport or click fetch.</p>
        </div>
      )}

      {/* Debug Info */}
      <details className='mt-4'>
        <summary className='text-gray-300 cursor-pointer hover:text-white'>
          Debug State Info
        </summary>
        <pre className='text-xs text-gray-400 bg-slate-900/50 p-3 rounded mt-2 overflow-auto'>
          {JSON.stringify(
            {
              selectedSport: state.filters.selectedSport,
              isLoading: state.isLoading,
              error: state.error,
              propsCount: state.projections.length,
              loadingMessage: state.loadingMessage,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
};

export default SimplePropOllamaDebugContainer;
